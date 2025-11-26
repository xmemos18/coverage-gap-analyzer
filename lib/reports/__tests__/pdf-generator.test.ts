/**
 * PDF Generator Tests
 */

// Mock react-pdf to avoid ESM issues in Jest
jest.mock('@react-pdf/renderer', () => ({
  pdf: jest.fn(() => ({
    toBlob: jest.fn(() => Promise.resolve(new Blob(['test']))),
    toBuffer: jest.fn(() => Promise.resolve(Buffer.from('test'))),
  })),
  Document: jest.fn(({ children }) => children),
  Page: jest.fn(({ children }) => children),
  Text: jest.fn(({ children }) => children),
  View: jest.fn(({ children }) => children),
  StyleSheet: { create: jest.fn((styles) => styles) },
  Svg: jest.fn(({ children }) => children),
  Rect: jest.fn(),
  Line: jest.fn(),
  G: jest.fn(({ children }) => children),
}));

import { validateReportInput, type PDFReportInput } from '../pdf-generator';

// Mock data for testing
const createValidInput = (): PDFReportInput => ({
  formData: {
    residences: [{ zip: '90210', state: 'CA', isPrimary: true, monthsPerYear: 12 }],
    numAdults: 2,
    adultAges: [35, 33],
    adultsUseTobacco: [false, false],
    numChildren: 1,
    childAges: [5],
    childrenUseTobacco: [false],
    hasMedicareEligible: false,
    hasEmployerInsurance: false,
    employerContribution: 0,
    hasChronicConditions: false,
    chronicConditions: [],
    prescriptionCount: '0-2',
    providerPreference: 'no-preference',
    doctorVisitsPerYear: '3-5',
    specialistVisitsPerYear: 'none',
    erVisitsPerYear: 'none',
    plannedProcedures: false,
    takesSpecialtyMeds: false,
    monthlyMedicationCost: 'under-50',
    usesMailOrderPharmacy: false,
    hasPreferredHospital: false,
    preferredHospitalName: '',
    hospitalImportance: 'no-preference',
    needsNationalCoverage: 'not-important',
    financialPriority: 'balanced',
    canAffordUnexpectedBill: 'yes-easily',
    hasCurrentInsurance: false,
    currentInsurance: {
      carrier: '',
      planType: '',
      monthlyCost: 0,
      deductible: 0,
      outOfPocketMax: 0,
      coverageNotes: '',
    },
    budget: '500-750',
    incomeRange: '50000-75000',
    currentStep: 1,
    simpleMode: false,
    interestedInAddOns: false,
  },
  recommendation: {
    recommendedInsurance: 'ACA Marketplace Silver Plan',
    planType: 'PPO',
    householdBreakdown: '2 adults, 1 child',
    estimatedMonthlyCost: { low: 450, high: 650 },
    coverageGapScore: 85,
    reasoning: 'Based on your household size and income, an ACA Marketplace Silver plan offers the best balance of coverage and cost.',
    actionItems: [
      'Visit HealthCare.gov during Open Enrollment',
      'Compare Silver plans with similar deductibles',
      'Check if your preferred providers are in-network',
    ],
    alternativeOptions: [
      {
        name: 'ACA Bronze Plan',
        monthlyCost: { low: 300, high: 450 },
        coverageScore: 70,
        pros: ['Lower monthly premium', 'HSA eligible'],
        cons: ['Higher deductible', 'More out-of-pocket costs'],
      },
      {
        name: 'ACA Gold Plan',
        monthlyCost: { low: 600, high: 850 },
        coverageScore: 90,
        pros: ['Lower out-of-pocket costs', 'Better coverage'],
        cons: ['Higher monthly premium'],
      },
    ],
    subsidyAnalysis: {
      medicaidEligible: false,
      subsidyEligible: true,
      estimatedMonthlySubsidy: 200,
      estimatedAfterSubsidyCost: { low: 250, high: 450 },
      fplPercentage: 250,
      explanation: 'Your household income qualifies for premium tax credits.',
      subsidyActionItems: ['Apply through HealthCare.gov to claim subsidy'],
    },
  },
  generatedAt: new Date('2024-01-15'),
});

