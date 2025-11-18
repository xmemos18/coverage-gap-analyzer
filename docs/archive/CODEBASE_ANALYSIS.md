# Coverage Gap Analyzer - Comprehensive Codebase Analysis

**Project:** Multi-state health insurance recommendation tool built with Next.js  
**Analysis Date:** November 4, 2025  
**Status:** Production-ready with comprehensive features

---

## 1. PROJECT OVERVIEW

### Purpose
A web application helping people with multiple homes (snowbirds, remote workers, families with vacation homes) find health insurance that covers them across all their locations.

### Target Users
- Retirees & Snowbirds (e.g., winter in Florida, summer up north)
- Remote Workers (multi-state lifestyle)
- Families with Multiple Residences

### Key Value Proposition
- Multi-state coverage analysis
- Medicare + non-Medicare household support
- State-specific regulations and costs
- Subsidy eligibility calculations
- Professional recommendations with action items

---

## 2. TECH STACK

### Frontend Framework
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 3.4.14
- **UI Components**: React 18.3.1 with custom components
- **Charts**: Recharts 2.12.7

### Development & Testing
- **Unit/Component Testing**: Jest 30.2.0 + React Testing Library 16.3.0
- **E2E Testing**: Playwright 1.56.1 (5 test suites, 53 tests)
- **Linting**: ESLint 8
- **Build Tool**: Next.js built-in webpack

### Key Dependencies
- @react-pdf/renderer: PDF generation
- recharts: Data visualization
- next: 15.0.0

### Testing Coverage
- **Unit Tests**: 215 passing tests
- **E2E Tests**: 53 tests across Chrome, Firefox, Safari, iOS, Android
- **Test Status**: 100% passing

---

## 3. PROJECT STRUCTURE

```
/coverage-gap-analyzer
├── /app                          # Next.js App Router (14 routes)
│   ├── /about                    # About page
│   ├── /calculator               # Main 5-step calculator form
│   ├── /contact                  # Contact page
│   ├── /faq                      # FAQ (24 Q&As)
│   ├── /privacy                  # Privacy policy
│   ├── /results                  # Results & recommendations
│   ├── layout.tsx                # Root layout with SEO metadata
│   ├── page.tsx                  # Homepage with FAQ
│   ├── globals.css               # Global Tailwind styles
│   └── print.css                 # Print-optimized styles
│
├── /components                   # 35+ React components
│   ├── /calculator               # 5 step components
│   │   ├── Step1Residences.tsx   # Address/ZIP code input
│   │   ├── Step2Household.tsx    # Family composition
│   │   ├── Step2_3HealthProfile.tsx
│   │   ├── Step2_5CurrentInsurance.tsx
│   │   └── Step3Budget.tsx       # Budget preferences
│   ├── /results                  # 16 result display components
│   │   ├── AlternativeOptions.tsx
│   │   ├── CostBreakdown.tsx
│   │   ├── CoverageScoreMeter.tsx
│   │   ├── NextStepsSection.tsx
│   │   ├── PlanComparisonTable.tsx
│   │   ├── SavingsCalculator.tsx # Interactive projections
│   │   └── VisualCostBreakdown.tsx
│   ├── /charts                   # Chart components
│   ├── Navigation.tsx            # Header navigation
│   ├── Footer.tsx                # Footer
│   ├── PDFReport.tsx             # PDF generation
│   ├── ErrorBoundary.tsx         # Error handling
│   ├── Toast.tsx                 # Notifications
│   ├── Tooltip.tsx               # Insurance term tooltips (30+)
│   └── + 20 more utility components
│
├── /lib                          # Business logic (23 files)
│   ├── /calculator               # Recommendation engine
│   │   ├── index.ts              # Main analysis function
│   │   ├── recommendations.ts    # Medicare/mixed/non-Medicare logic
│   │   ├── alternatives.ts       # Alternative plan generation
│   │   ├── subsidyCalculator.ts  # Subsidy eligibility
│   │   ├── employerComparison.ts # Employer plan analysis
│   │   ├── medicareAdvantageHelper.ts
│   │   ├── cobraHelper.ts        # COBRA analysis
│   │   ├── hsaCalculator.ts      # HSA tax benefits
│   │   └── comparison.ts         # Current insurance comparison
│   ├── /tests                    # Unit tests
│   ├── analytics.ts              # GA4/Plausible integration
│   ├── constants.ts              # 250+ magic numbers (centralized)
│   ├── validation.ts             # Input validation & sanitization
│   ├── validationMessages.ts     # User-friendly error messages
│   ├── stateSpecificData.ts      # All 50 states + DC data
│   ├── env.ts                    # Environment configuration
│   ├── localStorage.ts           # Session persistence
│   ├── logger.ts                 # Structured logging
│   ├── insurance-terms.ts        # 30+ term definitions
│   ├── insuranceGlossary.ts      # Plain English explanations
│   ├── plainEnglish.ts           # Simplification utilities
│   ├── costUtils.ts              # Cost calculation helpers
│   └── more utility modules
│
├── /hooks                        # Custom React hooks (9 files)
│   ├── useInsuranceAnalysis.ts   # Main calculation trigger
│   ├── useCalculatorPersistence.ts # Auto-save/resume
│   ├── useFormValidation.ts      # Form validation logic
│   ├── useToast.tsx              # Toast notifications
│   ├── useKeyboardNavigation.ts  # Keyboard shortcuts
│   ├── useFocusManagement.ts     # Accessibility
│   └── more hooks
│
├── /types                        # TypeScript definitions
│   └── index.ts                  # All interfaces (15+ types)
│
├── /public                       # Static assets
│   ├── favicon.ico
│   └── icons
│
├── /e2e                          # Playwright E2E tests
├── /docs                         # User & developer docs
└── Configuration files
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── tailwind.config.ts
    └── jest.config.ts
```

