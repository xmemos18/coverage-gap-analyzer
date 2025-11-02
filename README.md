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

# Testing
npm test             # Run unit and component tests (Jest)
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:e2e     # Run end-to-end tests (Playwright)
npm run test:e2e:ui  # Run E2E tests in interactive mode
```

## 🧪 Testing

### Test Suite

The application includes comprehensive testing at multiple levels:

**Unit & Component Tests (Jest + React Testing Library):**
- 179 tests covering business logic and UI components
- Calculator engine tests (recommendation logic, cost calculations)
- Component tests (forms, buttons, validation)
- Utilities and helper function tests

```bash
npm test              # Run all unit and component tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

**End-to-End Tests (Playwright):**
- 53 E2E tests across 5 test suites
- Full user journey testing (calculator flow, results page)
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile device testing (iOS, Android)
- Accessibility testing

```bash
npm run test:e2e      # Run all E2E tests
npm run test:e2e:ui   # Run E2E tests in interactive UI mode
npm run test:e2e:debug # Debug E2E tests step-by-step
```

**Test Coverage:**
- Calculator logic: 5 test suites, 8 tests
- Results page: 13 tests
- Navigation: 8 tests
- Accessibility: 12 tests
- Mobile experience: 12 tests

**See [e2e/README.md](e2e/README.md) for complete E2E testing documentation**

### Manual Test Scenarios

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

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory.

### For Users

- **[User Guide](docs/USER_GUIDE.md)** - Complete guide for using the calculator
  - Step-by-step instructions
  - Understanding your results
  - Saving and sharing
  - FAQ and troubleshooting

### For Developers

- **[Development Guide](docs/DEVELOPMENT.md)** - Setup and development workflow
  - Initial setup and prerequisites
  - Development workflow
  - Code standards and best practices
  - Testing guidelines
  - Common tasks

- **[Architecture Documentation](docs/ARCHITECTURE.md)** - System design and architecture
  - Technology stack
  - Application architecture
  - Data flow and state management
  - Component patterns
  - Performance optimizations
  - Design decisions

- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment
  - Pre-deployment checklist
  - Platform-specific guides (Vercel, Netlify, etc.)
  - Environment configuration
  - Domain setup and SSL
  - Monitoring and rollback

### Feature Documentation

- **[Analytics Integration](docs/ANALYTICS.md)** - Privacy-focused analytics
- **[Security Documentation](docs/SECURITY.md)** - Security features and best practices
- **[Print & Export](docs/PRINT_EXPORT.md)** - Print and export functionality
- **[Tooltips System](docs/TOOLTIPS.md)** - Insurance term tooltips
- **[Mobile UX](docs/MOBILE_UX.md)** - Mobile optimization guide
- **[Security Headers](docs/SECURITY_HEADERS.md)** - HTTP security headers

### Quick Links

| I want to... | See documentation |
|--------------|-------------------|
| Use the calculator | [User Guide](docs/USER_GUIDE.md) |
| Set up development | [Development Guide](docs/DEVELOPMENT.md#initial-setup) |
| Deploy to production | [Deployment Guide](docs/DEPLOYMENT.md) |
| Understand architecture | [Architecture](docs/ARCHITECTURE.md) |
| Add analytics | [Analytics](docs/ANALYTICS.md) |
| Review security | [Security](docs/SECURITY.md) |

**📖 Full documentation index:** [docs/README.md](docs/README.md)

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

## 📊 Analytics (Optional)

The application includes **privacy-focused analytics integration** to track user interactions and improve the product.

### Supported Providers

- **Google Analytics 4 (GA4)** - Industry standard analytics
- **Plausible Analytics** - Privacy-focused, GDPR-compliant alternative

### Quick Setup

**1. Choose a provider and get your analytics ID:**
- GA4: Create property at [analytics.google.com](https://analytics.google.com) → Get Measurement ID (`G-XXXXXXXXXX`)
- Plausible: Create account at [plausible.io](https://plausible.io) → Use your domain

**2. Enable in `.env.local`:**
```bash
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ANALYTICS_ID=G-XXXXXXXXXX  # or yourdomain.com for Plausible
```

**3. Deploy** - The app auto-detects your provider based on the ID format!

### Events Tracked

- Calculator flow: `calculator_started`, `step_completed`, `calculator_completed`
- Results actions: `results_viewed`, `results_printed`, `results_exported`, `results_shared`
- Errors: `error_occurred`
- Data resume: `resume_data_used`

### Privacy

✅ **No personal data collected** (no ZIP codes, ages, or health info)
✅ **IP anonymization** enabled by default
✅ **Optional** - Disabled by default
✅ **GDPR compliant** when using Plausible

**📚 See [docs/ANALYTICS.md](docs/ANALYTICS.md) for complete setup and usage documentation**

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
