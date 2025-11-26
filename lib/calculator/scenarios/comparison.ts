/**
 * Scenario Comparison Module
 *
 * Compares two healthcare scenarios side-by-side to help users
 * understand the impact of different coverage choices or circumstances.
 */

import { CalculatorFormData, InsuranceRecommendation } from '@/types';
import { analyzeInsurance } from '../index';

// Types for scenario comparison
export interface Scenario {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description of what this scenario represents */
  description: string;
  /** Form data for this scenario */
  formData: CalculatorFormData;
}

export interface ScenarioDifference {
  /** Field that differs */
  field: string;
  /** Human-readable label */
  label: string;
  /** Value in scenario 1 */
  scenario1Value: string | number;
  /** Value in scenario 2 */
  scenario2Value: string | number;
  /** Type of change */
  changeType: 'increase' | 'decrease' | 'change';
}

export interface CostComparison {
  /** Monthly premium difference */
  monthlyPremiumDiff: {
    low: number;
    high: number;
    averageDiff: number;
  };
  /** Annual cost difference */
  annualCostDiff: {
    low: number;
    high: number;
  };
  /** Which scenario is cheaper */
  cheaperScenario: '1' | '2' | 'equal';
  /** Potential annual savings */
  potentialAnnualSavings: number;
}

export interface RiskComparison {
  /** Difference in coverage gap scores */
  coverageScoreDiff: number;
  /** Which scenario has better coverage */
  betterCoverageScenario: '1' | '2' | 'equal';
  /** Key risk differences */
  riskNotes: string[];
}

export interface ScenarioComparisonResult {
  /** First scenario with analysis */
  scenario1: {
    scenario: Scenario;
    recommendation: InsuranceRecommendation;
  };
  /** Second scenario with analysis */
  scenario2: {
    scenario: Scenario;
    recommendation: InsuranceRecommendation;
  };
  /** Key differences between scenarios */
  differences: ScenarioDifference[];
  /** Cost comparison */
  costComparison: CostComparison;
  /** Risk comparison */
  riskComparison: RiskComparison;
  /** Summary insights */
  insights: string[];
  /** Recommendation on which scenario is better */
  recommendation: string;
}

/**
 * Compare two scenarios and provide detailed analysis
 */
export async function compareScenarios(
  scenario1: Scenario,
  scenario2: Scenario
): Promise<ScenarioComparisonResult> {
  // Analyze both scenarios in parallel
  const [rec1, rec2] = await Promise.all([
    analyzeInsurance(scenario1.formData),
    analyzeInsurance(scenario2.formData),
  ]);

  // Find differences in form data
  const differences = findDifferences(scenario1.formData, scenario2.formData);

  // Calculate cost comparison
  const costComparison = calculateCostComparison(rec1, rec2);

  // Calculate risk comparison
  const riskComparison = calculateRiskComparison(rec1, rec2, differences);

  // Generate insights
  const insights = generateInsights(differences, costComparison, riskComparison, scenario1, scenario2);

  // Generate recommendation
  const recommendation = generateRecommendation(costComparison, riskComparison, scenario1, scenario2);

  return {
    scenario1: { scenario: scenario1, recommendation: rec1 },
    scenario2: { scenario: scenario2, recommendation: rec2 },
    differences,
    costComparison,
    riskComparison,
    insights,
    recommendation,
  };
}

/**
 * Find differences between two form data objects
 */
