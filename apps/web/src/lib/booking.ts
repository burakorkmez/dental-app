import { and, eq, gte, inArray, lte, ne } from 'drizzle-orm';

import { db } from '@/db';
import { appointments, dentistServices, timeOff, workingHours } from '@/db/schema';

import { badRequest, conflict } from './http';
import { classifySlot, type BusyInterval, type WorkingHour } from './scheduling';
import { clinicDayOf, clinicInstant, type CalendarDay } from './time';

/**
 * Loads everything the scheduling engine needs for a date range.
 * Shared by `GET /api/availability` and the booking write path, so what the
 * API offers and what it accepts can never drift apart.
 */
export async function loadSchedulingInputs(
  dentistIds: string[],
  from: CalendarDay,
  to: CalendarDay,
  options: { excludeAppointmentId?: string } = {}
): Promise<{ workingHours: WorkingHour[]; busy: BusyInterval[] }> {
  if (dentistIds.length === 0) return { workingHours: [], busy: [] };

  // Widen by a day each side so a booking straddling midnight still counts.
  const rangeStart = clinicInstant(from, 0, 0);
  const rangeEnd = new Date(clinicInstant(to, 23, 59).getTime() + 24 * 3600_000);

  const [hours, booked, off] = await Promise.all([
    db.select().from(workingHours).where(inArray(workingHours.dentistId, dentistIds)),
    db
      .select({
        dentistId: appointments.dentistId,
        startsAt: appointments.startsAt,
        endsAt: appointments.endsAt,
      })
      .from(appointments)
      .where(
        and(
          inArray(appointments.dentistId, dentistIds),
          eq(appointments.status, 'booked'),
          lte(appointments.startsAt, rangeEnd),
          gte(appointments.endsAt, rangeStart),
          // A reschedule must not be blocked by the appointment it is moving.
          options.excludeAppointmentId
            ? ne(appointments.id, options.excludeAppointmentId)
            : undefined
        )
      ),
    db
      .select({
        dentistId: timeOff.dentistId,
        startsAt: timeOff.startsAt,
        endsAt: timeOff.endsAt,
      })
      .from(timeOff)
      .where(
        and(
          inArray(timeOff.dentistId, dentistIds),
          lte(timeOff.startsAt, rangeEnd),
          gte(timeOff.endsAt, rangeStart)
        )
      ),
  ]);

  return {
    workingHours: hours.map((h) => ({
      dentistId: h.dentistId,
      weekday: h.weekday,
      startTime: h.startTime,
      endTime: h.endTime,
    })),
    // A booked appointment and a block of time off are the same to the engine.
    busy: [...booked, ...off],
  };
}

/**
 * The write-path guard. Rejects anything `GET /api/availability` would never
 * have offered, so the client cannot invent a time.
 *
 * Without this the only protection is the exclusion constraint, which stops
 * overlaps and nothing else — 3am, off-grid, inside the lead time, or a service
 * the dentist does not even perform would all be accepted.
 */
export async function assertSlotBookable({
  dentistId,
  serviceId,
  durationMinutes,
  startsAt,
  excludeAppointmentId,
}: {
  dentistId: string;
  serviceId: string;
  durationMinutes: number;
  startsAt: Date;
  excludeAppointmentId?: string;
}): Promise<void> {
  if (Number.isNaN(startsAt.getTime())) throw badRequest('Invalid appointment time');

  const [offers] = await db
    .select()
    .from(dentistServices)
    .where(
      and(eq(dentistServices.dentistId, dentistId), eq(dentistServices.serviceId, serviceId))
    );
  if (!offers) throw badRequest('That dentist does not offer this service.');

  const day = clinicDayOf(startsAt);
  const { workingHours: hours, busy } = await loadSchedulingInputs([dentistId], day, day, {
    excludeAppointmentId,
  });

  const verdict = classifySlot({
    workingHours: hours,
    busy,
    durationMinutes,
    dentistId,
    startsAt,
    now: new Date(),
  });

  if (verdict === 'taken') {
    throw conflict('That time was just taken. Please pick another.', 'slot_taken');
  }
  if (verdict === 'invalid') {
    throw badRequest('That time is not available. Please pick one of the offered slots.');
  }
}
