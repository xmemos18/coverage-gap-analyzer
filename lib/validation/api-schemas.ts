/**
 * API Validation Schemas
 * Centralized Zod schemas for API route validation
 */

import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

export const StateCodeSchema = z.string().length(2, 'State must be a 2-letter code').toUpperCase();

export const ZipCodeSchema = z.string().regex(/^\d{5}$/, 'ZIP code must be exactly 5 digits');

export const AgeSchema = z.number().int().min(0).max(120);

export const AdultAgeSchema = z.number().int().min(18, 'Adult age must be at least 18').max(100, 'Adult age must be at most 100');

export const HouseholdSizeSchema = z.number().int().min(1, 'Household must have at least 1 person').max(20, 'Household cannot exceed 20 people');

export const MonetaryAmountSchema = z.number().min(0, 'Amount cannot be negative').max(10000000, 'Amount exceeds maximum');

export const PercentageSchema = z.number().min(0).max(100);

export const TaxRateSchema = z.number().min(0).max(0.5, 'Tax rate must be between 0 and 0.5');

// ============================================================================
// Filing Status
// ============================================================================

export const FilingStatusSchema = z.enum([
  'single',
  'married_joint',
  'married_separate',
  'head_of_household',
]);

export type FilingStatus = z.infer<typeof FilingStatusSchema>;

// ============================================================================
// Plan Comparison Schemas
// ============================================================================

export const PlanTypeSchema = z.enum(['HMO', 'PPO', 'EPO', 'POS', 'HDHP']);

export const MetalLevelSchema = z.enum(['bronze', 'silver', 'gold', 'platinum', 'catastrophic']);

export const PlanDetailsSchema = z.object({
  id: z.string().min(1, 'Plan ID is required'),
  name: z.string().min(1, 'Plan name is required'),
  type: PlanTypeSchema,
  metalLevel: MetalLevelSchema,
  issuer: z.string().min(1, 'Issuer is required'),
  monthlyPremium: MonetaryAmountSchema,
  deductible: MonetaryAmountSchema,
  outOfPocketMax: MonetaryAmountSchema,
  // Optional numeric fields
  primaryCareCopay: MonetaryAmountSchema.optional(),
  specialistCopay: MonetaryAmountSchema.optional(),
  genericDrugCopay: MonetaryAmountSchema.optional(),
  brandDrugCopay: MonetaryAmountSchema.optional(),
  emergencyRoomCopay: MonetaryAmountSchema.optional(),
  urgentCareCopay: MonetaryAmountSchema.optional(),
  coinsurance: PercentageSchema.optional(),
  hsaEligible: z.boolean().optional(),
  qualityRating: z.number().min(1).max(5).optional(),
});

export type PlanDetails = z.infer<typeof PlanDetailsSchema>;

export const UserHealthProfileSchema = z.object({
  expectedDoctorVisits: z.number().int().min(0).default(0),
  expectedSpecialistVisits: z.number().int().min(0).default(0),
  expectedPrescriptions: z.number().int().min(0).default(0),
  avgPrescriptionTier: z.number().int().min(1).max(4).default(1),
  expectedERVisits: z.number().int().min(0).default(0),
  hasPlannedProcedures: z.boolean().default(false),
  plannedProcedureCost: z.number().min(0).optional(),
  riskTolerance: z.enum(['low', 'medium', 'high']).default('medium'),
  prioritizesLowerPremium: z.boolean().default(false),
  needsSpecificProviders: z.boolean().default(false),
  hasChronicConditions: z.boolean().default(false),
});

export type UserHealthProfile = z.infer<typeof UserHealthProfileSchema>;

export const CompareRequestSchema = z.object({
  planA: PlanDetailsSchema,
  planB: PlanDetailsSchema,
  userProfile: UserHealthProfileSchema.optional(),
  mode: z.enum(['full', 'quick']).default('full'),
});

export type CompareRequest = z.infer<typeof CompareRequestSchema>;

// ============================================================================
// MAGI Calculator Schemas
// ============================================================================

export const MAGIAnalysisRequestSchema = z.object({
  estimatedMAGI: MonetaryAmountSchema,
  householdSize: HouseholdSizeSchema,
  filingStatus: FilingStatusSchema,
  state: StateCodeSchema,
  age: AdultAgeSchema,
  benchmarkPremium: MonetaryAmountSchema.optional(),
  currentRetirementContributions: MonetaryAmountSchema.optional(),
  currentHSAContributions: MonetaryAmountSchema.optional(),
  has401kAccess: z.boolean().optional(),
  hasHDHP: z.boolean().optional(),
  selfEmploymentIncome: MonetaryAmountSchema.optional(),
});

export type MAGIAnalysisRequest = z.infer<typeof MAGIAnalysisRequestSchema>;

export const MAGIQuickCalculationRequestSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('subsidy'),
    magi: MonetaryAmountSchema,
    householdSize: HouseholdSizeSchema,
    benchmarkPremium: MonetaryAmountSchema,
  }),
  z.object({
    type: z.literal('fpl_percent'),
    magi: MonetaryAmountSchema,
    householdSize: HouseholdSizeSchema,
  }),
  z.object({
    type: z.literal('income_at_fpl'),
    fplPercent: z.number().min(0).max(1000),
    householdSize: HouseholdSizeSchema,
  }),
  z.object({
    type: z.literal('medicaid_expansion'),
    state: StateCodeSchema,
  }),
]);

export type MAGIQuickCalculationRequest = z.infer<typeof MAGIQuickCalculationRequestSchema>;

// ============================================================================
// HSA Calculator Schemas
// ============================================================================

export const CoverageTypeSchema = z.enum(['individual', 'family']);

export const HSACalculationRequestSchema = z.object({
  coverageType: CoverageTypeSchema,
  age: AdultAgeSchema,
  currentBalance: MonetaryAmountSchema.optional(),
  annualIncome: MonetaryAmountSchema,
  federalTaxRate: TaxRateSchema,
  stateTaxRate: TaxRateSchema.optional(),
  employerContribution: MonetaryAmountSchema.optional(),
  expectedExpenses: MonetaryAmountSchema.optional(),
  monthlyPremium: MonetaryAmountSchema,
  deductible: MonetaryAmountSchema,
  yearsToRetirement: z.number().int().min(0).max(50).optional(),
  expectedReturn: z.number().min(0).max(0.20).optional(),
  healthcareInflation: z.number().min(0).max(0.15).optional(),
});

export type HSACalculationRequest = z.infer<typeof HSACalculationRequestSchema>;

export const HSAQuickCalculationRequestSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('eligibility'),
    coverageType: CoverageTypeSchema,
    deductible: MonetaryAmountSchema,
    outOfPocketMax: MonetaryAmountSchema,
  }),
  z.object({
    type: z.literal('paycheck'),
    annualContribution: MonetaryAmountSchema,
    payPeriods: z.number().int().min(1).max(52),
  }),
  z.object({
    type: z.literal('retirement'),
    currentAge: AdultAgeSchema,
    retirementAge: z.number().int().min(50).max(100),
    currentAnnualCosts: MonetaryAmountSchema,
    healthcareInflation: z.number().min(0).max(0.15).optional(),
  }),
  z.object({
    type: z.literal('limits'),
    year: z.number().int().min(2020).max(2030).optional(),
  }),
  z.object({
    type: z.literal('yield'),
    hsaYield: z.number().min(0).max(0.30),
    federalTaxRate: TaxRateSchema,
    stateTaxRate: TaxRateSchema.optional(),
  }),
]);

export type HSAQuickCalculationRequest = z.infer<typeof HSAQuickCalculationRequestSchema>;

// ============================================================================
// Subsidies API Schemas
// ============================================================================

// Healthcare.gov API expects a specific household format
// We do light validation and pass through to the API
export const HouseholdMemberSchema = z.object({
  age: AgeSchema,
}).passthrough(); // Allow additional Healthcare.gov fields

export const HouseholdSchema = z.object({
  income: MonetaryAmountSchema,
  people: z.array(HouseholdMemberSchema).min(1).max(20),
}).passthrough(); // Allow additional Healthcare.gov fields

export const SubsidyRequestSchema = z.object({
  zipcode: ZipCodeSchema,
  household: HouseholdSchema,
  year: z.number().int().min(2020).max(2030).optional(),
});

export type SubsidyRequest = z.infer<typeof SubsidyRequestSchema>;

// ============================================================================
// Marketplace Plans Search Schemas
// ============================================================================

export const MarketplacePlanSearchRequestSchema = z.object({
  zipcode: ZipCodeSchema,
  state: StateCodeSchema.optional(),
  market: z.enum(['Individual', 'SHOP']).optional().default('Individual'),
  year: z.number().int().min(2020).max(2030).optional(),
  household: HouseholdSchema.optional(),
  filter: z.object({
    metal_level: z.array(MetalLevelSchema).optional(),
    plan_type: z.array(PlanTypeSchema).optional(),
    issuer: z.array(z.string()).optional(),
    premium_range: z.object({
      min: MonetaryAmountSchema.optional(),
      max: MonetaryAmountSchema.optional(),
    }).optional(),
    deductible_range: z.object({
      min: MonetaryAmountSchema.optional(),
      max: MonetaryAmountSchema.optional(),
    }).optional(),
    hsa_eligible: z.boolean().optional(),
  }).passthrough().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

export type MarketplacePlanSearchRequest = z.infer<typeof MarketplacePlanSearchRequestSchema>;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Safely parse request body with Zod schema
 * Returns either the validated data or an error response
 */
export function parseRequestBody<T>(
  schema: z.ZodType<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string; details?: z.ZodIssue[] } {
  const result = schema.safeParse(body);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format error message
  const errorMessages = result.error.issues.map(issue => {
    const path = issue.path.join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
  });

  return {
    success: false,
    error: errorMessages.join('; '),
    details: result.error.issues,
  };
}
