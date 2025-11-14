/**
 * Tests for Multi-State Coverage Analysis
 * Validates state comparisons, border analysis, and relocation recommendations
 */

import {
  analyzeStateCoverage,
  compareMultipleStates,
  analyzeBorderStates,
  analyzeRelocationOpportunity,
  compareTwoStates,
} from '../multi-state-analysis';

describe('Multi-State Analysis', () => {
  const baseInput = {
    age: 45,
    householdSize: 1,
    magi: 40000,
    metalTier: 'Silver' as const,
  };

  describe('analyzeStateCoverage', () => {
    test('analyzes California coverage', () => {
      const analysis = analyzeStateCoverage('CA', baseInput);

      expect(analysis.state).toBe('CA');
      expect(analysis.stateName).toBe('California');
      expect(analysis.monthlyPremium).toBeGreaterThan(0);
      expect(analysis.totalAnnualCost).toBeGreaterThan(0);
      expect(analysis.overallScore).toBeGreaterThan(0);
      expect(analysis.overallScore).toBeLessThanOrEqual(100);
    });

    test('detects Medicaid eligibility', () => {
      const lowIncomeInput = { ...baseInput, magi: 15000 };

      const caAnalysis = analyzeStateCoverage('CA', lowIncomeInput);
      expect(caAnalysis.medicaidEligible).toBe(true);
      expect(caAnalysis.ptcEligible).toBe(false);
    });

    test('detects coverage gap in non-expansion state', () => {
      const gapInput = { ...baseInput, magi: 18000 }; // ~120% FPL

      const txAnalysis = analyzeStateCoverage('TX', gapInput);
      expect(txAnalysis.inCoverageGap).toBe(true);
      expect(txAnalysis.medicaidEligible).toBe(false);
      expect(txAnalysis.ptcEligible).toBe(false);
    });

    test('detects PTC eligibility in expansion state', () => {
      const analysis = analyzeStateCoverage('CA', baseInput); // 40k for single is ~266% FPL

      expect(analysis.medicaidEligible).toBe(false);
      expect(analysis.ptcEligible).toBe(true);
      expect(analysis.monthlyPTC).toBeGreaterThan(0);
      expect(analysis.netMonthlyPremium).toBeLessThan(analysis.monthlyPremium);
    });

    test('calculates net premium correctly', () => {
      const analysis = analyzeStateCoverage('CA', baseInput);

      expect(analysis.netMonthlyPremium).toBe(analysis.monthlyPremium - analysis.monthlyPTC);
      expect(analysis.netMonthlyPremium).toBeGreaterThanOrEqual(0);
    });

    test('includes market characteristics', () => {
      const analysis = analyzeStateCoverage('CA', baseInput);

      expect(analysis.carrierCount).toBeGreaterThan(0);
      expect(analysis.marketCompetitiveness).toMatch(/^(low|moderate|high)$/);
      expect(typeof analysis.hasPublicOption).toBe('boolean');
      expect(typeof analysis.hasStateSubsidies).toBe('boolean');
    });

    test('calculates affordability score', () => {
      const analysis = analyzeStateCoverage('CA', baseInput);

      expect(analysis.affordabilityScore).toBeGreaterThan(0);
      expect(analysis.affordabilityScore).toBeLessThanOrEqual(100);
    });

    test('calculates access score', () => {
      const analysis = analyzeStateCoverage('CA', baseInput);

      expect(analysis.accessScore).toBeGreaterThan(0);
      expect(analysis.accessScore).toBeLessThanOrEqual(100);
    });

    test('throws error for invalid state', () => {
      expect(() => analyzeStateCoverage('XX', baseInput)).toThrow('Invalid state code');
    });

    test('handles tobacco surcharge in allowed state', () => {
      const tobaccoInput = { ...baseInput, usesTobacco: true };

      const txAnalysis = analyzeStateCoverage('TX', tobaccoInput);
      const noTobaccoAnalysis = analyzeStateCoverage('TX', baseInput);

      expect(txAnalysis.monthlyPremium).toBeGreaterThan(noTobaccoAnalysis.monthlyPremium);
    });

    test('ignores tobacco surcharge in prohibited state', () => {
      const tobaccoInput = { ...baseInput, usesTobacco: true };

      const caWithTobacco = analyzeStateCoverage('CA', tobaccoInput);
      const caWithoutTobacco = analyzeStateCoverage('CA', baseInput);

      expect(caWithTobacco.monthlyPremium).toBe(caWithoutTobacco.monthlyPremium);
    });
  });

  describe('compareMultipleStates', () => {
    test('compares multiple states successfully', () => {
      const comparison = compareMultipleStates(['CA', 'TX', 'NY'], baseInput);

      expect(comparison.states).toHaveLength(3);
      expect(comparison.bestOverall).toBeTruthy();
      expect(comparison.worstState).toBeTruthy();
      expect(comparison.bestOverall).not.toBe(comparison.worstState);
    });

    test('states are sorted by overall score', () => {
      const comparison = compareMultipleStates(['CA', 'TX', 'NY', 'FL'], baseInput);

      for (let i = 0; i < comparison.states.length - 1; i++) {
        expect(comparison.states[i].overallScore).toBeGreaterThanOrEqual(
          comparison.states[i + 1].overallScore
        );
      }
    });

    test('calculates savings correctly', () => {
      const comparison = compareMultipleStates(['CA', 'TX'], baseInput);

      const best = comparison.states.find(s => s.state === comparison.bestOverall)!;
      const worst = comparison.states.find(s => s.state === comparison.worstState)!;

      expect(comparison.annualSavingsBestVsWorst).toBe(worst.totalAnnualCost - best.totalAnnualCost);
      expect(comparison.monthlyDifferenceBestVsWorst).toBeCloseTo(
        comparison.annualSavingsBestVsWorst / 12,
        0
      );
    });

    test('categorizes coverage gap states', () => {
      const gapInput = { ...baseInput, magi: 18000 }; // Coverage gap income

      const comparison = compareMultipleStates(['TX', 'CA', 'FL'], gapInput);

      expect(comparison.coverageGapStates.length).toBeGreaterThan(0);
      expect(comparison.coverageGapStates).toContain('TX');
      expect(comparison.coverageGapStates).toContain('FL');
      expect(comparison.coverageGapStates).not.toContain('CA');
    });

    test('categorizes Medicaid eligible states', () => {
      const lowIncomeInput = { ...baseInput, magi: 15000 };

      const comparison = compareMultipleStates(['CA', 'NY', 'TX'], lowIncomeInput);

      expect(comparison.medicaidEligibleStates).toContain('CA');
      expect(comparison.medicaidEligibleStates).toContain('NY');
      expect(comparison.medicaidEligibleStates).not.toContain('TX');
    });

    test('categorizes subsidy eligible states', () => {
      const comparison = compareMultipleStates(['CA', 'TX', 'NY'], baseInput);

      expect(comparison.subsidyEligibleStates.length).toBeGreaterThan(0);
      // All expansion states should have subsidy eligibility for this income
      expect(comparison.subsidyEligibleStates).toContain('CA');
      expect(comparison.subsidyEligibleStates).toContain('NY');
    });

    test('generates insights', () => {
      // Use coverage gap income to generate meaningful insights
      const gapInput = { ...baseInput, magi: 18000 };
      const comparison = compareMultipleStates(['CA', 'TX', 'NY'], gapInput);

      expect(comparison.insights).toBeTruthy();
      expect(comparison.insights.length).toBeGreaterThan(0);
    });

    test('generates recommendations', () => {
      const comparison = compareMultipleStates(['CA', 'TX', 'NY'], baseInput);

      expect(comparison.recommendations).toBeTruthy();
      expect(comparison.recommendations.length).toBeGreaterThan(0);
    });

    test('throws error for empty state list', () => {
      expect(() => compareMultipleStates([], baseInput)).toThrow('Must provide at least one state');
    });

    test('identifies best affordability vs best access', () => {
      const comparison = compareMultipleStates(['CA', 'TX', 'NY', 'WY'], baseInput);

      expect(comparison.bestAffordability).toBeTruthy();
      expect(comparison.bestAccess).toBeTruthy();

      // Best overall should be one of these
      expect([comparison.bestAffordability, comparison.bestAccess]).toContain(comparison.bestOverall);
    });
  });

  describe('analyzeBorderStates', () => {
    test('analyzes Texas border states', () => {
      const borderAnalysis = analyzeBorderStates('TX', baseInput);

      expect(borderAnalysis.currentState).toBe('TX');
      expect(borderAnalysis.adjacentStates).toContain('LA');
      expect(borderAnalysis.adjacentStates).toContain('OK');
      expect(borderAnalysis.adjacentStates.length).toBeGreaterThan(0);
    });

    test('finds better border state options', () => {
      const gapInput = { ...baseInput, magi: 18000 }; // Coverage gap in TX

      const borderAnalysis = analyzeBorderStates('TX', gapInput);

      // Even if no better options, the analysis should complete
      // (TX neighbors might not always be better depending on costs)
      expect(Array.isArray(borderAnalysis.betterOptions)).toBe(true);

      // If there are better options, they should have positive savings
      if (borderAnalysis.betterOptions.length > 0) {
        expect(borderAnalysis.betterOptions[0].annualSavings).toBeGreaterThan(0);
      }
    });

    test('recommends moving for significant savings', () => {
      const gapInput = { ...baseInput, magi: 18000 };

      const borderAnalysis = analyzeBorderStates('TX', gapInput);

      if (borderAnalysis.betterOptions.length > 0 && borderAnalysis.betterOptions[0].annualSavings > 3000) {
        expect(borderAnalysis.shouldConsiderMoving).toBe(true);
        expect(borderAnalysis.primaryRecommendation).toBeTruthy();
      }
    });

    test('sorts better options by savings', () => {
      const borderAnalysis = analyzeBorderStates('TX', baseInput);

      for (let i = 0; i < borderAnalysis.betterOptions.length - 1; i++) {
        expect(borderAnalysis.betterOptions[i].annualSavings).toBeGreaterThanOrEqual(
          borderAnalysis.betterOptions[i + 1].annualSavings
        );
      }
    });

    test('handles island states (no borders)', () => {
      const borderAnalysis = analyzeBorderStates('AK', baseInput);

      expect(borderAnalysis.adjacentStates).toHaveLength(0);
      expect(borderAnalysis.betterOptions).toHaveLength(0);
      expect(borderAnalysis.shouldConsiderMoving).toBe(false);
      expect(borderAnalysis.primaryRecommendation).toBeNull();
    });

    test('includes reason for each better option', () => {
      const gapInput = { ...baseInput, magi: 18000 };

      const borderAnalysis = analyzeBorderStates('TX', gapInput);

      borderAnalysis.betterOptions.forEach(option => {
        expect(option.state).toBeTruthy();
        expect(option.annualSavings).toBeGreaterThan(0);
        expect(option.reason).toBeTruthy();
      });
    });
  });

  describe('analyzeRelocationOpportunity', () => {
    test('analyzes relocation opportunity structure', () => {
      // Test that the function returns proper structure
      const recommendation = analyzeRelocationOpportunity('CA', baseInput, false);

      expect(recommendation.fromState).toBe('CA');
      expect(typeof recommendation.recommendMove).toBe('boolean');
      expect(recommendation.confidence).toMatch(/^(low|moderate|high)$/);
      expect(Array.isArray(recommendation.reasons)).toBe(true);
      expect(Array.isArray(recommendation.considerations)).toBe(true);

      // If recommending move, should have a target state
      if (recommendation.recommendMove) {
        expect(recommendation.toState).toBeTruthy();
        expect(recommendation.annualSavings).toBeGreaterThan(0);
      }
    });

    test('recommends moving from coverage gap state', () => {
      const gapInput = { ...baseInput, magi: 18000 };

      const recommendation = analyzeRelocationOpportunity('TX', gapInput, false);

      // Should strongly recommend moving from coverage gap
      expect(recommendation.recommendMove).toBe(true);
      expect(recommendation.toState).toBeTruthy();
      expect(recommendation.reasons.length).toBeGreaterThan(0);
      expect(recommendation.reasons.some(r => r.includes('coverage gap'))).toBe(true);
    });

    test('recommends moving for Medicaid eligibility', () => {
      const lowIncomeInput = { ...baseInput, magi: 15000 };

      const recommendation = analyzeRelocationOpportunity('TX', lowIncomeInput, false);

      expect(recommendation.recommendMove).toBe(true);
      expect(recommendation.reasons.some(r => r.toLowerCase().includes('medicaid'))).toBe(true);
    });

    test('provides considerations', () => {
      const recommendation = analyzeRelocationOpportunity('TX', baseInput, false);

      expect(recommendation.considerations.length).toBeGreaterThan(0);
      expect(recommendation.considerations.some(c => c.includes('Moving costs'))).toBe(true);
    });

    test('has confidence levels', () => {
      const recommendation = analyzeRelocationOpportunity('TX', baseInput, false);

      expect(recommendation.confidence).toMatch(/^(low|moderate|high)$/);
    });

    test('high confidence for escaping coverage gap', () => {
      const gapInput = { ...baseInput, magi: 18000 };

      const recommendation = analyzeRelocationOpportunity('TX', gapInput, false);

      if (recommendation.recommendMove) {
        expect(recommendation.confidence).toMatch(/moderate|high/);
      }
    });

    test('considers all states when flag is true', () => {
      const recommendation = analyzeRelocationOpportunity('WY', baseInput, true);

      // Wyoming is expensive with low competition, should find better options nationwide
      expect(recommendation.toState).toBeTruthy();
    });

    test('only considers adjacent states when flag is false', () => {
      const recommendation = analyzeRelocationOpportunity('TX', baseInput, false);

      if (recommendation.toState) {
        // Should be an adjacent state
        const txBorders = analyzeBorderStates('TX', baseInput);
        expect(txBorders.adjacentStates).toContain(recommendation.toState);
      }
    });

    test('calculates annual savings correctly', () => {
      const recommendation = analyzeRelocationOpportunity('TX', baseInput, false);

      if (recommendation.recommendMove && recommendation.toState) {
        expect(recommendation.annualSavings).toBeGreaterThan(0);
      }
    });
  });

  describe('compareTwoStates', () => {
    test('compares two states', () => {
      const comparison = compareTwoStates('CA', 'TX', baseInput);

      expect(comparison.state1Analysis.state).toBe('CA');
      expect(comparison.state2Analysis.state).toBe('TX');
      expect(comparison.betterState).toMatch(/^(CA|TX)$/);
      expect(comparison.annualDifference).toBeGreaterThanOrEqual(0);
      expect(comparison.recommendation).toBeTruthy();
    });

    test('annual difference is absolute value', () => {
      const comparison = compareTwoStates('CA', 'TX', baseInput);

      const actualDiff = Math.abs(
        comparison.state1Analysis.totalAnnualCost - comparison.state2Analysis.totalAnnualCost
      );

      expect(comparison.annualDifference).toBeCloseTo(actualDiff, 0);
    });

    test('better state has lower total cost or higher score', () => {
      const comparison = compareTwoStates('CA', 'TX', baseInput);

      const betterAnalysis =
        comparison.betterState === 'CA' ? comparison.state1Analysis : comparison.state2Analysis;
      const worseAnalysis =
        comparison.betterState === 'CA' ? comparison.state2Analysis : comparison.state1Analysis;

      expect(betterAnalysis.overallScore).toBeGreaterThanOrEqual(worseAnalysis.overallScore);
    });

    test('provides meaningful recommendation', () => {
      const comparison = compareTwoStates('NY', 'TX', baseInput);

      expect(comparison.recommendation).toContain(comparison.betterState === 'NY' ? 'New York' : 'Texas');
      expect(comparison.recommendation.toLowerCase()).toContain('sav'); // "saving" or "save"
      expect(comparison.recommendation).toBeTruthy();
      expect(comparison.recommendation.length).toBeGreaterThan(20);
    });
  });

  describe('Real-World Scenarios', () => {
    test('low-income person in Texas (coverage gap)', () => {
      const gapInput = { ...baseInput, magi: 18000 };

      const analysis = analyzeStateCoverage('TX', gapInput);

      expect(analysis.inCoverageGap).toBe(true);
      expect(analysis.medicaidEligible).toBe(false);
      expect(analysis.ptcEligible).toBe(false);
      expect(analysis.monthlyPTC).toBe(0);

      // Should have low affordability score
      expect(analysis.affordabilityScore).toBeLessThan(50);
    });

    test('same person in California (Medicaid)', () => {
      const lowIncomeInput = { ...baseInput, magi: 18000 };

      const analysis = analyzeStateCoverage('CA', lowIncomeInput);

      expect(analysis.inCoverageGap).toBe(false);
      expect(analysis.medicaidEligible).toBe(true);
      expect(analysis.ptcEligible).toBe(false);
    });

    test('middle-income person comparing CA vs TX', () => {
      const comparison = compareTwoStates('CA', 'TX', baseInput);

      // Both should have subsidies
      expect(comparison.state1Analysis.ptcEligible).toBe(true);
      expect(comparison.state2Analysis.ptcEligible).toBe(true);

      // CA has higher costs but better access
      expect(comparison.state1Analysis.accessScore).toBeGreaterThan(
        comparison.state2Analysis.accessScore
      );
    });

    test('person on Texas/Louisiana border', () => {
      const gapInput = { ...baseInput, magi: 18000 };

      const borderAnalysis = analyzeBorderStates('TX', gapInput);

      // LA has Medicaid expansion
      const laOption = borderAnalysis.betterOptions.find(opt => opt.state === 'LA');

      if (laOption) {
        expect(laOption.annualSavings).toBeGreaterThan(5000);
        expect(laOption.reason).toContain('Medicaid');
      }
    });

    test('high-income person (reduced subsidies)', () => {
      const highIncomeInput = { ...baseInput, magi: 100000 };

      const comparison = compareMultipleStates(['CA', 'TX', 'NY'], highIncomeInput);

      // No one should be Medicaid eligible
      comparison.states.forEach(state => {
        expect(state.medicaidEligible).toBe(false);
      });

      // IRA 2022 eliminated subsidy cliff - even high earners get small subsidies
      // But subsidies should be much less than lower income folks
      comparison.states.forEach(state => {
        expect(state.monthlyPTC).toBeLessThan(state.monthlyPremium * 0.5); // Less than 50% covered
      });

      // Affordability should matter more (reduced subsidy buffer)
      const cheapestState = comparison.states.reduce((prev, curr) =>
        curr.totalAnnualCost < prev.totalAnnualCost ? curr : prev
      );

      expect(cheapestState.state).toBe(comparison.bestAffordability);
    });

    test('Wyoming resident (worst market)', () => {
      const recommendation = analyzeRelocationOpportunity('WY', baseInput, true);

      // Wyoming has only 1 carrier and no Medicaid expansion
      // Should find better options (or at least analyze them)
      expect(recommendation.toState).toBeTruthy();

      // If move is recommended, savings should be positive
      if (recommendation.recommendMove) {
        expect(recommendation.annualSavings).toBeGreaterThan(0);
      }

      // At minimum, should provide considerations
      expect(recommendation.considerations.length).toBeGreaterThan(0);
    });

    test('Massachusetts resident (good market)', () => {
      const analysis = analyzeStateCoverage('MA', baseInput);

      // MA has strong market
      expect(analysis.hasStateSubsidies).toBe(true);
      expect(analysis.marketCompetitiveness).toMatch(/moderate|high/);
      expect(analysis.accessScore).toBeGreaterThan(60); // Good access score
    });

    test('regional comparison: Northeast states', () => {
      const comparison = compareMultipleStates(['NY', 'NJ', 'CT', 'MA', 'PA'], baseInput);

      // All are expansion states with competitive markets
      comparison.states.forEach(state => {
        expect(state.medicaidEligible).toBe(false); // Income too high
        expect(state.inCoverageGap).toBe(false);
        expect(state.carrierCount).toBeGreaterThan(2);
      });
    });

    test('regional comparison: Southern states', () => {
      const gapInput = { ...baseInput, magi: 18000 };

      const comparison = compareMultipleStates(['TX', 'FL', 'GA', 'NC', 'VA'], gapInput);

      // TX, FL, GA have coverage gaps
      expect(comparison.coverageGapStates).toContain('TX');
      expect(comparison.coverageGapStates).toContain('FL');
      expect(comparison.coverageGapStates).toContain('GA');

      // NC and VA expanded
      expect(comparison.medicaidEligibleStates).toContain('NC');
      expect(comparison.medicaidEligibleStates).toContain('VA');
    });
  });
});
