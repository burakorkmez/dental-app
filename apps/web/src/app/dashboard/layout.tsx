import { SignOutButton, UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { LogoMark, LogoutIcon } from '@/components/icons';
import { SidebarNav } from '@/components/sidebar-nav';
import { requireStaff } from '@/lib/auth';
import { ApiError } from '@/lib/http';

/**
 * The dashboard's guard lives here rather than in proxy.ts — a resource-based
 * check, next to the data it protects.
 */
export default async function DashboardLayout({ children }: LayoutProps<'/dashboard'>) {
  const { userId } = await auth();
  if (!userId) redirect('/');

  try {
    await requireStaff();
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return <NotStaff />;
    throw err;
  }

  return (
    <div className="min-h-screen lg:pl-[248px]">
      {/* Fixed rail, flush to the left edge of the viewport. */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] flex-col border-r border-hairline bg-white px-5 py-6 lg:flex">
        <Link href="/dashboard" className="flex flex-col items-center gap-2 py-2">
          <LogoMark size={44} />
          <span className="text-[22px] font-bold tracking-tight text-navy">
            Denta<span className="text-aqua">Care</span>
          </span>
        </Link>

        <SidebarNav />

        <div className="mt-auto flex items-center justify-between border-t border-hairline pt-4">
          <SignOutButton>
            <button className="flex items-center gap-2 rounded-full px-2 py-1.5 text-[14px] text-muted transition-colors hover:text-navy">
              <LogoutIcon />
              Log out
            </button>
          </SignOutButton>
          <UserButton />
        </div>
      </aside>

      <main className="mx-auto max-w-[1240px] px-6 py-8">{children}</main>
    </div>
  );
}

function NotStaff() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-5 px-6">
      <div className="card card-floating p-8 text-center">
        <div className="mx-auto w-fit">
          <LogoMark size={52} />
        </div>
        <h1 className="mt-4 text-[26px] font-bold tracking-tight text-navy">Staff access only</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          This account is not a staff member. An admin can grant access by setting{' '}
          <code className="rounded bg-powder px-1.5 py-0.5 text-[13px] text-aqua-ink">
            {'{ "role": "staff" }'}
          </code>{' '}
          in the user&apos;s public metadata in the Clerk dashboard.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <Link
            href="/"
            className="btn-glass rounded-full px-5 py-2.5 text-[15px] font-semibold transition-transform active:scale-[0.98]"
          >
            Back
          </Link>
          <UserButton />
        </div>
      </div>
    </main>
  );
}
