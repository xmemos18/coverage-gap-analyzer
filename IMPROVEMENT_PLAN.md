# Coverage Gap Analyzer - Comprehensive Improvement Plan

**Created**: November 2, 2025
**Total Tasks**: 79
**Estimated Total Time**: 6-8 weeks
**Current Code Quality**: 7.5/10
**Target Code Quality**: 9.5/10

---

## 📋 Table of Contents

1. [Phase 1: Critical Bug Fixes](#phase-1-critical-bug-fixes) (1-2 days)
2. [Phase 2: Integrate Hidden Features](#phase-2-integrate-hidden-features) (4-5 days)
3. [Phase 3: Complete Missing Features](#phase-3-complete-missing-features) (1-2 days)
4. [Phase 4: Validation & Edge Cases](#phase-4-validation--edge-cases) (2-3 days)
5. [Phase 5: Code Quality & Refactoring](#phase-5-code-quality--refactoring) (1-2 weeks)
6. [Phase 6: Performance Optimizations](#phase-6-performance-optimizations) (2-3 days)
7. [Phase 7: New Features - Quick Wins](#phase-7-new-features---quick-wins) (1 week)
8. [Phase 8: New Features - Medium Term](#phase-8-new-features---medium-term) (2-3 weeks)
9. [Final: Quality Assurance](#final-quality-assurance) (2-3 days)

---

## Phase 1: Critical Bug Fixes
**⏱️ Duration**: 1-2 days
**Priority**: 🔴 CRITICAL
**Dependencies**: None
**Goal**: Fix bugs that break functionality or cause poor UX

### Tasks (6 total)

#### 1.1 Fix localStorage Validation Bug
**File**: `lib/localStorage.ts:54`
**Issue**: Requires minimum 2 residences, but app allows saving with 1
**Impact**: Resume feature broken for single-residence users

**Change**:
```typescript
// Before
if (formData.residences.length < 2) return false;

// After
if (formData.residences.length < 1) return false;
```

**Test**: Save form with 1 residence, reload page, verify data restores

---

#### 1.2 Fix Duplicate Analytics Parameter
**File**: `app/results/page.tsx:163`
**Issue**: Passes `numAdults` twice instead of total adults count
**Impact**: Analytics data incorrect for multi-adult households

**Change**:
```typescript
// Before
trackCalculatorCompleted(numAdults, numAdults, numChildren, hasMedicareEligible);

// After
trackCalculatorCompleted(numAdults, adultAges.length, numChildren, hasMedicareEligible);
```

**Test**: Submit form with 3 adults, verify analytics tracks correct count

---

#### 1.3 Fix Window Object SSR Error
**File**: `app/results/page.tsx:188`
**Issue**: `window.location.href` causes crash during server-side rendering
**Impact**: Build errors or runtime crashes

**Change**:
```typescript
// Before
<p className="text-sm text-gray-600">{window.location.href}</p>

// After
<p className="text-sm text-gray-600">
  {typeof window !== 'undefined' ? window.location.href : ''}
</p>
```

**Test**: Run production build, verify no SSR errors

---

#### 1.4 Fix React Hook Dependencies Warnings
**File**: `app/results/page.tsx` (lines 32, 33, 46, 49, 59)
**Issue**: 8 warnings about exhaustive-deps causing unnecessary re-renders
**Impact**: Performance degradation

**Changes**:
```typescript
// Before
const recommendation = useMemo(() => {
  const residenceZips = residenceZipsStr ? residenceZipsStr.split(',') : [];
  // ... uses residenceZips
}, [residenceZipsStr, residenceStatesStr, /* ... */]);

// After - Extract array parsing
const residenceZips = useMemo(() =>
  residenceZipsStr ? residenceZipsStr.split(',') : [],
  [residenceZipsStr]
);

const residenceStates = useMemo(() =>
  residenceStatesStr ? residenceStatesStr.split(',') : [],
  [residenceStatesStr]
);

// Same for adultAges, childAges, chronicConditions

const recommendation = useMemo(() => {
  // Now uses memoized arrays
}, [residenceZips, residenceStates, /* ... */]);
```

**Test**: Use React DevTools Profiler to verify reduced re-renders

---

#### 1.5 Fix Age Validation Silent Fallback
**File**: `components/calculator/Step2Household.tsx:56-60`
**Issue**: Empty input defaults to 18 silently, masking missing data

**Change**:
```typescript
// Before
const validAge = Math.max(18, Math.min(100, Math.floor(age) || 18));

// After
const handleAgeChange = (index: number, value: string) => {
  const age = parseInt(value, 10);

  if (isNaN(age) || value === '') {
    // Don't set default, let validation catch it
    updateField(`adultAges.${index}`, undefined);
    return;
  }

  const validAge = Math.max(18, Math.min(100, Math.floor(age)));
  updateField(`adultAges.${index}`, validAge);
};
```

**Test**: Leave age blank, verify validation error appears

---

#### 1.6 Run Full Test Suite
**Command**: `npm test && npm run test:e2e`
**Goal**: Ensure no regressions from bug fixes
**Success Criteria**: 215/215 tests passing

---

## Phase 2: Integrate Hidden Features
**⏱️ Duration**: 4-5 days
**Priority**: 🟠 HIGH
**Dependencies**: Phase 1 complete
**Goal**: Unlock 500+ lines of complete, unused code

### Background
You have **four complete implementations** that are never shown to users:
1. Medicare Advantage Helper (200+ lines)
2. COBRA Calculator (150+ lines)
3. HSA Savings Calculator (250+ lines)
4. State-Specific Data (400+ lines)

These are production-ready and just need UI integration!

### Tasks (15 total)

#### 2.1 Create ResultsEnhancement Component Wrapper
**File**: `components/results/ResultsEnhancement.tsx` (new)
**Purpose**: Container for new calculator integrations

**Implementation**:
```typescript
interface ResultsEnhancementProps {
  formData: FormData;
  recommendation: Recommendation;
}

export function ResultsEnhancement({ formData, recommendation }: ResultsEnhancementProps) {
  return (
    <div className="space-y-8 mt-8">
      {/* Medicare Advantage section */}
      {shouldShowMedicareAdvantage(formData) && (
        <MedicareAdvantageComparison formData={formData} />
      )}

      {/* COBRA section */}
      {formData.hasEmployerInsurance && (
        <COBRAAnalysis formData={formData} />
      )}

      {/* HSA section */}
      {shouldShowHSA(recommendation) && (
        <HSASavingsBreakdown formData={formData} recommendation={recommendation} />
      )}

      {/* State insights */}
      <StateInsights residences={formData.residences} />
    </div>
  );
}
```

---

#### 2.2 Integrate Medicare Advantage Helper
**Files**:
- Existing: `lib/calculator/medicareAdvantageHelper.ts`
- New: `components/results/MedicareAdvantageComparison.tsx`

**Logic**:
```typescript
import { analyzeMedicareAdvantage } from '@/lib/calculator/medicareAdvantageHelper';

export function MedicareAdvantageComparison({ formData }: { formData: FormData }) {
  const analysis = useMemo(() =>
    analyzeMedicareAdvantage(formData),
    [formData]
  );

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">
        Medicare vs Medicare Advantage
      </h3>

      {/* Comparison table */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4>Original Medicare + Medigap</h4>
          <ul>
            <li>Monthly: ${analysis.originalMedicare.monthlyCost}</li>
            <li>Network: {analysis.originalMedicare.networkSize}</li>
            <li>Coverage: {analysis.originalMedicare.coverage}</li>
          </ul>
        </div>

        <div>
          <h4>Medicare Advantage</h4>
          <ul>
            <li>Monthly: ${analysis.advantage.monthlyCost}</li>
            <li>Network: {analysis.advantage.networkSize}</li>
            <li>Coverage: {analysis.advantage.coverage}</li>
          </ul>
        </div>
      </div>

      <div className="mt-4 bg-blue-50 p-4 rounded">
        <strong>Recommendation:</strong> {analysis.recommendation}
      </div>
    </div>
  );
}
```

**Show When**: Any adult age >= 65

---

#### 2.3-2.6 COBRA Integration
**Similar pattern**: Create component, import helper, display analysis

**Show When**: `formData.hasEmployerInsurance === true`

**Key Data to Display**:
- COBRA cost vs marketplace
- Duration of coverage (18/36 months)
- Pros: Familiar doctors, no waiting period
- Cons: More expensive, temporary

---

#### 2.7-2.9 HSA Integration
**Show When**: Recommendation includes HDHP plan

**Key Data to Display**:
- Annual contribution limits
- Tax savings (federal + state)
- Investment growth projections
- Retirement healthcare savings

---

#### 2.10-2.11 State-Specific Data Application
**Files**:
- Existing: `lib/stateSpecificData.ts`
- Update: `lib/calculator/recommendations.ts`

**Changes Needed**:
```typescript
import { getStateData, adjustCostForStates } from '@/lib/stateSpecificData';

// In generateRecommendation():
const baseEstimate = calculateBaseCost(...);

// Apply state multipliers
const adjustedEstimate = adjustCostForStates(
  baseEstimate,
  residences.map(r => r.state)
);

// Get warnings
const stateWarnings = residences.flatMap(r =>
  getStateData(r.state).warnings || []
);
```

---

#### 2.12 Create StateInsights Component
**Display**:
- Medicaid expansion status per state
- State-specific cost adjustments applied
- Network availability warnings
- State marketplace links

---

#### 2.13-2.16 Update Tests
Add test coverage for:
- Medicare Advantage rendering
- COBRA calculations
- HSA projections
- State cost adjustments

**Success Criteria**: Test coverage remains > 80%

---

## Phase 3: Complete Missing Features
**⏱️ Duration**: 1-2 days
**Priority**: 🟠 HIGH
**Dependencies**: Phase 1 complete
**Goal**: Implement features promised in README

### Tasks (8 total)

#### 3.1 Add Copy Share Link Button
**File**: `components/ShareButtons.tsx`
**Feature**: Click to copy results URL to clipboard

**Implementation**:
```typescript
const [copied, setCopied] = useState(false);

const handleCopyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

// Add button
<button
  onClick={handleCopyLink}
  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
  aria-label="Copy share link"
>
  <LinkIcon />
  {copied ? 'Copied!' : 'Copy Link'}
</button>
```

---

#### 3.2 Add Success Toast Notification
**File**: `components/Toast.tsx` (new)
**Purpose**: Show temporary success message on copy

---

#### 3.3-3.5 Implement Email Results
**Approach Option 1**: Simple mailto: link
```typescript
const emailBody = `
Check out my health insurance analysis:

Primary Plan: ${recommendation.primaryOption.name}
Estimated Cost: $${recommendation.costEstimate.monthly}/month

View full results: ${window.location.href}
`;

const mailtoLink = `mailto:?subject=My Health Insurance Analysis&body=${encodeURIComponent(emailBody)}`;

<a href={mailtoLink}>Email Results</a>
```

**Approach Option 2**: Email service (SendGrid, Resend)
- Requires backend API route
- Better formatting (HTML email)
- Can track if email was opened

**Recommendation**: Start with Option 1 (mailto:), upgrade to Option 2 if needed

---

#### 3.6-3.8 Update Tests and Documentation
- Test copy link functionality
- Test email link generation
- Update README with accurate export feature list

---

## Phase 4: Validation & Edge Cases
**⏱️ Duration**: 2-3 days
**Priority**: 🟡 MEDIUM
**Dependencies**: Phase 1 complete
**Goal**: Prevent invalid data entry

### Tasks (10 total)

#### 4.1-4.3 Residence Time Validation
**Problem**: Users can claim 12 months at 3 homes = 36 months/year!

**Solution**:
```typescript
// In Step1Residences validation
const totalMonths = residences.reduce((sum, r) => sum + r.monthsPerYear, 0);

if (totalMonths > 12) {
  return {
    isValid: false,
    error: `Total time across all homes (${totalMonths} months) exceeds 12 months per year`
  };
}
```

**Visual Component**:
```tsx
<div className="mt-4">
  <div className="flex items-center justify-between mb-2">
    <span>Time Allocated</span>
    <span className={totalMonths > 12 ? 'text-red-600' : 'text-green-600'}>
      {totalMonths}/12 months
    </span>
  </div>

  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
    {residences.map((r, i) => (
      <div
        key={i}
        style={{ width: `${(r.monthsPerYear / 12) * 100}%` }}
        className={`h-full inline-block ${COLORS[i]}`}
      />
    ))}
  </div>
</div>
```

---

#### 4.4-4.5 Enhanced ZIP Code Validation
**File**: `lib/validation.ts`

**Improvements**:
```typescript
const INVALID_ZIPS = ['00000', '99999'];

export function validateZipCode(zip: string) {
  const sanitized = zip.replace(/\D/g, '').slice(0, 5);

  if (sanitized.length !== 5) {
    return { isValid: false, sanitized, error: 'ZIP code must be 5 digits' };
  }

  if (INVALID_ZIPS.includes(sanitized)) {
    return { isValid: false, sanitized, error: 'Invalid ZIP code' };
  }

  // Optional: Check valid ranges (01001-99950)
  const zipNum = parseInt(sanitized, 10);
  if (zipNum < 1000 || zipNum > 99950) {
    return { isValid: false, sanitized, error: 'ZIP code out of valid range' };
  }

  return { isValid: true, sanitized };
}
```

---

#### 4.6 Fix Age Validation Empty Input
Already covered in Phase 1.5

---

#### 4.7 Add Income Range Validation
**File**: `components/calculator/Step3Budget.tsx`

**Add to validation**:
```typescript
if (incomeLevel === '' || !incomeLevel) {
  errors.incomeLevel = 'Please select an income range for subsidy calculation';
}
```

---

#### 4.8 Reconcile Age Limits
**Current State**:
- Form input: `max="100"`
- Backend constant: `MAX_ADULT_AGE = 120`
- Validation function: accepts 0-120

**Decision Needed**: What's the actual max age?
- Option A: 100 (more realistic)
- Option B: 120 (edge cases)

**Recommendation**: Set to 100 everywhere

---

#### 4.9-4.10 Update Tests
Add tests for:
- Time distribution validation
- ZIP code edge cases (00000, 99999, invalid ranges)
- Age validation edge cases
- Income validation

---

## Phase 5: Code Quality & Refactoring
**⏱️ Duration**: 1-2 weeks
**Priority**: 🟡 MEDIUM
**Dependencies**: Phases 1-3 complete
**Goal**: Reduce technical debt, improve maintainability

### Tasks (24 total)

This is the **largest phase** focused on improving code quality without changing functionality.

#### 5.1 Create Standardized Result<T, E> Type
**File**: `types/index.ts`

**Add**:
```typescript
/**
 * Standard result type for operations that can fail
 * Replaces inconsistent { success, error } and { isValid, sanitized } patterns
 */
export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Helper functions
export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
```

---

#### 5.2-5.4 Refactor to Use Result<T, E>
**Files to update**:
- `lib/localStorage.ts`
- `lib/validation.ts`
- `lib/urlValidation.ts`

**Before**:
```typescript
function saveData(data: FormData): { success: boolean; error?: string } {
  try {
    // ...
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to save' };
  }
}
```

**After**:
```typescript
function saveData(data: FormData): Result<void> {
  try {
    // ...
    return Ok(undefined);
  } catch (error) {
    return Err('Failed to save');
  }
}

// Usage
const result = saveData(data);
if (result.ok) {
  // Success
} else {
  console.error(result.error);
}
```

---

#### 5.5-5.8 Extract Calculator Hooks
**Problem**: `app/calculator/page.tsx` is 686 lines

**Solution**: Split into 4 hooks

**5.5: useCalculatorState()**
```typescript
// hooks/useCalculatorState.ts
export function useCalculatorState() {
  const [state, dispatch] = useReducer(calculatorReducer, INITIAL_STATE);

  const updateField: UpdateFieldFunction = useCallback((field, value) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  }, []);

  // ... other state methods

  return { state, updateField, clearErrors, /* ... */ };
}
```

**5.6: useCalculatorValidation()**
```typescript
// hooks/useCalculatorValidation.ts
export function useCalculatorValidation(state: CalculatorState) {
  const validateStep = useCallback((step: number) => {
    switch (step) {
      case 1: return validateResidences(state.residences);
      case 2: return validateHousehold(state);
      case 3: return validateBudget(state);
      default: return { isValid: true, errors: {} };
    }
  }, [state]);

  return { validateStep, isStepValid };
}
```

**5.7: useCalculatorPersistence()**
```typescript
// hooks/useCalculatorPersistence.ts
export function useCalculatorPersistence(state: CalculatorState) {
  const debouncedState = useDebounce(state, 1000);

  useEffect(() => {
    saveFormData(debouncedState);
  }, [debouncedState]);

  const clearSaved = useCallback(() => {
    clearFormData();
  }, []);

  return { clearSaved };
}
```

**5.8: CalculatorProgress Component**
```typescript
// components/calculator/CalculatorProgress.tsx
export function CalculatorProgress({
  currentStep,
  totalSteps,
  completedSteps
}: CalculatorProgressProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {Array.from({ length: totalSteps }, (_, i) => (
        <StepIndicator
          key={i}
          number={i + 1}
          active={currentStep === i + 1}
          completed={completedSteps[i]}
        />
      ))}
    </div>
  );
}
```

---

#### 5.9-5.11 Extract Results Hooks
**Problem**: `app/results/page.tsx` is 313 lines

**5.9: useResultsData()**
```typescript
// hooks/useResultsData.ts
export function useResultsData(searchParams: URLSearchParams) {
  return useMemo(() => {
    // Parse URL parameters
    const residenceZipsStr = searchParams.get('residenceZips') || '';
    const residenceStatesStr = searchParams.get('residenceStates') || '';

    const residenceZips = useMemo(() =>
      residenceZipsStr ? residenceZipsStr.split(',') : [],
      [residenceZipsStr]
    );

    // ... more parsing

    // Reconstruct form data
    const formData: FormData = {
      residences: residenceZips.map((zip, i) => ({
        zip,
        state: residenceStates[i],
        monthsPerYear: 6, // default
        isPrimary: i === 0
      })),
      // ...
    };

    return { formData, isValid: validateFormData(formData) };
  }, [searchParams]);
}
```

**5.10: useResultsAnalytics()**
```typescript
// hooks/useResultsAnalytics.ts
export function useResultsAnalytics(formData: FormData, recommendation: Recommendation) {
  useEffect(() => {
    if (env.enableAnalytics) {
      trackCalculatorCompleted(
        formData.numAdults,
        formData.adultAges.length,
        formData.numChildren,
        formData.hasMedicareEligible
      );
    }
  }, [formData, recommendation]);

  const trackExport = useCallback((format: string) => {
    trackResultsExported(format);
  }, []);

  return { trackExport };
}
```

---

#### 5.12-5.14 Eliminate Cost Calculation Duplication
**Create shared utility**:
```typescript
// lib/calculator/costUtils.ts
export function calculateTotalCost(breakdown: CostBreakdown, counts: {
  medicareEligible: number;
  nonMedicareAdults: number;
  children: number;
}): CostRange {
  const { medicareEligible, nonMedicareAdults, children } = counts;

  return {
    low:
      breakdown.medicare * medicareEligible +
      breakdown.medigap * medicareEligible +
      breakdown.adults * nonMedicareAdults +
      breakdown.children * children,
    high:
      breakdown.medicareHigh * medicareEligible +
      breakdown.medigapHigh * medicareEligible +
      breakdown.adultsHigh * nonMedicareAdults +
      breakdown.childrenHigh * children
  };
}
```

**Update files to use it**:
- `lib/calculator/recommendations.ts`
- `lib/calculator/alternatives.ts`
- `lib/calculator/subsidyCalculator.ts`

---

#### 5.15-5.16 Create Logging Utility
**Problem**: 8+ files use console.log/console.error

**Solution**:
```typescript
// lib/logger.ts
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (isDev) console.debug(message, ...args);
  },

  info: (message: string, ...args: unknown[]) => {
    if (isDev) console.info(message, ...args);
  },

  warn: (message: string, ...args: unknown[]) => {
    console.warn(message, ...args); // Always show warnings
  },

  error: (message: string, ...args: unknown[]) => {
    console.error(message, ...args); // Always show errors
    // Could integrate error tracking here (Sentry, etc.)
  }
};
```

**Replace all instances**:
```typescript
// Before
console.log('Saved data:', data);

// After
logger.debug('Saved data:', data);
```

---

#### 5.17-5.18 Remove Dead Code
**5.17: Remove legacy residence fields**
```typescript
// types/index.ts - DELETE these lines
primaryResidence?: Residence;
secondaryResidence?: Residence;
hasThirdHome?: boolean;
thirdResidence?: Residence;
```

**Check**: Grep for usage before deleting!
```bash
grep -r "primaryResidence" --exclude-dir=node_modules
```

**5.18: Remove unused functions**
```typescript
// lib/plainEnglish.ts - DELETE
export function addInOtherWords(concept: string): string | null {
  // ... 18 lines
}
```

---

#### 5.19 Standardize Boolean Naming
**Current inconsistencies**:
- `hasMedicareEligible` ✓
- `hasEmployerInsurance` ✓
- `isLoading` ✓
- `simpleMode` ✗ (should be `isSimpleMode`)

**Create convention guide**:
```typescript
// types/index.ts - Add comment
/**
 * Boolean naming conventions:
 * - has* - possession (hasEmployerInsurance, hasMedicareEligible)
 * - is* - state (isLoading, isValid, isSimpleMode)
 * - can* - ability (canSubmit, canSkip)
 * - should* - recommendation (shouldShowWarning)
 */
```

**Refactor**: Rename `simpleMode` → `isSimpleMode` throughout

---

#### 5.20 Fix ESLint Disable Patterns
**File**: `lib/calculatorReducer.ts`

**Before**:
```typescript
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { [action.field as string]: _, ...remainingErrors } = state.errors;
```

**After**:
```typescript
const { [action.field as string]: _removed, ...remainingErrors } = state.errors;
```

Using a descriptive name like `_removed` makes the intent clear without needing eslint-disable.

---

#### 5.21 Update All Tests
After all refactoring, ensure tests pass:
```bash
npm test
npm run test:e2e
```

Fix any broken imports or changed function signatures.

---

## Phase 6: Performance Optimizations
**⏱️ Duration**: 2-3 days
**Priority**: 🟢 LOW
**Dependencies**: Phase 5 complete
**Goal**: Improve runtime performance

### Tasks (6 total)

#### 6.1 Optimize Array Iterations
**File**: `lib/calculator/index.ts:26-33`

**Before**:
```typescript
const someAdultsMedicareEligible = adultAges.some(age => age >= 65);
const medicareEligibleCount = adultAges.filter(age => age >= 65).length;
```

**After**:
```typescript
const medicareEligibleCount = adultAges.reduce(
  (count, age) => age >= 65 ? count + 1 : count,
  0
);
const someAdultsMedicareEligible = medicareEligibleCount > 0;
```

**Benefit**: One iteration instead of two

---

#### 6.2 Add Validation Debouncing
**Files**: All calculator step components

**Before**: Validation runs on every keystroke
```typescript
onChange={(e) => {
  updateField('zip', e.target.value);
  validateField('zip'); // Runs immediately
}}
```

**After**: Debounce validation, or only validate onBlur
```typescript
onChange={(e) => {
  updateField('zip', e.target.value);
}}
onBlur={(e) => {
  validateField('zip'); // Only on blur
}}
```

**Benefits**:
- Reduces validation calls by ~90%
- Better UX (no errors while typing)

---

#### 6.3 Lazy Load Result Components
**File**: `app/results/page.tsx`

**Before**: All components loaded immediately
```typescript
import { PlanComparisonTable } from '@/components/results/PlanComparisonTable';
import { VisualCostBreakdown } from '@/components/results/VisualCostBreakdown';
```

**After**: Dynamic imports
```typescript
const PlanComparisonTable = dynamic(() =>
  import('@/components/results/PlanComparisonTable').then(m => ({ default: m.PlanComparisonTable })),
  { loading: () => <Skeleton /> }
);

const VisualCostBreakdown = dynamic(() =>
  import('@/components/results/VisualCostBreakdown').then(m => ({ default: m.VisualCostBreakdown })),
  { loading: () => <Skeleton /> }
);
```

**Benefit**: Faster initial page load

---

#### 6.4 Add React.memo to Expensive Components
**Files**:
- `components/results/PlanComparisonTable.tsx`
- `components/results/VisualCostBreakdown.tsx`
- `components/calculator/Step1Residences.tsx`

**Pattern**:
```typescript
export const PlanComparisonTable = React.memo(function PlanComparisonTable({
  plans,
  selectedPlan
}: PlanComparisonTableProps) {
  // ... component code
}, (prevProps, nextProps) => {
  // Custom comparison if needed
  return prevProps.selectedPlan === nextProps.selectedPlan;
});
```

**Benefit**: Prevents re-renders when props haven't changed

---

#### 6.5 Profile Performance
**Tools**:
1. React DevTools Profiler
2. Chrome DevTools Performance tab
3. Lighthouse

**Process**:
```bash
# 1. Build production version
npm run build

# 2. Start production server
npm run start

# 3. Open Chrome DevTools
# - Go to Performance tab
# - Record user flow (fill form → view results)
# - Analyze flame graph

# 4. Use React DevTools
# - Profiler tab
# - Record interaction
# - Check render times
```

**Goals**:
- No component takes >16ms to render (60fps)
- Total page load < 1s
- Time to Interactive < 2s

---

#### 6.6 Run Lighthouse Audit
**Command**:
```bash
npm run build && npm run start
# Open Chrome DevTools → Lighthouse → Run audit
```

**Target Scores**:
- Performance: 90+
- Accessibility: 100
- Best Practices: 100
- SEO: 100

**Common Issues & Fixes**:
- Large images → Add next/image optimization
- Render-blocking resources → Inline critical CSS
- Unused JavaScript → Code splitting (already done)

---

## Phase 7: New Features - Quick Wins
**⏱️ Duration**: 1 week
**Priority**: 🟡 MEDIUM
**Dependencies**: Phases 1-6 complete
**Goal**: Add high-value features with low implementation effort

### Tasks (7 total)

#### 7.1-7.2 Carrier Recommendations
**Problem**: App recommends "National PPO" but doesn't say which companies offer it

**Solution**: Add carrier suggestions

**7.1: Create CarrierRecommendations Component**
```typescript
// components/results/CarrierRecommendations.tsx
interface Carrier {
  name: string;
  logo: string;
  rating: number;
  strengths: string[];
  estimatedCost: CostRange;
  enrollmentUrl: string;
}

export function CarrierRecommendations({
  planType,
  states
}: CarrierRecommendationsProps) {
  const carriers = getCarriersForPlanType(planType, states);

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">
        Recommended Insurance Carriers
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {carriers.map(carrier => (
          <CarrierCard key={carrier.name} carrier={carrier} />
        ))}
      </div>
    </div>
  );
}
```

**7.2: Add Carrier Data Mapping**
```typescript
// lib/calculator/carriers.ts
export const CARRIERS: Record<PlanType, Carrier[]> = {
  PPO: [
    {
      name: 'UnitedHealthcare',
      rating: 4.2,
      strengths: ['Largest network', 'Good customer service'],
      costMultiplier: 1.0,
      availability: ['all']
    },
    {
      name: 'Blue Cross Blue Shield',
      rating: 4.1,
      strengths: ['Regional expertise', 'Strong provider relationships'],
      costMultiplier: 0.95,
      availability: ['all']
    },
    {
      name: 'Cigna',
      rating: 4.0,
      strengths: ['International coverage', 'Wellness programs'],
      costMultiplier: 1.05,
      availability: ['all']
    }
  ],
  // ... more plan types
};
```

---

#### 7.3-7.5 Enrollment Guide & Marketplace Links
**7.3: Create EnrollmentGuide Component**
```typescript
// components/results/EnrollmentGuide.tsx
export function EnrollmentGuide({ planType, states }: EnrollmentGuideProps) {
  const steps = getEnrollmentSteps(planType);
  const marketplaceLinks = states.map(state => ({
    state,
    url: getMarketplaceUrl(state),
    name: getMarketplaceName(state)
  }));

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">
        How to Enroll
      </h3>

      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
              {i + 1}
            </span>
            <div>
              <strong>{step.title}</strong>
              <p className="text-gray-600">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 border-t pt-6">
        <h4 className="font-semibold mb-3">Where to Enroll</h4>
        <div className="space-y-2">
          {marketplaceLinks.map(({ state, url, name }) => (
            <a
              key={state}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
            >
              <span>{name}</span>
              <ExternalLinkIcon />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**7.4-7.5: Marketplace Link Generator**
```typescript
// lib/marketplaceLinks.ts
const STATE_MARKETPLACES: Record<string, { name: string; url: string }> = {
  CA: {
    name: 'Covered California',
    url: 'https://www.coveredca.com'
  },
  NY: {
    name: 'NY State of Health',
    url: 'https://nystateofhealth.ny.gov'
  },
  // ... all 50 states
  // Default for states using federal marketplace
  DEFAULT: {
    name: 'HealthCare.gov',
    url: 'https://www.healthcare.gov'
  }
};

export function getMarketplaceUrl(state: string): string {
  return STATE_MARKETPLACES[state]?.url || STATE_MARKETPLACES.DEFAULT.url;
}

// Medicare link
export function getMedicareUrl(): string {
  return 'https://www.medicare.gov/plan-compare';
}

// State Medicaid link
export function getMedicaidUrl(state: string): string {
  // Return state-specific Medicaid enrollment URL
}
```

---

#### 7.6 Cost By State Breakdown
**Component**: `components/results/CostByState.tsx`

**Purpose**: Show estimated costs in each state separately

```typescript
export function CostByState({
  residences,
  recommendation
}: CostByStateProps) {
  const costsByState = residences.map(residence => ({
    state: residence.state,
    zip: residence.zip,
    monthsPerYear: residence.monthsPerYear,
    estimatedMonthlyCost: calculateStateAdjustedCost(
      recommendation.costEstimate,
      residence.state
    ),
    annualizedCost: calculateAnnualizedCost(
      calculateStateAdjustedCost(recommendation.costEstimate, residence.state),
      residence.monthsPerYear
    )
  }));

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">
        Cost Breakdown by State
      </h3>

      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">State</th>
            <th className="text-right py-2">Months/Year</th>
            <th className="text-right py-2">Monthly Cost</th>
            <th className="text-right py-2">Annual Cost</th>
          </tr>
        </thead>
        <tbody>
          {costsByState.map(({ state, monthsPerYear, estimatedMonthlyCost, annualizedCost }) => (
            <tr key={state} className="border-b">
              <td className="py-3">{state}</td>
              <td className="text-right">{monthsPerYear} months</td>
              <td className="text-right">${estimatedMonthlyCost}/mo</td>
              <td className="text-right font-semibold">${annualizedCost}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <td colSpan={3} className="py-3 text-right">Total Annual:</td>
            <td className="text-right">${totalAnnualCost}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
```

---

#### 7.7 Update Documentation
Update these docs:
- `README.md` - Add new features to feature list
- `docs/USER_GUIDE.md` - Add enrollment guide usage
- `docs/ARCHITECTURE.md` - Document carrier recommendation system

---

## Phase 8: New Features - Medium Term
**⏱️ Duration**: 2-3 weeks
**Priority**: 🟢 LOW
**Dependencies**: All previous phases
**Goal**: Add complex features requiring significant development

### Tasks (9 total)

These are **optional enhancements** for future development.

#### 8.1-8.3 Scenario Comparison
**User Story**: "I want to compare different household configurations"

**Implementation**:
1. **SavedScenarios Component**
   - List of saved scenarios in sidebar
   - localStorage persistence (keyed by unique ID)
   - Delete/rename scenarios

2. **ScenarioComparison Component**
   - Select 2-3 scenarios
   - Side-by-side comparison table
   - Highlight differences

3. **Scenario Data Model**:
```typescript
interface SavedScenario {
  id: string;
  name: string;
  createdAt: Date;
  formData: FormData;
  recommendation: Recommendation;
  notes?: string;
}
```

**Storage**: localStorage with namespace
```typescript
const SCENARIOS_KEY = 'cga_saved_scenarios';

function saveScenario(scenario: SavedScenario) {
  const scenarios = loadScenarios();
  scenarios.push(scenario);
  localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios));
}
```

**Effort**: 5-7 days

---

#### 8.4-8.5 Interactive State Map
**User Story**: "Selecting states on a map is more intuitive than typing"

**Implementation**:
1. **Use SVG map of USA**
   - Clickable state paths
   - Highlight selected states
   - Show time allocation on hover

2. **Integration with Step1Residences**
   - Click state → Adds residence
   - Can still use form for ZIP code
   - Sync map selection with form

**Libraries**:
- `react-simple-maps` - Lightweight, customizable
- Or custom SVG with click handlers

**Effort**: 3-4 days

---

#### 8.6-8.7 Drug Coverage Estimator
**User Story**: "I take 5 medications - which plan covers them?"

**Implementation**:
1. **Medication Input Component**
   - Search medication database
   - Add multiple medications
   - Specify dosage/frequency

2. **Part D Cost Calculator**
   - Lookup drug tiers
   - Calculate copays
   - Compare Part D plans

**Data Source**:
- Medicare Part D formulary data (public)
- Requires parsing CMS datasets

**Effort**: 1-2 weeks (complex data)

---

#### 8.8 HealthCare.gov API Integration
**User Story**: "Give me actual prices, not estimates"

**Challenges**:
- HealthCare.gov doesn't have public API
- Would need to scrape or use third-party service
- Privacy concerns with sending user data

**Alternative**: Link to HealthCare.gov plan finder with pre-filled params

**Effort**: 2-3 weeks + ongoing maintenance

---

#### 8.9 Update Documentation
Document all new features thoroughly.

---

## Final: Quality Assurance
**⏱️ Duration**: 2-3 days
**Priority**: 🔴 CRITICAL
**Dependencies**: All phases complete
**Goal**: Ensure quality before deployment

### Tasks (10 total)

#### QA.1 Run Complete Test Suite
```bash
# Unit and component tests
npm test

# Should see: 215/215 tests passing (or more if tests added)
```

**If failures**: Fix before proceeding

---

#### QA.2 Generate Coverage Report
```bash
npm run test:coverage

# Target: >80% coverage
# Check coverage/lcov-report/index.html
```

**Key files to check**:
- `lib/calculator/` - Should be >90%
- `components/calculator/` - Should be >80%
- `app/` pages - Should be >70%

---

#### QA.3 Production Build
```bash
npm run build

# Check for:
# - Zero TypeScript errors
# - Zero warnings (or only acceptable warnings)
# - Reasonable bundle sizes (<200KB per page)
```

**Success Criteria**:
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (11/11)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB        110 kB
├ ○ /about                               2.1 kB        107 kB
├ ○ /calculator                         26.3 kB        133 kB
├ ○ /results                            28.4 kB        135 kB
...
```

---

#### QA.4 Accessibility Audit
```bash
# Option 1: axe DevTools extension
# - Install in Chrome
# - Visit each page
# - Run audit
# - Fix any violations

# Option 2: Pa11y CLI
npm install -g pa11y
pa11y http://localhost:3000
pa11y http://localhost:3000/calculator
pa11y http://localhost:3000/results
```

**Target**: Zero violations

**Common issues**:
- Missing alt text on images
- Insufficient color contrast
- Missing ARIA labels
- Keyboard navigation broken

---

#### QA.5 Cross-Browser Testing
**Browsers to test**:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

**Test scenarios**:
1. Complete calculator flow
2. View results
3. Print/export functionality
4. Keyboard navigation
5. Form validation

**Tools**:
- BrowserStack (cloud testing)
- Or manual testing on physical devices

---

#### QA.6 Mobile Device Testing
**Devices**:
- iPhone (iOS 15+)
- Android (latest)
- Tablet (iPad, Android tablet)

**Test**:
- Touch interactions
- Mobile progress bar
- Responsive layout
- Form inputs (no zoom on focus)
- Navigation

**Use**:
```bash
npm run test:e2e -- --project="Mobile Safari"
npm run test:e2e -- --project="Mobile Chrome"
```

---

#### QA.7 Security Headers Verification
**Check headers are still configured**:
```bash
# After deploying to staging
curl -I https://your-staging-url.com

# Should see:
# - Content-Security-Policy
# - Strict-Transport-Security
# - X-Frame-Options
# - X-Content-Type-Options
# - etc. (16 total)
```

**Use online tools**:
- https://securityheaders.com
- https://observatory.mozilla.org

**Target**: A+ rating

---

#### QA.8-QA.10 Documentation Updates
**QA.8: Update IMPLEMENTATION_SUMMARY.md**
```markdown
# Implementation Summary

## What Changed (Nov 2025 Update)

### Critical Bug Fixes
- Fixed localStorage validation (Bug #1)
- Fixed analytics tracking (Bug #2)
- Fixed SSR window error (Bug #3)
- Fixed React Hook dependencies (Bug #4)

### New Features Integrated
- Medicare Advantage comparison
- COBRA calculator
- HSA savings calculator
- State-specific cost adjustments
- Carrier recommendations
- Enrollment guide
- Email results
- Copy share link

### Code Quality Improvements
- Refactored Calculator page (686 → 400 lines)
- Refactored Results page (313 → 200 lines)
- Standardized error handling (Result<T, E>)
- Removed dead code (500+ lines)
- Extracted 8 new hooks
- Created 12 new components

### Performance Optimizations
- Fixed unnecessary re-renders
- Added validation debouncing
- Lazy loaded result components
- Optimized array iterations

## Stats
- **Tests**: 215 → 280+ tests
- **Coverage**: 85% → 90%+
- **Bundle Size**: 139KB → ~150KB (more features)
- **Code Quality**: 7.5/10 → 9.5/10
```

**QA.9: Update README.md**
- Feature list accuracy
- Updated screenshots
- New documentation links

**QA.10: Create CHANGELOG.md**
```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2025-11-XX

### Added
- Medicare Advantage vs Original Medicare comparison
- COBRA continuation cost analysis
- HSA tax savings calculator
- State-specific cost adjustments for all 50 states
- Carrier recommendations (UnitedHealthcare, Cigna, BCBS)
- Step-by-step enrollment guide
- Email results functionality
- Copy share link to clipboard
- Cost breakdown by state
- Marketplace links for all states

### Fixed
- localStorage validation requiring minimum 2 residences
- Analytics tracking duplicate parameter
- Window object SSR crash
- React Hook dependencies causing unnecessary re-renders
- Age validation silent fallback masking missing data

### Changed
- Refactored Calculator component (686 → 400 lines)
- Refactored Results component (313 → 200 lines)
- Standardized error handling pattern (Result<T, E>)
- Improved validation debouncing for better performance
- Lazy loading for result components

### Removed
- Legacy residence fields (backward compatibility)
- Unused utility functions
- Console logging in production

## [1.0.0] - 2025-11-01

Initial release
```

---

## 📊 Summary & Timeline

### Phase Overview

| Phase | Duration | Priority | Tasks | Key Deliverables |
|-------|----------|----------|-------|------------------|
| **Phase 1** | 1-2 days | 🔴 Critical | 6 | Bug fixes, test passing |
| **Phase 2** | 4-5 days | 🟠 High | 15 | Hidden features integrated |
| **Phase 3** | 1-2 days | 🟠 High | 8 | Email/share features |
| **Phase 4** | 2-3 days | 🟡 Medium | 10 | Validation improvements |
| **Phase 5** | 1-2 weeks | 🟡 Medium | 24 | Code refactoring |
| **Phase 6** | 2-3 days | 🟢 Low | 6 | Performance optimization |
| **Phase 7** | 1 week | 🟡 Medium | 7 | Quick-win features |
| **Phase 8** | 2-3 weeks | 🟢 Low | 9 | Complex features |
| **Final QA** | 2-3 days | 🔴 Critical | 10 | Production-ready |

### Minimum Viable Improvement (Phases 1-3)
**Timeline**: 4-6 days
**Impact**: Fixes all critical bugs, unlocks hidden features, completes promised features
**Result**: Code quality 7.5 → 8.5

### Recommended Timeline (Phases 1-7)
**Timeline**: 4-5 weeks
**Impact**: Above + validation, refactoring, performance, new features
**Result**: Code quality 7.5 → 9.5

### Full Enhancement (All Phases)
**Timeline**: 6-8 weeks
**Impact**: Everything + complex features
**Result**: Code quality 7.5 → 9.5, feature set expanded 2x

---

## 🎯 Recommended Approach

### Week 1: Critical Path
- **Day 1-2**: Phase 1 (Critical Bugs)
- **Day 3-4**: Phase 2 Part 1 (Medicare Advantage + COBRA)
- **Day 5**: Phase 2 Part 2 (HSA + State Data)

**Checkpoint**: Run tests, deploy to staging

### Week 2: User-Facing Improvements
- **Day 1**: Phase 3 (Email/Share features)
- **Day 2-3**: Phase 4 (Validation improvements)
- **Day 4-5**: Phase 7 Part 1 (Carrier recommendations + enrollment guide)

**Checkpoint**: User testing on staging

### Week 3-4: Code Quality
- **Week 3**: Phase 5 (Refactoring - Part 1)
- **Week 4**: Phase 5 (Refactoring - Part 2) + Phase 6 (Performance)

**Checkpoint**: Code review, performance audit

### Week 5: Polish & Launch
- **Day 1-2**: Phase 7 Part 2 (Final quick-win features)
- **Day 3-4**: Final QA
- **Day 5**: Production deployment

### Week 6-8 (Optional): Advanced Features
- Phase 8 (Scenario comparison, interactive map, etc.)

---

## 📈 Success Metrics

### Before Improvements
- ❌ 4 critical bugs
- ❌ 500+ lines unused code
- ❌ 2 missing promised features
- ⚠️ 8 performance warnings
- ⚠️ Code quality: 7.5/10
- ✅ 215 tests passing
- ✅ TypeScript: 0 errors

### After Phase 1-3 (Minimum)
- ✅ 0 critical bugs
- ✅ All features integrated
- ✅ All promises delivered
- ⚠️ 8 performance warnings (unchanged)
- ⚠️ Code quality: 8.5/10
- ✅ 250+ tests passing
- ✅ TypeScript: 0 errors

### After Phase 1-7 (Recommended)
- ✅ 0 critical bugs
- ✅ 0 unused code
- ✅ All features + 7 new features
- ✅ 0 performance warnings
- ✅ Code quality: 9.5/10
- ✅ 280+ tests passing
- ✅ 90%+ test coverage
- ✅ TypeScript: 0 errors
- ✅ Lighthouse: 95+ score

### After All Phases (Complete)
- All of the above +
- ✅ Scenario comparison
- ✅ Interactive map
- ✅ Drug coverage estimator
- ✅ API integration ready

---

## 💡 Tips for Implementation

### 1. Branch Strategy
```bash
# Create feature branches for each phase
git checkout -b phase-1-critical-bugs
git checkout -b phase-2-hidden-features
# etc.

# Or work directly on main if preferred
```

### 2. Testing Strategy
- Run tests after EACH task completion
- Don't accumulate test failures
- If test fails, fix immediately

### 3. Commit Strategy
```bash
# Atomic commits for each task
git commit -m "Fix localStorage validation bug (#1.1)"
git commit -m "Fix analytics duplicate parameter (#1.2)"
git commit -m "Integrate Medicare Advantage helper (#2.2)"
```

### 4. Documentation Strategy
- Update docs as you go
- Don't save documentation for the end
- Each feature should update relevant docs

### 5. Review Strategy
- Self-review code after each phase
- Check diff before committing
- Run Lighthouse after UI changes

---

## 🚀 Ready to Start?

This plan is comprehensive but flexible. You can:

1. **Start immediately** with Phase 1 (1-2 days, huge impact)
2. **Skip phases** if certain improvements aren't needed
3. **Reorder phases** based on priorities
4. **Add tasks** if you identify additional issues

### Next Steps:

1. Review this plan thoroughly
2. Decide which phases to tackle
3. Set up your development environment
4. Start with Phase 1, Task 1.1
5. Work through tasks sequentially
6. Celebrate progress! 🎉

---

**Questions? Need clarification on any task?**

Just ask! I can provide:
- Detailed code examples for any task
- Alternative implementation approaches
- Testing strategies
- Deployment guidance

**Let's build something great! 🚀**
