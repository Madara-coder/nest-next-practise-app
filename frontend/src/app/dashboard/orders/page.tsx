import type { Metadata } from 'next';
import Link from 'next/link';
import { OrdersTable } from '@/components/orders-table';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import { ORDER_STATUS_LABEL } from '@/lib/format';
import { getCurrentUser } from '@/lib/session';
import type { Order, OrderStatus, Paginated } from '@/lib/types';

export const metadata: Metadata = { title: 'Orders' };

const FILTERS: (OrderStatus | undefined)[] = [
  undefined,
  'pending_payment',
  'paid',
  'fulfilled',
  'cancelled',
];

export default async function OrdersPage({
  searchParams,
}: PageProps<'/dashboard/orders'>) {
  const { status } = (await searchParams) as { status?: OrderStatus };
  const query = new URLSearchParams({ limit: '50', ...(status && { status }) });

  const [user, orders] = await Promise.all([
    getCurrentUser(),
    apiFetch<Paginated<Order>>(`/orders?${query}`),
  ]);
  const isBuyer = user.role === 'buyer';

  return (
    <>
      <PageHeader
        title={isBuyer ? 'My orders' : 'Orders'}
        description={`${orders.meta.total} order(s)`}
      />

      <nav className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = filter === status;
          return (
            <Link
              key={filter ?? 'all'}
              href={filter ? `/dashboard/orders?status=${filter}` : '/dashboard/orders'}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                active
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {filter ? ORDER_STATUS_LABEL[filter] : 'All'}
            </Link>
          );
        })}
      </nav>

      <Card>
        <OrdersTable orders={orders.data} showBuyer={!isBuyer} />
      </Card>
    </>
  );
}
