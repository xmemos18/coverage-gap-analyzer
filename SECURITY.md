# Security Documentation

## Current Authentication System

### Overview
The Coverage Gap Analyzer currently uses a **client-side authentication** system with NDA acceptance. This is a **temporary solution** and has significant security limitations.

### Components
- `hooks/useAuthentication.ts` - Shared authentication logic
- `components/PasswordGate.tsx` - Site-wide password protection
- `app/login/page.tsx` - Dedicated login page
- `components/NDAModal.tsx` - NDA acceptance flow

### Current Security Measures

#### ✅ Implemented
1. **Rate Limiting**
   - Maximum 5 failed attempts
   - 30-second lockout after max attempts
   - Attempt counter stored in sessionStorage

2. **Session Management**
   - 24-hour session timeout
   - Timestamp-based expiration checking
   - Session stored in sessionStorage (tab-specific)

3. **Password Protection**
   - Environment variable configuration
   - Immediate password clearing from state after validation
   - Password manager support (autocomplete attribute)

4. **UI Security**
   - Lockout countdown display
   - Attempt counter shown to user
   - Disabled form during lockout
   - ARIA attributes for accessibility

5. **NDA Integration**
   - Required scroll-to-bottom
   - Explicit acceptance checkbox
   - Persisted acceptance state

6. **Code Quality**
   - Shared authentication logic (DRY principle)
   - TypeScript type safety
   - React best practices

---

## Critical Security Limitations

### ⚠️ WARNING: This is NOT Production-Ready Authentication

#### 1. Client-Side Password Validation
**Risk Level:** CRITICAL

The password is validated entirely in the browser:
```typescript
const CORRECT_PASSWORD = process.env.NEXT_PUBLIC_SITE_PASSWORD || '1234abcd';
```

**Vulnerabilities:**
- Password is visible in JavaScript bundle
- Can be read using browser DevTools
- Can be bypassed by modifying client-side code
- No server-side validation

**How to Bypass:**
1. Open browser console
2. Run: `sessionStorage.setItem('site-authenticated', 'true')`
3. Reload page
4. Access granted

**Alternative Bypass:**
1. View page source
2. Search JavaScript bundle for password
3. Enter discovered password

#### 2. SessionStorage Authentication
**Risk Level:** HIGH

Authentication state stored in sessionStorage:
```typescript
sessionStorage.setItem('site-authenticated', 'true');
```

**Vulnerabilities:**
- Can be manipulated via browser console
- No cryptographic signing
- No server-side verification
- XSS could steal/modify session data

#### 3. No Server-Side Enforcement
**Risk Level:** CRITICAL

**Current State:**
- Middleware authentication is commented out (`middleware.ts`)
- No API route protection
- No server component verification
- Anyone can access any endpoint directly

**Impact:**
- Direct URL access bypasses PasswordGate
- API endpoints are unprotected
- Data can be accessed without authentication

#### 4. Weak Default Password
**Risk Level:** HIGH

Default password: `1234abcd`
- Only 8 characters
- No special characters
- Common pattern
- Easily guessable

#### 5. Rate Limiting Bypass
**Risk Level:** MEDIUM

Rate limiting uses sessionStorage:
```typescript
sessionStorage.setItem('failed-attempts', count.toString());
```

**Bypass Methods:**
- Clear sessionStorage in console
- Use incognito windows
- Different browsers
- Clear data between attempts

#### 6. No HTTPS Enforcement
**Risk Level:** HIGH (in production)

- No redirect from HTTP to HTTPS
- Passwords transmitted in clear text over HTTP
- Session hijacking possible

---

## Migration Path to Secure Authentication

### Phase 1: Immediate Improvements (Quick Wins)

1. **Move to Environment Variables**
   - ✅ Already implemented
   - Set `NEXT_PUBLIC_SITE_PASSWORD` in `.env.local`
   - Use strong password (16+ characters, symbols, numbers)

2. **Enable Middleware**
   - Uncomment authentication in `middleware.ts`
   - Add cookie-based validation
   - Protect API routes

3. **Add HTTPS Redirect**
   - Force HTTPS in production
   - Add Strict-Transport-Security header

### Phase 2: Server-Side Authentication (Recommended)

#### Option A: NextAuth.js (Recommended)
```bash
npm install next-auth
```

**Features:**
- Built-in OAuth providers
- Secure session management
- JWT tokens
- Database session storage
- CSRF protection

**Implementation:**
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Server-side password validation
        const hashedPassword = await hash(credentials.password);
        if (hashedPassword === process.env.HASHED_PASSWORD) {
          return { id: '1', name: 'Authorized User' };
        }
        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60 // 24 hours
  },
  pages: {
    signIn: '/login'
  }
};

