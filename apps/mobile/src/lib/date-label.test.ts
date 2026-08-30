// Run: node --experimental-strip-types src/lib/date-label.test.ts
import { dateParts } from './date-label.ts';

const eq = (got: unknown, want: unknown, what: string) => {
  const [a, b] = [JSON.stringify(got), JSON.stringify(want)];
  if (a !== b) throw new Error(`${what}: got ${a}, want ${b}`);
};

/** The exact formatter the API builds `dateLabel` with (apps/web/src/lib/time.ts). */
const clinicLabel = (iso: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));

// --- the contract with the server's formatter ---
eq(dateParts(clinicLabel('2024-05-24T14:00:00Z')), { dow: 'FRI', mon: 'MAY', day: '24' }, 'summer');
eq(dateParts(clinicLabel('2024-01-08T15:00:00Z')), { dow: 'MON', mon: 'JAN', day: '8' }, 'single-digit day');

// An 8am clinic appointment is the previous UTC day — the whole reason this
// parses the server's label instead of re-deriving from `startsAt`.
eq(dateParts(clinicLabel('2024-05-24T02:30:00Z')), { dow: 'THU', mon: 'MAY', day: '23' }, 'crosses UTC midnight');

// --- degrades instead of throwing ---
eq(dateParts(''), { dow: '', mon: '', day: '' }, 'empty label');
eq(dateParts('nonsense'), { dow: 'NONSENSE', mon: '', day: '' }, 'unparseable label');

console.log('date-label: ok');
