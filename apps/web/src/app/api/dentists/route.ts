import { and, asc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { dentistServices, dentists } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { json, route } from '@/lib/http';

/** `?serviceId=` narrows to the dentists who actually offer that service. */
export const GET = route(async (req: Request) => {
  await requireAuth();
  const serviceId = new URL(req.url).searchParams.get('serviceId');

  if (!serviceId) {
    const rows = await db
      .select()
      .from(dentists)
      .where(eq(dentists.isActive, true))
      .orderBy(asc(dentists.displayName));
    return json({ dentists: rows });
  }

  const rows = await db
    .select({
      id: dentists.id,
      displayName: dentists.displayName,
      title: dentists.title,
      specialty: dentists.specialty,
      bio: dentists.bio,
      photoUrl: dentists.photoUrl,
      isActive: dentists.isActive,
    })
    .from(dentists)
    .innerJoin(dentistServices, eq(dentistServices.dentistId, dentists.id))
    .where(and(eq(dentists.isActive, true), eq(dentistServices.serviceId, serviceId)))
    .orderBy(asc(dentists.displayName));

  return json({ dentists: rows });
});
