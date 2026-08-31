import { requireAuth } from '@/lib/auth';
import { json, route } from '@/lib/http';
import { mintToken, STREAM_API_KEY, streamUserId, syncStreamUser } from '@/lib/stream';

/**
 * PLAN.md phase 6/7 — the only way the app gets a Stream credential.
 *
 * The Stream user id comes from the Clerk session, never from the request
 * body: if the client could name its own user id, any signed-in patient could
 * mint a token for a staff member and read every conversation in the clinic.
 * The app re-POSTs here when a token nears expiry, so this doubles as the
 * refresh endpoint and the auth check is never skipped.
 */
export const POST = route(async () => {
  const user = await requireAuth();
  const name = await syncStreamUser(user);

  return json({
    apiKey: STREAM_API_KEY,
    userId: streamUserId(user),
    name,
    role: user.role,
    token: mintToken(user),
  });
});
