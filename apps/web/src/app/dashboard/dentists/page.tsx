import { asc, eq, gte, and, count } from 'drizzle-orm';

import { ClockIcon, ToothIcon, VideoIcon } from '@/components/icons';
import { Avatar, Card, Chip, EmptyState, StatTile } from '@/components/ui';
import { db } from '@/db';
import { appointments, dentistServices, dentists, services, workingHours } from '@/db/schema';
import { requireStaff } from '@/lib/auth';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** '09:00:00' → '9:00 AM' — working hours are clinic-local wall clock, not instants. */
function clockLabel(value: string) {
  const [h, m] = value.split(':').map(Number);
  const suffix = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

export default async function DentistsPage() {
  await requireStaff();

  const [roster, hours, offered, upcoming] = await Promise.all([
    db.select().from(dentists).orderBy(asc(dentists.displayName)),
    db.select().from(workingHours).orderBy(asc(workingHours.weekday)),
    db
      .select({
        dentistId: dentistServices.dentistId,
        name: services.name,
        isTeleconsult: services.isTeleconsult,
      })
      .from(dentistServices)
      .innerJoin(services, eq(services.id, dentistServices.serviceId))
      .orderBy(asc(services.name)),
    db
      .select({ dentistId: appointments.dentistId, total: count(appointments.id) })
      .from(appointments)
      .where(and(eq(appointments.status, 'booked'), gte(appointments.startsAt, new Date())))
      .groupBy(appointments.dentistId),
  ]);

  const active = roster.filter((d) => d.isActive);
  const teleconsultCapable = new Set(
    offered.filter((o) => o.isTeleconsult).map((o) => o.dentistId)
  ).size;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[32px] font-bold tracking-tight text-navy">Dentists</h1>
        <p className="mt-1 text-[14px] text-muted">
          Who works when, and what each of them offers.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          icon={<ToothIcon width={22} height={22} />}
          value={active.length}
          label={active.length === 1 ? 'Active dentist' : 'Active dentists'}
        />
        <StatTile
          icon={<VideoIcon width={22} height={22} />}
          value={teleconsultCapable}
          label="Offer teleconsults"
        />
        <StatTile
          icon={<ClockIcon width={22} height={22} />}
          value={upcoming.reduce((sum, u) => sum + u.total, 0)}
          label="Upcoming bookings"
        />
      </div>

      {roster.length === 0 ? (
        <Card>
          <EmptyState>No dentists yet — run the seed.</EmptyState>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {roster.map((d) => {
            const own = hours.filter((h) => h.dentistId === d.id);
            const svc = offered.filter((o) => o.dentistId === d.id);
            const booked = upcoming.find((u) => u.dentistId === d.id)?.total ?? 0;

            return (
              <Card key={d.id}>
                <header className="mb-5 flex items-center gap-4 border-b border-hairline pb-5">
                  <Avatar src={d.photoUrl} name={d.displayName} size={72} />
                  <div className="min-w-0">
                    <h2 className="text-[19px] font-semibold tracking-tight text-navy">
                      {d.displayName}
                      {d.title && <span className="ml-2 text-[14px] text-muted">{d.title}</span>}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-[14px] font-medium text-aqua-ink">{d.specialty}</span>
                      <span className="text-[13px] text-muted">· {booked} upcoming</span>
                      {!d.isActive && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </header>

                {d.bio && <p className="text-[13.5px] leading-relaxed text-muted">{d.bio}</p>}

                <div className="mt-5">
                  <div className="text-[13px] text-muted">Working hours</div>
                  {own.length === 0 ? (
                    <p className="mt-2 text-[14px] text-muted">Not scheduled.</p>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {own.map((h) => (
                        <li
                          key={h.id}
                          className="flex items-center justify-between rounded-[12px] bg-powder/60 px-3.5 py-2 text-[13.5px]"
                        >
                          <span className="font-medium text-navy">{WEEKDAYS[h.weekday]}</span>
                          <span className="tabular-nums text-muted">
                            {clockLabel(h.startTime)} – {clockLabel(h.endTime)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-5">
                  <div className="text-[13px] text-muted">Offers</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {svc.length === 0 ? (
                      <span className="text-[14px] text-muted">No services linked</span>
                    ) : (
                      svc.map((s) => <Chip key={s.name}>{s.name}</Chip>)
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
