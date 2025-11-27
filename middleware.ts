import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// SECURITY: Require proper JWT secret in production - no hardcoded fallbacks
// This must match the secret used in /api/auth/login
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  // In development only, allow fallbacks with warning
  if (process.env.NODE_ENV === 'development') {
    const fallback = process.env.SITE_PASSWORD || process.env.NEXT_PUBLIC_SITE_PASSWORD;
    if (fallback) {
      console.warn('[Middleware] Using SITE_PASSWORD as JWT_SECRET - set JWT_SECRET in production!');
      return fallback;
    }
    // Development-only fallback - must match login route
    console.warn('[Middleware] No JWT_SECRET configured - using insecure development fallback');
    return 'dev-only-insecure-secret-do-not-use-in-production';
  }

  // In production, we can't throw here as middleware runs early
  // Just log and return empty string - auth will fail safely
  console.error('[Middleware] CRITICAL: JWT_SECRET not configured in production!');
  return '';
}

const JWT_SECRET = getJWTSecret();

// Paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout', '/api/auth/status'];

// Check if authentication is enabled (set REQUIRE_AUTH=true to enable)
const REQUIRE_AUTH = process.env.REQUIRE_AUTH === 'true';

async function verifyToken(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload.authenticated === true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if path is public
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

  // Authentication check (only if enabled)
  if (REQUIRE_AUTH && !isPublicPath) {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      // No token, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const isValid = await verifyToken(token);
    if (!isValid) {
      // Invalid or expired token, redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      // Clear invalid token
      response.cookies.delete('auth-token');
      return response;
    }
  }

  // If authenticated and trying to access login page, redirect to home
  if (REQUIRE_AUTH && pathname === '/login') {
    const token = request.cookies.get('auth-token')?.value;
    if (token) {
      const isValid = await verifyToken(token);
      if (isValid) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  // Continue with the request
  const response = NextResponse.next();

  // Add additional security headers
  // Note: These complement the headers in next.config.ts

  // Strict-Transport-Security (HSTS) - enforce HTTPS
  // Only enable in production with HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

// Apply middleware to all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
