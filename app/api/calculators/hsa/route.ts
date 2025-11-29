/**
 * HSA Calculator API Route
 *
 * POST /api/calculators/hsa
 * Calculate HSA optimization and tax benefits
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  calculateHSAOptimization,
  validateHDHPEligibility,
  calculatePaycheckContribution,
  estimateRetirementHealthcareCosts,
  getHSALimits,
  calculateTaxEquivalentYield,
} from '@/lib/calculators';
import { logger } from '@/lib/logger';
import { getCorrelationId, createLoggerContext } from '@/lib/middleware/correlation';
import {
  HSACalculationRequestSchema,
  HSAQuickCalculationRequestSchema,
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
    logger.error('[HSA Calculator API] Request error', createLoggerContext(correlationId, {
      error: error instanceof Error ? error.message : String(error),
    }));

    return NextResponse.json(
      {
        error: 'Failed to calculate HSA optimization',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function handleFullAnalysis(body: unknown, correlationId: string) {
  // Validate with Zod
  const parsed = parseRequestBody(HSACalculationRequestSchema, body);
  if (!parsed.success) {
    logger.warn('[HSA Calculator API] Validation failed', createLoggerContext(correlationId, {
      error: parsed.error,
    }));
    return NextResponse.json(
      { error: parsed.error, details: parsed.details },
      { status: 400 }
    );
  }

  const data = parsed.data;

  logger.info('[HSA Calculator API] Calculating optimization', createLoggerContext(correlationId, {
    coverageType: data.coverageType,
    age: data.age,
  }));

  const analysis = calculateHSAOptimization(data);

  logger.info('[HSA Calculator API] Calculation complete', createLoggerContext(correlationId, {
    recommendedContribution: analysis.recommendedContribution,
    totalTaxSavings: analysis.taxSavings.totalAnnualSavings,
  }));

  return NextResponse.json({
    success: true,
    correlationId,
    analysis,
  });
}

function handleQuickCalculation(body: unknown, correlationId: string) {
  // Validate with Zod discriminated union
  const parsed = parseRequestBody(HSAQuickCalculationRequestSchema, body);
  if (!parsed.success) {
    logger.warn('[HSA Calculator API] Quick calculation validation failed', createLoggerContext(correlationId, {
      error: parsed.error,
    }));
    return NextResponse.json(
      { error: parsed.error, details: parsed.details },
      { status: 400 }
    );
  }

  const data = parsed.data;

  logger.info('[HSA Calculator API] Quick calculation', createLoggerContext(correlationId, {
    type: data.type,
  }));

  switch (data.type) {
    case 'eligibility': {
      const result = validateHDHPEligibility(
        data.coverageType,
        data.deductible,
        data.outOfPocketMax
      );

      return NextResponse.json({
        success: true,
        correlationId,
        ...result,
      });
    }

    case 'paycheck': {
      const perPaycheck = calculatePaycheckContribution(
        data.annualContribution,
        data.payPeriods
      );

      return NextResponse.json({
        success: true,
        correlationId,
        annualContribution: data.annualContribution,
        payPeriods: data.payPeriods,
        perPaycheckContribution: perPaycheck,
        actualAnnualTotal: perPaycheck * data.payPeriods,
      });
    }

    case 'retirement': {
      const result = estimateRetirementHealthcareCosts(
        data.currentAge,
        data.retirementAge,
        data.currentAnnualCosts,
        data.healthcareInflation
      );

      return NextResponse.json({
        success: true,
        correlationId,
        ...result,
      });
    }

    case 'limits': {
      const limits = getHSALimits(data.year);

      return NextResponse.json({
        success: true,
        correlationId,
        year: data.year || 2024,
        limits,
      });
    }

    case 'yield': {
      const taxEquivalentYield = calculateTaxEquivalentYield(
        data.hsaYield,
        data.federalTaxRate,
        data.stateTaxRate
      );

      return NextResponse.json({
        success: true,
        correlationId,
        hsaYield: data.hsaYield,
        hsaYieldPercent: `${(data.hsaYield * 100).toFixed(2)}%`,
        taxEquivalentYield,
        taxEquivalentYieldPercent: `${(taxEquivalentYield * 100).toFixed(2)}%`,
        note: 'Tax-equivalent yield shows what a taxable investment would need to return to match HSA growth',
      });
    }
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/calculators/hsa',
    methods: ['POST'],
    description: 'Calculate HSA optimization, tax benefits, and projections',
    parameters: {
      fullAnalysis: {
        coverageType: "'individual' or 'family' (required)",
        age: 'Account holder age (required)',
        annualIncome: 'Annual household income (required)',
        federalTaxRate: 'Federal tax rate as decimal, e.g., 0.22 (required)',
        monthlyPremium: 'HDHP monthly premium (required)',
        deductible: 'HDHP deductible (required)',
        currentBalance: 'Current HSA balance',
        stateTaxRate: 'State tax rate as decimal',
        employerContribution: 'Annual employer HSA contribution',
        expectedExpenses: 'Expected annual healthcare expenses',
        yearsToRetirement: 'Years until retirement',
        expectedReturn: 'Expected investment return as decimal (default 0.07)',
        healthcareInflation: 'Healthcare inflation rate as decimal (default 0.05)',
      },
      quickCalculations: {
        eligibility: {
          type: "'eligibility'",
          coverageType: "'individual' or 'family'",
          deductible: 'Plan deductible',
          outOfPocketMax: 'Plan out-of-pocket maximum',
        },
        paycheck: {
          type: "'paycheck'",
          annualContribution: 'Target annual contribution',
          payPeriods: 'Number of pay periods per year (12, 24, 26, or 52)',
        },
        retirement: {
          type: "'retirement'",
          currentAge: 'Current age',
          retirementAge: 'Expected retirement age',
          currentAnnualCosts: 'Current annual healthcare costs',
          healthcareInflation: 'Healthcare inflation rate (optional)',
        },
        limits: {
          type: "'limits'",
          year: 'Year for limits (default 2024)',
        },
        yield: {
          type: "'yield'",
          hsaYield: 'Expected HSA investment return',
          federalTaxRate: 'Federal tax rate',
          stateTaxRate: 'State tax rate (optional)',
        },
      },
    },
    example: {
      coverageType: 'individual',
      age: 40,
      annualIncome: 80000,
      federalTaxRate: 0.22,
      stateTaxRate: 0.05,
      monthlyPremium: 200,
      deductible: 2000,
      currentBalance: 5000,
      yearsToRetirement: 25,
    },
  });
}
