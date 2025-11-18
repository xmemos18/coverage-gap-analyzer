# Medicare Plan Finder API Integration

**Status:** ✅ Ready for Implementation
**Created:** November 17, 2025
**Priority:** High - Core Feature for Target Demographic

---

## Overview

Integrated comprehensive Medicare plan lookup functionality using CMS data. This enables the Coverage Gap Analyzer to provide **real Medicare Advantage, Medigap, and Part D plan recommendations** to users with multiple residences.

### What's Been Built

1. **TypeScript Types** (`types/medicare.ts`)
   - 300+ lines of comprehensive type definitions
   - Covers Medicare Advantage, Medigap, Part D plans
   - Includes eligibility, enrollment periods, drug pricing

2. **Service Layer** (`lib/medicare/medicarePlanService.ts`)
   - Database query functions for all plan types
   - Multi-state analysis for snowbirds
   - Cost calculation helpers
   - Recommendation logic

3. **API Routes** (`app/api/medicare/plans/route.ts`)
   - GET endpoint for plan searches
   - POST endpoint for complex queries with prescriptions
   - Multi-state support built-in

---

## API Usage

### Basic Plan Search

```typescript
// Search for Medicare Advantage plans in Miami
GET /api/medicare/plans?state=FL&zipCode=33139&planType=medicare-advantage&minStarRating=4.0

Response:
{
  "success": true,
  "plans": [
    {
      "contractId": "H1234",
      "planId": "567",
      "organizationName": "UnitedHealthcare",
      "planName": "AARP Medicare Advantage Plan 1",
      "monthlyPremium": 0,
      "deductible": 0,
      "maxOutOfPocket": 4900,
      "starRating": 4.5,
      "coversPrescriptionDrugs": true,
      "coversDental": true,
      "coversVision": true,
      "networkType": "PPO",
      "costSummary": {
        "monthlyPremium": 0,
        "annualDeductible": 0,
        "estimatedAnnualCost": 2000,
        "worstCaseScenario": 4900,
        "bestCaseScenario": 500
      }
    }
  ],
  "totalCount": 15,
  "page": 1,
  "limit": 20
}
```

### Multi-State Search (Snowbirds!)

```typescript
// Find plans available in both Florida and New York
GET /api/medicare/plans?multiState=true&states=FL,NY&zipCodes=33139,10001

Response:
{
  "success": true,
  "multiState": true,
  "analysis": {
    "primaryState": "FL",
    "secondaryStates": ["NY"],
    "availableInAllStates": [
      // PPO plans from national carriers
    ],
    "stateSpecificPlans": [
      {
        "state": "FL",
        "topPlans": [...]
      },
      {
        "state": "NY",
        "topPlans": [...]
      }
    ],
    "recommendations": [
      "Consider PPO plans for more flexibility when traveling",
      "Found 3 plans with nationwide networks"
    ]
  }
}
```

### Advanced Search with User Profile

```typescript
POST /api/medicare/plans
Content-Type: application/json

{
  "state": "FL",
  "zipCode": "33139",
  "maxPremium": 100,
  "minStarRating": 4.0,
  "requiresDrugCoverage": true,
  "requiresDental": true,
  "userProfile": {
    "hasChronicConditions": true,
    "takesMultipleMedications": true,
    "frequentTraveler": true,
    "hasPreferredDoctors": true,
    "budgetSensitive": false,
    "estimatedUsage": "high"
  },
  "prescriptions": [
    {
      "drugName": "Lipitor",
      "dosage": "20mg",
      "quantity": 30,
      "form": "tablet",
      "isGeneric": false
    }
  ]
}

Response:
{
  "success": true,
  "recommendedType": "Original Medicare + Medigap",
  "plans": [...],
  "userProfile": {...}
}
```

---

## Integration with Calculator

### Update `useInsuranceAnalysis` Hook

```typescript
// hooks/useInsuranceAnalysis.ts

import { useEffect, useState } from 'react';

export function useInsuranceAnalysis(formData) {
  const [medicareOptions, setMedicareOptions] = useState(null);

  useEffect(() => {
    // Check if user is Medicare-eligible
    const ages = formData.adultAges || [];
    const hasMedicareAge = ages.some(age => age >= 65);

    if (hasMedicareAge) {
      fetchMedicarePlans();
    }
  }, [formData]);

  async function fetchMedicarePlans() {
    const primaryResidence = formData.residences[0];
    const allResidences = formData.residences;

    // Multi-state search if user has multiple residences
    if (allResidences.length > 1) {
      const response = await fetch('/api/medicare/plans?' + new URLSearchParams({
        multiState: 'true',
        states: allResidences.map(r => r.state).join(','),
        zipCodes: allResidences.map(r => r.zip).join(','),
        minStarRating: '4.0'
      }));

      const data = await response.json();
      setMedicareOptions(data.analysis);
    } else {
      // Single state search
      const response = await fetch('/api/medicare/plans?' + new URLSearchParams({
        state: primaryResidence.state,
        zipCode: primaryResidence.zip,
        planType: 'medicare-advantage',
        minStarRating: '4.0'
      }));

      const data = await response.json();
      setMedicareOptions(data);
    }
  }

  return { medicareOptions, ...otherData };
}
```

