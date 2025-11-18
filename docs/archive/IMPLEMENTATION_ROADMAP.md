# Key Insurance Matters - Enhancement Implementation Roadmap

## Overview
This document outlines the complete implementation plan for enhancing the insurance calculator to serve both sophisticated and basic users. All implementations use FREE solutions only (no paid APIs or services).

---

## PHASE 1: FOUNDATION - Data Collection Enhancement (Week 1)
**Goal:** Collect critical missing data to improve recommendation accuracy

### Features to Implement:
1. Employment status and employer insurance availability
2. Income range for subsidy calculations
3. Residence time split and primary designation
4. Health profile basics

### PROMPT 1.1: Add Employment & Income Questions
```
Add new questions to Step 2 (Household):

1. After the household composition section, add an "Employment & Coverage" section:
   - "Does anyone in the household have access to employer health insurance?"
     - Options: [Yes / No / Not sure]
   - If Yes: "What is the monthly employer contribution (how much does your employer pay)?"
     - Input: Dollar amount (optional)

2. Add to Step 4 (Budget) as a new step or sub-section:
   - "What is your household income range?" (for subsidy eligibility)
     - Options:
       - Under $30,000
       - $30,000 - $50,000
       - $50,000 - $75,000
       - $75,000 - $100,000
       - $100,000 - $150,000
       - Over $150,000
       - Prefer not to say
   - Help text: "This helps us determine if you qualify for financial assistance"

Update types/index.ts to include:
- hasEmployerInsurance: boolean
- employerContribution: number
- incomeRange: string

Update form validation, localStorage, URL parameters, and results display accordingly.
```

### PROMPT 1.2: Add Residence Time Split
```
Update Step 1 (Residences) to collect more details:

1. For each residence, add:
   - Radio buttons: "Is this your primary residence?" (only one can be primary)
   - Dropdown: "How much time do you spend here per year?"
     - Options:
       - 1-3 months
       - 4-6 months
       - 7-9 months
       - 10-12 months

2. Add help text: "Your primary residence is where you spend most time and receive mail"

Update Residence type in types/index.ts:
- isPrimary: boolean
- monthsPerYear: number (1-12)

Update validation to ensure:
- Exactly one primary residence
- Total months can exceed 12 (people can be flexible with estimates)

Update calculator logic to use primary residence for state-specific recommendations.
```

### PROMPT 1.3: Add Basic Health Profile
```
Add new Step 2.5 (Health Information) between Household and Current Insurance:

1. "Does anyone have ongoing medical conditions?" [Yes / No]
   - If Yes: Checkboxes for common conditions:
     - Diabetes
     - Heart disease
     - High blood pressure
     - Asthma/COPD
     - Arthritis
     - Cancer (current or recent)
     - Other chronic condition

2. "How many prescription medications does your household take regularly?"
   - Options: [None / 1-3 / 4-6 / 7-10 / More than 10]

3. "Do you have preferred doctors or hospitals you want to keep?"
   - Options: [Yes, very important / Somewhat important / No preference]

Update types/index.ts:
- hasChronicConditions: boolean
- chronicConditions: string[]
- prescriptionCount: string
- providerPreference: string

This will inform plan recommendations (PPO vs HMO, deductible level, etc.)
```

### PROMPT 1.4: Update Form State Management
```
Update the calculator reducer and form state management:

1. Update lib/calculatorReducer.ts to handle new fields
2. Update localStorage schema version (increment to v2)
3. Update URL parameter encoding/decoding in lib/urlValidation.ts
4. Update all type definitions
5. Add migration logic for users with old saved data
6. Update all tests to include new fields
```

**Deliverables:**
- Enhanced data collection (7 new data points)
- Backward-compatible form state
- All tests passing
- Git commit: "feat(phase1): Add employment, income, and health profile questions"

---

## PHASE 2: INTELLIGENT CALCULATIONS (Week 2)
**Goal:** Use new data to provide smarter, personalized recommendations

### Features to Implement:
1. ACA subsidy calculator (free, rules-based)
2. Employer vs. marketplace comparison
3. Medicaid eligibility screening
4. Utilization-based plan recommendations

### PROMPT 2.1: Build ACA Subsidy Calculator
```
Create new file: lib/calculator/subsidyCalculator.ts

Implement Federal Poverty Level (FPL) based subsidy calculations:

1. Constants (2024 FPL):
   - Individual: $15,060
   - Add per person: $5,380
   - Calculate household FPL: baseAmount + (householdSize - 1) * perPersonAmount

2. Calculate subsidy eligibility:
   - Income < 138% FPL → Medicaid eligible (in expansion states)
   - Income 138-400% FPL → Premium tax credit eligible
   - Income > 400% FPL → No subsidy (unless using temporary ACA expansion)

3. Estimate monthly premium tax credit:
   - 138-150% FPL: Pay 0-2% of income
   - 150-200% FPL: Pay 2-4% of income
   - 200-250% FPL: Pay 4-6.5% of income
   - 250-300% FPL: Pay 6.5-8.5% of income
   - 300-400% FPL: Pay 8.5% of income

4. Add list of Medicaid expansion states (free data):
   - States WITH expansion: List ~40 states
   - States WITHOUT expansion: List ~10 states

5. Return:
   - medicaidEligible: boolean
   - subsidyEligible: boolean
   - estimatedMonthlySubsidy: number
   - estimatedAfterSubsidyCost: number
   - explanation: string

Use this in recommendations to show "Before subsidy" and "After subsidy" costs.
```

### PROMPT 2.2: Employer vs. Marketplace Comparison
```
Create new file: lib/calculator/employerComparison.ts

If user has employer insurance available:

1. Calculate "affordability" (ACA employer coverage rules):
   - If employer plan costs > 9.12% of household income → NOT affordable
   - User can get marketplace subsidy even with employer coverage available

2. Compare employer plan vs. marketplace:
   - Factor in employer contribution
   - Compare total cost
   - Show recommendation: "Keep employer plan" vs. "Switch to marketplace"

3. Add to recommendation output:
   - employerPlanAnalysis: {
       isAffordable: boolean,
       employerPlanCost: number,
       marketplaceCostAfterSubsidy: number,
       recommendation: string,
       savings: number
     }

4. Display in results with clear comparison
```