---

## 4. DATA STRUCTURES & TYPES

### Core Types (types/index.ts)

#### 4.1 User Input Data
```typescript
Residence {
  zip: string;              // 5-digit ZIP code
  state: string;            // US state code (e.g., "CA")
  isPrimary: boolean;       // Primary residence flag
  monthsPerYear: number;    // 1-12 months
}

CurrentInsurance {
  carrier: string;          // Insurance company name
  planType: string;         // HMO, PPO, Medicare Advantage, etc.
  monthlyCost: number;
  deductible: number;
  outOfPocketMax: number;
  coverageNotes: string;
}

CalculatorFormData {
  // Step 1: Residences
  residences: Residence[];  // Array for 1-5 properties
  
  // Step 2: Household
  numAdults: number;
  adultAges: number[];      // Array of ages for each adult
  numChildren: number;
  childAges: number[];      // Array of ages for each child
  hasMedicareEligible: boolean;
  
  // Step 2.1: Employment
  hasEmployerInsurance: boolean;
  employerContribution: number;
  
  // Step 2.3: Health Profile
  hasChronicConditions: boolean;
  chronicConditions: string[];
  prescriptionCount: string; // "none" | "1-3" | "4-or-more"
  providerPreference: string; // "any" | "specific-doctors"
  
  // Step 2.5: Current Insurance
  hasCurrentInsurance: boolean;
  currentInsurance: CurrentInsurance;
  
  // Step 3: Budget
  budget: string;           // "less-500" | "500-1000" | etc.
  incomeRange: string;      // For subsidy calculation
  
  // UI State
  currentStep: number;      // 1-5
  simpleMode: boolean;      // Skip optional questions
}
```

#### 4.2 Recommendation Output
```typescript
InsuranceRecommendation {
  recommendedInsurance: string;        // "Medicare + Medigap", "PPO", etc.
  householdBreakdown: string;          // "2 adults, 1 child"
  estimatedMonthlyCost: CostRange;     // { low: X, high: Y }
  coverageGapScore: number;            // 0-100
  reasoning: string;                   // Why this recommendation
  actionItems: string[];               // Concrete next steps
  alternativeOptions: AlternativeOption[];
  
  subsidyAnalysis?: SubsidyAnalysis;
  employerPlanAnalysis?: EmployerPlanAnalysis;
  currentInsuranceSummary?: string;
  costComparison?: {
    current: number;
    recommended: CostRange;
    monthlySavings?: number;
    annualSavings?: number;
  };
  suggestions?: Suggestion[];
}

AlternativeOption {
  name: string;                        // "Medicare Advantage", "HDHP", etc.
  monthlyCost: CostRange;
  coverageScore: number;               // 0-10 scale
  pros: string[];
  cons: string[];
}

SubsidyAnalysis {
  medicaidEligible: boolean;
  subsidyEligible: boolean;
  estimatedMonthlySubsidy: number;
  estimatedAfterSubsidyCost: CostRange;
  fplPercentage: number;               // % of federal poverty level
  explanation: string;
  subsidyActionItems: string[];
}
```

---

## 5. CURRENT FEATURES & FUNCTIONALITY

### 5.1 Core Calculator (5-Step Flow)

**Step 1: Residences**
- Add 1-5 residential properties
- ZIP code validation (5 digits, no 00000, no all-same-digits)
- State selection
- Months per year at each residence (1-12)
- Validates total months ≤ 12

**Step 2: Household**
- Number of adults (1-10) and their ages
- Number of children (0-10) and their ages
- Medicare eligibility detection (age ≥ 65)
- Employment insurance details
- Optional: Health profile, current insurance, income

**Step 3 (Optional): Health Profile**
- Chronic conditions (yes/no + specific conditions)
- Prescription count (none, 1-3, 4-or-more)
- Provider preference (any doctor vs. specific doctors)

**Step 4 (Optional): Current Insurance**
- Current carrier name
- Plan type (HMO, PPO, Medicare Advantage, etc.)
- Monthly cost, deductible, out-of-pocket max
- Coverage notes

**Step 5: Budget & Income**
- Monthly budget (less-500, 500-1000, 1000-2000, etc.)
- Household income range (for subsidy eligibility)
- Simple vs. advanced mode toggle

### 5.2 Recommendation Engine

**Three Main Scenarios:**

