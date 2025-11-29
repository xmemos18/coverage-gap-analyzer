/**
 * Server-side Authentication API - Status Check
 * GET /api/auth/status
 *
 * Returns current authentication status
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { logger } from '@/lib/logger';

// SECURITY: Lazy-load secret to avoid build-time errors
let _jwtSecret: string | null = null;

function getJWTSecret(): string {
  if (_jwtSecret) return _jwtSecret;

  const secret = process.env.JWT_SECRET;
  if (secret) {
    _jwtSecret = secret;
    return secret;
  }

  // In development only, allow SITE_PASSWORD as fallback with warning
  if (process.env.NODE_ENV === 'development') {
    const fallback = process.env.SITE_PASSWORD;
    if (fallback) {
      logger.warn('[Auth Status] Using SITE_PASSWORD as JWT_SECRET - set JWT_SECRET in production!');
      _jwtSecret = fallback;
      return fallback;
    }
    // Development-only fallback with clear warning
    logger.warn('[Auth Status] No JWT_SECRET configured - using insecure development fallback');
    _jwtSecret = 'dev-only-insecure-secret-do-not-use-in-production';
    return _jwtSecret;
  }

  throw new Error('JWT_SECRET environment variable is required in production');
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const ndaAccepted = request.cookies.get('nda-accepted')?.value === 'true';

    if (!token) {
      return NextResponse.json({
        authenticated: false,
        ndaAccepted,
      });
    }

    // Verify JWT
    const secret = new TextEncoder().encode(getJWTSecret());

    try {
      const { payload } = await jwtVerify(token, secret);

      return NextResponse.json({
        authenticated: payload.authenticated === true,
        ndaAccepted,
        expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
      });
    } catch {
      // Token is invalid or expired
      return NextResponse.json({
        authenticated: false,
        ndaAccepted,
        error: 'Session expired',
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        authenticated: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
