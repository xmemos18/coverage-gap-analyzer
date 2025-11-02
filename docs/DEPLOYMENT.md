# Deployment Guide

Complete guide for deploying the Coverage Gap Analyzer to production.

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Vercel Deployment](#vercel-deployment-recommended)
- [Netlify Deployment](#netlify-deployment)
- [Other Platforms](#other-platforms)
- [Environment Configuration](#environment-configuration)
- [Domain Setup](#domain-setup)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)
- [Rollback Procedures](#rollback-procedures)

## Pre-Deployment Checklist

### 1. Code Quality

```bash
# Run all tests
npm test

# Build successfully
npm run build

# Run linter
npm run lint

# Check TypeScript
npx tsc --noEmit
```

✅ All tests passing
✅ Build completes without errors
✅ No linting errors
✅ No TypeScript errors

### 2. Environment Variables

```bash
# Verify .env.example is up-to-date
diff .env.example .env.local

# Ensure no secrets in .env.example
grep -i "secret\|key\|password" .env.example
```

✅ .env.example has all variables
✅ No secrets in version control
✅ Production values ready

### 3. Content Updates

Update these files before deployment:

**app/layout.tsx:**
```typescript
metadataBase: new URL('https://your-actual-domain.com')
```

**README.md:**
```markdown
- **Live Demo**: https://your-actual-domain.com
```

**public/og-image.png:**
- Create 1200x630px Open Graph image
- Include app name and tagline
- Place in /public/og-image.png

### 4. Analytics Setup (Optional)

**Google Analytics 4:**
1. Create GA4 property at [analytics.google.com](https://analytics.google.com)
2. Get Measurement ID (G-XXXXXXXXXX)
3. Add to environment variables

**Plausible Analytics:**
1. Create account at [plausible.io](https://plausible.io)
2. Add your domain
3. Use domain as analytics ID

### 5. Security Review

✅ Security headers configured (next.config.ts)
✅ Input validation on all forms
✅ XSS prevention in place
✅ No sensitive data in client code
✅ HTTPS enforced

## Vercel Deployment (Recommended)

Vercel is the easiest deployment option for Next.js applications.

### Initial Setup

**1. Install Vercel CLI:**
```bash
npm install -g vercel
```

**2. Login to Vercel:**
```bash
vercel login
```

**3. Deploy:**
```bash
# Navigate to project root
cd coverage-gap-analyzer

# Deploy (follow prompts)
vercel
```

**4. Prompts:**
```
? Set up and deploy "coverage-gap-analyzer"? [Y/n] y
? Which scope? [Your Name]
? Link to existing project? [y/N] n
? What's your project's name? coverage-gap-analyzer
? In which directory is your code located? ./
? Want to override the settings? [y/N] n
```

### Production Deployment

```bash
# Deploy to production
vercel --prod
```

Your site will be live at: `https://coverage-gap-analyzer.vercel.app`

### Environment Variables (Vercel)

**Via CLI:**
```bash
vercel env add NEXT_PUBLIC_ANALYTICS_ID production
# Enter value when prompted
```

**Via Dashboard:**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Settings → Environment Variables
4. Add variables:
   - `NEXT_PUBLIC_ENABLE_ANALYTICS` = `true`
   - `NEXT_PUBLIC_ANALYTICS_ID` = `G-XXXXXXXXXX`

**Redeploy after adding env vars:**
```bash
vercel --prod
```

### Custom Domain (Vercel)

1. Go to Project Settings → Domains
2. Add your domain (e.g., `coveragegapanalyzer.com`)
3. Configure DNS:

**If using Vercel DNS:**
- Vercel will handle everything automatically

**If using external DNS:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: A
Name: @
Value: 76.76.21.21
```

4. Wait for DNS propagation (up to 48 hours)
5. SSL certificate automatically provisioned

## Netlify Deployment

### Via Git Integration

**1. Push to GitHub:**
```bash
git remote add origin <your-repo-url>
git push -u origin main
```

**2. Connect to Netlify:**
1. Go to [app.netlify.com](https://app.netlify.com)
2. New site from Git
3. Choose GitHub
4. Select repository
5. Configure:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: `18`

**3. Environment Variables:**
1. Site settings → Environment variables
2. Add production variables

**4. Deploy:**
- Automatic on git push
- Manual: Click "Trigger deploy"

### Via CLI

**1. Install Netlify CLI:**
```bash
npm install -g netlify-cli
```

**2. Login:**
```bash
netlify login
```

**3. Initialize:**
```bash
netlify init
```

**4. Deploy:**
```bash
# Build locally
npm run build

# Deploy
netlify deploy --prod
```

### Custom Domain (Netlify)

1. Domain settings → Add custom domain
2. Follow DNS configuration instructions
3. SSL certificate auto-provisioned

## Other Platforms

### AWS Amplify

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize
amplify init

# Add hosting
amplify add hosting

# Publish
amplify publish
```

### Railway

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Deploy: `railway up`

### DigitalOcean App Platform

1. Go to [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps)
2. Create App → GitHub
3. Select repository
4. Configure:
   - Build command: `npm run build`
   - Run command: `npm start`
5. Deploy

## Environment Configuration

### Production Environment Variables

**Required:**
```bash
NEXT_PUBLIC_APP_NAME=Coverage Gap Analyzer
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**Optional (Analytics):**
```bash
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ANALYTICS_ID=G-XXXXXXXXXX
NEXT_PUBLIC_ENABLE_DEBUG=false
```

**Optional (Limits):**
```bash
NEXT_PUBLIC_MAX_RESIDENCES=5
NEXT_PUBLIC_MAX_ADULTS=10
NEXT_PUBLIC_MAX_CHILDREN=10
NEXT_PUBLIC_SESSION_TIMEOUT_HOURS=24
```

### Environment File Structure

```
.env.example         # Template (committed to git)
.env.local           # Local development (gitignored)
.env.production      # Production values (not committed)
.env.staging         # Staging values (not committed)
```

## Domain Setup

### DNS Configuration

**Standard Setup (with www):**
```
Type: A
Name: @
Value: [Platform IP]
TTL: 3600

Type: CNAME
Name: www
Value: [Platform domain]
TTL: 3600
```

**Redirect www to apex:**
Most platforms handle this automatically.

### SSL Certificate

**Automatic (Recommended):**
- Vercel, Netlify, Amplify all provide free SSL
- Certificates auto-renew
- HTTPS enforced automatically

**Manual (Let's Encrypt):**
```bash
# Only if self-hosting
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Post-Deployment

### Verification Checklist

✅ **Homepage loads:** `https://yourdomain.com`
✅ **All routes work:**
- `/about`
- `/calculator`
- `/results`
- `/contact`
- `/privacy`

✅ **Calculator functions:**
- Form submission works
- Validation displays errors
- Results page shows recommendations

✅ **Performance:**
- Lighthouse score > 90
- First Load < 3s
- Time to Interactive < 5s

✅ **SEO:**
- Meta tags present
- Open Graph tags work
- Sitemap accessible (`/sitemap.xml`)

✅ **Analytics (if enabled):**
- Events tracked in dashboard
- Page views recorded

✅ **Security:**
- HTTPS enforced
- Security headers present
- Test at [securityheaders.com](https://securityheaders.com)

### Performance Testing

**Lighthouse:**
```bash
# Install
npm install -g lighthouse

# Run
lighthouse https://yourdomain.com --view
```

**Target Scores:**
- Performance: 90+
- Accessibility: 100
- Best Practices: 100
- SEO: 100

**WebPageTest:**
1. Go to [webpagetest.org](https://www.webpagetest.org)
2. Enter your URL
3. Run test
4. Target: Load Time < 3s

### Security Testing

**SSL Test:**
[ssllabs.com/ssltest](https://www.ssllabs.com/ssltest/)
- Target: A+ rating

**Security Headers:**
[securityheaders.com](https://securityheaders.com)
- Target: A+ rating

**OWASP Testing:**
```bash
# Install ZAP
# Run automated scan
# Fix any vulnerabilities found
```

## Monitoring

### Error Tracking

**Sentry Setup (Recommended):**
```bash
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard -i nextjs
```

**Environment variables:**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...
```

### Uptime Monitoring

**Free Options:**
- [UptimeRobot](https://uptimerobot.com) - 50 monitors free
- [Pingdom](https://pingdom.com) - Basic monitoring
- [StatusCake](https://statuscake.com) - 10 tests free

**Setup:**
1. Add your domain
2. Set check interval (5 minutes)
3. Configure alerts (email, SMS)

### Analytics Monitoring

**Google Analytics 4:**
- Real-time users
- Page views
- Event tracking
- User flow

**Plausible:**
- Real-time visitors
- Page views
- Bounce rate
- Top pages

### Performance Monitoring

**Vercel Analytics (Built-in):**
- Automatically enabled
- Real user metrics
- Core Web Vitals
- Performance insights

**Google Search Console:**
1. Add property at [search.google.com/search-console](https://search.google.com/search-console)
2. Verify ownership
3. Submit sitemap
4. Monitor Core Web Vitals

## Rollback Procedures

### Vercel Rollback

**Via Dashboard:**
1. Go to Deployments
2. Find previous working deployment
3. Click "..." → Promote to Production

**Via CLI:**
```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

### Netlify Rollback

**Via Dashboard:**
1. Deploys tab
2. Find previous deployment
3. Click "Publish deploy"

**Via CLI:**
```bash
# List deploys
netlify deploy:list

# Rollback
netlify rollback
```

### Git Rollback

```bash
# Revert last commit
git revert HEAD

# Push
git push origin main

# Automatic redeployment triggered
```

## Troubleshooting

### Build Failures

**Check build logs:**
```bash
# Vercel
vercel logs

# Netlify
netlify logs
```

**Common issues:**
- Node version mismatch → Set Node version in platform settings
- Missing dependencies → Check package.json
- Environment variables → Verify all vars set

### Routing Issues

**404 on refresh:**
- Ensure platform configured for SPA routing
- Vercel: Automatic
- Netlify: Add `_redirects` file

**Missing pages:**
- Check build output
- Verify pages in `app/` directory

### Performance Issues

**Slow load times:**
1. Check bundle size: `npm run build`
2. Optimize images
3. Enable compression (automatic on most platforms)
4. Use CDN (automatic on Vercel/Netlify)

**High server costs:**
- This is a static site → Should be $0 or minimal
- Check for serverless function usage

## Continuous Deployment

### GitHub Actions (Example)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Deployment Strategy

**Staging → Production:**
1. Deploy to staging
2. Test thoroughly
3. Promote to production

**Feature Branches:**
1. Create feature branch
2. Deploy to preview URL
3. Review and test
4. Merge to main
5. Auto-deploy to production

---

**Last Updated:** 2025-01-01
**Version:** 1.0
