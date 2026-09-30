import type { Metadata } from 'next';
import Link from 'next/link';
import { OrdersTable } from '@/components/orders-table';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { getCurrentUser } from '@/lib/session';
import type { Order, OrderStats, Paginated } from '@/lib/types';

export const metadata: Metadata = { title: 'Overview' };

export default async function OverviewPage() {
  const user = await getCurrentUser();
  const isBuyer = user.role === 'buyer';

  // Independent requests run in parallel.
  const [recent, stats] = await Promise.all([
    apiFetch<Paginated<Order>>('/orders?limit=5'),
    isBuyer ? null : apiFetch<OrderStats>('/orders/stats'),
  ]);

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.fullName.split(' ')[0]}`}
        description={
          isBuyer
            ? `You are ordering from ${user.tenant?.name}.`
            : `Here is how ${user.tenant?.name} is doing.`
        }
      />

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Revenue" value={formatMoney(stats.revenueCents)} />
          <Stat label="Awaiting payment" value={stats.byStatus.pending_payment} />
          <Stat label="To fulfil" value={stats.byStatus.paid} highlight />
          <Stat label="Fulfilled" value={stats.byStatus.fulfilled} />
        </div>
      )}

      <Card
        title={isBuyer ? 'Your recent orders' : 'Recent orders'}
        action={
          <Link
            href={isBuyer ? '/dashboard/products' : '/dashboard/orders'}
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            {isBuyer ? 'Place a new order →' : 'View all →'}
          </Link>
        }
      >
        <OrdersTable orders={recent.data} showBuyer={!isBuyer} />
      </Card>
    </>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold tabular-nums ${
          highlight ? 'text-indigo-600' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
