import { inArray } from 'drizzle-orm';
import { StreamChat } from 'stream-chat';

import { db } from '@/db';
import { dentists, users } from '@/db/schema';

import type { AppUser } from './auth';
import { selfPatient } from './auth';
import { badRequest } from './http';

/**
 * Stream owns call and message content only (PLAN.md § Third-party
 * responsibilities). Everything here runs server-side: the API secret never
 * leaves this process, and the Stream user id is always taken from the Clerk
 * session via `requireAuth()` — never from anything the client sent. A
 * client-supplied user id on a token endpoint is an impersonation bug.
 *
 * Note this is the one place a patient name deliberately crosses a vendor
 * boundary: staff need a readable inbox. Stream is on the BAA list (R1), which
 * is what makes that acceptable — unlike Sentry, logs, or push bodies, where
 * the non-negotiable "no PHI" rule still applies with no exceptions.
 */

export const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_API_SECRET;

/** Tokens are short-lived; the app re-hits /api/stream/token to refresh. */
const TOKEN_TTL_SECONDS = 60 * 60 * 4;

let cached: StreamChat | null = null;

export function streamServer(): StreamChat {
  if (!STREAM_API_KEY || !STREAM_API_SECRET) {
    throw badRequest('Stream is not configured');
  }
  cached ??= StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);
  return cached;
}

/**
 * One Stream identity per account, keyed by our own `users.id`. Chat and Video
 * share it — a single token authenticates both products on the same API key.
 */
export function streamUserId(user: AppUser): string {
  return user.id;
}

export function mintToken(user: AppUser): string {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  return streamServer().createToken(streamUserId(user), exp);
}

/** PLAN.md A9: one channel per patient, id derived — no channel table. */
export function clinicChannelId(patientId: string): string {
  return `patient-${patientId}`;
}

export const isStaff = (role: AppUser['role']) => role === 'staff' || role === 'dentist';

/** What a Stream user looks like to the other side of a conversation. */
async function displayName(user: AppUser): Promise<string> {
  if (isStaff(user.role)) {
    const [dentist] = await db.select().from(dentists).where(inArray(dentists.userId, [user.id]));
    return dentist?.displayName ?? 'Clinic Team';
  }
  const self = await selfPatient(user);
  return self ? `${self.firstName} ${self.lastName}` : 'Patient';
}

/** Stream rejects members that don't exist yet, so every id is upserted first. */
async function upsertParticipants(accountUsers: AppUser[]) {
  const named = await Promise.all(
    accountUsers.map(async (u) => ({
      id: streamUserId(u),
      name: await displayName(u),
      // Read by the mobile app to label a caller as clinic vs patient.
      staff: isStaff(u.role),
    }))
  );
  await streamServer().upsertUsers(named);
}

async function staffUsers(): Promise<AppUser[]> {
  return db.select().from(users).where(inArray(users.role, ['staff', 'dentist']));
}

/** Sync the caller's Stream identity. Called on every token mint. */
export async function syncStreamUser(user: AppUser): Promise<string> {
  const name = await displayName(user);
  await upsertParticipants([user]);
  return name;
}

/**
 * The patient's single conversation with the clinic. Idempotent: creates the
 * channel on first call, and on later calls adds any staff who joined since.
 * Returns the member ids so the app can ring the clinic without another round
 * trip.
 */
export async function ensureClinicChannel(user: AppUser) {
  const self = await selfPatient(user);
  if (!self) throw badRequest('Finish onboarding before messaging the clinic');

  const staff = await staffUsers();
  await upsertParticipants([user, ...staff]);

  const memberIds = [streamUserId(user), ...staff.map(streamUserId)];
  const channel = streamServer().channel('messaging', clinicChannelId(self.id), {
    members: memberIds,
    created_by_id: streamUserId(user),
    // Staff see a shared inbox, so the channel has to name the patient.
    name: `${self.firstName} ${self.lastName}`,
  });
  await channel.create();

  // Staff hired after the channel was created are not members yet.
  const existing = new Set(Object.keys(channel.state.members));
  const missing = memberIds.filter((id) => !existing.has(id));
  if (missing.length) await channel.addMembers(missing);

  return { channelId: channel.id!, memberIds };
}
