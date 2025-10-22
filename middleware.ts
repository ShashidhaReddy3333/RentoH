import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createSupabaseMiddlewareClient } from './lib/supabase/middleware';

const PROTECTED_ROUTES = ['/dashboard', '/messages'];
const AUTH_ROUTES = ['/auth/sign-in', '/auth/sign-up'];

export async function middleware(req: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(req);
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (!session && isProtectedRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/auth/sign-in';
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // This will refresh the session cookie if it's expired.
  // It's important to return the response from the client to set the cookie.
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
