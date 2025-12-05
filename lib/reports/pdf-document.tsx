/**
 * PDF Document Components
 *
 * React-PDF components for generating professional coverage analysis reports
 * that mirror the results page with a clickable Table of Contents.
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
  Svg,
  Circle,
} from '@react-pdf/renderer';
import type { InsuranceRecommendation, CalculatorFormData } from '@/types';

// Color palette matching the web app
const colors = {
  primary: '#1e3a5f',
  secondary: '#2563eb',
  accent: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  lightBlue: '#eff6ff',
  lightGreen: '#dcfce7',
  lightYellow: '#fef3c7',
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
  // Page styles
  page: {
    padding: 40,
    paddingTop: 50,
    paddingBottom: 60,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  pageAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: colors.primary,
  },

  // Header styles
  header: {
    marginBottom: 25,
    borderBottom: `2px solid ${colors.primary}`,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.gray[600],
  },
  brandText: {
    fontSize: 9,
    color: colors.secondary,
    fontWeight: 'bold',
  },

  // Section styles
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: `1px solid ${colors.gray[200]}`,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.gray[600],
    marginBottom: 8,
  },

  // Card styles
  card: {
    backgroundColor: colors.gray[50],
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  recommendationCard: {
    backgroundColor: colors.lightBlue,
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    borderLeft: `4px solid ${colors.secondary}`,
  },
  alertCard: {
    backgroundColor: colors.lightYellow,
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    borderLeft: `4px solid ${colors.warning}`,
  },
  successCard: {
    backgroundColor: colors.lightGreen,
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    borderLeft: `4px solid ${colors.accent}`,
  },

  // Score circle
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreCircleWrapper: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  scoreText: {
    position: 'absolute',
    top: 18,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  scoreLabel: {
    fontSize: 7,
    color: colors.gray[600],
    textTransform: 'uppercase',
  },

  // Grid and layout
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  column: {
    flex: 1,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 15,
  },

  // Text styles
  label: {
    fontSize: 9,
    color: colors.gray[500],
    marginBottom: 2,
  },
  value: {
    fontSize: 11,
    color: colors.gray[800],
  },
  boldValue: {
    fontSize: 11,
    color: colors.gray[800],
    fontWeight: 'bold',
  },
  largeValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },
  costValue: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: 'bold',
  },

  // List styles
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 5,
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
    lineHeight: 1.4,
  },
  numberedItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 5,
  },
  numberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  numberText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },

  // Table styles
  table: {
    marginTop: 8,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: `1px solid ${colors.gray[200]}`,
    backgroundColor: '#ffffff',
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: `1px solid ${colors.gray[200]}`,
    backgroundColor: colors.gray[50],
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    color: colors.gray[700],
  },

  // Badge styles
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeSuccess: {
    backgroundColor: colors.lightGreen,
  },
  badgeWarning: {
    backgroundColor: colors.lightYellow,
  },
  badgePrimary: {
    backgroundColor: colors.lightBlue,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  badgeTextSuccess: {
    color: '#166534',
  },
  badgeTextWarning: {
    color: '#92400e',
  },
  badgeTextPrimary: {
    color: colors.secondary,
  },

  // TOC styles
  tocPage: {
    padding: 50,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  tocTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 30,
    textAlign: 'center',
  },
  tocSubtitle: {
    fontSize: 12,
    color: colors.gray[600],
    marginBottom: 40,
    textAlign: 'center',
  },
  tocSection: {
    marginBottom: 20,
  },
  tocSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.gray[500],
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tocItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 4,
    backgroundColor: colors.gray[50],
    borderRadius: 4,
  },
  tocLink: {
    fontSize: 11,
    color: colors.secondary,
    textDecoration: 'none',
  },
  tocPageNum: {
    fontSize: 10,
    color: colors.gray[500],
  },
  tocDivider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 15,
  },

  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: `1px solid ${colors.gray[200]}`,
    paddingTop: 10,
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

  // Pros/Cons styles
  prosConsContainer: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  prosColumn: {
    flex: 1,
    backgroundColor: colors.lightGreen,
    padding: 10,
    borderRadius: 6,
  },
  consColumn: {
    flex: 1,
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 6,
  },
  prosConsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  prosTitle: {
    color: '#166534',
  },
  consTitle: {
    color: '#991b1b',
  },
  prosItem: {
    fontSize: 9,
    color: '#166534',
    marginBottom: 3,
  },
  consItem: {
    fontSize: 9,
    color: '#991b1b',
    marginBottom: 3,
  },

  // Comparison card
  comparisonCard: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  comparisonCardRecommended: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    backgroundColor: colors.lightBlue,
    borderWidth: 2,
    borderColor: colors.secondary,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  statBox: {
    width: '30%',
    padding: 10,
    backgroundColor: colors.gray[50],
    borderRadius: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 8,
    color: colors.gray[500],
  },
});

// Score Circle Component
const ScoreCircle: React.FC<{ score: number; size?: number }> = ({ score, size = 60 }) => {
  const getColor = (s: number) => {
    if (s >= 80) return colors.accent;
    if (s >= 60) return colors.secondary;
    if (s >= 40) return colors.warning;
    return colors.danger;
  };

  const color = getColor(score);
  const radius = (size / 2) - 4;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.gray[200]}
          strokeWidth={4}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={4}
          fill="none"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[styles.scoreText, { top: size / 2 - 12 }]}>
        <Text style={[styles.scoreValue, { color }]}>{score}</Text>
        <Text style={styles.scoreLabel}>Score</Text>
      </View>
    </View>
  );
};

// Report Input Types
export interface PDFReportInput {
  formData: CalculatorFormData;
  recommendation: InsuranceRecommendation;
  generatedAt?: Date;
  fullReport?: boolean;
}

// Emoji replacements for PDF
const emojiReplacements: Record<string, string> = {
  '⏰': '',
  '💊': '',
  '🏥': '',
  '🔥': '',
  '📊': '',
  '📍': '',
  '📋': '',
  '💰': '',
  '→': '-',
  '✓': '*',
  '✅': '*',
  '⚠️': '!',
  '❌': 'x',
};

function cleanText(text: string): string {
  let cleaned = text;
  for (const [emoji, replacement] of Object.entries(emojiReplacements)) {
    cleaned = cleaned.split(emoji).join(replacement);
  }
  return cleaned.trim();
}

function cleanActionItems(items: string[]): string[] {
  const cleaned: string[] = [];
  for (const item of items) {
    if (!item || item.trim() === '') continue;
    const lines = cleanText(item).split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && trimmed.length > 2) {
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
  fullReport = true,
}) => {
  const cleanedActionItems = cleanActionItems(recommendation.actionItems);

  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const householdSummary = `${formData.numAdults} adult${formData.numAdults !== 1 ? 's' : ''}${
    formData.numChildren > 0 ? `, ${formData.numChildren} child${formData.numChildren !== 1 ? 'ren' : ''}` : ''
  }`;

  const primaryState = formData.residences[0]?.state || 'N/A';

  // Define TOC items
  const tocItems = [
    { title: 'Your Coverage Recommendation', page: 2, anchor: 'recommendation' },
    { title: 'Why This Recommendation', page: 2, anchor: 'why' },
    { title: 'Cost Analysis', page: 3, anchor: 'costs' },
    { title: 'Compare Your Options', page: 4, anchor: 'alternatives' },
    { title: 'Next Steps', page: 5, anchor: 'nextsteps' },
    { title: 'Important Information', page: 6, anchor: 'disclaimer' },
  ];

  return (
    <Document>
      {/* Page 1: Table of Contents */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageAccent} fixed />

        <View style={{ marginTop: 40, marginBottom: 30, alignItems: 'center' }}>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.primary, marginBottom: 8 }}>
            Coverage Analysis Report
          </Text>
          <Text style={{ fontSize: 12, color: colors.gray[600], marginBottom: 4 }}>
            Personalized Health Insurance Recommendations
          </Text>
          <Text style={{ fontSize: 10, color: colors.gray[500] }}>
            Generated {formatDate(generatedAt)}
          </Text>
        </View>

        <View style={{ backgroundColor: colors.lightBlue, padding: 20, borderRadius: 8, marginBottom: 30 }}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Prepared For</Text>
              <Text style={styles.boldValue}>{householdSummary}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Primary Location</Text>
              <Text style={styles.boldValue}>{primaryState}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Coverage Score</Text>
              <Text style={[styles.boldValue, { color: colors.accent }]}>{recommendation.coverageGapScore}/100</Text>
            </View>
          </View>
        </View>

        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: 20 }}>
          Table of Contents
        </Text>

        {tocItems.map((item, index) => (
          <Link key={index} src={`#${item.anchor}`} style={{ textDecoration: 'none' }}>
            <View style={styles.tocItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.numberBadge, { width: 22, height: 22, marginRight: 12 }]}>
                  <Text style={{ fontSize: 10, color: '#ffffff', fontWeight: 'bold' }}>{index + 1}</Text>
                </View>
                <Text style={styles.tocLink}>{item.title}</Text>
              </View>
              <Text style={{ fontSize: 10, color: colors.gray[400] }}>Page {item.page}</Text>
            </View>
          </Link>
        ))}

        <View style={{ marginTop: 30, padding: 15, backgroundColor: colors.gray[50], borderRadius: 6 }}>
          <Text style={{ fontSize: 9, color: colors.gray[600], lineHeight: 1.5 }}>
            This report provides personalized health insurance recommendations based on the information you provided.
            Click any section above to jump directly to that content. All estimates are for informational purposes only.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Coverage Gap Analyzer | {formatDate(generatedAt)}</Text>
          <Text style={styles.pageNumber}>Page 1</Text>
        </View>
      </Page>

      {/* Page 2: Recommendation */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageAccent} fixed />

        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Your Coverage Recommendation</Text>
              <Text style={styles.headerSubtitle}>Personalized for your household</Text>
            </View>
            <Text style={styles.brandText}>Coverage Gap Analyzer</Text>
          </View>
        </View>

        {/* Main Recommendation Card */}
        <View style={styles.recommendationCard} id="recommendation">
          <View style={styles.scoreContainer}>
            <ScoreCircle score={recommendation.coverageGapScore} size={65} />
            <View style={{ flex: 1 }}>
              <View style={[styles.badge, styles.badgeSuccess, { marginBottom: 5 }]}>
                <Text style={[styles.badgeText, styles.badgeTextSuccess]}>RECOMMENDED FOR YOU</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.primary, marginBottom: 3 }}>
                {recommendation.recommendedInsurance}
              </Text>
              {recommendation.planType && (
                <Text style={{ fontSize: 10, color: colors.gray[600], marginBottom: 3 }}>
                  {recommendation.planType}
                </Text>
              )}
              <Text style={styles.costValue}>
                {formatCurrency(recommendation.estimatedMonthlyCost.low)} - {formatCurrency(recommendation.estimatedMonthlyCost.high)}/month
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Household</Text>
              <Text style={styles.value}>{householdSummary}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Location</Text>
              <Text style={styles.value}>{primaryState} {formData.residences[0]?.zip}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Budget Range</Text>
              <Text style={styles.value}>{formData.budget.replace('-', ' - $').replace('plus', '+')}</Text>
            </View>
          </View>
        </View>

        {/* Why This Recommendation */}
        <View style={styles.section} id="why">
          <Text style={styles.sectionTitle}>Why This Recommendation</Text>
          <View style={styles.card}>
            <Text style={{ fontSize: 10, color: colors.gray[700], lineHeight: 1.5, marginBottom: 10 }}>
              {cleanText(recommendation.reasoning)}
            </Text>
          </View>
        </View>

        {/* Household Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Household Profile</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formData.numAdults}</Text>
              <Text style={styles.statLabel}>Adults</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formData.numChildren}</Text>
              <Text style={styles.statLabel}>Children</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formData.residences.length}</Text>
              <Text style={styles.statLabel}>Residences</Text>
            </View>
          </View>

          {formData.adultAges.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.label}>Adult Ages</Text>
              <Text style={styles.value}>{formData.adultAges.join(', ')} years old</Text>
            </View>
          )}

          {formData.hasChronicConditions && formData.chronicConditions.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.label}>Health Considerations</Text>
              <Text style={styles.value}>{formData.chronicConditions.join(', ')}</Text>
            </View>
          )}
        </View>

        {/* Subsidy Analysis */}
        {recommendation.subsidyAnalysis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subsidy Analysis</Text>
            <View style={styles.successCard}>
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>Federal Poverty Level</Text>
                  <Text style={styles.boldValue}>{recommendation.subsidyAnalysis.fplPercentage}% FPL</Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Estimated Monthly Subsidy</Text>
                  <Text style={[styles.boldValue, { color: colors.accent }]}>
                    {formatCurrency(recommendation.subsidyAnalysis.estimatedMonthlySubsidy)}
                  </Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>After-Subsidy Cost</Text>
                  <Text style={styles.boldValue}>
                    {formatCurrency(recommendation.subsidyAnalysis.estimatedAfterSubsidyCost.low)} - {formatCurrency(recommendation.subsidyAnalysis.estimatedAfterSubsidyCost.high)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Coverage Gap Analyzer | {formatDate(generatedAt)}</Text>
          <Text style={styles.pageNumber}>Page 2</Text>
        </View>
      </Page>

      {/* Page 3: Cost Analysis */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageAccent} fixed />

        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Cost Analysis</Text>
              <Text style={styles.headerSubtitle}>Detailed financial breakdown</Text>
            </View>
            <Text style={styles.brandText}>Coverage Gap Analyzer</Text>
          </View>
        </View>

        <View id="costs">
          {/* Cost Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cost Summary</Text>
            <View style={styles.recommendationCard}>
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>Estimated Monthly Cost</Text>
                  <Text style={styles.largeValue}>
                    {formatCurrency(recommendation.estimatedMonthlyCost.low)} - {formatCurrency(recommendation.estimatedMonthlyCost.high)}
                  </Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Estimated Annual Cost</Text>
                  <Text style={styles.largeValue}>
                    {formatCurrency(recommendation.estimatedMonthlyCost.low * 12)} - {formatCurrency(recommendation.estimatedMonthlyCost.high * 12)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Cost Comparison */}
          {recommendation.costComparison && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cost Comparison</Text>
              <View style={{ flexDirection: 'row', gap: 15 }}>
                <View style={styles.comparisonCard}>
                  <Text style={styles.label}>Current Monthly Cost</Text>
                  <Text style={styles.largeValue}>{formatCurrency(recommendation.costComparison.current)}</Text>
                </View>
                <View style={styles.comparisonCardRecommended}>
                  <Text style={styles.label}>Recommended Plan Cost</Text>
                  <Text style={[styles.largeValue, { color: colors.accent }]}>
                    {formatCurrency(recommendation.costComparison.recommended.low)} - {formatCurrency(recommendation.costComparison.recommended.high)}
                  </Text>
                </View>
              </View>

              {recommendation.costComparison.annualSavings && recommendation.costComparison.annualSavings > 0 && (
                <View style={[styles.successCard, { marginTop: 12 }]}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#166534' }}>
                    Potential Annual Savings: {formatCurrency(recommendation.costComparison.annualSavings)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Cost Projections */}
          {recommendation.costProjections && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5-Year Cost Projections</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderCell}>Year</Text>
                  <Text style={styles.tableHeaderCell}>Monthly Cost</Text>
                  <Text style={styles.tableHeaderCell}>Annual Cost</Text>
                  <Text style={styles.tableHeaderCell}>Notes</Text>
                </View>
                {recommendation.costProjections.yearlyProjections.slice(0, 5).map((proj, index) => (
                  <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                    <Text style={styles.tableCell}>Year {proj.year}</Text>
                    <Text style={styles.tableCell}>{formatCurrency(Math.round(proj.totalAnnualCost / 12))}</Text>
                    <Text style={styles.tableCell}>{formatCurrency(proj.totalAnnualCost)}</Text>
                    <Text style={styles.tableCell}>{proj.hasTransition ? 'Transition Year' : '-'}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.card, { marginTop: 10 }]}>
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.label}>Total 5-Year Cost</Text>
                    <Text style={styles.boldValue}>{formatCurrency(recommendation.costProjections.totalProjectedCost)}</Text>
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.label}>Average Annual Cost</Text>
                    <Text style={styles.boldValue}>{formatCurrency(recommendation.costProjections.averageAnnualCost)}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Risk Analysis */}
          {recommendation.riskAnalysis && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Risk Analysis</Text>
              <View style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.label}>Risk Level</Text>
                    <View style={[
                      styles.badge,
                      recommendation.riskAnalysis.interpretation.riskLevel === 'low' ? styles.badgeSuccess :
                      recommendation.riskAnalysis.interpretation.riskLevel === 'moderate' ? styles.badgeWarning :
                      { backgroundColor: '#fee2e2' }
                    ]}>
                      <Text style={[
                        styles.badgeText,
                        recommendation.riskAnalysis.interpretation.riskLevel === 'low' ? styles.badgeTextSuccess :
                        recommendation.riskAnalysis.interpretation.riskLevel === 'moderate' ? styles.badgeTextWarning :
                        { color: '#991b1b' }
                      ]}>
                        {recommendation.riskAnalysis.interpretation.riskLevel.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.label}>Expected Out-of-Pocket</Text>
                    <Text style={styles.boldValue}>{formatCurrency(recommendation.riskAnalysis.result.median)}</Text>
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.label}>Worst Case (95th %ile)</Text>
                    <Text style={styles.boldValue}>{formatCurrency(recommendation.riskAnalysis.result.percentiles.p95)}</Text>
                  </View>
                </View>
                <Text style={{ marginTop: 10, fontSize: 9, color: colors.gray[600], lineHeight: 1.4 }}>
                  {recommendation.riskAnalysis.interpretation.summary}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Coverage Gap Analyzer | {formatDate(generatedAt)}</Text>
          <Text style={styles.pageNumber}>Page 3</Text>
        </View>
      </Page>

      {/* Page 4: Alternatives */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageAccent} fixed />

        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Compare Your Options</Text>
              <Text style={styles.headerSubtitle}>Alternative coverage choices</Text>
            </View>
            <Text style={styles.brandText}>Coverage Gap Analyzer</Text>
          </View>
        </View>

        <View id="alternatives">
          {/* Comparison Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Coverage Comparison</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Plan Type</Text>
                <Text style={styles.tableHeaderCell}>Monthly Cost</Text>
                <Text style={styles.tableHeaderCell}>Match Score</Text>
              </View>

              {/* Recommended */}
              <View style={[styles.tableRow, { backgroundColor: colors.lightBlue }]}>
                <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>
                  {recommendation.recommendedInsurance} (Recommended)
                </Text>
                <Text style={styles.tableCell}>
                  {formatCurrency(recommendation.estimatedMonthlyCost.low)} - {formatCurrency(recommendation.estimatedMonthlyCost.high)}
                </Text>
                <Text style={[styles.tableCell, { color: colors.accent, fontWeight: 'bold' }]}>
                  {recommendation.coverageGapScore}%
                </Text>
              </View>

              {/* Alternatives */}
              {recommendation.alternativeOptions.slice(0, 5).map((option, index) => (
                <View key={index} style={index % 2 === 0 ? styles.tableRowAlt : styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{option.name}</Text>
                  <Text style={styles.tableCell}>
                    {formatCurrency(option.monthlyCost.low)} - {formatCurrency(option.monthlyCost.high)}
                  </Text>
                  <Text style={styles.tableCell}>{option.coverageScore}%</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Detailed Alternatives */}
          {recommendation.alternativeOptions.slice(0, 3).map((option, index) => (
            <View key={index} style={styles.section}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.primary, marginBottom: 8 }}>
                Alternative {index + 1}: {option.name}
              </Text>
              <View style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.label}>Monthly Cost</Text>
                    <Text style={styles.boldValue}>
                      {formatCurrency(option.monthlyCost.low)} - {formatCurrency(option.monthlyCost.high)}
                    </Text>
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.label}>Coverage Score</Text>
                    <Text style={styles.boldValue}>{option.coverageScore}%</Text>
                  </View>
                </View>

                <View style={styles.prosConsContainer}>
                  <View style={styles.prosColumn}>
                    <Text style={[styles.prosConsTitle, styles.prosTitle]}>Advantages</Text>
                    {option.pros.slice(0, 3).map((pro, i) => (
                      <Text key={i} style={styles.prosItem}>+ {cleanText(pro)}</Text>
                    ))}
                  </View>
                  <View style={styles.consColumn}>
                    <Text style={[styles.prosConsTitle, styles.consTitle]}>Considerations</Text>
                    {option.cons.slice(0, 3).map((con, i) => (
                      <Text key={i} style={styles.consItem}>- {cleanText(con)}</Text>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Coverage Gap Analyzer | {formatDate(generatedAt)}</Text>
          <Text style={styles.pageNumber}>Page 4</Text>
        </View>
      </Page>

      {/* Page 5: Next Steps */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageAccent} fixed />

        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Next Steps</Text>
              <Text style={styles.headerSubtitle}>Your action plan</Text>
            </View>
            <Text style={styles.brandText}>Coverage Gap Analyzer</Text>
          </View>
        </View>

        <View id="nextsteps">
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended Actions</Text>
            {cleanedActionItems.slice(0, 12).map((item, index) => (
              <View key={index} style={styles.numberedItem}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>{index + 1}</Text>
                </View>
                <Text style={[styles.listText, { flex: 1 }]}>{item}</Text>
              </View>
            ))}

            {cleanedActionItems.length > 12 && (
              <View style={[styles.card, { marginTop: 10 }]}>
                <Text style={{ fontSize: 9, color: colors.gray[600], fontStyle: 'italic' }}>
                  + {cleanedActionItems.length - 12} additional action items. Visit our website for the complete list.
                </Text>
              </View>
            )}
          </View>

          {/* Enrollment Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Important Enrollment Information</Text>
            <View style={styles.alertCard}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.warning, marginBottom: 5 }}>
                Open Enrollment Period
              </Text>
              <Text style={{ fontSize: 9, color: colors.gray[700], lineHeight: 1.4 }}>
                Most marketplace plans require enrollment during the annual Open Enrollment Period (November 1 - January 15).
                Qualifying life events (job loss, marriage, move, birth) may allow Special Enrollment outside this window.
              </Text>
            </View>
          </View>

          {/* Key Tips */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shopping Tips</Text>
            <View style={styles.card}>
              {[
                'Compare total cost of care, not just monthly premiums',
                'Verify your preferred doctors and hospitals are in-network',
                'Check prescription drug coverage and formulary tiers',
                'Consider your expected healthcare usage for the year',
                'Review deductibles and out-of-pocket maximums',
              ].map((tip, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Coverage Gap Analyzer | {formatDate(generatedAt)}</Text>
          <Text style={styles.pageNumber}>Page 5</Text>
        </View>
      </Page>

      {/* Page 6: Disclaimer */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageAccent} fixed />

        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Important Information</Text>
              <Text style={styles.headerSubtitle}>Disclaimers & resources</Text>
            </View>
            <Text style={styles.brandText}>Coverage Gap Analyzer</Text>
          </View>
        </View>

        <View id="disclaimer">
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Disclaimer</Text>
            <View style={styles.alertCard}>
              <Text style={{ fontSize: 9, color: colors.gray[700], lineHeight: 1.6 }}>
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
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Sources</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.boldValue}>CMS Data</Text>
                  <Text style={styles.label}>Centers for Medicare & Medicaid Services</Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.boldValue}>Healthcare.gov</Text>
                  <Text style={styles.label}>Federal Marketplace Data</Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.boldValue}>IRS Guidelines</Text>
                  <Text style={styles.label}>Premium Tax Credit Rules</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Helpful Resources</Text>
            <View style={styles.card}>
              {[
                { name: 'HealthCare.gov', desc: 'Official ACA Marketplace' },
                { name: 'Medicare.gov', desc: 'Official Medicare Information' },
                { name: 'Medicaid.gov', desc: 'State Medicaid Programs' },
                { name: 'IRS.gov/aca', desc: 'Premium Tax Credit Information' },
              ].map((resource, index) => (
                <View key={index} style={[styles.listItem, { marginBottom: 6 }]}>
                  <Text style={styles.bullet}>•</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.boldValue}>{resource.name}</Text>
                    <Text style={styles.label}>{resource.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Report Details</Text>
            <View style={styles.card}>
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
                  <Text style={styles.label}>Report Type</Text>
                  <Text style={styles.value}>{fullReport ? 'Complete Analysis' : 'Summary'}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 20, padding: 15, backgroundColor: colors.gray[50], borderRadius: 6 }}>
            <Text style={{ fontSize: 10, color: colors.gray[600], textAlign: 'center', lineHeight: 1.5 }}>
              Thank you for using Coverage Gap Analyzer.{'\n'}
              For questions or feedback, visit our website.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Coverage Gap Analyzer | {formatDate(generatedAt)}</Text>
          <Text style={styles.pageNumber}>Page 6</Text>
        </View>
      </Page>
    </Document>
  );
};

export default CoverageAnalysisReport;
