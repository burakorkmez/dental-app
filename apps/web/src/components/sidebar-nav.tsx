'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { CalendarIcon, ToothIcon, UsersIcon } from './icons';

const ITEMS: { href: string; label: string; icon: ReactNode }[] = [
  { href: '/dashboard', label: 'Today', icon: <CalendarIcon /> },
  { href: '/dashboard/patients', label: 'Patients', icon: <UsersIcon /> },
  { href: '/dashboard/dentists', label: 'Dentists', icon: <ToothIcon /> },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-6 flex flex-col gap-1.5">
      {ITEMS.map((item) => {
        // /dashboard must not light up for every child route.
        const active =
          item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-[15px] transition-colors ${
              active
                ? 'border border-aqua/30 bg-powder font-semibold text-aqua-ink'
                : 'text-muted hover:bg-powder/60 hover:text-navy'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
