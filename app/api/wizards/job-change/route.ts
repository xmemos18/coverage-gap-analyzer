/**
 * Job Change Wizard API Route
 *
 * POST /api/wizards/job-change
 * Analyzes COBRA vs marketplace options for job transitions
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeJobChange, quickCOBRAvsMarketplace } from '@/lib/wizards';
import { logger } from '@/lib/logger';
import { getCorrelationId, createLoggerContext } from '@/lib/middleware/correlation';

interface JobChangeRequest {
  separationDate: string;
  currentPremium: number;
  cobraPremium: number;
  householdIncome: number;
  householdSize: number;
  state: string;
  zipCode?: string;
  age: number;
  dependentAges?: number[];
  tobaccoUser?: boolean;
  expectedUtilization: 'low' | 'medium' | 'high';
  hasNewJobOffer?: boolean;
  newJobStartDate?: string;
  newJobWaitingPeriod?: number;
  hasOngoingPrescriptions?: boolean;
  wantsToKeepProviders?: boolean;
}

interface QuickCompareRequest {
  cobraPremium: number;
  age: number;
  income: number;
  householdSize: number;
  state: string;
}

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  try {
    const body = await request.json();

    // Check if this is a quick compare or full analysis
    if (body.quickCompare) {
      return handleQuickCompare(body as QuickCompareRequest, correlationId);
    }

    return handleFullAnalysis(body as JobChangeRequest, correlationId);
  } catch (error) {
    logger.error('[Job Change API] Request error', createLoggerContext(correlationId, {
      error: error instanceof Error ? error.message : String(error),
    }));

    return NextResponse.json(
      {
        error: 'Failed to analyze job change options',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function handleFullAnalysis(body: JobChangeRequest, correlationId: string) {
  // Validate required fields
  const requiredFields = [
    'separationDate',
    'cobraPremium',
    'householdIncome',
    'householdSize',
    'state',
    'age',
    'expectedUtilization',
  ];

  const missingFields = requiredFields.filter(
    (field) => body[field as keyof JobChangeRequest] === undefined
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

  // Validate field values
  if (body.age < 0 || body.age > 120) {
    return NextResponse.json(
      { error: 'Invalid age value' },
      { status: 400 }
    );
  }

  if (body.householdSize < 1 || body.householdSize > 20) {
    return NextResponse.json(
      { error: 'Invalid household size' },
      { status: 400 }
    );
  }

  if (!['low', 'medium', 'high'].includes(body.expectedUtilization)) {
    return NextResponse.json(
      { error: 'Invalid expectedUtilization value' },
      { status: 400 }
    );
  }

  logger.info('[Job Change API] Analyzing job change', createLoggerContext(correlationId, {
    state: body.state,
    age: body.age,
    householdSize: body.householdSize,
  }));

  // Build scenario object
  const scenario = {
    separationDate: new Date(body.separationDate),
    currentPremium: body.currentPremium || 0,
    cobraPremium: body.cobraPremium,
    householdIncome: body.householdIncome,
    householdSize: body.householdSize,
    state: body.state.toUpperCase(),
    zipCode: body.zipCode,
    age: body.age,
    dependentAges: body.dependentAges,
    tobaccoUser: body.tobaccoUser,
    expectedUtilization: body.expectedUtilization,
    hasNewJobOffer: body.hasNewJobOffer,
    newJobStartDate: body.newJobStartDate ? new Date(body.newJobStartDate) : undefined,
    newJobWaitingPeriod: body.newJobWaitingPeriod,
    hasOngoingPrescriptions: body.hasOngoingPrescriptions,
    wantsToKeepProviders: body.wantsToKeepProviders,
  };

  const analysis = analyzeJobChange(scenario);

  logger.info('[Job Change API] Analysis complete', createLoggerContext(correlationId, {
    recommendedOption: analysis.recommendedOption.type,
    savings: analysis.costComparison.savings,
  }));

  // Serialize dates for JSON response
  return NextResponse.json({
    success: true,
    correlationId,
    analysis: {
      ...analysis,
      sepInfo: {
        ...analysis.sepInfo,
        deadline: analysis.sepInfo.deadline.toISOString(),
      },
      timeline: analysis.timeline.map((event) => ({
        ...event,
        date: event.date.toISOString(),
      })),
      options: analysis.options.map((option) => ({
        ...option,
        startDate: option.startDate.toISOString(),
        endDate: option.endDate.toISOString(),
      })),
      recommendedOption: {
        ...analysis.recommendedOption,
        startDate: analysis.recommendedOption.startDate.toISOString(),
        endDate: analysis.recommendedOption.endDate.toISOString(),
      },
    },
  });
}

function handleQuickCompare(body: QuickCompareRequest, correlationId: string) {
  // Validate required fields
  if (
    body.cobraPremium === undefined ||
    body.age === undefined ||
    body.income === undefined ||
    body.householdSize === undefined ||
    !body.state
  ) {
    return NextResponse.json(
      { error: 'Missing required fields for quick comparison' },
      { status: 400 }
    );
  }

  logger.info('[Job Change API] Quick comparison', createLoggerContext(correlationId, {
    state: body.state,
    age: body.age,
  }));

  const result = quickCOBRAvsMarketplace(
    body.cobraPremium,
    body.age,
    body.income,
    body.householdSize,
    body.state.toUpperCase()
  );

  return NextResponse.json({
    success: true,
    correlationId,
    comparison: result,
  });
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/wizards/job-change',
    methods: ['POST'],
    description: 'Analyze COBRA vs marketplace coverage options for job transitions',
    parameters: {
      fullAnalysis: {
        separationDate: 'ISO date string (required)',
        cobraPremium: 'Full COBRA premium amount (required)',
        currentPremium: 'Current employee premium contribution',
        householdIncome: 'Annual household income (required)',
        householdSize: 'Number in household (required)',
        state: 'Two-letter state code (required)',
        zipCode: 'ZIP code for location adjustment',
        age: 'Primary applicant age (required)',
        dependentAges: 'Array of dependent ages',
        expectedUtilization: "'low' | 'medium' | 'high' (required)",
        hasNewJobOffer: 'Boolean if new job offer exists',
        newJobStartDate: 'ISO date string for new job start',
        newJobWaitingPeriod: 'Days until new job coverage begins',
        hasOngoingPrescriptions: 'Boolean for prescription needs',
        wantsToKeepProviders: 'Boolean for provider continuity preference',
      },
      quickCompare: {
        quickCompare: 'true',
        cobraPremium: 'Full COBRA premium amount',
        age: 'Primary applicant age',
        income: 'Annual household income',
        householdSize: 'Number in household',
        state: 'Two-letter state code',
      },
    },
    example: {
      separationDate: '2024-06-15',
      cobraPremium: 1800,
      householdIncome: 60000,
      householdSize: 2,
      state: 'TX',
      age: 45,
      expectedUtilization: 'medium',
    },
  });
}
