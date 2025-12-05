'use client';

import React from 'react';
import { InsuranceRecommendation, CalculatorFormData } from '@/types';
import { logger } from '@/lib/logger';
import { CoverageAnalysisReport, PDFReportInput } from '@/lib/reports/pdf-document';

// Note: This will use dynamic import to avoid SSR issues with @react-pdf/renderer
// The actual PDF generation happens client-side only

interface PDFReportProps {
  recommendation: InsuranceRecommendation;
  formData: {
    residences: Array<{ zip: string; state: string }>;
    numAdults: number;
    numChildren: number;
    adultAges: number[];
    childAges: number[];
    budget: string;
    incomeRange: string;
  };
  fullReport?: boolean;
}

/**
 * Convert minimal formData to full CalculatorFormData for PDF generation
 */
function toFullFormData(formData: PDFReportProps['formData']): CalculatorFormData {
  return {
    residences: formData.residences.map((r, i) => ({
      zip: r.zip,
      state: r.state,
      isPrimary: i === 0,
      monthsPerYear: 12,
    })),
    numAdults: formData.numAdults,
    adultAges: formData.adultAges,
    adultsUseTobacco: Array(formData.numAdults).fill(false),
    numChildren: formData.numChildren,
    childAges: formData.childAges,
    childrenUseTobacco: Array(formData.numChildren).fill(false),
    hasMedicareEligible: false,
    hasEmployerInsurance: false,
    employerContribution: 0,
    hasChronicConditions: false,
    chronicConditions: [],
    prescriptionCount: '',
    providerPreference: '',
    doctorVisitsPerYear: '',
    specialistVisitsPerYear: '',
    erVisitsPerYear: '',
    plannedProcedures: false,
    takesSpecialtyMeds: false,
    monthlyMedicationCost: '',
    usesMailOrderPharmacy: false,
    hasPreferredHospital: false,
    preferredHospitalName: '',
    hospitalImportance: '',
    needsNationalCoverage: '',
    financialPriority: '',
    canAffordUnexpectedBill: '',
    preferredPlanTypes: [],
    hasCurrentInsurance: false,
    currentInsurance: {
      carrier: '',
      planType: '',
      monthlyCost: 0,
      deductible: 0,
      outOfPocketMax: 0,
      coverageNotes: '',
    },
    budget: formData.budget,
    incomeRange: formData.incomeRange,
    annualIncome: null,
    netWorth: null,
    currentStep: 7,
    simpleMode: false,
    interestedInAddOns: true,
  };
}

/**
 * PDF Report Generator
 * Generates a downloadable PDF of insurance recommendations using the comprehensive report component
 */
export async function generatePDF(props: PDFReportProps): Promise<Blob> {
  try {
    // Dynamic import to avoid SSR issues
    logger.debug('Importing @react-pdf/renderer...');
    const ReactPDF = await import('@react-pdf/renderer');
    const { pdf } = ReactPDF;
    logger.debug('Successfully imported @react-pdf/renderer');

    if (!pdf) {
      throw new Error('Failed to load pdf function from @react-pdf/renderer');
    }

    const { recommendation, formData, fullReport = false } = props;

    // Convert minimal formData to full CalculatorFormData
    const fullFormData = toFullFormData(formData);

    // Create PDF input for comprehensive report
    const pdfInput: PDFReportInput = {
      formData: fullFormData,
      recommendation,
      generatedAt: new Date(),
      fullReport,
    };

    logger.debug('Rendering PDF document...', { fullReport });
    // Cast to any to avoid React 19 / @react-pdf/renderer type incompatibility
    const documentElement = React.createElement(CoverageAnalysisReport, pdfInput);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blob = await pdf(documentElement as any).toBlob();
    logger.debug('PDF blob created successfully');
    return blob;
  } catch (error) {
    logger.error('Error in generatePDF:', error);
    throw new Error(`Failed to generate PDF document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Trigger PDF download
 * @param props - PDF report properties including recommendation data and optional fullReport flag
 */
export async function downloadPDF(props: PDFReportProps & { fullReport?: boolean }): Promise<void> {
  // Ensure this only runs on client side
  if (typeof window === 'undefined') {
    throw new Error('PDF generation must run in the browser');
  }

  try {
    logger.debug('Starting PDF generation...', { fullReport: props.fullReport });
    const blob = await generatePDF(props);
    logger.debug('PDF blob generated, creating download link...');

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const reportType = props.fullReport ? 'full-report' : 'summary';
    link.download = `insurance-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

    logger.debug('PDF download triggered successfully');
  } catch (error) {
    logger.error('Failed to generate PDF:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * PDF Download Button Component
 */
interface PDFDownloadButtonProps extends PDFReportProps {
  className?: string;
  onError?: (error: Error) => void;
  variant?: 'default' | 'dropdown-item' | 'mobile-menu-item';
  label?: string;
  description?: string;
  fullReport?: boolean;
}

export function PDFDownloadButton({
  className = '',
  onError,
  variant = 'default',
  label,
  description,
  fullReport = false,
  ...pdfProps
}: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await downloadPDF({ ...pdfProps, fullReport });
    } catch (error) {
      logger.error('PDF generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF';
      if (onError) {
        onError(error as Error);
      } else {
        alert(`PDF Generation Failed: ${errorMessage}\n\nPlease try using the Print button instead.`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Dropdown item variant
  if (variant === 'dropdown-item') {
    return (
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {isGenerating ? (
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-gray-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm text-gray-600">Generating...</span>
          </div>
        ) : (
          <>
            <div className="font-medium text-gray-900">{label || 'Download PDF'}</div>
            {description && <div className="text-xs text-gray-600 mt-0.5">{description}</div>}
          </>
        )}
      </button>
    );
  }

  // Mobile menu item variant
  if (variant === 'mobile-menu-item') {
    return (
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          {isGenerating ? (
            <svg className="animate-spin h-5 w-5 text-gray-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          <div>
            <div className="font-medium text-gray-900">{label || 'Download PDF'}</div>
            {description && <div className="text-xs text-gray-600">{description}</div>}
          </div>
        </div>
      </button>
    );
  }

  // Default button variant
  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className={`btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label="Download PDF report"
    >
      {isGenerating ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Generating PDF...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {label || 'Download PDF'}
        </>
      )}
    </button>
  );
}
