/**
 * MAGI Optimizer API Route
 *
 * POST /api/calculators/magi
 * Calculate MAGI optimization for ACA subsidies
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  analyzeMAGI,
  quickSubsidyCalculator,
  calculateFPLPercent,
  getIncomeAtFPL,
  isMedicaidExpansionState,
} from '@/lib/calculators';
import { logger } from '@/lib/logger';
import { getCorrelationId, createLoggerContext } from '@/lib/middleware/correlation';
import {
  MAGIAnalysisRequestSchema,
  MAGIQuickCalculationRequestSchema,
  parseRequestBody,
} from '@/lib/validation/api-schemas';

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  try {
    const body = await request.json();

    // Check if this is a quick calculation or full analysis
    if (body.type) {
      return handleQuickCalculation(body, correlationId);
    }

    return handleFullAnalysis(body, correlationId);
  } catch (error) {
    logger.error('[MAGI Optimizer API] Request error', createLoggerContext(correlationId, {
      error: error instanceof Error ? error.message : String(error),
    }));

    return NextResponse.json(
      {
        error: 'Failed to calculate MAGI optimization',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function handleFullAnalysis(body: unknown, correlationId: string) {
  // Validate with Zod
  const parsed = parseRequestBody(MAGIAnalysisRequestSchema, body);
  if (!parsed.success) {
    logger.warn('[MAGI Optimizer API] Validation failed', createLoggerContext(correlationId, {
      error: parsed.error,
    }));
    return NextResponse.json(
      { error: parsed.error, details: parsed.details },
      { status: 400 }
    );
  }

  const data = parsed.data;

  logger.info('[MAGI Optimizer API] Calculating optimization', createLoggerContext(correlationId, {
    estimatedMAGI: data.estimatedMAGI,
    householdSize: data.householdSize,
    state: data.state,
  }));

  const analysis = analyzeMAGI(data);

  logger.info('[MAGI Optimizer API] Calculation complete', createLoggerContext(correlationId, {
    currentFPL: analysis.current.fplPercent,
    currentSubsidy: analysis.current.annualSubsidy,
    optimalMAGI: analysis.optimal.targetMAGI,
  }));

  return NextResponse.json({
    success: true,
    correlationId,
    analysis,
  });
}

function handleQuickCalculation(body: unknown, correlationId: string) {
  // Validate with Zod discriminated union
  const parsed = parseRequestBody(MAGIQuickCalculationRequestSchema, body);
  if (!parsed.success) {
    logger.warn('[MAGI Optimizer API] Quick calculation validation failed', createLoggerContext(correlationId, {
      error: parsed.error,
    }));
    return NextResponse.json(
      { error: parsed.error, details: parsed.details },
      { status: 400 }
    );
  }

  const data = parsed.data;

  logger.info('[MAGI Optimizer API] Quick calculation', createLoggerContext(correlationId, {
    type: data.type,
  }));

  switch (data.type) {
    case 'subsidy': {
      const result = quickSubsidyCalculator(
        data.magi,
        data.householdSize,
        data.benchmarkPremium
      );

      return NextResponse.json({
        success: true,
        correlationId,
        ...result,
      });
    }

    case 'fpl_percent': {
      const fplPercent = calculateFPLPercent(data.magi, data.householdSize);

      return NextResponse.json({
        success: true,
        correlationId,
        magi: data.magi,
        householdSize: data.householdSize,
        fplPercent,
        tier:
          fplPercent < 138
            ? 'Medicaid eligible (expansion states)'
            : fplPercent <= 400
              ? 'Subsidy eligible'
              : 'Above subsidy cliff',
      });
    }

    case 'income_at_fpl': {
      const income = getIncomeAtFPL(data.fplPercent, data.householdSize);

      return NextResponse.json({
        success: true,
        correlationId,
        fplPercent: data.fplPercent,
        householdSize: data.householdSize,
        income,
        note: `Annual income at ${data.fplPercent}% FPL for household of ${data.householdSize}`,
      });
    }

    case 'medicaid_expansion': {
      const isExpansion = isMedicaidExpansionState(data.state);

      return NextResponse.json({
        success: true,
        correlationId,
        state: data.state.toUpperCase(),
        medicaidExpansion: isExpansion,
        eligibilityThreshold: isExpansion ? '138% FPL' : '~100% FPL (varies by state)',
        note: isExpansion
          ? 'Medicaid available for adults up to 138% FPL'
          : 'State has not expanded Medicaid. May have coverage gap for adults below 100% FPL.',
      });
    }
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/calculators/magi',
    methods: ['POST'],
    description: 'Calculate MAGI optimization for ACA marketplace subsidies',
    parameters: {
      fullAnalysis: {
        estimatedMAGI: 'Current estimated Modified Adjusted Gross Income (required)',
        householdSize: 'Number of people in tax household (required)',
        filingStatus: "'single' | 'married_joint' | 'married_separate' | 'head_of_household' (required)",
        state: '2-letter state code (required)',
        age: 'Age of primary applicant (required)',
        benchmarkPremium: 'Benchmark silver plan premium (optional, will be estimated)',
        currentRetirementContributions: 'Current annual 401(k)/IRA contributions',
        currentHSAContributions: 'Current annual HSA contributions',
        has401kAccess: 'Whether user has access to 401(k)',
        hasHDHP: 'Whether user has High Deductible Health Plan',
        selfEmploymentIncome: 'Self-employment income if any',
      },
      quickCalculations: {
        subsidy: {
          type: "'subsidy'",
          magi: 'Modified Adjusted Gross Income',
          householdSize: 'Household size',
          benchmarkPremium: 'Benchmark silver plan premium',
        },
        fpl_percent: {
          type: "'fpl_percent'",
          magi: 'Modified Adjusted Gross Income',
          householdSize: 'Household size',
        },
        income_at_fpl: {
          type: "'income_at_fpl'",
          fplPercent: 'FPL percentage (e.g., 200 for 200%)',
          householdSize: 'Household size',
        },
        medicaid_expansion: {
          type: "'medicaid_expansion'",
          state: '2-letter state code',
        },
      },
    },
    example: {
      estimatedMAGI: 60000,
      householdSize: 3,
      filingStatus: 'married_joint',
      state: 'CA',
      age: 45,
      benchmarkPremium: 650,
      has401kAccess: true,
      hasHDHP: true,
    },
  });
}
