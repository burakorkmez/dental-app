import { clerkClient } from '@clerk/nextjs/server';
import { asc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { patients, users } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { json, route } from '@/lib/http';
import { attachmentFolder, imagekit, photoFolder } from '@/lib/imagekit';
import { clinicChannelId, streamServer, streamUserId } from '@/lib/stream';

/**
 * The mobile app's first call. Tells it who it is and whether onboarding is
 * done, so the client never has to guess or keep its own flag.
 */
export const GET = route(async () => {
  const user = await requireAuth();

  const family = await db
    .select()
    .from(patients)
    .where(eq(patients.accountUserId, user.id))
    .orderBy(asc(patients.isSelf), asc(patients.createdAt));

  const self = family.find((p) => p.isSelf) ?? null;

  return json({
    userId: user.id,
    email: user.email,
    role: user.role,
    hasOnboarded: Boolean(self),
    self,
    // "Who is this for?" in the booking flow renders straight off this.
    family: family.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      isSelf: p.isSelf,
    })),
  });
});

/**
 * Delete the account. PLAN.md § HIPAA posture asks for a flow that "removes
 * patient rows and revokes Stream/ImageKit assets" — this is it, and it is the
 * only place that does it, so nothing can delete half an account.
 *
 * Order is deliberate and not interchangeable:
 *
 *   1. the vendors, while we can still read the ids we need to address them
 *   2. our own rows, which cascade to every record that carries PHI
 *   3. Clerk, last
 *
 * Clerk goes last because it is the identity: while it exists, the patient is
 * still signed in and can retry a partial failure. Deleting it first and then
 * failing would strand PHI with nobody able to authenticate as its owner —
 * the one outcome worth designing against.
 *
 * Vendor cleanup is best-effort by the same logic. A file left at ImageKit is
 * worth an error line; refusing to delete the medical history because of it is
 * not.
 */
export const DELETE = route(async () => {
  const user = await requireAuth();

  const family = await db
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.accountUserId, user.id));

  // 1a. Photos: two private folders per account (assistant uploads, and files
  //     attached to a booking). Both are keyed by user id, so this is two calls.
  await Promise.all(
    [photoFolder(user.id), attachmentFolder(user.id)].map((folder) =>
      imagekit()
        .deleteFolder(folder)
        // 404 is the normal case for a patient who never uploaded anything.
        .catch((err: unknown) =>
          console.error('[account] imagekit cleanup failed', err instanceof Error ? err.message : err)
        )
    )
  );

  // 1b. Stream holds the message bodies and the call records; our database
  //     holds neither. Delete the conversations first, then the identity —
  //     `deleteUser` alone leaves a channel the clinic can still read.
  try {
    const stream = streamServer();
    if (family.length) {
      await stream.deleteChannels(
        family.map((p) => `messaging:${clinicChannelId(p.id)}`),
        { hard_delete: true }
      );
    }
    await stream.deleteUser(streamUserId(user), {
      hard_delete: true,
      mark_messages_deleted: true,
    });
  } catch (err) {
    console.error('[account] stream cleanup failed', err instanceof Error ? err.message : err);
  }

  // 2. One delete. `users` is the root of every cascade in the schema, so this
  //    takes patients, medical histories, appointments, attachment rows, visit
  //    notes and the assistant thread with it.
  await db.delete(users).where(eq(users.id, user.id));

  // 3. Identity last. The `user.deleted` webhook will fire and try the same
  //    row delete — it is a no-op by then, which is why that handler is safe to
  //    leave alone.
  await (await clerkClient()).users.deleteUser(user.clerkId);

  return json({ ok: true });
});
