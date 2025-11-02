# Architecture Documentation

System architecture and design decisions for the Coverage Gap Analyzer.

## Table of Contents

- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Application Architecture](#application-architecture)
- [Data Flow](#data-flow)
- [Component Architecture](#component-architecture)
- [State Management](#state-management)
- [Routing](#routing)
- [Styling Architecture](#styling-architecture)
- [Testing Strategy](#testing-strategy)
- [Performance Optimizations](#performance-optimizations)
- [Security Architecture](#security-architecture)
- [Deployment Architecture](#deployment-architecture)

## System Overview

Coverage Gap Analyzer is a **client-side web application** that helps people with multiple residences find appropriate health insurance coverage.

### Key Characteristics

- **Static Site Generation (SSG)** - All pages pre-rendered at build time
- **Client-Side Logic** - Recommendation engine runs in browser
- **No Backend Required** - Pure frontend application
- **Privacy-Focused** - No data sent to servers
- **Progressive Enhancement** - Works without JavaScript for basic content

### Target Users

1. **Retirees/Snowbirds** - Multiple seasonal homes
2. **Remote Workers** - Flexible multi-state lifestyle
3. **Families** - Vacation homes and multiple residences

## Technology Stack

### Core Framework

```
Next.js 15 (App Router)
├── React 18
├── TypeScript 5
└── Node.js 18+
```

**Why Next.js 15?**
- Server Components for better performance
- Built-in routing with App Router
- Automatic code splitting
- Image optimization
- Static site generation

### Styling

```
Tailwind CSS 3
├── PostCSS
└── Autoprefixer
```

**Why Tailwind?**
- Utility-first approach
- Consistent design system
- Small production bundle
- Easy responsive design

### Testing

```
Jest 29
├── React Testing Library
├── ts-jest
└── @testing-library/jest-dom
```

**Why Jest + RTL?**
- Industry standard
- Great TypeScript support
- Accessibility-focused testing
- Fast and reliable

### Development Tools

- **ESLint** - Code linting
- **TypeScript** - Type safety
- **Git** - Version control

## Application Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────┐
│           User's Browser                │
│                                         │
│  ┌────────────────────────────────┐   │
│  │      Next.js Application       │   │
│  │                                 │   │
│  │  ┌──────────┐   ┌───────────┐ │   │
│  │  │   UI     │   │ Business  │ │   │
│  │  │Components│◄──┤  Logic    │ │   │
│  │  └──────────┘   └───────────┘ │   │
│  │       │              │         │   │
│  │       ▼              ▼         │   │
│  │  ┌──────────────────────────┐ │   │
│  │  │   State Management       │ │   │
│  │  │   (useReducer + Context) │ │   │
│  │  └──────────────────────────┘ │   │
│  │       │                        │   │
│  │       ▼                        │   │
│  │  ┌──────────────────────────┐ │   │
│  │  │   localStorage           │ │   │
│  │  │   (Client-side only)     │ │   │
│  │  └──────────────────────────┘ │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Optional: Analytics (GA4/Plausible)   │
└─────────────────────────────────────────┘
```

### Layer Architecture

```
┌──────────────────────────────────────┐
│     Presentation Layer               │
│     (app/, components/)              │
│     - Pages                          │
│     - Components                     │
│     - UI Logic                       │
└─────────────┬────────────────────────┘
              │
┌─────────────▼────────────────────────┐
│     Business Logic Layer             │
│     (lib/)                           │
│     - Recommendation Engine          │
│     - Validation                     │
│     - Calculations                   │
└─────────────┬────────────────────────┘
              │
┌─────────────▼────────────────────────┐
│     Data Layer                       │
│     (localStorage, types/)           │
│     - Form Data                      │
│     - Constants                      │
│     - Type Definitions               │
└──────────────────────────────────────┘
```

## Data Flow

### Calculator Flow

```
User Input → Validation → State Update → localStorage
     ↓           ↓             ↓              ↓
  Form UI    Error Msgs   Re-render      Auto-save
```

### Recommendation Flow

```
Form Data
    ↓
Analyze Household (lib/calculator/analyzeHousehold.ts)
    ↓
Determine Insurance Type (lib/calculator/determineInsuranceType.ts)
    ↓
Calculate Costs (lib/calculator/calculateCosts.ts)
    ↓
Generate Recommendations (lib/calculator/generateRecommendations.ts)
    ↓
Format Results
    ↓
Display to User
```

### State Flow

```
User Action
    ↓
Dispatch Action (useReducer)
    ↓
Reducer Updates State
    ↓
Component Re-renders
    ↓
Debounced Save to localStorage (300ms delay)
```

## Component Architecture

### Component Hierarchy

```
app/layout.tsx (Root)
├── Navigation
├── app/page.tsx (Homepage)
│   ├── Hero
│   ├── Features
│   └── FAQ
├── app/calculator/page.tsx
│   ├── MobileProgressBar
│   ├── ErrorBoundary
│   │   ├── Step1Residences
│   │   ├── Step2Household
│   │   ├── Step2_5CurrentInsurance
│   │   └── Step3Budget
│   └── LoadingOverlay
├── app/results/page.tsx
│   ├── ResultsSkeleton (loading)
│   └── ResultsContent
│       ├── RecommendationSummary
│       ├── ShareButtons
│       ├── CurrentInsuranceComparison
│       ├── PersonalizedSuggestions
│       ├── ReasoningSection
│       ├── CostBreakdown
│       ├── NextStepsSection
│       ├── AlternativeOptions
│       └── DisclaimerSection
└── Footer
```

### Component Patterns

**1. Container/Presentational Pattern**
```typescript
// Container (app/calculator/page.tsx)
export default function Calculator() {
  const [state, dispatch] = useReducer(calculatorReducer, initialState);
  // Logic here
  return <Step1Residences {...props} />;
}

// Presentational (components/calculator/Step1Residences.tsx)
export default function Step1Residences({ residences, errors, onUpdate }) {
  // UI only
  return <form>...</form>;
}
```

**2. Custom Hooks Pattern**
```typescript
// Extract reusable logic
function useValidation(formData) {
  const [errors, setErrors] = useState({});
  // Validation logic
  return { errors, validate };
}
```

**3. Composition Pattern**
```typescript
// Build complex UIs from simple components
<FormField label="ZIP Code" error={errors.zip}>
  <Input value={zip} onChange={handleChange} />
</FormField>
```

## State Management

### Strategy

**Local State:** `useState` for component-specific state
**Form State:** `useReducer` for complex form logic
**Global State:** Context API (not currently needed)
**Persistence:** localStorage for auto-save

### Reducer Pattern

```typescript
type Action =
  | { type: 'SET_FIELD'; field: string; value: any }
  | { type: 'SET_ERRORS'; errors: FormErrors }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESET_FORM'; initialData: FormData };

function calculatorReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: action.value,
        },
      };
    // ... other cases
  }
}
```

### State Persistence

```typescript
// Debounced save (300ms delay)
const saveToLocalStorage = useDebouncedCallback(() => {
  if (hasData) {
    saveCalculatorData(STORAGE_KEYS.CALCULATOR_DATA, formData, true);
  }
}, 300);

// Auto-save on every form change
useEffect(() => {
  saveToLocalStorage();
}, [formData]);
```

## Routing

### App Router Structure

```
app/
├── layout.tsx              # Root layout
├── page.tsx                # / (homepage)
├── about/
│   └── page.tsx            # /about
├── calculator/
│   └── page.tsx            # /calculator
├── contact/
│   └── page.tsx            # /contact
├── privacy/
│   └── page.tsx            # /privacy
└── results/
    └── page.tsx            # /results?params=...
```

### URL Parameters (Results Page)

```
/results?
  residenceZips=10001,33101&
  residenceStates=NY,FL&
  numAdults=2&
  adultAges=45,43&
  numChildren=0&
  hasMedicareEligible=false&
  hasCurrentInsurance=false&
  budget=1000-2000
```

**Benefits:**
- Shareable URLs
- Bookmarkable results
- Back button works
- No server required

## Styling Architecture

### Tailwind Configuration

```typescript
// tailwind.config.ts
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1e3a8a',    // Deep blue
        accent: '#3b82f6',      // Bright blue
        success: '#10b981',     // Green
        warning: '#f59e0b',     // Yellow
      },
    },
  },
};
```

### CSS Organization

```
globals.css
├── @layer base       # Base HTML styles
├── @layer components # Reusable component classes
├── @layer utilities  # Utility classes
├── Focus management  # Keyboard/mouse focus styles
├── Mobile styles     # Mobile-specific (@media)
├── Loading states    # Skeleton animations
└── Print styles      # Print media queries
```

### Responsive Design

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Strategy:**
- Mobile-first design
- Tailwind responsive prefixes (md:, lg:)
- Touch-friendly targets (44x44px minimum)

## Testing Strategy

### Test Pyramid

```
        /\
       /  \
      /E2E \     ← Playwright (Future)
     /______\
    /        \
   /Component\  ← Jest + RTL (179 tests)
  /__________\
 /            \
/  Unit Tests  \ ← Jest (Pure functions)
/______________\
```

### Test Coverage

**Current:**
- Unit Tests: Calculator logic, validation, utilities
- Component Tests: UI components, user interactions
- Integration Tests: Multi-component workflows

**Coverage Goals:**
- Overall: 80%+
- Business Logic: 100%
- UI Components: 70%+

### Testing Patterns

```typescript
// AAA Pattern
it('calculates total cost correctly', () => {
  // Arrange
  const formData = { /* ... */ };

  // Act
  const result = calculateTotalCost(formData);

  // Assert
  expect(result).toBe(1500);
});
```

## Performance Optimizations

### Build Optimizations

1. **Static Site Generation** - All pages pre-rendered
2. **Code Splitting** - Automatic route-based splitting
3. **Tree Shaking** - Unused code removed
4. **Minification** - JavaScript and CSS compressed

### Runtime Optimizations

1. **Lazy Loading** - Components loaded on demand
2. **Memoization** - Expensive calculations cached
3. **Debouncing** - localStorage writes throttled (300ms)
4. **Virtual DOM** - React's efficient rendering

### Bundle Analysis

```
First Load JS: 102 kB (shared)
Calculator: +11.1 kB
Results: +10.4 kB
```

**Optimization Targets:**
- First Load JS < 150 kB
- Page-specific JS < 20 kB
- Total page size < 200 kB

## Security Architecture

### Defense Layers

```
1. Input Validation    ← Sanitize all user input
2. XSS Prevention      ← Remove HTML tags, scripts
3. CSP Headers         ← Block inline scripts
4. Type Safety         ← TypeScript prevents bugs
5. HTTPS Only          ← Encrypted connections
```

### Security Headers (16 total)

```typescript
// next.config.ts
headers: [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval'..."
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  },
  // ... 14 more headers
]
```

### Data Privacy

- **No server-side storage** - All data client-side only
- **localStorage only** - 24-hour expiration
- **No tracking** - Analytics opt-in only
- **No PII** - Never collect personal information

## Deployment Architecture

### Static Hosting

```
Build Process
    ↓
Static HTML/CSS/JS Files
    ↓
CDN (Vercel, Netlify, etc.)
    ↓
User's Browser
```

### Build Output

```
.next/
├── static/
│   ├── chunks/           # Code-split bundles
│   └── css/              # Compiled CSS
└── server/
    ├── app/              # Pre-rendered pages
    └── pages/            # Static HTML
```

### Deployment Flow

```
1. git push
2. CI/CD triggered (GitHub Actions, Vercel, etc.)
3. npm install
4. npm run build
5. Deploy to CDN
6. Automatic cache invalidation
7. Site live
```

### Environment Strategy

```
Development  → .env.local      → localhost:3000
Staging      → .env.staging    → staging.domain.com
Production   → .env.production → domain.com
```

## Design Decisions

### Why Static Site?

**Pros:**
- ✅ No server costs
- ✅ Infinite scalability
- ✅ Maximum performance
- ✅ Better SEO
- ✅ Enhanced security

**Cons:**
- ❌ No real-time data
- ❌ No user accounts
- ❌ Limited dynamic features

**Decision:** Static site is perfect for this use case - recommendation engine runs client-side, no backend needed.

### Why useReducer over useState?

**Reasons:**
- Complex form state (8+ fields)
- Multiple state update patterns
- Easier to test
- Better separation of concerns
- Clearer state transitions

### Why localStorage over Cookies?

**Reasons:**
- Larger storage (5-10 MB vs 4 KB)
- No server overhead
- Better privacy (not sent with requests)
- Simpler API
- No GDPR cookie consent needed

### Why App Router over Pages Router?

**Reasons:**
- Future of Next.js
- Server Components support
- Better performance
- Improved layouts
- Cleaner file structure

---

**Last Updated:** 2025-01-01
**Version:** 1.0
