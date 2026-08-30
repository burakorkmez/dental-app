import { TZDate } from '@date-fns/tz';

/** Single clinic, single timezone (PLAN.md A1). */
export const CLINIC_TZ = process.env.CLINIC_TZ ?? 'America/New_York';

export type CalendarDay = { year: number; month: number; day: number };

/** 'YYYY-MM-DD' → calendar day. Deliberately not `new Date(str)`, which is UTC-parsed. */
export function parseDay(iso: string): CalendarDay {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`Expected YYYY-MM-DD, got "${iso}"`);
  return { year: +m[1], month: +m[2], day: +m[3] };
}

export function formatDay({ year, month, day }: CalendarDay): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * A clinic-local wall-clock time → the UTC instant it actually happens at.
 * This is the only place the timezone is applied, so DST lives here alone.
 */
export function clinicInstant(day: CalendarDay, hours: number, minutes: number): Date {
  const t = new TZDate(day.year, day.month - 1, day.day, hours, minutes, 0, 0, CLINIC_TZ);
  return new Date(t.getTime());
}

/** 'HH:MM' or 'HH:MM:SS' → [hours, minutes]. */
export function parseClockTime(value: string): [number, number] {
  const m = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value);
  if (!m) throw new Error(`Expected HH:MM, got "${value}"`);
  return [+m[1], +m[2]];
}

/** The clinic-local calendar day an instant falls on, plus its weekday (0 = Sunday). */
export function clinicDayOf(instant: Date): CalendarDay & { weekday: number } {
  const t = new TZDate(instant.getTime(), CLINIC_TZ);
  return {
    year: t.getFullYear(),
    month: t.getMonth() + 1,
    day: t.getDate(),
    weekday: t.getDay(),
  };
}

/** Weekday of a clinic-local calendar day, 0 = Sunday. */
export function weekdayOf(day: CalendarDay): number {
  return new TZDate(day.year, day.month - 1, day.day, 12, 0, 0, 0, CLINIC_TZ).getDay();
}

/**
 * Inclusive range of clinic-local calendar days. Steps by calendar arithmetic,
 * not by adding 24h, so a DST day doesn't shift the sequence.
 */
export function eachDay(from: CalendarDay, to: CalendarDay, maxDays = 62): CalendarDay[] {
  const days: CalendarDay[] = [];
  const cursor = new Date(Date.UTC(from.year, from.month - 1, from.day));
  const end = Date.UTC(to.year, to.month - 1, to.day);
  while (cursor.getTime() <= end && days.length < maxDays) {
    days.push({
      year: cursor.getUTCFullYear(),
      month: cursor.getUTCMonth() + 1,
      day: cursor.getUTCDate(),
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

/** Clinic-local "3:00 PM" for display in API responses the mobile app renders verbatim. */
export function formatClinicTime(instant: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(instant);
}

export function formatClinicDate(instant: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(instant);
}