### PROMPT 2.3: Medicaid Eligibility Screener
```
Update lib/calculator/subsidyCalculator.ts to add Medicaid screening:

1. Check if user's state has Medicaid expansion
2. Check income vs. 138% FPL threshold
3. Check household composition (pregnant, children, etc.)
4. Return Medicaid eligibility with explanation

5. If Medicaid eligible:
   - Override all other recommendations
   - Show "You may qualify for Medicaid (free or low-cost coverage)"
   - Provide state Medicaid office links
   - Explain next steps

6. Create static list of state Medicaid websites (free data)
   - Store in lib/calculator/medicaidResources.ts
   - Include application URLs for all 50 states
```

### PROMPT 2.4: Utilization-Based Plan Recommendations
```
Update lib/calculator/recommendations.ts to use health profile:

1. For users with chronic conditions or many prescriptions:
   - Recommend lower deductible plans
   - Emphasize PPO over HMO (flexibility for specialists)
   - Warn about drug formularies
   - Calculate expected total cost of care

2. For healthy users (no conditions, few Rx):
   - Recommend HDHP with HSA
   - Explain tax advantages
   - Show premium savings

3. For users with strong provider preferences:
   - Prioritize broad network plans
   - Warn about HMO/EPO network restrictions
   - Suggest checking provider directories

4. Add to actionItems based on profile:
   - "Check if your medications are covered"
   - "Verify your doctors are in-network"
   - "Consider HDHP + HSA for tax savings"
```

**Deliverables:**
- Subsidy calculator (rules-based, free)
- Medicaid screening
- Employer comparison tool
- Smarter recommendations based on health profile
- Git commit: "feat(phase2): Add subsidy calculator and intelligent recommendations"

---

## PHASE 3: USER EXPERIENCE - Simplification (Week 3)
**Goal:** Make the calculator accessible to basic users

### Features to Implement:
1. Simple mode toggle
2. Inline tooltips and explanations
3. Plain English results
4. Visual cost breakdowns
5. Concrete action steps

### PROMPT 3.1: Add Simple Mode Toggle
```
Create new component: components/SimpleModeToggle.tsx

1. Add toggle at top of calculator:
   [🎯 Simple Mode] [⚙️ Advanced Mode]

2. When Simple Mode active:
   - Skip Step 2.5 (Health Information)
   - Skip Step 3 (Current Insurance)
   - Only ask essential questions:
     - Where do you live? (residences)
     - Who needs coverage? (ages only, no employment)
     - What's your budget?
   - Auto-set reasonable defaults for skipped fields

3. Store mode preference in localStorage

4. Show mode badge on results page

5. Allow switching modes mid-flow with confirmation:
   "Switching to Advanced Mode will ask more questions for better recommendations. Continue?"
```

### PROMPT 3.2: Add Tooltip System
```
Create new component: components/InsuranceTooltip.tsx

1. Reusable tooltip component:
   <InsuranceTooltip term="deductible">
     {children}
   </InsuranceTooltip>

2. Create glossary file: lib/insuranceGlossary.ts
   - Define all insurance terms
   - Plain English explanations
   - Analogies for complex concepts
   - Examples

3. Terms to include:
   - Premium, Deductible, Copay, Coinsurance
   - Out-of-pocket maximum
   - PPO, HMO, EPO, POS
   - Medicare Parts A, B, C, D
   - Medigap, Medicare Advantage
   - HSA, FSA
   - Network, In-network, Out-of-network
   - Formulary, Prior authorization

4. Add tooltips throughout calculator and results:
   - Next to all technical terms
   - In form labels
   - In recommendation explanations
   - In action items

5. Style: Hover popup with arrow, mobile-friendly tap
```

### PROMPT 3.3: Plain English Results Rewrite
```
Update all recommendation text to be more accessible:

1. Simplify insurance plan names:
   - "Original Medicare + Medigap" → "Basic Medicare + Extra Coverage"
   - "National PPO" → "Nationwide Flexible Plan"
   - "Medicare Advantage" → "All-in-One Medicare Plan"
   - "HDHP" → "Low-Premium, High-Deductible Plan"

2. Add "What this means" explanations after each recommendation:
   "Recommended: Nationwide Flexible Plan

   What this means:
   - You can see any doctor without referrals
   - Works in all your states (FL, NY)
   - Pay more per month, less when you visit doctors
   - Good if you want flexibility"

3. Simplify reasoning text:
   Before: "A national PPO plan gives you flexibility to see doctors across all states without referrals or network restrictions."

   After: "This plan works everywhere you live. You don't need permission to see specialists. No network restrictions."

4. Break down costs clearly:
   "Estimated Monthly Cost: $600-900

   This includes:
   ✓ Doctor visits
   ✓ Hospital care
   ✓ Emergency services
   ✓ Preventive care (free)

   Not included (pay separately):
   • Prescription drugs
   • Dental care
   • Vision care"

5. Add "In other words" sections for key concepts
```

### PROMPT 3.4: Visual Cost Breakdown
```
Create new component: components/results/VisualCostBreakdown.tsx

1. Add visual elements to cost display:
   - Bar chart comparing plans (use CSS, no chart library)
   - Color-coded affordability indicator:
     - Green: Within budget
     - Yellow: Slight stretch
     - Red: Over budget

2. Create comparison bars:
   - Current plan vs. Recommended plan
   - Monthly cost vs. Annual cost
   - Before subsidy vs. After subsidy

3. Add "Your portion" vs. "Insurance pays" visualization:
   - Simple percentage breakdown
   - Visual pie chart using CSS (conic-gradient)

4. Mobile-friendly, responsive design

5. Use existing Tailwind CSS (no new dependencies)
```

