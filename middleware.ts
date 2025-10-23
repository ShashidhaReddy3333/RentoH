import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { env, hasSupabaseEnv } from './lib/env';
import { createSupabaseMiddlewareClient } from './lib/supabase/middleware';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/messages',
  '/listings/new',
  '/listings/:id/manage',
  '/profile',
  '/favorites',
  '/admin',
  '/admin/:path*'
] as const;
const ADMIN_ROUTES = ['/admin', '/admin/:path*'] as const;
const AUTH_ROUTES = ['/auth/sign-in', '/auth/sign-up'];

const supabaseHost = (() => {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
})();

const connectSrc = [
  "'self'",
  'https://api.mapbox.com',
  'https://events.mapbox.com'
];

if (supabaseHost) {
  connectSrc.push(`https://${supabaseHost}`);
}

const imgSrc = [
  "'self'",
  'data:',
  'blob:',
  'https://images.unsplash.com',
  'https://api.mapbox.com',
  'https://events.mapbox.com',
  'https://*.tiles.mapbox.com'
];

if (supabaseHost) {
  imgSrc.push(`https://${supabaseHost}`);
}

const fontSrc = ["'self'", 'data:', 'https://api.mapbox.com'];
if (supabaseHost) {
  fontSrc.push(`https://${supabaseHost}`);
}

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "object-src 'none'",
  "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
  `connect-src ${connectSrc.join(' ')}`,
  `img-src ${imgSrc.join(' ')}`,
  `font-src ${fontSrc.join(' ')}`,
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "worker-src 'self' blob:",
  "frame-src 'self'",
  "media-src 'self' blob:",
  "manifest-src 'self'",
  'upgrade-insecure-requests'
].join('; ');

const PROTECTED_ROUTE_MATCHERS = PROTECTED_ROUTES.map(compilePattern);
const ADMIN_ROUTE_MATCHERS = ADMIN_ROUTES.map(compilePattern);

const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': csp,
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Permissions-Policy': 'interest-cohort=(), camera=(), microphone=(), geolocation=(), payment=()'
};

function applySecurityHeaders(res: NextResponse) {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.headers.set(key, value);
  });
  return res;
}

export async function middleware(req: NextRequest) {
  if (!hasSupabaseEnv) {
    return applySecurityHeaders(NextResponse.next());
  }

  const { supabase, response } = createSupabaseMiddlewareClient(req);
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  const isProtectedRoute = PROTECTED_ROUTE_MATCHERS.some((matcher) => matcher.test(pathname));
  const isAdminRoute = ADMIN_ROUTE_MATCHERS.some((matcher) => matcher.test(pathname));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (!session && isProtectedRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/auth/sign-in';
    redirectUrl.searchParams.set('next', pathname);
    return applySecurityHeaders(NextResponse.redirect(redirectUrl));
  }

  if (isAdminRoute) {
    const role = req.cookies.get('rento_role')?.value;
    if (role !== 'admin') {
      const redirectUrl = new URL('/auth/sign-in?next=/admin', req.url);
      return applySecurityHeaders(NextResponse.redirect(redirectUrl));
    }
  }

  if (session && isAuthRoute) {
    return applySecurityHeaders(NextResponse.redirect(new URL('/dashboard', req.url)));
  }

  // This will refresh the session cookie if it's expired.
  // It's important to return the response from the client to set the cookie.
  return applySecurityHeaders(response);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};

function compilePattern(pattern: string): RegExp {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const withWildcards = escaped
    .replace(/\\:path\\\*/g, '.*')
    .replace(/\\:[^/]+/g, '[^/]+');
  return new RegExp(`^${withWildcards}`);
}
