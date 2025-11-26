/**
 * Server-side Authentication API - Status Check
 * GET /api/auth/status
 *
 * Returns current authentication status
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_SITE_PASSWORD || 'fallback-secret-change-me';

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
    const secret = new TextEncoder().encode(JWT_SECRET);

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