### PROMPT 3.5: Concrete Action Steps
```
Update action items to be much more specific:

1. Replace generic actions with step-by-step instructions:

   Before: "Shop for Medigap Plan G or N"

   After:
   "Step 1: Visit Medicare.gov Plan Finder
   → Go to medicare.gov/plan-compare
   → Enter your ZIP code: 12345

   Step 2: Filter for Medigap plans
   → Select 'Medicare Supplement Insurance (Medigap)'
   → Choose 'Plan G' or 'Plan N'

   Step 3: Compare prices
   → Look at at least 3 companies
   → Choose the cheapest (coverage is identical)

   Step 4: Enroll
   → You have 6 months after turning 65
   → No medical questions during this period

   Need help? Call 1-800-MEDICARE"

2. Add actual links to resources:
   - Medicare.gov plan finder
   - Healthcare.gov
   - State insurance department websites
   - SSA.gov for enrollment

3. Add deadlines and urgency:
   - "Open Enrollment: Nov 1 - Jan 15"
   - "You have X days until deadline"
   - "Special Enrollment Period if you qualify"

4. Include contact information:
   - Phone numbers for Medicare, SSA
   - State SHIP (State Health Insurance Assistance Program)
   - Local insurance counselors (free)
```

**Deliverables:**
- Simple mode for basic users
- Comprehensive tooltip system
- Plain English throughout
- Visual cost comparisons
- Actionable, specific next steps
- Git commit: "feat(phase3): Add simple mode and improve user experience"

---

## PHASE 4: ADVANCED FEATURES I - Prescription & Provider (Week 4)
**Goal:** Add critical features for Medicare and plan selection

### Features to Implement:
1. Prescription drug basic analyzer
2. Provider preference integration
3. Plan type recommender (PPO vs HMO vs EPO)
4. Network breadth estimator

### PROMPT 4.1: Basic Prescription Drug Module
```
Create new component: components/calculator/PrescriptionDrugInput.tsx

1. Add optional step after Health Information:
   "Do you want to add your prescription medications? (Optional but recommended for 65+)"

2. If yes, allow users to add medications:
   - Drug name (text input)
   - Dosage (text input)
   - Frequency (dropdown: Daily, Weekly, Monthly, As needed)
   - Add up to 10 medications

3. Create drug category classifier (free, rules-based):
   lib/calculator/drugCategories.ts
   - Categorize by type: Brand-name, Generic, Specialty
   - Estimate typical monthly costs (ranges):
     - Generic: $10-50/month
     - Brand-name: $100-500/month
     - Specialty: $500-3000/month
   - List common expensive drugs (free data)

4. For Medicare users with drugs:
   - Emphasize Part D enrollment
   - Warn about "donut hole" (coverage gap)
   - Recommend Medigap + Part D over Medicare Advantage if many expensive drugs

5. Add to cost estimates:
   - "Estimated prescription costs: $X-Y/month (not included in plan premium)"
   - "Consider these costs when comparing plans"

6. Update recommendations based on drug needs:
   - High drug costs → Part D plan with good formulary
   - Few/cheap drugs → Basic Part D may be enough
```

### PROMPT 4.2: Provider Preference Integration
```
Update recommendation logic based on provider preferences:

1. If user says "Yes, very important" to keeping providers:

   For Medicare users:
   - Emphasize Original Medicare (works with any provider accepting Medicare)
   - Warn against Medicare Advantage (network restrictions)
   - Add action item: "Verify your doctors accept Medicare: Call and ask"

   For under-65 users:
   - Recommend broad-network PPO
   - Warn against HMO/EPO (limited networks)
   - Add specific action: "Before enrolling, call your doctors and ask:
     1. Do you accept [insurance company] network?
     2. Are you accepting new patients?
     3. What's the wait time for appointments?"

2. If "Somewhat important":
   - Recommend PPO but note HMO is cheaper option
   - Show both in alternatives

3. If "No preference":
   - Open to HMO (lower cost)
   - Emphasize cost savings

4. Add to results:
   "Based on your need to keep current doctors:
   ✓ Choose plans with broad networks
   ✓ Verify provider acceptance before enrolling
   ⚠️ HMO plans limit your choices - check carefully"
```

### PROMPT 4.3: Plan Type Recommender
```
Create lib/calculator/planTypeRecommender.ts

Algorithm to recommend plan type (HMO vs PPO vs EPO vs HDHP):

Decision tree:
1. Multiple states + strong provider preference → PPO
2. Single state + no provider preference + low budget → HMO
3. Healthy + high income + want tax savings → HDHP
4. Chronic conditions + many specialists → PPO
5. Medicare eligible → Original Medicare + Medigap (not MA)

For each recommendation, explain why:
"We recommend PPO because:
✓ You live in 2 states (FL, NY)
✓ You want to keep your current doctors
✓ PPO works nationwide
✗ HMO would limit you to one state's network"

Add this to the recommendation reasoning section.
```

### PROMPT 4.4: Network Breadth Estimator
```
Create visual indicator for network size:

1. Add to each plan recommendation:
   Network Size: ████████░░ (80% of providers)
   - Large network (thousands of doctors)
   - Medium network (hundreds of doctors)
   - Small network (limited providers)

2. Estimate based on plan type:
   - PPO: Large (80-90% of providers)
   - EPO: Medium (50-70% of providers)
   - HMO: Small to Medium (30-60% of providers)
   - Original Medicare: Largest (95%+ of providers)

3. Show state-by-state for multi-state users:
   "Network coverage in your states:
   Florida: ████████░░ Large network
   New York: ███████░░░ Medium network"

4. Add warnings:
   ⚠️ "Small network - verify your doctors are included"
   ✓ "Large network - most doctors participate"
```

**Deliverables:**
- Prescription drug input and cost estimator
- Provider-aware recommendations
- Plan type decision logic
- Network size visualizations
- Git commit: "feat(phase4): Add prescription and provider analysis"

---

## PHASE 5: ADVANCED FEATURES II - Financial Intelligence (Week 5)
**Goal:** Help users understand total costs and tax implications

### Features to Implement:
1. Total Cost of Care calculator
2. HSA optimizer
3. Multi-year projections
4. Tax impact calculator