1. **Medicare-Only Households** (all adults 65+)
   - Recommends: Original Medicare + Medigap (Plan G or N)
   - Alternatives: Medicare Advantage, Medicare Supplement Plan N
   - Cost Range: $300-500/person/month
   - Coverage Score: 90/100

2. **Mixed Households** (some 65+, some younger)
   - Recommends: Medicare for seniors + National PPO for younger
   - Handles: Separate plans for different age groups
   - Alternatives: Medicare Advantage + PPO, ACA Marketplace
   - Cost Calculation: Per-person costs summed

3. **Non-Medicare Households** (all under 65)
   - Recommends: National PPO, ACA Marketplace, or HDHP+HSA
   - Considers: Single adults, couples, families
   - Alternatives: Regional PPO, ACA plans, HDHP

### 5.3 Advanced Features

**Subsidy Analysis**
- Federal poverty level (FPL) calculations
- Premium tax credit eligibility
- Medicaid vs. Marketplace determination
- Income-based cost projections

**Employer Insurance Comparison**
- Affordability check (9.12% of income threshold)
- Cost vs. marketplace analysis
- Recommendation: Keep employer or switch to marketplace

**State-Specific Intelligence**
- Cost multipliers for all 50 states + DC
- Medicaid expansion status
- State exchange information
- Special programs (NY Essential Plan, MA ConnectorCare, CA subsidies)
- Multi-state coordination tips

**Alternative Plan Generation**
- Medicare Advantage analysis
- COBRA worthiness calculator
- HSA tax benefit projections
- HDHP vs. PPO comparison

### 5.4 User Experience Features

**Auto-Save & Resume**
- Form data persisted to localStorage
- 24-hour expiration
- Resume prompt on return visit
- Clear & reset options

**Form Validation**
- Real-time validation with green checkmarks
- ZIP code validation (prevents invalid formats)
- Age validation (0-120 years)
- Family composition validation (at least 1 adult)
- Numeric input sanitization

**UI/UX Polish**
- Progress indicator (Step X of 5)
- Mobile-responsive design
- Sticky navigation
- Loading spinner during analysis
- Toast notifications
- Keyboard shortcuts (Alt+N, Alt+B, Alt+S, Alt+C)
- Keyboard accessibility

**Results Display**
- Coverage gap score (0-100)
- Estimated monthly cost range
- Detailed reasoning in plain English
- Action items (concrete next steps)
- Alternative options with pros/cons
- Plan comparison tables
- Savings calculator with projections
- Visual cost breakdowns

**Print & Export**
- Print-friendly CSS (@media print rules)
- PDF report generation (client-side)
- JSON export option
- Share results via link
- Email results

### 5.5 Information & Education

**Insurance Tooltips**
- 30+ insurance term definitions
- Plain-language explanations
- Interactive hover/tap tooltips
- Accessible (ARIA labels)
- Mobile-friendly

**FAQ Page**
- 24 comprehensive Q&As
- 7 categories (multi-state coverage, Medicare, costs, enrollment, coverage details, special situations, Medigap)
- Search functionality
- Category filtering
- Interactive accordion UI

**Glossary & Plain English**
- Insurance industry terms in plain English
- Benefit explanations
- Process simplifications

---

## 6. DATA STORAGE PATTERNS

### 6.1 Client-Side Storage

**localStorage**
```typescript
// Key: "coverage-calculator-data"
{
  formData: CalculatorFormData,    // User inputs
  timestamp: number,               // Expiry tracking (24 hours)
  version: number
}
```

**Persistence Layer**: `lib/localStorage.ts`
- `saveCalculatorData(data)` - Auto-save form
- `loadCalculatorData()` - Resume session
- `clearCalculatorData()` - Manual reset
- `isDataRecent(timestamp)` - Check 24-hour expiration

### 6.2 In-Memory Data

**State Management**
- Redux-style reducer pattern
- `CalculatorState` with form data + errors + loading
- `CalculatorAction` for state updates
- No external state management (built-in React hooks)

**Session Data**
- No sensitive data stored
- Only user preferences and form responses
- ZIP codes, ages, budget ranges (non-sensitive)

### 6.3 Configuration Data

**Centralized Constants** (`lib/constants.ts`)
```typescript
INSURANCE_COSTS {
  MEDICARE_PER_PERSON_LOW: 300,
  ADULT_PPO_LOW: 600,
  CHILD_LOW: 300,
  FAMILY_BASE_LOW: 1800,
  // ... 20+ cost constants
}

COVERAGE_SCORES {
  SINGLE_STATE: 90,
  ADJACENT_STATES: 75,
  MEDICARE_SCORE: 90,
  // ... 8 coverage score constants
}

BUDGET_RANGES {
  'less-500': 500,
  '500-1000': 1000,
  // ... 5 budget ranges
}
```

**State-Specific Data** (`lib/stateSpecificData.ts`)
```typescript
STATE_DATA: Record<string, StateInsuranceData> {
  AL: { costMultiplier: 0.85, hasMedicaidExpansion: false, ... },
  AK: { costMultiplier: 1.45, hasMedicaidExpansion: true, ... },
  // ... all 50 states + DC
}
```

