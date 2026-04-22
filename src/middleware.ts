import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminToken = request.cookies.get('admin_session')?.value;

  // Allow access to admin login page and auth API without authentication
  if (
    pathname === '/admin/login' ||
    pathname.startsWith('/api/admin/auth/')
  ) {
    return NextResponse.next();
  }

  // Protect admin pages (not API routes - those check auth internally)
  if (pathname.startsWith('/admin')) {
    if (!adminToken) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // For admin API routes, let them handle their own auth
  // (they need to check the session in Supabase which can't be done in middleware)
  if (pathname.startsWith('/api/admin')) {
    const response = NextResponse.next();
    response.headers.set('X-Admin-Api', 'true');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