### Display in Results Page

```typescript
// app/results/page.tsx

{medicareOptions && (
  <section id="medicare-plans" className="mt-12">
    <h2 className="text-3xl font-bold mb-6">Your Medicare Options</h2>

    {medicareOptions.availableInAllStates?.length > 0 && (
      <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 mb-6">
        <h3 className="text-xl font-bold text-blue-900 mb-4">
          ✨ Plans Available in All Your States
        </h3>
        <p className="text-blue-800 mb-4">
          These plans work in both {medicareOptions.primaryState} and {medicareOptions.secondaryStates.join(', ')}
        </p>

        {medicareOptions.availableInAllStates.map(plan => (
          <MedicarePlanCard key={plan.planId} plan={plan} multiState={true} />
        ))}
      </div>
    )}

    {medicareOptions.stateSpecificPlans?.map(({ state, topPlans }) => (
      <div key={state} className="mb-8">
        <h3 className="text-2xl font-bold mb-4">Best Plans in {state}</h3>
        {topPlans.map(plan => (
          <MedicarePlanCard key={plan.planId} plan={plan} />
        ))}
      </div>
    ))}

    <div className="mt-6 p-4 bg-amber-50 rounded-lg">
      <h4 className="font-bold mb-2">💡 Recommendations:</h4>
      <ul className="list-disc pl-5 space-y-1">
        {medicareOptions.recommendations?.map((rec, idx) => (
          <li key={idx}>{rec}</li>
        ))}
      </ul>
    </div>
  </section>
)}
```

---

## Component Examples

### Medicare Plan Card

