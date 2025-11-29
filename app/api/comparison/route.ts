/**
 * Plan Comparison API Route
 *
 * Provides endpoints for comparing two health insurance plans.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  comparePlans,
  quickComparison,
} from '@/lib/comparison';
import { logger } from '@/lib/logger';
import { CompareRequestSchema, parseRequestBody } from '@/lib/validation/api-schemas';

/**
 * POST /api/comparison
 * Compare two health insurance plans
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    // Validate request with Zod
    const parsed = parseRequestBody(CompareRequestSchema, rawBody);
    if (!parsed.success) {
      logger.warn('[Comparison API] Validation failed', { error: parsed.error });
      return NextResponse.json(
        { error: parsed.error, details: parsed.details },
        { status: 400 }
      );
    }

    const body = parsed.data;
    const mode = body.mode;

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
