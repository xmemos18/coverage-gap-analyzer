/**
 * Medicare Plan Service
 * Service layer for querying and filtering Medicare Advantage, Medigap, and Part D plans
 */

import { db } from '@/db';
import { medicareAdvantagePlans, medigapPlans, partDPlans } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import type {
  MedicareAdvantagePlan,
  MedigapPlan,
  PartDPlan,
  MedicarePlanSearchParams,
  MedicarePlanSearchResponse,
  PrescriptionDrug,
  DrugCostEstimate,
  MedicareCostSummary,
  MultiStateMediareAnalysis,
} from '@/types/medicare';

// ============================================================================
// Medicare Advantage Plan Queries
// ============================================================================

/**
 * Search for Medicare Advantage plans by location and filters
 */
export async function searchMedicareAdvantagePlans(
  params: MedicarePlanSearchParams
): Promise<MedicarePlanSearchResponse> {
  const {
    zipCode,
    state,
    county,
    maxPremium,
    minStarRating = 3.0,
    requiresDrugCoverage,
    requiresDental,
    requiresVision,
    page = 1,
    limit = 20,
  } = params;

  try {
    // Build query conditions
    const conditions = [
      eq(medicareAdvantagePlans.state, state),
    ];

    // Filter by ZIP code
    if (zipCode) {
      conditions.push(eq(medicareAdvantagePlans.zipCode, zipCode));
    }

    // Filter by county
    if (county) {
      conditions.push(eq(medicareAdvantagePlans.county, county));
    }

    // Filter by premium (convert to string for decimal comparison)
    if (maxPremium !== undefined) {
      conditions.push(lte(medicareAdvantagePlans.monthlyPremium, maxPremium.toString()));
    }

    // Filter by star rating (convert to string for decimal comparison)
    conditions.push(gte(medicareAdvantagePlans.starRating, minStarRating.toString()));

    // Filter by drug coverage
    if (requiresDrugCoverage) {
      conditions.push(eq(medicareAdvantagePlans.partDCoverage, true));
    }

    // Filter by dental coverage
    if (requiresDental) {
      conditions.push(eq(medicareAdvantagePlans.dentalCoverage, true));
    }

    // Filter by vision coverage
    if (requiresVision) {
      conditions.push(eq(medicareAdvantagePlans.visionCoverage, true));
    }

    // Execute query with pagination
    const offset = (page - 1) * limit;

    const plans = await db
      .select()
      .from(medicareAdvantagePlans)
      .where(and(...conditions))
      .orderBy(
        sql`${medicareAdvantagePlans.starRating} DESC`,
        sql`${medicareAdvantagePlans.monthlyPremium} ASC`
      )
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(medicareAdvantagePlans)
      .where(and(...conditions));

    const totalCount = countResult[0]?.count || 0;

    return {
      plans: plans as unknown as MedicareAdvantagePlan[],
      totalCount,
      page,
      limit,
      filters: params,
    };
  } catch (error) {
    console.error('[Medicare Service] Error searching MA plans:', error);
    throw new Error('Failed to search Medicare Advantage plans');
  }
}

/**
 * Get Medicare Advantage plan by ID
 */
export async function getMedicareAdvantagePlanById(
  contractId: string,
  planId: string
): Promise<MedicareAdvantagePlan | null> {
  try {
    const plan = await db
      .select()
      .from(medicareAdvantagePlans)
      .where(
        and(
          eq(medicareAdvantagePlans.contractId, contractId),
          eq(medicareAdvantagePlans.planId, planId)
        )
      )
      .limit(1);

    return (plan[0] as unknown as MedicareAdvantagePlan) || null;
  } catch (error) {
    console.error('[Medicare Service] Error getting MA plan:', error);
    return null;
  }
}

// ============================================================================
// Medigap Plan Queries
// ============================================================================

/**
 * Search for Medigap plans by location
 */
export async function searchMedigapPlans(
  state: string,
  county?: string,
  maxPremium?: number
): Promise<MedigapPlan[]> {
  try {
    const conditions = [eq(medigapPlans.state, state)];

    // Note: Medigap plans are typically available statewide, no county filter needed
    // County parameter is ignored for Medigap plans

    if (maxPremium !== undefined) {
      conditions.push(lte(medigapPlans.monthlyPremium, maxPremium.toString()));
    }

    const plans = await db
      .select()
      .from(medigapPlans)
      .where(and(...conditions))
      .orderBy(sql`${medigapPlans.monthlyPremium} ASC`);

    return plans as unknown as MedigapPlan[];
  } catch (error) {
    console.error('[Medicare Service] Error searching Medigap plans:', error);
    return [];
  }
}

