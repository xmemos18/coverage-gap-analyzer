/**
 * RESULTS DATA ADAPTER
 *
 * This adapter converts the RecommendationResult data structure
 * into the props required by each component. Use this to easily
 * integrate your recommendation engine output with the UI components.
 */

import type {
  RecommendationResult,
  HeroCardProps,
  WhyThisRecommendationProps,
  ComparisonSectionProps,
  QuickComparisonTableProps,
  ShoppingTipsProps,
  CostBreakdownSectionProps,
  CTASectionProps,
} from '@/types/results';

// ============================================================================
// MAIN ADAPTER FUNCTION
// ============================================================================

export interface ResultsPageProps {
  heroCard: HeroCardProps;
  whyRecommendation: WhyThisRecommendationProps;
  comparisonSection: ComparisonSectionProps;
  quickComparison: QuickComparisonTableProps;
  shoppingTips: ShoppingTipsProps;
  costBreakdown: CostBreakdownSectionProps;
  ctaSection: CTASectionProps;
}

/**
 * Main adapter function - converts RecommendationResult to all component props
 */
export function adaptRecommendationData(
  result: RecommendationResult,
  isMobile: boolean = false
): ResultsPageProps {
  return {
    heroCard: adaptHeroCardData(result),
    whyRecommendation: adaptWhyRecommendationData(result, isMobile),
    comparisonSection: adaptComparisonData(result, isMobile),
    quickComparison: adaptQuickComparisonData(result, isMobile),
    shoppingTips: adaptShoppingTipsData(result, isMobile),
    costBreakdown: adaptCostBreakdownData(result),
    ctaSection: adaptCTAData(result, isMobile),
  };
}

// ============================================================================
// INDIVIDUAL ADAPTERS
// ============================================================================

/**
 * Adapt data for HeroCard component
 */
export function adaptHeroCardData(result: RecommendationResult): HeroCardProps {
  return {
    score: result.recommendation.coverageScore,
    planType: result.recommendation.planName,
    priceRange: result.recommendation.priceRange,
    eligibilityDescription: result.recommendation.eligibilityDescription,
  };
}

/**
 * Adapt data for WhyThisRecommendation component
 */
export function adaptWhyRecommendationData(
  result: RecommendationResult,
  isMobile: boolean = false
): WhyThisRecommendationProps {
  return {
    explanation: result.recommendation.explanation,
    features: result.recommendation.features,
    bestForDescription: result.recommendation.bestForDescription,
    isMobile,
  };
}

/**
 * Adapt data for ComparisonSection component
 */
export function adaptComparisonData(
  result: RecommendationResult,
  isMobile: boolean = false
): ComparisonSectionProps {
  return {
    title: result.comparisonData.title,
    subtitle: result.comparisonData.subtitle,
    options: result.comparisonData.options,
    isMobile,
  };
}

/**
 * Adapt data for QuickComparisonTable component
 */
export function adaptQuickComparisonData(
  result: RecommendationResult,
  isMobile: boolean = false
): QuickComparisonTableProps {
  return {
    primaryOption: result.quickComparisonData.primaryOption,
    alternativeOption: result.quickComparisonData.alternativeOption,
    features: result.quickComparisonData.features,
    recommendation: result.quickComparisonData.recommendation,
    isMobile,
  };
}

/**
 * Adapt data for ShoppingTips component
 */
export function adaptShoppingTipsData(
  result: RecommendationResult,
  isMobile: boolean = false
): ShoppingTipsProps {
  return {
    tips: result.shoppingTips,
    insuranceType: result.recommendation.type,
    isMobile,
  };
}

/**
 * Adapt data for CostBreakdownSection component
 */
export function adaptCostBreakdownData(result: RecommendationResult): CostBreakdownSectionProps {
  return {
    insuranceType: result.costBreakdown.insuranceType,
    costs: result.costBreakdown.costs,
    userBudget: result.costBreakdown.userBudget,
  };
}

/**
 * Adapt data for CTASection component
 */