**Environment Configuration** (`lib/env.ts`)
```typescript
{
  appName: string,
  appVersion: string,
  enableAnalytics: boolean,
  enableDebug: boolean,
  analyticsId: string,
  maxResidences: number,
  maxAdults: number,
  maxChildren: number,
  sessionTimeoutHours: number
}
```

### 6.4 Data Flow

```
User Input
    ↓
[Validation Layer] → sanitizeTextInput, validateZipCode, validateAge
    ↓
[Form State] → CalculatorReducer → formData
    ↓
[localStorage] → Auto-save every 1000ms (debounced)
    ↓
[Analytics] → Track user actions (calculator_started, step_completed, etc.)
    ↓
[Calculation Engine] → analyzeInsurance(formData)
    ├─ Route to appropriate scenario (Medicare/Mixed/NonMedicare)
    ├─ Calculate costs (base + state adjustments)
    ├─ Generate action items
    ├─ Create alternative options
    └─ Optional: Subsidy & employer analysis
    ↓
[Results Display] → InsuranceRecommendation shown on /results page
    ↓
[Export] → Print, PDF, JSON, Email, Share link
```

---

## 7. USER INPUT HANDLING

### 7.1 Input Flow

```
HTML Input
    ↓
[onChange Handler] → dispatch({ type: 'SET_FIELD', field, value })
    ↓
[Validation Functions]
    ├─ validateZipCode(zip) → Check format
    ├─ validateAge(age, min, max) → Check range
    ├─ validateAdultAge(age) → 18-120
    ├─ validateChildAge(age) → 0-17
    └─ validateCarrierName(name) → Check length
    ↓
[Sanitization]
    ├─ sanitizeTextInput(str) → Remove <>, javascript:, event handlers
    ├─ sanitizeNumericInput(val, min, max) → Clamp to range
    └─ sanitizeCoverageNotes(notes) → Remove dangerous patterns
    ↓
[Reducer Update] → formData updated with sanitized value
    ↓
[Error Clearing] → Errors removed when field updated
    ↓
[UI Display]
    ├─ Green checkmark if valid
    ├─ Error message if invalid
    └─ Field hint explaining requirement
    ↓
[localStorage Auto-Save] → Saved every 1000ms (debounced)
```

### 7.2 Validation Rules

**ZIP Codes**
- Must be exactly 5 digits
- Reject 00000 (obviously invalid)
- Reject patterns like 11111, 22222 (except valid ones)
- Remove non-digit characters

**Ages**
- Adults: 18-120 years
- Children: 0-17 years
- Medicare eligibility: ≥65 years
- Must be integers

**Household Composition**
- Minimum 1 adult required
- Maximum 10 adults, 10 children
- At least 1 residence required
- Maximum 5 residences

**Time Distribution**
- Each residence: 1-12 months/year
- Total across all residences: ≤12 months/year
- Non-negative values only

**Monetary Values**
- Non-negative numbers only
- Maximum $1,000,000 (prevent unrealistic values)
- Currency amounts: Rounded to 2 decimals
- Monthly costs: Clamped to realistic range

**Insurance Details**
- Carrier name: 2-100 characters
- Plan type: Selected from dropdown (HMO, PPO, Medicare Advantage, etc.)
- Deductible/OOP Max: 0-$50,000

### 7.3 Error Messages

Messages stored in `lib/validationMessages.ts` with user-friendly explanations:
- "ZIP code must be exactly 5 digits"
- "Age must be between 18 and 120 years"
- "Please add at least one adult to your household"
- "Total time across all residences cannot exceed 12 months per year"

---

## 8. INSURANCE TYPES & COVERAGE ANALYSIS

### 8.1 Plan Types Supported

**Medicare Plans**
- Original Medicare (Parts A, B, D)
- Medicare Advantage (Part C)
- Medigap/Medicare Supplement (Plans G, N, etc.)
- Long-term care coordination

**Non-Medicare Plans**
- PPO (Preferred Provider Organization)
- HMO (Health Maintenance Organization)
- EPO (Exclusive Provider Organization)
- HDHP (High Deductible Health Plan) + HSA

**Special Situations**
- ACA Marketplace plans (Bronze, Silver, Gold, Platinum)
- Employer-sponsored insurance
- COBRA continuation coverage
- Medicaid (free/low-cost for low-income)
- Regional PPO (for adjacent states)

### 8.2 Coverage Gap Analysis

**Multi-State Coverage Assessment**
```
Coverage Score = function(states, household_type)

Single State: 90/100
Adjacent States (2): 75/100
Mixed Regions (2-4): 85/100
Many States (5+): 80/100

Plus adjustments for:
- Medicare eligibility (+5 if using Medicare)
- Network coverage (-10 for regional/state-limited plans)
- Out-of-network access (+5 for PPO/flexible plans)
```

**Gaps Identified**
1. **Geographic Gaps** - State-limited plans don't cover secondary residence
2. **Coverage Type Gaps** - Different insurance types needed for different family members
3. **Cost Gaps** - Budget-based recommendations vs. needed coverage
4. **Subsidy Gaps** - Income-based eligibility limitations
5. **Enrollment Gaps** - Seasonal timing for snowbirds

