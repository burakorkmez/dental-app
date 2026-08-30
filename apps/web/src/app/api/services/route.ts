import { asc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { services } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { json, route } from '@/lib/http';

/** Drives the booking "reason" picker and onboarding step 3. */
export const GET = route(async () => {
  await requireAuth();
  const rows = await db
    .select()
    .from(services)
    .where(eq(services.isActive, true))
    .orderBy(asc(services.name));
  return json({ services: rows });
});
