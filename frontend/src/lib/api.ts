import 'server-only';

import { cookies, headers as nextHeaders } from 'next/headers';
import { redirect } from 'next/navigation';

export const SESSION_COOKIE = 'access_token';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Server-side client for the NestJS API. Forwards the session cookie, so the
 * JWT never has to be readable by browser JavaScript.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const headers = new Headers(init.headers);
  await forwardClientIp(headers);
  headers.set('accept', 'application/json');
  if (init.body) {
    headers.set('content-type', 'application/json');
  }
  if (token) {
    headers.set('cookie', `${SESSION_COOKIE}=${token}`);
  }

  const res = await fetch(`${API_URL}/api${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (res.status === 401 && token) {
    // Expired or invalid session. Server Components cannot delete cookies,
    // so a route handler clears it before sending the user to sign in.
    redirect('/logout');
  }
  if (!res.ok) {
    throw new ApiError(res.status, await errorMessage(res));
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

/** Plain request without the session, used for sign in / register. */
export async function publicApiFetch(path: string, body: unknown) {
  const headers = new Headers({ 'content-type': 'application/json' });
  await forwardClientIp(headers);
  const res = await fetch(`${API_URL}/api${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new ApiError(res.status, await errorMessage(res));
  }
  return res;
}

/**
 * Every API call comes from this server, so pass on the browser's IP.
 * The API trusts this header only from private-network hops.
 */
async function forwardClientIp(headers: Headers) {
  const clientIp = (await nextHeaders()).get('x-forwarded-for');
  if (clientIp) {
    headers.set('x-forwarded-for', clientIp);
  }
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(', ');
    if (body.message) return body.message;
  } catch {
    // Non-JSON error body.
  }
  return `Request failed (${res.status})`;
}

/** Turns any thrown error into a message that is safe to show in a form. */
export function toActionError(error: unknown): { error: string } {
  if (error instanceof ApiError) {
    return { error: error.message };
  }
  throw error; // Let Next.js handle redirects and unexpected errors.
}
