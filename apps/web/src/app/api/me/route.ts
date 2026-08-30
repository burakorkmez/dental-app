import { asc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { patients } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { json, route } from '@/lib/http';

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
