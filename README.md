# Coverage Gap Analyzer

A comprehensive web application that helps people with multiple homes find health insurance that covers them in all locations. Built with Next.js, TypeScript, and Tailwind CSS.

## 🎯 Target Users

- **Retirees & Snowbirds**: Split time between multiple states (e.g., winter in Florida, summer up north)
- **Remote Workers**: Multi-state lifestyle with flexibility to work from anywhere
- **Families**: Multiple residences including vacation homes

## ✨ Features

### 3-Step Coverage Calculator
- **Step 1**: Enter residence information (up to 3 homes with ZIP codes and states)
- **Step 2**: Provide household details (adults, children, ages, Medicare eligibility)
- **Step 3**: Set budget preferences

### Intelligent Recommendation Engine
- Analyzes household composition and locations
- Provides personalized insurance recommendations
- Supports Medicare, Medicare + Medigap, PPO, HMO, and ACA marketplace plans
- Calculates estimated costs (monthly and annual)
- Generates actionable next steps

### Smart Features
- **Auto-save/Resume**: Form data saved to localStorage (24-hour expiration)
- **Real-time Validation**: Green checkmarks for valid fields, error messages for invalid
- **Loading States**: Professional spinner during analysis
- **Alternative Options**: 2-3 alternative plans with pros/cons

### User Experience
- **Mobile-Optimized**: Sticky navigation, larger touch targets, mobile progress bar
- **Interactive Tooltips**: 30+ insurance terms with plain-language explanations
- **Keyboard Navigation**: Shortcuts (Alt+N, Alt+B, etc.) for power users
- **Auto-Save**: Resume where you left off (24-hour expiration)
- **Print/Export**: Print to PDF, export JSON, email results, copy link
- Progress indicator showing current step
- FAQ section on homepage
- Professional layout with excellent color contrast

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Font**: Inter (Google Fonts)
- **Icons**: SVG-based custom icons

## 🎨 Design System

