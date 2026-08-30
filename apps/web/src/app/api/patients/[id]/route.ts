import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { patients } from '@/db/schema';
import { requireAuth, requireOwnedPatient } from '@/lib/auth';
import { badRequest, json, route } from '@/lib/http';
import { patientProfileSchema } from '@/lib/validation';

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req: Request, ctx: Ctx) => {
  const user = await requireAuth();
  const patient = await requireOwnedPatient(user, (await ctx.params).id);
  return json({ patient });
});

/** Profile screen edits. */
export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const user = await requireAuth();
  const patient = await requireOwnedPatient(user, (await ctx.params).id);
  const body = patientProfileSchema.partial().parse(await req.json());

  const [updated] = await db
    .update(patients)
    .set(body)
    .where(eq(patients.id, patient.id))
    .returning();

  return json({ patient: updated });
});

/** Removing a dependent. The account's own profile is not deletable here. */
export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const user = await requireAuth();
  const patient = await requireOwnedPatient(user, (await ctx.params).id);
  if (patient.isSelf) throw badRequest('Delete the account instead of your own profile');

  await db
    .delete(patients)
    .where(and(eq(patients.id, patient.id), eq(patients.accountUserId, user.id)));

  return json({ ok: true });
});
