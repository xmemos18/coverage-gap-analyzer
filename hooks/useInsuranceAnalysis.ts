/**
 * Custom hook for insurance analysis
 * Handles recommendation calculations and related analyses
 */

import { useMemo } from 'react';
import { CalculatorFormData, InsuranceRecommendation } from '@/types';
import { analyzeInsurance } from '@/lib/calculator';
import { analyzeMedicareAdvantageFit, getMedicareAdvantageShoppingTips, compareToMedigap } from '@/lib/calculator/medicareAdvantageHelper';
import { analyzeCOBRA, getCOBRADecisionFlowchart } from '@/lib/calculator/cobraHelper';
import { calculateHSABenefits, getHSAStrategies } from '@/lib/calculator/hsaCalculator';

interface UseInsuranceAnalysisProps {
  formData: CalculatorFormData;
  adultAges: number[];
  numAdults: number;
  numChildren: number;
  residenceStates: string[];
  hasEmployerInsurance: boolean;
  currentMonthlyCost: number;
  employerContribution: number;
  hasChronicConditions: boolean;
  prescriptionCount: string;
  incomeRange: string;
  hasRequiredData: boolean;
}

export function useInsuranceAnalysis({
  formData,
  adultAges,
  numAdults,
  numChildren,
  residenceStates,
  hasEmployerInsurance,
  currentMonthlyCost,
  employerContribution,
  hasChronicConditions,
  prescriptionCount,
  incomeRange,
  hasRequiredData,
}: UseInsuranceAnalysisProps) {

  // Main recommendation
  const recommendation = useMemo(() => {
    if (!hasRequiredData) return null;
    return analyzeInsurance(formData);
  }, [formData, hasRequiredData]);

  // Medicare Advantage analysis (for Medicare-eligible users)
  const medicareAdvantageAnalysis = useMemo(() => {
    if (!hasRequiredData || !recommendation) return null;

    const hasMedicareEligibleAdults = adultAges.some(age => age >= 65);
    if (!hasMedicareEligibleAdults) return null;

    return {
      analysis: analyzeMedicareAdvantageFit(formData, residenceStates),
      shoppingTips: getMedicareAdvantageShoppingTips(residenceStates),
      comparison: compareToMedigap(adultAges.filter(age => age >= 65).length, residenceStates.length > 1)
    };
  }, [formData, recommendation, adultAges, residenceStates, hasRequiredData]);

  // COBRA analysis (for users with employer insurance)
  const cobraAnalysis = useMemo(() => {
    if (!hasRequiredData || !recommendation || !hasEmployerInsurance) return null;

    const estimatedCurrentCost = currentMonthlyCost > 0
      ? currentMonthlyCost
      : (employerContribution > 0 ? employerContribution * 0.3 : 400);

    const monthsSinceJobLoss = 6; // Assume 6 months for educational purposes

    return {
      analysis: analyzeCOBRA(
        estimatedCurrentCost,
        monthsSinceJobLoss,
        hasChronicConditions,
        recommendation.estimatedMonthlyCost
      ),
      flowchart: getCOBRADecisionFlowchart()
    };
  }, [hasRequiredData, recommendation, hasEmployerInsurance, currentMonthlyCost, employerContribution, hasChronicConditions]);

  // HSA analysis (for users who might benefit from HDHP plans)
  const hsaAnalysis = useMemo(() => {
    if (!hasRequiredData || !recommendation) return null;

    const hasMedicareEligibleAdults = adultAges.some(age => age >= 65);
    if (hasMedicareEligibleAdults) return null;

    const isLowUtilization = !hasChronicConditions && (!prescriptionCount || prescriptionCount === 'none' || prescriptionCount === '1-3');

    const recommendsHDHP = recommendation.recommendedInsurance.toLowerCase().includes('hdhp') ||
                           recommendation.reasoning.toLowerCase().includes('hdhp') ||
                           recommendation.reasoning.toLowerCase().includes('high-deductible');

    if (!isLowUtilization && !recommendsHDHP) return null;

    const incomeEstimate = (() => {
      switch(incomeRange) {
        case 'under-30k': return 25000;
        case '30k-60k': return 45000;
        case '60k-90k': return 75000;
        case '90k-120k': return 105000;
        case 'over-120k': return 150000;
        default: return 60000;
      }
    })();

    const familySize = numAdults + numChildren;
    const oldestAge = adultAges.length > 0 ? Math.max(...adultAges) : 40;

    const stateForTax = residenceStates[0] || '';
    const stateTaxRate = (() => {
      if (['FL', 'TX', 'NV', 'WA', 'WY', 'SD', 'TN', 'AK', 'NH'].includes(stateForTax)) return 0;
      if (['CA', 'NY', 'NJ', 'OR', 'MN', 'HI'].includes(stateForTax)) return 0.08;
      if (['MA', 'CT', 'ME', 'VT', 'RI', 'IL'].includes(stateForTax)) return 0.05;
      return 0.04;
    })();

    return {
      analysis: calculateHSABenefits(familySize, oldestAge, incomeEstimate, stateTaxRate),
      strategies: getHSAStrategies()
    };
  }, [hasRequiredData, recommendation, adultAges, numAdults, numChildren, incomeRange, residenceStates, hasChronicConditions, prescriptionCount]);

  return {
    recommendation,
    medicareAdvantageAnalysis,
    cobraAnalysis,
    hsaAnalysis,
  };
}
