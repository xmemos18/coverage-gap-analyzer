/**
 * Medicare Plans API Route
 * GET /api/medicare/plans
 *
 * Search for Medicare Advantage, Medigap, and Part D plans
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  searchMedicareAdvantagePlans,
  searchMedigapPlans,
  searchPartDPlans,
  findMultiStateMedicarePlans,
  calculateMedicareCostSummary,
  getRecommendedMedicareType,
} from '@/lib/medicare/medicarePlanService';
import type { MedicarePlanSearchParams } from '@/types/medicare';
import { safeParseFloat, safeParseInt } from '@/lib/validation/numeric';
import { getCorrelationId, createLoggerContext } from '@/lib/middleware/correlation';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handleGET(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const zipCode = searchParams.get('zipCode') || '';
    const state = searchParams.get('state') || '';
    const county = searchParams.get('county') || undefined;
    const planType = searchParams.get('planType') || 'medicare-advantage';

    // Filters
    const maxPremium = safeParseFloat(searchParams.get('maxPremium'), {
      min: 0,
      max: 100000,
      fieldName: 'maxPremium',
      throwOnError: false,
    });
    const minStarRating = safeParseFloat(searchParams.get('minStarRating'), {
      min: 0,
      max: 5,
      defaultValue: 3.0,
      fieldName: 'minStarRating',
      throwOnError: false,
    }) || 3.0;

    // Coverage requirements
    const requiresDrugCoverage = searchParams.get('requiresDrugCoverage') === 'true';
    const requiresDental = searchParams.get('requiresDental') === 'true';
    const requiresVision = searchParams.get('requiresVision') === 'true';

    // Pagination
    const page = safeParseInt(searchParams.get('page'), {
      min: 1,
      max: 1000,
      defaultValue: 1,
      fieldName: 'page',
      throwOnError: false,
    }) || 1;
    const limit = safeParseInt(searchParams.get('limit'), {
      min: 1,
      max: 100,
      defaultValue: 20,
      fieldName: 'limit',
      throwOnError: false,
    }) || 20;

    // Multi-state search (for snowbirds)
    const multiState = searchParams.get('multiState') === 'true';
    const states = searchParams.get('states')?.split(',') || [state];
    const zipCodes = searchParams.get('zipCodes')?.split(',') || [zipCode];

    // Validate required parameters
    if (!state && !multiState) {
      return NextResponse.json(
        { error: 'State parameter is required' },
        { status: 400 }
      );
    }

    // Handle multi-state search
    if (multiState && states.length > 1) {
      const multiStateAnalysis = await findMultiStateMedicarePlans(states, zipCodes);

      return NextResponse.json({
        success: true,
        multiState: true,
        analysis: multiStateAnalysis,
      });
    }

    // Build search parameters
    const params: MedicarePlanSearchParams = {
      zipCode,
      state,
      county,
      maxPremium,
      minStarRating,
      requiresDrugCoverage,
      requiresDental,
      requiresVision,
      page,
      limit,
    };

    // Search based on plan type
    let result;

    switch (planType.toLowerCase()) {
      case 'medicare-advantage':
      case 'ma':
        result = await searchMedicareAdvantagePlans(params);
        break;

      case 'medigap':
      case 'supplement':
        const medigapPlans = await searchMedigapPlans(state, county, maxPremium);
        result = {
          plans: medigapPlans,
          totalCount: medigapPlans.length,
          page: 1,
          limit: medigapPlans.length,
          filters: params,
        };
        break;

      case 'part-d':
      case 'partd':
        const partDPlans = await searchPartDPlans(params);
        result = {
          plans: partDPlans,
          totalCount: partDPlans.length,
          page: 1,
          limit: partDPlans.length,
          filters: params,
        };
        break;

      default:
        // Default to Medicare Advantage
        result = await searchMedicareAdvantagePlans(params);
    }

    // Add cost summaries to each plan
    const plansWithCosts = result.plans.map(plan => {
      if ('maxOutOfPocket' in plan || 'planLetter' in plan) {
        const costSummary = calculateMedicareCostSummary(
          plan as import('@/types/medicare').MedicareAdvantagePlan | import('@/types/medicare').MedigapPlan,
          'medium'
        );
        return {
          ...plan,
          costSummary,
        };
      }
      return plan;
    });

    return NextResponse.json({
      success: true,
      ...result,
      plans: plansWithCosts,
    });
  } catch (error) {
    logger.error('[Medicare API] Error', createLoggerContext(correlationId, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }));

    return NextResponse.json(
      {
        error: 'Failed to search Medicare plans',
        message: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      },
      { status: 500 }
    );
  }
}

// Export handler directly (correlation ID is handled internally)
export const GET = handleGET;

/**
 * POST endpoint for complex searches with prescription data
 */
async function handlePOST(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  try {
    const body = await request.json();

    const {
      zipCode,
      state,
      county,
      planType = 'medicare-advantage',
      maxPremium,
      minStarRating = 3.0,
      requiresDrugCoverage,
      requiresDental,
      requiresVision,
      prescriptions = [],
      userProfile,
      page = 1,
      limit = 20,
    } = body;

    // Validate required fields
    if (!state) {
      return NextResponse.json(
        { error: 'State is required' },
        { status: 400 }
      );
    }

    // Get recommended plan type based on user profile
    let recommendedType = planType;
    if (userProfile) {
      recommendedType = getRecommendedMedicareType(userProfile);
    }

    // Build search parameters
    const params: MedicarePlanSearchParams = {
      zipCode,
      state,
      county,
      maxPremium,
      minStarRating,
      requiresDrugCoverage,
      requiresDental,
      requiresVision,
      prescriptions,
      page,
      limit,
    };

    // Search for plans
    const result = await searchMedicareAdvantagePlans(params);

    // Add cost summaries
    const plansWithCosts = result.plans.map(plan => {
      const costSummary = calculateMedicareCostSummary(
        plan as import('@/types/medicare').MedicareAdvantagePlan,
        userProfile?.estimatedUsage || 'medium'
      );
      return {
        ...plan,
        costSummary,
      };
    });

    return NextResponse.json({
      success: true,
      recommendedType,
      ...result,
      plans: plansWithCosts,
      userProfile,
    });
  } catch (error) {
    logger.error('[Medicare API] POST Error', createLoggerContext(correlationId, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }));

    return NextResponse.json(
      {
        error: 'Failed to search Medicare plans',
        message: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      },
      { status: 500 }
    );
  }
}

// Export handler directly (correlation ID is handled internally)
export const POST = handlePOST;
