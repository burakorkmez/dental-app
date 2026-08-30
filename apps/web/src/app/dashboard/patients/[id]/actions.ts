'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/db';
import { appointments, patients, visitNotes } from '@/db/schema';
import { audit } from '@/lib/audit';
import { requireStaff } from '@/lib/auth';
import { visitNoteSchema } from '@/lib/validation';

/** Post-op instructions. Patient-readable, so they land in the mobile visit history. */
export async function addVisitNote(_prev: unknown, formData: FormData) {
  const staff = await requireStaff();

  const parsed = visitNoteSchema.safeParse({
    appointmentId: formData.get('appointmentId'),
    body: formData.get('body'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid note' };
  }

  const [appointment] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, parsed.data.appointmentId));
  if (!appointment) return { error: 'Appointment not found' };

  await db.insert(visitNotes).values({
    appointmentId: appointment.id,
    body: parsed.data.body,
    createdBy: staff.id,
  });
  await audit(staff.id, 'create', 'visit_notes', appointment.id);

  revalidatePath(`/dashboard/patients/${appointment.patientId}`);
  return { ok: true as const };
}

/** Marking a visit complete is what moves it into the patient's history. */
export async function completeAppointment(appointmentId: string) {
  const staff = await requireStaff();

  const [updated] = await db
    .update(appointments)
    .set({ status: 'completed' })
    .where(eq(appointments.id, appointmentId))
    .returning();
  if (!updated) return { error: 'Appointment not found' };

  await db
    .update(patients)
    .set({ lastVisitAt: updated.startsAt })
    .where(eq(patients.id, updated.patientId));
  await audit(staff.id, 'update', 'appointments', appointmentId);

  revalidatePath(`/dashboard/patients/${updated.patientId}`);
  revalidatePath('/dashboard');
  return { ok: true as const };
}
