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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const zipCode = searchParams.get('zipCode') || '';
    const state = searchParams.get('state') || '';
    const county = searchParams.get('county') || undefined;
    const planType = searchParams.get('planType') || 'medicare-advantage';

    // Filters
    const maxPremium = searchParams.get('maxPremium')
      ? parseFloat(searchParams.get('maxPremium')!)
      : undefined;
    const minStarRating = searchParams.get('minStarRating')
      ? parseFloat(searchParams.get('minStarRating')!)
      : 3.0;

    // Coverage requirements
    const requiresDrugCoverage = searchParams.get('requiresDrugCoverage') === 'true';
    const requiresDental = searchParams.get('requiresDental') === 'true';
    const requiresVision = searchParams.get('requiresVision') === 'true';

    // Pagination
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;

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
        const costSummary = calculateMedicareCostSummary(plan as any, 'medium');
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
    console.error('[Medicare API] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to search Medicare plans',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for complex searches with prescription data
 */
export async function POST(request: NextRequest) {
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
        plan as any,
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
    console.error('[Medicare API] POST Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to search Medicare plans',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
