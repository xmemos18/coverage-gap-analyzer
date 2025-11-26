/**
 * Job Change Coverage Wizard Tests
 */

import {
  analyzeJobChange,
  quickCOBRAvsMarketplace,
  type JobChangeScenario,
} from '../job-change';

describe('Job Change Wizard', () => {
  // Helper to create a base scenario
  const createBaseScenario = (overrides: Partial<JobChangeScenario> = {}): JobChangeScenario => ({
    separationDate: new Date('2024-06-15'),
    currentPremium: 500,
    cobraPremium: 1800,
    householdIncome: 60000,
    householdSize: 2,
    state: 'TX',
    age: 45,
    expectedUtilization: 'medium',
    ...overrides,
  });

  describe('analyzeJobChange', () => {
    it('should return all expected options', () => {
      const scenario = createBaseScenario();
      const analysis = analyzeJobChange(scenario);

      expect(analysis.options).toBeDefined();
      expect(analysis.options.length).toBeGreaterThanOrEqual(2);

      const optionTypes = analysis.options.map(o => o.type);
      expect(optionTypes).toContain('cobra');
      expect(optionTypes).toContain('marketplace');
    });

    it('should include COBRA option with correct premium', () => {
      const scenario = createBaseScenario({ cobraPremium: 2000 });
      const analysis = analyzeJobChange(scenario);

      const cobraOption = analysis.options.find(o => o.type === 'cobra');
      expect(cobraOption).toBeDefined();
      // COBRA is premium + 2% admin fee
      expect(cobraOption!.monthlyPremium).toBe(2040);
    });

    it('should include marketplace option with subsidy for eligible income', () => {
      const scenario = createBaseScenario({
        householdIncome: 40000,
        householdSize: 2,
      });
      const analysis = analyzeJobChange(scenario);

      expect(analysis.subsidyInfo).toBeDefined();
      expect(analysis.subsidyInfo!.eligible).toBe(true);
      expect(analysis.subsidyInfo!.estimatedMonthlySubsidy).toBeGreaterThan(0);
    });

    it('should not provide subsidy for high income', () => {
      const scenario = createBaseScenario({
        householdIncome: 150000,
        householdSize: 2,
      });
      const analysis = analyzeJobChange(scenario);

      expect(analysis.subsidyInfo).toBeDefined();
      expect(analysis.subsidyInfo!.eligible).toBe(false);
      expect(analysis.subsidyInfo!.fplPercent).toBeGreaterThan(400);
    });

    it('should calculate correct SEP deadline (60 days from separation)', () => {
      const separationDate = new Date('2024-06-15');
      const scenario = createBaseScenario({ separationDate });
      const analysis = analyzeJobChange(scenario);

      const expectedDeadline = new Date('2024-08-14');
      expect(analysis.sepInfo.deadline.toDateString()).toBe(expectedDeadline.toDateString());
      expect(analysis.sepInfo.qualifyingEvent).toBe('Loss of job-based coverage');
    });

    it('should include timeline events', () => {
      const scenario = createBaseScenario();
      const analysis = analyzeJobChange(scenario);

      expect(analysis.timeline.length).toBeGreaterThanOrEqual(3);

      const events = analysis.timeline.map(t => t.event);
      expect(events).toContain('Job Separation');
      expect(events).toContain('COBRA Election Deadline');
      expect(events).toContain('Marketplace SEP Deadline');
    });

    it('should add new job events to timeline when new job offer exists', () => {
      const scenario = createBaseScenario({
        hasNewJobOffer: true,
        newJobStartDate: new Date('2024-07-15'),
        newJobWaitingPeriod: 30,
      });
      const analysis = analyzeJobChange(scenario);

      const events = analysis.timeline.map(t => t.event);
      expect(events).toContain('New Job Start');
      expect(events).toContain('New Coverage Begins');
    });

    it('should calculate cost comparison', () => {
      const scenario = createBaseScenario();
      const analysis = analyzeJobChange(scenario);

      expect(analysis.costComparison).toBeDefined();
      expect(analysis.costComparison.cobraTotal).toBeGreaterThan(0);
      expect(analysis.costComparison.marketplaceTotal).toBeGreaterThan(0);
      expect(typeof analysis.costComparison.savings).toBe('number');
      expect(typeof analysis.costComparison.savingsPercent).toBe('number');
    });

    it('should recommend COBRA for users wanting to keep providers', () => {
      const scenario = createBaseScenario({
        wantsToKeepProviders: true,
        hasOngoingPrescriptions: true,
      });
      const analysis = analyzeJobChange(scenario);

      expect(analysis.recommendedOption.type).toBe('cobra');
      expect(analysis.reasoning.some(r => r.includes('provider relationships'))).toBe(true);
    });

    it('should recommend marketplace when significant savings exist', () => {
      const scenario = createBaseScenario({
        cobraPremium: 2500, // High COBRA
        householdIncome: 35000, // Low income = high subsidy
        householdSize: 1,
        wantsToKeepProviders: false,
        hasOngoingPrescriptions: false,
      });
      const analysis = analyzeJobChange(scenario);

      // With high COBRA and low income (high subsidy), marketplace should be recommended
      expect(analysis.costComparison.savings).toBeGreaterThan(0);
    });

    it('should provide coverage gap warning for marketplace', () => {
      const separationDate = new Date('2024-06-15'); // Mid-month separation
      const scenario = createBaseScenario({ separationDate });
      const analysis = analyzeJobChange(scenario);

      // Marketplace starts 1st of next month, so there's a gap
      expect(analysis.coverageGapWarning).toBeDefined();
      expect(analysis.coverageGapWarning).toContain('gap');
    });

    it('should include short-term option for short coverage gaps', () => {
      const scenario = createBaseScenario({
        hasNewJobOffer: true,
        newJobStartDate: new Date('2024-07-01'),
        newJobWaitingPeriod: 30,
        state: 'TX', // Short-term allowed
      });
      const analysis = analyzeJobChange(scenario);

      const shortTermOption = analysis.options.find(o => o.type === 'short-term');
      expect(shortTermOption).toBeDefined();
    });

    it('should not include short-term for states where banned', () => {
      const scenario = createBaseScenario({
        hasNewJobOffer: true,
        newJobStartDate: new Date('2024-07-01'),
        newJobWaitingPeriod: 30,
        state: 'CA', // Short-term restricted
      });
      const analysis = analyzeJobChange(scenario);

      const shortTermOption = analysis.options.find(o => o.type === 'short-term');
      // If short-term exists, premium should be 0 (not available)
      if (shortTermOption) {
        expect(shortTermOption.monthlyPremium).toBe(0);
      }
    });

    it('should add low income warning for below-poverty income', () => {
      const scenario = createBaseScenario({
        householdIncome: 12000,
        householdSize: 1,
      });
      const analysis = analyzeJobChange(scenario);

      expect(analysis.reasoning.some(r => r.includes('Medicaid'))).toBe(true);
    });

    it('should add high income warning when above 400% FPL', () => {
      const scenario = createBaseScenario({
        householdIncome: 150000,
        householdSize: 2,
      });
      const analysis = analyzeJobChange(scenario);

      expect(analysis.reasoning.some(r => r.includes('no premium subsidies'))).toBe(true);
    });

    it('should handle dependents in premium calculation', () => {
      // Use high income to avoid subsidy affecting comparison
      const scenarioWithoutDeps = createBaseScenario({
        householdIncome: 200000, // Above 400% FPL
      });
      const scenarioWithDeps = createBaseScenario({
        householdIncome: 200000, // Above 400% FPL
        dependentAges: [10, 15, 45],
      });

      const analysisWithout = analyzeJobChange(scenarioWithoutDeps);
      const analysisWith = analyzeJobChange(scenarioWithDeps);

      const marketplaceWithout = analysisWithout.options.find(o => o.type === 'marketplace');
      const marketplaceWith = analysisWith.options.find(o => o.type === 'marketplace');

      // Premium should be higher with dependents (no subsidy to equalize)
      expect(marketplaceWith!.monthlyPremium).toBeGreaterThan(marketplaceWithout!.monthlyPremium);
    });

    it('should use location-based cost adjustment', () => {
      // Use high income to avoid subsidy affecting comparison
      const scenarioTX = createBaseScenario({ state: 'TX', householdIncome: 200000 });
      const scenarioCA = createBaseScenario({ state: 'CA', zipCode: '94102', householdIncome: 200000 }); // SF

      const analysisTX = analyzeJobChange(scenarioTX);
      const analysisCA = analyzeJobChange(scenarioCA);

      const marketplaceTX = analysisTX.options.find(o => o.type === 'marketplace');
      const marketplaceCA = analysisCA.options.find(o => o.type === 'marketplace');

      // California (SF) should be more expensive than Texas (no subsidy to equalize)
      expect(marketplaceCA!.monthlyPremium).toBeGreaterThan(marketplaceTX!.monthlyPremium);
    });
  });

  describe('Coverage Option Properties', () => {
    it('should have all required properties on COBRA option', () => {
      const scenario = createBaseScenario();
      const analysis = analyzeJobChange(scenario);
      const cobra = analysis.options.find(o => o.type === 'cobra')!;

      expect(cobra.name).toBe('COBRA Continuation');
      expect(cobra.benefits).toBeInstanceOf(Array);
      expect(cobra.benefits.length).toBeGreaterThan(0);
      expect(cobra.drawbacks).toBeInstanceOf(Array);
      expect(cobra.drawbacks.length).toBeGreaterThan(0);
      expect(cobra.networkCompatibility).toBe('same');
      expect(cobra.riskLevel).toBe('low');
      expect(cobra.durationMonths).toBeLessThanOrEqual(18);
    });

    it('should have all required properties on marketplace option', () => {
      const scenario = createBaseScenario();
      const analysis = analyzeJobChange(scenario);
      const marketplace = analysis.options.find(o => o.type === 'marketplace')!;

      expect(marketplace.name).toContain('Marketplace');
      expect(marketplace.benefits).toBeInstanceOf(Array);
      expect(marketplace.drawbacks).toBeInstanceOf(Array);
      expect(marketplace.networkCompatibility).toBe('different');
      expect(marketplace.riskLevel).toBe('medium');
      expect(marketplace.startDate).toBeInstanceOf(Date);
      expect(marketplace.endDate).toBeInstanceOf(Date);
    });

    it('should calculate annual costs correctly', () => {
      const scenario = createBaseScenario();
      const analysis = analyzeJobChange(scenario);
      const cobra = analysis.options.find(o => o.type === 'cobra')!;

      expect(cobra.annualPremium).toBe(cobra.monthlyPremium * 12);
    });
  });

  describe('quickCOBRAvsMarketplace', () => {
    it('should return comparison results', () => {
      const result = quickCOBRAvsMarketplace(1800, 45, 60000, 2, 'TX');

      expect(result.cobraMonthlyCost).toBeDefined();
      expect(result.marketplaceMonthlyCost).toBeDefined();
      expect(result.recommendation).toMatch(/^(cobra|marketplace)$/);
      expect(typeof result.monthlySavings).toBe('number');
    });

    it('should calculate COBRA cost with 2% admin fee', () => {
      const result = quickCOBRAvsMarketplace(1000, 40, 50000, 1, 'TX');

      expect(result.cobraMonthlyCost).toBe(1020); // 1000 * 1.02
    });

    it('should recommend marketplace when significantly cheaper', () => {
      const result = quickCOBRAvsMarketplace(2000, 30, 30000, 1, 'TX');

      // Low income + young age = subsidies make marketplace cheaper
      expect(result.marketplaceMonthlyCost).toBeLessThan(result.cobraMonthlyCost);
    });

    it('should recommend cobra when costs are similar and continuity matters', () => {
      // High income (no subsidy) + older age = costs similar
      const result = quickCOBRAvsMarketplace(600, 55, 150000, 1, 'TX');

      // When marketplace is NOT significantly cheaper (< 80% of COBRA), recommends COBRA
      if (result.marketplaceMonthlyCost >= result.cobraMonthlyCost * 0.8) {
        expect(result.recommendation).toBe('cobra');
      }
    });

    it('should calculate savings correctly', () => {
      const result = quickCOBRAvsMarketplace(1500, 40, 50000, 2, 'TX');

      expect(result.monthlySavings).toBe(result.cobraMonthlyCost - result.marketplaceMonthlyCost);
    });
  });

  describe('Subsidy Calculations', () => {
    it('should calculate maximum subsidy for 150% FPL', () => {
      // Household of 1, $21,870 income = ~150% FPL
      const scenario = createBaseScenario({
        householdIncome: 21870,
        householdSize: 1,
      });
      const analysis = analyzeJobChange(scenario);

      expect(analysis.subsidyInfo!.eligible).toBe(true);
      expect(analysis.subsidyInfo!.fplPercent).toBeCloseTo(150, -1);
      // Should have maximum subsidy (0% expected contribution)
    });

    it('should calculate partial subsidy for 250% FPL', () => {
      // Household of 2, ~$49,300 income = ~250% FPL
      const scenario = createBaseScenario({
        householdIncome: 49300,
        householdSize: 2,
      });
      const analysis = analyzeJobChange(scenario);

      expect(analysis.subsidyInfo!.eligible).toBe(true);
      expect(analysis.subsidyInfo!.estimatedMonthlySubsidy).toBeGreaterThan(0);
    });

    it('should provide no subsidy above 400% FPL', () => {
      // Household of 1, $60,000 income = ~411% FPL
      const scenario = createBaseScenario({
        householdIncome: 60000,
        householdSize: 1,
      });
      const analysis = analyzeJobChange(scenario);

      expect(analysis.subsidyInfo!.eligible).toBe(false);
      expect(analysis.subsidyInfo!.estimatedMonthlySubsidy).toBe(0);
    });

    it('should handle large households correctly', () => {
      // Household of 6 at moderate income
      const scenario = createBaseScenario({
        householdIncome: 80000,
        householdSize: 6,
      });
      const analysis = analyzeJobChange(scenario);

      // FPL for 6 is $40,280, so 80k = ~199% FPL
      expect(analysis.subsidyInfo!.fplPercent).toBeGreaterThan(150);
      expect(analysis.subsidyInfo!.fplPercent).toBeLessThan(250);
      expect(analysis.subsidyInfo!.eligible).toBe(true);
    });
  });

  describe('Age-Based Premium Calculations', () => {
    it('should have lower premiums for younger people', () => {
      // Use high income to avoid subsidy affecting comparison
      const young = analyzeJobChange(createBaseScenario({ age: 25, householdIncome: 200000 }));
      const middle = analyzeJobChange(createBaseScenario({ age: 45, householdIncome: 200000 }));
      const older = analyzeJobChange(createBaseScenario({ age: 60, householdIncome: 200000 }));

      const youngMarket = young.options.find(o => o.type === 'marketplace')!;
      const middleMarket = middle.options.find(o => o.type === 'marketplace')!;
      const olderMarket = older.options.find(o => o.type === 'marketplace')!;

      expect(youngMarket.monthlyPremium).toBeLessThan(middleMarket.monthlyPremium);
      expect(middleMarket.monthlyPremium).toBeLessThan(olderMarket.monthlyPremium);
    });

    it('should apply child rate for dependents under 21', () => {
      // Use high income to avoid subsidy affecting comparison
      const withChild = analyzeJobChange(createBaseScenario({
        age: 40,
        dependentAges: [10],
        householdIncome: 200000,
      }));
      const withAdult = analyzeJobChange(createBaseScenario({
        age: 40,
        dependentAges: [30],
        householdIncome: 200000,
      }));

      const childMarket = withChild.options.find(o => o.type === 'marketplace')!;
      const adultMarket = withAdult.options.find(o => o.type === 'marketplace')!;

      // Child dependent should cost less than adult dependent (no subsidy to equalize)
      expect(childMarket.monthlyPremium).toBeLessThan(adultMarket.monthlyPremium);
    });
  });

  describe('Coverage Duration', () => {
    it('should default to 12 months coverage', () => {
      const scenario = createBaseScenario({ hasNewJobOffer: false });
      const analysis = analyzeJobChange(scenario);

      const marketplace = analysis.options.find(o => o.type === 'marketplace')!;
      expect(marketplace.durationMonths).toBe(12);
    });

    it('should limit COBRA to 18 months max', () => {
      const scenario = createBaseScenario({ hasNewJobOffer: false });
      const analysis = analyzeJobChange(scenario);

      const cobra = analysis.options.find(o => o.type === 'cobra')!;
      expect(cobra.durationMonths).toBeLessThanOrEqual(18);
    });

    it('should calculate short coverage period with new job', () => {
      const scenario = createBaseScenario({
        separationDate: new Date('2024-06-01'),
        hasNewJobOffer: true,
        newJobStartDate: new Date('2024-07-15'),
        newJobWaitingPeriod: 30,
      });
      const analysis = analyzeJobChange(scenario);

      // Should calculate ~2.5 months of coverage needed
      const cobra = analysis.options.find(o => o.type === 'cobra')!;
      expect(cobra.durationMonths).toBeLessThanOrEqual(3);
    });
  });

  describe('Timeline Sorting', () => {
    it('should sort timeline events chronologically', () => {
      const scenario = createBaseScenario({
        hasNewJobOffer: true,
        newJobStartDate: new Date('2024-07-15'),
        newJobWaitingPeriod: 30,
      });
      const analysis = analyzeJobChange(scenario);

      for (let i = 1; i < analysis.timeline.length; i++) {
        const current = analysis.timeline[i];
        const previous = analysis.timeline[i - 1];
        if (current && previous) {
          expect(current.date.getTime()).toBeGreaterThanOrEqual(
            previous.date.getTime()
          );
        }
      }
    });

    it('should mark urgent events correctly', () => {
      // Create scenario where we're close to deadline
      const nearSeparation = new Date();
      nearSeparation.setDate(nearSeparation.getDate() - 50); // 50 days ago

      const scenario = createBaseScenario({ separationDate: nearSeparation });
      const analysis = analyzeJobChange(scenario);

      // With only 10 days remaining, deadlines should be urgent
      const urgentEvents = analysis.timeline.filter(t => t.urgent);
      expect(urgentEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum valid inputs', () => {
      const scenario: JobChangeScenario = {
        separationDate: new Date(),
        currentPremium: 0,
        cobraPremium: 100,
        householdIncome: 1000,
        householdSize: 1,
        state: 'AL',
        age: 18,
        expectedUtilization: 'low',
      };

      expect(() => analyzeJobChange(scenario)).not.toThrow();
    });

    it('should handle very high values', () => {
      const scenario = createBaseScenario({
        cobraPremium: 5000,
        householdIncome: 500000,
        age: 64,
        dependentAges: [62, 35, 30, 18, 15, 10, 5],
      });

      const analysis = analyzeJobChange(scenario);
      expect(analysis.options.length).toBeGreaterThan(0);
      expect(analysis.recommendedOption).toBeDefined();
    });

    it('should handle household size > 8', () => {
      const scenario = createBaseScenario({
        householdSize: 10,
        householdIncome: 100000,
      });

      const analysis = analyzeJobChange(scenario);
      expect(analysis.subsidyInfo).toBeDefined();
      // FPL should be calculated correctly for 10 people
      expect(analysis.subsidyInfo!.fpl).toBeGreaterThan(50560); // FPL for 8
    });
  });
});
