import { and, asc, eq, gte, lt } from 'drizzle-orm';
import Link from 'next/link';

import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ToothIcon,
  VideoIcon,
} from '@/components/icons';
import { Avatar, Card, EmptyState, StatTile, StatusPill } from '@/components/ui';
import { db } from '@/db';
import { appointments, dentists, patients, services } from '@/db/schema';
import { requireStaff } from '@/lib/auth';
import { clinicDayOf, clinicInstant, formatClinicDate, formatClinicTime, parseDay } from '@/lib/time';

/** Server Component hitting Drizzle directly — no HTTP hop (PLAN.md architecture). */
export default async function DashboardPage({ searchParams }: PageProps<'/dashboard'>) {
  await requireStaff();

  const params = await searchParams;
  const dateParam = typeof params.date === 'string' ? params.date : undefined;
  const day = dateParam ? parseDay(dateParam) : clinicDayOf(new Date());

  const dayStart = clinicInstant(day, 0, 0);
  const dayEnd = new Date(dayStart.getTime() + 24 * 3600_000);

  const rows = await db
    .select({
      id: appointments.id,
      startsAt: appointments.startsAt,
      status: appointments.status,
      patientId: patients.id,
      firstName: patients.firstName,
      lastName: patients.lastName,
      dentist: dentists.displayName,
      dentistPhoto: dentists.photoUrl,
      service: services.name,
      isTeleconsult: services.isTeleconsult,
    })
    .from(appointments)
    .innerJoin(patients, eq(patients.id, appointments.patientId))
    .innerJoin(dentists, eq(dentists.id, appointments.dentistId))
    .innerJoin(services, eq(services.id, appointments.serviceId))
    .where(and(gte(appointments.startsAt, dayStart), lt(appointments.startsAt, dayEnd)))
    .orderBy(asc(appointments.startsAt), asc(dentists.displayName));

  const dentistCount = new Set(rows.map((r) => r.dentist)).size;
  const teleconsults = rows.filter((r) => r.isTeleconsult).length;

  const shift = (days: number) => {
    const d = new Date(Date.UTC(day.year, day.month - 1, day.day));
    d.setUTCDate(d.getUTCDate() + days);
    return `/dashboard?date=${d.toISOString().slice(0, 10)}`;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-navy">
            {formatClinicDate(clinicInstant(day, 12, 0))}
          </h1>
          <p className="mt-1 text-[14px] text-muted">Every dentist, in clinic time.</p>
        </div>

        <nav className="flex items-center gap-2.5">
          <PillLink href={shift(-1)}>
            <ChevronLeftIcon width={16} height={16} />
            Previous
          </PillLink>
          <Link
            href="/dashboard"
            className="btn-aqua rounded-full px-5 py-2.5 text-[14px] font-semibold transition-transform active:scale-[0.98]"
          >
            Today
          </Link>
          <PillLink href={shift(1)}>
            Next
            <ChevronRightIcon width={16} height={16} />
          </PillLink>
        </nav>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          icon={<CalendarIcon width={22} height={22} />}
          value={rows.length}
          label={rows.length === 1 ? 'Appointment' : 'Appointments'}
        />
        <StatTile
          icon={<ToothIcon width={22} height={22} />}
          value={dentistCount}
          label={dentistCount === 1 ? 'Dentist' : 'Dentists'}
        />
        <StatTile
          icon={<VideoIcon width={22} height={22} />}
          value={teleconsults}
          label={teleconsults === 1 ? 'Teleconsult' : 'Teleconsults'}
        />
      </div>

      <Card padding="p-0">
        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState>Nothing scheduled for this day.</EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[14px]">
              <thead>
                <tr className="text-left text-[13px] text-muted">
                  <th className="px-6 py-4 font-medium">Time</th>
                  <th className="px-6 py-4 font-medium">Patient</th>
                  <th className="px-6 py-4 font-medium">Service</th>
                  <th className="px-6 py-4 font-medium">Dentist</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-hairline">
                    <td className="whitespace-nowrap px-6 py-5 font-medium tabular-nums text-navy">
                      {formatClinicTime(r.startsAt)}
                    </td>
                    <td className="px-6 py-5">
                      <Link
                        href={`/dashboard/patients/${r.patientId}`}
                        className="font-medium text-navy underline-offset-4 transition-colors hover:text-aqua-ink hover:underline"
                      >
                        {r.firstName} {r.lastName}
                      </Link>
                    </td>
                    <td className="px-6 py-5 text-muted">{r.service}</td>
                    <td className="px-6 py-5">
                      <span className="flex items-center gap-2.5 text-muted">
                        <Avatar src={r.dentistPhoto} name={r.dentist} size={30} />
                        {r.dentist}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <StatusPill status={r.isTeleconsult && r.status === 'booked' ? 'video' : r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function PillLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="btn-glass flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[14px] font-medium transition-transform active:scale-[0.98]"
    >
      {children}
    </Link>
  );
}
