'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch, toActionError } from '@/lib/api';
import type { ActionState } from '@/lib/types';

export async function createProduct(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await apiFetch('/products', {
      method: 'POST',
      body: JSON.stringify({
        name: formData.get('name'),
        sku: formData.get('sku'),
        // The form takes rupees; the API stores paisa.
        priceCents: Math.round(Number(formData.get('price')) * 100),
        stock: Number(formData.get('stock')),
      }),
    });
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath('/dashboard/products');
  return { success: 'Product added' };
}

export async function deleteProduct(id: string): Promise<ActionState> {
  try {
    await apiFetch(`/products/${id}`, { method: 'DELETE' });
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath('/dashboard/products');
}
