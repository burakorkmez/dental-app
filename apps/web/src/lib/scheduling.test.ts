import { describe, expect, it } from 'vitest';

import {
  availableSlots,
  canCancel,
  classifySlot,
  overlaps,
  type BusyInterval,
  type WorkingHour,
} from './scheduling';
import { formatClinicTime, parseDay } from './time';

const D = 'dr-1';
const OTHER = 'dr-2';

/** Mon–Fri 09:00–17:00 clinic-local. */
const nineToFive = (dentistId = D): WorkingHour[] =>
  [1, 2, 3, 4, 5].map((weekday) => ({
    dentistId,
    weekday,
    startTime: '09:00',
    endTime: '17:00',
  }));

const day = (iso: string) => parseDay(iso);

/** Far enough before the range that lead time never interferes. */
const wellBefore = new Date('2025-06-01T00:00:00Z');

function run(over: Partial<Parameters<typeof availableSlots>[0]> = {}) {
  return availableSlots({
    workingHours: nineToFive(),
    busy: [],
    durationMinutes: 30,
    from: day('2025-06-16'), // a Monday
    to: day('2025-06-16'),
    now: wellBefore,
    ...over,
  });
}

describe('overlaps', () => {
  const t = (iso: string) => new Date(iso);

  it('treats intervals as half-open — touching endpoints do not overlap', () => {
    expect(
      overlaps(t('2025-06-16T13:00:00Z'), t('2025-06-16T13:30:00Z'), t('2025-06-16T13:30:00Z'), t('2025-06-16T14:00:00Z'))
    ).toBe(false);
  });

  it('detects a partial overlap', () => {
    expect(
      overlaps(t('2025-06-16T13:00:00Z'), t('2025-06-16T13:30:00Z'), t('2025-06-16T13:15:00Z'), t('2025-06-16T14:00:00Z'))
    ).toBe(true);
  });
});

describe('availableSlots — a normal day', () => {
  it('fills 09:00–17:00 at 15-minute granularity for a 30-minute service', () => {
    const slots = run();
    // Last start that still fits a 30-min service before 17:00 is 16:30.
    expect(slots).toHaveLength(31);
    expect(formatClinicTime(slots[0].startsAt)).toBe('09:00 AM');
    expect(formatClinicTime(slots.at(-1)!.startsAt)).toBe('04:30 PM');
  });

  it('returns nothing on a day with no working hours', () => {
    const slots = run({ from: day('2025-06-15'), to: day('2025-06-15') }); // Sunday
    expect(slots).toEqual([]);
  });

  it('aggregates across dentists and sorts by time', () => {
    const slots = run({
      workingHours: [...nineToFive(D), ...nineToFive(OTHER)],
    });
    expect(slots).toHaveLength(62);
    expect(slots[0].startsAt.getTime()).toBe(slots[1].startsAt.getTime());
    expect(new Set(slots.slice(0, 2).map((s) => s.dentistId))).toEqual(new Set([D, OTHER]));
  });
});

describe('availableSlots — a fully booked day', () => {
  it('returns nothing when one appointment spans the whole window', () => {
    const busy: BusyInterval[] = [
      {
        dentistId: D,
        startsAt: new Date('2025-06-16T13:00:00Z'), // 09:00 EDT
        endsAt: new Date('2025-06-16T21:00:00Z'), // 17:00 EDT
      },
    ];
    expect(run({ busy })).toEqual([]);
  });

  it('blocks only the overlapping starts, not the whole day', () => {
    const busy: BusyInterval[] = [
      {
        dentistId: D,
        startsAt: new Date('2025-06-16T14:00:00Z'), // 10:00 EDT
        endsAt: new Date('2025-06-16T14:30:00Z'), // 10:30 EDT
      },
    ];
    const times = run({ busy }).map((s) => formatClinicTime(s.startsAt));
    // A 30-min service starting 09:45 would run into 10:15 — blocked too.
    expect(times).not.toContain('09:45 AM');
    expect(times).not.toContain('10:00 AM');
    expect(times).not.toContain('10:15 AM');
    expect(times).toContain('09:30 AM');
    expect(times).toContain('10:30 AM');
  });

  it("ignores another dentist's bookings", () => {
    const busy: BusyInterval[] = [
      {
        dentistId: OTHER,
        startsAt: new Date('2025-06-16T13:00:00Z'),
        endsAt: new Date('2025-06-16T21:00:00Z'),
      },
    ];
    expect(run({ busy })).toHaveLength(31);
  });
});

describe('availableSlots — time off', () => {
  it('drops candidates overlapping a block of time off', () => {
    const busy: BusyInterval[] = [
      {
        dentistId: D,
        startsAt: new Date('2025-06-16T16:00:00Z'), // 12:00 EDT
        endsAt: new Date('2025-06-16T17:00:00Z'), // 13:00 EDT
      },
    ];
    const times = run({ busy }).map((s) => formatClinicTime(s.startsAt));
    expect(times).not.toContain('12:00 PM');
    expect(times).not.toContain('12:45 PM');
    expect(times).toContain('11:30 AM');
    expect(times).toContain('01:00 PM');
  });
});