### PROMPT 5.1: Total Cost of Care Calculator
```
Create lib/calculator/totalCostOfCare.ts

Calculate annual total cost (premium + expected out-of-pocket):

1. Start with annual premium (monthly × 12)

2. Estimate utilization based on health profile:

   Minimal utilization (healthy, no conditions):
   - Primary care visits: 1-2/year
   - Specialist visits: 0-1/year
   - ER visits: 0/year
   - Hospital stays: 0/year
   - Prescriptions: 0-3
   - Estimated OOP: $500-1,500/year

   Moderate utilization (some conditions):
   - Primary care: 3-6/year
   - Specialist: 2-4/year
   - ER: 0-1/year
   - Hospital: 0/year
   - Prescriptions: 4-10
   - Estimated OOP: $2,000-5,000/year

   High utilization (chronic conditions, many Rx):
   - Primary care: 6+/year
   - Specialist: 6+/year
   - ER: 1-2/year
   - Hospital: Possible
   - Prescriptions: 10+
   - Estimated OOP: $5,000-OOP max

3. Apply deductible and coinsurance:
   - User pays 100% until deductible met
   - Then coinsurance (typically 20%) until OOP max

4. Show three scenarios:
   "Total Cost of Care Estimates:

   Best case (stay healthy): $X/year
   - Premiums: $7,200
   - Out-of-pocket: $500
   - Total: $7,700

   Expected case (typical use): $Y/year
   - Premiums: $7,200
   - Out-of-pocket: $2,500
   - Total: $9,700

   Worst case (major medical event): $Z/year
   - Premiums: $7,200
   - Out-of-pocket: $8,000 (OOP max)
   - Total: $15,200"

5. Compare plans on total cost, not just premium
```

### PROMPT 5.2: HSA Optimizer
```
Create lib/calculator/hsaOptimizer.ts

For users eligible for HSA (HDHP plans):

1. Calculate HSA eligibility:
   - Must have HDHP
   - Cannot have other health coverage
   - Not enrolled in Medicare
   - Not claimed as dependent

2. Show contribution limits (2024):
   - Individual: $4,150/year
   - Family: $8,300/year
   - Age 55+ catch-up: +$1,000/year

3. Calculate tax savings:
   - HSA contributions are tax-deductible
   - Estimate federal tax bracket from income:
     - <$30k: 12%
     - $30-50k: 12%
     - $50-100k: 22%
     - $100-150k: 24%
     - $150k+: 32%

   - Tax savings = contribution × tax rate
   - Example: $4,150 × 22% = $913/year saved

4. Show triple tax advantage:
   "HSA Benefits:
   1. ✓ Tax deduction when you contribute
   2. ✓ Tax-free growth (invest in stocks/bonds)
   3. ✓ Tax-free withdrawals for medical expenses

   This is better than a 401k for medical savings!"

5. Add to HDHP recommendations:
   "Estimated annual savings with HSA:
   - Premium savings vs PPO: $3,000
   - Tax savings: $913
   - Total benefit: $3,913/year

   Trade-off: Higher deductible ($7,000 vs $1,000)
   Good fit if: Healthy, can afford upfront costs, want tax benefits"
```

### PROMPT 5.3: Multi-Year Projections
```
Create lib/calculator/multiYearProjection.ts

Project costs over 3 years accounting for:

1. Aging:
   - Calculate household ages in years 1, 2, 3
   - Flag when someone turns 65 (Medicare eligible)
   - Adjust premiums accordingly

2. Premium inflation:
   - Assume 5-7% annual increase (historical average)
   - Show projected costs:
     Year 1: $7,200
     Year 2: $7,560 (+5%)
     Year 3: $7,938 (+5%)

3. Life events:
   - If children turning 18 → off parent's plan
   - If adults turning 26 → no longer dependent
   - If adults turning 65 → Medicare transition

4. Display as table:
   "3-Year Cost Projection:

   Year 1 (2024):
   - Household: 2 adults (45, 43), 2 kids (10, 12)
   - Plan: Family PPO
   - Cost: $7,200/year

   Year 2 (2025):
   - Household: Same
   - Plan: Family PPO
   - Cost: $7,560/year (+5%)

   Year 3 (2026):
   - Household: 2 adults (47, 45), 2 kids (12, 14)
   - Plan: Family PPO
   - Cost: $7,938/year (+5%)

   Total 3-year cost: $22,698"

5. Highlight savings opportunities:
   "Consider: Switching to HDHP could save $8,000 over 3 years"
```

### PROMPT 5.4: Tax Impact Calculator
```
Create lib/calculator/taxImpact.ts

Calculate tax implications:

1. For self-employed users:
   - Health insurance premiums are deductible
   - Calculate tax savings:
     Premium × Tax rate = Savings
     Example: $7,200 × 24% = $1,728/year saved

   - Show net cost:
     "If self-employed:
     Gross premium: $7,200/year
     Tax deduction: -$1,728
     Net cost: $5,472/year"

2. For ACA marketplace users:
   - Premium tax credits reduce cost
   - Show before and after:
     "Before tax credit: $7,200/year
     Premium tax credit: -$3,600
     Your cost: $3,600/year"

3. For HSA-eligible:
   - Show contribution tax savings (from 5.2)
   - Show investment growth potential (tax-free)

4. For high earners (>$200k):
   - Note IRMAA (Medicare surcharges)
   - Warn about Affordable Care Act tax (3.8% on investment income)

5. Display summary:
   "Tax Impact Summary:

   Premium payments: $7,200
   Tax deductions: $1,728
   Tax credits: $0
   HSA tax savings: $913

   Total tax benefit: $2,641/year
   Effective cost: $4,559/year"
```

**Deliverables:**
- Total cost of care calculator
- HSA optimization tool
- 3-year cost projections
- Tax impact analysis
- Git commit: "feat(phase5): Add financial intelligence features"

---

## PHASE 6: STATE-SPECIFIC INTELLIGENCE (Week 6)
**Goal:** Provide state-specific guidance and resources

### Features to Implement:
1. State subsidy programs database
2. Medicaid expansion status
3. State marketplace links
4. State-specific regulations