describe('PDF Generator', () => {
  describe('validateReportInput', () => {
    it('should validate correct input', () => {
      const input = createValidInput();
      expect(validateReportInput(input)).toBe(true);
    });

    it('should reject null input', () => {
      expect(validateReportInput(null)).toBe(false);
    });

    it('should reject undefined input', () => {
      expect(validateReportInput(undefined)).toBe(false);
    });

    it('should reject input without formData', () => {
      const input = {
        recommendation: createValidInput().recommendation,
      };
      expect(validateReportInput(input)).toBe(false);
    });

    it('should reject input without recommendation', () => {
      const input = {
        formData: createValidInput().formData,
      };
      expect(validateReportInput(input)).toBe(false);
    });

    it('should reject input with invalid recommendation', () => {
      const input = {
        formData: createValidInput().formData,
        recommendation: {
          // Missing required fields
          planType: 'PPO',
        },
      };
      expect(validateReportInput(input)).toBe(false);
    });

    it('should reject input with missing coverageGapScore', () => {
      const validInput = createValidInput();
      const input = {
        formData: validInput.formData,
        recommendation: {
          ...validInput.recommendation,
          coverageGapScore: undefined,
        },
      };
      expect(validateReportInput(input)).toBe(false);
    });

    it('should reject input with missing estimatedMonthlyCost', () => {
      const validInput = createValidInput();
      const input = {
        formData: validInput.formData,
        recommendation: {
          ...validInput.recommendation,
          estimatedMonthlyCost: undefined,
        },
      };
      expect(validateReportInput(input)).toBe(false);
    });

    it('should reject input with missing actionItems', () => {
      const validInput = createValidInput();
      const input = {
        formData: validInput.formData,
        recommendation: {
          ...validInput.recommendation,
          actionItems: undefined,
        },
      };
      expect(validateReportInput(input)).toBe(false);
    });

    it('should reject input with non-array actionItems', () => {
      const validInput = createValidInput();
      const input = {
        formData: validInput.formData,
        recommendation: {
          ...validInput.recommendation,
          actionItems: 'not an array',
        },
      };
      expect(validateReportInput(input)).toBe(false);
    });

    it('should reject input with missing alternativeOptions', () => {
      const validInput = createValidInput();
      const input = {
        formData: validInput.formData,
        recommendation: {
          ...validInput.recommendation,
          alternativeOptions: undefined,
        },
      };
      expect(validateReportInput(input)).toBe(false);
    });
  });

  describe('Input Structure', () => {
    it('should have all required formData fields', () => {
      const input = createValidInput();

      expect(input.formData.residences).toBeDefined();
      expect(input.formData.numAdults).toBeDefined();
      expect(input.formData.numChildren).toBeDefined();
      expect(input.formData.budget).toBeDefined();
    });

    it('should have all required recommendation fields', () => {
      const input = createValidInput();

      expect(input.recommendation.recommendedInsurance).toBeDefined();
      expect(input.recommendation.coverageGapScore).toBeDefined();
      expect(input.recommendation.estimatedMonthlyCost).toBeDefined();
      expect(input.recommendation.reasoning).toBeDefined();
      expect(input.recommendation.actionItems).toBeDefined();
      expect(input.recommendation.alternativeOptions).toBeDefined();
    });

    it('should allow optional generatedAt', () => {
      const input = createValidInput();
      delete (input as { generatedAt?: Date }).generatedAt;

      expect(validateReportInput(input)).toBe(true);
    });

    it('should accept valid subsidy analysis', () => {
      const input = createValidInput();

      expect(input.recommendation.subsidyAnalysis).toBeDefined();
      expect(input.recommendation.subsidyAnalysis?.medicaidEligible).toBe(false);
      expect(input.recommendation.subsidyAnalysis?.subsidyEligible).toBe(true);
      expect(input.recommendation.subsidyAnalysis?.estimatedMonthlySubsidy).toBeGreaterThan(0);
    });
  });

  describe('Alternative Options', () => {
    it('should have valid alternative options structure', () => {
      const input = createValidInput();
      const alternatives = input.recommendation.alternativeOptions;

      expect(alternatives.length).toBeGreaterThan(0);

      alternatives.forEach((alt) => {
        expect(alt.name).toBeDefined();
        expect(alt.monthlyCost).toBeDefined();
        expect(alt.monthlyCost.low).toBeLessThanOrEqual(alt.monthlyCost.high);
        expect(alt.coverageScore).toBeGreaterThanOrEqual(0);
        expect(alt.coverageScore).toBeLessThanOrEqual(100);
        expect(Array.isArray(alt.pros)).toBe(true);
        expect(Array.isArray(alt.cons)).toBe(true);
      });
    });
  });
});
