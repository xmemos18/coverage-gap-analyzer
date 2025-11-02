# Security Documentation

This document explains the security measures implemented in the Coverage Gap Analyzer application.

## 🔒 Security Headers

The application implements comprehensive security headers in `next.config.ts` to protect against common web vulnerabilities.

### Content Security Policy (CSP)

**Purpose:** Prevents Cross-Site Scripting (XSS) attacks by controlling which resources can be loaded.

**Configuration:**
```
default-src 'self'
script-src 'self' 'unsafe-eval' 'unsafe-inline'
style-src 'self' 'unsafe-inline'
img-src 'self' data: blob: https:
font-src 'self' data:
connect-src 'self'
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
object-src 'none'
upgrade-insecure-requests
```

**Notes:**
- `unsafe-inline` and `unsafe-eval` are required for Next.js functionality
- `unsafe-inline` in styles is required for Tailwind CSS
- `upgrade-insecure-requests` automatically upgrades HTTP to HTTPS

### Strict-Transport-Security (HSTS)

**Purpose:** Forces browsers to use HTTPS connections only.

**Value:** `max-age=31536000; includeSubDomains; preload`

**Benefits:**
- Prevents man-in-the-middle attacks
- 1-year cache duration (31536000 seconds)
- Applies to all subdomains
- Eligible for browser preload lists

**Production Note:** Only takes effect over HTTPS. No impact in local development.

### X-Frame-Options

**Purpose:** Prevents clickjacking attacks by controlling iframe embedding.

**Value:** `DENY`

**Protection:** Completely prevents the page from being embedded in iframes.

### X-Content-Type-Options

**Purpose:** Prevents MIME type sniffing attacks.

**Value:** `nosniff`

**Protection:** Forces browsers to respect declared content types.

### X-XSS-Protection

**Purpose:** Enables browser's built-in XSS filter.

**Value:** `1; mode=block`

**Protection:** Blocks page rendering if XSS attack is detected.

**Note:** Modern browsers rely more on CSP, but this provides defense-in-depth.

### Referrer-Policy

**Purpose:** Controls how much referrer information is sent with requests.

**Value:** `strict-origin-when-cross-origin`

**Behavior:**
- Same-origin: Full URL sent
- Cross-origin HTTPS→HTTPS: Origin only
- Cross-origin HTTPS→HTTP: No referrer

### Permissions-Policy

**Purpose:** Controls which browser features can be used.

**Disabled Features:**
- `camera=()`
- `microphone=()`
- `geolocation=()`
- `payment=()`
- `usb=()`
- `magnetometer=()`
- `gyroscope=()`
- `accelerometer=()`
- `interest-cohort=()` (Google FLoC)

**Rationale:** This application doesn't need these features, so they're disabled to reduce attack surface.

### Cross-Origin Embedder Policy (COEP)

**Purpose:** Provides process isolation for cross-origin resources.

**Value:** `credentialless`

**Benefits:**
- Enables SharedArrayBuffer and high-precision timers
- Less strict than `require-corp`, allows credentialless cross-origin loads

### Cross-Origin Opener Policy (COOP)

**Purpose:** Prevents cross-origin attacks through window references.

**Value:** `same-origin`

**Protection:** Isolates browsing context from cross-origin windows.

### Cross-Origin Resource Policy (CORP)

**Purpose:** Controls which origins can load resources.

**Value:** `same-origin`

**Protection:** Only same-origin requests can load resources.

### X-DNS-Prefetch-Control

**Purpose:** Controls DNS prefetching for performance.

**Value:** `on`

**Benefits:** Improves performance by resolving domain names early.

### X-Download-Options

**Purpose:** Prevents download prompt injection (IE-specific).

**Value:** `noopen`

**Protection:** Forces downloads to save before opening.

### X-Permitted-Cross-Domain-Policies

**Purpose:** Restricts Adobe Flash and PDF cross-domain policies.

**Value:** `none`

**Protection:** Prevents Flash/PDF from loading cross-domain content.

## 🛡️ Additional Security Measures

### Input Validation

All user inputs are validated and sanitized:

- **ZIP Codes:** Must be exactly 5 digits
- **Ages:** Validated within acceptable ranges (0-17 for children, 18-120 for adults)
- **Text Inputs:** Sanitized to prevent XSS (HTML tags stripped)
- **Numeric Inputs:** Validated as positive numbers

See `lib/validation.ts` for implementation details.

### localStorage Security

- Data expiration (24 hours)
- JSON parsing with error handling
- Validation before restoration
- No sensitive data stored

See `app/calculator/page.tsx` for implementation.

### Error Handling

- React Error Boundary catches and displays errors gracefully
- Try-catch blocks around all localStorage operations
- User-friendly error messages (no technical details exposed)

### Type Safety

- Full TypeScript coverage
- Strict type checking enabled
- Generic constraints prevent type errors
- Runtime validation complements compile-time checks

## 🔍 Security Testing

### Manual Testing

Test security headers in production:

```bash
curl -I https://your-domain.com
```

Check for all security headers in response.

### Automated Testing

Recommended tools:
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [SecurityHeaders.com](https://securityheaders.com/)
- [OWASP ZAP](https://www.zaproxy.org/)

### Expected Scores

- **Mozilla Observatory:** A or A+
- **SecurityHeaders.com:** A or A+

## 📋 Security Checklist

Before deployment, verify:

- [ ] HTTPS configured (required for HSTS)
- [ ] Environment variables properly set
- [ ] No secrets in client-side code
- [ ] CSP tested with analytics tools (if enabled)
- [ ] Security headers verified in production
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Regular dependency updates scheduled
- [ ] Monitoring and alerting configured

## 🔄 Maintenance

### Regular Updates

1. **Dependencies:** Update monthly
   ```bash
   npm outdated
   npm update
   npm audit fix
   ```

2. **Security Audits:** Run before each deployment
   ```bash
   npm audit
   ```

3. **Next.js Updates:** Follow Next.js security advisories

### Monitoring

Set up monitoring for:
- Failed XSS/injection attempts (CSP violations)
- Unusual error rates
- Performance degradation
- Dependency vulnerabilities

## 🚨 Incident Response

If a security issue is discovered:

1. **Assess Severity:** Determine impact and scope
2. **Immediate Action:** Deploy fix if critical
3. **Communication:** Notify affected users if needed
4. **Post-Mortem:** Document and improve processes
5. **Prevention:** Add tests to prevent regression

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Content Security Policy Reference](https://content-security-policy.com/)

## 🤝 Reporting Security Issues

If you discover a security vulnerability, please:

1. **Do NOT** open a public issue
2. Email security@your-domain.com (update this)
3. Include detailed description and reproduction steps
4. Allow reasonable time for fix before disclosure

---

**Last Updated:** 2025-01-01
**Security Contact:** security@your-domain.com (update this)
