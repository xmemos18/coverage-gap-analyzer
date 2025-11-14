/**
 * Tests for Total Cost of Care (TCC) Modeling
 * Validates utilization patterns, OOP calculations, and plan comparisons
 */

import {
  getExpectedAnnualCosts,
  getChronicConditionCosts,
  calculateOutOfPocketCosts,
  analyzeTotalCostOfCare,
  determineUtilizationScenario,
  generateTCCRecommendations,
  ACTUARIAL_VALUES,
  TYPICAL_COST_SHARING,
} from '../total-cost-of-care';

describe('Total Cost of Care Model', () => {
  describe('getExpectedAnnualCosts', () => {
    test('returns higher costs for older ages', () => {
      const age25 = getExpectedAnnualCosts(25, 'good');
      const age55 = getExpectedAnnualCosts(55, 'good');
      const age75 = getExpectedAnnualCosts(75, 'good');

      expect(age55).toBeGreaterThan(age25);
      expect(age75).toBeGreaterThan(age55);
    });

    test('adjusts for health status', () => {
      const age = 45;
      const excellent = getExpectedAnnualCosts(age, 'excellent');
      const good = getExpectedAnnualCosts(age, 'good');
      const fair = getExpectedAnnualCosts(age, 'fair');
      const poor = getExpectedAnnualCosts(age, 'poor');

      expect(excellent).toBeLessThan(good);
      expect(fair).toBeGreaterThan(good);
      expect(poor).toBeGreaterThan(fair);

      // Poor health should be ~2.5x good health
      expect(poor / good).toBeCloseTo(2.5, 0);
    });

    test('children have lower costs than adults', () => {
      const child = getExpectedAnnualCosts(10, 'good');
      const adult = getExpectedAnnualCosts(40, 'good');

      expect(child).toBeLessThan(adult);
    });

    test('costs spike at Medicare age', () => {
      const age64 = getExpectedAnnualCosts(64, 'good');
      const age65 = getExpectedAnnualCosts(65, 'good');

      expect(age65).toBeGreaterThan(age64);
    });

    test('young adults have lowest costs', () => {
      const costs = [25, 30, 40, 50, 60].map(age => getExpectedAnnualCosts(age, 'good'));
      const youngAdultCost = getExpectedAnnualCosts(25, 'good');

      // Young adult should be among the lowest
      expect(youngAdultCost).toBe(Math.min(...costs));
    });
  });

  describe('getChronicConditionCosts', () => {
    test('returns 0 for no conditions', () => {
      expect(getChronicConditionCosts([])).toBe(0);
    });

    test('adds costs for single condition', () => {
      const diabetesCost = getChronicConditionCosts(['diabetes']);
      expect(diabetesCost).toBe(8000);

      const hypertensionCost = getChronicConditionCosts(['hypertension']);
      expect(hypertensionCost).toBe(2000);
    });

    test('adds costs for multiple conditions with scaling', () => {
      const singleCost = getChronicConditionCosts(['diabetes']);
      const doubleCost = getChronicConditionCosts(['diabetes', 'hypertension']);

      // Double condition should be less than sum due to 0.85 scaling
      const expectedDouble = (8000 + 2000) * 0.85;
      expect(doubleCost).toBe(expectedDouble);
      expect(doubleCost).toBeLessThan(singleCost + 2000);
    });

    test('high-cost conditions', () => {
      const cancerCost = getChronicConditionCosts(['cancer']);
      const diabetesCost = getChronicConditionCosts(['diabetes']);

      expect(cancerCost).toBeGreaterThan(diabetesCost);
      expect(cancerCost).toBe(30000);
    });

    test('handles unknown conditions gracefully', () => {
      const cost = getChronicConditionCosts(['unknown-condition']);
      expect(cost).toBe(0);
    });

    test('case-insensitive condition matching', () => {
      const lower = getChronicConditionCosts(['diabetes']);
      const upper = getChronicConditionCosts(['DIABETES']);
      const mixed = getChronicConditionCosts(['DiAbEtEs']);

      expect(upper).toBe(lower);
      expect(mixed).toBe(lower);
    });
  });

  describe('calculateOutOfPocketCosts', () => {
    test('minimal utilization with Bronze plan', () => {
      const result = calculateOutOfPocketCosts('Bronze', 'minimal', 2000);

      expect(result.estimatedOOP).toBeLessThan(3000);
      expect(result.deductibleMet).toBe(false); // $2k < $7k deductible
      expect(result.oopMaxReached).toBe(false);
    });

    test('high utilization with Bronze hits OOP max', () => {
      const result = calculateOutOfPocketCosts('Bronze', 'very-high', 25000);

      expect(result.oopMaxReached).toBe(true);
      expect(result.estimatedOOP).toBeLessThanOrEqual(TYPICAL_COST_SHARING.Bronze.oopMaximum);
    });

    test('Gold plan has lower OOP than Bronze for same utilization', () => {
      const medicalCosts = 10000;
      const bronze = calculateOutOfPocketCosts('Bronze', 'high', medicalCosts);
      const gold = calculateOutOfPocketCosts('Gold', 'high', medicalCosts);

      expect(gold.estimatedOOP).toBeLessThan(bronze.estimatedOOP);
    });

    test('Platinum has lowest OOP for high utilization', () => {
      const medicalCosts = 15000;
      const bronze = calculateOutOfPocketCosts('Bronze', 'very-high', medicalCosts);
      const silver = calculateOutOfPocketCosts('Silver', 'very-high', medicalCosts);
      const gold = calculateOutOfPocketCosts('Gold', 'very-high', medicalCosts);
      const platinum = calculateOutOfPocketCosts('Platinum', 'very-high', medicalCosts);

      expect(platinum.estimatedOOP).toBeLessThan(gold.estimatedOOP);
      expect(gold.estimatedOOP).toBeLessThan(silver.estimatedOOP);
      // Bronze and Silver may both hit OOP max, so use <=
      expect(silver.estimatedOOP).toBeLessThanOrEqual(bronze.estimatedOOP);
    });

    test('deductible met flag works correctly', () => {
      const lowCost = calculateOutOfPocketCosts('Silver', 'minimal', 2000);
      const highCost = calculateOutOfPocketCosts('Silver', 'high', 10000);

      expect(lowCost.deductibleMet).toBe(false);
      expect(highCost.deductibleMet).toBe(true);
    });

    test('OOP breakdown components are reasonable', () => {
      const result = calculateOutOfPocketCosts('Silver', 'medium', 8000);

      expect(result.breakdown.deductible).toBeGreaterThan(0);
      expect(result.breakdown.copays).toBeGreaterThan(0);
      expect(result.breakdown.prescriptions).toBeGreaterThan(0);

      // Sum of breakdown should roughly equal total (within rounding/capping)
      const breakdownSum =
        result.breakdown.deductible +
        result.breakdown.copays +
        result.breakdown.coinsurance +
        result.breakdown.prescriptions;

      expect(breakdownSum).toBeGreaterThanOrEqual(result.estimatedOOP - 100);
    });

    test('very low utilization has minimal OOP', () => {
      const result = calculateOutOfPocketCosts('Bronze', 'minimal', 500);

      expect(result.estimatedOOP).toBeLessThan(1000);
    });

    test('catastrophic plan has very high deductible', () => {
      const result = calculateOutOfPocketCosts('Catastrophic', 'medium', 5000);

      expect(result.breakdown.deductible).toBeGreaterThan(4000);
    });
  });

  describe('analyzeTotalCostOfCare', () => {
    const mockPremiums = {
      Catastrophic: 200,
      Bronze: 300,
      Silver: 450,
      Gold: 600,
      Platinum: 750,
    };

    test('returns analysis for all tiers', () => {
      const analysis = analyzeTotalCostOfCare(mockPremiums, 5000, 'medium');

      expect(analysis).toHaveLength(4); // Bronze, Silver, Gold, Platinum (not Catastrophic)
      expect(analysis.every(a => a.metalTier)).toBe(true);
      expect(analysis.every(a => a.totalAnnualCost > 0)).toBe(true);
    });

    test('sorts by total annual cost (lowest first)', () => {
      const analysis = analyzeTotalCostOfCare(mockPremiums, 5000, 'medium');

      for (let i = 1; i < analysis.length; i++) {
        expect(analysis[i].totalAnnualCost).toBeGreaterThanOrEqual(analysis[i - 1].totalAnnualCost);
      }
    });

    test('assigns rankings correctly', () => {
      const analysis = analyzeTotalCostOfCare(mockPremiums, 5000, 'medium');

      expect(analysis[0].ranking).toBe(1); // Best
      expect(analysis[1].ranking).toBe(2);
      expect(analysis[2].ranking).toBe(3);
      expect(analysis[3].ranking).toBe(4); // Worst
    });

    test('minimal utilization favors Bronze (low premium)', () => {
      const analysis = analyzeTotalCostOfCare(mockPremiums, 2000, 'minimal');

      const bronze = analysis.find(a => a.metalTier === 'Bronze');
      expect(bronze?.ranking).toBeLessThanOrEqual(2); // Should be top 2
    });

    test('very high utilization may favor Gold/Platinum', () => {
      const analysis = analyzeTotalCostOfCare(mockPremiums, 20000, 'very-high');

      const goldOrPlatinum = analysis.filter(a => a.metalTier === 'Gold' || a.metalTier === 'Platinum');
      const bestRanking = Math.min(...goldOrPlatinum.map(a => a.ranking));

      expect(bestRanking).toBeLessThanOrEqual(2); // One should be top 2
    });

    test('total annual cost = premium + OOP', () => {
      const analysis = analyzeTotalCostOfCare(mockPremiums, 8000, 'medium');

      analysis.forEach(plan => {
        expect(plan.totalAnnualCost).toBe(plan.annualPremium + plan.estimatedOOP);
      });
    });

    test('includes deductible and OOP max for reference', () => {
      const analysis = analyzeTotalCostOfCare(mockPremiums, 5000, 'medium');

      analysis.forEach(plan => {
        expect(plan.deductible).toBeGreaterThan(0);
        expect(plan.oopMaximum).toBeGreaterThan(plan.deductible);
      });
    });
  });

  describe('determineUtilizationScenario', () => {
    test('young healthy person = minimal', () => {
      const scenario = determineUtilizationScenario(25, [], 'none');
      expect(scenario).toBe('minimal');
    });

    test('older adult with no conditions = low/medium', () => {
      const scenario = determineUtilizationScenario(45, [], 'none');
      expect(['low', 'medium']).toContain(scenario);
    });

    test('chronic conditions increase utilization', () => {
      const noConditions = determineUtilizationScenario(45, [], 'none');
      const withConditions = determineUtilizationScenario(45, ['diabetes', 'hypertension'], '1-3');

      const levels: Record<string, number> = {
        minimal: 0,
        low: 1,
        medium: 2,
        high: 3,
        'very-high': 4,
      };

      expect(levels[withConditions]).toBeGreaterThan(levels[noConditions]);
    });

    test('many prescriptions = higher utilization', () => {
      const fewRx = determineUtilizationScenario(50, [], 'none');
      const manyRx = determineUtilizationScenario(50, [], '4-or-more');

      const levels: Record<string, number> = {
        minimal: 0,
        low: 1,
        medium: 2,
        high: 3,
        'very-high': 4,
      };

      expect(levels[manyRx]).toBeGreaterThan(levels[fewRx]);
    });

    test('age 60+ with conditions = high/very-high', () => {
      const scenario = determineUtilizationScenario(62, ['diabetes', 'heartDisease'], '4-or-more');
      expect(['high', 'very-high']).toContain(scenario);
    });

    test('multiple factors compound', () => {
      // Young, healthy, no meds
      const minimal = determineUtilizationScenario(25, [], 'none');

      // Old, multiple conditions, many meds
      const veryHigh = determineUtilizationScenario(60, ['diabetes', 'copd', 'hypertension'], '4-or-more');

      expect(minimal).toBe('minimal');
      expect(veryHigh).toBe('very-high');
    });
  });

  describe('generateTCCRecommendations', () => {
    const mockAnalysis = [
      { metalTier: 'Bronze' as const, annualPremium: 3600, estimatedOOP: 3000, totalAnnualCost: 6600, deductible: 7000, oopMaximum: 9200, ranking: 1 },
      { metalTier: 'Silver' as const, annualPremium: 5400, estimatedOOP: 2000, totalAnnualCost: 7400, deductible: 4500, oopMaximum: 9200, ranking: 2 },
      { metalTier: 'Gold' as const, annualPremium: 7200, estimatedOOP: 1500, totalAnnualCost: 8700, deductible: 1500, oopMaximum: 8000, ranking: 3 },
      { metalTier: 'Platinum' as const, annualPremium: 9000, estimatedOOP: 800, totalAnnualCost: 9800, deductible: 500, oopMaximum: 5000, ranking: 4 },
    ];

    test('recommends best value plan', () => {
      const recs = generateTCCRecommendations(mockAnalysis, 'medium');

      expect(recs.length).toBeGreaterThan(0);
      expect(recs[0]).toContain('Bronze'); // Best value
      expect(recs[0]).toContain('Best Value');
    });

    test('shows savings comparison', () => {
      const recs = generateTCCRecommendations(mockAnalysis, 'medium');

      const savingsRec = recs.find(r => r.includes('saves you'));
      expect(savingsRec).toBeDefined();
      expect(savingsRec).toContain('$'); // Dollar amount
    });

    test('provides context for minimal utilization', () => {
      const recs = generateTCCRecommendations(mockAnalysis, 'minimal');

      const bronzeRec = recs.find(r => r.includes('Bronze') && r.includes('healthy'));
      expect(bronzeRec).toBeDefined();
    });

    test('warns about high OOP for high utilization', () => {
      const highOOPAnalysis = mockAnalysis.map(a => ({
        ...a,
        estimatedOOP: a.estimatedOOP * 2, // Double OOP
      }));

      const recs = generateTCCRecommendations(highOOPAnalysis, 'high');

      const warning = recs.find(r => r.includes('Warning') || r.includes('⚠️'));
      expect(warning).toBeDefined();
    });

    test('includes total cost breakdown', () => {
      const recs = generateTCCRecommendations(mockAnalysis, 'medium');

      expect(recs[0]).toContain('premium');
      expect(recs[0]).toContain('OOP');
    });
  });

  describe('Real-World Scenarios', () => {
    test('healthy 28-year-old: Bronze is cheapest', () => {
      const age = 28;
      const expectedCosts = getExpectedAnnualCosts(age, 'excellent');
      const utilization = determineUtilizationScenario(age, [], 'none');

      const premiums = {
        Catastrophic: 180,
        Bronze: 250,
        Silver: 400,
        Gold: 550,
        Platinum: 700,
      };

      const analysis = analyzeTotalCostOfCare(premiums, expectedCosts, utilization);
      const best = analysis[0];

      expect(best.metalTier).toBe('Bronze');
      expect(utilization).toBe('minimal');
    });

    test('55-year-old with diabetes: algorithm picks optimal plan', () => {
      const age = 55;
      const baseCosts = getExpectedAnnualCosts(age, 'fair');
      const conditionCosts = getChronicConditionCosts(['diabetes']);
      const totalExpected = baseCosts + conditionCosts;
      const utilization = determineUtilizationScenario(age, ['diabetes'], '4-or-more');

      const premiums = {
        Catastrophic: 300,
        Bronze: 600,
        Silver: 800,
        Gold: 950,
        Platinum: 1250,
      };

      const analysis = analyzeTotalCostOfCare(premiums, totalExpected, utilization);

      // Verify algorithm works: best plan has lowest total cost
      expect(analysis[0].totalAnnualCost).toBeLessThan(analysis[1].totalAnnualCost);
      expect(['medium', 'high']).toContain(utilization);
      expect(totalExpected).toBeGreaterThan(10000); // High medical costs with diabetes
    });

    test('family with children: moderate utilization', () => {
      // Parents 38 & 36, children 8 & 5
      const parent1 = getExpectedAnnualCosts(38, 'good');
      const parent2 = getExpectedAnnualCosts(36, 'good');
      const child1 = getExpectedAnnualCosts(8, 'good');
      const child2 = getExpectedAnnualCosts(5, 'good');

      const totalExpected = parent1 + parent2 + child1 + child2;

      const premiums = {
        Catastrophic: 400,
        Bronze: 800,
        Silver: 1200,
        Gold: 1600,
        Platinum: 2000,
      };

      const analysis = analyzeTotalCostOfCare(premiums, totalExpected, 'medium');

      // Family should lean toward Silver or Gold for predictable costs
      const silverOrGold = analysis.filter(a => a.metalTier === 'Silver' || a.metalTier === 'Gold');
      expect(silverOrGold.some(a => a.ranking <= 2)).toBe(true);
    });

    test('pre-Medicare couple with conditions: algorithm provides guidance', () => {
      const person1 = getExpectedAnnualCosts(63, 'fair') + getChronicConditionCosts(['hypertension']);
      const person2 = getExpectedAnnualCosts(62, 'fair') + getChronicConditionCosts(['arthritis']);
      const totalExpected = person1 + person2;

      const premiums = {
        Catastrophic: 600,
        Bronze: 1300,
        Silver: 1700,
        Gold: 2000,
        Platinum: 3000,
      };

      const analysis = analyzeTotalCostOfCare(premiums, totalExpected, 'high');
      const recommendations = generateTCCRecommendations(analysis, 'high');

      // Verify algorithm provides useful analysis
      expect(recommendations.length).toBeGreaterThan(2);
      expect(analysis[0].totalAnnualCost).toBeLessThan(analysis[analysis.length - 1].totalAnnualCost);
      expect(totalExpected).toBeGreaterThan(15000); // High costs for couple with conditions
    });
  });

  describe('Actuarial Value Validation', () => {
    test('actuarial values are correct', () => {
      expect(ACTUARIAL_VALUES.Bronze).toBe(0.60);
      expect(ACTUARIAL_VALUES.Silver).toBe(0.70);
      expect(ACTUARIAL_VALUES.Gold).toBe(0.80);
      expect(ACTUARIAL_VALUES.Platinum).toBe(0.90);
    });

    test('cost sharing reflects actuarial values', () => {
      // Bronze should have highest deductible
      expect(TYPICAL_COST_SHARING.Bronze.deductible).toBeGreaterThan(TYPICAL_COST_SHARING.Silver.deductible);
      expect(TYPICAL_COST_SHARING.Silver.deductible).toBeGreaterThan(TYPICAL_COST_SHARING.Gold.deductible);
      expect(TYPICAL_COST_SHARING.Gold.deductible).toBeGreaterThan(TYPICAL_COST_SHARING.Platinum.deductible);
    });
  });
});
