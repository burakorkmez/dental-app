import { and, asc, desc, eq, gte, inArray, lt } from 'drizzle-orm';

import { db } from '@/db';
import { appointments, dentists, patients, services, visitNotes } from '@/db/schema';
import { requireAuth, requireOwnedPatient } from '@/lib/auth';
import { assertSlotBookable } from '@/lib/booking';
import { conflict, json, notFound, route, isExclusionViolation } from '@/lib/http';
import { serialize } from '@/lib/appointments';
import { createAppointmentSchema } from '@/lib/validation';

const selection = {
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
    name: services.name,
    durationMinutes: services.durationMinutes,
    isTeleconsult: services.isTeleconsult,
  },
};

/** GET /api/appointments?scope=upcoming|past — across the whole family. */
export const GET = route(async (req: Request) => {
  const user = await requireAuth();
  const scope = new URL(req.url).searchParams.get('scope') === 'past' ? 'past' : 'upcoming';

  const family = await db
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.accountUserId, user.id));
  if (family.length === 0) return json({ appointments: [] });

  const familyIds = family.map((p) => p.id);
  const now = new Date();

  const rows = await db
    .select(selection)
    .from(appointments)
    .innerJoin(patients, eq(patients.id, appointments.patientId))
    .innerJoin(dentists, eq(dentists.id, appointments.dentistId))
    .innerJoin(services, eq(services.id, appointments.serviceId))
    .where(
      and(
        inArray(appointments.patientId, familyIds),
        scope === 'upcoming'
          ? and(gte(appointments.startsAt, now), eq(appointments.status, 'booked'))
          : lt(appointments.startsAt, now)
      )
    )
    .orderBy(scope === 'upcoming' ? asc(appointments.startsAt) : desc(appointments.startsAt))
    .limit(100);

  // Post-op instructions ride along with past visits — that is the whole
  // point of the visit history screen.
  const notes =
    scope === 'past' && rows.length
      ? await db
          .select()
          .from(visitNotes)
          .where(inArray(visitNotes.appointmentId, rows.map((r) => r.appointment.id)))
      : [];

  return json({
    appointments: rows.map((r) => ({
      ...serialize(r),
      notes: notes
        .filter((n) => n.appointmentId === r.appointment.id)
        .map((n) => ({ id: n.id, body: n.body, createdAt: n.createdAt.toISOString() })),
    })),
  });
});

/**
 * The aha moment. The server computes ends_at from the service duration and
 * lets the Postgres exclusion constraint decide the race — a violation becomes
 * a clean 409 the app shows as "just taken, pick another".
 */
export const POST = route(async (req: Request) => {
  const user = await requireAuth();
  const body = createAppointmentSchema.parse(await req.json());

  const patient = await requireOwnedPatient(user, body.patientId);

  const [service] = await db.select().from(services).where(eq(services.id, body.serviceId));
  if (!service || !service.isActive) throw notFound('Service not found');

  const [dentist] = await db
    .select()
    .from(dentists)
    .where(and(eq(dentists.id, body.dentistId), eq(dentists.isActive, true)));
  if (!dentist) throw notFound('Dentist not found');

  const startsAt = new Date(body.startsAt);
  const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);

  // The client never gets to invent a time: this re-runs the same engine that
  // produced the slot list and rejects anything it would not have offered.
  await assertSlotBookable({
    dentistId: dentist.id,
    serviceId: service.id,
    durationMinutes: service.durationMinutes,
    startsAt,
  });

  try {
    const [created] = await db
      .insert(appointments)
      .values({
        patientId: patient.id,
        dentistId: dentist.id,
        serviceId: service.id,
        startsAt,
        endsAt,
      })
      .returning();

    // Teleconsult call id is derived, never client-supplied (PLAN.md phase 6).
    if (service.isTeleconsult) {
      await db
        .update(appointments)
        .set({ streamCallId: `appointment-${created.id}` })
        .where(eq(appointments.id, created.id));
      created.streamCallId = `appointment-${created.id}`;
    }

    return json(
      {
        appointment: serialize({
          appointment: created,
          patient: { id: patient.id, firstName: patient.firstName, lastName: patient.lastName },
          dentist: {
            id: dentist.id,
            displayName: dentist.displayName,
            title: dentist.title,
            specialty: dentist.specialty,
            photoUrl: dentist.photoUrl,
          },
          service,
        }),
      },
      201
    );
  } catch (err) {
    if (isExclusionViolation(err)) {
      throw conflict('That time was just taken. Please pick another.', 'slot_taken');
    }
    throw err;
  }
});
