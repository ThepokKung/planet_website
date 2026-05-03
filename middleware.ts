import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/session';

// 1. Specify public routes (everything else is protected)
const publicRoutes = ['/login', '/api/config', '/api/logs'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));

  // Decrypt the session
  const cookie = req.cookies.get('session')?.value;
  let session = null;
  if (cookie) {
    try {
      session = await decrypt(cookie);
    } catch (e) {}
  }

  // Redirect to /login if NOT a public route and NO session
  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // Redirect to /dashboard if logged in and trying to access /login
  if (path === '/login' && session) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ['/((?!api/config|api/logs|_next/static|_next/image|.*\\.png$).*)'],
};
