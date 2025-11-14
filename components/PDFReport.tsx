'use client';

import React from 'react';
import { InsuranceRecommendation } from '@/types';
import { logger } from '@/lib/logger';

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
}

/**
 * PDF Report Generator
 * Generates a downloadable PDF of insurance recommendations
 */
export async function generatePDF(props: PDFReportProps): Promise<Blob> {
  try {
    // Dynamic import to avoid SSR issues
    logger.debug('Importing @react-pdf/renderer...');
    const ReactPDF = await import('@react-pdf/renderer');
    const { Document, Page, Text, View, StyleSheet, pdf } = ReactPDF;
    logger.debug('Successfully imported @react-pdf/renderer');

    if (!Document || !Page || !Text || !View || !StyleSheet || !pdf) {
      throw new Error('Failed to load PDF components from @react-pdf/renderer');
    }

  const styles = StyleSheet.create({
    page: {
      padding: 40,
      fontSize: 12,
      fontFamily: 'Helvetica',
    },
    header: {
      fontSize: 24,
      marginBottom: 20,
      color: '#1e40af',
      fontFamily: 'Helvetica-Bold',
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      marginBottom: 10,
      color: '#1e40af',
      fontFamily: 'Helvetica-Bold',
    },
    text: {
      marginBottom: 5,
      lineHeight: 1.5,
    },
    label: {
      fontFamily: 'Helvetica-Bold',
      marginRight: 5,
    },
    costBox: {
      backgroundColor: '#f3f4f6',
      padding: 15,
      marginVertical: 10,
      borderRadius: 5,
    },
    costText: {
      fontSize: 18,
      color: '#059669',
      fontFamily: 'Helvetica-Bold',
    },
    actionItem: {
      marginLeft: 15,
      marginBottom: 5,
    },
    bullet: {
      marginRight: 5,
    },
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 40,
      right: 40,
      textAlign: 'center',
      color: '#6b7280',
      fontSize: 10,
      borderTop: '1 solid #e5e7eb',
      paddingTop: 10,
    },
    disclaimer: {
      marginTop: 20,
      padding: 15,
      backgroundColor: '#fef3c7',
      fontSize: 10,
      color: '#92400e',
    },
  });

  const { recommendation, formData } = props;

  const MyDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text>Health Insurance Coverage Analysis</Text>
        </View>

        {/* Household Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Household</Text>
          <Text style={styles.text}>
            <Text style={styles.label}>Location:</Text>
            {formData.residences.map(r => `${r.state} ${r.zip}`).join(', ')}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.label}>Family Size:</Text>
            {formData.numAdults} adult{formData.numAdults !== 1 ? 's' : ''}
            {formData.numChildren > 0 && `, ${formData.numChildren} child${formData.numChildren !== 1 ? 'ren' : ''}`}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.label}>Budget:</Text>
            {formData.budget.replace('-', ' - $').replace('plus', '+')}
          </Text>
        </View>

        {/* Recommendation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Coverage</Text>
          <Text style={styles.text}>{recommendation.recommendedInsurance}</Text>

          <View style={styles.costBox}>
            <Text style={styles.costText}>
              Estimated Monthly Cost: $
              {typeof recommendation.estimatedMonthlyCost === 'object'
                ? `${recommendation.estimatedMonthlyCost.low} - $${recommendation.estimatedMonthlyCost.high}`
                : recommendation.estimatedMonthlyCost}
            </Text>
          </View>

          <Text style={styles.text}>
            <Text style={styles.label}>Coverage Score:</Text>
            {recommendation.coverageGapScore}/100
          </Text>
        </View>

        {/* Reasoning */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why This Recommendation</Text>
          <Text style={styles.text}>{recommendation.reasoning}</Text>
        </View>

        {/* Action Items */}
        {recommendation.actionItems && recommendation.actionItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Steps</Text>
            {recommendation.actionItems.map((item, index) => (
              <View key={index} style={styles.actionItem}>
                <Text style={styles.text}>
                  <Text style={styles.bullet}>•</Text> {item}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Alternative Options */}
        {recommendation.alternativeOptions && recommendation.alternativeOptions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alternative Options</Text>
            {recommendation.alternativeOptions.slice(0, 3).map((option, index) => (
              <View key={index} style={{ marginBottom: 10 }}>
                <Text style={styles.text}>
                  <Text style={styles.label}>{option.name}</Text>
                </Text>
                <Text style={styles.text}>
                  Cost: ${option.monthlyCost.low} - ${option.monthlyCost.high}/month
                </Text>
                <Text style={styles.text}>
                  Coverage Score: {option.coverageScore}/100
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Add-On Insurance Recommendations */}
        {recommendation.addOnInsuranceAnalysis && recommendation.addOnInsuranceAnalysis.recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended Add-On Insurance</Text>
            <Text style={styles.text}>
              Based on your household composition, we recommend these supplemental coverage options:
            </Text>

            {/* High Priority Recommendations */}
            {recommendation.addOnInsuranceAnalysis.highPriority.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ ...styles.text, ...styles.label }}>High Priority:</Text>
                {recommendation.addOnInsuranceAnalysis.highPriority.map((rec, index) => (
                  <View key={index} style={{ marginLeft: 15, marginBottom: 8 }}>
                    <Text style={styles.text}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.label}>{rec.insurance.name}</Text>
                      {' - $'}{rec.householdCostPerMonth}/month
                    </Text>
                    <Text style={{ fontSize: 10, marginLeft: 15, color: '#6b7280' }}>
                      {rec.insurance.description}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Medium Priority Recommendations */}
            {recommendation.addOnInsuranceAnalysis.mediumPriority.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ ...styles.text, ...styles.label }}>Consider:</Text>
                {recommendation.addOnInsuranceAnalysis.mediumPriority.slice(0, 3).map((rec, index) => (
                  <View key={index} style={{ marginLeft: 15, marginBottom: 5 }}>
                    <Text style={styles.text}>
                      <Text style={styles.bullet}>•</Text>
                      {rec.insurance.name} - ${rec.householdCostPerMonth}/month
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={{ ...styles.costBox, marginTop: 10 }}>
              <Text style={styles.text}>
                <Text style={styles.label}>Total High Priority Add-Ons:</Text>
                ${recommendation.addOnInsuranceAnalysis.totalMonthlyHighPriority}/month
              </Text>
              <Text style={styles.text}>
                <Text style={styles.label}>All Recommended Add-Ons:</Text>
                ${recommendation.addOnInsuranceAnalysis.totalMonthlyAllRecommended}/month
              </Text>
            </View>
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text>
            DISCLAIMER: This analysis is for educational purposes only and does not constitute
            professional financial or medical advice. Actual costs and coverage may vary.
            Please consult with a licensed insurance professional for personalized recommendations.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Generated on {new Date().toLocaleDateString()} | Coverage Gap Analyzer
          </Text>
        </View>
      </Page>
    </Document>
  );

    logger.debug('Rendering PDF document...');
    const blob = await pdf(<MyDocument />).toBlob();
    logger.debug('PDF blob created successfully');
    return blob;
  } catch (error) {
    logger.error('Error in generatePDF:', error);
    throw new Error(`Failed to generate PDF document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Trigger PDF download
 */
export async function downloadPDF(props: PDFReportProps): Promise<void> {
  // Ensure this only runs on client side
  if (typeof window === 'undefined') {
    throw new Error('PDF generation must run in the browser');
  }

  try {
    logger.debug('Starting PDF generation...');
    const blob = await generatePDF(props);
    logger.debug('PDF blob generated, creating download link...');

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `insurance-recommendation-${new Date().toISOString().split('T')[0]}.pdf`;
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
  fullReport: _fullReport = false, // TODO: Implement full report variant
  ...pdfProps
}: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await downloadPDF(pdfProps);
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
