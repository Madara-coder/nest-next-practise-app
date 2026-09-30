import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'access_token';
const AUTH_PAGES = ['/login', '/register'];

/**
 * Optimistic check only (is there a session cookie?). The API still verifies
 * the JWT and the user's role on every request.
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const { pathname } = request.nextUrl;

  if (!hasSession && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (hasSession && AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