function findDifferences(
  form1: CalculatorFormData,
  form2: CalculatorFormData
): ScenarioDifference[] {
  const differences: ScenarioDifference[] = [];

  // Compare key fields
  const fieldMappings: Array<{
    field: keyof CalculatorFormData;
    label: string;
    formatter?: (value: unknown) => string | number;
  }> = [
    { field: 'numAdults', label: 'Number of Adults' },
    { field: 'numChildren', label: 'Number of Children' },
    { field: 'budget', label: 'Budget', formatter: formatBudget },
    { field: 'incomeRange', label: 'Income Range', formatter: formatIncome },
    { field: 'hasEmployerInsurance', label: 'Employer Insurance', formatter: formatBoolean },
    { field: 'employerContribution', label: 'Employer Contribution', formatter: formatCurrency },
    { field: 'hasChronicConditions', label: 'Chronic Conditions', formatter: formatBoolean },
    { field: 'doctorVisitsPerYear', label: 'Doctor Visits', formatter: formatVisits },
    { field: 'specialistVisitsPerYear', label: 'Specialist Visits', formatter: formatSpecialistVisits },
    { field: 'erVisitsPerYear', label: 'ER Visits', formatter: formatERVisits },
    { field: 'plannedProcedures', label: 'Planned Procedures', formatter: formatBoolean },
    { field: 'takesSpecialtyMeds', label: 'Specialty Medications', formatter: formatBoolean },
    { field: 'monthlyMedicationCost', label: 'Monthly Medication Cost', formatter: formatMedCost },
    { field: 'financialPriority', label: 'Financial Priority', formatter: formatPriority },
  ];

  for (const { field, label, formatter } of fieldMappings) {
    const val1 = form1[field];
    const val2 = form2[field];

    if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      const formattedVal1 = formatter ? formatter(val1) : String(val1);
      const formattedVal2 = formatter ? formatter(val2) : String(val2);

      const changeType = determineChangeType(field, val1, val2);

      differences.push({
        field,
        label,
        scenario1Value: formattedVal1,
        scenario2Value: formattedVal2,
        changeType,
      });
    }
  }

  // Compare ages
  const avgAge1 = form1.adultAges.length > 0
    ? form1.adultAges.reduce((a, b) => a + b, 0) / form1.adultAges.length
    : 0;
  const avgAge2 = form2.adultAges.length > 0
    ? form2.adultAges.reduce((a, b) => a + b, 0) / form2.adultAges.length
    : 0;

  if (Math.abs(avgAge1 - avgAge2) > 1) {
    differences.push({
      field: 'adultAges',
      label: 'Average Age',
      scenario1Value: Math.round(avgAge1),
      scenario2Value: Math.round(avgAge2),
      changeType: avgAge2 > avgAge1 ? 'increase' : 'decrease',
    });
  }

  // Compare states
  const states1 = form1.residences.map(r => r.state).filter(Boolean).join(', ');
  const states2 = form2.residences.map(r => r.state).filter(Boolean).join(', ');

  if (states1 !== states2) {
    differences.push({
      field: 'residences',
      label: 'States',
      scenario1Value: states1 || 'Not specified',
      scenario2Value: states2 || 'Not specified',
      changeType: 'change',
    });
  }

  return differences;
}

/**
 * Calculate cost comparison between scenarios
 */
function calculateCostComparison(
  rec1: InsuranceRecommendation,
  rec2: InsuranceRecommendation
): CostComparison {
  const cost1 = rec1.estimatedMonthlyCost;
  const cost2 = rec2.estimatedMonthlyCost;

  const lowDiff = cost2.low - cost1.low;
  const highDiff = cost2.high - cost1.high;
  const avgDiff = ((cost2.low + cost2.high) / 2) - ((cost1.low + cost1.high) / 2);

  const avg1 = (cost1.low + cost1.high) / 2;
  const avg2 = (cost2.low + cost2.high) / 2;

  let cheaperScenario: '1' | '2' | 'equal';
  if (Math.abs(avgDiff) < 10) {
    cheaperScenario = 'equal';
  } else {
    cheaperScenario = avgDiff > 0 ? '1' : '2';
  }

  return {
    monthlyPremiumDiff: {
      low: lowDiff,
      high: highDiff,
      averageDiff: Math.round(avgDiff),
    },
    annualCostDiff: {
      low: lowDiff * 12,
      high: highDiff * 12,
    },
    cheaperScenario,
    potentialAnnualSavings: Math.round(Math.abs(avg1 - avg2) * 12),
  };
}

/**
 * Calculate risk comparison between scenarios
 */
function calculateRiskComparison(
  rec1: InsuranceRecommendation,
  rec2: InsuranceRecommendation,
  differences: ScenarioDifference[]
): RiskComparison {
  const scoreDiff = rec2.coverageGapScore - rec1.coverageGapScore;
  const riskNotes: string[] = [];

  let betterCoverageScenario: '1' | '2' | 'equal';
  if (Math.abs(scoreDiff) < 5) {
    betterCoverageScenario = 'equal';
  } else {
    betterCoverageScenario = scoreDiff > 0 ? '2' : '1';
  }

  // Generate risk notes based on differences
  const hasChronicDiff = differences.find(d => d.field === 'hasChronicConditions');
  if (hasChronicDiff) {
    if (hasChronicDiff.scenario2Value === 'Yes') {
      riskNotes.push('Chronic conditions increase healthcare utilization risk');
    }
  }

  const hasErDiff = differences.find(d => d.field === 'erVisitsPerYear');
  if (hasErDiff) {
    riskNotes.push('ER visit frequency significantly impacts out-of-pocket costs');
  }

  const hasSpecialtyMedsDiff = differences.find(d => d.field === 'takesSpecialtyMeds');
  if (hasSpecialtyMedsDiff) {
    riskNotes.push('Specialty medications often drive high annual healthcare costs');
  }

  const hasAgeDiff = differences.find(d => d.field === 'adultAges');
  if (hasAgeDiff) {
    riskNotes.push('Age affects premium costs due to ACA age-rating curves');
  }

  return {
    coverageScoreDiff: scoreDiff,
    betterCoverageScenario,
    riskNotes,
  };
}

