import { NextRequest, NextResponse } from 'next/server';

const XADM_TOKEN = 'XADM-TOKEN';
const XCTN_TOKEN = 'XCTN-TOKEN';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminToken = request.cookies.get(XADM_TOKEN)?.value;
  const citizenToken = request.cookies.get(XCTN_TOKEN)?.value;

  // Admin panel routes — require auth
  if (pathname.startsWith('/admin-panel')) {
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }
  }

  // Citizen dashboard routes — require auth
  if (pathname.startsWith('/dashboard')) {
    if (!citizenToken) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Guest routes — redirect if already logged in
  if (pathname === '/admin-login') {
    if (adminToken) {
      return NextResponse.redirect(new URL('/admin-panel', request.url));
    }
  }

  if (pathname === '/login') {
    if (citizenToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin-panel/:path*', '/admin-login', '/dashboard/:path*', '/login'],
};

