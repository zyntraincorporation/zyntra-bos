import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Next.js 16: proxy.ts replaces middleware.ts
// Firebase Auth is client-side only, so we use a cookie check.
// AuthContext sets 'puspaloy-auth' cookie on login, clears on logout.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.has('puspaloy-auth');

  // Allow public routes and API routes through
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