### PROMPT 6.1: State Programs Database
```
Create lib/calculator/statePrograms.ts

Build database of state-specific programs (static data, free):

1. Essential Plan states:
   - New York: Essential Plan (income <$25,000)
   - Details, eligibility, application links

2. State subsidy programs:
   - California: Covered California subsidies
   - Massachusetts: ConnectorCare
   - Minnesota: MinnesotaCare
   - etc.

3. For each state, include:
   {
     state: 'NY',
     programs: [
       {
         name: 'NY Essential Plan',
         eligibility: 'Income 138-200% FPL',
         benefits: '$0-20/month premium',
         link: 'https://info.nystateofhealth.ny.gov/essential-plan'
       }
     ],
     medicaidExpanded: true,
     marketplaceUrl: 'https://nystateofhealth.ny.gov',
     sipPhoneNumber: '1-800-333-4114'
   }

4. Use in recommendations:
   "Based on your location in New York:
   ✓ You may qualify for NY Essential Plan
   ✓ Premium: $0-20/month
   ✓ Income limit: $25,000
   → Apply at: nystateofhealth.ny.gov"
```

### PROMPT 6.2: Medicaid Expansion Map
```
Create lib/calculator/medicaidExpansion.ts

Static list of expansion status by state:

1. Expansion states (40): Full list with expansion year
2. Non-expansion states (10): Full list

3. Show impact on recommendations:

   Expansion state + income <138% FPL:
   "You likely qualify for Medicaid!
   ✓ Free or very low cost
   ✓ Comprehensive coverage
   ✓ No monthly premium
   → Apply: [state Medicaid website]"

   Non-expansion state + income <138% FPL:
   "Your state hasn't expanded Medicaid.
   ⚠️ You may fall in coverage gap
   ⚠️ Income too low for marketplace subsidies
   → Contact: [state health department]
   → Consider: Short-term plans or CHIP (if children)"

4. Visual indicator:
   "Florida: ✓ Medicaid expanded"
   "Texas: ✗ Medicaid not expanded"
```

### PROMPT 6.3: State Marketplace Router
```
Update results to link to correct marketplace:

1. State-based marketplaces (15 states):
   - California: CoveredCA.com
   - New York: NYStateOfHealth.ny.gov
   - Massachusetts: MAhealthconnector.org
   - etc.

2. Healthcare.gov states (35 states)

3. Dynamic link generation:
   "Ready to enroll?
   → [Your state]: [Correct marketplace link]

   For California residents: Visit CoveredCA.com
   For all other states: Visit Healthcare.gov"

4. Add state-specific enrollment help:
   "Need help enrolling?
   - Phone: [state enrollment line]
   - In-person: [state navigator program]
   - Language assistance: Available in [languages]"
```

### PROMPT 6.4: State Regulations Notice
```
Create lib/calculator/stateRegulations.ts

Highlight state-specific rules:

1. Community rating states:
   - New York, Vermont, Massachusetts
   - "Your state doesn't charge more for age"
   - Premiums same regardless of health status

2. Individual mandate states:
   - California, Massachusetts, New Jersey, Rhode Island, DC
   - "Your state requires health insurance"
   - Tax penalty: $X if uninsured
   - Exemptions available

3. Short-term plan restrictions:
   - Some states ban short-term plans
   - Some limit duration
   - Show availability by state

4. Add to recommendations:
   "California-specific information:
   ⚠️ Individual mandate: You must have insurance or pay penalty
   ⚠️ Penalty: $850/adult, $425/child (2024)
   ✓ Extra subsidies available through Covered California
   → Enroll at: CoveredCA.com"
```

**Deliverables:**
- State program database (50 states)
- Medicaid expansion status
- Correct marketplace links
- State regulation warnings
- Git commit: "feat(phase6): Add state-specific intelligence"

---

## PHASE 7: ENHANCED RESULTS & SHARING (Week 7)
**Goal:** Improve results presentation and add sharing capabilities

### Features to Implement:
1. Enhanced comparison tables
2. Print-optimized layout
3. Email results (free)
4. Save and bookmark results
5. FAQ integration

### PROMPT 7.1: Plan Comparison Table
```
Create component: components/results/PlanComparisonTable.tsx

Side-by-side comparison of recommended plan + alternatives:

Table columns:
- Plan Name
- Monthly Premium
- Annual Deductible
- Out-of-Pocket Max
- Network Size
- Best For
- Learn More Link

Features:
- Responsive (stacks on mobile)
- Sortable columns
- Highlight recommended plan (green border)
- Color-coded costs (green=good, red=expensive)
- Expandable rows for details

Example:
| Plan              | Premium | Deductible | OOP Max | Network |
|-------------------|---------|------------|---------|---------|
| National PPO ⭐   | $750    | $2,000     | $8,000  | Large   |
| Medicare Advantage| $25     | $500       | $6,000  | Medium  |
| HDHP with HSA     | $350    | $7,000     | $7,000  | Large   |
```

### PROMPT 7.2: Enhanced Print Layout
```
Update print styles (globals.css @media print):

1. Remove:
   - Navigation
   - Footer
   - Share buttons
   - Interactive elements
   - Password gate

2. Optimize:
   - Single column layout
   - Black and white friendly
   - Page breaks between sections
   - Include all critical info

3. Add print-only header:
   "Key Insurance Matters - Your Personalized Results
   Generated: [date]
   Household: [details]
   Locations: [states]"

4. Add disclaimer at bottom:
   "This is an estimate. Actual costs may vary.
   Consult a licensed insurance agent before enrolling."

5. Include QR code (or URL) to return to results online
```

### PROMPT 7.3: Email Results (Free Solution)
```
Implement mailto: link (no backend needed):

1. Add "Email Results" button in ShareButtons component

2. Generate email content:
   - Subject: "My Health Insurance Analysis from Key Insurance Matters"
   - Body: Plain text summary with results URL

3. On click, open mailto: link:
   ```javascript
   const subject = encodeURIComponent('My Health Insurance Results');
   const body = encodeURIComponent(`
   Here are my personalized health insurance recommendations:

   Household: ${householdSummary}
   Locations: ${states}
   Recommended Plan: ${recommendedPlan}
   Estimated Cost: ${cost}

   View full details: ${window.location.href}

   Generated by Key Insurance Matters
   `);

   window.location.href = `mailto:?subject=${subject}&body=${body}`;
   ```

4. Add "Send to myself" option (auto-fill user's email if collected)

Alternative: Add "Copy Summary" button to copy formatted text to clipboard
```

