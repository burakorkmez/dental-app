/**
 * Seeds the demo clinic. Idempotent: re-running replaces the seeded rows but
 * leaves anything created through the app alone.
 *
 *   npm run db:seed -w apps/web
 */
import { eq, inArray, sql } from 'drizzle-orm';

import { db } from './index';
import {
  appointments,
  dentistServices,
  dentists,
  medicalHistories,
  patients,
  services,
  users,
  visitNotes,
  workingHours,
} from './schema';
import { availableSlots, type BusyInterval } from '../lib/scheduling';
import { clinicDayOf, clinicInstant, type CalendarDay } from '../lib/time';

/** Service keys match the ones apps/mobile already hard-codes in its UI. */
const SERVICES = [
  { key: 'checkup', name: 'Regular Checkup', description: 'Routine exam and X-rays', durationMinutes: 30 },
  { key: 'cleaning', name: 'Teeth Cleaning', description: 'Professional hygienist cleaning', durationMinutes: 45 },
  { key: 'pain', name: 'Tooth Pain', description: 'Assessment of pain or discomfort', durationMinutes: 30 },
  { key: 'white', name: 'Teeth Whitening', description: 'In-clinic whitening treatment', durationMinutes: 60 },
  { key: 'ortho', name: 'Orthodontic Consultation', description: 'Braces or aligner assessment', durationMinutes: 30 },
  { key: 'resto', name: 'Restorative', description: 'Crowns, bridges and implants', durationMinutes: 90 },
  { key: 'followup', name: 'Follow-up Visit', description: 'Post-procedure check', durationMinutes: 20 },
  { key: 'video', name: 'Video Consultation', description: 'Talk to a dentist from home', durationMinutes: 20, isTeleconsult: true },
] as const;