### 8.3 Cost Analysis

**Base Costs (Monthly)**
```
Medicare eligible: $300-500/person
Non-Medicare adult: $600-900/person
Child: $300-400/person
Medicare Advantage: $0-150/person
Medigap Plan N: $250-400/person
ACA Adult: $400-800/person
HDHP: $350-600/person
```

**State Adjustments**
```
Alaska: 1.45x (most expensive)
Connecticut: 1.25x
New York: 1.30x
California: 1.15x
Colorado: 1.05x
Average: 1.0x
Texas: 0.92x
Alabama: 0.85x (least expensive)
```

**Subsidy Impact**
```
Low income (100-200% FPL): 50-80% cost reduction possible
Middle income (200-300% FPL): 10-50% reduction
Higher income (>400% FPL): No subsidies available
```

### 8.4 Recommendation Logic

**Decision Tree**
```
Is household Medicare-eligible (65+)?
  ├─ ALL adults 65+?
  │  └─ Recommend: Medicare + Medigap
  │     Alternatives: Medicare Advantage, Supplement Plan N
  │
  ├─ SOME adults 65+?
  │  └─ Recommend: Medicare for seniors + PPO for others
  │     Alternatives: Medicare Advantage + PPO, ACA Marketplace
  │
  └─ NO adults 65+?
     └─ Single person?
        └─ Recommend: National PPO or HDHP+HSA
           Alternatives: ACA, Regional PPO
        
        └─ Couple (2 adults)?
           └─ Recommend: Couple PPO
              Alternatives: ACA, HDHP, Regional PPO
        
        └─ Family (with children)?
           └─ Recommend: Family PPO
              Alternatives: ACA, HDHP, Regional PPO
        
        └─ Multiple unrelated adults?
           └─ Recommend: Individual PPO plans for each
              Alternatives: ACA, HDHP
```

---

## 9. CODE ARCHITECTURE & DESIGN PATTERNS

### 9.1 Architectural Overview

```
┌─────────────────────────────────────┐
│        Next.js Pages (TSX)          │
│  /calculator, /results, /faq, etc.  │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│      React Components                │
│  Step components, Results components │
│  Business logic + UI combined        │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│      Custom React Hooks             │
│  useInsuranceAnalysis               │
│  useCalculatorPersistence           │
│  useFormValidation                  │
│  useToast, useKeyboardNavigation    │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│      Calculation Engine             │
│  lib/calculator/                    │
│  ├─ recommendations.ts              │
│  ├─ alternatives.ts                 │
│  ├─ subsidyCalculator.ts            │
│  ├─ employerComparison.ts           │
│  └─ index.ts (main entry)           │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│      Validation & Utils             │
│  lib/                               │
│  ├─ validation.ts                   │
│  ├─ stateSpecificData.ts            │
│  ├─ constants.ts                    │
│  └─ plainEnglish.ts                 │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│      State Management               │
│  calculatorReducer.ts               │
│  useReducer hook                    │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│      Data Persistence               │
│  localStorage.ts                    │
│  20+ validation/messaging functions │
└─────────────────────────────────────┘
```

### 9.2 Design Patterns Used

**1. Reducer Pattern** (Redux-style without Redux)
```typescript
const [state, dispatch] = useReducer(calculatorReducer, initialState);

// Actions
dispatch({ type: 'SET_FIELD', field: 'budget', value: '1000-2000' });
dispatch({ type: 'NEXT_STEP' });
dispatch({ type: 'SET_ERRORS', errors: validationErrors });
```

**2. Custom Hooks** (Composition over class components)
```typescript
const { recommendation, isLoading } = useInsuranceAnalysis(formData);
const { showSuccess, showError } = useToast();
const [errors, validate] = useFormValidation(formData);
```

**3. Composition Pattern** (Modular components)
```typescript
<CalculatorLayout>
  {currentStep === 1 && <Step1Residences />}
  {currentStep === 2 && <Step2Household />}
  {currentStep === 5 && <Step3Budget />}
</CalculatorLayout>
```

**4. Error Boundary Pattern**
```typescript
<ErrorBoundary fallback={<ErrorMessage />}>
  <Calculator />
</ErrorBoundary>
```

**5. Memoization for Performance**
```typescript
const PlanComparisonTable = React.memo(({ recommendation }) => {...});
const CostBreakdown = React.memo(({ costs }) => {...});
```

**6. Lazy Loading**
```typescript
const SavingsCalculator = dynamic(() => import(...), { loading: Skeleton });
```

**7. Factory Pattern**
```typescript
export function createInitialState(formData): CalculatorState { ... }
export function getMedicareRecommendation(formData): InsuranceRecommendation { ... }
```

**8. Configuration Pattern**
```typescript
// All magic numbers in constants.ts
INSURANCE_COSTS.MEDICARE_PER_PERSON_LOW = 300;
VALIDATION.MEDICARE_ELIGIBILITY_AGE = 65;
THRESHOLDS.ANALYSIS_DELAY_MS = 1500;
```

