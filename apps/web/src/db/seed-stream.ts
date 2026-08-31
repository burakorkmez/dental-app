/**
 * Seeds Stream so the app has something to show the moment you open it:
 *  - creates every patient's clinic conversation (PLAN.md A9)
 *  - drops a short staff <-> patient exchange into each
 *
 *   npm run db:seed:stream -w apps/web
 *
 * Idempotent: a conversation that already has messages is left untouched, so
 * re-running after adding a staff member only fixes up membership.
 *
 * Postgres rows are NOT touched here — `db:seed` owns those. This only writes
 * to Stream, which is the one thing `db:seed` cannot do.
 */
import { eq, inArray } from 'drizzle-orm';

import { db } from './index';
import { patients, users } from './schema';
import { ensureClinicChannel, streamServer, streamUserId, STREAM_API_KEY } from '../lib/stream';

/** Generic on purpose: education and logistics, never advice or a diagnosis. */
const SCRIPT = [
  { from: 'staff', text: "Hi! This is the DentaCare front desk. Message us here any time and we'll get back to you the same day." },
  { from: 'patient', text: 'Great, thanks! Is it alright to book a video call if I just have a quick question?' },
  { from: 'staff', text: "Absolutely — book the Video Consultation service, or tap the video button up top and we'll pick up if someone's free." },
] as const;

async function main() {
  if (!STREAM_API_KEY || !process.env.STREAM_API_SECRET) {
    throw new Error(
      'Set NEXT_PUBLIC_STREAM_API_KEY and STREAM_API_SECRET in apps/web/.env first — see README.'
    );
  }

  const staff = await db.select().from(users).where(inArray(users.role, ['staff', 'dentist']));
  if (staff.length === 0) {
    throw new Error(
      'No staff or dentist user exists. Set {"role":"staff"} in a Clerk user\'s publicMetadata, sign in once, then re-run.'
    );
  }
  console.log(`Clinic side: ${staff.map((s) => s.email ?? s.id).join(', ')}`);

  const patientUsers = await db.select().from(users).where(eq(users.role, 'patient'));
  const server = streamServer();
  let seeded = 0;
  let skipped = 0;

  for (const user of patientUsers) {
    const [self] = await db.select().from(patients).where(eq(patients.accountUserId, user.id));
    if (!self) continue; // never finished onboarding — no conversation to make

    const { channelId } = await ensureClinicChannel(user);
    const channel = server.channel('messaging', channelId);
    const state = await channel.query({ messages: { limit: 1 } });

    if ((state.messages?.length ?? 0) > 0) {
      skipped += 1;
      continue;
    }

    for (const line of SCRIPT) {
      await channel.sendMessage({
        text: line.text,
        user_id: line.from === 'staff' ? streamUserId(staff[0]) : streamUserId(user),
      });
    }
    seeded += 1;
    console.log(`  seeded ${channelId} (${self.firstName})`);
  }

  console.log(`\nDone. ${seeded} conversation(s) seeded, ${skipped} already had messages.`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
);
