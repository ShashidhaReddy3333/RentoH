import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const isAuthed = req.cookies.get('rento_auth')?.value === '1';
  const protectedPaths = ['/dashboard', '/messages'];

  if (protectedPaths.some((p) => req.nextUrl.pathname.startsWith(p)) && !isAuthed) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/sign-in';
    url.searchParams.set('next', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*', '/messages/:path*'] };
