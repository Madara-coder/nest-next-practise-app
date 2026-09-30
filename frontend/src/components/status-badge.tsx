import { ORDER_STATUS_LABEL } from '@/lib/format';
import type { OrderStatus } from '@/lib/types';

const STYLES: Record<OrderStatus, string> = {
  pending_payment: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  paid: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  fulfilled: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  cancelled: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