/**
 * Generate insights from the comparison
 */
function generateInsights(
  differences: ScenarioDifference[],
  costComparison: CostComparison,
  riskComparison: RiskComparison,
  scenario1: Scenario,
  scenario2: Scenario
): string[] {
  const insights: string[] = [];

  // Cost insights
  if (costComparison.cheaperScenario !== 'equal') {
    const cheaperName = costComparison.cheaperScenario === '1' ? scenario1.name : scenario2.name;
    insights.push(
      `${cheaperName} could save you approximately $${costComparison.potentialAnnualSavings.toLocaleString()} per year`
    );
  }

  // Coverage insights
  if (riskComparison.betterCoverageScenario !== 'equal') {
    const betterName = riskComparison.betterCoverageScenario === '1' ? scenario1.name : scenario2.name;
    insights.push(
      `${betterName} provides ${Math.abs(riskComparison.coverageScoreDiff)} points higher coverage score`
    );
  }

  // Specific difference insights
  const incomeDiff = differences.find(d => d.field === 'incomeRange');
  if (incomeDiff) {
    insights.push('Income level affects subsidy eligibility and out-of-pocket costs');
  }

  const employerDiff = differences.find(d => d.field === 'hasEmployerInsurance');
  if (employerDiff) {
    insights.push('Employer insurance can significantly reduce premium costs');
  }

  // Add risk notes as insights
  insights.push(...riskComparison.riskNotes);

  return insights;
}

/**
 * Generate overall recommendation
 */
function generateRecommendation(
  costComparison: CostComparison,
  riskComparison: RiskComparison,
  scenario1: Scenario,
  scenario2: Scenario
): string {
  // Weight cost vs coverage
  const costScore1 = costComparison.cheaperScenario === '1' ? 1 : costComparison.cheaperScenario === '2' ? -1 : 0;
  const coverageScore1 = riskComparison.betterCoverageScenario === '1' ? 1 : riskComparison.betterCoverageScenario === '2' ? -1 : 0;

  const totalScore1 = costScore1 + coverageScore1;

  if (totalScore1 > 0) {
    return `Based on both cost and coverage analysis, "${scenario1.name}" appears to be the better option. It offers ${costComparison.cheaperScenario === '1' ? 'lower costs' : 'better value'} for your situation.`;
  } else if (totalScore1 < 0) {
    return `Based on both cost and coverage analysis, "${scenario2.name}" appears to be the better option. It offers ${costComparison.cheaperScenario === '2' ? 'lower costs' : 'better value'} for your situation.`;
  } else {
    // Check if there's a clear winner on one dimension
    if (costComparison.cheaperScenario !== 'equal') {
      const cheaperName = costComparison.cheaperScenario === '1' ? scenario1.name : scenario2.name;
      return `Both scenarios offer similar value, but "${cheaperName}" has lower costs. Consider your risk tolerance when choosing.`;
    }
    return 'Both scenarios offer similar costs and coverage. Your choice should depend on personal preferences and specific plan features.';
  }
}

// Helper formatters
function formatBudget(value: unknown): string {
  const budgetMap: Record<string, string> = {
    'under-200': 'Under $200/month',
    '200-400': '$200-400/month',
    '400-600': '$400-600/month',
    '600-800': '$600-800/month',
    '800-1000': '$800-1000/month',
    'over-1000': 'Over $1000/month',
    'no-limit': 'No limit',
  };
  return budgetMap[String(value)] || String(value);
}

function formatIncome(value: unknown): string {
  const incomeMap: Record<string, string> = {
    'under-25k': 'Under $25,000',
    '25k-40k': '$25,000-$40,000',
    '40k-60k': '$40,000-$60,000',
    '60k-80k': '$60,000-$80,000',
    '80k-100k': '$80,000-$100,000',
    '100k-150k': '$100,000-$150,000',
    'over-150k': 'Over $150,000',
  };
  return incomeMap[String(value)] || String(value);
}