### PROMPT 7.4: Save & Bookmark System
```
Enhance URL bookmarking:

1. Add "Save Results" button that:
   - Copies current URL to clipboard
   - Shows confirmation: "Link copied! Bookmark this to return later"
   - Saves to browser localStorage as "saved results"

2. Add "My Saved Results" section:
   - Show list of previously generated results
   - Display summary: Date, household, cost
   - Link to re-open
   - Delete option

3. Create results history sidebar:
   "Your Previous Analyses:
   [Jan 15, 2024] 2 adults (NY, FL) - $850/mo - View
   [Dec 3, 2023] Family of 4 - $1,800/mo - View"

4. Add localStorage management:
   - Store last 5 results
   - Auto-delete after 90 days
   - Export all results as JSON
```

### PROMPT 7.5: Integrated FAQ Section
```
Add FAQ component at bottom of results page:

Create components/results/ResultsFAQ.tsx

Common questions specific to their results:

For Medicare users:
- "When should I enroll in Medicare?"
- "What's the difference between Plan G and Plan N?"
- "Do I need prescription drug coverage?"

For marketplace users:
- "How do I apply for subsidies?"
- "What if I can't afford the premium?"
- "Can I change plans mid-year?"

For multi-state users:
- "Will my insurance work in both states?"
- "Do I need separate plans for each state?"
- "What if I move between states?"

Dynamic based on household:
- Show relevant questions only
- Link to detailed answers
- Expand/collapse sections
- Search functionality
```

**Deliverables:**
- Side-by-side comparison table
- Print-optimized layout
- Email and copy functionality
- Results bookmarking system
- Context-aware FAQ
- Git commit: "feat(phase7): Enhance results display and sharing"

---

## PHASE 8: ENROLLMENT GUIDANCE (Week 8)
**Goal:** Help users actually enroll in coverage

### Features to Implement:
1. Enrollment calendar
2. Deadline tracker
3. Special Enrollment Period (SEP) checker
4. Step-by-step enrollment guide
5. Required documents checklist

### PROMPT 8.1: Enrollment Calendar
```
Create lib/calculator/enrollmentCalendar.ts

Define key dates:

1. Medicare:
   - Initial Enrollment Period: 3 months before + month of + 3 months after 65th birthday
   - Annual Enrollment Period: Oct 15 - Dec 7
   - Medicare Advantage: Oct 15 - Dec 7
   - Medigap: 6 months after Part B enrollment (no questions)

2. ACA Marketplace:
   - Open Enrollment: Nov 1 - Jan 15
   - State-specific dates (some extend to Jan 31)

3. Display on results page:
   "Important Deadlines:

   ⏰ Medicare Initial Enrollment
   - Your eligibility: [3 months before 65th birthday]
   - Deadline: [date]
   - Days remaining: [X]

   ⏰ Next Open Enrollment
   - Period: Nov 1 - Jan 15, 2025
   - Starts in: [X] days
   - Coverage begins: Jan 1, 2025"

4. Add urgency indicators:
   - 🟢 "Plenty of time"
   - 🟡 "Deadline approaching (< 30 days)"
   - 🔴 "Urgent - Enroll now! (< 7 days)"

5. Missed deadline handler:
   "Missed Open Enrollment?
   You may qualify for Special Enrollment if you:
   - Lost job-based coverage
   - Moved to new state
   - Got married/divorced
   - Had a baby
   → Check if you qualify: [SEP checker]"
```

### PROMPT 8.2: Special Enrollment Period Checker
```
Create interactive SEP checker:

Component: components/results/SEPChecker.tsx

Qualifying life events:
1. Lost health coverage (COBRA ended, job loss, aged off parent's plan)
2. Moved to new coverage area
3. Got married or divorced
4. Had a baby or adopted a child
5. Death of family member with coverage
6. Became a citizen or lawfully present
7. Released from incarceration
8. Income change affecting Medicaid eligibility

Interactive quiz:
"Do you qualify for Special Enrollment?

Have any of these happened in the last 60 days?
☐ Lost job or health coverage
☐ Moved to a new state
☐ Got married or divorced
☐ Had or adopted a baby
☐ Other major life change

[Check Eligibility]

If yes to any:
✓ You can enroll now (not just during Open Enrollment!)
✓ You have 60 days from the event
→ Start enrollment: [marketplace link]"

Add countdown timer: "You have X days left to enroll"
```

### PROMPT 8.3: Step-by-Step Enrollment Guide
```
Create detailed enrollment instructions:

Component: components/results/EnrollmentGuide.tsx

For Medicare users:
"How to Enroll in Medicare + Medigap:

Step 1: Enroll in Medicare Parts A & B
  ⏱️ Time needed: 15 minutes
  📍 Where: SSA.gov or call 1-800-772-1213
  📄 What you'll need:
     - Social Security number
     - Birth certificate or proof of citizenship
     - Work history (if applicable)

Step 2: Choose and enroll in Medigap
  ⏱️ Time needed: 30 minutes
  📍 Where: Medicare.gov/medigap-compare
  📄 What you'll need:
     - Medicare number
     - Effective date of Part B
  💡 Tip: Do this within 6 months of Part B start

Step 3: Add Part D (if needed)
  ⏱️ Time needed: 20 minutes
  📍 Where: Medicare.gov/plan-compare
  📄 What you'll need:
     - List of current medications
     - Preferred pharmacies"

For marketplace users:
"How to Enroll in Health Insurance:

Step 1: Create Healthcare.gov account
  ⏱️ Time needed: 10 minutes
  📄 What you'll need:
     - Email address
     - Social Security numbers (all household members)
     - Income information (pay stubs, tax return)

Step 2: Complete application
  ⏱️ Time needed: 30-45 minutes
  📄 Information needed:
     - Current coverage (if any)
     - Household size
     - Addresses of all members
     - Employer information
  💡 Tip: You can save and return later

Step 3: Review subsidy eligibility
  ⏱️ Time needed: 5 minutes
  - See if you qualify for premium tax credits
  - Review estimated costs

Step 4: Compare plans
  ⏱️ Time needed: 20 minutes
  - Filter by premium, network, deductible
  - Check if your doctors are in network
  - Review drug coverage

Step 5: Enroll and pay
  ⏱️ Time needed: 15 minutes
  - Select plan
  - Review and submit
  - Pay first premium
  ⚠️ Coverage doesn't start until paid!"
```

