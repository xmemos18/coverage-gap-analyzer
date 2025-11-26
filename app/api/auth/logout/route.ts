/**
 * Server-side Authentication API - Logout
 * POST /api/auth/logout
 *
 * Clears authentication cookies
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    logger.info('[Auth] User logged out');

    const response = NextResponse.json({ success: true });

    // Clear auth cookies by setting them with expired dates
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('nda-accepted', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    logger.error('[Auth] Logout error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
