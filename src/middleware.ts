
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 100; // requests
const WINDOW = 60 * 1000; // 1 minute

export function middleware(request: NextRequest) {
  // 1. Rate Limiting for API
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Use x-forwarded-for if ip is missing in types (though it should exist on NextRequest)
    const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();
    const record = rateLimitMap.get(ip) || { count: 0, lastReset: now };

    if (now - record.lastReset > WINDOW) {
      record.count = 0;
      record.lastReset = now;
    }

    record.count++;
    rateLimitMap.set(ip, record);

    if (record.count > LIMIT) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }
  }

  // 2. Admin Authentication
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Skip public assets or login page
    if (request.nextUrl.pathname === '/admin/login' || request.nextUrl.pathname === '/admin/login/verify-2fa' || request.nextUrl.pathname.startsWith('/admin/assets')) {
      return NextResponse.next()
    }

    const session = request.cookies.get('admin_session')

    if (!session) {
      const loginUrl = new URL('/admin/login', request.url);
      // Optional: Add redirect param
      // loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
}
