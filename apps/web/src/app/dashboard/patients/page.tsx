import { asc, count, eq } from 'drizzle-orm';
import Link from 'next/link';

import { UsersIcon } from '@/components/icons';
import { Card, EmptyState, StatTile } from '@/components/ui';
import { db } from '@/db';
import { appointments, patients, users } from '@/db/schema';
import { audit } from '@/lib/audit';
import { requireStaff } from '@/lib/auth';
import { formatClinicDate } from '@/lib/time';

export default async function PatientsPage() {
  const staff = await requireStaff();

  // A roster read is still a read of the patients table.
  await audit(staff.id, 'read', 'patients', null);

  const rows = await db
    .select({
      id: patients.id,
      firstName: patients.firstName,
      lastName: patients.lastName,
      dateOfBirth: patients.dateOfBirth,
      phone: patients.phone,
      isSelf: patients.isSelf,
      lastVisitAt: patients.lastVisitAt,
      accountEmail: users.email,
      visits: count(appointments.id),
    })
    .from(patients)
    .innerJoin(users, eq(users.id, patients.accountUserId))
    .leftJoin(appointments, eq(appointments.patientId, patients.id))
    .groupBy(patients.id, users.email)
    .orderBy(asc(patients.lastName), asc(patients.firstName));

  const households = new Set(rows.map((r) => r.accountEmail)).size;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[32px] font-bold tracking-tight text-navy">Patients</h1>
        <p className="mt-1 text-[14px] text-muted">
          Everyone registered with the clinic, including dependents.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          icon={<UsersIcon width={22} height={22} />}
          value={rows.length}
          label={rows.length === 1 ? 'Patient' : 'Patients'}
        />
        <StatTile
          icon={<UsersIcon width={22} height={22} />}
          value={households}
          label={households === 1 ? 'Household' : 'Households'}
        />
        <StatTile
          icon={<UsersIcon width={22} height={22} />}
          value={rows.filter((r) => !r.isSelf).length}
          label="Dependents"
        />
      </div>

      <Card padding="p-0">
        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState>No patients yet.</EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-[14px]">
              <thead>
                <tr className="text-left text-[13px] text-muted">
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Date of birth</th>
                  <th className="px-6 py-4 font-medium">Phone</th>
                  <th className="px-6 py-4 font-medium">Visits</th>
                  <th className="px-6 py-4 font-medium">Last visit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-hairline">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/patients/${r.id}`}
                        className="font-medium text-navy underline-offset-4 transition-colors hover:text-aqua-ink hover:underline"
                      >
                        {r.firstName} {r.lastName}
                      </Link>
                      {!r.isSelf && (
                        <span className="ml-2 rounded-full bg-powder px-2 py-0.5 text-[11px] text-muted">
                          Dependent
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 tabular-nums text-muted">{r.dateOfBirth ?? '—'}</td>
                    <td className="px-6 py-4 text-muted">{r.phone ?? '—'}</td>
                    <td className="px-6 py-4 tabular-nums text-muted">{r.visits}</td>
                    <td className="px-6 py-4 text-muted">
                      {r.lastVisitAt ? formatClinicDate(r.lastVisitAt) : '—'}
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
