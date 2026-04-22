import { NextRequest, NextResponse } from 'next/server';
import { getSessionPayload } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /victim routes
  if (pathname.startsWith('/victim')) {
    const session = await getSessionPayload(request.cookies.get('sb_session')?.value);
    
    // Unauthenticated user trying to access secure victim pages -> login
    if (!pathname.startsWith('/victim/login') && !pathname.startsWith('/victim/register')) {
      if (!session || session.role !== 'VICTIM') {
        return NextResponse.redirect(new URL('/victim/login', request.url));
      }
    }
    
    // Authenticated victim trying to access login/register -> dashboard
    if ((pathname.startsWith('/victim/login') || pathname.startsWith('/victim/register')) && session && session.role === 'VICTIM') {
      return NextResponse.redirect(new URL('/victim/dashboard', request.url));
    }
  }

  // Protect /authority routes
  if (pathname.startsWith('/authority')) {
    const session = await getSessionPayload(request.cookies.get('sb_session')?.value);
    
    // Unauthenticated user trying to access secure authority pages -> login
    if (!pathname.startsWith('/authority/login')) {
      if (!session || session.role !== 'AUTHORITY') {
        return NextResponse.redirect(new URL('/authority/login', request.url));
      }
    }

    // Authenticated authority trying to access login -> dashboard
    if (pathname.startsWith('/authority/login') && session && session.role === 'AUTHORITY') {
      return NextResponse.redirect(new URL('/authority/dashboard', request.url));
    }
  }

  // Protect /api/cases creation
  if (pathname === '/api/cases' && request.method === 'POST') {
    const session = await getSessionPayload(request.cookies.get('sb_session')?.value);
    if (!session || session.role !== 'VICTIM') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/victim/:path*', '/authority/:path*', '/api/cases'],
};
