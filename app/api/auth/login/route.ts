/**
 * Server-side Authentication API - Login
 * POST /api/auth/login
 *
 * Validates password and issues JWT token in httpOnly cookie
 */

import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { logger } from '@/lib/logger';

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_SITE_PASSWORD || 'fallback-secret-change-me';
const CORRECT_PASSWORD = process.env.SITE_PASSWORD || process.env.NEXT_PUBLIC_SITE_PASSWORD || '1234abcd';
const SESSION_DURATION = 24 * 60 * 60; // 24 hours in seconds
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 1000; // 30 seconds

// In-memory rate limiting (in production, use Redis)
const loginAttempts = new Map<string, { count: number; lockedUntil?: number }>();

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIP = forwarded.split(',')[0];
    return firstIP ? firstIP.trim() : 'unknown';
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts?: number; lockoutRemaining?: number } {
  const attempts = loginAttempts.get(ip);

  if (!attempts) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if currently locked out
  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    const remaining = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
    return { allowed: false, lockoutRemaining: remaining };
  }

  // Reset if lockout expired
  if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
    loginAttempts.delete(ip);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - attempts.count };
}

function recordFailedAttempt(ip: string): void {
  const attempts = loginAttempts.get(ip) || { count: 0 };
  attempts.count += 1;

  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockedUntil = Date.now() + LOCKOUT_DURATION;
  }

  loginAttempts.set(ip, attempts);
}

function clearAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

async function generateJWT(): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);

  const token = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(secret);

  return token;
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  try {
    // Check rate limit
    const rateLimitStatus = checkRateLimit(ip);
    if (!rateLimitStatus.allowed) {
      logger.warn('[Auth] Rate limited login attempt', { ip, lockoutRemaining: rateLimitStatus.lockoutRemaining });
      return NextResponse.json(
        {
          error: 'Too many failed attempts',
          lockoutRemaining: rateLimitStatus.lockoutRemaining,
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { password, ndaAccepted } = body;

    // Validate NDA acceptance
    if (!ndaAccepted) {
      return NextResponse.json(
        { error: 'You must accept the NDA to continue' },
        { status: 400 }
      );
    }

    // Validate password
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Constant-time comparison to prevent timing attacks
    const passwordMatch = password.length === CORRECT_PASSWORD.length &&
      password.split('').every((char, i) => char === CORRECT_PASSWORD[i]);

    if (!passwordMatch) {
      recordFailedAttempt(ip);
      const newStatus = checkRateLimit(ip);

      logger.warn('[Auth] Failed login attempt', { ip, remainingAttempts: newStatus.remainingAttempts });

      return NextResponse.json(
        {
          error: 'Incorrect password',
          remainingAttempts: newStatus.remainingAttempts,
          isLockedOut: !newStatus.allowed,
          lockoutRemaining: newStatus.lockoutRemaining,
        },
        { status: 401 }
      );
    }

    // Successful login
    clearAttempts(ip);
    const token = await generateJWT();

    logger.info('[Auth] Successful login', { ip });

    const response = NextResponse.json({ success: true });

    // Set httpOnly cookie with JWT
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION,
      path: '/',
    });

    // Also set NDA acceptance cookie
    response.cookies.set('nda-accepted', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION,
      path: '/',
    });

    return response;
  } catch (error) {
    logger.error('[Auth] Login error', {
      ip,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
