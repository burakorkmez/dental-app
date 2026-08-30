import { auth, currentUser } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { patients, users } from '@/db/schema';

import { forbidden, notFound, unauthorized } from './http';

export type Role = 'patient' | 'staff' | 'dentist';
export type AppUser = typeof users.$inferSelect;

/**
 * The Clerk webhook is eventually consistent, so a brand-new user can reach the
 * API before `user.created` lands. Upsert from the session instead of waiting —
 * the webhook stays the backstop for later updates and deletes.
 */
async function ensureUser(clerkId: string): Promise<AppUser> {
  const existing = await db.select().from(users).where(eq(users.clerkId, clerkId));
  if (existing[0]) return existing[0];

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? null;
  const role = roleFromMetadata(clerkUser?.publicMetadata);

  const [created] = await db
    .insert(users)
    .values({ clerkId, email, role })
    .onConflictDoUpdate({ target: users.clerkId, set: { email } })
    .returning();
  return created;
}

export function roleFromMetadata(metadata: unknown): Role {
  const role = (metadata as { role?: unknown } | null | undefined)?.role;
  return role === 'staff' || role === 'dentist' ? role : 'patient';
}

/** Every patient-facing route starts here. Accepts the Expo Bearer token via clerkMiddleware. */
export async function requireAuth(): Promise<AppUser> {
  const { userId } = await auth();
  if (!userId) throw unauthorized();
  return ensureUser(userId);
}

/** Staff dashboard and staff-only routes. Clerk publicMetadata is the source of truth. */
export async function requireStaff(): Promise<AppUser> {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw unauthorized();

  const user = await ensureUser(userId);
  const claimRole = roleFromMetadata(
    (sessionClaims as { publicMetadata?: unknown } | null)?.publicMetadata
  );

  // Trust whichever side says "staff" — the DB row may lag a Clerk change.
  const isStaff =
    claimRole === 'staff' ||
    claimRole === 'dentist' ||
    user.role === 'staff' ||
    user.role === 'dentist';
  if (!isStaff) throw forbidden('Staff access only');

  // Keep the mirrored row honest for the dashboard's direct Drizzle reads.
  if (claimRole !== 'patient' && claimRole !== user.role) {
    await db.update(users).set({ role: claimRole }).where(eq(users.id, user.id));
    return { ...user, role: claimRole };
  }
  return user;
}

/**
 * Resolves a patient the caller is actually allowed to touch. Every route that
 * takes a patientId goes through here — that is the whole ownership check, so
 * it is never re-implemented per route.
 */
export async function requireOwnedPatient(user: AppUser, patientId: string) {
  const [patient] = await db
    .select()
    .from(patients)
    .where(and(eq(patients.id, patientId), eq(patients.accountUserId, user.id)));
  if (!patient) throw notFound('Patient not found');
  return patient;
}

/** The account holder's own patient row (`is_self`), created during onboarding. */
export async function selfPatient(user: AppUser) {
  const [patient] = await db
    .select()
    .from(patients)
    .where(and(eq(patients.accountUserId, user.id), eq(patients.isSelf, true)));
  return patient ?? null;
}