describe('availableSlots — service longer than the remaining window', () => {
  it('never returns a slot that would run past closing', () => {
    const slots = run({ durationMinutes: 90 });
    expect(formatClinicTime(slots.at(-1)!.startsAt)).toBe('03:30 PM');
    for (const s of slots) {
      expect(s.endsAt.getTime() - s.startsAt.getTime()).toBe(90 * 60_000);
    }
  });

  it('returns nothing when the service cannot fit the window at all', () => {
    expect(run({ durationMinutes: 9 * 60 })).toEqual([]);
  });
});

describe('availableSlots — lead time boundary', () => {
  // 09:00 EDT on the target Monday is 13:00Z.
  const nineAmUtc = new Date('2025-06-16T13:00:00Z');

  it('excludes a slot exactly one minute inside the 2-hour lead time', () => {
    const now = new Date(nineAmUtc.getTime() - 119 * 60_000);
    expect(formatClinicTime(run({ now })[0].startsAt)).toBe('09:15 AM');
  });

  it('includes a slot exactly at the 2-hour lead time boundary', () => {
    const now = new Date(nineAmUtc.getTime() - 120 * 60_000);
    expect(formatClinicTime(run({ now })[0].startsAt)).toBe('09:00 AM');
  });

  it('drops slots entirely in the past', () => {
    const now = new Date('2025-06-16T23:00:00Z'); // 19:00 EDT, after closing
    expect(run({ now })).toEqual([]);
  });
});

describe('availableSlots — DST', () => {
  // America/New_York springs forward 2025-03-09 and falls back 2025-11-02.
  it('keeps clinic-local 09:00 on the Monday after spring-forward', () => {
    const slots = availableSlots({
      workingHours: nineToFive(),
      busy: [],
      durationMinutes: 30,
      from: day('2025-03-10'),
      to: day('2025-03-10'),
      now: new Date('2025-03-01T00:00:00Z'),
    });
    expect(slots[0].startsAt.toISOString()).toBe('2025-03-10T13:00:00.000Z'); // EDT, UTC-4
    expect(formatClinicTime(slots[0].startsAt)).toBe('09:00 AM');
    expect(slots).toHaveLength(31);
  });

  it('keeps clinic-local 09:00 on the Friday before spring-forward', () => {
    const slots = availableSlots({
      workingHours: nineToFive(),
      busy: [],
      durationMinutes: 30,
      from: day('2025-03-07'),
      to: day('2025-03-07'),
      now: new Date('2025-03-01T00:00:00Z'),
    });
    expect(slots[0].startsAt.toISOString()).toBe('2025-03-07T14:00:00.000Z'); // EST, UTC-5
    expect(formatClinicTime(slots[0].startsAt)).toBe('09:00 AM');
  });

  it('spans a spring-forward weekend without dropping or duplicating a day', () => {
    const slots = availableSlots({
      workingHours: nineToFive(),
      busy: [],
      durationMinutes: 30,
      from: day('2025-03-07'), // Friday
      to: day('2025-03-10'), // Monday
      now: new Date('2025-03-01T00:00:00Z'),
    });
    // Sat + Sun have no working hours, so exactly two working days.
    expect(slots).toHaveLength(62);
    expect(new Set(slots.map((s) => formatClinicTime(s.startsAt))).size).toBe(31);
  });

  it('keeps clinic-local 09:00 across a fall-back weekend', () => {
    const slots = availableSlots({
      workingHours: nineToFive(),
      busy: [],
      durationMinutes: 30,
      from: day('2025-10-31'), // Friday, EDT
      to: day('2025-11-03'), // Monday, EST
      now: new Date('2025-10-01T00:00:00Z'),
    });
    expect(slots).toHaveLength(62);
    expect(slots[0].startsAt.toISOString()).toBe('2025-10-31T13:00:00.000Z'); // UTC-4
    expect(slots[31].startsAt.toISOString()).toBe('2025-11-03T14:00:00.000Z'); // UTC-5
    expect(formatClinicTime(slots[0].startsAt)).toBe('09:00 AM');
    expect(formatClinicTime(slots[31].startsAt)).toBe('09:00 AM');
  });

  it('gives both DST sides the same number of working minutes', () => {
    const springForward = availableSlots({
      workingHours: nineToFive(),
      busy: [],
      durationMinutes: 30,
      from: day('2025-03-10'),
      to: day('2025-03-10'),
      now: new Date('2025-03-01T00:00:00Z'),
    });
    const fallBack = availableSlots({
      workingHours: nineToFive(),
      busy: [],
      durationMinutes: 30,
      from: day('2025-11-03'),
      to: day('2025-11-03'),
      now: new Date('2025-10-01T00:00:00Z'),
    });
    expect(springForward).toHaveLength(fallBack.length);
  });
});

