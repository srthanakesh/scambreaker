import { NextRequest, NextResponse } from 'next/server';
import { getSessionPayload } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /victim routes
  if (pathname.startsWith('/victim') && !pathname.startsWith('/victim/login') && !pathname.startsWith('/victim/register')) {
    const session = await getSessionPayload(request.cookies.get('sb_session')?.value);
    if (!session || session.role !== 'VICTIM') {
      return NextResponse.redirect(new URL('/victim/login', request.url));
    }
  }

  // Protect /authority routes
  if (pathname.startsWith('/authority') && !pathname.startsWith('/authority/login')) {
    const session = await getSessionPayload(request.cookies.get('sb_session')?.value);
    if (!session || session.role !== 'AUTHORITY') {
      return NextResponse.redirect(new URL('/authority/login', request.url));
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