export function adaptCTAData(
  result: RecommendationResult,
  isMobile: boolean = false
): CTASectionProps {
  return {
    insuranceType: result.ctaData.insuranceType,
    userState: result.ctaData.userState,
    primaryCTA: result.ctaData.primaryCTA,
    secondaryCTAs: result.ctaData.secondaryCTAs,
    enrollmentWarning: result.ctaData.enrollmentWarning,
    isMobile,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user is on mobile device
 */
export function detectMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * Format enrollment period dates
 */
export function formatEnrollmentPeriod(result: RecommendationResult): string {
  const { enrollmentPeriod } = result.ctaData;
  if (!enrollmentPeriod) return '';

  const { type, dates, message } = enrollmentPeriod;

  if (dates) {
    const startDate = new Date(dates.start).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const endDate = new Date(dates.end).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    return `${type}: ${startDate} - ${endDate}. ${message}`;
  }

  return `${type}: ${message}`;
}

/**
 * Calculate days until enrollment deadline
 */
export function getDaysUntilDeadline(result: RecommendationResult): number | null {
  const { enrollmentPeriod } = result.ctaData;
  if (!enrollmentPeriod?.dates?.end) return null;

  const endDate = new Date(enrollmentPeriod.dates.end);
  const today = new Date();
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

/**
 * Check if enrollment is currently open
 */
export function isEnrollmentOpen(result: RecommendationResult): boolean {
  const { enrollmentPeriod } = result.ctaData;
  if (!enrollmentPeriod?.dates) return true; // Year-round enrollment

  const today = new Date();
  const startDate = new Date(enrollmentPeriod.dates.start);
  const endDate = new Date(enrollmentPeriod.dates.end);

  return today >= startDate && today <= endDate;
}

/**
 * Get urgency level based on days until deadline
 */
export function getEnrollmentUrgency(result: RecommendationResult): 'high' | 'medium' | 'low' | null {
  const daysLeft = getDaysUntilDeadline(result);
  if (daysLeft === null) return null;

  if (daysLeft <= 7) return 'high';
  if (daysLeft <= 30) return 'medium';
  return 'low';
}

/**
 * Get total estimated cost (monthly)
 */
export function getTotalMonthlyCost(result: RecommendationResult): { min: number; max: number } {
  const { costs } = result.costBreakdown;
  return costs.reduce(
    (acc, cost) => ({
      min: acc.min + cost.amount.min,
      max: acc.max + cost.amount.max,
    }),
    { min: 0, max: 0 }
  );
}

/**
 * Check if recommendation is within user budget
 */
export function isWithinBudget(result: RecommendationResult): boolean | null {
  const { userBudget } = result.costBreakdown;
  if (!userBudget) return null;

  const totalCost = getTotalMonthlyCost(result);
  return totalCost.max <= userBudget.max;
}

/**
 * Calculate budget difference
 */
export function getBudgetDifference(result: RecommendationResult): number | null {
  const { userBudget } = result.costBreakdown;
  if (!userBudget) return null;

  const totalCost = getTotalMonthlyCost(result);
  return totalCost.max - userBudget.max;
}

/**
 * Get subsidy eligibility message
 */
export function getSubsidyMessage(result: RecommendationResult): string | null {
  const { recommendation } = result;
  if (!recommendation.subsidyEligible) return null;

  const { type, subsidyAmount } = recommendation;

  if (type === 'ACA Marketplace' && subsidyAmount) {
    const savings = `$${subsidyAmount.min}-$${subsidyAmount.max}`;
    return `You may qualify for premium tax credits of ${savings}/month, significantly reducing your costs.`;
  }

  if (type === 'Medicaid') {
    return 'Medicaid provides comprehensive coverage at little to no cost. Most services have $0-$4 copays.';
  }

  return null;
}

/**
 * Generate shareable summary text
 */
export function generateShareableSummary(result: RecommendationResult): string {
  const { recommendation, user } = result;

  const costText =
    typeof recommendation.priceRange === 'string'
      ? recommendation.priceRange
      : `$${recommendation.priceRange.min}-$${recommendation.priceRange.max}/month`;

  return `My health insurance recommendation: ${recommendation.planName} (Score: ${recommendation.coverageScore}/100). Estimated cost: ${costText}. Analyzed by Coverage Gap Analyzer for ${user.state} residents.`;
}

/**
 * Generate email body for sharing results
 */
export function generateEmailBody(result: RecommendationResult): string {
  const { recommendation } = result;
  const summary = generateShareableSummary(result);

  return encodeURIComponent(`${summary}

Key Benefits:
${recommendation.features.map((f) => `• ${f.text}`).join('\n')}

Best for: ${recommendation.bestForDescription}

Learn more at: ${window.location.href}
`);
}

/**
 * Export results as JSON
 */
export function exportResultsAsJSON(result: RecommendationResult): void {
  const dataStr = JSON.stringify(result, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `insurance-recommendation-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Print-friendly formatting
 */
export function preparePrintView(): void {
  // Add print-specific styles
  const printStyles = `
    @media print {
      .no-print { display: none !important; }
      .print-break { page-break-before: always; }
      body { font-size: 12pt; }
      h1 { font-size: 24pt; }
      h2 { font-size: 18pt; }
      h3 { font-size: 14pt; }
    }
  `;

  const styleSheet = document.createElement('style');
  styleSheet.textContent = printStyles;
  document.head.appendChild(styleSheet);

  window.print();
}