describe('canCancel', () => {
  const startsAt = new Date('2025-06-16T13:00:00Z');

  it('allows a cancel more than 24h out', () => {
    expect(canCancel(startsAt, new Date('2025-06-15T12:00:00Z'))).toBe(true);
  });

  it('allows a cancel exactly 24h out', () => {
    expect(canCancel(startsAt, new Date('2025-06-15T13:00:00Z'))).toBe(true);
  });

  it('blocks a cancel one minute inside the window', () => {
    expect(canCancel(startsAt, new Date('2025-06-15T13:01:00Z'))).toBe(false);
  });

  it('blocks a cancel 2 hours out', () => {
    expect(canCancel(startsAt, new Date('2025-06-16T11:00:00Z'))).toBe(false);
  });
});

describe('classifySlot — the write-path guard', () => {
  const base = {
    workingHours: nineToFive(),
    busy: [] as BusyInterval[],
    durationMinutes: 30,
    dentistId: D,
    now: wellBefore,
  };
  // 2025-06-16 is a Monday. 09:00 EDT = 13:00Z.
  const at = (iso: string) => new Date(iso);

  it('accepts a slot the availability endpoint would offer', () => {
    expect(classifySlot({ ...base, startsAt: at('2025-06-16T13:00:00Z') })).toBe('ok');
  });

  it('rejects a time outside working hours', () => {
    // 03:00 EDT — the exact hole that let a 3am booking through.
    expect(classifySlot({ ...base, startsAt: at('2025-06-16T07:00:00Z') })).toBe('invalid');
  });

  it('rejects a start that is off the 15-minute grid', () => {
    expect(classifySlot({ ...base, startsAt: at('2025-06-16T13:07:00Z') })).toBe('invalid');
  });

  it('rejects a slot that would run past closing', () => {
    expect(
      classifySlot({ ...base, durationMinutes: 90, startsAt: at('2025-06-16T19:45:00Z') })
    ).toBe('invalid');
  });

  it('rejects a slot inside the 2-hour lead time', () => {
    const now = new Date(at('2025-06-16T13:00:00Z').getTime() - 60 * 60_000);
    expect(classifySlot({ ...base, now, startsAt: at('2025-06-16T13:00:00Z') })).toBe('invalid');
  });

  it('rejects a day the dentist does not work', () => {
    expect(classifySlot({ ...base, startsAt: at('2025-06-15T13:00:00Z') })).toBe('invalid'); // Sunday
  });

  it("rejects another dentist's slot", () => {
    expect(classifySlot({ ...base, dentistId: OTHER, startsAt: at('2025-06-16T13:00:00Z') })).toBe(
      'invalid'
    );
  });

  it('reports a real-but-occupied slot as taken, not invalid', () => {
    const busy: BusyInterval[] = [
      { dentistId: D, startsAt: at('2025-06-16T13:00:00Z'), endsAt: at('2025-06-16T13:30:00Z') },
    ];
    expect(classifySlot({ ...base, busy, startsAt: at('2025-06-16T13:00:00Z') })).toBe('taken');
  });

  it('reports a slot blocked by time off as taken', () => {
    const busy: BusyInterval[] = [
      { dentistId: D, startsAt: at('2025-06-16T16:00:00Z'), endsAt: at('2025-06-16T17:00:00Z') },
    ];
    expect(classifySlot({ ...base, busy, startsAt: at('2025-06-16T16:00:00Z') })).toBe('taken');
  });

  it('still accepts a slot when the busy interval belongs to another dentist', () => {
    const busy: BusyInterval[] = [
      { dentistId: OTHER, startsAt: at('2025-06-16T13:00:00Z'), endsAt: at('2025-06-16T13:30:00Z') },
    ];
    expect(classifySlot({ ...base, busy, startsAt: at('2025-06-16T13:00:00Z') })).toBe('ok');
  });

  it('holds across a DST boundary — 09:00 clinic-local is still valid', () => {
    expect(
      classifySlot({
        ...base,
        startsAt: at('2025-03-10T13:00:00Z'), // 09:00 EDT, Monday after spring-forward
        now: new Date('2025-03-01T00:00:00Z'),
      })
    ).toBe('ok');
    expect(
      classifySlot({
        ...base,
        startsAt: at('2025-03-10T14:00:00Z'), // the UTC time that was 09:00 the week before
        now: new Date('2025-03-01T00:00:00Z'),
      })
    ).toBe('ok'); // 10:00 EDT — also a real slot
    expect(
      classifySlot({
        ...base,
        startsAt: at('2025-03-10T12:00:00Z'), // 08:00 EDT — before opening
        now: new Date('2025-03-01T00:00:00Z'),
      })
    ).toBe('invalid');
  });
});