function formatBoolean(value: unknown): string {
  return value === true ? 'Yes' : 'No';
}

function formatCurrency(value: unknown): string {
  const num = Number(value);
  return isNaN(num) ? String(value) : `$${num.toLocaleString()}`;
}

function formatVisits(value: unknown): string {
  const visitMap: Record<string, string> = {
    '0-2': '0-2 visits',
    '3-5': '3-5 visits',
    '6-10': '6-10 visits',
    '10+': '10+ visits',
  };
  return visitMap[String(value)] || String(value) || 'Not specified';
}

function formatSpecialistVisits(value: unknown): string {
  const visitMap: Record<string, string> = {
    'none': 'None',
    '1-3': '1-3 visits',
    'monthly-or-more': 'Monthly or more',
  };
  return visitMap[String(value)] || String(value) || 'Not specified';
}

function formatERVisits(value: unknown): string {
  const visitMap: Record<string, string> = {
    'none': 'None',
    '1-2': '1-2 visits',
    '3+': '3+ visits',
  };
  return visitMap[String(value)] || String(value) || 'Not specified';
}

function formatMedCost(value: unknown): string {
  const costMap: Record<string, string> = {
    'under-50': 'Under $50',
    '50-200': '$50-$200',
    '200-500': '$200-$500',
    '500-1000': '$500-$1,000',
    'over-1000': 'Over $1,000',
  };
  return costMap[String(value)] || String(value) || 'Not specified';
}

function formatPriority(value: unknown): string {
  const priorityMap: Record<string, string> = {
    'lowest-premium': 'Lowest Premium',
    'lowest-deductible': 'Lowest Deductible',
    'lowest-oop-max': 'Lowest Out-of-Pocket Max',
    'balanced': 'Balanced',
  };
  return priorityMap[String(value)] || String(value) || 'Not specified';
}

function determineChangeType(
  field: string,
  val1: unknown,
  val2: unknown
): 'increase' | 'decrease' | 'change' {
  const numericFields = ['numAdults', 'numChildren', 'employerContribution'];
  if (numericFields.includes(field)) {
    const n1 = Number(val1);
    const n2 = Number(val2);
    if (!isNaN(n1) && !isNaN(n2)) {
      return n2 > n1 ? 'increase' : n2 < n1 ? 'decrease' : 'change';
    }
  }
  return 'change';
}

/**
 * Create a modified scenario from base data
 */
export function createScenario(
  id: string,
  name: string,
  description: string,
  baseFormData: CalculatorFormData,
  modifications: Partial<CalculatorFormData> = {}
): Scenario {
  return {
    id,
    name,
    description,
    formData: { ...baseFormData, ...modifications },
  };
}

/**
 * Generate common comparison scenarios
 */
export function generateCommonScenarios(
  baseFormData: CalculatorFormData
): { baseline: Scenario; alternatives: Scenario[] } {
  const baseline = createScenario(
    'baseline',
    'Current Situation',
    'Your current healthcare needs and circumstances',
    baseFormData
  );

  const alternatives: Scenario[] = [];

  // Higher healthcare utilization scenario
  alternatives.push(createScenario(
    'high-utilization',
    'Higher Healthcare Needs',
    'What if you had more doctor visits and healthcare needs?',
    baseFormData,
    {
      doctorVisitsPerYear: '6-10',
      specialistVisitsPerYear: '1-3',
      hasChronicConditions: true,
    }
  ));

  // Lower income scenario (if not already low)
  if (baseFormData.incomeRange && !baseFormData.incomeRange.includes('under')) {
    alternatives.push(createScenario(
      'lower-income',
      'Lower Income',
      'How would costs change with lower income (potentially more subsidies)?',
      baseFormData,
      {
        incomeRange: '40k-60k',
      }
    ));
  }

  // With employer insurance scenario
  if (!baseFormData.hasEmployerInsurance) {
    alternatives.push(createScenario(
      'with-employer',
      'With Employer Insurance',
      'What if you had access to employer-sponsored coverage?',
      baseFormData,
      {
        hasEmployerInsurance: true,
        employerContribution: 300,
      }
    ));
  }

  // Major procedure scenario
  if (!baseFormData.plannedProcedures) {
    alternatives.push(createScenario(
      'planned-procedure',
      'Planned Major Procedure',
      'What if you needed a major surgery or procedure?',
      baseFormData,
      {
        plannedProcedures: true,
        erVisitsPerYear: '1-2',
      }
    ));
  }

  return { baseline, alternatives };
}
