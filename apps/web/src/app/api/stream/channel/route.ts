import { requireAuth } from '@/lib/auth';
import { json, route } from '@/lib/http';
import { ensureClinicChannel, isStaff } from '@/lib/stream';

/**
 * The patient's one conversation with the clinic (PLAN.md A9), created on
 * first open and returned with its member ids so the app can also ring the
 * clinic without a second round trip.
 *
 * Staff get `null`: they don't have a single channel, they have the shared
 * inbox, which the Chat SDK queries directly by membership.
 */
export const GET = route(async () => {
  const user = await requireAuth();
  if (isStaff(user.role)) return json({ channelId: null, memberIds: [] });
  return json(await ensureClinicChannel(user));
});
