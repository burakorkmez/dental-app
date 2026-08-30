import { asc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { patients } from '@/db/schema';
import { requireAuth, selfPatient } from '@/lib/auth';
import { badRequest, json, route } from '@/lib/http';
import { createPatientSchema } from '@/lib/validation';

/** The account's whole family (PLAN.md phase 10). */
export const GET = route(async () => {
  const user = await requireAuth();
  const rows = await db
    .select()
    .from(patients)
    .where(eq(patients.accountUserId, user.id))
    .orderBy(asc(patients.isSelf), asc(patients.createdAt));
  return json({ patients: rows });
});

/**
 * Onboarding step 1 (`isSelf: true`) and adding a dependent (`isSelf: false`).
 * The DB's partial unique index is what guarantees one self per account.
 */
export const POST = route(async (req: Request) => {
  const user = await requireAuth();
  const body = createPatientSchema.parse(await req.json());

  if (body.isSelf && (await selfPatient(user))) {
    throw badRequest('This account already has a profile');
  }

  const [created] = await db
    .insert(patients)
    .values({
      accountUserId: user.id,
      isSelf: body.isSelf,
      firstName: body.firstName,
      lastName: body.lastName,
      dateOfBirth: body.dateOfBirth ?? null,
      phone: body.phone ?? null,
      gender: body.gender ?? null,
      primaryConcern: body.primaryConcern ?? null,
      referralSource: body.referralSource ?? null,
    })
    .returning();

  return json({ patient: created }, 201);
});
