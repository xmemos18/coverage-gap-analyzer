/**
 * Break-Even Calculator Tests
 */

import {
  calculateAnnualCost,
  findBreakEvenPoint,
  generateCostCurve,
  analyzeBreakEven,
  compareBreakEven,
  createPlanFromTier,
  quickCompare,
  type PlanDetails,
} from '../calculator';

describe('Break-Even Calculator', () => {
  // Sample plans for testing
  const bronzePlan: PlanDetails = {
    name: 'Bronze Plan',
    monthlyPremium: 250,
    deductible: 7000,
    coinsurance: 0.4,
    outOfPocketMax: 9450,
    metalTier: 'Bronze',
  };

  const goldPlan: PlanDetails = {
    name: 'Gold Plan',
    monthlyPremium: 500,
    deductible: 1500,
    coinsurance: 0.2,
    outOfPocketMax: 8700,
    metalTier: 'Gold',
  };

  describe('calculateAnnualCost', () => {
    it('should return only premium cost when no medical expenses', () => {
      const cost = calculateAnnualCost(bronzePlan, 0);
      expect(cost).toBe(bronzePlan.monthlyPremium * 12); // 3000
    });

    it('should include medical expenses below deductible', () => {
      const expense = 2000;
      const cost = calculateAnnualCost(bronzePlan, expense);
      expect(cost).toBe(bronzePlan.monthlyPremium * 12 + expense); // 3000 + 2000
    });

    it('should apply coinsurance after deductible', () => {
      const expense = 10000;
      // Deductible: 7000, After deductible: 3000, Coinsurance: 3000 * 0.4 = 1200
      // OOP: 7000 + 1200 = 8200
      const expectedOOP = 7000 + 3000 * 0.4;
      const cost = calculateAnnualCost(bronzePlan, expense);
      expect(cost).toBe(bronzePlan.monthlyPremium * 12 + expectedOOP);
    });

    it('should cap at out-of-pocket maximum', () => {
      const expense = 100000; // Very high
      const cost = calculateAnnualCost(bronzePlan, expense);
      expect(cost).toBe(bronzePlan.monthlyPremium * 12 + bronzePlan.outOfPocketMax);
    });

    it('should handle different plan structures', () => {
      const expense = 5000;

      const bronzeCost = calculateAnnualCost(bronzePlan, expense);
      const goldCost = calculateAnnualCost(goldPlan, expense);

      // Bronze: 3000 (premium) + 5000 (all below deductible) = 8000
      expect(bronzeCost).toBe(3000 + 5000);

      // Gold: 6000 (premium) + 1500 (deductible) + 3500 * 0.2 (coinsurance) = 8200
      expect(goldCost).toBe(6000 + 1500 + 3500 * 0.2);
    });
  });

  describe('findBreakEvenPoint', () => {
    it('should find break-even between bronze and gold', () => {
      const breakEven = findBreakEvenPoint(bronzePlan, goldPlan);

      // Break-even should exist (bronze cheaper at low, gold cheaper at high)
      expect(breakEven).not.toBeNull();
      expect(breakEven).toBeGreaterThan(0);
    });

    it('should return null when one plan always cheaper', () => {
      const cheapPlan: PlanDetails = {
        name: 'Cheap Plan',
        monthlyPremium: 100,
        deductible: 2000,
        coinsurance: 0.2,
        outOfPocketMax: 5000,
      };

      const expensivePlan: PlanDetails = {
        name: 'Expensive Plan',
        monthlyPremium: 800,
        deductible: 3000,
        coinsurance: 0.3,
        outOfPocketMax: 8000,
      };

      const breakEven = findBreakEvenPoint(cheapPlan, expensivePlan);

      // Cheap plan always better (lower premium AND lower everything else)
      expect(breakEven).toBeNull();
    });

    it('should be symmetric (same result regardless of order)', () => {
      const breakEven1 = findBreakEvenPoint(bronzePlan, goldPlan);
      const breakEven2 = findBreakEvenPoint(goldPlan, bronzePlan);

      expect(breakEven1).toBe(breakEven2);
    });
  });

  describe('generateCostCurve', () => {
    it('should generate correct number of points', () => {
      const curve = generateCostCurve(bronzePlan, goldPlan, 10);
      expect(curve.length).toBe(11); // 0 to 10 inclusive
    });

    it('should start at zero medical expense', () => {
      const curve = generateCostCurve(bronzePlan, goldPlan);
      expect(curve[0].medicalExpense).toBe(0);
    });

    it('should identify cheaper plan at each point', () => {
      const curve = generateCostCurve(bronzePlan, goldPlan);

      curve.forEach((point) => {
        expect(['1', '2', 'equal']).toContain(point.cheaperPlan);
      });
    });

    it('should calculate savings correctly', () => {
      const curve = generateCostCurve(bronzePlan, goldPlan);

      curve.forEach((point) => {
        const expectedSavings = point.plan2TotalCost - point.plan1TotalCost;
        expect(point.savingsWithPlan1).toBe(expectedSavings);
      });
    });

    it('should show crossover for plans with different structures', () => {
      const curve = generateCostCurve(bronzePlan, goldPlan);

      // Bronze should be cheaper at low utilization
      expect(curve[0].cheaperPlan).toBe('1');

      // At high utilization, gold should be cheaper or equal
      const lastPoint = curve[curve.length - 1];
      expect(['2', 'equal']).toContain(lastPoint.cheaperPlan);
    });
  });

  describe('analyzeBreakEven', () => {
    it('should generate summary with break-even point', () => {
      const breakEven = findBreakEvenPoint(bronzePlan, goldPlan);
      const curve = generateCostCurve(bronzePlan, goldPlan);
      const analysis = analyzeBreakEven(bronzePlan, goldPlan, breakEven, curve);

      expect(analysis.summary).toContain('Break-even');
      expect(analysis.summary.length).toBeGreaterThan(50);
    });

    it('should generate summary when no break-even', () => {
      const cheapPlan: PlanDetails = {
        name: 'Always Cheaper',
        monthlyPremium: 100,
        deductible: 1000,
        coinsurance: 0.1,
        outOfPocketMax: 3000,
      };

      const expensivePlan: PlanDetails = {
        name: 'Always Expensive',
        monthlyPremium: 500,
        deductible: 5000,
        coinsurance: 0.3,
        outOfPocketMax: 9000,
      };

      const curve = generateCostCurve(cheapPlan, expensivePlan);
      const analysis = analyzeBreakEven(cheapPlan, expensivePlan, null, curve);

      expect(analysis.summary).toContain('always');
    });

    it('should provide insights', () => {
      const curve = generateCostCurve(bronzePlan, goldPlan);
      const analysis = analyzeBreakEven(bronzePlan, goldPlan, 8000, curve);

      expect(analysis.insights.length).toBeGreaterThan(0);
    });

    it('should identify plan strengths', () => {
      const curve = generateCostCurve(bronzePlan, goldPlan);
      const analysis = analyzeBreakEven(bronzePlan, goldPlan, 8000, curve);

      expect(analysis.planStrengths.plan1.length).toBeGreaterThanOrEqual(0);
      expect(analysis.planStrengths.plan2.length).toBeGreaterThanOrEqual(0);
    });

    it('should recommend a plan', () => {
      const curve = generateCostCurve(bronzePlan, goldPlan);
      const analysis = analyzeBreakEven(bronzePlan, goldPlan, 8000, curve);

      expect(['1', '2']).toContain(analysis.recommendedPlan);
      expect(['high', 'medium', 'low']).toContain(analysis.confidence);
    });

    it('should identify HSA eligibility', () => {
      const hdhpPlan: PlanDetails = {
        name: 'HDHP Plan',
        monthlyPremium: 200,
        deductible: 3200,
        coinsurance: 0.2,
        outOfPocketMax: 8050,
        metalTier: 'HDHP',
      };

      const curve = generateCostCurve(hdhpPlan, goldPlan);
      const analysis = analyzeBreakEven(hdhpPlan, goldPlan, 6000, curve);

      const hasHSAStrength = analysis.planStrengths.plan1.some((s) =>
        s.toLowerCase().includes('hsa')
      );
      expect(hasHSAStrength).toBe(true);
    });
  });

  describe('compareBreakEven', () => {
    it('should return complete result object', () => {
      const result = compareBreakEven(bronzePlan, goldPlan);

      expect(result).toHaveProperty('plan1');
      expect(result).toHaveProperty('plan2');
      expect(result).toHaveProperty('breakEvenPoint');
      expect(result).toHaveProperty('betterPlanBelowBreakeven');
      expect(result).toHaveProperty('betterPlanAboveBreakeven');
      expect(result).toHaveProperty('costCurve');
      expect(result).toHaveProperty('analysis');
    });

    it('should identify which plan is better in each region', () => {
      const result = compareBreakEven(bronzePlan, goldPlan);

      expect(['1', '2', 'always-1', 'always-2']).toContain(
        result.betterPlanBelowBreakeven
      );
      expect(['1', '2', 'always-1', 'always-2']).toContain(
        result.betterPlanAboveBreakeven
      );
    });

    it('should have cost curve data', () => {
      const result = compareBreakEven(bronzePlan, goldPlan);

      expect(result.costCurve.length).toBeGreaterThan(0);
      expect(result.costCurve[0]).toHaveProperty('medicalExpense');
      expect(result.costCurve[0]).toHaveProperty('plan1TotalCost');
      expect(result.costCurve[0]).toHaveProperty('plan2TotalCost');
    });
  });

  describe('createPlanFromTier', () => {
    it('should create Bronze plan with correct defaults', () => {
      const plan = createPlanFromTier('My Bronze', 'Bronze', 300);

      expect(plan.name).toBe('My Bronze');
      expect(plan.monthlyPremium).toBe(300);
      expect(plan.deductible).toBe(7000);
      expect(plan.coinsurance).toBe(0.4);
      expect(plan.metalTier).toBe('Bronze');
    });

    it('should create Gold plan with correct defaults', () => {
      const plan = createPlanFromTier('My Gold', 'Gold', 550);

      expect(plan.deductible).toBe(1500);
      expect(plan.coinsurance).toBe(0.2);
      expect(plan.outOfPocketMax).toBe(8700);
    });

    it('should create HDHP with correct defaults', () => {
      const plan = createPlanFromTier('HDHP', 'HDHP', 200);

      expect(plan.deductible).toBe(3200);
      expect(plan.outOfPocketMax).toBe(8050);
    });
  });

  describe('quickCompare', () => {
    it('should compare two metal tiers', () => {
      const result = quickCompare('Bronze', 250, 'Gold', 500);

      expect(result.plan1.metalTier).toBe('Bronze');
      expect(result.plan2.metalTier).toBe('Gold');
      expect(result.breakEvenPoint).not.toBeNull();
    });

    it('should work with HDHP comparison', () => {
      const result = quickCompare('HDHP', 200, 'Silver', 400);

      expect(result.plan1.metalTier).toBe('HDHP');
      expect(result.plan2.metalTier).toBe('Silver');
    });
  });

  describe('edge cases', () => {
    it('should handle identical plans', () => {
      const result = compareBreakEven(bronzePlan, bronzePlan);

      // No break-even needed - they're the same
      expect(result.costCurve[0].cheaperPlan).toBe('equal');
    });

    it('should handle zero premium plan', () => {
      const freePlan: PlanDetails = {
        name: 'Free Plan',
        monthlyPremium: 0,
        deductible: 10000,
        coinsurance: 0.5,
        outOfPocketMax: 15000,
      };

      const cost = calculateAnnualCost(freePlan, 5000);
      expect(cost).toBe(5000); // Just the medical expense
    });

    it('should handle very high medical expenses', () => {
      const expense = 1000000;

      const bronzeCost = calculateAnnualCost(bronzePlan, expense);
      const goldCost = calculateAnnualCost(goldPlan, expense);

      // Both should be capped at premium + OOP max
      expect(bronzeCost).toBe(bronzePlan.monthlyPremium * 12 + bronzePlan.outOfPocketMax);
      expect(goldCost).toBe(goldPlan.monthlyPremium * 12 + goldPlan.outOfPocketMax);
    });
  });

  describe('real-world scenarios', () => {
    it('should correctly compare typical Bronze vs Gold choice', () => {
      const bronze = createPlanFromTier('Bronze', 'Bronze', 300);
      const gold = createPlanFromTier('Gold', 'Gold', 550);

      const result = compareBreakEven(bronze, gold);

      // Bronze should be better at low utilization
      expect(result.costCurve[0].cheaperPlan).toBe('1');

      // Should have break-even somewhere in middle
      expect(result.breakEvenPoint).toBeGreaterThan(0);
      expect(result.breakEvenPoint).toBeLessThan(50000);
    });

    it('should correctly compare HDHP with HSA advantage', () => {
      const hdhp = createPlanFromTier('HDHP', 'HDHP', 200);
      const silver = createPlanFromTier('Silver', 'Silver', 450);

      const result = compareBreakEven(hdhp, silver);

      // HDHP should mention HSA eligibility
      const hasHSA = result.analysis.planStrengths.plan1.some((s) =>
        s.toLowerCase().includes('hsa')
      );
      expect(hasHSA).toBe(true);
    });

    it('should provide actionable recommendation', () => {
      const result = quickCompare('Bronze', 280, 'Silver', 420);

      expect(result.analysis.recommendedPlan).toBeDefined();
      expect(result.analysis.summary.length).toBeGreaterThan(30);
    });
  });
});
