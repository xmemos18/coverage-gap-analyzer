/**
 * PDF Document Components
 *
 * React-PDF components for generating professional coverage analysis reports.
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Rect,
  Line,
  G,
} from '@react-pdf/renderer';
import type { InsuranceRecommendation, CalculatorFormData } from '@/types';

// Color palette
const colors = {
  primary: '#1e3a5f',
  secondary: '#2563eb',
  accent: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingTop: 50,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  pageAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: colors.primary,
  },
  header: {
    marginBottom: 25,
    borderBottom: `2px solid ${colors.primary}`,
    paddingBottom: 15,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.gray[600],
  },
  brandText: {
    fontSize: 10,
    color: colors.secondary,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
    borderBottom: `2px solid ${colors.gray[200]}`,
    paddingBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    color: colors.gray[500],
    marginBottom: 2,
  },
  value: {
    fontSize: 11,
    color: colors.gray[800],
  },
  highlight: {
    backgroundColor: colors.gray[50],
    padding: 15,
    borderRadius: 6,
    marginBottom: 12,
    borderLeft: `4px solid ${colors.secondary}`,
  },
  recommendationBox: {
    backgroundColor: '#eff6ff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 15,
    borderLeft: `5px solid ${colors.secondary}`,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreCircle: {
    width: 65,
    height: 65,
    borderRadius: 35,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    borderWidth: 3,
    borderColor: colors.secondary,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scoreLabel: {
    fontSize: 8,
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    padding: 8,
    borderBottom: `1px solid ${colors.gray[300]}`,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.gray[700],
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: `1px solid ${colors.gray[200]}`,
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    color: colors.gray[600],
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    width: 15,
    fontSize: 10,
    color: colors.secondary,
  },
  listText: {
    flex: 1,
    fontSize: 10,
    color: colors.gray[700],
  },
  chartContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: `2px solid ${colors.primary}`,
    paddingTop: 12,
  },
  footerText: {
    fontSize: 8,
    color: colors.gray[500],
  },
  pageNumber: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 8,
    fontWeight: 'bold',
  },
  badgeSuccess: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  badgeWarning: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  badgeDanger: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
});

// Chart Components
interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  width?: number;
  height?: number;
  maxValue?: number;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  width = 500,
  height = 150,
  maxValue,
}) => {
  const max = maxValue || Math.max(...data.map((d) => d.value));
  const barWidth = (width - 60) / data.length - 10;
  const chartHeight = height - 40;

  return (
    <Svg width={width} height={height}>
      {/* Y-axis */}
      <Line x1="50" y1="10" x2="50" y2={chartHeight + 10} stroke={colors.gray[300]} strokeWidth={1} />

      {/* X-axis */}
      <Line x1="50" y1={chartHeight + 10} x2={width - 10} y2={chartHeight + 10} stroke={colors.gray[300]} strokeWidth={1} />

      {/* Bars */}
      {data.map((item, index) => {
        const barHeight = (item.value / max) * chartHeight;
        const x = 60 + index * (barWidth + 10);
        const y = chartHeight + 10 - barHeight;

        return (
          <G key={index}>
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={item.color || colors.secondary}
            />
            <Text
              x={x + barWidth / 2}
              y={chartHeight + 25}
              style={{ fontSize: 7, textAnchor: 'middle' }}
            >
              {item.label}
            </Text>
          </G>
        );
      })}
    </Svg>
  );
};

// Report Input Types
export interface PDFReportInput {
  formData: CalculatorFormData;
  recommendation: InsuranceRecommendation;
  generatedAt?: Date;
  fullReport?: boolean;
}

// Emoji to text replacements for PDF rendering
const emojiReplacements: Record<string, string> = {
  '⏰': '[TIME]',
  '💊': '[RX]',
  '🏥': '[HEALTH]',
  '🔥': '[!]',
  '📊': '[STATS]',
  '📍': '[LOCATION]',
  '📋': '[CHECKLIST]',
  '💰': '[MONEY]',
  '→': '-',
  '✓': '*',
};

/**
 * Clean and format action items for PDF rendering
 * - Filters out empty items
 * - Replaces emojis with text equivalents
 * - Splits multi-line items into separate items
 * - Trims whitespace
 */
function cleanActionItems(items: string[]): string[] {
  const cleaned: string[] = [];

  for (const item of items) {
    if (!item || item.trim() === '') continue;

    // Replace emojis with text
    let cleanedItem = item;
    for (const [emoji, text] of Object.entries(emojiReplacements)) {
      cleanedItem = cleanedItem.split(emoji).join(text);
    }

    // Split by newlines and add each non-empty line
    const lines = cleanedItem.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        cleaned.push(trimmed);
      }
    }
  }

  return cleaned;
}

