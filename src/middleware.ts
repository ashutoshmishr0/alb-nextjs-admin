// middleware.ts - OPTIMIZED VERSION
import { NextResponse, NextRequest } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:4019';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  

  //PUBLIC ROUTES
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/verify-') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const sessionId = request.cookies.get('sessionId')?.value;
  const userType = request.cookies.get('userType')?.value;
  
  if (pathname === '/') {
    if (!sessionId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    if (userType === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/super-admin-dashboard', request.url));
    } else if (userType === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin-dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ====================
  // REDIRECT IF ALREADY LOGGED IN
  // ====================
  if ((pathname === '/login' || pathname === '/register') && sessionId) {
    if (userType === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/super-admin-dashboard', request.url));
    } else if (userType === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin-dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ====================
  // NO SESSION = REDIRECT TO LOGIN
  // ====================
  if (!sessionId) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  //REAL-TIME SESSION VALIDATION
  try {
    
    // Use existing /me endpoint for validation
    const response = await fetch(`${API_URL}/api/admin/me`, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      cache: 'no-store' 
    });

    
    if (!response.ok) {
      
      // Clear all auth cookies
      const redirectResponse = NextResponse.redirect(new URL('/login?session=expired', request.url));
      redirectResponse.cookies.delete('sessionId');
      redirectResponse.cookies.delete('userType');
      redirectResponse.cookies.delete('userId');
      redirectResponse.cookies.delete('username'); 
      return redirectResponse;
    }

    // Session is valid, get user data
    const userData = await response.json();
    // console.log(`✅ Session valid for: ${userData.username} (${userData.userType})`);
    
    const nextResponse = NextResponse.next();
  
    // Update userType if changed
    if (userData.userType !== userType) {
      // console.log(`🔄 User type updated: ${userType} → ${userData.userType}`);
      nextResponse.cookies.set('userType', userData.userType);
    }

    nextResponse.cookies.set('username', userData.username, {
      httpOnly: false, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return nextResponse; 

  } catch (error) {
    console.error(`Session validation failed:`, error);
    // Allow access if validation fails (fail-open for availability)
    console.log(`Allowing access despite validation failure`);
  }

  // ROLE-BASED ACCESS
  if (userType === 'ADMIN' && pathname.startsWith('/super-admin')) {
    return NextResponse.redirect(new URL('/admin-dashboard', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};