### 9.3 Code Organization

**Feature-Based Organization**
```
components/
├── calculator/          # Calculator-specific UI
├── results/            # Results-specific UI
├── charts/             # Chart visualizations
└── [Shared components] # Navigation, Footer, etc.

lib/
├── calculator/         # Recommendation engine
├── __tests__/         # Unit tests
├── [utilities]        # Validation, logging, etc.
```

**Separation of Concerns**
```
UI Layer:      components/ (React components)
Hook Layer:    hooks/ (Custom hooks)
Logic Layer:   lib/calculator/ (Business logic)
Util Layer:    lib/ (Helpers, constants, validation)
Type Layer:    types/ (TypeScript definitions)
```

### 9.4 Type Safety

**Full TypeScript Coverage**
- No `any` types used
- Strict mode enabled
- Interface-based architecture
- Type-safe reducer pattern

**Key Interfaces**
```typescript
CalculatorFormData        // User input
CalculatorState           // UI state
InsuranceRecommendation   // Output
AlternativeOption         // Plan alternatives
SubsidyAnalysis           // Subsidy eligibility
EmployerPlanAnalysis      // Employer comparison
```

---

## 10. CONFIGURATION FILES

### 10.1 Next.js Configuration

**next.config.ts**
- Security headers (16 headers configured)
- CSP (Content Security Policy)
- HSTS, X-Frame-Options
- Cross-origin policies
- Webpack optimizations

