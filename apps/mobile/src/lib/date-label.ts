/**
 * The API sends `dateLabel` already formatted in clinic time ("Fri, May 24,
 * 2024" — see `formatClinicDate` in apps/web/src/lib/time.ts), because the app
 * must never need to know CLINIC_TZ.
 *
 * The appointment card wants that split into its three-line date box. Splitting
 * the label is deliberate: re-deriving the parts from `startsAt` would use the
 * DEVICE timezone, and a 9am clinic appointment would show as the previous day
 * for a patient whose phone is set to a westward zone.
 */
export function dateParts(label: string): { dow: string; mon: string; day: string } {
  const [dow = '', monthDay = ''] = label.split(', ');
  const [mon = '', day = ''] = monthDay.split(' ');
  return { dow: dow.toUpperCase(), mon: mon.toUpperCase(), day };
}
