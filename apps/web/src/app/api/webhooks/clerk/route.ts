import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { roleFromMetadata } from '@/lib/auth';

/**
 * Mirrors Clerk identity into `users`. This is the backstop, not the critical
 * path — `requireAuth()` upserts on first request, because webhook delivery is
 * eventually consistent and a new patient must not have to wait for it.
 */
export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error('[clerk webhook] verification failed', err instanceof Error ? err.message : err);
    return new Response('Verification failed', { status: 400 });
  }

  if (evt.type === 'user.created' || evt.type === 'user.updated') {
    const { id, email_addresses, primary_email_address_id, public_metadata } = evt.data;
    const email =
      email_addresses.find((e) => e.id === primary_email_address_id)?.email_address ??
      email_addresses[0]?.email_address ??
      null;

    await db
      .insert(users)
      .values({ clerkId: id, email, role: roleFromMetadata(public_metadata) })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: { email, role: roleFromMetadata(public_metadata) },
      });
  }

  if (evt.type === 'user.deleted' && evt.data.id) {
    // Cascades to patients, medical histories and appointments — the
    // delete-account path PLAN.md asks for.
    await db.delete(users).where(eq(users.clerkId, evt.data.id));
  }

  return new Response('OK', { status: 200 });
}
