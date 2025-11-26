/**
 * PDF Report API Route
 *
 * POST /api/reports/pdf
 * Generate a PDF coverage analysis report
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePDFBuffer, validateReportInput } from '@/lib/reports/pdf-generator';
import { logger } from '@/lib/logger';
import { getCorrelationId, createLoggerContext } from '@/lib/middleware/correlation';

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  try {
    const body = await request.json();

    // Validate input
    if (!validateReportInput(body)) {
      return NextResponse.json(
        {
          error: 'Invalid report input',
          message: 'formData and recommendation are required with proper structure',
        },
        { status: 400 }
      );
    }

    logger.info('[PDF Report API] Generating PDF report', createLoggerContext(correlationId, {
      recommendedInsurance: body.recommendation.recommendedInsurance,
    }));

    // Add generation timestamp if not provided
    const input = {
      ...body,
      generatedAt: body.generatedAt ? new Date(body.generatedAt) : new Date(),
    };

    // Generate PDF
    const pdfBuffer = await generatePDFBuffer(input);

    logger.info('[PDF Report API] PDF generated successfully', createLoggerContext(correlationId, {
      size: pdfBuffer.length,
    }));

    // Return PDF as response (convert Buffer to Uint8Array for NextResponse)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="coverage-analysis-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'X-Correlation-ID': correlationId,
      },
    });
  } catch (error) {
    logger.error('[PDF Report API] Failed to generate PDF', createLoggerContext(correlationId, {
      error: error instanceof Error ? error.message : String(error),
    }));

    return NextResponse.json(
      {
        error: 'Failed to generate PDF report',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/reports/pdf',
    methods: ['POST'],
    description: 'Generate a PDF coverage analysis report',
    contentType: 'application/pdf',
    parameters: {
      formData: 'Calculator form data (CalculatorFormData type)',
      recommendation: 'Insurance recommendation result (InsuranceRecommendation type)',
      generatedAt: 'Optional timestamp for the report (ISO string)',
    },
    example: {
      formData: {
        residences: [{ zip: '90210', state: 'CA', isPrimary: true, monthsPerYear: 12 }],
        numAdults: 2,
        adultAges: [35, 33],
        numChildren: 1,
        childAges: [5],
        budget: '500-750',
        incomeRange: '50000-75000',
      },
      recommendation: {
        recommendedInsurance: 'ACA Marketplace Silver Plan',
        planType: 'PPO',
        coverageGapScore: 85,
        estimatedMonthlyCost: { low: 450, high: 650 },
        reasoning: 'Based on your household size and income...',
        actionItems: ['Visit HealthCare.gov during Open Enrollment'],
        alternativeOptions: [],
      },
    },
    notes: [
      'Returns PDF binary data',
      'Set Accept header to application/pdf',
      'Large reports may take a few seconds to generate',
    ],
  });
}
