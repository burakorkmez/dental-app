import {
  clinicDayOf as clinicDayOfInstant,
  clinicInstant,
  eachDay,
  parseClockTime,
  weekdayOf,
  type CalendarDay,
} from './time';

/** PLAN.md A4 — both are constants, not config. */
export const SLOT_GRANULARITY_MINUTES = 15;
export const MIN_LEAD_TIME_MINUTES = 120;
/** PLAN.md — cancel/reschedule closes this far ahead of the appointment. */
export const CANCEL_CUTOFF_HOURS = 24;
/** PLAN.md A7 — the teleconsult join window around `starts_at`. */
export const JOIN_OPENS_BEFORE_MINUTES = 5;
export const JOIN_CLOSES_AFTER_MINUTES = 30;

const MINUTE = 60_000;

export type WorkingHour = {
  dentistId: string;
  weekday: number; // 0 = Sunday
  startTime: string; // clinic-local 'HH:MM' / 'HH:MM:SS'
  endTime: string;
};

/** A booked appointment or a block of time off — both just make a dentist unavailable. */
export type BusyInterval = {
  dentistId: string;
  startsAt: Date;
  endsAt: Date;
};

export type Slot = {
  dentistId: string;
  startsAt: Date;
  endsAt: Date;
};

export type AvailableSlotsInput = {
  workingHours: WorkingHour[];
  busy: BusyInterval[];
  durationMinutes: number;
  from: CalendarDay;
  to: CalendarDay;
  now: Date;
};

/** Half-open intervals: touching at an endpoint is not an overlap. */
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

/**
 * Every bookable start time for a service across a date range.
 *
 * Pure: the caller loads the rows, this decides. That is what makes the DST
 * cases (PLAN.md R4) testable without a database.
 */
export function availableSlots({
  workingHours,
  busy,
  durationMinutes,
  from,
  to,
  now,
}: AvailableSlotsInput): Slot[] {
  if (durationMinutes <= 0) return [];

  const earliest = now.getTime() + MIN_LEAD_TIME_MINUTES * MINUTE;
  const duration = durationMinutes * MINUTE;
  const step = SLOT_GRANULARITY_MINUTES * MINUTE;

  // Group busy intervals per dentist so a candidate only scans its own dentist.
  const busyByDentist = new Map<string, BusyInterval[]>();
  for (const b of busy) {
    const list = busyByDentist.get(b.dentistId);
    if (list) list.push(b);
    else busyByDentist.set(b.dentistId, [b]);
  }

  const slots: Slot[] = [];

  for (const day of eachDay(from, to)) {
    const weekday = weekdayOf(day);

    for (const wh of workingHours) {
      if (wh.weekday !== weekday) continue;

      const [startH, startM] = parseClockTime(wh.startTime);
      const [endH, endM] = parseClockTime(wh.endTime);

      // Both endpoints go through the clinic timezone, so a spring-forward day
      // still yields the same number of working minutes the clinic actually works.
      const windowStart = clinicInstant(day, startH, startM).getTime();
      const windowEnd = clinicInstant(day, endH, endM).getTime();
      if (windowEnd <= windowStart) continue;

      const dentistBusy = busyByDentist.get(wh.dentistId) ?? [];

      for (let t = windowStart; t + duration <= windowEnd; t += step) {
        if (t < earliest) continue;

        const startsAt = new Date(t);
        const endsAt = new Date(t + duration);

        const blocked = dentistBusy.some((b) =>
          overlaps(startsAt, endsAt, b.startsAt, b.endsAt)
        );
        if (blocked) continue;

        slots.push({ dentistId: wh.dentistId, startsAt, endsAt });
      }
    }
  }

  return slots.sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime() || a.dentistId.localeCompare(b.dentistId)
  );
}

/** Server-side rule. The client only hides the button; this decides. */
export function canCancel(startsAt: Date, now: Date): boolean {
  return startsAt.getTime() - now.getTime() >= CANCEL_CUTOFF_HOURS * 60 * MINUTE;
}

/**
 * PLAN.md A7 — a teleconsult is joinable from 5 minutes before until 30 minutes
 * after its start. Computed here, next to `canCancel`, so both windows are one
 * pure function the tests can pin rather than a date comparison scattered
 * across screens.
 *
 * ponytail: this gates the button, not the room. A determined caller who
 * already holds a Stream token could still join `appointment-{id}` outside the
 * window. Closing that means server-side call membership (create the call with
 * only the patient + dentist as members and set the call type to members-only)
 * — worth doing before real patients, overkill for the seeded demo (A15).
 */
export function canJoinCall(startsAt: Date, now: Date): boolean {
  const delta = now.getTime() - startsAt.getTime();
  return delta >= -JOIN_OPENS_BEFORE_MINUTES * MINUTE && delta <= JOIN_CLOSES_AFTER_MINUTES * MINUTE;
}

export type SlotVerdict = 'ok' | 'taken' | 'invalid';

/**
 * Is this exact start time bookable?
 *
 * Pure, so the write path enforces the *same* rules `availableSlots` advertises
 * instead of trusting whatever timestamp a client sends. Splits the two failures
 * apart because they mean different things to a patient:
 *   'taken'   — a real slot someone else got first  → 409, pick another
 *   'invalid' — never a slot at all (3am, off-grid, inside the lead time) → 400
 */
export function classifySlot({
  workingHours,
  busy,
  durationMinutes,
  dentistId,
  startsAt,
  now,
}: {
  workingHours: WorkingHour[];
  busy: BusyInterval[];
  durationMinutes: number;
  dentistId: string;
  startsAt: Date;
  now: Date;
}): SlotVerdict {
  const day = clinicDayOfInstant(startsAt);
  const matches = (slots: Slot[]) =>
    slots.some((s) => s.dentistId === dentistId && s.startsAt.getTime() === startsAt.getTime());

  const input = { workingHours, durationMinutes, from: day, to: day, now };

  if (matches(availableSlots({ ...input, busy }))) return 'ok';
  // Real slot, just occupied — worth a different message than "not a slot".
  if (matches(availableSlots({ ...input, busy: [] }))) return 'taken';
  return 'invalid';
}