// Main Document Component
export const CoverageAnalysisReport: React.FC<PDFReportInput> = ({
  formData,
  recommendation,
  generatedAt = new Date(),
  fullReport = false,
}) => {
  // Calculate total pages based on fullReport flag
  const totalPages = fullReport ? 4 : 1;

  // Clean action items for rendering
  const cleanedActionItems = cleanActionItems(recommendation.actionItems);

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Document>
      {/* Page 1: Summary & Recommendation */}
      <Page size="A4" style={styles.page}>
        {/* Top accent bar */}
        <View style={styles.pageAccent} fixed />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Healthcare Coverage Analysis</Text>
              <Text style={styles.headerSubtitle}>
                Personalized Insurance Recommendation Report
              </Text>
            </View>
            <View>
              <Text style={styles.brandText}>Coverage Gap Analyzer</Text>
              <Text style={{ fontSize: 8, color: colors.gray[500] }}>
                {formatDate(generatedAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Primary Recommendation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Coverage</Text>
          <View style={styles.recommendationBox}>
            <View style={styles.scoreContainer}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreValue}>{recommendation.coverageGapScore}</Text>
                <Text style={styles.scoreLabel}>Match</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.primary, marginBottom: 3 }}>
                  {recommendation.recommendedInsurance}
                </Text>
                {recommendation.planType && (
                  <Text style={{ fontSize: 11, color: colors.gray[600], marginBottom: 2 }}>
                    {recommendation.planType}
                  </Text>
                )}
                <Text style={{ fontSize: 14, color: colors.accent, fontWeight: 'bold' }}>
                  {formatCurrency(recommendation.estimatedMonthlyCost.low)} - {formatCurrency(recommendation.estimatedMonthlyCost.high)}/month
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 10, color: colors.gray[700], lineHeight: 1.5 }}>
              {recommendation.reasoning}
            </Text>
          </View>
        </View>

        {/* Household Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Household Profile</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Adults</Text>
              <Text style={styles.value}>{formData.numAdults}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Children</Text>
              <Text style={styles.value}>{formData.numChildren}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Primary State</Text>
              <Text style={styles.value}>{formData.residences[0]?.state || 'N/A'}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Income Range</Text>
              <Text style={styles.value}>{formData.incomeRange || 'Not provided'}</Text>
            </View>
          </View>
          {formData.hasChronicConditions && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.label}>Health Considerations</Text>
              <Text style={styles.value}>
                {formData.chronicConditions.join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* Subsidy Analysis */}
        {recommendation.subsidyAnalysis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subsidy Analysis</Text>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Federal Poverty Level</Text>
                <Text style={styles.value}>{recommendation.subsidyAnalysis.fplPercentage}% FPL</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Estimated Monthly Subsidy</Text>
                <Text style={[styles.value, { color: colors.accent }]}>
                  {formatCurrency(recommendation.subsidyAnalysis.estimatedMonthlySubsidy)}
                </Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Medicaid Eligible</Text>
                <Text style={styles.value}>
                  {recommendation.subsidyAnalysis.medicaidEligible ? 'Yes' : 'No'}
                </Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>After-Subsidy Cost</Text>
                <Text style={styles.value}>
                  {formatCurrency(recommendation.subsidyAnalysis.estimatedAfterSubsidyCost.low)} - {formatCurrency(recommendation.subsidyAnalysis.estimatedAfterSubsidyCost.high)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Next Steps</Text>
          <View style={styles.highlight}>
            {cleanedActionItems.slice(0, 8).map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={[styles.bullet, { color: colors.secondary }]}>{index + 1}.</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
            {cleanedActionItems.length > 8 && (
              <Text style={{ fontSize: 9, color: colors.gray[500], marginTop: 5, fontStyle: 'italic' }}>
                + {cleanedActionItems.length - 8} more steps (see full report for details)
              </Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {formatDate(generatedAt)} | Coverage Gap Analyzer
          </Text>
          <Text style={styles.pageNumber}>Page 1 of {totalPages}</Text>
        </View>
      </Page>

      {/* Page 2: Cost Analysis & Projections (Full Report Only) */}
      {fullReport && (
      <Page size="A4" style={styles.page}>
        <View style={styles.pageAccent} fixed />
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Cost Analysis</Text>
              <Text style={styles.headerSubtitle}>Detailed Financial Breakdown</Text>
            </View>
            <Text style={styles.brandText}>Coverage Gap Analyzer</Text>
          </View>
        </View>

        {/* Cost Comparison */}
        {recommendation.costComparison && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cost Comparison</Text>
            <View style={styles.highlight}>
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>Current Monthly Cost</Text>
                  <Text style={[styles.value, { fontSize: 14 }]}>
                    {formatCurrency(recommendation.costComparison.current)}
                  </Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Recommended Plan Cost</Text>
                  <Text style={[styles.value, { fontSize: 14 }]}>
                    {formatCurrency(recommendation.costComparison.recommended.low)} - {formatCurrency(recommendation.costComparison.recommended.high)}
                  </Text>
                </View>
                {recommendation.costComparison.monthlySavings && (
                  <View style={styles.column}>
                    <Text style={styles.label}>Potential Monthly Savings</Text>
                    <Text style={[styles.value, { fontSize: 14, color: colors.accent }]}>
                      {formatCurrency(recommendation.costComparison.monthlySavings)}
                    </Text>
                  </View>
                )}
              </View>
              {recommendation.costComparison.annualSavings && (
                <View style={{ marginTop: 10, padding: 8, backgroundColor: '#dcfce7', borderRadius: 4 }}>
                  <Text style={{ fontSize: 11, color: '#166534', fontWeight: 'bold' }}>
                    Estimated Annual Savings: {formatCurrency(recommendation.costComparison.annualSavings)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Cost Projections Chart */}
        {recommendation.costProjections && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Multi-Year Cost Projections</Text>
            <View style={styles.chartContainer}>
              <BarChart
                data={recommendation.costProjections.yearlyProjections.slice(0, 5).map((proj) => ({
                  label: `Year ${proj.year}`,
                  value: proj.totalAnnualCost,
                  color: proj.hasTransition ? colors.warning : colors.secondary,
                }))}
                width={500}
                height={150}
              />
            </View>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Total Projected Cost (5 Years)</Text>
                <Text style={styles.value}>
                  {formatCurrency(recommendation.costProjections.totalProjectedCost)}
                </Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Average Annual Cost</Text>
                <Text style={styles.value}>
                  {formatCurrency(recommendation.costProjections.averageAnnualCost)}
                </Text>
              </View>
            </View>

            {/* Confidence Range */}
            <View style={{ marginTop: 15 }}>
              <Text style={[styles.label, { marginBottom: 5 }]}>Confidence Range</Text>
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={{ fontSize: 9, color: colors.accent }}>Optimistic (10th %ile)</Text>
                  <Text style={styles.value}>
                    {formatCurrency(recommendation.costProjections.confidenceRange.optimistic)}
                  </Text>
                </View>
                <View style={styles.column}>
                  <Text style={{ fontSize: 9, color: colors.secondary }}>Expected (50th %ile)</Text>
                  <Text style={styles.value}>
                    {formatCurrency(recommendation.costProjections.confidenceRange.expected)}
                  </Text>
                </View>
                <View style={styles.column}>
                  <Text style={{ fontSize: 9, color: colors.warning }}>Pessimistic (90th %ile)</Text>
                  <Text style={styles.value}>
                    {formatCurrency(recommendation.costProjections.confidenceRange.pessimistic)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Key Insights */}
            {recommendation.costProjections.insights.length > 0 && (
              <View style={{ marginTop: 15 }}>
                <Text style={[styles.label, { marginBottom: 5 }]}>Key Insights</Text>
                {recommendation.costProjections.insights.map((insight, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listText}>{insight}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Risk Analysis */}
        {recommendation.riskAnalysis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Risk Analysis</Text>
            <View style={styles.highlight}>
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>Risk Level</Text>
                  <View style={[
                    styles.badge,
                    recommendation.riskAnalysis.interpretation.riskLevel === 'low' ? styles.badgeSuccess :
                    recommendation.riskAnalysis.interpretation.riskLevel === 'moderate' ? styles.badgeWarning :
                    styles.badgeDanger,
                    { alignSelf: 'flex-start' }
                  ]}>
                    <Text>{recommendation.riskAnalysis.interpretation.riskLevel.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Expected OOP Cost</Text>
                  <Text style={styles.value}>
                    {formatCurrency(recommendation.riskAnalysis.result.median)}
                  </Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Worst Case (95th %ile)</Text>
                  <Text style={styles.value}>
                    {formatCurrency(recommendation.riskAnalysis.result.percentiles.p95)}
                  </Text>
                </View>
              </View>
              <Text style={{ marginTop: 10, fontSize: 10, color: colors.gray[700] }}>
                {recommendation.riskAnalysis.interpretation.summary}
              </Text>
            </View>

            {/* Probability Stats */}
            <View style={[styles.row, { marginTop: 10 }]}>
              <View style={styles.column}>
                <Text style={styles.label}>Chance of Exceeding Deductible</Text>
                <Text style={styles.value}>
                  {recommendation.riskAnalysis.result.probabilityOfExceedingDeductible.toFixed(1)}%
                </Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Chance of Hitting OOP Max</Text>
                <Text style={styles.value}>
                  {recommendation.riskAnalysis.result.probabilityOfHittingOOPMax.toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {formatDate(generatedAt)} | Coverage Gap Analyzer
          </Text>
          <Text style={styles.pageNumber}>Page 2 of {totalPages}</Text>
        </View>
      </Page>
      )}

      {/* Page 3: Alternative Options (Full Report Only) */}
      {fullReport && (
      <Page size="A4" style={styles.page}>
        <View style={styles.pageAccent} fixed />
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Alternative Options</Text>
              <Text style={styles.headerSubtitle}>Compare Your Coverage Choices</Text>
            </View>
            <Text style={styles.brandText}>Coverage Gap Analyzer</Text>
          </View>
        </View>

        {/* Alternative Options Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coverage Comparison</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Plan Type</Text>
              <Text style={styles.tableHeaderCell}>Monthly Cost</Text>
              <Text style={styles.tableHeaderCell}>Match Score</Text>
            </View>

            {/* Recommended Plan */}
            <View style={[styles.tableRow, { backgroundColor: '#eff6ff' }]}>
              <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>
                {recommendation.recommendedInsurance} (Recommended)
              </Text>
              <Text style={styles.tableCell}>
                {formatCurrency(recommendation.estimatedMonthlyCost.low)} - {formatCurrency(recommendation.estimatedMonthlyCost.high)}
              </Text>
              <Text style={[styles.tableCell, { color: colors.secondary }]}>
                {recommendation.coverageGapScore}%
              </Text>
            </View>

            {/* Alternative Options */}
            {recommendation.alternativeOptions.map((option, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{option.name}</Text>
                <Text style={styles.tableCell}>
                  {formatCurrency(option.monthlyCost.low)} - {formatCurrency(option.monthlyCost.high)}
                </Text>
                <Text style={styles.tableCell}>{option.coverageScore}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Detailed Alternative Analysis */}
        {recommendation.alternativeOptions.slice(0, 3).map((option, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{option.name}</Text>
            <View style={styles.row}>
              <View style={[styles.column, { marginRight: 15 }]}>
                <Text style={[styles.label, { color: colors.accent }]}>Advantages</Text>
                {option.pros.map((pro, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={[styles.bullet, { color: colors.accent }]}>+</Text>
                    <Text style={styles.listText}>{pro}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.column}>
                <Text style={[styles.label, { color: colors.danger }]}>Considerations</Text>
                {option.cons.map((con, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={[styles.bullet, { color: colors.danger }]}>-</Text>
                    <Text style={styles.listText}>{con}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {formatDate(generatedAt)} | Coverage Gap Analyzer
          </Text>
          <Text style={styles.pageNumber}>Page 3 of {totalPages}</Text>
        </View>
      </Page>
      )}

      {/* Page 4: Disclaimers & Resources (Full Report Only) */}
      {fullReport && (
      <Page size="A4" style={styles.page}>
        <View style={styles.pageAccent} fixed />
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Important Information</Text>
              <Text style={styles.headerSubtitle}>Disclaimers & Resources</Text>
            </View>
            <Text style={styles.brandText}>Coverage Gap Analyzer</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disclaimer</Text>
          <Text style={{ fontSize: 9, color: colors.gray[600], lineHeight: 1.6 }}>
            This report is for informational purposes only and does not constitute professional insurance,
            financial, or tax advice. The estimates and recommendations provided are based on the information
            you supplied and publicly available data. Actual costs, subsidies, and plan availability may vary.
            {'\n\n'}
            We strongly recommend consulting with a licensed insurance agent or healthcare navigator before
            making enrollment decisions. Premium tax credit estimates are approximate and subject to change
            based on final income and household size reported on your tax return.
            {'\n\n'}
            Coverage Gap Analyzer is not affiliated with any insurance company or government agency.
            Plan availability and pricing may vary by location and enrollment period.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Helpful Resources</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>
              HealthCare.gov - Official ACA Marketplace (healthcare.gov)
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>
              Medicare.gov - Official Medicare Information (medicare.gov)
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>
              Medicaid.gov - State Medicaid Programs (medicaid.gov)
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>
              IRS.gov - Premium Tax Credit Information (irs.gov/aca)
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Details</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Generated</Text>
              <Text style={styles.value}>{formatDate(generatedAt)}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Analysis Version</Text>
              <Text style={styles.value}>2.0.0</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Data Sources</Text>
              <Text style={styles.value}>CMS, IRS, State Medicaid</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {formatDate(generatedAt)} | Coverage Gap Analyzer
          </Text>
          <Text style={styles.pageNumber}>Page 4 of {totalPages}</Text>
        </View>
      </Page>
      )}
    </Document>
  );
};

export default CoverageAnalysisReport;
