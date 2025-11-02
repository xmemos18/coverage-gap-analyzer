# Insurance Term Tooltips

This document explains the tooltip system used to help users understand insurance jargon throughout the application.

## Overview

The application includes a comprehensive tooltip system that automatically adds helpful explanations to insurance-related terms. Users can hover over (or tap on mobile) underlined terms to see plain-language definitions and examples.

## Components

### 1. Tooltip Component (`components/Tooltip.tsx`)

The base tooltip component provides accessible, interactive help text.

**Features:**
- Keyboard accessible (Tab to focus, Escape to close)
- ARIA compliant (role="tooltip", aria-describedby)
- Mobile-friendly (tap to toggle on touch devices)
- Customizable positioning (top, bottom, left, right)
- Auto-dismiss on blur
- Visual indicator (ⓘ icon)

**Usage:**
```tsx
import Tooltip from '@/components/Tooltip';

<Tooltip content="Your definition here" example="Optional example">
  <span>Term to explain</span>
</Tooltip>
```

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| content | string | Yes | - | The definition/explanation |
| example | string | No | - | Optional example text |
| children | ReactNode | Yes | - | The term to wrap |
| position | 'top'\|'bottom'\|'left'\|'right' | No | 'top' | Tooltip position |

### 2. InsuranceTerm Component (`components/InsuranceTerm.tsx`)

Wrapper that automatically looks up insurance terms from the dictionary.

**Usage:**
```tsx
import InsuranceTerm from '@/components/InsuranceTerm';

<InsuranceTerm term="Medicare">
  Medicare-eligible
</InsuranceTerm>
```

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| term | string | Yes | - | Key to look up in dictionary |
| position | 'top'\|'bottom'\|'left'\|'right' | No | 'top' | Tooltip position |
| children | ReactNode | No | term | Display text (defaults to term) |

### 3. InsuranceText Component (`components/InsuranceText.tsx`)

Automatically detects and wraps insurance terms in text.

**Usage:**
```tsx
import InsuranceText from '@/components/InsuranceText';

<InsuranceText text="Medicare Advantage is better than traditional PPO plans" />
// Automatically adds tooltips to "Medicare Advantage" and "PPO"
```

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| text | string | Yes | - | Text to scan for terms |
| position | 'top'\|'bottom'\|'left'\|'right' | No | 'top' | Tooltip position |

## Insurance Terms Dictionary

The dictionary is located in `lib/insurance-terms.ts` and contains **30+ insurance terms** organized into categories:

### Plan Types
- Medicare
- Medicare Advantage
- Medigap
- PPO (Preferred Provider Organization)
- HMO (Health Maintenance Organization)
- EPO (Exclusive Provider Organization)
- ACA (Affordable Care Act)
- HDHP (High Deductible Health Plan)

### Cost Terms
- Premium
- Deductible
- Copay (Copayment)
- Coinsurance
- Out-of-Pocket Maximum

### Coverage Terms
- In-Network
- Out-of-Network
- Network
- Prior Authorization
- Formulary

### Medicare-Specific
- Medicare Part A
- Medicare Part B
- Medicare Part D
- Donut Hole (Coverage Gap)

### Other Terms
- Primary Residence
- Secondary Residence
- Open Enrollment
- Special Enrollment Period
- Pre-existing Condition
- Essential Health Benefits
- Subsidy

## Adding New Terms

To add a new insurance term:

1. **Edit `lib/insurance-terms.ts`:**
```typescript
export const INSURANCE_TERMS: Record<string, InsuranceTerm> = {
  // ... existing terms

  'Your New Term': {
    term: 'Your New Term',
    definition: 'Plain-language explanation of the term.',
    example: 'Optional: A helpful example or use case.',
  },
};
```

2. **Term will automatically be available** in all components using the tooltip system.

3. **Test the new term:**
```typescript
// Add to lib/__tests__/insurance-terms.test.ts
it('should have definition for Your New Term', () => {
  expect(hasDefinition('Your New Term')).toBe(true);
  const term = getInsuranceTerm('Your New Term');
  expect(term?.definition).toContain('expected content');
});
```

## Accessibility Features

### Keyboard Navigation
- **Tab**: Focus on tooltip trigger
- **Enter/Space**: Activate tooltip (mobile)
- **Escape**: Close tooltip

### Screen Reader Support
- Tooltips use `role="tooltip"`
- Trigger has `aria-describedby` when tooltip is visible
- `aria-expanded` indicates tooltip state
- Info icon marked with `aria-hidden="true"` (decorative)

### Visual Indicators
- Dotted underline on term
- ⓘ icon next to term
- Hover effect (solid underline)
- Focus ring for keyboard users

### Mobile Support
- Tap to toggle (instead of hover)
- Larger touch targets
- Auto-detects mobile viewport

## Usage Examples

### Example 1: Single Term in Heading
```tsx
<h3>
  Is anyone <InsuranceTerm term="Medicare">Medicare-eligible</InsuranceTerm>?
</h3>
```

### Example 2: Auto-detect Terms in Text
```tsx
<p>
  <InsuranceText text="Medicare Advantage plans often include prescription drug coverage (Part D) and extra benefits like vision and dental." />
</p>
```

### Example 3: Custom Tooltip
```tsx
<Tooltip
  content="The amount you pay monthly for insurance"
  example="Even if you don't use any healthcare, you still pay your premium"
  position="bottom"
>
  <span>monthly cost</span>
</Tooltip>
```

## Where Tooltips Are Used

### Calculator Steps
- **Step 2 (Household)**: Medicare eligibility

### Results Page
- **Recommendation Summary**: Plan names (Medicare, PPO, etc.)
- **Household Breakdown**: Insurance terms in description
- **Alternative Options**: Plan names, pros/cons descriptions
- **Cost Breakdown**: "Premium" label

## Styling

Tooltips use Tailwind CSS classes for consistent styling:

**Trigger:**
- Border: dotted → solid on hover/focus
- Color: accent blue (#3b82f6)
- Cursor: help (question mark)

**Tooltip Box:**
- Background: dark gray (#111827)
- Text: white
- Padding: 1rem (16px)
- Max width: 18rem (288px)
- Shadow: large drop shadow
- Arrow: 4px border triangle

## Performance Considerations

- Tooltips are lazy-loaded (only render when visible)
- Regex matching uses sorted terms (longest first)
- Mobile detection cached after initial check
- Timeouts cleaned up on unmount

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android 10+)

## Testing

Run tooltip tests:
```bash
npm test -- Tooltip.test.tsx
npm test -- insurance-terms.test.ts
```

**Coverage:**
- ✅ 23 tests for insurance terms dictionary
- ✅ 11 tests for Tooltip component
- ✅ Keyboard interaction tests
- ✅ Accessibility tests

## Future Enhancements

Potential improvements:
- [ ] Search/glossary page with all terms
- [ ] User feedback on helpfulness
- [ ] Translations for Spanish, etc.
- [ ] Audio pronunciations
- [ ] Related terms links
- [ ] Customizable definitions per user state

---

**Last Updated:** 2025-01-01
**Component Version:** 1.0
