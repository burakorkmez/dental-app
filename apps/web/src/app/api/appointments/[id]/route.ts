import { and, eq, inArray } from 'drizzle-orm';

import { db } from '@/db';
import { appointments, dentists, patients, services, visitNotes } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { badRequest, conflict, forbidden, isExclusionViolation, json, notFound, route } from '@/lib/http';
import { canCancel } from '@/lib/scheduling';
import { serialize } from '@/lib/appointments';
import { assertSlotBookable } from '@/lib/booking';
import { patchAppointmentSchema } from '@/lib/validation';

type Ctx = { params: Promise<{ id: string }> };

/** Loads an appointment only if it belongs to one of the caller's patients. */
async function loadOwned(userId: string, appointmentId: string) {
  const family = await db
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.accountUserId, userId));
  if (family.length === 0) throw notFound('Appointment not found');

  const [row] = await db
    .select({
      appointment: appointments,
      patient: { id: patients.id, firstName: patients.firstName, lastName: patients.lastName },
      dentist: {
        id: dentists.id,
        displayName: dentists.displayName,
        title: dentists.title,
        specialty: dentists.specialty,
        photoUrl: dentists.photoUrl,
      },
      service: {
        id: services.id,
        key: services.key,
        name: services.name,
        durationMinutes: services.durationMinutes,
        isTeleconsult: services.isTeleconsult,
      },
    })
    .from(appointments)
    .innerJoin(patients, eq(patients.id, appointments.patientId))
    .innerJoin(dentists, eq(dentists.id, appointments.dentistId))
    .innerJoin(services, eq(services.id, appointments.serviceId))
    .where(
      and(
        eq(appointments.id, appointmentId),
        inArray(appointments.patientId, family.map((p) => p.id))
      )
    );

  if (!row) throw notFound('Appointment not found');
  return row;
}

export const GET = route(async (_req: Request, ctx: Ctx) => {
  const user = await requireAuth();
  const row = await loadOwned(user.id, (await ctx.params).id);

  const notes = await db
    .select()
    .from(visitNotes)
    .where(eq(visitNotes.appointmentId, row.appointment.id));

  return json({
    appointment: {
      ...serialize(row),
      notes: notes.map((n) => ({ id: n.id, body: n.body, createdAt: n.createdAt.toISOString() })),
    },
  });
});

/**
 * Cancel or reschedule. The 24-hour rule is enforced HERE — the client only
 * hides the button, which is not a control.
 */
export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const user = await requireAuth();
  const row = await loadOwned(user.id, (await ctx.params).id);
  const body = patchAppointmentSchema.parse(await req.json());

  if (row.appointment.status !== 'booked') {
    throw badRequest(`This appointment is already ${row.appointment.status}`);
  }
  if (!canCancel(row.appointment.startsAt, new Date())) {
    throw forbidden('Changes close 24 hours before an appointment. Please call the clinic.');
  }

  if (body.action === 'cancel') {
    const [updated] = await db
      .update(appointments)
      .set({ status: 'cancelled', cancelledAt: new Date(), cancelledBy: user.id })
      .where(eq(appointments.id, row.appointment.id))
      .returning();
    return json({ appointment: serialize({ ...row, appointment: updated }) });
  }

  const startsAt = new Date(body.startsAt);
  const endsAt = new Date(startsAt.getTime() + row.service.durationMinutes * 60_000);
  const dentistId = body.dentistId ?? row.appointment.dentistId;

  // Same guard as booking. Excluding this appointment stops it blocking itself.
  await assertSlotBookable({
    dentistId,
    serviceId: row.service.id,
    durationMinutes: row.service.durationMinutes,
    startsAt,
    excludeAppointmentId: row.appointment.id,
  });

  try {
    const [updated] = await db
      .update(appointments)
      .set({ startsAt, endsAt, dentistId, reminder24hSentAt: null, reminder1hSentAt: null })
      .where(eq(appointments.id, row.appointment.id))
      .returning();

    const [dentist] = await db.select().from(dentists).where(eq(dentists.id, dentistId));
    return json({
      appointment: serialize({
        ...row,
        appointment: updated,
        dentist: {
          id: dentist.id,
          displayName: dentist.displayName,
          title: dentist.title,
          specialty: dentist.specialty,
          photoUrl: dentist.photoUrl,
        },
      }),
    });
  } catch (err) {
    if (isExclusionViolation(err)) {
      throw conflict('That time was just taken. Please pick another.', 'slot_taken');
    }
    throw err;
  }
});
