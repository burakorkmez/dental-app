import { appointments } from '@/db/schema';

import { canCancel, canJoinCall } from './scheduling';
import { formatClinicDate, formatClinicTime } from './time';

export type AppointmentRow = {
  appointment: typeof appointments.$inferSelect;
  patient: { id: string; firstName: string; lastName: string } | null;
  dentist: {
    id: string;
    displayName: string;
    title: string | null;
    specialty: string | null;
    photoUrl: string | null;
  } | null;
  service: { id: string; key: string; name: string; durationMinutes: number; isTeleconsult: boolean } | null;
};

/**
 * The shape the mobile cards render directly. Labels are pre-formatted in
 * clinic-local time so the app never has to know CLINIC_TZ, and `canCancel`
 * is computed server-side so the client isn't the one deciding.
 */
export function serialize(row: AppointmentRow) {
  const a = row.appointment;
  return {
    id: a.id,
    startsAt: a.startsAt.toISOString(),
    endsAt: a.endsAt.toISOString(),
    status: a.status,
    isTeleconsult: row.service?.isTeleconsult ?? false,
    streamCallId: a.streamCallId,
    canCancel: a.status === 'booked' && canCancel(a.startsAt, new Date()),
    // A7's join window, decided here for the same reason as `canCancel`: the
    // app renders a button, it doesn't own the rule.
    canJoin:
      a.status === 'booked' &&
      Boolean(row.service?.isTeleconsult) &&
      Boolean(a.streamCallId) &&
      canJoinCall(a.startsAt, new Date()),
    dateLabel: formatClinicDate(a.startsAt),
    timeLabel: formatClinicTime(a.startsAt),
    patient: row.patient,
    dentist: row.dentist,
    service: row.service,
  };
}
