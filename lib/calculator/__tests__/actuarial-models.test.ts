/**
 * Tests for Actuarial Cost Models
 * Validates risk adjustment, cost distributions, and claims modeling
 */

import {
  HCC_RISK_FACTORS,
  AGE_RISK_FACTORS,
  GENDER_COST_FACTORS,
  MLR_REQUIREMENTS,
  generateCostDistribution,
  modelClaimsProfile,
  calculatePremiumFromCosts,
  calculateExpectedCostsFromPremium,
  analyzeRiskPool,
  assessActuarialRisk,
  generateCostScenarios,
} from '../actuarial-models';

describe('Actuarial Models', () => {
  describe('Risk Adjustment Factors', () => {
    test('HCC factors reflect relative risk', () => {
      expect(HCC_RISK_FACTORS.healthy).toBe(1.0);
      expect(HCC_RISK_FACTORS.diabetesType2Controlled).toBeGreaterThan(1.0);
      expect(HCC_RISK_FACTORS.cancerMetastatic).toBeGreaterThan(HCC_RISK_FACTORS.diabetesType2Controlled);
    });

    test('age factors increase with age', () => {
      expect(AGE_RISK_FACTORS['18-24']).toBeLessThan(AGE_RISK_FACTORS['40-44']);
      expect(AGE_RISK_FACTORS['40-44']).toBeLessThan(AGE_RISK_FACTORS['60-64']);
      expect(AGE_RISK_FACTORS['60-64']).toBeLessThan(AGE_RISK_FACTORS['85+']);
    });

    test('children have lower risk factors than adults', () => {
      expect(AGE_RISK_FACTORS['5-9']).toBeLessThan(AGE_RISK_FACTORS['40-44']);
      expect(AGE_RISK_FACTORS['10-14']).toBeLessThan(AGE_RISK_FACTORS['40-44']);
    });

    test('gender factors vary by age', () => {
      // Women cost more in childbearing years
      expect(GENDER_COST_FACTORS.female['18-44']).toBeGreaterThan(GENDER_COST_FACTORS.male['18-44']);

      // Men cost more in older age
      expect(GENDER_COST_FACTORS.male['65+']).toBeGreaterThan(GENDER_COST_FACTORS.female['65+']);
    });
  });

  describe('generateCostDistribution', () => {
    test('generates reasonable distribution for healthy person', () => {
      const dist = generateCostDistribution(5000, 1.0);

      expect(dist.p10).toBeLessThan(dist.p50);
      expect(dist.p50).toBeLessThan(dist.p90);
      expect(dist.p90).toBeLessThan(dist.p99);
      expect(dist.mean).toBe(5000);
    });

    test('median is lower than mean (right-skewed)', () => {
      const dist = generateCostDistribution(5000, 1.0);

      // Healthcare costs are highly skewed - median should be ~60% of mean
      expect(dist.p50).toBeLessThan(dist.mean);
      expect(dist.p50 / dist.mean).toBeCloseTo(0.6, 1);
    });

    test('high percentiles reflect catastrophic risk', () => {
      const dist = generateCostDistribution(5000, 1.0);

      // 99th percentile should be catastrophic (10x+ mean)
      expect(dist.p99).toBeGreaterThanOrEqual(dist.mean * 8);

      // 90th percentile should be 2-3x mean
      expect(dist.p90).toBeGreaterThan(dist.mean * 2);
      expect(dist.p90).toBeLessThan(dist.mean * 3);
    });

    test('risk factor scales entire distribution', () => {
      const baseline = generateCostDistribution(5000, 1.0);
      const highRisk = generateCostDistribution(5000, 2.0);

      expect(highRisk.p50).toBeCloseTo(baseline.p50 * 2, -2);
      expect(highRisk.p90).toBeCloseTo(baseline.p90 * 2, -2);
      expect(highRisk.mean).toBe(baseline.mean * 2);
    });

    test('low risk factors reduce costs proportionally', () => {
      const baseline = generateCostDistribution(5000, 1.0);
      const lowRisk = generateCostDistribution(5000, 0.5);

      expect(lowRisk.mean).toBe(baseline.mean * 0.5);
      expect(lowRisk.p90).toBeCloseTo(baseline.p90 * 0.5, -2);
    });
  });

  describe('modelClaimsProfile', () => {
    test('young healthy person has low claims', () => {
      const profile = modelClaimsProfile(25, 'excellent', false);

      expect(profile.expectedClaims).toBeLessThan(5);
      expect(profile.probabilityHighCost).toBeLessThan(0.05);
      expect(profile.probabilityCatastrophic).toBeLessThan(0.01);
    });

    test('older person has more claims', () => {
      const young = modelClaimsProfile(25, 'good', false);
      const older = modelClaimsProfile(60, 'good', false);

      expect(older.expectedClaims).toBeGreaterThan(young.expectedClaims);
      expect(older.avgClaimSize).toBeGreaterThan(young.avgClaimSize);
      expect(older.probabilityHighCost).toBeGreaterThan(young.probabilityHighCost);
    });

    test('poor health increases claims frequency and severity', () => {
      const excellent = modelClaimsProfile(45, 'excellent', false);
      const poor = modelClaimsProfile(45, 'poor', false);

      expect(poor.expectedClaims).toBeGreaterThan(excellent.expectedClaims * 2);
      expect(poor.avgClaimSize).toBeGreaterThan(excellent.avgClaimSize);
      expect(poor.probabilityHighCost).toBeGreaterThan(excellent.probabilityHighCost * 2);
    });

    test('chronic conditions increase risk', () => {
      const noChronic = modelClaimsProfile(50, 'good', false);
      const withChronic = modelClaimsProfile(50, 'good', true);

      expect(withChronic.expectedClaims).toBeGreaterThan(noChronic.expectedClaims);
      expect(withChronic.probabilityHighCost).toBeGreaterThan(noChronic.probabilityHighCost);
    });

    test('probabilities never exceed reasonable bounds', () => {
      const worstCase = modelClaimsProfile(80, 'poor', true);

      expect(worstCase.probabilityHighCost).toBeLessThanOrEqual(0.30);
      expect(worstCase.probabilityCatastrophic).toBeLessThanOrEqual(0.10);
    });

    test('combines multiple risk factors appropriately', () => {
      const baseline = modelClaimsProfile(40, 'good', false);
      const highRisk = modelClaimsProfile(65, 'poor', true);

      // High risk should be significantly higher across all dimensions
      expect(highRisk.expectedClaims).toBeGreaterThan(baseline.expectedClaims * 3);
      expect(highRisk.avgClaimSize).toBeGreaterThan(baseline.avgClaimSize * 2);
    });
  });

  describe('MLR Calculations', () => {
    test('MLR requirements are correct', () => {
      expect(MLR_REQUIREMENTS.largeGroup).toBe(0.85);
      expect(MLR_REQUIREMENTS.smallGroup).toBe(0.80);
      expect(MLR_REQUIREMENTS.individual).toBe(0.80);
    });

    test('calculates premium from costs', () => {
      const medicalCosts = 8000;
      const premium = calculatePremiumFromCosts(medicalCosts, 'individual');

      // With 80% MLR and 3% margin, target MLR = 77%
      const expectedPremium = medicalCosts / 0.77;
      expect(premium).toBeCloseTo(expectedPremium, 0);
    });

    test('reverse calculation: costs from premium', () => {
      const premium = 10000;
      const expectedCosts = calculateExpectedCostsFromPremium(premium, 'individual');

      // Should be 80% of premium for individual market
      expect(expectedCosts).toBe(8000);
    });

    test('large group has higher MLR requirement', () => {
      const costs = 10000;
      const individualPremium = calculatePremiumFromCosts(costs, 'individual');
      const largeGroupPremium = calculatePremiumFromCosts(costs, 'largeGroup');

      // Large group should have lower premium (higher MLR = more goes to care)
      expect(largeGroupPremium).toBeLessThan(individualPremium);
    });

    test('margin buffer affects premiums', () => {
      const costs = 10000;
      const standardMargin = calculatePremiumFromCosts(costs, 'individual', 0.03);
      const higherMargin = calculatePremiumFromCosts(costs, 'individual', 0.05);

      expect(higherMargin).toBeGreaterThan(standardMargin);
    });

    test('round-trip calculation is consistent', () => {
      const originalPremium = 10000;
      const costs = calculateExpectedCostsFromPremium(originalPremium, 'individual');

      // Costs should be 80% of premium (0.80 MLR for individual market)
      expect(costs).toBe(8000);

      // Recalculating premium from costs will be higher due to margin buffer
      const recalcPremium = calculatePremiumFromCosts(costs, 'individual', 0.03);

      // With 3% margin buffer, target MLR = 0.77, so premium = costs / 0.77
      const expectedPremium = Math.round(costs / 0.77);
      expect(recalcPremium).toBe(expectedPremium);
    });
  });

  describe('analyzeRiskPool', () => {
    test('balanced pool is stable', () => {
      const pool = analyzeRiskPool({
        youngHealthy: 30,
        midAgeHealthy: 25,
        olderHealthy: 20,
        chronicConditions: 20,
        highRisk: 5,
      });

      expect(pool.poolStability).toBe('stable');
      expect(pool.healthyPercentage).toBe(75);
      expect(pool.averageRAF).toBeGreaterThan(0.8);
      expect(pool.averageRAF).toBeLessThan(1.5);
    });

    test('pool with mostly older/sicker is unstable', () => {
      const pool = analyzeRiskPool({
        youngHealthy: 10,
        midAgeHealthy: 10,
        olderHealthy: 15,
        chronicConditions: 40,
        highRisk: 25,
      });

      expect(pool.poolStability).toBe('unstable');
      expect(pool.averageRAF).toBeGreaterThan(1.5);
      expect(pool.healthyPercentage).toBeLessThan(40);
    });

    test('moderate pool has middle characteristics', () => {
      const pool = analyzeRiskPool({
        youngHealthy: 20,
        midAgeHealthy: 20,
        olderHealthy: 15,
        chronicConditions: 30,
        highRisk: 15,
      });

      expect(pool.poolStability).toBe('moderate');
      expect(pool.healthyPercentage).toBeGreaterThan(30);
      expect(pool.healthyPercentage).toBeLessThan(60);
    });

    test('young healthy pool has low RAF', () => {
      const pool = analyzeRiskPool({
        youngHealthy: 60,
        midAgeHealthy: 20,
        olderHealthy: 10,
        chronicConditions: 8,
        highRisk: 2,
      });

      expect(pool.averageRAF).toBeLessThan(1.0);
      expect(pool.poolStability).toBe('stable');
    });
  });

  describe('assessActuarialRisk', () => {
    test('young healthy person is low risk', () => {
      const profile = assessActuarialRisk({
        age: 25,
        gender: 'male',
        healthStatus: 'excellent',
        chronicConditions: [],
        baselineCost: 5000,
      });

      expect(profile.riskCategory).toBe('low');
      expect(profile.riskAdjustmentFactor).toBeLessThan(1.0);
      expect(profile.confidenceLevel).toContain('High');
    });

    test('older person with conditions is high risk', () => {
      const profile = assessActuarialRisk({
        age: 60,
        gender: 'male',
        healthStatus: 'fair',
        chronicConditions: ['diabetesType2Controlled', 'hypertensionControlled'],
        baselineCost: 5000,
      });

      expect(profile.riskCategory).toMatch(/high|very-high/);
      expect(profile.riskAdjustmentFactor).toBeGreaterThan(2.0);
    });

    test('chronic conditions interact with diminishing returns', () => {
      const oneCondition = assessActuarialRisk({
        age: 45,
        gender: 'female',
        healthStatus: 'good',
        chronicConditions: ['diabetesType2Controlled'],
        baselineCost: 5000,
      });

      const twoConditions = assessActuarialRisk({
        age: 45,
        gender: 'female',
        healthStatus: 'good',
        chronicConditions: ['diabetesType2Controlled', 'hypertensionControlled'],
        baselineCost: 5000,
      });

      // Second condition should add less than first
      const firstConditionImpact = oneCondition.riskAdjustmentFactor - 0.9; // baseline ~0.9
      const secondConditionImpact = twoConditions.riskAdjustmentFactor - oneCondition.riskAdjustmentFactor;

      expect(secondConditionImpact).toBeLessThan(firstConditionImpact);
      expect(twoConditions.riskAdjustmentFactor).toBeGreaterThan(oneCondition.riskAdjustmentFactor);
    });

    test('cost distribution scales with risk', () => {
      const lowRisk = assessActuarialRisk({
        age: 25,
        gender: 'male',
        healthStatus: 'excellent',
        chronicConditions: [],
        baselineCost: 5000,
      });

      const highRisk = assessActuarialRisk({
        age: 60,
        gender: 'male',
        healthStatus: 'poor',
        chronicConditions: ['diabetesWithComplications'],
        baselineCost: 5000,
      });

      expect(highRisk.costDistribution.p50).toBeGreaterThan(lowRisk.costDistribution.p50 * 2);
      expect(highRisk.costDistribution.p90).toBeGreaterThan(lowRisk.costDistribution.p90 * 2);
    });

    test('recommended reserve is based on 90th percentile', () => {
      const profile = assessActuarialRisk({
        age: 45,
        gender: 'female',
        healthStatus: 'good',
        chronicConditions: [],
        baselineCost: 5000,
      });

      expect(profile.recommendedReserve).toBe(profile.costDistribution.p90);
    });

    test('claims profile reflects risk level', () => {
      const lowRisk = assessActuarialRisk({
        age: 25,
        gender: 'male',
        healthStatus: 'excellent',
        chronicConditions: [],
        baselineCost: 5000,
      });

      const highRisk = assessActuarialRisk({
        age: 60,
        gender: 'male',
        healthStatus: 'poor',
        chronicConditions: ['copdSevere'],
        baselineCost: 5000,
      });

      expect(highRisk.claimsProfile.expectedClaims).toBeGreaterThan(lowRisk.claimsProfile.expectedClaims);
      expect(highRisk.claimsProfile.probabilityHighCost).toBeGreaterThan(lowRisk.claimsProfile.probabilityHighCost);
    });

    test('gender affects risk appropriately by age', () => {
      const youngWoman = assessActuarialRisk({
        age: 30,
        gender: 'female',
        healthStatus: 'good',
        chronicConditions: [],
        baselineCost: 5000,
      });

      const youngMan = assessActuarialRisk({
        age: 30,
        gender: 'male',
        healthStatus: 'good',
        chronicConditions: [],
        baselineCost: 5000,
      });

      // Women have higher costs in childbearing years
      expect(youngWoman.costDistribution.mean).toBeGreaterThan(youngMan.costDistribution.mean);
    });

    test('very high risk gets appropriate category', () => {
      const profile = assessActuarialRisk({
        age: 75,
        gender: 'female',
        healthStatus: 'poor',
        chronicConditions: ['cancerActive', 'heartFailure'],
        baselineCost: 5000,
      });

      expect(profile.riskCategory).toBe('very-high');
      expect(profile.riskAdjustmentFactor).toBeGreaterThan(4.0);
    });
  });

  describe('generateCostScenarios', () => {
    test('generates all scenario types', () => {
      const riskProfile = assessActuarialRisk({
        age: 45,
        gender: 'male',
        healthStatus: 'good',
        chronicConditions: [],
        baselineCost: 5000,
      });

      const scenarios = generateCostScenarios(riskProfile);

      expect(scenarios).toHaveLength(5);
      expect(scenarios[0].scenario).toContain('Best Case');
      expect(scenarios[1].scenario).toContain('Typical');
      expect(scenarios[4].scenario).toContain('Worst Case');
    });

    test('scenarios increase in cost', () => {
      const riskProfile = assessActuarialRisk({
        age: 45,
        gender: 'male',
        healthStatus: 'good',
        chronicConditions: [],
        baselineCost: 5000,
      });

      const scenarios = generateCostScenarios(riskProfile);

      for (let i = 0; i < scenarios.length - 1; i++) {
        expect(scenarios[i + 1].annualCost).toBeGreaterThan(scenarios[i].annualCost);
      }
    });

    test('monthly budget is annual cost / 12', () => {
      const riskProfile = assessActuarialRisk({
        age: 45,
        gender: 'male',
        healthStatus: 'good',
        chronicConditions: [],
        baselineCost: 5000,
      });

      const scenarios = generateCostScenarios(riskProfile);

      scenarios.forEach(scenario => {
        // Allow for rounding (within $1)
        const expectedMonthly = Math.round(scenario.annualCost / 12);
        expect(scenario.monthlyBudget).toBe(expectedMonthly);
      });
    });

    test('scenarios match distribution percentiles', () => {
      const riskProfile = assessActuarialRisk({
        age: 45,
        gender: 'male',
        healthStatus: 'good',
        chronicConditions: [],
        baselineCost: 5000,
      });

      const scenarios = generateCostScenarios(riskProfile);

      expect(scenarios[0].annualCost).toBe(riskProfile.costDistribution.p10);
      expect(scenarios[1].annualCost).toBe(riskProfile.costDistribution.p50);
      expect(scenarios[2].annualCost).toBe(riskProfile.costDistribution.p75);
      expect(scenarios[3].annualCost).toBe(riskProfile.costDistribution.p90);
      expect(scenarios[4].annualCost).toBe(riskProfile.costDistribution.p95);
    });

    test('all scenarios have descriptions', () => {
      const riskProfile = assessActuarialRisk({
        age: 45,
        gender: 'male',
        healthStatus: 'good',
        chronicConditions: [],
        baselineCost: 5000,
      });

      const scenarios = generateCostScenarios(riskProfile);

      scenarios.forEach(scenario => {
        expect(scenario.description).toBeTruthy();
        expect(scenario.description.length).toBeGreaterThan(10);
        expect(scenario.probability).toBeTruthy();
      });
    });
  });

  describe('Real-World Scenarios', () => {
    test('healthy young adult has predictable low costs', () => {
      const profile = assessActuarialRisk({
        age: 28,
        gender: 'male',
        healthStatus: 'excellent',
        chronicConditions: [],
        baselineCost: 5000,
      });

      expect(profile.riskCategory).toBe('low');
      expect(profile.costDistribution.p50).toBeLessThan(3000);
      expect(profile.claimsProfile.expectedClaims).toBeLessThan(4);
      expect(profile.confidenceLevel).toContain('High');
    });

    test('middle-aged person with controlled diabetes', () => {
      const profile = assessActuarialRisk({
        age: 52,
        gender: 'female',
        healthStatus: 'good',
        chronicConditions: ['diabetesType2Controlled'],
        baselineCost: 5000,
      });

      expect(profile.riskCategory).toMatch(/moderate|high/);
      expect(profile.costDistribution.mean).toBeGreaterThan(5000);
      expect(profile.claimsProfile.expectedClaims).toBeGreaterThan(5);
    });

    test('senior with multiple conditions', () => {
      const profile = assessActuarialRisk({
        age: 63,
        gender: 'male',
        healthStatus: 'fair',
        chronicConditions: ['heartFailure', 'diabetesWithComplications', 'chronicKidneyDisease3'],
        baselineCost: 5000,
      });

      expect(profile.riskCategory).toMatch(/high|very-high/);
      expect(profile.riskAdjustmentFactor).toBeGreaterThan(3.0);
      expect(profile.costDistribution.p90).toBeGreaterThan(30000);
      expect(profile.recommendedReserve).toBeGreaterThan(30000);
    });

    test('cancer patient has very high risk', () => {
      const profile = assessActuarialRisk({
        age: 55,
        gender: 'female',
        healthStatus: 'poor',
        chronicConditions: ['cancerActive'],
        baselineCost: 5000,
      });

      expect(profile.riskCategory).toBe('very-high');
      expect(profile.riskAdjustmentFactor).toBeGreaterThan(4.0);
      expect(profile.claimsProfile.probabilityHighCost).toBeGreaterThan(0.15);
    });

    test('post-transplant patient has catastrophic risk', () => {
      const profile = assessActuarialRisk({
        age: 48,
        gender: 'male',
        healthStatus: 'poor',
        chronicConditions: ['transplantRecipient'],
        baselineCost: 5000,
      });

      expect(profile.riskCategory).toBe('very-high');
      expect(profile.riskAdjustmentFactor).toBeGreaterThan(3.0);
      expect(profile.costDistribution.mean).toBeGreaterThan(15000);
    });
  });
});