**package.json**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.3.1",
    "@react-pdf/renderer": "^3.4.4",
    "recharts": "^2.12.7"
  }
}
```

### 10.2 TypeScript Configuration

**tsconfig.json**
- Strict mode enabled
- Target: ES2017
- Module resolution: bundler
- JSX: preserve (for Next.js)
- Path aliases: `@/*` → root

### 10.3 Styling Configuration

**tailwind.config.ts**
- Tailwind CSS with custom colors
- Primary: Deep Blue (#1e3a8a)
- Accent: Light Blue (#3b82f6)
- Success: Green (#10b981)

**postcss.config.mjs**
- Autoprefixer for browser compatibility
- Tailwind CSS processor

### 10.4 Testing Configuration

**jest.config.ts**
- Unit test setup
- React Testing Library integration
- JSDOM environment

**playwright.config.ts**
- E2E test configuration
- Chrome, Firefox, Safari browsers
- iOS, Android device emulation
- Timeout: 30 seconds

### 10.5 Environment Variables

**.env.example** (template for developers)
```bash
# Application Info
NEXT_PUBLIC_APP_NAME=Coverage Gap Analyzer
NEXT_PUBLIC_APP_VERSION=1.0.0

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG=true

# Limits
NEXT_PUBLIC_MAX_RESIDENCES=5
NEXT_PUBLIC_MAX_ADULTS=10
NEXT_PUBLIC_MAX_CHILDREN=10

# Session
NEXT_PUBLIC_SESSION_TIMEOUT_HOURS=24
```

---

## 11. KEY ALGORITHMS & CALCULATIONS

### 11.1 Coverage Score Algorithm

```typescript
function calculateCoverageScore(states: string[]): number {
  const stateCount = states.length;
  
  if (stateCount === 1) return 90;           // Single state
  if (stateCount === 2) return 75-85;        // Depends on adjacency
  if (stateCount >= 3) return 80-85;         // Multiple states
  
  // Adjustments based on plan type
  const baseScore = getBaseScore(states);
  
  // PPO plans: +10 points (nationwide coverage)
  // Regional plans: +5 points
  // State-limited: -15 points
  
  return Math.min(90, baseScore + adjustments);
}
```

### 11.2 Cost Calculation

```typescript
function calculateMonthlyHouseholdCost(household: Household, states: string[]): CostRange {
  const baseCost = {
    low: 0,
    high: 0
  };
  
  // Medicare-eligible members
  const medicareCount = household.adults.filter(a => a.age >= 65).length;
  baseCost.low += medicareCount * INSURANCE_COSTS.MEDICARE_PER_PERSON_LOW;
  baseCost.high += medicareCount * INSURANCE_COSTS.MEDICARE_PER_PERSON_HIGH;
  
  // Non-Medicare adults
  const nonMedicareCount = household.adults.length - medicareCount;
  baseCost.low += nonMedicareCount * INSURANCE_COSTS.ADULT_PPO_LOW;
  baseCost.high += nonMedicareCount * INSURANCE_COSTS.ADULT_PPO_HIGH;
  
  // Children
  baseCost.low += household.children.length * INSURANCE_COSTS.CHILD_LOW;
  baseCost.high += household.children.length * INSURANCE_COSTS.CHILD_HIGH;
  
  // Apply state-specific cost multipliers
  return adjustCostForStates(baseCost, states);
}

function adjustCostForStates(baseCost: CostRange, states: string[]): CostRange {
  const multipliers = states
    .map(state => STATE_DATA[state]?.costMultiplier || 1.0)
    .filter(m => m !== null);
  
  const avgMultiplier = multipliers.length > 0
    ? multipliers.reduce((sum, m) => sum + m, 0) / multipliers.length
    : 1.0;
  
  return {
    low: Math.round(baseCost.low * avgMultiplier),
    high: Math.round(baseCost.high * avgMultiplier)
  };
}
```

### 11.3 Subsidy Eligibility

```typescript
function calculateSubsidy(
  incomeRange: string,
  adultsCount: number,
  childrenCount: number,
  states: string[]
): SubsidyAnalysis {
  const householdSize = adultsCount + childrenCount;
  const federalPovertyLevel = getFPL(householdSize, states);
  const income = getIncomeFromRange(incomeRange);
  
  const fplPercentage = (income / federalPovertyLevel) * 100;
  
  // Subsidy available if 100% < FPL < 400%
  if (fplPercentage >= 100 && fplPercentage < 400) {
    const subsidyPercentage = calculateSubsidyPercentage(fplPercentage);
    const monthlySubsidy = calculateMonthlySubsidy(
      subsidyPercentage,
      income,
      householdSize
    );
    
    return {
      subsidyEligible: true,
      medicaidEligible: false,
      estimatedMonthlySubsidy: monthlySubsidy,
      fplPercentage
    };
  }
  
  // Medicaid if income < 138% FPL (in expansion states)
  if (fplPercentage < 138 && isExpansionState(states)) {
    return {
      subsidyEligible: false,
      medicaidEligible: true,
      estimatedMonthlySubsidy: 0,
      fplPercentage
    };
  }
  
  return {
    subsidyEligible: false,
    medicaidEligible: false,
    estimatedMonthlySubsidy: 0,
    fplPercentage
  };
}
```

---

## 12. SECURITY & VALIDATION

### 12.1 Input Sanitization

**XSS Prevention**
```typescript
function sanitizeTextInput(input: string): string {
  return input
    .replace(/[<>]/g, '')              // Remove angle brackets
    .replace(/javascript:/gi, '')      // Remove javascript: protocol
    .replace(/on\w+=/gi, '')           // Remove inline event handlers
    .trim()
    .slice(0, 200);                    // Limit length
}
```

**ZIP Code Validation**
```typescript
function validateZipCode(zip: string): { isValid: boolean; sanitized: string } {
  const sanitized = zip.replace(/\D/g, '').slice(0, 5);
  
  // Must be exactly 5 digits
  if (sanitized.length !== 5) return { isValid: false, sanitized };
  
  // Reject obviously invalid patterns
  if (sanitized === '00000') return { isValid: false, sanitized };
  if (/^(\d)\1{4}$/.test(sanitized) && sanitized !== '11111') {
    return { isValid: false, sanitized };
  }
  
  return { isValid: true, sanitized };
}
```

### 12.2 Security Headers

**Configured in next.config.ts**
- Content-Security-Policy
- Strict-Transport-Security (HSTS)
- X-Frame-Options (Clickjacking protection)
- X-Content-Type-Options (MIME sniffing)
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy
- Cross-Origin policies (COEP, COOP, CORP)

### 12.3 Data Privacy

**No Sensitive Data Storage**
- ZIP codes, ages, budget ranges only (non-sensitive)
- No health conditions stored locally
- No insurance details persisted
- localStorage auto-clears after 24 hours
- No server-side database (all client-side)

**Analytics Privacy**
- IP anonymization enabled
- No personal data tracked
- Optional feature (disabled by default)
- GA4 or Plausible support

---

## 13. TESTING INFRASTRUCTURE

### 13.1 Unit Tests (Jest + React Testing Library)

**Test Files**
- `lib/__tests__/calculator.test.ts` - 70+ tests
- `lib/__tests__/validation.test.ts` - Input validation tests
- `components/__tests__/*.test.tsx` - 7 component test files

**Coverage**: 215 tests passing (100%)

**Test Categories**
1. Calculator engine (Medicare, mixed, non-Medicare scenarios)
2. Cost calculations (base + state adjustments)
3. Subsidy eligibility
4. Alternative plan generation
5. Input validation
6. UI component rendering
7. Error states

### 13.2 E2E Tests (Playwright)

**Test Suites**
1. **Calculator Flow** - Complete user journey
2. **Results Display** - Recommendations rendering
3. **Navigation** - Page routing
4. **Accessibility** - WCAG compliance
5. **Mobile UX** - Responsive design

**Coverage**: 53 E2E tests
**Browsers**: Chrome, Firefox, Safari
**Devices**: Desktop, iOS, Android

### 13.3 Test Scenarios

**Scenario 1: Medicare-Eligible Couple**
- Input: 2 adults (ages 67, 65), 2 residences (FL, NY)
- Expected: Medicare + Medigap recommendation
- Cost range: ~$600-1000/month

**Scenario 2: Young Family**
- Input: 2 adults (ages 35, 33), 2 children, 2 residences
- Expected: National PPO Family Plan
- Cost range: ~$1800-2500/month

**Scenario 3: Mixed Household**
- Input: 2 adults (ages 70, 45), 1 child, 2 residences
- Expected: Medicare for senior + PPO for others
- Cost range: ~$1200-1800/month

---

## 14. EXISTING INSURANCE TYPES & COVERAGES

### 14.1 Supported Insurance Plans

**Medicare Plans**
- ✓ Original Medicare (Parts A, B, D)
- ✓ Medicare Advantage (Part C)
- ✓ Medigap Plans (G, N, etc.)
- ✓ Part D prescription coverage analysis

**Commercial Plans**
- ✓ PPO (nationwide + regional)
- ✓ HMO (regional/state-limited)
- ✓ EPO (network-based)
- ✓ HDHP with HSA
- ✓ ACA Marketplace plans

**Special Plans**
- ✓ Employer-sponsored insurance
- ✓ COBRA continuation coverage
- ✓ Medicaid (state-dependent)
- ✓ Regional PPO

### 14.2 Coverage Features Analyzed

**Multi-State Coverage**
- ✓ National PPO networks
- ✓ State-specific limitations
- ✓ Out-of-network coverage
- ✓ Multi-state coordination

**Age-Based Features**
- ✓ Medicare eligibility (65+)
- ✓ Young adult coverage
- ✓ Child coverage
- ✓ Family plans
- ✓ Individual plans

**Health-Based Features**
- ✓ Pre-existing condition coverage
- ✓ Chronic condition support
- ✓ Prescription coverage analysis
- ✓ Specialist access evaluation

**Financial Features**
- ✓ Premium cost estimation
- ✓ Deductible analysis
- ✓ Out-of-pocket maximums
- ✓ Subsidy eligibility
- ✓ HSA tax benefits

---

## 15. INTEGRATION POINTS & DEPENDENCIES

### 15.1 External Services

**Analytics** (Optional)
- Google Analytics 4
- Plausible Analytics
- Integrated via `lib/analytics.ts`

**PDF Generation**
- @react-pdf/renderer
- Client-side generation (no server needed)
- Used in `components/PDFReport.tsx`

**Charting**
- Recharts for interactive visualizations
- Used in `components/results/` for cost breakdowns

### 15.2 Environment Integration

**Environment Detection**
```typescript
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const enableDebug = process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true';
```

**Feature Flags**
```typescript
NEXT_PUBLIC_ENABLE_ANALYTICS     // Enable/disable tracking
NEXT_PUBLIC_ENABLE_DEBUG         // Debug mode
NEXT_PUBLIC_MAX_RESIDENCES       // Limit properties
```

---

## 16. RECOMMENDED AREAS FOR ADD-ON FEATURES

### 16.1 Add-On Insurance Recommendations

**Age-Based Add-Ons Would Fit**
The system is structured to support add-on insurance recommendations:

1. **Recommendation Engine Entry Point**
   - Modify `lib/calculator/recommendations.ts`
   - Add-ons determined AFTER primary plan recommendation
   - Based on age ranges detected in `formData.adultAges` and `formData.childAges`

2. **Alternative Options Pattern**
   - Add-ons can be included as alternative options
   - Already structured with `AlternativeOption` interface
   - Includes: name, monthlyCost, coverageScore, pros, cons

3. **Data Storage**
   - Add-on preferences stored in `CalculatorFormData`
   - Optional field: `addOnInsurances?: string[]`
   - Persists to localStorage automatically

4. **Cost Calculations**
   - Constants ready in `lib/constants.ts`
   - Can add: `ADDON_INSURANCE_COSTS` object
   - State-adjusted costs via `adjustCostForStates()`

### 16.2 Implementation Strategy

**Step 1: Data Collection**
- Add optional step or fields to existing steps
- Example: "Interested in additional coverage?" (yes/no)
- Store in `CalculatorFormData`

**Step 2: Age-Based Logic**
- Create `lib/calculator/addOnInsuranceHelper.ts`
- Function: `getAddOnRecommendations(formData, primaryPlan)`
- Analyze age ranges in `adultAges` and `childAges`
- Return add-on options based on age groups

**Step 3: Integration**
- Call from `lib/calculator/index.ts` main engine
- Add to recommendation output
- Display on results page

**Step 4: Display**
- Add new results component or section
- Show recommended add-ons with costs
- Include in plan comparison tables
- Add to PDF export

---

## SUMMARY

This is a **comprehensive, production-ready web application** that:

✓ Handles complex multi-state health insurance scenarios  
✓ Provides personalized recommendations using sophisticated algorithms  
✓ Supports all major insurance plan types (Medicare, PPO, HMO, HDHP, ACA, Medicaid)  
✓ Calculates costs with state-specific adjustments  
✓ Analyzes subsidy eligibility and employer insurance  
✓ Delivers exceptional user experience with validation, auto-save, and rich UI  
✓ Maintains full type safety with TypeScript  
✓ Passes 215 unit tests + 53 E2E tests  
✓ Implements security best practices (XSS prevention, input validation, security headers)  
✓ Optimized for performance (~102KB shared JavaScript)  
✓ Mobile-responsive and accessible (WCAG AA/AAA)  

**Architecture** is clean, modular, and extensible - ready for new features like age-based add-on insurance recommendations.

