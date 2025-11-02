# Security Headers Quick Reference

This document provides a quick overview of all security headers configured in the application.

## 📋 Summary

**Total Headers:** 16
**Configuration File:** `next.config.ts`
**Applied To:** All routes (`/:path*`)

## 🛡️ Headers List

| # | Header | Value | Protection |
|---|--------|-------|------------|
| 1 | Content-Security-Policy | See CSP section below | XSS, injection attacks |
| 2 | Strict-Transport-Security | `max-age=31536000; includeSubDomains; preload` | Force HTTPS |
| 3 | X-Frame-Options | `DENY` | Clickjacking |
| 4 | X-Content-Type-Options | `nosniff` | MIME sniffing |
| 5 | X-XSS-Protection | `1; mode=block` | XSS attacks |
| 6 | Referrer-Policy | `strict-origin-when-cross-origin` | Information leakage |
| 7 | Permissions-Policy | See Permissions section | Unwanted features |
| 8 | Cross-Origin-Embedder-Policy | `credentialless` | Process isolation |
| 9 | Cross-Origin-Opener-Policy | `same-origin` | Cross-origin attacks |
| 10 | Cross-Origin-Resource-Policy | `same-origin` | Resource sharing |
| 11 | X-DNS-Prefetch-Control | `on` | Performance |
| 12 | X-Download-Options | `noopen` | Download injection |
| 13 | X-Permitted-Cross-Domain-Policies | `none` | Flash/PDF policies |

## 🔐 Content Security Policy (CSP)

```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https:;
font-src 'self' data:;
connect-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
upgrade-insecure-requests
```

**Directives Explained:**
- `default-src 'self'` - Only load resources from same origin
- `script-src` - Scripts from same origin, inline allowed for Next.js
- `style-src` - Styles from same origin, inline allowed for Tailwind
- `img-src` - Images from same origin, data URIs, blobs, and HTTPS
- `font-src` - Fonts from same origin and data URIs
- `connect-src` - API calls to same origin only
- `frame-ancestors 'none'` - Cannot be embedded in iframes
- `base-uri 'self'` - Base tag restricted to same origin
- `form-action 'self'` - Forms can only submit to same origin
- `object-src 'none'` - No plugins (Flash, etc.)
- `upgrade-insecure-requests` - HTTP → HTTPS automatic upgrade

## 🚫 Permissions Policy

Disabled features:
- `camera=()`
- `microphone=()`
- `geolocation=()`
- `payment=()`
- `usb=()`
- `magnetometer=()`
- `gyroscope=()`
- `accelerometer=()`
- `interest-cohort=()` (FLoC)

## ✅ Verification

### Test in Development

Start dev server and check headers:
```bash
npm run dev
curl -I http://localhost:3000
```

### Test in Production

After deployment:
```bash
curl -I https://your-domain.com
```

### Online Testing Tools

1. **Mozilla Observatory**
   - URL: https://observatory.mozilla.org/
   - Expected: A or A+

2. **SecurityHeaders.com**
   - URL: https://securityheaders.com/
   - Expected: A or A+

3. **CSP Evaluator**
   - URL: https://csp-evaluator.withgoogle.com/
   - Paste CSP to check for issues

## 📊 Browser Support

All headers are supported by modern browsers:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## ⚠️ Important Notes

### HSTS in Development
- HSTS (`Strict-Transport-Security`) only takes effect over HTTPS
- In local development (HTTP), this header is ignored
- No action needed - it works automatically in production

### CSP Considerations
- `unsafe-inline` and `unsafe-eval` in scripts are required for Next.js
- Consider using nonces/hashes for stricter CSP in future
- `unsafe-inline` in styles is required for Tailwind CSS

### Analytics/CDN Integration
If you add external analytics or CDN, update CSP:

```typescript
// Example for Google Analytics
"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com",
"connect-src 'self' https://www.google-analytics.com",
```

## 🔄 Updating Headers

To modify security headers:

1. Edit `next.config.ts`
2. Update the `headers()` async function
3. Rebuild: `npm run build`
4. Test with online tools
5. Deploy

## 📚 References

- [MDN: CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [MDN: HSTS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)
- [OWASP Secure Headers](https://owasp.org/www-project-secure-headers/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

---

**Last Updated:** 2025-01-01
**Configuration Version:** 1.0
