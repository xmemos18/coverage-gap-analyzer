# Deployment Guide

## Vercel Deployment

This project is configured for automatic deployment on Vercel.

### Environment Variables

To enable all features in production, add these environment variables in your Vercel project settings:

#### Required Variables

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

#### Optional Variables

```bash
# Healthcare.gov API (for real marketplace plan data)
# Get free API key: https://developer.cms.gov/marketplace-api/key-request.html
NEXT_PUBLIC_HEALTHCARE_GOV_API_KEY=your_api_key_here
```

**Note:** The app works without the Healthcare.gov API key - it just uses estimated costs instead of real plan data.

### Steps to Deploy

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

2. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add `NEXT_PUBLIC_SITE_URL` with your Vercel domain
   - (Optional) Add `NEXT_PUBLIC_HEALTHCARE_GOV_API_KEY`

3. **Trigger Deployment**
   - Push to main branch
   - Or manually trigger in Vercel dashboard

### Fixing Failed Deployments

If deployments are failing (❌ 0/1 in GitHub):

1. **Check Vercel Build Logs**
   - Go to your Vercel dashboard
   - Click on the failed deployment
   - View the build logs for errors

2. **Common Issues:**
   - Missing environment variables → Add them in Vercel settings
   - Build warnings treated as errors → Disable in `next.config.mjs`
   - TypeScript errors → Run `npm run build` locally to debug

3. **Redeploy**
   - After fixing, go to Vercel dashboard
   - Click "Redeploy" on the failed deployment

### Build Configuration

The project uses these build settings (in `vercel.json`):

```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

### Testing Locally

Before deploying, test the production build locally:

```bash
# Install dependencies
npm install

# Run production build
npm run build

# Start production server
npm start
```

### Deployment Checklist

- [ ] Repository connected to Vercel
- [ ] Environment variables configured
- [ ] Build succeeds locally (`npm run build`)
- [ ] All tests pass (`npm test` if applicable)
- [ ] `.env.local` not committed (in `.gitignore`)
- [ ] API keys secured (not in source code)

## Alternative Deployment Options

### Netlify

1. Connect repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variables in Netlify dashboard

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Self-Hosted

```bash
# Build
npm run build

# Start (production mode)
npm start

# Or use PM2
pm2 start npm --name "coverage-gap-analyzer" -- start
```

## Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules .next
npm install
npm run build
```

### Environment variables not working
- Ensure they start with `NEXT_PUBLIC_` for client-side access
- Restart dev server after adding new variables
- In Vercel, redeploy after adding variables

### Build succeeds locally but fails on Vercel
- Check Node.js version matches (`package.json` engines field)
- Verify all dependencies are in `package.json` (not just devDependencies)
- Check Vercel build logs for specific errors

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Project Issues**: Create an issue on GitHub
