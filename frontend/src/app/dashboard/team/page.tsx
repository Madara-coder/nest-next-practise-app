import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { requireRole } from '@/lib/session';
import type { User } from '@/lib/types';
import { InviteForm } from './invite-form';

export const metadata: Metadata = { title: 'Team' };

export default async function TeamPage() {
  await requireRole('admin');
  const users = await apiFetch<User[]>('/users');

  return (
    <>
      <PageHeader
        title="Team & buyers"
        description="Staff manage the catalog and orders. Buyers can only order and see their own orders."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <Card title={`${users.length} people`}>
          <ul className="-my-5 divide-y divide-slate-100">
            {users.map((user) => (
              <li key={user.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{user.fullName}</p>
                  <p className="truncate text-sm text-slate-500">{user.email}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700">
                    {user.role}
                  </span>
                  <p className="mt-1 text-xs text-slate-400">
                    Joined {formatDate(user.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Add a person" className="self-start">
          <InviteForm />
        </Card>
      </div>
    </>
  );
}
