'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { publicApiFetch, SESSION_COOKIE, toActionError } from '@/lib/api';
import type { ActionState } from '@/lib/types';

export async function login(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const res = await publicApiFetch('/auth/login', {
      email: formData.get('email'),
      password: formData.get('password'),
    });
    await storeSession(res);
  } catch (error) {
    return toActionError(error);
  }
  redirect('/dashboard');
}

export async function register(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const res = await publicApiFetch('/auth/register', {
      companyName: formData.get('companyName'),
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      password: formData.get('password'),
    });
    await storeSession(res);
  } catch (error) {
    return toActionError(error);
  }
  redirect('/dashboard');
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect('/login');
}

/** Copies the JWT the API issued into an httpOnly cookie on the Next.js domain. */
async function storeSession(res: Response) {
  const setCookie = res.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`));
  const token = setCookie?.split(';')[0].split('=')[1];
  if (!token) {
    throw new Error('The API did not return a session');
  }
  const maxAge = Number(/Max-Age=(\d+)/i.exec(setCookie!)?.[1] ?? 86400);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    // Secure by default in production; COOKIE_SECURE=false allows plain-HTTP demos.
    secure: process.env.COOKIE_SECURE
      ? process.env.COOKIE_SECURE === 'true'
      : process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  });
}
