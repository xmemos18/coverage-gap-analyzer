/**
 * Plan Comparison API Route
 *
 * Provides endpoints for comparing two health insurance plans.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  comparePlans,
  quickComparison,
  type PlanDetails,
  type UserHealthProfile,
} from '@/lib/comparison';
import { logger } from '@/lib/logger';

interface CompareRequest {
  planA: PlanDetails;
  planB: PlanDetails;
  userProfile?: UserHealthProfile;
  mode?: 'full' | 'quick';
}

/**
 * Validate plan details
 */
function validatePlanDetails(plan: unknown, label: string): plan is PlanDetails {
  if (!plan || typeof plan !== 'object') {
    return false;
  }

  const p = plan as Record<string, unknown>;

  const requiredFields = [
    'id',
    'name',
    'type',
    'metalLevel',
    'issuer',
    'monthlyPremium',
    'deductible',
    'outOfPocketMax',
  ];

  for (const field of requiredFields) {
    if (p[field] === undefined) {
      logger.warn(`[Comparison API] Missing required field: ${label}.${field}`);
      return false;
    }
  }

  // Validate numeric fields
  const numericFields = [
    'monthlyPremium',
    'deductible',
    'outOfPocketMax',
    'primaryCareCopay',
    'specialistCopay',
    'genericDrugCopay',
    'brandDrugCopay',
    'emergencyRoomCopay',
    'urgentCareCopay',
    'coinsurance',
  ];

  for (const field of numericFields) {
    if (p[field] !== undefined && typeof p[field] !== 'number') {
      logger.warn(`[Comparison API] Invalid type for ${label}.${field}: expected number`);
      return false;
    }
  }

  return true;
}

/**
 * POST /api/comparison
 * Compare two health insurance plans
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CompareRequest;

    // Validate request
    if (!validatePlanDetails(body.planA, 'planA')) {
      return NextResponse.json(
        { error: 'Invalid planA: missing or invalid required fields' },
        { status: 400 }
      );
    }

    if (!validatePlanDetails(body.planB, 'planB')) {
      return NextResponse.json(
        { error: 'Invalid planB: missing or invalid required fields' },
        { status: 400 }
      );
    }

    const mode = body.mode || 'full';

    if (mode === 'quick') {
      // Quick comparison for simple use cases
      const result = quickComparison(body.planA, body.planB);

      logger.info('[Comparison API] Quick comparison completed', {
        planA: body.planA.name,
        planB: body.planB.name,
      });

      return NextResponse.json({
        success: true,
        mode: 'quick',
        result,
      });
    }

    // Full comparison
    const result = comparePlans(body.planA, body.planB, body.userProfile);

    logger.info('[Comparison API] Full comparison completed', {
      planA: body.planA.name,
      planB: body.planB.name,
      winner: result.overallWinner.plan,
      hasUserProfile: !!body.userProfile,
    });

    return NextResponse.json({
      success: true,
      mode: 'full',
      result,
    });
  } catch (error) {
    logger.error('[Comparison API] Comparison failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to compare plans' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/comparison
 * Get comparison API info
 */
export async function GET() {
  return NextResponse.json({
    name: 'Plan Comparison API',
    version: '1.0.0',
    endpoints: {
      'POST /api/comparison': {
        description: 'Compare two health insurance plans',
        body: {
          planA: 'PlanDetails (required)',
          planB: 'PlanDetails (required)',
          userProfile: 'UserHealthProfile (optional)',
          mode: "'full' | 'quick' (default: 'full')",
        },
        modes: {
          full: 'Complete comparison with scenarios, metrics, and recommendations',
          quick: 'Fast comparison with basic cost analysis',
        },
      },
    },
    planDetailsSchema: {
      id: 'string (required)',
      name: 'string (required)',
      type: "'HMO' | 'PPO' | 'EPO' | 'POS' | 'HDHP' (required)",
      metalLevel: "'bronze' | 'silver' | 'gold' | 'platinum' | 'catastrophic' (required)",
      issuer: 'string (required)',
      monthlyPremium: 'number (required)',
      deductible: 'number (required)',
      outOfPocketMax: 'number (required)',
      primaryCareCopay: 'number (optional)',
      specialistCopay: 'number (optional)',
      genericDrugCopay: 'number (optional)',
      brandDrugCopay: 'number (optional)',
      emergencyRoomCopay: 'number (optional)',
      urgentCareCopay: 'number (optional)',
      coinsurance: 'number (optional, percentage 0-100)',
      hsaEligible: 'boolean (optional)',
      qualityRating: 'number 1-5 (optional)',
    },
    userHealthProfileSchema: {
      expectedDoctorVisits: 'number (optional)',
      expectedSpecialistVisits: 'number (optional)',
      expectedPrescriptions: 'number (optional)',
      avgPrescriptionTier: 'number 1-4 (optional)',
      expectedERVisits: 'number (optional)',
      hasPlannedProcedures: 'boolean (optional)',
      riskTolerance: "'low' | 'medium' | 'high' (optional)",
      prioritizesLowerPremium: 'boolean (optional)',
      needsSpecificProviders: 'boolean (optional)',
      hasChronicConditions: 'boolean (optional)',
    },
  });
}
