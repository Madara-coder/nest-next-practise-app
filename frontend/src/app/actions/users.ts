'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch, toActionError } from '@/lib/api';
import type { ActionState } from '@/lib/types';

export async function inviteUser(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify({
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role'),
      }),
    });
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath('/dashboard/team');
  return { success: 'Team member added' };
}