### PROMPT 8.4: Required Documents Checklist
```
Create document checklist based on user situation:

Component: components/results/DocumentsChecklist.tsx

Generate dynamic checklist:

For all users:
□ Social Security numbers (all household members)
□ Proof of citizenship or legal status
□ Current addresses

For income verification (subsidies):
□ Most recent tax return
□ Recent pay stubs (last 2 months)
□ W-2 forms or 1099 forms
□ If self-employed: Profit/loss statement

For special enrollment:
□ Proof of qualifying event:
  - Job loss: Termination letter or last pay stub
  - COBRA end: COBRA termination letter
  - Marriage: Marriage certificate
  - Birth: Birth certificate
  - Move: Utility bill or lease agreement

For current coverage comparison:
□ Current insurance card
□ Summary of Benefits
□ Recent medical bills (to verify costs)

Optional but helpful:
□ List of current medications
□ List of preferred doctors/hospitals
□ Recent medical history summary

Printable checklist:
[Print Checklist] button generates PDF
```

### PROMPT 8.5: Post-Enrollment Checklist
```
After enrollment guidance:

Component: components/results/PostEnrollmentChecklist.tsx

"Congratulations on enrolling! Next steps:

Within 2 weeks:
□ Watch mail for insurance card
□ Confirm first premium payment processed
□ Save insurance documents

Before coverage starts:
□ Download insurance company app
□ Create online account
□ Find in-network providers near you
□ Transfer prescriptions to covered pharmacy
□ Schedule annual checkup (preventive care is free)

First 30 days:
□ Verify doctors are in network (call to confirm)
□ Understand your benefits (deductible, copays)
□ Set up auto-pay for premiums
□ Add insurance card to phone wallet

Good habits:
□ Keep all medical receipts (for taxes)
□ Review coverage annually
□ Update coverage when life changes (job, move, baby)
□ Check for better plans next Open Enrollment"
```

**Deliverables:**
- Enrollment calendar with deadlines
- SEP qualification checker
- Step-by-step enrollment guides
- Document checklists
- Post-enrollment guidance
- Git commit: "feat(phase8): Add comprehensive enrollment guidance"

---

## PHASE 9: MOBILE OPTIMIZATION & ACCESSIBILITY (Week 9)
**Goal:** Ensure excellent mobile experience and accessibility

### Features to Implement:
1. Mobile-first calculator flow
2. Touch-optimized inputs
3. Progress saving
4. Accessibility enhancements
5. Performance optimization

### PROMPT 9.1: Mobile Flow Optimization
```
Optimize calculator for mobile:

1. Single-column layouts (already done, verify)
2. Larger touch targets (min 48px)
3. Simplified step indicators
4. Sticky navigation buttons
5. Swipe gestures for next/back

Updates needed:
- Increase button padding on mobile
- Add swipe detection library (free: hammer.js or native)
- Sticky "Next" button at bottom
- Hide unnecessary elements on small screens
- Auto-scroll to validation errors

Test on:
- iPhone SE (small screen)
- iPhone 14 (standard)
- iPad (tablet)
- Android various sizes
```

### PROMPT 9.2: Touch-Optimized Inputs
```
Replace dropdowns with mobile-friendly alternatives:

1. For age inputs:
   - Desktop: Number input with spinner
   - Mobile: Native iOS/Android number pad

2. For state selection:
   - Desktop: Dropdown
   - Mobile: Bottom sheet picker or searchable modal

3. For budget ranges:
   - Desktop: Radio buttons
   - Mobile: Large tap cards

4. For yes/no questions:
   - Desktop: Buttons
   - Mobile: Toggle switches

Implementation:
- Detect screen size: useMediaQuery
- Conditionally render mobile vs desktop inputs
- Ensure all inputs have inputMode attribute
- Test with actual devices
```

### PROMPT 9.3: Auto-Save & Recovery
```
Enhance localStorage auto-save:

1. Save on every input change (debounced 1 second)
2. Show save indicator: "💾 Saved" or "Saving..."
3. Prompt to resume on return:
   "Welcome back! Continue where you left off?"
   [Resume] [Start Over]

4. Handle page refresh:
   - Auto-save before unload
   - Restore state on load
   - Show notification: "Progress restored"

5. Handle lost connection:
   - Queue changes offline
   - Sync when reconnected
   - Show offline indicator

6. Version migration:
   - Detect old data format
   - Migrate to new format
   - Preserve user progress
```

### PROMPT 9.4: Accessibility Enhancements
```
WCAG AA compliance improvements:

1. Keyboard navigation:
   ✓ All interactive elements tabbable
   ✓ Visible focus indicators
   ✓ Skip links to main content
   ✓ Escape key closes modals
   ✓ Arrow keys navigate options

2. Screen reader support:
   ✓ Semantic HTML (already good)
   ✓ ARIA labels on all inputs
   ✓ Live regions for dynamic content
   ✓ Form field descriptions
   ✓ Error announcements

3. Visual accessibility:
   ✓ Color contrast ratio >4.5:1
   ✓ Text resizable to 200%
   ✓ No information by color alone
   ✓ Focus visible on all elements

4. Add accessibility features:
   - Font size controls: [A-] [A] [A+]
   - High contrast mode toggle
   - Reduced motion mode (respect prefers-reduced-motion)
   - Dark mode toggle

5. Test with:
   - Screen reader (NVDA, JAWS, VoiceOver)
   - Keyboard only (no mouse)
   - Browser zoom to 200%
   - Color blindness simulator
```

### PROMPT 9.5: Performance Optimization
```
Optimize for speed:

1. Code splitting:
   - Lazy load results page
   - Lazy load heavy components
   - Dynamic imports for alternatives

2. Image optimization:
   - Use Next.js Image component
   - Serve WebP with fallbacks
   - Lazy load below-fold images

3. Bundle size:
   - Audit with next/bundle-analyzer
   - Remove unused dependencies
   - Tree-shake libraries

4. Loading states:
   - Skeleton screens for async content
   - Progressive enhancement
   - Optimistic UI updates

5. Caching:
   - Service worker for offline support
   - Cache static assets
   - Prefetch next steps

Target metrics:
- Lighthouse score: >90
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Bundle size: <150kB
```

