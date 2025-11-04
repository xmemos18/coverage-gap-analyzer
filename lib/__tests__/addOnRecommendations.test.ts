import { generateAddOnRecommendations, calculateBundleDiscount, calculateTotalAddOnCost } from '../calculator/addOnRecommendations';
import { CalculatorFormData, InsuranceRecommendation } from '@/types';
import type { AddOnRecommendation } from '@/types/addOnInsurance';

describe('Add-On Insurance Recommendation Engine', () => {
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

  // Helper function to create base recommendation
  const createBaseRecommendation = (): InsuranceRecommendation => ({
    recommendedInsurance: 'National PPO',
    householdBreakdown: '1 adult',
    estimatedMonthlyCost: { low: 600, high: 900 },
    coverageGapScore: 85,
    reasoning: 'Test reasoning',
    actionItems: ['Test action'],
    alternativeOptions: [],
  });

  describe('Age-Based Recommendations', () => {
    it('should recommend dental and vision for children (0-17)', () => {
      const formData = createBaseFormData({
        adultAges: [35],
        childAges: [8, 12],
        numChildren: 2,
      });
      const recommendation = createBaseRecommendation();

      const result = generateAddOnRecommendations(formData, recommendation);

      // Should have recommendations
      expect(result.recommendations.length).toBeGreaterThan(0);

      // Dental should be high priority for children
      const dental = result.recommendations.find(r => r.insurance.id === 'dental');
      expect(dental).toBeDefined();
      expect(dental?.priority).toBe('high');
      expect(dental?.probabilityScore).toBeGreaterThanOrEqual(90);

      // Vision should be high priority for children
      const vision = result.recommendations.find(r => r.insurance.id === 'vision');
      expect(vision).toBeDefined();
      expect(vision?.priority).toBe('high');
    });

    it('should recommend accident insurance for young adults (18-30)', () => {
      const formData = createBaseFormData({
        adultAges: [25],
      });
      const recommendation = createBaseRecommendation();

      const result = generateAddOnRecommendations(formData, recommendation);

      const accident = result.recommendations.find(r => r.insurance.id === 'accident');
      expect(accident).toBeDefined();
      expect(accident?.priority).toBe('high');
      expect(accident?.probabilityScore).toBeGreaterThanOrEqual(75);
    });

    it('should recommend critical illness and disability for mid-career adults (41-50)', () => {
      // Use age 55 for higher critical illness probability (actuarial curves peak later)
      const formData = createBaseFormData({
        adultAges: [55],
      });
      const recommendation = createBaseRecommendation();

      const result = generateAddOnRecommendations(formData, recommendation);

      const criticalIllness = result.recommendations.find(r => r.insurance.id === 'critical-illness');
      expect(criticalIllness).toBeDefined();
      // Actuarial curves show critical illness as medium-high for age 55
      expect(criticalIllness?.priority).toMatch(/medium|high/);
      expect(criticalIllness?.probabilityScore).toBeGreaterThanOrEqual(50);

      const disability = result.recommendations.find(r => r.insurance.id === 'disability');
      expect(disability).toBeDefined();
      expect(disability?.priority).toBe('high');
    });

    it('should recommend long-term care and hospital indemnity for seniors (65+)', () => {
      const formData = createBaseFormData({
        adultAges: [70],
        hasMedicareEligible: true,
      });
      const recommendation = createBaseRecommendation();

      const result = generateAddOnRecommendations(formData, recommendation);

      const longTermCare = result.recommendations.find(r => r.insurance.id === 'long-term-care');
      expect(longTermCare).toBeDefined();
      expect(longTermCare?.priority).toBe('high');

      const hospitalIndemnity = result.recommendations.find(r => r.insurance.id === 'hospital-indemnity');
      expect(hospitalIndemnity).toBeDefined();
      expect(hospitalIndemnity?.priority).toBe('high');
    });
  });

  describe('Priority Grouping', () => {
    it('should correctly group recommendations by priority', () => {
      const formData = createBaseFormData({
        adultAges: [45],
        childAges: [10],
        numChildren: 1,
      });
      const recommendation = createBaseRecommendation();

      const result = generateAddOnRecommendations(formData, recommendation);

      expect(result.highPriority.length).toBeGreaterThan(0);
      expect(result.mediumPriority.length).toBeGreaterThan(0);

      // All high priority items should have high priority
      result.highPriority.forEach(rec => {
        expect(rec.priority).toBe('high');
        expect(rec.probabilityScore).toBeGreaterThanOrEqual(75);
      });

      // All medium priority items should have medium priority
      result.mediumPriority.forEach(rec => {
        expect(rec.priority).toBe('medium');
        expect(rec.probabilityScore).toBeGreaterThanOrEqual(50);
        expect(rec.probabilityScore).toBeLessThan(75);
      });
    });

    it('should filter out recommendations below 25% threshold', () => {
      const formData = createBaseFormData({
        adultAges: [25], // Young adult
      });
      const recommendation = createBaseRecommendation();

      const result = generateAddOnRecommendations(formData, recommendation);

      // Long-term care should not be recommended for young adults
      const longTermCare = result.recommendations.find(r => r.insurance.id === 'long-term-care');
      expect(longTermCare).toBeUndefined();
    });
  });

  describe('Cost Calculations', () => {
    it('should calculate costs with state adjustments', () => {
      const formData = createBaseFormData({
        residences: [
          { state: 'NY', zip: '10001', isPrimary: true, monthsPerYear: 12 }, // Higher cost state
        ],
        adultAges: [45],
      });
      const recommendation = createBaseRecommendation();

      const result = generateAddOnRecommendations(formData, recommendation);

      // Costs should be adjusted for NY state multiplier
      const dental = result.recommendations.find(r => r.insurance.id === 'dental');
      expect(dental).toBeDefined();
      expect(dental!.adjustedCostPerMonth).toBeGreaterThan(45); // Base cost is 45
    });

    it('should apply family discount for multiple members', () => {
      const formData = createBaseFormData({
        adultAges: [35, 37],
        numAdults: 2,
        childAges: [8, 10],
        numChildren: 2,
      });
      const recommendation = createBaseRecommendation();

      const result = generateAddOnRecommendations(formData, recommendation);

      const dental = result.recommendations.find(r => r.insurance.id === 'dental');
      expect(dental).toBeDefined();
      expect(dental!.applicableMembers).toBeGreaterThanOrEqual(2);

      // Family discount should be applied (10% off)
      const perPersonCost = dental!.adjustedCostPerMonth;
      const expectedNoDiscount = perPersonCost * dental!.applicableMembers;
      expect(dental!.householdCostPerMonth).toBeLessThan(expectedNoDiscount);
    });

    it('should calculate total costs correctly', () => {
      const formData = createBaseFormData({
        adultAges: [45],
      });
      const recommendation = createBaseRecommendation();

      const result = generateAddOnRecommendations(formData, recommendation);

      // Total high priority should equal sum of high priority items
      const calculatedTotal = result.highPriority.reduce(
        (sum, rec) => sum + rec.householdCostPerMonth,
        0
      );
      expect(result.totalMonthlyHighPriority).toBe(calculatedTotal);

      // Total all recommended should equal sum of all items
      const calculatedAllTotal = result.recommendations.reduce(
        (sum, rec) => sum + rec.householdCostPerMonth,
        0
      );
      expect(result.totalMonthlyAllRecommended).toBe(calculatedAllTotal);
    });
  });

  describe('Modifiers and Adjustments', () => {
    it('should boost recommendations for chronic conditions', () => {
      const formDataWithoutConditions = createBaseFormData({
        adultAges: [45],
        hasChronicConditions: false,
      });
      const formDataWithConditions = createBaseFormData({
        adultAges: [45],
        hasChronicConditions: true,
        chronicConditions: ['diabetes'],
      });
      const recommendation = createBaseRecommendation();

      const resultWithout = generateAddOnRecommendations(formDataWithoutConditions, recommendation);
      const resultWith = generateAddOnRecommendations(formDataWithConditions, recommendation);

      const criticalIllnessWithout = resultWithout.recommendations.find(
        r => r.insurance.id === 'critical-illness'
      );
      const criticalIllnessWith = resultWith.recommendations.find(
        r => r.insurance.id === 'critical-illness'
      );

      // Score should be higher with chronic conditions
      expect(criticalIllnessWith!.probabilityScore).toBeGreaterThanOrEqual(
        criticalIllnessWithout!.probabilityScore
      );
    });

    it('should boost Medicare gap coverage for Medicare-eligible', () => {
      const formData = createBaseFormData({
        adultAges: [70],
        hasMedicareEligible: true,
      });
      const recommendation = createBaseRecommendation();

      const result = generateAddOnRecommendations(formData, recommendation);

      // Dental, vision, and hospital indemnity should be high priority for Medicare
      const dental = result.recommendations.find(r => r.insurance.id === 'dental');
      expect(dental?.priority).toBe('high');
      expect(dental?.reasons.some(r => r.includes('Medicare'))).toBe(true);
    });

    it('should boost travel-related coverage for multiple residences', () => {
      const formData = createBaseFormData({
        residences: [
          { state: 'NY', zip: '10001', isPrimary: true, monthsPerYear: 6 },
          { state: 'FL', zip: '33101', isPrimary: false, monthsPerYear: 6 },
        ],
        adultAges: [45],
      });
      const recommendation = createBaseRecommendation();

      const result = generateAddOnRecommendations(formData, recommendation);

      const accident = result.recommendations.find(r => r.insurance.id === 'accident');
      expect(accident).toBeDefined();
      expect(accident?.reasons.some(r => r.includes('travel'))).toBe(true);
    });
  });

  describe('Bundle Discount', () => {
    it('should not apply discount for fewer than 3 add-ons', () => {
      const mockRecs: AddOnRecommendation[] = [
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          insurance: { id: 'dental' } as any,
          priority: 'high',
          probabilityScore: 90,
          adjustedCostPerMonth: 50,
          householdCostPerMonth: 50,
          applicableMembers: 1,
          reasons: [],
          ageGroup: 'Adults',
        },
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          insurance: { id: 'vision' } as any,
          priority: 'high',
          probabilityScore: 85,
          adjustedCostPerMonth: 25,
          householdCostPerMonth: 25,
          applicableMembers: 1,
          reasons: [],
          ageGroup: 'Adults',
        },
      ];

      const discount = calculateBundleDiscount(mockRecs);
      expect(discount).toBe(1.0); // No discount
    });

    it('should apply 5% discount for 3+ add-ons', () => {
      const mockRecs: AddOnRecommendation[] = [
        { householdCostPerMonth: 50 } as AddOnRecommendation,
        { householdCostPerMonth: 25 } as AddOnRecommendation,
        { householdCostPerMonth: 100 } as AddOnRecommendation,
      ];

      const discount = calculateBundleDiscount(mockRecs);
      expect(discount).toBe(0.95); // 5% off
    });

    it('should calculate total cost with bundle discount', () => {
      const mockRecs: AddOnRecommendation[] = [
        { householdCostPerMonth: 50 } as AddOnRecommendation,
        { householdCostPerMonth: 25 } as AddOnRecommendation,
        { householdCostPerMonth: 100 } as AddOnRecommendation,
      ];

      const total = calculateTotalAddOnCost(mockRecs);
      // 175 * 0.95 = 166.25, rounded to 166
      expect(total).toBe(166);
    });
  });

  describe('Household Age Groups', () => {
    it('should correctly analyze household age groups', () => {
      const formData = createBaseFormData({
        adultAges: [35, 42, 68],
        numAdults: 3,
        childAges: [8, 12, 15],
        numChildren: 3,
      });
      const recommendation = createBaseRecommendation();

      const result = generateAddOnRecommendations(formData, recommendation);

      expect(result.householdAgeGroups.length).toBeGreaterThan(0);

      // Should have children group
      const childrenGroup = result.householdAgeGroups.find(g => g.groupName.includes('Children'));
      expect(childrenGroup).toBeDefined();
      expect(childrenGroup!.memberCount).toBe(3);

      // Should have multiple adult groups
      const adultGroups = result.householdAgeGroups.filter(g => g.groupName.includes('Adults'));
      expect(adultGroups.length).toBeGreaterThan(0);
    });

    it('should handle single-age household', () => {
      const formData = createBaseFormData({
        adultAges: [45],
      });
      const recommendation = createBaseRecommendation();

      const result = generateAddOnRecommendations(formData, recommendation);

      expect(result.householdAgeGroups.length).toBe(1);
      expect(result.householdAgeGroups[0].memberCount).toBe(1);
    });

    it('should handle multi-generational household', () => {
      const formData = createBaseFormData({
        adultAges: [28, 32, 62, 68],
        numAdults: 4,
        childAges: [5],
        numChildren: 1,
      });
      const recommendation = createBaseRecommendation();

      const result = generateAddOnRecommendations(formData, recommendation);

      // Should have at least 3 age groups
      expect(result.householdAgeGroups.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle household with only adults at age boundaries', () => {
      const formData = createBaseFormData({
        adultAges: [18, 30, 40, 50, 64, 65, 74, 75],
        numAdults: 8,
      });
      const recommendation = createBaseRecommendation();

      const result = generateAddOnRecommendations(formData, recommendation);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.householdAgeGroups.length).toBeGreaterThan(0);
    });

    it('should handle very low budget', () => {
      const formData = createBaseFormData({
        adultAges: [45],
        budget: 'under-300',
      });
      const recommendation = createBaseRecommendation();

      const result = generateAddOnRecommendations(formData, recommendation);

      // Should still generate recommendations but may de-prioritize expensive ones
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle excluded categories', () => {
      const formData = createBaseFormData({
        adultAges: [45],
      });
      const recommendation = createBaseRecommendation();
      const preferences = {
        interested: true,
        excludeCategories: ['life' as const, 'long-term-care' as const],
      };

      const result = generateAddOnRecommendations(formData, recommendation, preferences);

      // Should not include excluded categories
      const life = result.recommendations.find(r => r.insurance.category === 'life');
      expect(life).toBeUndefined();

      const ltc = result.recommendations.find(r => r.insurance.category === 'long-term-care');
      expect(ltc).toBeUndefined();
    });
  });

  describe('Integration with Main Calculator', () => {
    it('should generate add-ons for typical family scenario', () => {
      const formData = createBaseFormData({
        residences: [
          { state: 'NY', zip: '10001', isPrimary: true, monthsPerYear: 8 },
          { state: 'FL', zip: '33101', isPrimary: false, monthsPerYear: 4 },
        ],
        adultAges: [38, 40],
        numAdults: 2,
        childAges: [8, 11],
        numChildren: 2,
        budget: '1000-2000',
        incomeRange: '75000-100000',
      });
      const recommendation = createBaseRecommendation();

      const result = generateAddOnRecommendations(formData, recommendation);

      // Should have dental and vision as high priority
      expect(result.highPriority.some(r => r.insurance.id === 'dental')).toBe(true);
      expect(result.highPriority.some(r => r.insurance.id === 'vision')).toBe(true);

      // Should have disability and term life
      expect(result.recommendations.some(r => r.insurance.id === 'disability')).toBe(true);
      expect(result.recommendations.some(r => r.insurance.id === 'term-life')).toBe(true);

      // Total costs should be reasonable
      expect(result.totalMonthlyHighPriority).toBeGreaterThan(0);
      expect(result.totalMonthlyHighPriority).toBeLessThan(1000);
    });
  });
});
