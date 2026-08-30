import { desc, eq, inArray } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ArrowLeftIcon, ClipboardIcon, ClockIcon, HeartPulseIcon } from '@/components/icons';
import { Avatar, Card, CardTitle, Chip, EmptyState, Field, LevelMeter, ToggleRow } from '@/components/ui';
import { db } from '@/db';
import {
  appointments,
  dentists,
  medicalHistories,
  patients,
  services,
  users,
  visitNotes,
} from '@/db/schema';
import { audit } from '@/lib/audit';
import { requireStaff } from '@/lib/auth';
import { formatClinicDate, formatClinicTime } from '@/lib/time';

import { AddNoteForm } from './add-note-form';
import { CompleteButton } from './complete-button';

export default async function PatientPage({ params }: PageProps<'/dashboard/patients/[id]'>) {
  const staff = await requireStaff();
  const { id } = await params;

  const [patient] = await db.select().from(patients).where(eq(patients.id, id));
  if (!patient) notFound();

  // The account the patient belongs to — staff need a way to reach the family.
  const [account] = await db.select().from(users).where(eq(users.id, patient.accountUserId));

  // HIPAA posture: a staff read of a patient record and their medical history
  // is auditable, and this is the path that makes it so.
  await audit(staff.id, 'read', 'patients', patient.id);
  await audit(staff.id, 'read', 'medical_histories', patient.id);

  const [history] = await db
    .select()
    .from(medicalHistories)
    .where(eq(medicalHistories.patientId, patient.id));

  const visits = await db
    .select({
      id: appointments.id,
      startsAt: appointments.startsAt,
      status: appointments.status,
      service: services.name,
      dentist: dentists.displayName,
      dentistPhoto: dentists.photoUrl,
    })
    .from(appointments)
    .innerJoin(services, eq(services.id, appointments.serviceId))
    .innerJoin(dentists, eq(dentists.id, appointments.dentistId))
    .where(eq(appointments.patientId, patient.id))
    .orderBy(desc(appointments.startsAt));

  // Scoped to THIS patient's appointments — an unscoped select here would pull
  // every patient's post-op notes into memory.
  const notes = visits.length
    ? await db
        .select()
        .from(visitNotes)
        .where(inArray(visitNotes.appointmentId, visits.map((v) => v.id)))
        .orderBy(desc(visitNotes.createdAt))
    : [];
  const notesFor = (appointmentId: string) => notes.filter((n) => n.appointmentId === appointmentId);

  const initials = `${patient.firstName[0] ?? ''}${patient.lastName[0] ?? ''}`.toUpperCase();
  const meta = [
    patient.dateOfBirth && `DOB ${patient.dateOfBirth}`,
    patient.gender,
    patient.phone,
    patient.isSelf ? 'Account holder' : 'Dependent',
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <Link
          href="/dashboard"
          aria-label="Back to schedule"
          className="btn-glass flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform active:scale-[0.97]"
        >
          <ArrowLeftIcon />
        </Link>

        <span className="btn-aqua flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[20px] font-bold">
          {initials}
        </span>

        <div className="min-w-0">
          <h1 className="truncate text-[30px] font-bold tracking-tight text-navy">
            {patient.firstName} {patient.lastName}
          </h1>
          <p className="mt-0.5 text-[14px] text-muted">{meta.join(' · ')}</p>
        </div>
      </header>

      <Card>
        <CardTitle icon={<ClipboardIcon />}>Intake</CardTitle>
        <dl className="grid gap-6 sm:grid-cols-3">
          <Field label="Primary concern" value={patient.primaryConcern} />
          <Field label="Heard about us" value={patient.referralSource} />
          <Field
            label="Last visit"
            value={patient.lastVisitAt ? formatClinicDate(patient.lastVisitAt) : null}
          />
          <Field label="Gender" value={patient.gender} />
          <Field label="Account email" value={account?.email} />
        </dl>
      </Card>

      <Card>
        <CardTitle icon={<HeartPulseIcon />}>Medical History</CardTitle>
        {history ? (
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-4">
              <ChipGroup label="Allergies" values={history.allergies} />
              <ChipGroup label="Medications" values={history.medications} />
              <ChipGroup label="Conditions" values={history.conditions} />
            </div>

            <div className="space-y-4 md:border-x md:border-hairline md:px-8">
              <ToggleRow label="Smoker" on={history.isSmoker} />
              <ToggleRow label="Pregnant" on={history.isPregnant} />
            </div>

            <div>
              <div className="mb-3 text-[13px] text-muted">Anxiety level</div>
              {history.anxietyLevel == null ? (
                <p className="text-[14px] text-muted">Not recorded</p>
              ) : (
                <LevelMeter value={history.anxietyLevel} />
              )}
              {history.notes && (
                <p className="mt-5 rounded-[14px] bg-powder/70 p-3.5 text-[13px] leading-relaxed text-navy">
                  {history.notes}
                </p>
              )}
            </div>
          </div>
        ) : (
          <EmptyState>Not completed yet — the patient skipped it during onboarding.</EmptyState>
        )}
      </Card>

      <Card>
        <CardTitle icon={<ClockIcon />}>Visit Timeline</CardTitle>
        {visits.length === 0 ? (
          <EmptyState>No appointments yet.</EmptyState>
        ) : (
          <ol className="relative space-y-8 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-hairline">
            {visits.map((v) => (
              <li key={v.id} className="relative pl-7">
                <span className="absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full border-2 border-white bg-aqua shadow-[0_0_0_2px_rgba(36,212,223,0.25)]" />

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="text-[15px] font-semibold text-navy">
                    {formatClinicDate(v.startsAt)}
                  </span>
                  <span className="text-[13px] tabular-nums text-muted">
                    {formatClinicTime(v.startsAt)}
                  </span>
                  <span className="text-[14px] text-navy">{v.service}</span>
                  <span className="flex items-center gap-1.5 text-[13px] text-muted">
                    <Avatar src={v.dentistPhoto} name={v.dentist} size={20} />
                    {v.dentist}
                  </span>
                  <span className="ml-auto flex items-center gap-3">
                    <span className="text-[12px] capitalize text-muted">
                      {v.status.replace('_', ' ')}
                    </span>
                    {v.status === 'booked' && <CompleteButton appointmentId={v.id} />}
                  </span>
                </div>

                {notesFor(v.id).map((n) => (
                  <p
                    key={n.id}
                    className="mt-3 whitespace-pre-wrap rounded-[14px] border border-hairline bg-powder/70 p-4 text-[13.5px] leading-relaxed text-navy"
                  >
                    {n.body}
                  </p>
                ))}

                <AddNoteForm appointmentId={v.id} />
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}

function ChipGroup({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <div className="text-[13px] text-muted">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.length === 0 ? (
          <span className="text-[14px] text-muted">None reported</span>
        ) : (
          values.map((v) => <Chip key={v}>{v}</Chip>)
        )}
      </div>
    </div>
  );
}
