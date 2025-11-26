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

interface HSACalculationRequest {
  coverageType: 'individual' | 'family';
  age: number;
  currentBalance?: number;
  annualIncome: number;
  federalTaxRate: number;
  stateTaxRate?: number;
  employerContribution?: number;
  expectedExpenses?: number;
  monthlyPremium: number;
  deductible: number;
  yearsToRetirement?: number;
  expectedReturn?: number;
  healthcareInflation?: number;
}

interface QuickCalculationRequest {
  type: 'eligibility' | 'paycheck' | 'retirement' | 'limits' | 'yield';
  coverageType?: 'individual' | 'family';
  deductible?: number;
  outOfPocketMax?: number;
  annualContribution?: number;
  payPeriods?: number;
  currentAge?: number;
  retirementAge?: number;
  currentAnnualCosts?: number;
  healthcareInflation?: number;
  year?: number;
  hsaYield?: number;
  federalTaxRate?: number;
  stateTaxRate?: number;
}

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  try {
    const body = await request.json();

    // Check if this is a quick calculation or full analysis
    if (body.type) {
      return handleQuickCalculation(body as QuickCalculationRequest, correlationId);
    }

    return handleFullAnalysis(body as HSACalculationRequest, correlationId);
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

function handleFullAnalysis(body: HSACalculationRequest, correlationId: string) {
  // Validate required fields
  const requiredFields = [
    'coverageType',
    'age',
    'annualIncome',
    'federalTaxRate',
    'monthlyPremium',
    'deductible',
  ];

  const missingFields = requiredFields.filter(
    (field) => body[field as keyof HSACalculationRequest] === undefined
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

  // Validate coverage type
  if (!['individual', 'family'].includes(body.coverageType)) {
    return NextResponse.json(
      { error: 'coverageType must be "individual" or "family"' },
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

  // Validate tax rates
  if (body.federalTaxRate < 0 || body.federalTaxRate > 0.5) {
    return NextResponse.json(
      { error: 'Invalid federalTaxRate (must be between 0 and 0.5)' },
      { status: 400 }
    );
  }

  logger.info('[HSA Calculator API] Calculating optimization', createLoggerContext(correlationId, {
    coverageType: body.coverageType,
    age: body.age,
  }));

  const analysis = calculateHSAOptimization(body);

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

function handleQuickCalculation(body: QuickCalculationRequest, correlationId: string) {
  logger.info('[HSA Calculator API] Quick calculation', createLoggerContext(correlationId, {
    type: body.type,
  }));

  switch (body.type) {
    case 'eligibility': {
      if (!body.coverageType || body.deductible === undefined || body.outOfPocketMax === undefined) {
        return NextResponse.json(
          { error: 'coverageType, deductible, and outOfPocketMax are required' },
          { status: 400 }
        );
      }

      const result = validateHDHPEligibility(
        body.coverageType,
        body.deductible,
        body.outOfPocketMax
      );

      return NextResponse.json({
        success: true,
        correlationId,
        ...result,
      });
    }

    case 'paycheck': {
      if (body.annualContribution === undefined || body.payPeriods === undefined) {
        return NextResponse.json(
          { error: 'annualContribution and payPeriods are required' },
          { status: 400 }
        );
      }

      const perPaycheck = calculatePaycheckContribution(
        body.annualContribution,
        body.payPeriods
      );

      return NextResponse.json({
        success: true,
        correlationId,
        annualContribution: body.annualContribution,
        payPeriods: body.payPeriods,
        perPaycheckContribution: perPaycheck,
        actualAnnualTotal: perPaycheck * body.payPeriods,
      });
    }

    case 'retirement': {
      if (
        body.currentAge === undefined ||
        body.retirementAge === undefined ||
        body.currentAnnualCosts === undefined
      ) {
        return NextResponse.json(
          { error: 'currentAge, retirementAge, and currentAnnualCosts are required' },
          { status: 400 }
        );
      }

      const result = estimateRetirementHealthcareCosts(
        body.currentAge,
        body.retirementAge,
        body.currentAnnualCosts,
        body.healthcareInflation
      );

      return NextResponse.json({
        success: true,
        correlationId,
        ...result,
      });
    }

    case 'limits': {
      const limits = getHSALimits(body.year);

      return NextResponse.json({
        success: true,
        correlationId,
        year: body.year || 2024,
        limits,
      });
    }

    case 'yield': {
      if (body.hsaYield === undefined || body.federalTaxRate === undefined) {
        return NextResponse.json(
          { error: 'hsaYield and federalTaxRate are required' },
          { status: 400 }
        );
      }

      const taxEquivalentYield = calculateTaxEquivalentYield(
        body.hsaYield,
        body.federalTaxRate,
        body.stateTaxRate
      );

      return NextResponse.json({
        success: true,
        correlationId,
        hsaYield: body.hsaYield,
        hsaYieldPercent: `${(body.hsaYield * 100).toFixed(2)}%`,
        taxEquivalentYield,
        taxEquivalentYieldPercent: `${(taxEquivalentYield * 100).toFixed(2)}%`,
        note: 'Tax-equivalent yield shows what a taxable investment would need to return to match HSA growth',
      });
    }

    default:
      return NextResponse.json(
        { error: 'Invalid calculation type. Must be: eligibility, paycheck, retirement, limits, or yield' },
        { status: 400 }
      );
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
