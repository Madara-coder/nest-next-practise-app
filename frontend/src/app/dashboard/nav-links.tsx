'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Role } from '@/lib/types';

const LINKS: { href: string; label: string; roles?: Role[] }[] = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/products', label: 'Products' },
  { href: '/dashboard/orders', label: 'Orders' },
  { href: '/dashboard/team', label: 'Team', roles: ['admin'] },
];

export function NavLinks({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col">
      {LINKS.filter((link) => !link.roles || link.roles.includes(role)).map(
        (link) => {
          const active =
            link.href === '/dashboard'
              ? pathname === link.href
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap ${
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {link.label}
            </Link>
          );
        },
      )}
    </nav>
  );
}
