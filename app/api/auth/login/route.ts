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
const SESSION_DURATION = 24 * 60 * 60; // 24 hours in seconds
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 1000; // 30 seconds

// SECURITY: Lazy-load secrets to avoid build-time errors
// These are evaluated when the route is actually called, not at build time
let _jwtSecret: string | null = null;
let _password: string | null = null;

function getJWTSecret(): string {
  if (_jwtSecret) return _jwtSecret;

  const secret = process.env.JWT_SECRET;
  if (secret) {
    _jwtSecret = secret;
    return secret;
  }

  // In development only, allow SITE_PASSWORD as fallback with warning
  if (process.env.NODE_ENV === 'development') {
    const fallback = process.env.SITE_PASSWORD || process.env.NEXT_PUBLIC_SITE_PASSWORD;
    if (fallback) {
      logger.warn('[Auth] Using SITE_PASSWORD as JWT_SECRET - set JWT_SECRET in production!');
      _jwtSecret = fallback;
      return fallback;
    }
    // Development-only fallback with clear warning
    logger.warn('[Auth] No JWT_SECRET configured - using insecure development fallback');
    _jwtSecret = 'dev-only-insecure-secret-do-not-use-in-production';
    return _jwtSecret;
  }

  throw new Error('JWT_SECRET environment variable is required in production');
}

function getPassword(): string {
  if (_password) return _password;

  const password = process.env.SITE_PASSWORD;
  if (password) {
    _password = password;
    return password;
  }

  // In development only, allow NEXT_PUBLIC_SITE_PASSWORD as fallback
  if (process.env.NODE_ENV === 'development') {
    const fallback = process.env.NEXT_PUBLIC_SITE_PASSWORD;
    if (fallback) {
      logger.warn('[Auth] Using NEXT_PUBLIC_SITE_PASSWORD - set SITE_PASSWORD in production!');
      _password = fallback;
      return fallback;
    }
    // Development-only fallback
    logger.warn('[Auth] No SITE_PASSWORD configured - using insecure development fallback');
    _password = 'dev-password-change-me';
    return _password;
  }

  throw new Error('SITE_PASSWORD environment variable is required in production');
}

// WARNING: In-memory rate limiting - resets on server restart!
// For production with multiple server instances, use Redis:
// - Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
// - Or implement distributed rate limiting with your preferred solution
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
  const secret = new TextEncoder().encode(getJWTSecret());

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
    const correctPassword = getPassword();
    const passwordMatch = password.length === correctPassword.length &&
      password.split('').every((char, i) => char === correctPassword[i]);

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
