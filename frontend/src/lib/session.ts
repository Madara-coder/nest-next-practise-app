import 'server-only';

import { redirect } from 'next/navigation';
import { cache } from 'react';
import { apiFetch } from './api';
import type { Role, User } from './types';

/** Current user, fetched once per request no matter how many components ask. */
export const getCurrentUser = cache(() => apiFetch<User>('/auth/me'));

/** Guards a page: non-matching roles are sent back to the dashboard. */
export async function requireRole(...roles: Role[]): Promise<User> {
  const user = await getCurrentUser();
  if (!roles.includes(user.role)) {
    redirect('/dashboard');
  }
  return user;
}