const DENTISTS = [
  {
    displayName: 'Dr. Sarah Johnson',
    photoUrl: 'https://ik.imagekit.io/qp8esome3/dentists/dr-sarah-johnson.png',
    title: 'DDS',
    specialty: 'General Dentistry',
    bio: 'Fifteen years of family dentistry, with a focus on anxious patients.',
    offers: ['checkup', 'cleaning', 'pain', 'white', 'followup', 'video'],
    hours: { weekdays: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' },
  },
  {
    displayName: 'Dr. Marcus Chen',
    photoUrl: 'https://ik.imagekit.io/qp8esome3/dentists/dr-marcus-chen.png',
    title: 'DMD',
    specialty: 'Orthodontics',
    bio: 'Aligner and braces specialist treating teens and adults.',
    offers: ['checkup', 'ortho', 'resto', 'followup', 'video'],
    hours: { weekdays: [1, 2, 3, 4], start: '10:00', end: '18:00' },
  },
  {
    displayName: 'Dr. Priya Nair',
    photoUrl: 'https://ik.imagekit.io/qp8esome3/dentists/dr-priya-nair.png',
    title: 'BDS',
    specialty: 'Restorative & Cosmetic',
    bio: 'Crowns, implants and smile design.',
    offers: ['cleaning', 'white', 'resto', 'pain', 'video'],
    // Tue-Sat full days, plus a short Sunday weekend-cover shift.
    hours: { weekdays: [2, 3, 4, 5, 6], start: '08:30', end: '16:30' },
    extraHours: [{ weekday: 0, start: '10:00', end: '14:00' }],
  },
] as const;

type SeedPatient = {
  firstName: string;
  lastName: string;
  isSelf: boolean;
  dateOfBirth: string;
  phone: string;
  gender: string;
  primaryConcern: string;
  referralSource: string;
  medical: {
    allergies: string[];
    medications: string[];
    conditions: string[];
    isSmoker: boolean;
    isPregnant: boolean;
    anxietyLevel: number;
    notes: string;
  } | null;
};

/** Fake households so the dashboard is never empty during the demo (A15). */
const HOUSEHOLDS: { clerkId: string; email: string; members: SeedPatient[] }[] = [
  {
    clerkId: 'seed_demo_account',
    email: 'demo@dentify.test',
    members: [
      {
        firstName: 'Alex', lastName: 'Rivera', isSelf: true, dateOfBirth: '1991-04-12',
        phone: '(555) 123-4567', gender: 'Male', primaryConcern: 'cleaning', referralSource: 'Friend / Family',
        medical: { allergies: ['Penicillin'], medications: [], conditions: [], isSmoker: false, isPregnant: false, anxietyLevel: 4, notes: 'Prefers morning appointments.' },
      },
      {
        firstName: 'Emma', lastName: 'Rivera', isSelf: false, dateOfBirth: '2014-09-02',
        phone: '(555) 123-4567', gender: 'Female', primaryConcern: 'checkup', referralSource: 'Friend / Family',
        medical: { allergies: [], medications: [], conditions: [], isSmoker: false, isPregnant: false, anxietyLevel: 8, notes: 'Nervous in the chair — go slowly.' },
      },
      {
        firstName: 'Noah', lastName: 'Rivera', isSelf: false, dateOfBirth: '2011-01-23',
        phone: '(555) 123-4567', gender: 'Male', primaryConcern: 'ortho', referralSource: 'Friend / Family',
        medical: null,
      },
    ],
  },
  {
    clerkId: 'seed_okafor_account',
    email: 'ada.okafor@dentify.test',
    members: [
      {
        firstName: 'Ada', lastName: 'Okafor', isSelf: true, dateOfBirth: '1986-11-30',
        phone: '(555) 204-8891', gender: 'Female', primaryConcern: 'resto', referralSource: 'Google search',
        medical: { allergies: ['Latex'], medications: ['Metformin'], conditions: ['Type 2 diabetes'], isSmoker: false, isPregnant: false, anxietyLevel: 3, notes: 'Diabetic — schedule earlier in the day where possible.' },
      },
      {
        firstName: 'Chidi', lastName: 'Okafor', isSelf: false, dateOfBirth: '2016-06-18',
        phone: '(555) 204-8891', gender: 'Male', primaryConcern: 'checkup', referralSource: 'Google search',
        medical: { allergies: [], medications: [], conditions: ['Asthma'], isSmoker: false, isPregnant: false, anxietyLevel: 6, notes: 'Carries an inhaler.' },
      },
    ],
  },
  {
    clerkId: 'seed_novak_account',
    email: 'petra.novak@dentify.test',
    members: [
      {
        firstName: 'Petra', lastName: 'Novak', isSelf: true, dateOfBirth: '1998-02-07',
        phone: '(555) 771-3320', gender: 'Female', primaryConcern: 'white', referralSource: 'Instagram',
        medical: { allergies: [], medications: [], conditions: [], isSmoker: true, isPregnant: false, anxietyLevel: 2, notes: 'Asked about whitening longevity for a smoker.' },
      },
    ],
  },
  {
    clerkId: 'seed_silva_account',
    email: 'mateus.silva@dentify.test',
    members: [
      {
        firstName: 'Mateus', lastName: 'Silva', isSelf: true, dateOfBirth: '1974-08-25',
        phone: '(555) 690-1145', gender: 'Male', primaryConcern: 'pain', referralSource: 'Insurance',
        medical: { allergies: ['Ibuprofen'], medications: ['Warfarin'], conditions: ['Hypertension'], isSmoker: false, isPregnant: false, anxietyLevel: 7, notes: 'On a blood thinner — flag before any extraction.' },
      },
    ],
  },
  {
    clerkId: 'seed_haddad_account',
    email: 'yara.haddad@dentify.test',
    members: [
      {
        firstName: 'Yara', lastName: 'Haddad', isSelf: true, dateOfBirth: '1993-12-14',
        phone: '(555) 458-2277', gender: 'Female', primaryConcern: 'checkup', referralSource: 'Friend / Family',
        medical: { allergies: [], medications: ['Prenatal vitamins'], conditions: [], isSmoker: false, isPregnant: true, anxietyLevel: 5, notes: 'Second trimester — no elective X-rays.' },
      },
    ],
  },
];

const POST_OP_NOTES = [
  'Cleaning completed, no decay found. Rinse with warm salt water tonight if the gums feel tender, and avoid flossing the lower right quadrant for 24 hours. Next cleaning in six months.',
  'Composite filling placed on the upper left molar. Avoid very hot or cold food for 48 hours. Mild sensitivity is normal and should settle within a week.',
  'Exam and bitewing X-rays taken — no issues detected. Keep brushing twice daily and add floss picks if string floss is awkward.',
  'Whitening session completed. Stay off coffee, tea, red wine and anything strongly coloured for 48 hours to protect the result.',
  'Crown prep done and a temporary fitted. Chew on the other side until the permanent crown is seated, and call us if the temporary comes loose.',
];

/** Deterministic RNG so re-seeding produces a stable-looking clinic. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const shiftDay = (day: CalendarDay, days: number): CalendarDay => {
  const d = new Date(Date.UTC(day.year, day.month - 1, day.day));
  d.setUTCDate(d.getUTCDate() + days);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
};

async function main() {
  console.log('Seeding…');

  // --- services -------------------------------------------------------
  await db
    .insert(services)
    .values(SERVICES.map((s) => ({ ...s, isTeleconsult: 'isTeleconsult' in s ? s.isTeleconsult : false })))
    .onConflictDoUpdate({
      target: services.key,
      set: {
        name: sqlExcluded('name'),
        description: sqlExcluded('description'),
        durationMinutes: sqlExcluded('duration_minutes'),
        isTeleconsult: sqlExcluded('is_teleconsult'),
      },
    });
  const serviceRows = await db.select().from(services);
  const serviceByKey = new Map(serviceRows.map((s) => [s.key, s]));
  console.log(`  ${serviceRows.length} services`);

  // --- dentists -------------------------------------------------------
  for (const d of DENTISTS) {
    const existing = await db.select().from(dentists).where(eq(dentists.displayName, d.displayName));
    const row =
      existing[0] ??
      (
        await db
          .insert(dentists)
          .values({
            displayName: d.displayName,
            title: d.title,
            specialty: d.specialty,
            bio: d.bio,
            photoUrl: d.photoUrl,
          })
          .returning()
      )[0];

    // Headshots live in ImageKit's public folder; keep the row pointing at them
    // even when the dentist already existed (see upload-dentist-photos.ts).
    if (row.photoUrl !== d.photoUrl) {
      await db.update(dentists).set({ photoUrl: d.photoUrl }).where(eq(dentists.id, row.id));
    }

    // Reset the join rows and hours so editing this file is the source of truth.
    await db.delete(dentistServices).where(eq(dentistServices.dentistId, row.id));
    await db
      .insert(dentistServices)
      .values(d.offers.map((key) => ({ dentistId: row.id, serviceId: serviceByKey.get(key)!.id })));

    await db.delete(workingHours).where(eq(workingHours.dentistId, row.id));
    await db.insert(workingHours).values([
      ...d.hours.weekdays.map((weekday) => ({
        dentistId: row.id,
        weekday,
        startTime: d.hours.start,
        endTime: d.hours.end,
      })),
      ...('extraHours' in d ? d.extraHours : []).map((h) => ({
        dentistId: row.id,
        weekday: h.weekday,
        startTime: h.start,
        endTime: h.end,
      })),
    ]);
  }
  const dentistRows = await db.select().from(dentists);
  console.log(`  ${dentistRows.length} dentists with hours and service links`);

  // --- households and patients ----------------------------------------
  const allPatients: { row: typeof patients.$inferSelect; seed: SeedPatient }[] = [];

  for (const house of HOUSEHOLDS) {
    const [account] = await db
      .insert(users)
      .values({ clerkId: house.clerkId, email: house.email, role: 'patient' })
      .onConflictDoUpdate({ target: users.clerkId, set: { email: house.email } })
      .returning();

    // Cascades to their appointments and histories, so a re-run is clean.
    const existing = await db.select().from(patients).where(eq(patients.accountUserId, account.id));
    if (existing.length) {
      await db.delete(patients).where(inArray(patients.id, existing.map((p) => p.id)));
    }

    const inserted = await db
      .insert(patients)
      .values(
        house.members.map((p) => ({
          accountUserId: account.id,
          isSelf: p.isSelf,
          firstName: p.firstName,
          lastName: p.lastName,
          dateOfBirth: p.dateOfBirth,
          phone: p.phone,
          gender: p.gender,
          primaryConcern: p.primaryConcern,
          referralSource: p.referralSource,
        }))
      )
      .returning();

    for (const [i, member] of house.members.entries()) {
      allPatients.push({ row: inserted[i], seed: member });
      if (!member.medical) continue;
      await db.insert(medicalHistories).values({
        patientId: inserted[i].id,
        allergies: member.medical.allergies,
        medications: member.medical.medications,
        conditions: member.medical.conditions,
        isSmoker: member.medical.isSmoker,
        isPregnant: member.medical.isPregnant,
        anxietyLevel: member.medical.anxietyLevel,
        notes: member.medical.notes,
      });
    }
  }
  console.log(`  ${allPatients.length} patients across ${HOUSEHOLDS.length} households`);

  // --- appointments ----------------------------------------------------
  // Generated through the real scheduling engine, so every seeded booking sits
  // inside genuine working hours and no two of them can collide.
  const hours = await db.select().from(workingHours);
  const offers = await db.select().from(dentistServices);
  const rand = mulberry32(20260830);
  const today = clinicDayOf(new Date());
  const busy: BusyInterval[] = [];
  const created: { id: string; patientId: string; startsAt: Date; past: boolean }[] = [];

  for (let offset = -28; offset <= 21; offset++) {
    const day = shiftDay(today, offset);
    const past = offset < 0;

    // Busier midweek than at the edges of the range.
    const target = past ? 2 + Math.floor(rand() * 3) : 1 + Math.floor(rand() * 3);

    for (let n = 0; n < target; n++) {
      const patient = allPatients[Math.floor(rand() * allPatients.length)];
      const preferred = serviceByKey.get(patient.seed.primaryConcern);
      const service =
        rand() < 0.55 && preferred ? preferred : serviceRows[Math.floor(rand() * serviceRows.length)];

      const eligible = offers.filter((o) => o.serviceId === service.id).map((o) => o.dentistId);
      if (eligible.length === 0) continue;

      const slots = availableSlots({
        workingHours: hours
          .filter((h) => eligible.includes(h.dentistId))
          .map((h) => ({
            dentistId: h.dentistId,
            weekday: h.weekday,
            startTime: h.startTime,
            endTime: h.endTime,
          })),
        busy,
        durationMinutes: service.durationMinutes,
        from: day,
        to: day,
        // Past days need the lead-time and past-slot filters out of the way.
        now: clinicInstant(shiftDay(day, -1), 0, 0),
      });
      if (slots.length === 0) continue;

      const slot = slots[Math.floor(rand() * slots.length)];

      // Past appointments mostly happened; a few were no-shows or cancelled.
      const roll = rand();
      const status = past
        ? roll < 0.82
          ? 'completed'
          : roll < 0.92
            ? 'no_show'
            : 'cancelled'
        : 'booked';

      const [row] = await db
        .insert(appointments)
        .values({
          patientId: patient.row.id,
          dentistId: slot.dentistId,
          serviceId: service.id,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          status,
          cancelledAt: status === 'cancelled' ? slot.startsAt : null,
        })
        .returning();

      // Only 'booked' rows participate in the exclusion constraint, so keep
      // every seeded row in `busy` to stop the generator stacking them.
      busy.push({ dentistId: slot.dentistId, startsAt: slot.startsAt, endsAt: slot.endsAt });
      created.push({ id: row.id, patientId: patient.row.id, startsAt: slot.startsAt, past });

      if (service.isTeleconsult) {
        await db
          .update(appointments)
          .set({ streamCallId: `appointment-${row.id}` })
          .where(eq(appointments.id, row.id));
      }
    }
  }
  console.log(`  ${created.length} appointments across 50 days`);

  // --- visit notes + last visit ----------------------------------------
  const completed = created.filter((c) => c.past);
  let noteCount = 0;
  for (const appt of completed) {
    if (rand() > 0.6) continue;
    await db.insert(visitNotes).values({
      appointmentId: appt.id,
      body: POST_OP_NOTES[Math.floor(rand() * POST_OP_NOTES.length)],
    });
    noteCount++;
  }
  console.log(`  ${noteCount} post-op notes`);

  const lastVisit = new Map<string, Date>();
  for (const c of completed) {
    const prev = lastVisit.get(c.patientId);
    if (!prev || c.startsAt > prev) lastVisit.set(c.patientId, c.startsAt);
  }
  for (const [patientId, at] of lastVisit) {
    await db.update(patients).set({ lastVisitAt: at }).where(eq(patients.id, patientId));
  }

  console.log('Done.');
}

/** `excluded.<col>` for an upsert SET clause. */
function sqlExcluded(column: string) {
  return sql.raw(`excluded."${column}"`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
