'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { updateOrder } from '@/app/actions/orders';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/card';
import type { ActionState, Order, Role } from '@/lib/types';

const POLL_INTERVAL_MS = 1500;

export function OrderActions({ order, role }: { order: Order; role: Role }) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>();
  const [isPending, startTransition] = useTransition();

  // Payment is confirmed asynchronously by a webhook, so refresh until it lands.
  const awaitingWebhook = order.status === 'pending_payment' && !!order.paymentId;
  useEffect(() => {
    if (!awaitingWebhook) return;
    const timer = setInterval(() => router.refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [awaitingWebhook, router]);

  function run(action: 'pay' | 'cancel' | 'fulfill') {
    startTransition(async () => {
      setState(await updateOrder(order.id, action));
    });
  }

  const canManage = role === 'admin' || role === 'staff';

  return (
    <div className="space-y-3">
      {awaitingWebhook && (
        <p className="flex items-center gap-2 rounded-md bg-sky-50 px-3 py-2 text-sm text-sky-700">
          <span className="size-2 animate-ping rounded-full bg-sky-500" />
          Payment processing — waiting for the provider&apos;s webhook…
        </p>
      )}
      <Alert state={state} />

      {order.status === 'pending_payment' && !order.paymentId && (
        <>
          <Button className="w-full" disabled={isPending} onClick={() => run('pay')}>
            Pay now (test mode)
          </Button>
          <Button
            variant="danger"
            className="w-full"
            disabled={isPending}
            onClick={() => run('cancel')}
          >
            Cancel order
          </Button>
        </>
      )}

      {order.status === 'paid' && canManage && (
        <Button className="w-full" disabled={isPending} onClick={() => run('fulfill')}>
          Mark as fulfilled
        </Button>
      )}

      {order.status === 'paid' && !canManage && (
        <p className="text-sm text-slate-500">Paid — the supplier is preparing your order.</p>
      )}
      {order.status === 'fulfilled' && (
        <p className="text-sm text-slate-500">This order has been fulfilled.</p>
      )}
      {order.status === 'cancelled' && (
        <p className="text-sm text-slate-500">This order was cancelled and its stock released.</p>
      )}
    </div>
  );
}
