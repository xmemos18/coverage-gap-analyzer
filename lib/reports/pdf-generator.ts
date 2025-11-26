/**
 * PDF Generator Service
 *
 * Provides utilities for generating PDF reports from coverage analysis data.
 * Works in both browser and server environments.
 */

import { pdf } from '@react-pdf/renderer';
import { createElement, type ReactElement } from 'react';
import { CoverageAnalysisReport, type PDFReportInput } from './pdf-document';
import { logger } from '@/lib/logger';

/**
 * Generate a PDF blob from the coverage analysis data
 * Works in both browser and server environments
 */
export async function generatePDFBlob(input: PDFReportInput): Promise<Blob> {
  try {
    // Cast to any to avoid react-pdf type compatibility issues
    // The component returns a valid Document element
    const document = createElement(CoverageAnalysisReport, input) as unknown as ReactElement;
    const blob = await pdf(document).toBlob();
    return blob;
  } catch (error) {
    logger.error('[PDF Generator] Failed to generate PDF blob', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Failed to generate PDF report');
  }
}

/**
 * Generate a PDF and return as a Buffer (for server-side use)
 */
export async function generatePDFBuffer(input: PDFReportInput): Promise<Buffer> {
  try {
    // Cast to any to avoid react-pdf type compatibility issues
    const document = createElement(CoverageAnalysisReport, input) as unknown as ReactElement;
    const blob = await pdf(document).toBlob();
    // Convert blob to Buffer
    const arrayBuffer = await blob.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    logger.error('[PDF Generator] Failed to generate PDF buffer', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Failed to generate PDF report');
  }
}

/**
 * Generate and download PDF in the browser
 */
export async function generatePDFReport(
  input: PDFReportInput,
  filename?: string
): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('generatePDFReport is only available in browser environments');
  }

  try {
    const blob = await generatePDFBlob(input);
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || generateFilename(input);
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    logger.error('[PDF Generator] Failed to download PDF', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Failed to download PDF report');
  }
}

/**
 * Generate a filename for the PDF report
 */
function generateFilename(input: PDFReportInput): string {
  const date = (input.generatedAt || new Date()).toISOString().split('T')[0];
  const planType = input.recommendation.recommendedInsurance
    .toLowerCase()
    .replace(/\s+/g, '-')
    .substring(0, 20);
  return `coverage-analysis-${planType}-${date}.pdf`;
}

/**
 * Generate PDF and return as base64 string
 * Useful for API responses and email attachments
 */
export async function generatePDFBase64(input: PDFReportInput): Promise<string> {
  try {
    const buffer = await generatePDFBuffer(input);
    return buffer.toString('base64');
  } catch (error) {
    logger.error('[PDF Generator] Failed to generate PDF base64', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Failed to generate PDF report');
  }
}

/**
 * Validate report input data
 */
export function validateReportInput(input: unknown): input is PDFReportInput {
  if (!input || typeof input !== 'object') return false;

  const data = input as Record<string, unknown>;

  // Check required fields
  if (!data.formData || typeof data.formData !== 'object') return false;
  if (!data.recommendation || typeof data.recommendation !== 'object') return false;

  const recommendation = data.recommendation as Record<string, unknown>;

  // Check recommendation required fields
  if (typeof recommendation.recommendedInsurance !== 'string') return false;
  if (typeof recommendation.coverageGapScore !== 'number') return false;
  if (!recommendation.estimatedMonthlyCost || typeof recommendation.estimatedMonthlyCost !== 'object') return false;
  if (!Array.isArray(recommendation.actionItems)) return false;
  if (!Array.isArray(recommendation.alternativeOptions)) return false;

  return true;
}