```typescript
// components/medicare/MedicarePlanCard.tsx

interface MedicarePlanCardProps {
  plan: MedicareAdvantagePlan;
  multiState?: boolean;
}

export function MedicarePlanCard({ plan, multiState }: MedicarePlanCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-blue-400 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-xl font-bold text-gray-900">{plan.planName}</h4>
          <p className="text-gray-600">{plan.organizationName}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={i < plan.starRating ? 'text-yellow-400' : 'text-gray-300'}>
                ★
              </span>
            ))}
            <span className="text-sm font-bold">{plan.starRating}</span>
          </div>
        </div>
      </div>

      {/* Premium */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <div className="text-3xl font-bold text-blue-900">
          ${plan.monthlyPremium}/month
        </div>
        {plan.monthlyPremium === 0 && (
          <div className="text-green-600 font-semibold">$0 Premium Plan!</div>
        )}
      </div>

      {/* Key Features */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-sm text-gray-600">Annual Deductible</div>
          <div className="font-bold">${plan.deductible}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Max Out-of-Pocket</div>
          <div className="font-bold">${plan.maxOutOfPocket.toLocaleString()}</div>
        </div>
      </div>

      {/* Coverage */}
      <div className="flex flex-wrap gap-2 mb-4">
        {plan.coversPrescriptionDrugs && (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
            💊 Drug Coverage
          </span>
        )}
        {plan.coversDental && (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
            🦷 Dental
          </span>
        )}
        {plan.coversVision && (
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
            👓 Vision
          </span>
        )}
        {plan.coversFitness && (
          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
            🏃 Fitness
          </span>
        )}
        {multiState && (
          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
            ✈️ Multi-State Coverage
          </span>
        )}
      </div>

      {/* Network Type */}
      <div className="mb-4">
        <span className={`px-4 py-2 rounded-lg font-semibold ${
          plan.networkType === 'PPO' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {plan.networkType} Plan
        </span>
      </div>

      {/* Cost Summary */}
      {plan.costSummary && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="font-bold mb-2">Estimated Annual Costs:</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Best Case:</div>
            <div className="font-semibold">${plan.costSummary.bestCaseScenario.toLocaleString()}</div>
            <div>Typical:</div>
            <div className="font-semibold text-blue-600">${plan.costSummary.estimatedAnnualCost.toLocaleString()}</div>
            <div>Worst Case:</div>
            <div className="font-semibold">${plan.costSummary.worstCaseScenario.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex gap-3">
        <button className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
          View Plan Details
        </button>
        <button className="flex-1 bg-white border-2 border-blue-600 text-blue-600 font-semibold py-3 px-6 rounded-lg hover:bg-blue-50 transition-colors">
          Compare Plans
        </button>
      </div>

      {/* Contact */}
      <div className="mt-4 text-sm text-gray-600 text-center">
        📞 {plan.phoneNumber}
      </div>
    </div>
  );
}
```

---

## Database Schema

The Medicare integration uses the existing seeded data. Ensure these tables are populated:

```sql
-- Medicare Advantage Plans
SELECT * FROM medicare_advantage_plans
WHERE state = 'FL'
  AND '33139' = ANY(zip_codes)
  AND star_rating >= 4.0
ORDER BY star_rating DESC, monthly_premium ASC;

-- Medigap Plans
SELECT * FROM medigap_plans
WHERE state = 'FL'
  AND plan_letter IN ('G', 'N')
ORDER BY monthly_premium ASC;

-- Part D Plans
SELECT * FROM part_d_plans
WHERE state = 'FL'
  AND star_rating >= 4.0
ORDER BY star_rating DESC, monthly_premium ASC;
```

---

## Testing

### Test the API

```bash
# Test Medicare Advantage search
curl "http://localhost:3000/api/medicare/plans?state=FL&zipCode=33139&planType=medicare-advantage"

# Test multi-state search
curl "http://localhost:3000/api/medicare/plans?multiState=true&states=FL,NY&zipCodes=33139,10001"

# Test with filters
curl "http://localhost:3000/api/medicare/plans?state=FL&zipCode=33139&maxPremium=50&minStarRating=4.5&requiresDental=true"
```

### Test the Service Layer

```typescript
// lib/medicare/__tests__/medicarePlanService.test.ts

import { searchMedicareAdvantagePlans, findMultiStateMedicarePlans } from '../medicarePlanService';

describe('Medicare Plan Service', () => {
  it('should search Medicare Advantage plans', async () => {
    const result = await searchMedicareAdvantagePlans({
      state: 'FL',
      zipCode: '33139',
      minStarRating: 4.0,
    });

    expect(result.plans.length).toBeGreaterThan(0);
    expect(result.plans[0].state).toBe('FL');
    expect(result.plans[0].starRating).toBeGreaterThanOrEqual(4.0);
  });

  it('should find multi-state plans', async () => {
    const result = await findMultiStateMedicarePlans(
      ['FL', 'NY'],
      ['33139', '10001']
    );

    expect(result.primaryState).toBe('FL');
    expect(result.secondaryStates).toContain('NY');
  });
});
```

---

## Next Steps

### Phase 1: Basic Integration (Today)
1. ✅ Types created
2. ✅ Service layer built
3. ✅ API routes implemented
4. ⏳ Add to recommendation engine
5. ⏳ Display in Results page
6. ⏳ Test end-to-end

### Phase 2: Enhancements (This Week)
- [ ] Add Medicare plan comparison tool
- [ ] Implement prescription drug cost calculator
- [ ] Add provider network lookup
- [ ] Create enrollment period tracker
- [ ] Add "Enroll Now" CTAs with affiliate links

### Phase 3: Revenue Generation (Next Week)
- [ ] Integrate with eHealth API for enrollments
- [ ] Add commission tracking
- [ ] Create Medicare-specific landing pages
- [ ] Optimize for SEO ("Medicare plans for snowbirds")

---

## Revenue Potential

**Average Commissions:**
- Medicare Advantage: $200-300 per enrollment
- Medigap: $300-400 per enrollment
- Part D: $50-100 per enrollment

**Projected Monthly Revenue (Conservative):**
- 50 Medicare enrollments/month
- Average commission: $250
- **Monthly revenue: $12,500**

**Projected Annual Revenue:**
- **$150,000/year** from Medicare alone

---

## Key Features for Snowbirds

The Medicare integration specifically addresses snowbird pain points:

1. **Multi-State Coverage Analysis** ✅
   - Shows which plans work in multiple states
   - Identifies PPO plans for travel flexibility
   - Highlights national network carriers

2. **Cost Comparison Across States** ✅
   - Compare same plan in different ZIP codes
   - Show state-specific premiums
   - Estimate total annual costs

3. **Network Verification** (Coming Soon)
   - Check if doctors are in-network in both states
   - Find hospitals in all locations
   - Identify 24/7 telehealth options

4. **Prescription Coverage** (Coming Soon)
   - Verify drugs are covered in all states
   - Find pharmacies in both locations
   - Compare mail-order vs retail costs

---

## Maintenance

### Monthly Data Updates

CMS releases updated Medicare plan data monthly. To keep data fresh:

```bash
# Run monthly data sync script
npm run medicare:sync

# Or manually download from:
# https://www.cms.gov/data-research/statistics-trends-and-reports/medicare-advantagepart-d-contract-and-enrollment-data
```

### Monitoring

- Track API response times
- Monitor plan search queries
- Alert on 4xx/5xx errors
- Log popular searches for optimization

---

## Documentation

- **Types:** `types/medicare.ts`
- **Service:** `lib/medicare/medicarePlanService.ts`
- **API:** `app/api/medicare/plans/route.ts`
- **This Guide:** `MEDICARE_API_INTEGRATION.md`

---

**Created by:** Claude Code
**Date:** November 17, 2025
**Status:** Ready for Implementation 🚀