export const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

#### Option B: Supabase Auth
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

**Features:**
- User management
- Email verification
- Password reset
- Social logins
- Row-level security
- Built-in database integration

#### Option C: Clerk
```bash
npm install @clerk/nextjs
```

**Features:**
- Complete user management UI
- Multi-factor authentication
- Social logins
- User profiles
- Organization support

### Phase 3: Enhanced Security Features

1. **Multi-Factor Authentication (MFA)**
   - TOTP (Time-based One-Time Password)
   - SMS verification
   - Biometric authentication

2. **Advanced Rate Limiting**
   - Server-side implementation
   - IP-based blocking
   - Distributed rate limiting (Redis)
   - Progressive delays

3. **Session Security**
   - httpOnly cookies
   - Signed JWT tokens
   - Refresh token rotation
   - Device fingerprinting

4. **Audit Logging**
   - Login attempts (success/failure)
   - IP addresses
   - User agents
   - Session creation/destruction
   - Suspicious activity alerts

5. **Security Headers**
   ```typescript
   // next.config.ts
   headers: [
     {
       key: 'X-Frame-Options',
       value: 'DENY'
     },
     {
       key: 'X-Content-Type-Options',
       value: 'nosniff'
     },
     {
       key: 'Referrer-Policy',
       value: 'strict-origin-when-cross-origin'
     },
     {
       key: 'Permissions-Policy',
       value: 'camera=(), microphone=(), geolocation=()'
     }
   ]
   ```

---

## Recommended Implementation: NextAuth.js

### Step-by-Step Migration

#### 1. Install Dependencies
```bash
npm install next-auth bcryptjs
npm install -D @types/bcryptjs
```

#### 2. Generate Hashed Password
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-secure-password', 10).then(console.log)"
```

#### 3. Update Environment Variables
```env
# Add to .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-random-secret-here
HASHED_PASSWORD=bcrypt-hash-from-step-2
```

#### 4. Create Auth API Route
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Password',
      credentials: {
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.password) return null;

        const isValid = await compare(
          credentials.password,
          process.env.HASHED_PASSWORD || ''
        );

        if (isValid) {
          return { id: '1', email: 'admin@example.com' };
        }
        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60
  },
  pages: {
    signIn: '/login'
  }
});

export { handler as GET, handler as POST };
```

#### 5. Update Root Layout
```typescript
// app/layout.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function RootLayout({ children }) {
  const session = await getServerSession();

  if (!session && !isPublicRoute) {
    redirect('/login');
  }

  return <html>{children}</html>;
}
```

#### 6. Protect API Routes
```typescript
// app/api/protected/route.ts
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Protected logic here
}
```

---

## Security Checklist

### Before Deploying to Production

- [ ] Implement server-side authentication (NextAuth/Supabase/Clerk)
- [ ] Remove client-side password validation
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Set strong NEXTAUTH_SECRET (32+ random characters)
- [ ] Use hashed passwords (bcrypt, scrypt, or argon2)
- [ ] Enable rate limiting at server level
- [ ] Add security headers
- [ ] Implement CSRF protection
- [ ] Enable httpOnly cookies
- [ ] Add session expiration
- [ ] Implement audit logging
- [ ] Test authentication bypass attempts
- [ ] Review all API endpoints for auth
- [ ] Add monitoring and alerts
- [ ] Document authentication flow
- [ ] Train team on security best practices

### Ongoing Security Maintenance

- [ ] Regular security audits
- [ ] Dependency updates (npm audit)
- [ ] Monitor failed login attempts
- [ ] Review access logs
- [ ] Update passwords periodically
- [ ] Test disaster recovery
- [ ] Maintain security documentation

---

## Current Code Security Features

### Rate Limiting Implementation
```typescript
// hooks/useAuthentication.ts
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds

// Tracks attempts in sessionStorage
// Locks out user after MAX_ATTEMPTS
// Countdown timer shows remaining lockout time
```

### Session Expiration
```typescript
const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

// Checks timestamp on every page load
// Auto-expires old sessions
// Clears auth data on expiration
```

### Password Clearing
```typescript
// Password immediately cleared from state after validation
setPassword(''); // Prevents password from staying in React state
```

---

## Reporting Security Issues

If you discover a security vulnerability, please:

1. **DO NOT** open a public GitHub issue
2. Email security concerns privately
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

---

## References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Last Updated:** 2025-11-19
**Version:** 1.0.0
**Status:** Client-Side Auth (⚠️ NOT Production Ready)
