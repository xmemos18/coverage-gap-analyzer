/**
 * Scenario Comparison Tests
 */

import { createTestFormData } from '@/lib/test-utils';
import {
  compareScenarios,
  createScenario,
  generateCommonScenarios,
  type Scenario,
} from '../comparison';

describe('Scenario Comparison', () => {
  describe('createScenario', () => {
    it('should create a scenario with base form data', () => {
      const baseFormData = createTestFormData({
        numAdults: 2,
        adultAges: [35, 32],
      });

      const scenario = createScenario(
        'test-scenario',
        'Test Scenario',
        'A test scenario for testing',
        baseFormData
      );

      expect(scenario.id).toBe('test-scenario');
      expect(scenario.name).toBe('Test Scenario');
      expect(scenario.description).toBe('A test scenario for testing');
      expect(scenario.formData.numAdults).toBe(2);
    });

    it('should apply modifications to base form data', () => {
      const baseFormData = createTestFormData({
        numAdults: 1,
        hasEmployerInsurance: false,
      });

      const scenario = createScenario(
        'modified',
        'Modified Scenario',
        'With employer insurance',
        baseFormData,
        {
          hasEmployerInsurance: true,
          employerContribution: 400,
        }
      );

      expect(scenario.formData.hasEmployerInsurance).toBe(true);
      expect(scenario.formData.employerContribution).toBe(400);
    });
  });

  describe('generateCommonScenarios', () => {
    it('should generate baseline scenario', () => {
      const baseFormData = createTestFormData({
        numAdults: 1,
        adultAges: [40],
      });

      const { baseline } = generateCommonScenarios(baseFormData);

      expect(baseline.id).toBe('baseline');
      expect(baseline.name).toBe('Current Situation');
    });

    it('should generate high utilization alternative', () => {
      const baseFormData = createTestFormData({
        doctorVisitsPerYear: '0-2',
        hasChronicConditions: false,
      });

      const { alternatives } = generateCommonScenarios(baseFormData);
      const highUtil = alternatives.find(a => a.id === 'high-utilization');

      expect(highUtil).toBeDefined();
      expect(highUtil?.formData.doctorVisitsPerYear).toBe('6-10');
      expect(highUtil?.formData.hasChronicConditions).toBe(true);
    });

    it('should generate employer insurance alternative when not present', () => {
      const baseFormData = createTestFormData({
        hasEmployerInsurance: false,
      });

      const { alternatives } = generateCommonScenarios(baseFormData);
      const withEmployer = alternatives.find(a => a.id === 'with-employer');

      expect(withEmployer).toBeDefined();
      expect(withEmployer?.formData.hasEmployerInsurance).toBe(true);
    });

    it('should not generate employer alternative when already present', () => {
      const baseFormData = createTestFormData({
        hasEmployerInsurance: true,
        employerContribution: 500,
      });

      const { alternatives } = generateCommonScenarios(baseFormData);
      const withEmployer = alternatives.find(a => a.id === 'with-employer');

      expect(withEmployer).toBeUndefined();
    });

    it('should generate planned procedure alternative', () => {
      const baseFormData = createTestFormData({
        plannedProcedures: false,
      });

      const { alternatives } = generateCommonScenarios(baseFormData);
      const withProcedure = alternatives.find(a => a.id === 'planned-procedure');

      expect(withProcedure).toBeDefined();
      expect(withProcedure?.formData.plannedProcedures).toBe(true);
    });
  });

  describe('compareScenarios', () => {
    it('should compare two different scenarios', async () => {
      const baseFormData = createTestFormData({
        numAdults: 1,
        adultAges: [35],
        residences: [{ zip: '27601', state: 'NC', isPrimary: true, monthsPerYear: 12 }],
        incomeRange: '60k-80k',
      });

      const scenario1: Scenario = {
        id: 'low-cost',
        name: 'Low Cost Option',
        description: 'Minimal coverage needs',
        formData: { ...baseFormData, doctorVisitsPerYear: '0-2', hasChronicConditions: false },
      };

      const scenario2: Scenario = {
        id: 'high-coverage',
        name: 'High Coverage Option',
        description: 'Maximum coverage for chronic conditions',
        formData: { ...baseFormData, doctorVisitsPerYear: '10+', hasChronicConditions: true },
      };

      const result = await compareScenarios(scenario1, scenario2);

      expect(result.scenario1.scenario.id).toBe('low-cost');
      expect(result.scenario2.scenario.id).toBe('high-coverage');
      expect(result.differences.length).toBeGreaterThan(0);
      expect(result.insights.length).toBeGreaterThan(0);
      expect(typeof result.recommendation).toBe('string');
    });

    it('should identify differences between scenarios', async () => {
      const baseFormData = createTestFormData({
        numAdults: 1,
        adultAges: [40],
        residences: [{ zip: '90210', state: 'CA', isPrimary: true, monthsPerYear: 12 }],
      });

      const scenario1: Scenario = {
        id: 's1',
        name: 'Without Employer',
        description: 'No employer insurance',
        formData: { ...baseFormData, hasEmployerInsurance: false, employerContribution: 0 },
      };

      const scenario2: Scenario = {
        id: 's2',
        name: 'With Employer',
        description: 'Has employer insurance',
        formData: { ...baseFormData, hasEmployerInsurance: true, employerContribution: 350 },
      };

      const result = await compareScenarios(scenario1, scenario2);

      const employerDiff = result.differences.find(d => d.field === 'hasEmployerInsurance');
      expect(employerDiff).toBeDefined();
      expect(employerDiff?.scenario1Value).toBe('No');
      expect(employerDiff?.scenario2Value).toBe('Yes');
    });

    it('should calculate cost comparison', async () => {
      const baseFormData = createTestFormData({
        numAdults: 2,
        adultAges: [45, 42],
        residences: [{ zip: '33139', state: 'FL', isPrimary: true, monthsPerYear: 12 }],
        incomeRange: '80k-100k',
      });

      const scenario1: Scenario = {
        id: 's1',
        name: 'Baseline',
        description: 'Current situation',
        formData: baseFormData,
      };

      const scenario2: Scenario = {
        id: 's2',
        name: 'Higher Income',
        description: 'With higher income',
        formData: { ...baseFormData, incomeRange: 'over-150k' },
      };

      const result = await compareScenarios(scenario1, scenario2);

      expect(result.costComparison).toBeDefined();
      expect(typeof result.costComparison.monthlyPremiumDiff.averageDiff).toBe('number');
      expect(['1', '2', 'equal']).toContain(result.costComparison.cheaperScenario);
      expect(typeof result.costComparison.potentialAnnualSavings).toBe('number');
    });

    it('should calculate risk comparison', async () => {
      const baseFormData = createTestFormData({
        numAdults: 1,
        adultAges: [55],
        residences: [{ zip: '10001', state: 'NY', isPrimary: true, monthsPerYear: 12 }],
      });

      const scenario1: Scenario = {
        id: 's1',
        name: 'Healthy',
        description: 'No chronic conditions',
        formData: { ...baseFormData, hasChronicConditions: false, chronicConditions: [] },
      };

      const scenario2: Scenario = {
        id: 's2',
        name: 'With Conditions',
        description: 'Has chronic conditions',
        formData: {
          ...baseFormData,
          hasChronicConditions: true,
          chronicConditions: ['diabetes', 'hypertension'],
        },
      };

      const result = await compareScenarios(scenario1, scenario2);

      expect(result.riskComparison).toBeDefined();
      expect(typeof result.riskComparison.coverageScoreDiff).toBe('number');
      expect(['1', '2', 'equal']).toContain(result.riskComparison.betterCoverageScenario);
    });

    it('should provide recommendation', async () => {
      const baseFormData = createTestFormData({
        numAdults: 1,
        adultAges: [30],
        residences: [{ zip: '60601', state: 'IL', isPrimary: true, monthsPerYear: 12 }],
        budget: '200-400',
      });

      const scenario1: Scenario = {
        id: 's1',
        name: 'Basic',
        description: 'Basic coverage',
        formData: baseFormData,
      };

      const scenario2: Scenario = {
        id: 's2',
        name: 'Comprehensive',
        description: 'Comprehensive coverage',
        formData: { ...baseFormData, budget: '800-1000' },
      };

      const result = await compareScenarios(scenario1, scenario2);

      expect(result.recommendation).toBeDefined();
      expect(result.recommendation.length).toBeGreaterThan(20);
    });
  });

  describe('edge cases', () => {
    it('should handle identical scenarios', async () => {
      const formData = createTestFormData({
        numAdults: 1,
        adultAges: [40],
        residences: [{ zip: '94102', state: 'CA', isPrimary: true, monthsPerYear: 12 }],
      });

      const scenario1: Scenario = {
        id: 's1',
        name: 'Scenario 1',
        description: 'First scenario',
        formData,
      };

      const scenario2: Scenario = {
        id: 's2',
        name: 'Scenario 2',
        description: 'Identical scenario',
        formData: { ...formData },
      };

      const result = await compareScenarios(scenario1, scenario2);

      expect(result.differences.length).toBe(0);
      expect(result.costComparison.cheaperScenario).toBe('equal');
    });

    it('should handle scenarios with different states', async () => {
      const baseFormData = createTestFormData({
        numAdults: 1,
        adultAges: [35],
      });

      const scenario1: Scenario = {
        id: 's1',
        name: 'California',
        description: 'Living in California',
        formData: {
          ...baseFormData,
          residences: [{ zip: '90210', state: 'CA', isPrimary: true, monthsPerYear: 12 }],
        },
      };

      const scenario2: Scenario = {
        id: 's2',
        name: 'Texas',
        description: 'Living in Texas',
        formData: {
          ...baseFormData,
          residences: [{ zip: '75001', state: 'TX', isPrimary: true, monthsPerYear: 12 }],
        },
      };

      const result = await compareScenarios(scenario1, scenario2);

      const stateDiff = result.differences.find(d => d.field === 'residences');
      expect(stateDiff).toBeDefined();
      expect(stateDiff?.scenario1Value).toContain('CA');
      expect(stateDiff?.scenario2Value).toContain('TX');
    });

    it('should handle age differences', async () => {
      const baseFormData = createTestFormData({
        residences: [{ zip: '10001', state: 'NY', isPrimary: true, monthsPerYear: 12 }],
      });

      const scenario1: Scenario = {
        id: 'young',
        name: 'Young Adult',
        description: 'Age 25',
        formData: {
          ...baseFormData,
          numAdults: 1,
          adultAges: [25],
        },
      };

      const scenario2: Scenario = {
        id: 'older',
        name: 'Older Adult',
        description: 'Age 60',
        formData: {
          ...baseFormData,
          numAdults: 1,
          adultAges: [60],
        },
      };

      const result = await compareScenarios(scenario1, scenario2);

      const ageDiff = result.differences.find(d => d.field === 'adultAges');
      expect(ageDiff).toBeDefined();
      expect(ageDiff?.scenario1Value).toBe(25);
      expect(ageDiff?.scenario2Value).toBe(60);
      expect(ageDiff?.changeType).toBe('increase');
    });
  });
});