/**
 * Get Medigap plans by plan letter (A, B, C, etc.)
 */
export async function getMedigapPlansByLetter(
  state: string,
  planLetter: string
): Promise<MedigapPlan[]> {
  try {
    const plans = await db
      .select()
      .from(medigapPlans)
      .where(
        and(
          eq(medigapPlans.state, state),
          eq(medigapPlans.planLetter, planLetter)
        )
      )
      .orderBy(sql`${medigapPlans.monthlyPremium} ASC`);

    return plans as unknown as MedigapPlan[];
  } catch (error) {
    console.error('[Medicare Service] Error getting Medigap plans:', error);
    return [];
  }
}

// ============================================================================
// Part D Plan Queries
// ============================================================================

/**
 * Search for Part D plans by location and filters
 */
export async function searchPartDPlans(
  params: MedicarePlanSearchParams
): Promise<PartDPlan[]> {
  const {
    state,
    county: _county, // Not used for Part D (uses regions instead)
    maxPremium,
    minStarRating = 3.0,
  } = params;

  try {
    const conditions = [eq(partDPlans.state, state)];

    // Note: Part D plans are organized by regions, not counties
    // County parameter is ignored for Part D plans

    if (maxPremium !== undefined) {
      conditions.push(lte(partDPlans.monthlyPremium, maxPremium.toString()));
    }

    conditions.push(gte(partDPlans.starRating, minStarRating.toString()));

    const plans = await db
      .select()
      .from(partDPlans)
      .where(and(...conditions))
      .orderBy(
        sql`${partDPlans.starRating} DESC`,
        sql`${partDPlans.monthlyPremium} ASC`
      );

    return plans as unknown as PartDPlan[];
  } catch (error) {
    console.error('[Medicare Service] Error searching Part D plans:', error);
    return [];
  }
}

// ============================================================================
// Multi-State Analysis
// ============================================================================

/**
 * Find Medicare plans available in multiple states (for snowbirds)
 */
export async function findMultiStateMedicarePlans(
  states: string[],
  zipCodes: string[]
): Promise<MultiStateMediareAnalysis> {
  try {
    // Find plans available in all states
    const primaryState = states[0];
    const secondaryStates = states.slice(1);

    // Get plans for each state
    const statePlans = await Promise.all(
      states.map(async (state, index) => {
        const plans = await searchMedicareAdvantagePlans({
          state,
          zipCode: zipCodes[index],
          minStarRating: 3.5,
          limit: 10,
        });
        return { state, plans: plans.plans as MedicareAdvantagePlan[] };
      })
    );

    // Find PPO plans (more travel-friendly)
    const ppoPlans = statePlans[0].plans.filter(
      plan => (plan as MedicareAdvantagePlan).networkType === 'PPO'
    );

    // Find plans with nationwide networks
    const nationwidePlans = ppoPlans.filter(plan =>
      ['UnitedHealthcare', 'Humana', 'Aetna', 'Cigna'].some(carrier =>
        plan.organizationName.includes(carrier)
      )
    );

    const recommendations = [
      'Consider PPO plans for more flexibility when traveling between states',
      'Look for plans from national carriers (UnitedHealthcare, Humana) for better out-of-state coverage',
      'Verify that your doctors in both locations are in-network',
    ];

    if (nationwidePlans.length > 0) {
      recommendations.push(
        `Found ${nationwidePlans.length} plans with nationwide networks that work in all your locations`
      );
    }

    return {
      primaryState,
      secondaryStates,
      availableInAllStates: nationwidePlans,
      stateSpecificPlans: statePlans.map(({ state, plans }) => ({
        state,
        topPlans: plans.slice(0, 5),
      })),
      recommendations,
    };
  } catch (error) {
    console.error('[Medicare Service] Error analyzing multi-state plans:', error);
    throw new Error('Failed to analyze multi-state Medicare options');
  }
}

// ============================================================================
// Cost Calculations
// ============================================================================

