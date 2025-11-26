import { analyzeInsurance } from '../calculator';
import { CalculatorFormData } from '@/types';

describe('Insurance Calculator Engine', () => {
  // Helper function to create base form data
  const createBaseFormData = (overrides: Partial<CalculatorFormData> = {}): CalculatorFormData => ({
    residences: [
      { state: 'NY', zip: '10001', isPrimary: true, monthsPerYear: 6 },
      { state: 'FL', zip: '33101', isPrimary: false, monthsPerYear: 6 },
    ],
    adultAges: [45],
    numAdults: 1,
    childAges: [],
    numChildren: 0,
    hasMedicareEligible: false,
    budget: '1000-2000',
    hasEmployerInsurance: false,
    employerContribution: 0,
    hasChronicConditions: false,
    chronicConditions: [],
    prescriptionCount: '',
    providerPreference: '',
    hasCurrentInsurance: false,
    currentInsurance: {
      carrier: '',
      planType: '',
      monthlyCost: 0,
      deductible: 0,
      outOfPocketMax: 0,
      coverageNotes: '',
    },
    incomeRange: '',
    currentStep: 5,
    simpleMode: false,
    interestedInAddOns: true,
    ...overrides,
  });

  describe('Medicare-Eligible Households (all adults 65+)', () => {
    it('should recommend Medicare + Medigap for single Medicare-eligible adult', async () => {
      const formData = createBaseFormData({
        adultAges: [70],
        hasMedicareEligible: true,
      });

      const result = await analyzeInsurance(formData);

      expect(result.recommendedInsurance).toBe('Basic Medicare + Extra Coverage');
      expect(result.householdBreakdown).toContain('1 Medicare-eligible adult');
      // Costs adjusted for NY (1.30) + FL (0.98) average = 1.14x multiplier
      expect(result.estimatedMonthlyCost.low).toBe(342); // 300 * 1.14
      expect(result.estimatedMonthlyCost.high).toBe(570); // 500 * 1.14
      expect(result.coverageGapScore).toBe(90);
    });

    it('should calculate costs correctly for multiple Medicare-eligible adults', async () => {
      const formData = createBaseFormData({
        adultAges: [70, 68, 72],
        numAdults: 3,
        hasMedicareEligible: true,
      });

      const result = await analyzeInsurance(formData);

      expect(result.recommendedInsurance).toBe('Basic Medicare + Extra Coverage');
      expect(result.householdBreakdown).toContain('3 Medicare-eligible adults');
      // Costs adjusted for NY (1.30) + FL (0.98) average = 1.14x multiplier
      expect(result.estimatedMonthlyCost.low).toBe(1026); // 900 * 1.14
      expect(result.estimatedMonthlyCost.high).toBe(1710); // 1500 * 1.14
    });

    it('should include action items for Medicare enrollment', async () => {
      const formData = createBaseFormData({
        adultAges: [65],
        hasMedicareEligible: true,
      });

      const result = await analyzeInsurance(formData);

      expect(result.actionItems.some(item => item.includes('Medigap'))).toBe(true);
      expect(result.actionItems.some(item => item.includes('Plan G') || item.includes('Plan N'))).toBe(true);
      expect(result.actionItems.some(item => item.includes('Part D') || item.includes('prescription'))).toBe(true);
    });

    it('should provide multi-state reasoning for 3+ states', async () => {
      const formData = createBaseFormData({
        residences: [
          { state: 'NY', zip: '10001', isPrimary: true, monthsPerYear: 4 },
          { state: 'FL', zip: '33101', isPrimary: false, monthsPerYear: 4 },
          { state: 'CA', zip: '90001', isPrimary: false, monthsPerYear: 4 },
        ],
        adultAges: [70],
        hasMedicareEligible: true,
      });

      const result = await analyzeInsurance(formData);

      expect(result.reasoning).toContain('3 of your states');
    });

    it('should include Medicare Advantage as alternative option', async () => {
      const formData = createBaseFormData({
        adultAges: [68],
        hasMedicareEligible: true,
      });

      const result = await analyzeInsurance(formData);

      expect(result.alternativeOptions).toBeDefined();
      expect(result.alternativeOptions!.length).toBeGreaterThan(0);

      const medicareAdvantage = result.alternativeOptions!.find(
        opt => opt.name === 'Medicare Advantage'
      );
      expect(medicareAdvantage).toBeDefined();
      expect(medicareAdvantage!.cons.some(con => con.includes('network'))).toBe(true);
    });
  });

  describe('Mixed Households (some Medicare-eligible, some not)', () => {
    it('should recommend Medicare + PPO for mixed household', async () => {
      const formData = createBaseFormData({
        adultAges: [70, 45],
        hasMedicareEligible: true,
      });

      const result = await analyzeInsurance(formData);

      expect(result.recommendedInsurance).toContain('Medicare + Extra Coverage');
      expect(result.recommendedInsurance).toContain('Nationwide Flexible Plan');
      expect(result.householdBreakdown).toContain('1 Medicare-eligible');
      expect(result.householdBreakdown).toContain('1 under-65 adult');
    });

    it('should calculate mixed household costs correctly', async () => {
      const formData = createBaseFormData({
        adultAges: [70, 45],
        childAges: [10, 12],
        hasMedicareEligible: true,
      });

      const result = await analyzeInsurance(formData);

      // 1 Medicare (300-500) + 1 Adult (600-900) + 2 Children (600-800)
      // Costs adjusted for NY (1.30) + FL (0.98) average = 1.14x multiplier
      expect(result.estimatedMonthlyCost.low).toBe(1710); // 1500 * 1.14
      expect(result.estimatedMonthlyCost.high).toBe(2508); // 2200 * 1.14
    });

    it('should include action items for both Medicare and PPO', async () => {
      const formData = createBaseFormData({
        adultAges: [68, 42],
        hasMedicareEligible: true,
      });

      const result = await analyzeInsurance(formData);

      expect(result.actionItems.some(item => item.includes('Medicare + Medigap'))).toBe(true);
      expect(result.actionItems.some(item => item.includes('National PPO'))).toBe(true);
    });

    it('should mention children in action items if present', async () => {
      const formData = createBaseFormData({
        adultAges: [70, 45],
        childAges: [8],
        hasMedicareEligible: true,
      });

      const result = await analyzeInsurance(formData);

      expect(result.actionItems.some(item => item.includes('1 child'))).toBe(true);
    });
  });

  describe('Non-Medicare Households (all under 65)', () => {
    it('should recommend individual plan for single adult', async () => {
      const formData = createBaseFormData({
        adultAges: [35],
      });

      const result = await analyzeInsurance(formData);

      expect(result.recommendedInsurance).toBe('Nationwide Flexible Plan');
      expect(result.householdBreakdown).toBe('1 adult');
      // Costs adjusted based on state cost multipliers
      expect(result.estimatedMonthlyCost.low).toBe(547);
      expect(result.estimatedMonthlyCost.high).toBe(821);
    });

    it('should recommend couples plan for 2 adults', async () => {
      const formData = createBaseFormData({
        adultAges: [35, 38],
      });

      const result = await analyzeInsurance(formData);

      expect(result.recommendedInsurance).toBe('Nationwide Flexible Plan for Couples');
      expect(result.householdBreakdown).toBe('2 adults');
      // Costs adjusted based on state cost multipliers
      expect(result.estimatedMonthlyCost.low).toBe(1094);
      expect(result.estimatedMonthlyCost.high).toBe(1642);
    });

    it('should recommend family plan with children', async () => {
      const formData = createBaseFormData({
        adultAges: [35, 38],
        childAges: [8, 10],
      });

      const result = await analyzeInsurance(formData);

      expect(result.recommendedInsurance).toBe('Nationwide Flexible Family Plan');
      expect(result.householdBreakdown).toBe('2 adults, 2 children');
      // Costs adjusted based on state cost multipliers
      expect(result.estimatedMonthlyCost.low).toBe(1642);
      expect(result.estimatedMonthlyCost.high).toBe(2280);
    });

    it('should add cost for additional children beyond 2', async () => {
      const formData = createBaseFormData({
        adultAges: [35, 38],
        childAges: [8, 10, 12, 14], // 4 children
      });

      const result = await analyzeInsurance(formData);

      expect(result.householdBreakdown).toBe('2 adults, 4 children');
      // Costs adjusted based on state cost multipliers
      expect(result.estimatedMonthlyCost.low).toBe(2189);
      expect(result.estimatedMonthlyCost.high).toBe(3010);
    });

    it('should adjust cost for single parent', async () => {
      const formData = createBaseFormData({
        adultAges: [35],
        childAges: [8, 10],
      });

      const result = await analyzeInsurance(formData);

      expect(result.householdBreakdown).toBe('1 adult, 2 children');
      // Costs adjusted based on state cost multipliers
      expect(result.estimatedMonthlyCost.low).toBe(1094);
      expect(result.estimatedMonthlyCost.high).toBe(1459);
    });

    it('should handle multiple adults without children', async () => {
      const formData = createBaseFormData({
        adultAges: [25, 28, 30], // 3 roommates
      });

      const result = await analyzeInsurance(formData);

      expect(result.recommendedInsurance).toBe('Nationwide Flexible Plan for 3 adults');
      expect(result.householdBreakdown).toBe('3 adults');
      // Costs adjusted based on state cost multipliers
      expect(result.estimatedMonthlyCost.low).toBe(1642);
      expect(result.estimatedMonthlyCost.high).toBe(2462);
    });

    it('should include national PPO action items', async () => {
      const formData = createBaseFormData({
        adultAges: [40],
      });

      const result = await analyzeInsurance(formData);

      // Updated to match new marketplace-focused action items
      expect(result.actionItems.some(item => item.includes('Marketplace'))).toBe(true);
      expect(result.actionItems.some(item => item.includes('Bronze') || item.includes('Silver') || item.includes('Gold'))).toBe(true);
    });

    it('should include HDHP with HSA as alternative', async () => {
      const formData = createBaseFormData({
        adultAges: [30],
      });

      const result = await analyzeInsurance(formData);

      const hdhp = result.alternativeOptions!.find(
        opt => opt.name.includes('High-Deductible')
      );
      expect(hdhp).toBeDefined();
      expect(hdhp!.pros.some(pro => pro.includes('HSA'))).toBe(true);
    });
  });

  describe('Coverage Score Calculation', () => {
    it('should return 90 for single state', async () => {
      const formData = createBaseFormData({
        residences: [{ state: 'NY', zip: '10001', isPrimary: true, monthsPerYear: 12 }],
        adultAges: [45],
      });

      const result = await analyzeInsurance(formData);
      expect(result.coverageGapScore).toBe(90);
    });

    it('should return 85 for popular states', async () => {
      const formData = createBaseFormData({
        residences: [
          { state: 'NY', zip: '10001', isPrimary: true, monthsPerYear: 6 },
          { state: 'FL', zip: '33101', isPrimary: false, monthsPerYear: 6 },
        ],
        adultAges: [45],
      });

      const result = await analyzeInsurance(formData);
      expect(result.coverageGapScore).toBe(85);
    });

    it('should return 75 for adjacent states', async () => {
      const formData = createBaseFormData({
        residences: [
          { state: 'NY', zip: '10001', isPrimary: true, monthsPerYear: 6 },
          { state: 'NJ', zip: '07001', isPrimary: false, monthsPerYear: 6 },
        ],
        adultAges: [45],
      });

      const result = await analyzeInsurance(formData);
      expect(result.coverageGapScore).toBe(75);
    });

    it('should return 80 for 5+ states (with non-popular states)', async () => {
      const formData = createBaseFormData({
        residences: [
          { state: 'ME', zip: '04001', isPrimary: true, monthsPerYear: 2 },
          { state: 'VT', zip: '05001', isPrimary: false, monthsPerYear: 2 },
          { state: 'NH', zip: '03001', isPrimary: false, monthsPerYear: 2 },
          { state: 'RI', zip: '02801', isPrimary: false, monthsPerYear: 3 },
          { state: 'DE', zip: '19701', isPrimary: false, monthsPerYear: 3 },
        ],
        adultAges: [45],
      });

      const result = await analyzeInsurance(formData);
      expect(result.coverageGapScore).toBe(80);
    });

    it('should return 85 for 5+ popular states', async () => {
      const formData = createBaseFormData({
        residences: [
          { state: 'NY', zip: '10001', isPrimary: true, monthsPerYear: 2 },
          { state: 'FL', zip: '33101', isPrimary: false, monthsPerYear: 3 },
          { state: 'CA', zip: '90001', isPrimary: false, monthsPerYear: 3 },
          { state: 'TX', zip: '75001', isPrimary: false, monthsPerYear: 2 },
          { state: 'AZ', zip: '85001', isPrimary: false, monthsPerYear: 2 },
        ],
        adultAges: [45],
      });

      const result = await analyzeInsurance(formData);
      expect(result.coverageGapScore).toBe(85);
    });
  });

  describe('Budget Compatibility', () => {
    it('should warn when budget is too low', async () => {
      const formData = createBaseFormData({
        adultAges: [45, 48],
        childAges: [10, 12],
        budget: 'less-500', // Budget: $500, Estimate: $1800-2500
      });

      const result = await analyzeInsurance(formData);

      const budgetWarning = result.actionItems.find(item =>
        item.includes('budget is lower') && item.includes('healthcare.gov')
      );
      expect(budgetWarning).toBeDefined();
    });

    it('should suggest concierge medicine for "not-sure" budget', async () => {
      const formData = createBaseFormData({
        adultAges: [45],
        budget: 'not-sure',
      });

      const result = await analyzeInsurance(formData);

      const conciergeItem = result.actionItems.find(item =>
        item.includes('concierge medicine')
      );
      expect(conciergeItem).toBeDefined();
    });

    it('should not add budget note when budget is sufficient', async () => {
      const formData = createBaseFormData({
        adultAges: [45],
        budget: '1000-2000', // Budget sufficient for single adult (600-900)
      });

      const result = await analyzeInsurance(formData);

      const budgetNote = result.actionItems.find(item =>
        item.includes('budget') || item.includes('healthcare.gov')
      );
      expect(budgetNote).toBeUndefined();
    });
  });

  describe('Current Insurance Comparison', () => {
    it('should add current insurance summary when provided', async () => {
      const formData = createBaseFormData({
        adultAges: [45],
        hasCurrentInsurance: true,
        currentInsurance: {
          carrier: 'Blue Cross',
          planType: 'HMO',
          monthlyCost: 1200,
          deductible: 3000,
          outOfPocketMax: 8000,
          coverageNotes: '',
        },
      });

      const result = await analyzeInsurance(formData);

      expect(result.currentInsuranceSummary).toBeDefined();
      expect(result.currentInsuranceSummary).toContain('Blue Cross');
      expect(result.currentInsuranceSummary).toContain('HMO');
      expect(result.currentInsuranceSummary).toContain('$1200/month');
    });

    it('should calculate cost savings correctly', async () => {
      const formData = createBaseFormData({
        adultAges: [45],
        hasCurrentInsurance: true,
        currentInsurance: {
          carrier: 'Blue Cross',
          planType: 'PPO',
          monthlyCost: 1200, // Current: $1200, Recommended: $600-900 (avg $750)
          deductible: 3000,
          outOfPocketMax: 8000,
          coverageNotes: '',
        },
      });

      const result = await analyzeInsurance(formData);

      expect(result.costComparison).toBeDefined();
      expect(result.costComparison!.current).toBe(1200);
      expect(result.costComparison!.monthlySavings).toBeGreaterThan(0);
      expect(result.costComparison!.annualSavings).toBeGreaterThan(0);
    });

    it('should generate suggestions for cost savings', async () => {
      const formData = createBaseFormData({
        adultAges: [45],
        hasCurrentInsurance: true,
        currentInsurance: {
          carrier: 'Blue Cross',
          planType: 'PPO',
          monthlyCost: 1200,
          deductible: 3000,
          outOfPocketMax: 8000,
          coverageNotes: '',
        },
      });

      const result = await analyzeInsurance(formData);

      expect(result.suggestions).toBeDefined();
      const costSavingSuggestion = result.suggestions!.find(
        s => s.type === 'cost-savings'
      );
      expect(costSavingSuggestion).toBeDefined();
      expect(costSavingSuggestion!.priority).toBe('high');
    });

    it('should warn about HMO network limitations', async () => {
      const formData = createBaseFormData({
        adultAges: [45],
        hasCurrentInsurance: true,
        currentInsurance: {
          carrier: 'Kaiser',
          planType: 'HMO',
          monthlyCost: 800,
          deductible: 2000,
          outOfPocketMax: 6000,
          coverageNotes: '',
        },
      });

      const result = await analyzeInsurance(formData);

      const networkSuggestion = result.suggestions!.find(
        s => s.type === 'network-expansion'
      );
      expect(networkSuggestion).toBeDefined();
      expect(networkSuggestion!.title).toContain('Limited Network');
    });

    it('should suggest Medicare enrollment for eligible users', async () => {
      const formData = createBaseFormData({
        adultAges: [68],
        hasMedicareEligible: true,
        hasCurrentInsurance: true,
        currentInsurance: {
          carrier: 'Blue Cross',
          planType: 'PPO',
          monthlyCost: 1000,
          deductible: 3000,
          outOfPocketMax: 8000,
          coverageNotes: '',
        },
      });

      const result = await analyzeInsurance(formData);

      const medicareSuggestion = result.suggestions!.find(
        s => s.type === 'coverage-improvement' && s.title.includes('Medicare Eligibility')
      );
      expect(medicareSuggestion).toBeDefined();
    });

    it('should warn about high deductibles', async () => {
      const formData = createBaseFormData({
        adultAges: [45],
        hasCurrentInsurance: true,
        currentInsurance: {
          carrier: 'Generic',
          planType: 'HDHP',
          monthlyCost: 500,
          deductible: 7000, // High deductible
          outOfPocketMax: 9000,
          coverageNotes: '',
        },
      });

      const result = await analyzeInsurance(formData);

      const deductibleSuggestion = result.suggestions!.find(
        s => s.title.includes('High Deductible')
      );
      expect(deductibleSuggestion).toBeDefined();
    });

    it('should identify improvement areas', async () => {
      const formData = createBaseFormData({
        adultAges: [45],
        hasCurrentInsurance: true,
        currentInsurance: {
          carrier: 'Kaiser',
          planType: 'HMO',
          monthlyCost: 1200,
          deductible: 6000,
          outOfPocketMax: 12000,
          coverageNotes: '',
        },
      });

      const result = await analyzeInsurance(formData);

      expect(result.improvementAreas).toBeDefined();
      expect(result.improvementAreas!).toContain('Multi-state network coverage');
      expect(result.improvementAreas!).toContain('Monthly premium costs');
      expect(result.improvementAreas!).toContain('Lower deductible options');
      expect(result.improvementAreas!).toContain('Out-of-pocket maximum protection');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty states array gracefully', async () => {
      const formData = createBaseFormData({
        residences: [
          { state: '', zip: '', isPrimary: true, monthsPerYear: 12 },
        ],
        adultAges: [45],
      });

      const result = await analyzeInsurance(formData);

      // Should still provide a recommendation
      expect(result.recommendedInsurance).toBeDefined();
      expect(result.coverageGapScore).toBe(50); // Empty states = score 50
    });

    it('should handle very large household', async () => {
      const formData = createBaseFormData({
        adultAges: [30, 32, 35, 38, 40],
        childAges: [2, 4, 6, 8, 10, 12],
      });

      const result = await analyzeInsurance(formData);

      expect(result.recommendedInsurance).toBeDefined();
      expect(result.estimatedMonthlyCost).toBeDefined();
      expect(result.estimatedMonthlyCost.low).toBeGreaterThan(0);
    });

    it('should handle maximum age (100)', async () => {
      const formData = createBaseFormData({
        adultAges: [100],
        hasMedicareEligible: true,
      });

      const result = await analyzeInsurance(formData);

      expect(result.recommendedInsurance).toBe('Basic Medicare + Extra Coverage');
    });

    it('should handle newborn children (age 0)', async () => {
      const formData = createBaseFormData({
        adultAges: [30, 32],
        childAges: [0], // Newborn
      });

      const result = await analyzeInsurance(formData);

      expect(result.householdBreakdown).toContain('1 child');
      expect(result.recommendedInsurance).toBe('Nationwide Flexible Family Plan');
    });

    it('should handle 17-year-old children', async () => {
      const formData = createBaseFormData({
        adultAges: [45],
        childAges: [17],
      });

      const result = await analyzeInsurance(formData);

      expect(result.householdBreakdown).toContain('1 child');
    });
  });
});
