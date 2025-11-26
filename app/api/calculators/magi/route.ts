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

interface MAGIAnalysisRequest {
  estimatedMAGI: number;
  householdSize: number;
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_of_household';
  state: string;
  age: number;
  benchmarkPremium?: number;
  currentRetirementContributions?: number;
  currentHSAContributions?: number;
  has401kAccess?: boolean;
  hasHDHP?: boolean;
  selfEmploymentIncome?: number;
}

interface QuickCalculationRequest {
  type: 'subsidy' | 'fpl_percent' | 'income_at_fpl' | 'medicaid_expansion';
  magi?: number;
  householdSize?: number;
  benchmarkPremium?: number;
  fplPercent?: number;
  state?: string;
}

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  try {
    const body = await request.json();

    // Check if this is a quick calculation or full analysis
    if (body.type) {
      return handleQuickCalculation(body as QuickCalculationRequest, correlationId);
    }

    return handleFullAnalysis(body as MAGIAnalysisRequest, correlationId);
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

function handleFullAnalysis(body: MAGIAnalysisRequest, correlationId: string) {
  // Validate required fields
  const requiredFields = [
    'estimatedMAGI',
    'householdSize',
    'filingStatus',
    'state',
    'age',
  ];

  const missingFields = requiredFields.filter(
    (field) => body[field as keyof MAGIAnalysisRequest] === undefined
  );

  if (missingFields.length > 0) {
    return NextResponse.json(
      {
        error: 'Missing required fields',
        missingFields,
      },
      { status: 400 }
    );
  }

  // Validate MAGI
  if (body.estimatedMAGI < 0 || body.estimatedMAGI > 10000000) {
    return NextResponse.json(
      { error: 'Invalid estimatedMAGI value' },
      { status: 400 }
    );
  }

  // Validate household size
  if (body.householdSize < 1 || body.householdSize > 20) {
    return NextResponse.json(
      { error: 'Invalid householdSize (must be between 1 and 20)' },
      { status: 400 }
    );
  }

  // Validate filing status
  const validFilingStatuses = ['single', 'married_joint', 'married_separate', 'head_of_household'];
  if (!validFilingStatuses.includes(body.filingStatus)) {
    return NextResponse.json(
      { error: 'Invalid filingStatus' },
      { status: 400 }
    );
  }

  // Validate state
  if (!body.state || body.state.length !== 2) {
    return NextResponse.json(
      { error: 'Invalid state (must be 2-letter code)' },
      { status: 400 }
    );
  }

  // Validate age
  if (body.age < 18 || body.age > 100) {
    return NextResponse.json(
      { error: 'Invalid age value' },
      { status: 400 }
    );
  }

  logger.info('[MAGI Optimizer API] Calculating optimization', createLoggerContext(correlationId, {
    estimatedMAGI: body.estimatedMAGI,
    householdSize: body.householdSize,
    state: body.state,
  }));

  const analysis = analyzeMAGI(body);

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

function handleQuickCalculation(body: QuickCalculationRequest, correlationId: string) {
  logger.info('[MAGI Optimizer API] Quick calculation', createLoggerContext(correlationId, {
    type: body.type,
  }));

  switch (body.type) {
    case 'subsidy': {
      if (
        body.magi === undefined ||
        body.householdSize === undefined ||
        body.benchmarkPremium === undefined
      ) {
        return NextResponse.json(
          { error: 'magi, householdSize, and benchmarkPremium are required' },
          { status: 400 }
        );
      }

      const result = quickSubsidyCalculator(
        body.magi,
        body.householdSize,
        body.benchmarkPremium
      );

      return NextResponse.json({
        success: true,
        correlationId,
        ...result,
      });
    }

    case 'fpl_percent': {
      if (body.magi === undefined || body.householdSize === undefined) {
        return NextResponse.json(
          { error: 'magi and householdSize are required' },
          { status: 400 }
        );
      }

      const fplPercent = calculateFPLPercent(body.magi, body.householdSize);

      return NextResponse.json({
        success: true,
        correlationId,
        magi: body.magi,
        householdSize: body.householdSize,
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
      if (body.fplPercent === undefined || body.householdSize === undefined) {
        return NextResponse.json(
          { error: 'fplPercent and householdSize are required' },
          { status: 400 }
        );
      }

      const income = getIncomeAtFPL(body.fplPercent, body.householdSize);

      return NextResponse.json({
        success: true,
        correlationId,
        fplPercent: body.fplPercent,
        householdSize: body.householdSize,
        income,
        note: `Annual income at ${body.fplPercent}% FPL for household of ${body.householdSize}`,
      });
    }

    case 'medicaid_expansion': {
      if (!body.state) {
        return NextResponse.json(
          { error: 'state is required' },
          { status: 400 }
        );
      }

      const isExpansion = isMedicaidExpansionState(body.state);

      return NextResponse.json({
        success: true,
        correlationId,
        state: body.state.toUpperCase(),
        medicaidExpansion: isExpansion,
        eligibilityThreshold: isExpansion ? '138% FPL' : '~100% FPL (varies by state)',
        note: isExpansion
          ? 'Medicaid available for adults up to 138% FPL'
          : 'State has not expanded Medicaid. May have coverage gap for adults below 100% FPL.',
      });
    }

    default:
      return NextResponse.json(
        { error: 'Invalid calculation type. Must be: subsidy, fpl_percent, income_at_fpl, or medicaid_expansion' },
        { status: 400 }
      );
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
