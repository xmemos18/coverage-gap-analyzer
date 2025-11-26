/**
 * Plan Comparison Tests
 */

import {
  comparePlans,
  quickComparison,
  type PlanDetails,
  type UserHealthProfile,
} from '../plan-comparison';

describe('Plan Comparison', () => {
  // Helper to create base plan
  const createBasePlan = (overrides: Partial<PlanDetails> = {}): PlanDetails => ({
    id: 'plan-1',
    name: 'Silver Plan',
    type: 'PPO',
    metalLevel: 'silver',
    issuer: 'Test Insurance Co',
    monthlyPremium: 500,
    deductible: 2000,
    outOfPocketMax: 8000,
    primaryCareCopay: 30,
    specialistCopay: 60,
    genericDrugCopay: 15,
    brandDrugCopay: 50,
    emergencyRoomCopay: 300,
    urgentCareCopay: 75,
    coinsurance: 20,
    hsaEligible: false,
    qualityRating: 4,
    ...overrides,
  });

  const createUserProfile = (overrides: Partial<UserHealthProfile> = {}): UserHealthProfile => ({
    expectedDoctorVisits: 4,
    expectedSpecialistVisits: 2,
    expectedPrescriptions: 2,
    avgPrescriptionTier: 1,
    expectedERVisits: 0,
    hasPlannedProcedures: false,
    riskTolerance: 'medium',
    prioritizesLowerPremium: false,
    needsSpecificProviders: false,
    hasChronicConditions: false,
    ...overrides,
  });

  describe('comparePlans', () => {
    it('should return comprehensive comparison result', () => {
      const planA = createBasePlan({ name: 'Plan A' });
      const planB = createBasePlan({ name: 'Plan B', monthlyPremium: 600 });

      const result = comparePlans(planA, planB);

      expect(result).toBeDefined();
      expect(result.planA).toEqual(planA);
      expect(result.planB).toEqual(planB);
      expect(result.metrics).toBeDefined();
      expect(result.scenarios).toBeDefined();
      expect(result.overallWinner).toBeDefined();
      expect(result.recommendation).toBeDefined();
      expect(result.keyDifferences).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should generate metrics for cost comparison', () => {
      const planA = createBasePlan({ monthlyPremium: 400 });
      const planB = createBasePlan({ monthlyPremium: 600 });

      const result = comparePlans(planA, planB);

      const premiumMetric = result.metrics.find((m) => m.name === 'Monthly Premium');
      expect(premiumMetric).toBeDefined();
      expect(premiumMetric?.winner).toBe('A');
    });

    it('should identify lower deductible plan', () => {
      const planA = createBasePlan({ deductible: 3000 });
      const planB = createBasePlan({ deductible: 1500 });

      const result = comparePlans(planA, planB);

      const deductibleMetric = result.metrics.find((m) => m.name === 'Deductible');
      expect(deductibleMetric?.winner).toBe('B');
    });

    it('should identify lower out-of-pocket max', () => {
      const planA = createBasePlan({ outOfPocketMax: 6000 });
      const planB = createBasePlan({ outOfPocketMax: 9000 });

      const result = comparePlans(planA, planB);

      const oopMetric = result.metrics.find((m) => m.name === 'Out-of-Pocket Maximum');
      expect(oopMetric?.winner).toBe('A');
    });

    it('should generate cost scenarios', () => {
      const planA = createBasePlan();
      const planB = createBasePlan({ monthlyPremium: 600 });

      const result = comparePlans(planA, planB);

      expect(result.scenarios.length).toBeGreaterThan(0);
      expect(result.scenarios.some((s) => s.name === 'Healthy Year')).toBe(true);
      expect(result.scenarios.some((s) => s.name === 'Moderate Usage')).toBe(true);
      expect(result.scenarios.some((s) => s.name === 'Chronic Condition')).toBe(true);
      expect(result.scenarios.some((s) => s.name === 'Major Medical Event')).toBe(true);
    });

    it('should include user expected usage scenario when profile provided', () => {
      const planA = createBasePlan();
      const planB = createBasePlan();
      const profile = createUserProfile();

      const result = comparePlans(planA, planB, profile);

      expect(result.scenarios.some((s) => s.name === 'Your Expected Usage')).toBe(true);
    });

    it('should determine overall winner', () => {
      const planA = createBasePlan({ monthlyPremium: 400, deductible: 1500 });
      const planB = createBasePlan({ monthlyPremium: 600, deductible: 3000 });

      const result = comparePlans(planA, planB);

      expect(result.overallWinner.plan).toBe('A');
      expect(result.overallWinner.confidence).toBeDefined();
    });

    it('should identify tie when plans are similar', () => {
      const planA = createBasePlan();
      const planB = createBasePlan();

      const result = comparePlans(planA, planB);

      expect(result.overallWinner.plan).toBe('tie');
    });
  });

  describe('Cost Scenarios', () => {
    it('should calculate healthy year costs correctly', () => {
      const planA = createBasePlan({ monthlyPremium: 400, primaryCareCopay: 25 });
      const planB = createBasePlan({ monthlyPremium: 600, primaryCareCopay: 30 });

      const result = comparePlans(planA, planB);
      const healthyScenario = result.scenarios.find((s) => s.name === 'Healthy Year');

      expect(healthyScenario).toBeDefined();
      // Plan A should be cheaper with lower premium
      expect(healthyScenario?.planACost).toBeLessThan(healthyScenario?.planBCost || 0);
    });

    it('should cap OOP costs at out-of-pocket maximum', () => {
      const planA = createBasePlan({
        monthlyPremium: 800,
        outOfPocketMax: 4000,
      });
      const planB = createBasePlan({
        monthlyPremium: 400,
        outOfPocketMax: 12000,
      });

      const result = comparePlans(planA, planB);
      const majorEventScenario = result.scenarios.find((s) => s.name === 'Major Medical Event');

      expect(majorEventScenario).toBeDefined();
      // With major event, plan A's lower OOP max limits costs
      expect(majorEventScenario?.breakdown.outOfPocket.planA).toBeLessThanOrEqual(4000);
    });

    it('should include breakdown of premiums vs out-of-pocket', () => {
      const planA = createBasePlan();
      const planB = createBasePlan({ monthlyPremium: 600 });

      const result = comparePlans(planA, planB);

      result.scenarios.forEach((scenario) => {
        expect(scenario.breakdown).toBeDefined();
        expect(scenario.breakdown.premiums.planA).toBe(planA.monthlyPremium * 12);
        expect(scenario.breakdown.premiums.planB).toBe(planB.monthlyPremium * 12);
      });
    });
  });

  describe('Metrics', () => {
    it('should include cost category metrics', () => {
      const planA = createBasePlan();
      const planB = createBasePlan();

      const result = comparePlans(planA, planB);
      const costMetrics = result.metrics.filter((m) => m.category === 'cost');

      expect(costMetrics.length).toBeGreaterThan(0);
      expect(costMetrics.some((m) => m.name.includes('Premium'))).toBe(true);
      expect(costMetrics.some((m) => m.name === 'Deductible')).toBe(true);
    });

    it('should include coverage category metrics', () => {
      const planA = createBasePlan();
      const planB = createBasePlan();

      const result = comparePlans(planA, planB);
      const coverageMetrics = result.metrics.filter((m) => m.category === 'coverage');

      expect(coverageMetrics.length).toBeGreaterThan(0);
    });

    it('should include importance weights', () => {
      const planA = createBasePlan();
      const planB = createBasePlan();

      const result = comparePlans(planA, planB);

      result.metrics.forEach((metric) => {
        expect(metric.importance).toBeGreaterThanOrEqual(1);
        expect(metric.importance).toBeLessThanOrEqual(5);
      });
    });

    it('should include HSA eligibility comparison', () => {
      const planA = createBasePlan({ hsaEligible: true });
      const planB = createBasePlan({ hsaEligible: false });

      const result = comparePlans(planA, planB);
      const hsaMetric = result.metrics.find((m) => m.name === 'HSA Eligible');

      expect(hsaMetric).toBeDefined();
      expect(hsaMetric?.winner).toBe('A');
    });

    it('should compare quality ratings', () => {
      const planA = createBasePlan({ qualityRating: 3 });
      const planB = createBasePlan({ qualityRating: 5 });

      const result = comparePlans(planA, planB);
      const qualityMetric = result.metrics.find((m) => m.name === 'Quality Rating');

      expect(qualityMetric).toBeDefined();
      expect(qualityMetric?.winner).toBe('B');
    });
  });

  describe('Recommendations', () => {
    it('should generate recommendation', () => {
      const planA = createBasePlan({ monthlyPremium: 400 });
      const planB = createBasePlan({ monthlyPremium: 600 });

      const result = comparePlans(planA, planB);

      expect(result.recommendation).toBeDefined();
      expect(result.recommendation.recommendedPlan).toBeDefined();
      expect(result.recommendation.reasons.length).toBeGreaterThan(0);
    });

    it('should consider user preferences in recommendation', () => {
      const planA = createBasePlan({ monthlyPremium: 400, outOfPocketMax: 10000 });
      const planB = createBasePlan({ monthlyPremium: 600, outOfPocketMax: 5000 });
      const profile = createUserProfile({
        riskTolerance: 'low',
        hasChronicConditions: true,
      });

      const result = comparePlans(planA, planB, profile);

      // With low risk tolerance and chronic conditions, should mention OOP protection
      expect(result.recommendation.reasons.some((r) => r.toLowerCase().includes('out-of-pocket') || r.toLowerCase().includes('chronic'))).toBe(true);
    });

    it('should include caveats when applicable', () => {
      const planA = createBasePlan({ monthlyPremium: 600 });
      const planB = createBasePlan({ monthlyPremium: 400 });
      const profile = createUserProfile({
        prioritizesLowerPremium: true,
        hasChronicConditions: true,
      });

      const result = comparePlans(planA, planB, profile);

      // May have caveats about premium vs total cost
      expect(result.recommendation.caveats).toBeDefined();
    });
  });

  describe('Key Differences', () => {
    it('should identify significant premium differences', () => {
      const planA = createBasePlan({ name: 'Plan A', monthlyPremium: 400 });
      const planB = createBasePlan({ name: 'Plan B', monthlyPremium: 600 });

      const result = comparePlans(planA, planB);

      expect(result.keyDifferences.some((d) => d.includes('premium'))).toBe(true);
    });

    it('should identify significant deductible differences', () => {
      const planA = createBasePlan({ name: 'Plan A', deductible: 1000 });
      const planB = createBasePlan({ name: 'Plan B', deductible: 3000 });

      const result = comparePlans(planA, planB);

      expect(result.keyDifferences.some((d) => d.includes('deductible'))).toBe(true);
    });

    it('should identify plan type differences', () => {
      const planA = createBasePlan({ name: 'Plan A', type: 'HMO' });
      const planB = createBasePlan({ name: 'Plan B', type: 'PPO' });

      const result = comparePlans(planA, planB);

      expect(result.keyDifferences.some((d) => d.includes('HMO') && d.includes('PPO'))).toBe(true);
    });
  });

  describe('quickComparison', () => {
    it('should return quick comparison result', () => {
      const planA = createBasePlan();
      const planB = createBasePlan({ monthlyPremium: 600 });

      const result = quickComparison(planA, planB);

      expect(result.cheaperMonthly).toBe('A');
      expect(result.cheaperAnnuallyHealthy).toBeDefined();
      expect(result.cheaperAnnuallySick).toBeDefined();
      expect(result.betterProtection).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should identify plan with better protection', () => {
      const planA = createBasePlan({ outOfPocketMax: 5000 });
      const planB = createBasePlan({ outOfPocketMax: 10000 });

      const result = quickComparison(planA, planB);

      expect(result.betterProtection).toBe('A');
    });

    it('should handle tie in monthly premium', () => {
      const planA = createBasePlan({ monthlyPremium: 500 });
      const planB = createBasePlan({ monthlyPremium: 500 });

      const result = quickComparison(planA, planB);

      expect(result.cheaperMonthly).toBe('tie');
    });
  });

  describe('Summary', () => {
    it('should generate readable summary', () => {
      const planA = createBasePlan({ name: 'Silver PPO' });
      const planB = createBasePlan({ name: 'Gold HMO', monthlyPremium: 700 });

      const result = comparePlans(planA, planB);

      expect(result.summary).toBeDefined();
      expect(result.summary.length).toBeGreaterThan(50);
    });

    it('should mention winner plan in summary', () => {
      const planA = createBasePlan({ name: 'Budget Plan', monthlyPremium: 300 });
      const planB = createBasePlan({ name: 'Premium Plan', monthlyPremium: 800 });

      const result = comparePlans(planA, planB);

      // Summary should mention the winning plan
      expect(result.summary.includes('Budget Plan') || result.summary.includes('Premium Plan')).toBe(true);
    });
  });
});
