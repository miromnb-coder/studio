import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PROTECTED_ROUTES = [
  '/',
  '/chat',
  '/alerts',
  '/history',
  '/profile',
  '/settings',
  '/tasks',
  '/activity',
  '/money',
  '/agents',
  '/copilot',
];

const AUTH_ROUTES = ['/login', '/signup'];

const routeMatches = (pathname: string, routes: string[]) =>
  routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const { supabaseResponse, user } = await updateSession(request);

  if (routeMatches(pathname, AUTH_ROUTES) && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/chat';
    return NextResponse.redirect(redirectUrl);
  }

  if (routeMatches(pathname, PROTECTED_ROUTES) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
