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
    ...overrides,
  });

  describe('Medicare-Eligible Households (all adults 65+)', () => {
    it('should recommend Medicare + Medigap for single Medicare-eligible adult', () => {
      const formData = createBaseFormData({
        adultAges: [70],
        hasMedicareEligible: true,
      });

      const result = analyzeInsurance(formData);

      expect(result.recommendedInsurance).toBe('Basic Medicare + Extra Coverage');
      expect(result.householdBreakdown).toContain('1 Medicare-eligible adult');
      expect(result.estimatedMonthlyCost.low).toBe(300);
      expect(result.estimatedMonthlyCost.high).toBe(500);
      expect(result.coverageGapScore).toBe(90);
    });

    it('should calculate costs correctly for multiple Medicare-eligible adults', () => {
      const formData = createBaseFormData({
        adultAges: [70, 68, 72],
        numAdults: 3,
        hasMedicareEligible: true,
      });

      const result = analyzeInsurance(formData);

      expect(result.recommendedInsurance).toBe('Basic Medicare + Extra Coverage');
      expect(result.householdBreakdown).toContain('3 Medicare-eligible adults');
      expect(result.estimatedMonthlyCost.low).toBe(900); // 3 * 300
      expect(result.estimatedMonthlyCost.high).toBe(1500); // 3 * 500
    });

    it('should include action items for Medicare enrollment', () => {
      const formData = createBaseFormData({
        adultAges: [65],
        hasMedicareEligible: true,
      });

      const result = analyzeInsurance(formData);

      expect(result.actionItems.some(item => item.includes('Medigap'))).toBe(true);
      expect(result.actionItems.some(item => item.includes('Plan G') || item.includes('Plan N'))).toBe(true);
      expect(result.actionItems.some(item => item.includes('Part D') || item.includes('prescription'))).toBe(true);
    });

    it('should provide multi-state reasoning for 3+ states', () => {
      const formData = createBaseFormData({
        residences: [
          { state: 'NY', zip: '10001', isPrimary: true },
          { state: 'FL', zip: '33101', isPrimary: false },
          { state: 'CA', zip: '90001', isPrimary: false },
        ],
        adultAges: [70],
        hasMedicareEligible: true,
      });

      const result = analyzeInsurance(formData);

      expect(result.reasoning).toContain('3 of your states');
    });

    it('should include Medicare Advantage as alternative option', () => {
      const formData = createBaseFormData({
        adultAges: [68],
        hasMedicareEligible: true,
      });

      const result = analyzeInsurance(formData);

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
    it('should recommend Medicare + PPO for mixed household', () => {
      const formData = createBaseFormData({
        adultAges: [70, 45],
        hasMedicareEligible: true,
      });

      const result = analyzeInsurance(formData);

      expect(result.recommendedInsurance).toContain('Medicare + Extra Coverage');
      expect(result.recommendedInsurance).toContain('Nationwide Flexible Plan');
      expect(result.householdBreakdown).toContain('1 Medicare-eligible');
      expect(result.householdBreakdown).toContain('1 under-65 adult');
    });

    it('should calculate mixed household costs correctly', () => {
      const formData = createBaseFormData({
        adultAges: [70, 45],
        childAges: [10, 12],
        hasMedicareEligible: true,
      });

      const result = analyzeInsurance(formData);

      // 1 Medicare (300-500) + 1 Adult (600-900) + 2 Children (600-800)
      expect(result.estimatedMonthlyCost.low).toBe(1500); // 300 + 600 + 600
      expect(result.estimatedMonthlyCost.high).toBe(2200); // 500 + 900 + 800
    });

    it('should include action items for both Medicare and PPO', () => {
      const formData = createBaseFormData({
        adultAges: [68, 42],
        hasMedicareEligible: true,
      });

      const result = analyzeInsurance(formData);

      expect(result.actionItems.some(item => item.includes('Medicare + Medigap'))).toBe(true);
      expect(result.actionItems.some(item => item.includes('National PPO'))).toBe(true);
    });

    it('should mention children in action items if present', () => {
      const formData = createBaseFormData({
        adultAges: [70, 45],
        childAges: [8],
        hasMedicareEligible: true,
      });

      const result = analyzeInsurance(formData);

      expect(result.actionItems.some(item => item.includes('1 child'))).toBe(true);
    });
  });

  describe('Non-Medicare Households (all under 65)', () => {
    it('should recommend individual plan for single adult', () => {
      const formData = createBaseFormData({
        adultAges: [35],
      });

      const result = analyzeInsurance(formData);

      expect(result.recommendedInsurance).toBe('Nationwide Flexible Plan');
      expect(result.householdBreakdown).toBe('1 adult');
      expect(result.estimatedMonthlyCost.low).toBe(600);
      expect(result.estimatedMonthlyCost.high).toBe(900);
    });

    it('should recommend couples plan for 2 adults', () => {
      const formData = createBaseFormData({
        adultAges: [35, 38],
      });

      const result = analyzeInsurance(formData);

      expect(result.recommendedInsurance).toBe('Nationwide Flexible Plan for Couples');
      expect(result.householdBreakdown).toBe('2 adults');
      expect(result.estimatedMonthlyCost.low).toBe(1200);
      expect(result.estimatedMonthlyCost.high).toBe(1800);
    });

    it('should recommend family plan with children', () => {
      const formData = createBaseFormData({
        adultAges: [35, 38],
        childAges: [8, 10],
      });

      const result = analyzeInsurance(formData);

      expect(result.recommendedInsurance).toBe('Nationwide Flexible Family Plan');
      expect(result.householdBreakdown).toBe('2 adults, 2 children');
      // Base cost for 2 adults + 2 kids
      expect(result.estimatedMonthlyCost.low).toBe(1800);
      expect(result.estimatedMonthlyCost.high).toBe(2500);
    });

    it('should add cost for additional children beyond 2', () => {
      const formData = createBaseFormData({
        adultAges: [35, 38],
        childAges: [8, 10, 12, 14], // 4 children
      });

      const result = analyzeInsurance(formData);

      expect(result.householdBreakdown).toBe('2 adults, 4 children');
      // Base (1800-2500) + 2 additional kids (600-800)
      expect(result.estimatedMonthlyCost.low).toBe(2400); // 1800 + 600
      expect(result.estimatedMonthlyCost.high).toBe(3300); // 2500 + 800
    });

    it('should adjust cost for single parent', () => {
      const formData = createBaseFormData({
        adultAges: [35],
        childAges: [8, 10],
      });

      const result = analyzeInsurance(formData);

      expect(result.householdBreakdown).toBe('1 adult, 2 children');
      // Family base (1800-2500) - 1 adult (600-900)
      expect(result.estimatedMonthlyCost.low).toBe(1200); // 1800 - 600
      expect(result.estimatedMonthlyCost.high).toBe(1600); // 2500 - 900
    });

    it('should handle multiple adults without children', () => {
      const formData = createBaseFormData({
        adultAges: [25, 28, 30], // 3 roommates
      });

      const result = analyzeInsurance(formData);

      expect(result.recommendedInsurance).toBe('Nationwide Flexible Plan for 3 adults');
      expect(result.householdBreakdown).toBe('3 adults');
      expect(result.estimatedMonthlyCost.low).toBe(1800); // 3 * 600
      expect(result.estimatedMonthlyCost.high).toBe(2700); // 3 * 900
    });

    it('should include national PPO action items', () => {
      const formData = createBaseFormData({
        adultAges: [40],
      });

      const result = analyzeInsurance(formData);

      // Updated to match new marketplace-focused action items
      expect(result.actionItems.some(item => item.includes('Marketplace'))).toBe(true);
      expect(result.actionItems.some(item => item.includes('Bronze') || item.includes('Silver') || item.includes('Gold'))).toBe(true);
    });

    it('should include HDHP with HSA as alternative', () => {
      const formData = createBaseFormData({
        adultAges: [30],
      });

      const result = analyzeInsurance(formData);

      const hdhp = result.alternativeOptions!.find(
        opt => opt.name.includes('High-Deductible')
      );
      expect(hdhp).toBeDefined();
      expect(hdhp!.pros.some(pro => pro.includes('HSA'))).toBe(true);
    });
  });

  describe('Coverage Score Calculation', () => {
    it('should return 90 for single state', () => {
      const formData = createBaseFormData({
        residences: [{ state: 'NY', zip: '10001', isPrimary: true }],
        adultAges: [45],
      });

      const result = analyzeInsurance(formData);
      expect(result.coverageGapScore).toBe(90);
    });

    it('should return 85 for popular states', () => {
      const formData = createBaseFormData({
        residences: [
          { state: 'NY', zip: '10001', isPrimary: true },
          { state: 'FL', zip: '33101', isPrimary: false },
        ],
        adultAges: [45],
      });

      const result = analyzeInsurance(formData);
      expect(result.coverageGapScore).toBe(85);
    });

    it('should return 75 for adjacent states', () => {
      const formData = createBaseFormData({
        residences: [
          { state: 'NY', zip: '10001', isPrimary: true },
          { state: 'NJ', zip: '07001', isPrimary: false },
        ],
        adultAges: [45],
      });

      const result = analyzeInsurance(formData);
      expect(result.coverageGapScore).toBe(75);
    });

    it('should return 80 for 5+ states (with non-popular states)', () => {
      const formData = createBaseFormData({
        residences: [
          { state: 'ME', zip: '04001', isPrimary: true },
          { state: 'VT', zip: '05001', isPrimary: false },
          { state: 'NH', zip: '03001', isPrimary: false },
          { state: 'RI', zip: '02801', isPrimary: false },
          { state: 'DE', zip: '19701', isPrimary: false },
        ],
        adultAges: [45],
      });

      const result = analyzeInsurance(formData);
      expect(result.coverageGapScore).toBe(80);
    });

    it('should return 85 for 5+ popular states', () => {
      const formData = createBaseFormData({
        residences: [
          { state: 'NY', zip: '10001', isPrimary: true },
          { state: 'FL', zip: '33101', isPrimary: false },
          { state: 'CA', zip: '90001', isPrimary: false },
          { state: 'TX', zip: '75001', isPrimary: false },
          { state: 'AZ', zip: '85001', isPrimary: false },
        ],
        adultAges: [45],
      });

      const result = analyzeInsurance(formData);
      expect(result.coverageGapScore).toBe(85);
    });
  });

  describe('Budget Compatibility', () => {
    it('should warn when budget is too low', () => {
      const formData = createBaseFormData({
        adultAges: [45, 48],
        childAges: [10, 12],
        budget: 'less-500', // Budget: $500, Estimate: $1800-2500
      });

      const result = analyzeInsurance(formData);

      const budgetWarning = result.actionItems.find(item =>
        item.includes('budget is lower') && item.includes('healthcare.gov')
      );
      expect(budgetWarning).toBeDefined();
    });

    it('should suggest concierge medicine for "not-sure" budget', () => {
      const formData = createBaseFormData({
        adultAges: [45],
        budget: 'not-sure',
      });

      const result = analyzeInsurance(formData);

      const conciergeItem = result.actionItems.find(item =>
        item.includes('concierge medicine')
      );
      expect(conciergeItem).toBeDefined();
    });

    it('should not add budget note when budget is sufficient', () => {
      const formData = createBaseFormData({
        adultAges: [45],
        budget: '1000-2000', // Budget sufficient for single adult (600-900)
      });

      const result = analyzeInsurance(formData);

      const budgetNote = result.actionItems.find(item =>
        item.includes('budget') || item.includes('healthcare.gov')
      );
      expect(budgetNote).toBeUndefined();
    });
  });

  describe('Current Insurance Comparison', () => {
    it('should add current insurance summary when provided', () => {
      const formData = createBaseFormData({
        adultAges: [45],
        hasCurrentInsurance: true,
        currentInsurance: {
          carrier: 'Blue Cross',
          planType: 'HMO',
          monthlyCost: 1200,
          deductible: 3000,
          outOfPocketMax: 8000,
        },
      });

      const result = analyzeInsurance(formData);

      expect(result.currentInsuranceSummary).toBeDefined();
      expect(result.currentInsuranceSummary).toContain('Blue Cross');
      expect(result.currentInsuranceSummary).toContain('HMO');
      expect(result.currentInsuranceSummary).toContain('$1200/month');
    });

    it('should calculate cost savings correctly', () => {
      const formData = createBaseFormData({
        adultAges: [45],
        hasCurrentInsurance: true,
        currentInsurance: {
          carrier: 'Blue Cross',
          planType: 'PPO',
          monthlyCost: 1200, // Current: $1200, Recommended: $600-900 (avg $750)
          deductible: 3000,
          outOfPocketMax: 8000,
        },
      });

      const result = analyzeInsurance(formData);

      expect(result.costComparison).toBeDefined();
      expect(result.costComparison!.current).toBe(1200);
      expect(result.costComparison!.monthlySavings).toBeGreaterThan(0);
      expect(result.costComparison!.annualSavings).toBeGreaterThan(0);
    });

    it('should generate suggestions for cost savings', () => {
      const formData = createBaseFormData({
        adultAges: [45],
        hasCurrentInsurance: true,
        currentInsurance: {
          carrier: 'Blue Cross',
          planType: 'PPO',
          monthlyCost: 1200,
          deductible: 3000,
          outOfPocketMax: 8000,
        },
      });

      const result = analyzeInsurance(formData);

      expect(result.suggestions).toBeDefined();
      const costSavingSuggestion = result.suggestions!.find(
        s => s.type === 'cost-savings'
      );
      expect(costSavingSuggestion).toBeDefined();
      expect(costSavingSuggestion!.priority).toBe('high');
    });

    it('should warn about HMO network limitations', () => {
      const formData = createBaseFormData({
        adultAges: [45],
        hasCurrentInsurance: true,
        currentInsurance: {
          carrier: 'Kaiser',
          planType: 'HMO',
          monthlyCost: 800,
          deductible: 2000,
          outOfPocketMax: 6000,
        },
      });

      const result = analyzeInsurance(formData);

      const networkSuggestion = result.suggestions!.find(
        s => s.type === 'network-expansion'
      );
      expect(networkSuggestion).toBeDefined();
      expect(networkSuggestion!.title).toContain('Limited Network');
    });

    it('should suggest Medicare enrollment for eligible users', () => {
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
        },
      });

      const result = analyzeInsurance(formData);

      const medicareSuggestion = result.suggestions!.find(
        s => s.type === 'coverage-improvement' && s.title.includes('Medicare Eligibility')
      );
      expect(medicareSuggestion).toBeDefined();
    });

    it('should warn about high deductibles', () => {
      const formData = createBaseFormData({
        adultAges: [45],
        hasCurrentInsurance: true,
        currentInsurance: {
          carrier: 'Generic',
          planType: 'HDHP',
          monthlyCost: 500,
          deductible: 7000, // High deductible
          outOfPocketMax: 9000,
        },
      });

      const result = analyzeInsurance(formData);

      const deductibleSuggestion = result.suggestions!.find(
        s => s.title.includes('High Deductible')
      );
      expect(deductibleSuggestion).toBeDefined();
    });

    it('should identify improvement areas', () => {
      const formData = createBaseFormData({
        adultAges: [45],
        hasCurrentInsurance: true,
        currentInsurance: {
          carrier: 'Kaiser',
          planType: 'HMO',
          monthlyCost: 1200,
          deductible: 6000,
          outOfPocketMax: 12000,
        },
      });

      const result = analyzeInsurance(formData);

      expect(result.improvementAreas).toBeDefined();
      expect(result.improvementAreas!).toContain('Multi-state network coverage');
      expect(result.improvementAreas!).toContain('Monthly premium costs');
      expect(result.improvementAreas!).toContain('Lower deductible options');
      expect(result.improvementAreas!).toContain('Out-of-pocket maximum protection');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty states array gracefully', () => {
      const formData = createBaseFormData({
        residences: [
          { state: '', zip: '', isPrimary: true },
        ],
        adultAges: [45],
      });

      const result = analyzeInsurance(formData);

      // Should still provide a recommendation
      expect(result.recommendedInsurance).toBeDefined();
      expect(result.coverageGapScore).toBe(50); // Empty states = score 50
    });

    it('should handle very large household', () => {
      const formData = createBaseFormData({
        adultAges: [30, 32, 35, 38, 40],
        childAges: [2, 4, 6, 8, 10, 12],
      });

      const result = analyzeInsurance(formData);

      expect(result.recommendedInsurance).toBeDefined();
      expect(result.estimatedMonthlyCost).toBeDefined();
      expect(result.estimatedMonthlyCost.low).toBeGreaterThan(0);
    });

    it('should handle maximum age (100)', () => {
      const formData = createBaseFormData({
        adultAges: [100],
        hasMedicareEligible: true,
      });

      const result = analyzeInsurance(formData);

      expect(result.recommendedInsurance).toBe('Basic Medicare + Extra Coverage');
    });

    it('should handle newborn children (age 0)', () => {
      const formData = createBaseFormData({
        adultAges: [30, 32],
        childAges: [0], // Newborn
      });

      const result = analyzeInsurance(formData);

      expect(result.householdBreakdown).toContain('1 child');
      expect(result.recommendedInsurance).toBe('Nationwide Flexible Family Plan');
    });

    it('should handle 17-year-old children', () => {
      const formData = createBaseFormData({
        adultAges: [45],
        childAges: [17],
      });

      const result = analyzeInsurance(formData);

      expect(result.householdBreakdown).toContain('1 child');
    });
  });
});
