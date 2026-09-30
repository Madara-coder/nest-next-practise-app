'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch, toActionError } from '@/lib/api';
import type { ActionState, Order } from '@/lib/types';

export async function placeOrder(
  idempotencyKey: string,
  items: { productId: string; quantity: number }[],
): Promise<ActionState> {
  let order: Order;
  try {
    order = await apiFetch<Order>('/orders', {
      method: 'POST',
      // Retrying the same submission (double click, flaky network) can't create a second order.
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ items }),
    });
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath('/dashboard', 'layout');
  redirect(`/dashboard/orders/${order.id}`);
}

type OrderAction = 'pay' | 'cancel' | 'fulfill';

export async function updateOrder(
  id: string,
  action: OrderAction,
): Promise<ActionState> {
  try {
    await apiFetch(`/orders/${id}/${action}`, { method: 'POST' });
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath('/dashboard', 'layout');
}