/**
 * Calculate annual Medicare cost summary
 */
export function calculateMedicareCostSummary(
  plan: MedicareAdvantagePlan | MedigapPlan,
  estimatedUsage: 'low' | 'medium' | 'high' = 'medium'
): MedicareCostSummary {
  const monthlyPremium = plan.monthlyPremium;
  const annualPremium = monthlyPremium * 12;

  // Type guard to check if it's a Medicare Advantage plan
  const isMAPlan = 'maxOutOfPocket' in plan;

  if (isMAPlan) {
    const maPlan = plan as MedicareAdvantagePlan;

    // Estimate annual out-of-pocket based on usage
    const estimatedOOP = {
      low: maPlan.deductible + 500, // Just deductible + minimal copays
      medium: maPlan.deductible + 2000, // Moderate usage
      high: maPlan.maxOutOfPocket, // Hit the max
    }[estimatedUsage];

    return {
      monthlyPremium,
      annualDeductible: maPlan.deductible,
      estimatedAnnualCost: annualPremium + estimatedOOP,
      worstCaseScenario: annualPremium + maPlan.maxOutOfPocket,
      bestCaseScenario: annualPremium + maPlan.deductible,
    };
  } else {
    // Medigap plan - combine with Original Medicare costs
    const partBPremium = 174.70 * 12; // 2025 standard Part B premium
    const partBDeductible = 240; // 2025 Part B deductible

    // Medigap covers most costs after deductible
    const estimatedOOP = estimatedUsage === 'high' ? 1000 : 500;

    return {
      monthlyPremium: monthlyPremium + 174.70, // Medigap + Part B
      annualDeductible: partBDeductible,
      estimatedAnnualCost: annualPremium + partBPremium + partBDeductible + estimatedOOP,
      worstCaseScenario: annualPremium + partBPremium + partBDeductible + 2000,
      bestCaseScenario: annualPremium + partBPremium + partBDeductible,
    };
  }
}

/**
 * Estimate prescription drug costs under a Part D plan
 */
export async function estimateDrugCosts(
  _planId: string,
  _prescriptions: PrescriptionDrug[]
): Promise<DrugCostEstimate[]> {
  // TODO: Implement drug formulary lookup
  // This would require:
  // 1. Formulary database with tier information
  // 2. Drug pricing database
  // 3. Coverage phase calculations (initial, gap, catastrophic)

  // Placeholder implementation
  console.warn('[Medicare Service] Drug cost estimation not yet implemented');
  return [];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get recommended Medicare plan type based on user profile
 */
export function getRecommendedMedicareType(profile: {
  hasChronicConditions: boolean;
  takesMultipleMedications: boolean;
  frequentTraveler: boolean;
  hasPreferredDoctors: boolean;
  budgetSensitive: boolean;
}): 'Medicare Advantage' | 'Original Medicare + Medigap' {
  const {
    hasChronicConditions,
    takesMultipleMedications,
    frequentTraveler,
    hasPreferredDoctors,
    budgetSensitive,
  } = profile;

  // Score for each option
  let maScore = 0;
  let medigapScore = 0;

  // Medicare Advantage is better for:
  if (budgetSensitive) maScore += 2; // Lower premiums
  if (takesMultipleMedications) maScore += 1; // Integrated Part D
  if (!frequentTraveler) maScore += 1; // Network restrictions less important

  // Original Medicare + Medigap is better for:
  if (hasPreferredDoctors) medigapScore += 2; // Any doctor who accepts Medicare
  if (frequentTraveler) medigapScore += 2; // No network restrictions
  if (hasChronicConditions) medigapScore += 1; // More predictable costs

  return maScore > medigapScore ? 'Medicare Advantage' : 'Original Medicare + Medigap';
}

/**
 * Check if user qualifies for Low Income Subsidy (LIS)
 */
export function qualifiesForLIS(
  income: number,
  householdSize: number,
  assets: number
): boolean {
  // 2025 LIS income limits (approximate)
  const fpl = 15060 + (householdSize - 1) * 5380; // Federal Poverty Level
  const incomeLimit = fpl * 1.5; // 150% of FPL for full LIS

  // 2025 LIS asset limits
  const assetLimit = householdSize === 1 ? 10000 : 20000;

  return income <= incomeLimit && assets <= assetLimit;
}
