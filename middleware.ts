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
  'https://events.mapbox.com',
  'https://*.tiles.mapbox.com'
];

if (supabaseHost) {
  connectSrc.push(`https://${supabaseHost}`);
}

const imgSrc = [
  "'self'",
  'data:',
  'blob:',
  'https://images.unsplash.com',
  'https://picsum.photos',
  'https://api.dicebear.com',
  'https://api.mapbox.com',
  'https://events.mapbox.com',
  'https://*.tiles.mapbox.com',
  'https://*.tiles.mapbox.com'
];

if (supabaseHost) {
  imgSrc.push(`https://${supabaseHost}`);
}

const fontSrc = ["'self'", 'data:', 'https://api.mapbox.com'];
if (supabaseHost) {
  fontSrc.push(`https://${supabaseHost}`);
}

const styleSrc = ["'self'", 'https://api.mapbox.com'];
if (supabaseHost) {
  styleSrc.push(`https://${supabaseHost}`);
}

const scriptSrc = ["'self'", 'https://api.mapbox.com', 'https://events.mapbox.com'];
if (supabaseHost) {
  scriptSrc.push(`https://${supabaseHost}`);
}

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "object-src 'none'",
  `style-src ${styleSrc.join(' ')}`,
  `style-src-elem ${styleSrc.join(' ')}`,
  `connect-src ${connectSrc.join(' ')}`,
  `img-src ${imgSrc.join(' ')}`,
  `font-src ${fontSrc.join(' ')}`,
  `script-src ${scriptSrc.join(' ')}`,
  `script-src-elem ${scriptSrc.join(' ')}`,
  "script-src-attr 'none'",
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

const CSRF_COOKIE = 'rento_csrf';

function applySecurityHeaders(req: NextRequest, res: NextResponse) {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.headers.set(key, value);
  });
  ensureCsrfCookie(req, res);
  return res;
}

export async function middleware(req: NextRequest) {
  // Enforce canonical host if NEXT_PUBLIC_SITE_URL is set
  try {
    const siteUrl = env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl) {
      const primaryHost = new URL(siteUrl).host;
      const host = req.nextUrl.hostname;
      // Allow localhost and 127.x during development
      if (host !== primaryHost && host !== 'localhost' && !host.startsWith('127.')) {
        const redirectUrl = new URL(req.url);
        redirectUrl.hostname = primaryHost;
        redirectUrl.protocol = 'https:';
        return applySecurityHeaders(req, NextResponse.redirect(redirectUrl));
      }
    }
  } catch (e) {
    // ignore URL parse errors and continue
  }
  if (process.env["BYPASS_SUPABASE_AUTH"] === "1") {
    return applySecurityHeaders(req, NextResponse.next());
  }
  if (!hasSupabaseEnv) {
    return applySecurityHeaders(req, NextResponse.next());
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
    return applySecurityHeaders(req, NextResponse.redirect(redirectUrl));
  }

  if (isAdminRoute) {
    const role =
      (session?.user?.app_metadata?.["role"] as string | undefined) ??
      (session?.user?.user_metadata?.["role"] as string | undefined);
    if (role !== 'admin') {
      const redirectUrl = new URL('/auth/sign-in?next=/admin', req.url);
      return applySecurityHeaders(req, NextResponse.redirect(redirectUrl));
    }
  }

  if (session && isAuthRoute) {
    return applySecurityHeaders(req, NextResponse.redirect(new URL('/dashboard', req.url)));
  }

  // This will refresh the session cookie if it's expired.
  // It's important to return the response from the client to set the cookie.
  return applySecurityHeaders(req, response);
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

function ensureCsrfCookie(req: NextRequest, res: NextResponse) {
  const existingCookie = req.cookies.get(CSRF_COOKIE)?.value ?? res.cookies.get(CSRF_COOKIE)?.value;
  if (existingCookie) {
    return;
  }

  const value = generateCsrfToken();
  const secure = req.nextUrl.protocol === 'https:';
  res.cookies.set({
    name: CSRF_COOKIE,
    value,
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    secure,
    maxAge: 60 * 60 * 24 * 30
  });
}

function generateCsrfToken(): string {
  const globalCrypto = globalThis.crypto as Crypto | undefined;
  if (globalCrypto?.randomUUID) {
    return globalCrypto.randomUUID().replace(/-/g, '');
  }

  if (globalCrypto?.getRandomValues) {
    const bytes = globalCrypto.getRandomValues(new Uint8Array(32));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}



