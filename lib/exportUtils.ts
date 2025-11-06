/**
 * Export utilities for add-on insurance recommendations
 * Supports CSV export with detailed recommendation data
 */

import type { AddOnInsuranceAnalysis } from '@/types/addOnInsurance';
import { logger } from './logger';

/**
 * Convert add-on insurance recommendations to CSV format
 */
export function exportRecommendationsToCSV(analysis: AddOnInsuranceAnalysis): string {
  const headers = [
    'Insurance Type',
    'Category',
    'Priority',
    'Recommendation Score (%)',
    'Monthly Cost',
    'Applicable Members',
    'Age Group',
    'Key Reasons'
  ];

  const rows = analysis.recommendations.map(rec => [
    rec.insurance.name,
    rec.insurance.category,
    rec.priority,
    rec.probabilityScore.toString(),
    `$${rec.householdCostPerMonth}`,
    rec.applicableMembers.toString(),
    rec.ageGroup,
    rec.reasons.join('; ')
  ]);

  // Add summary row
  rows.push([]);
  rows.push(['SUMMARY', '', '', '', '', '', '', '']);
  rows.push(['Total High Priority Cost', '', '', '', `$${analysis.totalMonthlyHighPriority}/mo`, '', '', '']);
  rows.push(['Total All Recommended Cost', '', '', '', `$${analysis.totalMonthlyAllRecommended}/mo`, '', '', '']);
  rows.push(['Total Annual Cost', '', '', '', `$${analysis.totalMonthlyAllRecommended * 12}/year`, '', '', '']);

  // Convert to CSV string
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
}

/**
 * Trigger browser download of CSV file
 */
export function downloadCSV(csvContent: string, filename: string = 'add-on-insurance-recommendations.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Export recommendations to CSV and trigger download
 */
export function exportAndDownloadRecommendations(analysis: AddOnInsuranceAnalysis): void {
  try {
    const csvContent = exportRecommendationsToCSV(analysis);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `add-on-insurance-recommendations-${timestamp}.csv`;
    downloadCSV(csvContent, filename);
  } catch (error) {
    logger.error('Error exporting recommendations', { error });
    throw new Error('Failed to export recommendations. Please try again.');
  }
}

/**
 * Get detailed summary text for recommendations (for clipboard copy)
 */
export function getRecommendationSummaryText(analysis: AddOnInsuranceAnalysis): string {
  let text = 'ADD-ON INSURANCE RECOMMENDATIONS\n';
  text += '='.repeat(50) + '\n\n';

  // Household composition
  text += 'HOUSEHOLD COMPOSITION:\n';
  analysis.householdAgeGroups.forEach(group => {
    text += `  • ${group.memberCount} ${group.groupName}\n`;
  });
  text += '\n';

  // High priority recommendations
  if (analysis.highPriority.length > 0) {
    text += 'HIGH PRIORITY RECOMMENDATIONS:\n';
    analysis.highPriority.forEach(rec => {
      text += `\n${rec.insurance.name}\n`;
      text += `  Priority: High (${rec.probabilityScore}% match)\n`;
      text += `  Cost: $${rec.householdCostPerMonth}/month\n`;
      text += `  Why recommended:\n`;
      rec.reasons.forEach(reason => {
        text += `    - ${reason}\n`;
      });
    });
    text += '\n';
  }

  // Medium priority recommendations
  if (analysis.mediumPriority.length > 0) {
    text += 'MEDIUM PRIORITY RECOMMENDATIONS:\n';
    analysis.mediumPriority.forEach(rec => {
      text += `  • ${rec.insurance.name} - $${rec.householdCostPerMonth}/month (${rec.probabilityScore}% match)\n`;
    });
    text += '\n';
  }

  // Cost summary
  text += 'COST SUMMARY:\n';
  text += `  High Priority Add-Ons: $${analysis.totalMonthlyHighPriority}/month\n`;
  text += `  All Recommended Add-Ons: $${analysis.totalMonthlyAllRecommended}/month\n`;
  text += `  Annual Cost (All): $${analysis.totalMonthlyAllRecommended * 12}/year\n\n`;

  text += '='.repeat(50) + '\n';
  text += `Generated: ${new Date().toLocaleDateString()}\n`;
  text += 'Note: These are estimates. Consult with a licensed insurance agent for personalized quotes.\n';

  return text;
}

/**
 * Copy recommendation summary to clipboard
 */
export async function copyRecommendationsToClipboard(analysis: AddOnInsuranceAnalysis): Promise<void> {
  try {
    const text = getRecommendationSummaryText(analysis);
    await navigator.clipboard.writeText(text);
  } catch (error) {
    logger.error('Error copying to clipboard', { error });
    throw new Error('Failed to copy to clipboard. Please try again.');
  }
}
