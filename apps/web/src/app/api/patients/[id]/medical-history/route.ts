import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { medicalHistories } from '@/db/schema';
import { requireAuth, requireOwnedPatient } from '@/lib/auth';
import { json, route } from '@/lib/http';
import { medicalHistorySchema } from '@/lib/validation';

type Ctx = { params: Promise<{ id: string }> };

/**
 * THE PHI ENDPOINT. A patient reading their own record is not audited; staff
 * reads are, and they go through the dashboard's own path.
 */
export const GET = route(async (_req: Request, ctx: Ctx) => {
  const user = await requireAuth();
  const patient = await requireOwnedPatient(user, (await ctx.params).id);

  const [history] = await db
    .select()
    .from(medicalHistories)
    .where(eq(medicalHistories.patientId, patient.id));

  return json({ medicalHistory: history ?? null });
});

/** Onboarding step 2, and later edits from the profile screen. Upsert either way. */
export const PUT = route(async (req: Request, ctx: Ctx) => {
  const user = await requireAuth();
  const patient = await requireOwnedPatient(user, (await ctx.params).id);
  const body = medicalHistorySchema.parse(await req.json());

  const values = {
    allergies: body.allergies,
    medications: body.medications,
    conditions: body.conditions,
    isSmoker: body.isSmoker,
    isPregnant: body.isPregnant,
    anxietyLevel: body.anxietyLevel ?? null,
    notes: body.notes ?? null,
    updatedAt: new Date(),
  };

  const [saved] = await db
    .insert(medicalHistories)
    .values({ patientId: patient.id, ...values })
    .onConflictDoUpdate({ target: medicalHistories.patientId, set: values })
    .returning();

  return json({ medicalHistory: saved });
});
