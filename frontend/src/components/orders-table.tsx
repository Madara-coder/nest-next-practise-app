import Link from 'next/link';
import { formatDate, formatMoney } from '@/lib/format';
import type { Order } from '@/lib/types';
import { StatusBadge } from './status-badge';

export function OrdersTable({
  orders,
  showBuyer,
}: {
  orders: Order[];
  showBuyer: boolean;
}) {
  if (orders.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">No orders yet.</p>;
  }

  return (
    <div className="-mx-5 -my-5 overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3">Order</th>
            {showBuyer && <th className="px-5 py-3">Buyer</th>}
            <th className="px-5 py-3">Placed</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-slate-50">
              <td className="px-5 py-3 font-mono text-xs">
                <Link
                  href={`/dashboard/orders/${order.id}`}
                  className="text-indigo-600 hover:underline"
                >
                  #{order.id.slice(0, 8)}
                </Link>
              </td>
              {showBuyer && <td className="px-5 py-3">{order.buyer.fullName}</td>}
              <td className="px-5 py-3 text-slate-500">{formatDate(order.createdAt)}</td>
              <td className="px-5 py-3">
                <StatusBadge status={order.status} />
              </td>
              <td className="px-5 py-3 text-right font-medium tabular-nums">
                {formatMoney(order.totalCents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