**Deliverables:**
- Mobile-optimized flows
- Touch-friendly inputs
- Robust auto-save
- WCAG AA compliance
- Performance optimizations
- Git commit: "feat(phase9): Mobile optimization and accessibility"

---

## PHASE 10: TESTING & POLISH (Week 10)
**Goal:** Comprehensive testing and final polish

### Features to Implement:
1. Unit test coverage
2. E2E test scenarios
3. User acceptance testing
4. Bug fixes and refinements
5. Documentation

### PROMPT 10.1: Expand Unit Tests
```
Add comprehensive unit tests:

1. Test new calculator features:
   - Subsidy calculator (all income ranges)
   - Employer comparison logic
   - Medicaid eligibility (all states)
   - Drug cost estimator
   - Total cost of care calculations

2. Test edge cases:
   - Single residence
   - 5+ residences
   - All ages 65+
   - Mixed ages
   - Zero income
   - Very high income
   - No employer coverage
   - Employer coverage available

3. Test validation:
   - Income ranges
   - Employment status
   - Residence time splits
   - Drug inputs
   - All form fields

4. Test utilities:
   - State program lookup
   - Medicaid expansion check
   - SEP qualification
   - Enrollment deadlines

Target: 90%+ code coverage
Run: npm test -- --coverage
```

### PROMPT 10.2: E2E Test Scenarios
```
Add end-to-end Playwright tests:

Test complete user journeys:

Scenario 1: Medicare couple
- Ages: 68, 66
- States: FL, NY
- No employer coverage
- Income: $50k
- Expected: Medicare + Medigap recommendation

Scenario 2: Young family
- Ages: 35, 33, 5, 3
- State: CA
- Has employer coverage
- Income: $80k
- Expected: Employer vs marketplace comparison

Scenario 3: Self-employed single
- Age: 45
- States: TX, CO
- Self-employed
- Income: $35k
- Expected: ACA subsidy, HDHP with HSA

Scenario 4: Mixed household
- Ages: 67, 40
- State: NY
- No employer
- Income: $60k
- Expected: Medicare for senior + PPO for younger

Test flows:
1. Complete calculator
2. View results
3. Check alternatives
4. Print results
5. Email results
6. Save and resume

Run: npm run test:e2e
```

### PROMPT 10.3: User Acceptance Testing
```
Create UAT test plan:

1. Recruit 10 test users:
   - 3 Medicare-eligible
   - 3 Young families
   - 2 Single adults
   - 2 Self-employed

2. Test scenarios:
   - Complete calculator (time to complete)
   - Understand recommendations (comprehension)
   - Find action steps (usability)
   - Mobile vs desktop (device preference)

3. Collect feedback:
   - Survey: Satisfaction 1-10
   - Open questions: "What was confusing?"
   - Task success: "Could you find X?"
   - Suggestions: "What would make this better?"

4. Key metrics:
   - Completion rate: >80%
   - Time to complete: <5 minutes
   - Satisfaction: >8/10
   - Would recommend: >80%

5. Iterate based on feedback:
   - Fix top 3 pain points
   - Clarify confusing sections
   - Add missing features
```

### PROMPT 10.4: Bug Fixes & Polish
```
Final polish checklist:

1. Cross-browser testing:
   - Chrome, Firefox, Safari, Edge
   - Fix any rendering issues
   - Test all interactive elements

2. Mobile device testing:
   - iOS (Safari)
   - Android (Chrome)
   - Tablets
   - Different screen sizes

3. Error handling:
   - Test all error states
   - Graceful degradation
   - User-friendly messages
   - Recovery options

4. Visual polish:
   - Consistent spacing
   - Typography hierarchy
   - Color consistency
   - Loading states
   - Empty states
   - Success states

5. Content review:
   - Spelling and grammar
   - Consistent terminology
   - Clear instructions
   - No broken links
   - Updated dates (2024/2025)

6. Performance:
   - Lighthouse audit
   - Fix any issues
   - Optimize images
   - Reduce bundle size
```

### PROMPT 10.5: Documentation
```
Create comprehensive documentation:

1. User Guide (docs/USER_GUIDE.md):
   - How to use the calculator
   - Understanding results
   - Enrollment instructions
   - FAQ

2. Technical Documentation:
   - Architecture overview
   - Component structure
   - Data flow
   - API reference (internal)
   - Testing guide

3. Deployment Guide:
   - Environment variables
   - Build process
   - Deployment steps
   - Monitoring

4. Maintenance Guide:
   - Updating costs (annual)
   - Updating deadlines
   - Adding states
   - Adding features

5. Changelog:
   - Document all phases
   - List features added
   - Note breaking changes
   - Migration guides
```

**Deliverables:**
- Comprehensive test coverage
- E2E test suite
- UAT feedback incorporated
- All bugs fixed
- Complete documentation
- Git commit: "feat(phase10): Final testing and polish"

---

## IMPLEMENTATION ORDER SUMMARY

**Week 1:** Foundation - Data Collection
**Week 2:** Intelligent Calculations
**Week 3:** User Experience
**Week 4:** Prescription & Provider
**Week 5:** Financial Intelligence
**Week 6:** State-Specific
**Week 7:** Results & Sharing
**Week 8:** Enrollment Guidance
**Week 9:** Mobile & Accessibility
**Week 10:** Testing & Polish

## FREE RESOURCES USED (No Cost)

✅ Federal Poverty Level data (free from HHS.gov)
✅ Medicaid expansion status (free from KFF.org)
✅ State program information (free from state websites)
✅ Medicare enrollment dates (free from Medicare.gov)
✅ ACA marketplace links (free public information)
✅ Insurance terminology (free resources)
✅ All calculations done locally (no API costs)
✅ Static data files (no database needed)
✅ Email via mailto: (no email service needed)
✅ Print to PDF (browser native)
✅ LocalStorage for persistence (free)

## NO PAID SERVICES USED

❌ No paid APIs (Medicare.gov, Healthcare.gov, etc.)
❌ No database (all static/localStorage)
❌ No email service (Sendgrid, etc.)
❌ No analytics beyond free tier
❌ No chart libraries (CSS only)
❌ No third-party integrations

---

## READY TO START?

Say "Start Phase 1" and I'll begin implementing!
