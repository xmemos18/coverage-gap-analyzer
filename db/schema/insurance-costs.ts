/**
 * Insurance Cost Data Schema
 * Stores premiums, deductibles, and cost data for various insurance types
 */

import {
  pgTable,
  serial,
  varchar,
  integer,
  decimal,
  timestamp,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';

/**
 * ACA Marketplace Plan Costs
 * Age-rated premiums by state, county, and metal tier
 */
export const acaPlans = pgTable('aca_plans', {
  id: serial('id').primaryKey(),
  state: varchar('state', { length: 2 }).notNull(), // State code (e.g., 'CA')
  county: varchar('county', { length: 100 }).notNull(),
  ratingArea: varchar('rating_area', { length: 20 }).notNull(),
  zipCode: varchar('zip_code', { length: 5 }),

  // Plan details
  metalTier: varchar('metal_tier', { length: 20 }).notNull(), // Bronze, Silver, Gold, Platinum
  planType: varchar('plan_type', { length: 20 }).notNull(), // HMO, PPO, EPO, POS
  carrier: varchar('carrier', { length: 100 }).notNull(),
  planName: varchar('plan_name', { length: 200 }).notNull(),

  // Age-rated premiums (per age 0-120)
  age: integer('age').notNull(), // 0-64 for ACA
  monthlyPremium: decimal('monthly_premium', { precision: 10, scale: 2 }).notNull(),

  // Tobacco surcharge
  tobaccoSurcharge: decimal('tobacco_surcharge', { precision: 5, scale: 2 }).notNull(), // Percentage (e.g., 50.00 for 50%)

  // Cost-sharing details
  deductible: decimal('deductible', { precision: 10, scale: 2 }).notNull(),
  oopMaximum: decimal('oop_maximum', { precision: 10, scale: 2 }).notNull(),
  primaryCareVisit: decimal('primary_care_visit', { precision: 10, scale: 2 }),
  specialistVisit: decimal('specialist_visit', { precision: 10, scale: 2 }),

  // Network details
  networkTier: varchar('network_tier', { length: 50 }), // Broad, Medium, Narrow
  nationalNetwork: boolean('national_network').default(false),

  // Metadata
  planYear: integer('plan_year').notNull(), // 2024, 2025, etc.
  dataSource: varchar('data_source', { length: 100 }).notNull(), // 'CMS', 'Healthcare.gov API', etc.
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * SLCSP (Second Lowest Cost Silver Plan) Benchmark Data
 * Used for premium tax credit calculations
 */
export const slcspBenchmarks = pgTable('slcsp_benchmarks', {
  id: serial('id').primaryKey(),
  state: varchar('state', { length: 2 }).notNull(),
  county: varchar('county', { length: 100 }).notNull(),
  ratingArea: varchar('rating_area', { length: 20 }).notNull(),
  zipCode: varchar('zip_code', { length: 5 }).notNull(),

  // Age-rated SLCSP premiums
  age: integer('age').notNull(),
  slcspPremium: decimal('slcsp_premium', { precision: 10, scale: 2 }).notNull(),

  planYear: integer('plan_year').notNull(),
  effectiveDate: timestamp('effective_date').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Medicare Costs
 * Parts A, B, D, Medicare Advantage, and Medigap premiums
 */
export const medicareCosts = pgTable('medicare_costs', {
  id: serial('id').primaryKey(),

  // Part A (Hospital Insurance) - usually free if worked 40+ quarters
  partAPremium: decimal('part_a_premium', { precision: 10, scale: 2 }).notNull(), // 0 or ~$500/month if bought
  partADeductible: decimal('part_a_deductible', { precision: 10, scale: 2 }).notNull(),

  // Part B (Medical Insurance)
  partBPremium: decimal('part_b_premium', { precision: 10, scale: 2 }).notNull(), // Standard ~$174/month
  partBDeductible: decimal('part_b_deductible', { precision: 10, scale: 2 }).notNull(),

  // IRMAA (Income-Related Monthly Adjustment Amount) tiers
  irmaaTier: integer('irmaa_tier').notNull(), // 0 (no IRMAA) to 5 (highest)
  irmaaThreshold: decimal('irmaa_threshold', { precision: 12, scale: 2 }).notNull(), // Income threshold
  irmaaAmount: decimal('irmaa_amount', { precision: 10, scale: 2 }).notNull(), // Additional premium

  planYear: integer('plan_year').notNull(),
  effectiveDate: timestamp('effective_date').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Medigap Plan Costs
 * Supplemental insurance to cover Medicare gaps
 */
export const medigapPlans = pgTable('medigap_plans', {
  id: serial('id').primaryKey(),
  state: varchar('state', { length: 2 }).notNull(),
  zipCode: varchar('zip_code', { length: 5 }),

  planLetter: varchar('plan_letter', { length: 2 }).notNull(), // A, B, C, D, F, G, K, L, M, N
  carrier: varchar('carrier', { length: 100 }).notNull(),

  // Age-rated or community-rated
  ratingMethod: varchar('rating_method', { length: 20 }).notNull(), // 'community', 'issue-age', 'attained-age'
  age: integer('age'), // null for community-rated
  gender: varchar('gender', { length: 10 }), // Some states allow gender rating
  tobacco: boolean('tobacco').default(false),

  monthlyPremium: decimal('monthly_premium', { precision: 10, scale: 2 }).notNull(),

  // Household discount
  householdDiscount: decimal('household_discount', { precision: 5, scale: 2 }), // Percentage

  planYear: integer('plan_year').notNull(),
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Medicare Advantage (Part C) Plans
 * Replacement for Original Medicare with additional benefits
 */
export const medicareAdvantagePlans = pgTable('medicare_advantage_plans', {
  id: serial('id').primaryKey(),
  state: varchar('state', { length: 2 }).notNull(),
  county: varchar('county', { length: 100 }).notNull(),
  zipCode: varchar('zip_code', { length: 5 }).notNull(),

  planName: varchar('plan_name', { length: 200 }).notNull(),
  carrier: varchar('carrier', { length: 100 }).notNull(),
  planType: varchar('plan_type', { length: 20 }).notNull(), // HMO, PPO, PFFS, SNP

  monthlyPremium: decimal('monthly_premium', { precision: 10, scale: 2 }).notNull(), // In addition to Part B

  // Cost-sharing
  medicalDeductible: decimal('medical_deductible', { precision: 10, scale: 2 }),
  drugDeductible: decimal('drug_deductible', { precision: 10, scale: 2 }),
  oopMaximum: decimal('oop_maximum', { precision: 10, scale: 2 }).notNull(),

  // Additional benefits
  dentalCoverage: boolean('dental_coverage').default(false),
  visionCoverage: boolean('vision_coverage').default(false),
  hearingCoverage: boolean('hearing_coverage').default(false),
  partDCoverage: boolean('part_d_coverage').default(false), // Prescription drug coverage

  // Network restrictions
  serviceArea: jsonb('service_area'), // Counties/ZIP codes where plan available
  networkSize: varchar('network_size', { length: 20 }), // 'small', 'medium', 'large'
  requiresReferrals: boolean('requires_referrals').default(false),

  // Star rating
  starRating: decimal('star_rating', { precision: 2, scale: 1 }), // 1.0 to 5.0

  planYear: integer('plan_year').notNull(),
  contractId: varchar('contract_id', { length: 20 }).notNull(), // CMS contract ID
  planId: varchar('plan_id', { length: 20 }).notNull(), // CMS plan ID

  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Part D (Prescription Drug) Plans
 * Standalone prescription drug coverage for Medicare
 */
export const partDPlans = pgTable('part_d_plans', {
  id: serial('id').primaryKey(),
  state: varchar('state', { length: 2 }).notNull(),
  region: varchar('region', { length: 50 }).notNull(), // Part D regions (34 regions nationwide)

  planName: varchar('plan_name', { length: 200 }).notNull(),
  carrier: varchar('carrier', { length: 100 }).notNull(),

  monthlyPremium: decimal('monthly_premium', { precision: 10, scale: 2 }).notNull(),
  annualDeductible: decimal('annual_deductible', { precision: 10, scale: 2 }).notNull(),

  // Coverage gap (donut hole)
  coverageGapDiscount: decimal('coverage_gap_discount', { precision: 5, scale: 2 }).notNull(),

  // Formulary
  formularyTiers: integer('formulary_tiers').notNull(), // Usually 3-5 tiers
  preferredPharmacy: boolean('preferred_pharmacy').default(false),
  mailOrderAvailable: boolean('mail_order_available').default(false),

  // Star rating
  starRating: decimal('star_rating', { precision: 2, scale: 1 }),

  planYear: integer('plan_year').notNull(),
  contractId: varchar('contract_id', { length: 20 }).notNull(),
  planId: varchar('plan_id', { length: 20 }).notNull(),

  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Employer-Sponsored Insurance Benchmark Costs
 * Average costs for employer plans by state and industry
 */
export const employerInsuranceCosts = pgTable('employer_insurance_costs', {
  id: serial('id').primaryKey(),
  state: varchar('state', { length: 2 }).notNull(),

  // Plan details
  coverageType: varchar('coverage_type', { length: 20 }).notNull(), // 'individual', 'family'
  planType: varchar('plan_type', { length: 20 }).notNull(), // HMO, PPO, HDHP

  // Costs
  averageMonthlyPremium: decimal('average_monthly_premium', { precision: 10, scale: 2 }).notNull(),
  employeeContribution: decimal('employee_contribution', { precision: 10, scale: 2 }).notNull(),
  employerContribution: decimal('employer_contribution', { precision: 10, scale: 2 }).notNull(),

  averageDeductible: decimal('average_deductible', { precision: 10, scale: 2 }).notNull(),
  averageOopMaximum: decimal('average_oop_maximum', { precision: 10, scale: 2 }).notNull(),

  // Industry (optional grouping)
  industry: varchar('industry', { length: 100 }),
  companySize: varchar('company_size', { length: 20 }), // 'small', 'medium', 'large'

  dataYear: integer('data_year').notNull(),
  dataSource: varchar('data_source', { length: 100 }).notNull(), // 'KFF', 'BLS', etc.

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Add-On Insurance Costs
 * Dental, vision, life, disability insurance
 */
export const addOnInsuranceCosts = pgTable('add_on_insurance_costs', {
  id: serial('id').primaryKey(),
  state: varchar('state', { length: 2 }),

  insuranceType: varchar('insurance_type', { length: 50 }).notNull(), // 'dental', 'vision', 'life', 'disability'
  coverageLevel: varchar('coverage_level', { length: 50 }).notNull(), // 'individual', 'family', 'basic', 'comprehensive'

  carrier: varchar('carrier', { length: 100 }),
  planName: varchar('plan_name', { length: 200 }),

  // Costs
  monthlyPremiumLow: decimal('monthly_premium_low', { precision: 10, scale: 2 }).notNull(),
  monthlyPremiumHigh: decimal('monthly_premium_high', { precision: 10, scale: 2 }).notNull(),
  annualMaximum: decimal('annual_maximum', { precision: 10, scale: 2 }), // For dental/vision

  // Coverage details (flexible JSON for different insurance types)
  coverageDetails: jsonb('coverage_details'),

  planYear: integer('plan_year').notNull(),
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Cost Adjustment Factors
 * Regional multipliers and adjustment factors
 */
export const costAdjustmentFactors = pgTable('cost_adjustment_factors', {
  id: serial('id').primaryKey(),
  state: varchar('state', { length: 2 }).notNull(),
  county: varchar('county', { length: 100 }),

  // Geographic cost index
  geographicCostIndex: decimal('geographic_cost_index', { precision: 5, scale: 3 }).notNull(), // 0.850 to 1.450

  // Urban vs rural
  isUrban: boolean('is_urban').default(true),
  urbanMultiplier: decimal('urban_multiplier', { precision: 5, scale: 3 }),

  // Competition index (more carriers = lower costs)
  carrierCount: integer('carrier_count'),
  competitionIndex: decimal('competition_index', { precision: 5, scale: 3 }),

  effectiveYear: integer('effective_year').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
