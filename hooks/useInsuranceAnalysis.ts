/**
 * Custom hook for insurance analysis
 * Handles recommendation calculations and related analyses
 */

import { useMemo, useState, useEffect } from 'react';
import { CalculatorFormData, InsuranceRecommendation } from '@/types';
import { analyzeInsurance } from '@/lib/calculator';
import { analyzeMedicareAdvantageFit, getMedicareAdvantageShoppingTips, compareToMedigap } from '@/lib/calculator/medicareAdvantageHelper';
import { analyzeCOBRA, getCOBRADecisionFlowchart } from '@/lib/calculator/cobraHelper';
import { calculateHSABenefits, getHSAStrategies } from '@/lib/calculator/hsaCalculator';
import { getEffectiveIncome } from '@/lib/medicalCostConstants';
import { logger } from '@/lib/logger';

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
  annualIncome?: number | null;
  incomeRange?: string;
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
  annualIncome,
  incomeRange,
  hasRequiredData,
}: UseInsuranceAnalysisProps) {

  // Main recommendation (now async)
  const [recommendation, setRecommendation] = useState<InsuranceRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!hasRequiredData) {
      setRecommendation(null);
      return;
    }

    let cancelled = false;

    const fetchRecommendation = async () => {
      setIsLoading(true);
      try {
        const result = await analyzeInsurance(formData);
        if (!cancelled) {
          setRecommendation(result);
        }
      } catch (error) {
        logger.error('Error analyzing insurance:', error);
        if (!cancelled) {
          setRecommendation(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchRecommendation().catch(err => {
      // Additional safety catch for any errors not caught above
      if (!cancelled) {
        logger.error('Uncaught error in fetchRecommendation:', err);
      }
    });

    return () => {
      cancelled = true;
    };
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
  }, [hasRequiredData, recommendation, formData, adultAges, residenceStates]);

  // COBRA analysis (for users with employer insurance)
  const cobraAnalysis = useMemo(() => {
    if (!hasRequiredData || !recommendation || !hasEmployerInsurance) return null;

    // Constants for COBRA analysis
    const EMPLOYER_COST_MULTIPLIER = 0.3; // Employee typically pays ~30% of total cost
    const DEFAULT_EMPLOYER_COST = 400; // Average fallback monthly cost
    const ASSUMED_MONTHS_SINCE_JOB_LOSS = 6; // Default assumption for educational purposes

    const estimatedCurrentCost = currentMonthlyCost > 0
      ? currentMonthlyCost
      : (employerContribution > 0 ? employerContribution * EMPLOYER_COST_MULTIPLIER : DEFAULT_EMPLOYER_COST);

    const monthsSinceJobLoss = ASSUMED_MONTHS_SINCE_JOB_LOSS;

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

    // Use exact income if available, otherwise fall back to range midpoint
    const incomeEstimate = getEffectiveIncome(annualIncome, incomeRange);

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
  }, [hasRequiredData, recommendation, adultAges, numAdults, numChildren, annualIncome, incomeRange, residenceStates, hasChronicConditions, prescriptionCount]);

  return {
    recommendation,
    isLoading,
    medicareAdvantageAnalysis,
    cobraAnalysis,
    hsaAnalysis,
  };
}
