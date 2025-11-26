/**
 * Medicare Transition Planner API Route
 *
 * POST /api/wizards/medicare-transition
 * Analyzes Medicare transition options for users approaching 65
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  analyzeMedicareTransition,
  getMedicareEligibilityDate,
  calculatePartBPenalty,
  calculatePartDPenalty,
  getIRMAASurcharge,
} from '@/lib/wizards';
import { logger } from '@/lib/logger';
import { getCorrelationId, createLoggerContext } from '@/lib/middleware/correlation';

interface MedicareTransitionRequest {
  dateOfBirth: string;
  currentMonthlyPremium: number;
  hasEmployerCoverage: boolean;
  employerSize?: 'small' | 'large';
  spouseHasEmployerCoverage?: boolean;
  magi?: number;
  filingStatus?: 'single' | 'married_joint' | 'married_separate';
  state: string;
  zipCode?: string;
  wantsDrugCoverage?: boolean;
  hasVAorTricare?: boolean;
  stillWorking?: boolean;
}

interface QuickCalculationRequest {
  type: 'eligibility' | 'partBPenalty' | 'partDPenalty' | 'irmaa';
  dateOfBirth?: string;
  monthsDelayed?: number;
  magi?: number;
  filingStatus?: 'single' | 'married_joint' | 'married_separate';
}

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  try {
    const body = await request.json();

    // Check if this is a quick calculation or full analysis
    if (body.type) {
      return handleQuickCalculation(body as QuickCalculationRequest, correlationId);
    }

    return handleFullAnalysis(body as MedicareTransitionRequest, correlationId);
  } catch (error) {
    logger.error('[Medicare Transition API] Request error', createLoggerContext(correlationId, {
      error: error instanceof Error ? error.message : String(error),
    }));

    return NextResponse.json(
      {
        error: 'Failed to analyze Medicare transition',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function handleFullAnalysis(body: MedicareTransitionRequest, correlationId: string) {
  // Validate required fields
  if (!body.dateOfBirth || body.currentMonthlyPremium === undefined || !body.state) {
    return NextResponse.json(
      {
        error: 'Missing required fields',
        requiredFields: ['dateOfBirth', 'currentMonthlyPremium', 'state'],
      },
      { status: 400 }
    );
  }

  // Validate date
  const dob = new Date(body.dateOfBirth);
  if (isNaN(dob.getTime())) {
    return NextResponse.json(
      { error: 'Invalid dateOfBirth format' },
      { status: 400 }
    );
  }

  // Validate filing status if provided
  if (body.filingStatus && !['single', 'married_joint', 'married_separate'].includes(body.filingStatus)) {
    return NextResponse.json(
      { error: 'Invalid filingStatus. Must be single, married_joint, or married_separate' },
      { status: 400 }
    );
  }

  logger.info('[Medicare Transition API] Analyzing transition', createLoggerContext(correlationId, {
    state: body.state,
    hasEmployerCoverage: body.hasEmployerCoverage,
  }));

  const input = {
    dateOfBirth: dob,
    currentMonthlyPremium: body.currentMonthlyPremium,
    hasEmployerCoverage: body.hasEmployerCoverage,
    employerSize: body.employerSize,
    spouseHasEmployerCoverage: body.spouseHasEmployerCoverage,
    magi: body.magi,
    filingStatus: body.filingStatus,
    state: body.state.toUpperCase(),
    zipCode: body.zipCode,
    wantsDrugCoverage: body.wantsDrugCoverage,
    hasVAorTricare: body.hasVAorTricare,
    stillWorking: body.stillWorking,
  };

  const analysis = analyzeMedicareTransition(input);

  logger.info('[Medicare Transition API] Analysis complete', createLoggerContext(correlationId, {
    recommendation: analysis.comparison.recommendation,
    daysUntil65: analysis.timeline.daysUntil65,
  }));

  // Serialize dates for JSON response
  return NextResponse.json({
    success: true,
    correlationId,
    analysis: {
      ...analysis,
      timeline: {
        ...analysis.timeline,
        birthday65: analysis.timeline.birthday65.toISOString(),
        medicareStartDate: analysis.timeline.medicareStartDate.toISOString(),
        events: analysis.timeline.events.map((event) => ({
          ...event,
          date: event.date.toISOString(),
        })),
        enrollmentPeriods: analysis.timeline.enrollmentPeriods.map((period) => ({
          ...period,
          startDate: period.startDate.toISOString(),
          endDate: period.endDate.toISOString(),
        })),
      },
      checklist: analysis.checklist.map((item) => ({
        ...item,
        dueDate: item.dueDate?.toISOString(),
      })),
    },
  });
}

function handleQuickCalculation(body: QuickCalculationRequest, correlationId: string) {
  logger.info('[Medicare Transition API] Quick calculation', createLoggerContext(correlationId, {
    type: body.type,
  }));

  switch (body.type) {
    case 'eligibility': {
      if (!body.dateOfBirth) {
        return NextResponse.json(
          { error: 'dateOfBirth is required for eligibility calculation' },
          { status: 400 }
        );
      }
      const dob = new Date(body.dateOfBirth);
      if (isNaN(dob.getTime())) {
        return NextResponse.json(
          { error: 'Invalid dateOfBirth format' },
          { status: 400 }
        );
      }
      const eligibilityDate = getMedicareEligibilityDate(dob);
      const today = new Date();
      const daysUntilEligible = Math.ceil(
        (eligibilityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      return NextResponse.json({
        success: true,
        correlationId,
        eligibilityDate: eligibilityDate.toISOString(),
        daysUntilEligible: Math.max(0, daysUntilEligible),
        isEligible: daysUntilEligible <= 0,
      });
    }

    case 'partBPenalty': {
      if (body.monthsDelayed === undefined) {
        return NextResponse.json(
          { error: 'monthsDelayed is required for Part B penalty calculation' },
          { status: 400 }
        );
      }
      const penalty = calculatePartBPenalty(body.monthsDelayed);
      return NextResponse.json({
        success: true,
        correlationId,
        monthsDelayed: body.monthsDelayed,
        monthlyPenalty: penalty,
        annualPenalty: penalty * 12,
        note: 'This penalty is added to your Part B premium permanently',
      });
    }

    case 'partDPenalty': {
      if (body.monthsDelayed === undefined) {
        return NextResponse.json(
          { error: 'monthsDelayed is required for Part D penalty calculation' },
          { status: 400 }
        );
      }
      const penalty = calculatePartDPenalty(body.monthsDelayed);
      return NextResponse.json({
        success: true,
        correlationId,
        monthsDelayed: body.monthsDelayed,
        monthlyPenalty: penalty,
        annualPenalty: penalty * 12,
        note: 'This penalty is added to your Part D premium permanently',
      });
    }

    case 'irmaa': {
      if (body.magi === undefined) {
        return NextResponse.json(
          { error: 'magi is required for IRMAA calculation' },
          { status: 400 }
        );
      }
      const surcharge = getIRMAASurcharge(
        body.magi,
        body.filingStatus || 'single'
      );
      return NextResponse.json({
        success: true,
        correlationId,
        magi: body.magi,
        filingStatus: body.filingStatus || 'single',
        partBSurcharge: surcharge.partBExtra,
        partDSurcharge: surcharge.partDExtra,
        totalMonthlySurcharge: surcharge.partBExtra + surcharge.partDExtra,
        note: 'IRMAA is based on your tax return from 2 years ago',
      });
    }

    default:
      return NextResponse.json(
        { error: 'Invalid calculation type. Must be: eligibility, partBPenalty, partDPenalty, or irmaa' },
        { status: 400 }
      );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/wizards/medicare-transition',
    methods: ['POST'],
    description: 'Analyze Medicare transition options for users approaching age 65',
    parameters: {
      fullAnalysis: {
        dateOfBirth: 'ISO date string (required)',
        currentMonthlyPremium: 'Current monthly insurance premium (required)',
        state: 'Two-letter state code (required)',
        hasEmployerCoverage: 'Boolean if user has employer coverage',
        employerSize: "'small' (<20 employees) or 'large' (20+ employees)",
        spouseHasEmployerCoverage: 'Boolean if spouse has employer coverage',
        magi: 'Modified Adjusted Gross Income for IRMAA calculation',
        filingStatus: "'single', 'married_joint', or 'married_separate'",
        zipCode: 'ZIP code for location-specific estimates',
        wantsDrugCoverage: 'Boolean if user wants Part D coverage',
        hasVAorTricare: 'Boolean if user has VA or Tricare benefits',
        stillWorking: 'Boolean if user is still working',
      },
      quickCalculations: {
        eligibility: {
          type: "'eligibility'",
          dateOfBirth: 'ISO date string',
        },
        partBPenalty: {
          type: "'partBPenalty'",
          monthsDelayed: 'Number of months delayed',
        },
        partDPenalty: {
          type: "'partDPenalty'",
          monthsDelayed: 'Number of months delayed',
        },
        irmaa: {
          type: "'irmaa'",
          magi: 'Modified Adjusted Gross Income',
          filingStatus: 'Tax filing status (optional)',
        },
      },
    },
    example: {
      dateOfBirth: '1960-06-15',
      currentMonthlyPremium: 600,
      hasEmployerCoverage: true,
      employerSize: 'large',
      state: 'TX',
      stillWorking: true,
    },
  });
}