### Colors
- **Primary**: Deep Blue (#1e3a8a)
- **Accent**: Lighter Blue (#3b82f6)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)

### Accessibility
- WCAG AA/AAA compliant color contrast
- Semantic HTML with proper heading hierarchy
- Keyboard navigation support
- Screen reader friendly

## 📁 Project Structure

```
coverage-gap-analyzer/
├── app/                        # Next.js App Router
│   ├── about/                 # About page
│   ├── calculator/            # 3-step calculator form
│   ├── contact/               # Contact page
│   ├── privacy/               # Privacy policy
│   ├── results/               # Results and recommendations
│   ├── layout.tsx             # Root layout with SEO
│   ├── page.tsx               # Homepage
│   ├── globals.css            # Global Tailwind styles
│   ├── favicon.ico            # Browser icon
│   └── icon.svg               # App icon
├── components/                # React components
│   ├── calculator/            # Calculator step components
│   │   ├── Step1Residences.tsx
│   │   ├── Step2Household.tsx
│   │   └── Step3Budget.tsx
│   ├── Navigation.tsx         # Header navigation
│   └── Footer.tsx             # Footer
├── lib/                       # Utilities and logic
│   ├── calculator.ts          # Recommendation engine
│   └── states.ts              # US states data
├── types/                     # TypeScript definitions
│   └── index.ts
└── public/                    # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd coverage-gap-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

```bash
# Development
npm run dev          # Start dev server (hot reload)

# Production
npm run build        # Create optimized production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🧪 Testing the Application

### Test Scenarios

**1. Medicare-Eligible Couple**
- Primary: 33101, FL
- Secondary: 10001, NY
- Adults: 2 (ages 67, 65)
- Expected: Medicare + Medigap recommendation (~$600-1,000/month)

**2. Young Family**
- Primary: 98101, WA
- Secondary: 97201, OR
- Adults: 2 (ages 35, 33), Children: 2 (ages 5, 8)
- Expected: National PPO Family Plan (~$1,800-2,500/month)

**3. Mixed Household**
- Primary: 85001, AZ
- Secondary: 90210, CA
- Adults: 2 (ages 70, 45), Children: 1 (age 10)
- Expected: Medicare for senior + PPO for others

## 🔒 Security

The application implements comprehensive security measures following OWASP best practices.

### Security Headers

**16 security headers** configured in `next.config.ts`:
- ✅ Content Security Policy (CSP)
- ✅ Strict-Transport-Security (HSTS)
- ✅ X-Frame-Options (clickjacking protection)
- ✅ X-Content-Type-Options (MIME sniffing protection)
- ✅ Cross-Origin policies (COEP, COOP, CORP)
- ✅ Permissions-Policy (feature restrictions)
- ✅ And more...

**Expected Scores:**
- Mozilla Observatory: A+
- SecurityHeaders.com: A+

### Input Validation

- ZIP code validation (5 digits)
- Age validation (0-120 years)
- Text sanitization (HTML tag stripping)
- Numeric validation (positive numbers only)

### Additional Protection

- React Error Boundary for graceful error handling
- localStorage with 24-hour expiration
- No sensitive data storage
- Full TypeScript type safety

**📚 See [docs/SECURITY.md](docs/SECURITY.md) for complete security documentation**

## 🔍 SEO & Performance

### SEO Features
- Comprehensive meta tags (title, description, keywords)
- Open Graph tags for social media sharing
- Twitter Card support
- JSON-LD structured data (WebApplication schema)
- Sitemap auto-generated by Next.js
- Proper heading hierarchy (H1 → H2 → H3)

### Performance
- Static page generation for optimal speed
- Code splitting and lazy loading
- Optimized bundle sizes (~102KB shared JS)
- Fast page loads (<1s)

## 📝 Environment Variables

The application uses environment variables for configuration. A template is provided in `.env.example`.

### Setup

1. **Copy the template file**
   ```bash
   cp .env.example .env.local
   ```

2. **Configure your values in `.env.local`**
   ```bash
   # Application Info
   NEXT_PUBLIC_APP_NAME=Coverage Gap Analyzer
   NEXT_PUBLIC_APP_VERSION=1.0.0

   # Feature Flags
   NEXT_PUBLIC_ENABLE_ANALYTICS=false
   NEXT_PUBLIC_ENABLE_DEBUG=true

   # Analytics (if enabled)
   NEXT_PUBLIC_ANALYTICS_ID=

   # Application Limits
   NEXT_PUBLIC_MAX_RESIDENCES=5
   NEXT_PUBLIC_MAX_ADULTS=10
   NEXT_PUBLIC_MAX_CHILDREN=10

   # Session Configuration
   NEXT_PUBLIC_SESSION_TIMEOUT_HOURS=24
   ```

### Available Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_APP_NAME` | Coverage Gap Analyzer | Application name |
| `NEXT_PUBLIC_APP_VERSION` | 1.0.0 | Application version |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | false | Enable analytics tracking |
| `NEXT_PUBLIC_ENABLE_DEBUG` | false | Enable debug mode |
| `NEXT_PUBLIC_ANALYTICS_ID` | - | Analytics ID (GA4, Plausible, etc.) |
| `NEXT_PUBLIC_MAX_RESIDENCES` | 5 | Maximum residences allowed |
| `NEXT_PUBLIC_MAX_ADULTS` | 10 | Maximum adults allowed |
| `NEXT_PUBLIC_MAX_CHILDREN` | 10 | Maximum children allowed |
| `NEXT_PUBLIC_SESSION_TIMEOUT_HOURS` | 24 | Session data expiration |

### Type-Safe Access

Import the `env` object for type-safe access to environment variables:

```typescript
import env from '@/lib/env';

// Access configuration
const maxResidences = env.maxResidences;
const isDebugMode = env.enableDebug;

// Environment detection
if (env.isDevelopment) {
  console.log('Running in development mode');
}
```

### Notes

- All `NEXT_PUBLIC_*` variables are exposed to the browser
- Non-prefixed variables are server-side only
- Values are validated on startup in production
- See `.env.example` for full documentation

## 🚢 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Other Platforms
The app is a standard Next.js application and can be deployed to:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform
- Any platform supporting Node.js

Build command: `npm run build`
Start command: `npm run start`
Node version: 18+

## 📦 Build Output

Production build creates:
- 11 static pages (○ Static)
- Total bundle: ~105KB (homepage)
- All routes pre-rendered for optimal performance

## 🤝 Contributing

This is a production-ready application. To contribute:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (`npm run build`)
5. Submit a pull request

## 📄 License

Copyright 2025 Coverage Gap Analyzer. All rights reserved.

## 🔗 Links

- **Live Demo**: [Add your deployed URL here]
- **Documentation**: This README
- **Issues**: [GitHub Issues]

## ⚙️ Configuration

### Before Production Deployment

1. **Update domain** in `app/layout.tsx`:
   ```typescript
   metadataBase: new URL('https://your-actual-domain.com')
   ```

2. **Create OG image** at `/public/og-image.png` (1200x630px)

3. **Add analytics** (optional):
   - Google Analytics
   - Google Search Console verification

4. **Set up monitoring**:
   - Error tracking (Sentry)
   - Performance monitoring
   - Uptime monitoring

---

Built with ❤️ for people with multi-state lifestyles
