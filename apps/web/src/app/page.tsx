import { Show, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';

import { CalendarIcon, ClipboardIcon, LogoMark, ToothIcon } from '@/components/icons';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <div className="card card-floating p-9 text-center">
        <div className="mx-auto w-fit">
          <LogoMark size={64} />
        </div>

        <h1 className="mt-5 text-[34px] font-bold tracking-tight text-navy">
          Denta<span className="text-aqua">Care</span>
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          Staff dashboard for the clinic.
          <br />
          Patients use the mobile app.
        </p>

        <div className="my-8 grid grid-cols-3 gap-3">
          <Feature icon={<CalendarIcon />} label="Schedule" />
          <Feature icon={<ClipboardIcon />} label="Records" />
          <Feature icon={<ToothIcon />} label="Post-op notes" />
        </div>

        <Show
          when="signed-in"
          fallback={
            <SignInButton mode="modal">
              <button className="btn-aqua w-full rounded-full px-6 py-3.5 text-[16px] font-semibold transition-transform active:scale-[0.99]">
                Staff sign in
              </button>
            </SignInButton>
          }
        >
          <Link
            href="/dashboard"
            className="btn-aqua block w-full rounded-full px-6 py-3.5 text-[16px] font-semibold transition-transform active:scale-[0.99]"
          >
            Go to dashboard
          </Link>
        </Show>
      </div>
    </main>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="rounded-[var(--radius-tile)] border border-hairline bg-powder/60 px-2 py-4">
      <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white text-aqua-ink">
        {icon}
      </span>
      <div className="mt-2 text-[12.5px] font-medium text-navy">{label}</div>
    </div>
  );
}
