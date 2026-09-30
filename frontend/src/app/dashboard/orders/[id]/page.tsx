import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Card } from '@/components/ui/card';
import { ApiError, apiFetch } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/format';
import { getCurrentUser } from '@/lib/session';
import type { Order } from '@/lib/types';
import { OrderActions } from './order-actions';

export const metadata: Metadata = { title: 'Order details' };

async function getOrder(id: string): Promise<Order> {
  try {
    return await apiFetch<Order>(`/orders/${id}`);
  } catch (error) {
    // 404 = missing or belongs to someone else; 400 = not a valid id.
    if (error instanceof ApiError && [400, 404].includes(error.status)) {
      notFound();
    }
    throw error;
  }
}

export default async function OrderPage({
  params,
}: PageProps<'/dashboard/orders/[id]'>) {
  const { id } = await params;
  const [user, order] = await Promise.all([getCurrentUser(), getOrder(id)]);

  return (
    <>
      <Link href="/dashboard/orders" className="text-sm text-slate-500 hover:text-slate-800">
        ← All orders
      </Link>
      <PageHeader
        title={`Order #${order.id.slice(0, 8)}`}
        description={`Placed ${formatDate(order.createdAt)} by ${order.buyer.fullName}`}
        action={<StatusBadge status={order.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card title="Items">
          <table className="-my-2 min-w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {order.items?.map((item) => (
                <tr key={item.id}>
                  <td className="py-2.5 font-medium text-slate-900">{item.productName}</td>
                  <td className="py-2.5 text-right text-slate-500 tabular-nums">
                    {item.quantity} × {formatMoney(item.unitPriceCents)}
                  </td>
                  <td className="py-2.5 text-right font-medium tabular-nums">
                    {formatMoney(item.quantity * item.unitPriceCents)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td colSpan={2} className="pt-3 font-semibold">
                  Total
                </td>
                <td className="pt-3 text-right text-base font-semibold tabular-nums">
                  {formatMoney(order.totalCents)}
                </td>
              </tr>
            </tfoot>
          </table>
        </Card>

        <Card title="Payment" className="self-start">
          <dl className="mb-4 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Payment ID</dt>
              <dd className="truncate font-mono text-xs">{order.paymentId ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Paid at</dt>
              <dd>{order.paidAt ? formatDate(order.paidAt) : '—'}</dd>
            </div>
          </dl>
          <OrderActions order={order} role={user.role} />
        </Card>
      </div>
    </>
  );
}
