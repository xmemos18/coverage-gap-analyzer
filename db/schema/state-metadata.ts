/**
 * State Metadata Schema
 * Comprehensive state-specific insurance information
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
  text,
} from 'drizzle-orm/pg-core';

/**
 * State Insurance Data
 * Core state-level insurance information
 */
export const states = pgTable('states', {
  id: serial('id').primaryKey(),
  stateCode: varchar('state_code', { length: 2 }).notNull().unique(), // e.g., 'CA'
  stateName: varchar('state_name', { length: 100 }).notNull(), // e.g., 'California'

  // Exchange information
  exchangeType: varchar('exchange_type', { length: 50 }).notNull(), // 'state', 'federal', 'partnership'
  exchangeName: varchar('exchange_name', { length: 200 }), // e.g., 'Covered California'
  exchangeWebsite: varchar('exchange_website', { length: 500 }),
  exchangePhone: varchar('exchange_phone', { length: 20 }),

  // Medicaid expansion
  medicaidExpanded: boolean('medicaid_expanded').notNull(),
  medicaidExpansionDate: timestamp('medicaid_expansion_date'),
  medicaidIncomeLimitAdults: decimal('medicaid_income_limit_adults', { precision: 5, scale: 2 }), // % of FPL
  medicaidIncomeLimitChildren: decimal('medicaid_income_limit_children', { precision: 5, scale: 2 }), // % of FPL
  medicaidWebsite: varchar('medicaid_website', { length: 500 }),
  medicaidProgramName: varchar('medicaid_program_name', { length: 200 }), // e.g., 'Medi-Cal' in CA

  // CHIP (Children's Health Insurance Program)
  chipIncomeLimitChildren: decimal('chip_income_limit_children', { precision: 5, scale: 2 }), // % of FPL
  chipWebsite: varchar('chip_website', { length: 500 }),
  chipProgramName: varchar('chip_program_name', { length: 200 }),

  // Insurance market characteristics
  dominantCarriers: jsonb('dominant_carriers'), // Array of top carriers by market share
  averageCarrierCount: integer('average_carrier_count'), // Average carriers per county
  marketConcentration: varchar('market_concentration', { length: 20 }), // 'low', 'medium', 'high'

  // Cost characteristics
  averagePremiumIndex: decimal('average_premium_index', { precision: 5, scale: 3 }), // Relative to national average (1.000)
  averagePremiumSingleAdult: decimal('average_premium_single_adult', { precision: 10, scale: 2 }),
  averagePremiumFamily: decimal('average_premium_family', { precision: 10, scale: 2 }),

  // State mandates
  individualMandate: boolean('individual_mandate').default(false), // State has its own mandate
  individualMandatePenalty: varchar('individual_mandate_penalty', { length: 200 }),

  // Enrollment periods
  openEnrollmentStart: varchar('open_enrollment_start', { length: 20 }), // e.g., '11-01'
  openEnrollmentEnd: varchar('open_enrollment_end', { length: 20 }), // e.g., '01-15'
  hasExtendedEnrollment: boolean('has_extended_enrollment').default(false),

  // Regulatory environment
  allowsShortTermPlans: boolean('allows_short_term_plans').default(true),
  shortTermMaxDuration: integer('short_term_max_duration'), // months
  requiresNavigators: boolean('requires_navigators').default(false),

  // Additional resources
  navigatorHotline: varchar('navigator_hotline', { length: 20 }),
  stateInsuranceDepartment: varchar('state_insurance_department', { length: 200 }),
  insuranceDepartmentWebsite: varchar('insurance_department_website', { length: 500 }),

  // Geographic data
  population: integer('population'),
  totalCounties: integer('total_counties'),
  urbanPercentage: decimal('urban_percentage', { precision: 5, scale: 2 }),

  // Metadata
  dataYear: integer('data_year').notNull(),
  lastVerified: timestamp('last_verified'),
  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * County-Level Data
 * Detailed county-specific insurance information
 */
export const counties = pgTable('counties', {
  id: serial('id').primaryKey(),
  stateCode: varchar('state_code', { length: 2 }).notNull(),
  countyName: varchar('county_name', { length: 100 }).notNull(),
  countyFips: varchar('county_fips', { length: 5 }).notNull().unique(), // Federal Information Processing Standard code

  // ACA rating area
  ratingArea: varchar('rating_area', { length: 20 }).notNull(),

  // Carrier availability
  availableCarriers: jsonb('available_carriers'), // Array of carriers
  carrierCount: integer('carrier_count').notNull(),
  hasMultipleCarriers: boolean('has_multiple_carriers').notNull(),

  // Average costs
  averageSilverPremium: decimal('average_silver_premium', { precision: 10, scale: 2 }),
  slcspPremium: decimal('slcsp_premium', { precision: 10, scale: 2 }), // Second Lowest Cost Silver Plan

  // Provider network availability
  hasNationalNetworks: boolean('has_national_networks').default(false),
  hasBroadNetworks: boolean('has_broad_networks').default(false),
  providerDensity: varchar('provider_density', { length: 20 }), // 'low', 'medium', 'high'

  // Urban/rural designation
  isUrban: boolean('is_urban').notNull(),
  isRural: boolean('is_rural').notNull(),
  isFrontierCounty: boolean('is_frontier_county').default(false), // Very low population density

  // Demographics
  population: integer('population'),
  medianIncome: decimal('median_income', { precision: 10, scale: 2 }),
  povertyRate: decimal('poverty_rate', { precision: 5, scale: 2 }),
  uninsuredRate: decimal('uninsured_rate', { precision: 5, scale: 2 }),

  dataYear: integer('data_year').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * ZIP Code to County Mapping
 * Some ZIP codes span multiple counties
 */
export const zipCodeMappings = pgTable('zip_code_mappings', {
  id: serial('id').primaryKey(),
  zipCode: varchar('zip_code', { length: 5 }).notNull(),
  stateCode: varchar('state_code', { length: 2 }).notNull(),
  countyFips: varchar('county_fips', { length: 5 }).notNull(),
  countyName: varchar('county_name', { length: 100 }).notNull(),

  // For ZIP codes that span counties, this indicates primary vs secondary
  isPrimary: boolean('is_primary').default(true),

  // City information
  cityName: varchar('city_name', { length: 100 }),

  // Geographic data
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Provider Networks
 * Carrier network availability by state/county
 */
export const providerNetworks = pgTable('provider_networks', {
  id: serial('id').primaryKey(),
  carrier: varchar('carrier', { length: 100 }).notNull(),
  networkName: varchar('network_name', { length: 200 }).notNull(),

  // Coverage area
  stateCode: varchar('state_code', { length: 2 }).notNull(),
  counties: jsonb('counties'), // Array of county FIPS codes where network available

  // Network characteristics
  networkType: varchar('network_type', { length: 50 }).notNull(), // 'national', 'regional', 'local'
  networkSize: varchar('network_size', { length: 20 }).notNull(), // 'broad', 'medium', 'narrow'

  // Provider counts
  totalProviders: integer('total_providers'),
  primaryCareCount: integer('primary_care_count'),
  specialistCount: integer('specialist_count'),
  hospitalCount: integer('hospital_count'),

  // Network adequacy
  meetsAdequacyStandards: boolean('meets_adequacy_standards').default(true),
  hasEssentialCommunityProviders: boolean('has_essential_community_providers').default(false),

  // Additional network features
  outOfNetworkCoverage: boolean('out_of_network_coverage').default(false),
  requiresReferrals: boolean('requires_referrals').default(false),
  telehealth: boolean('telehealth').default(false),

  planYear: integer('plan_year').notNull(),
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Multi-State Carrier Coverage
 * Tracks which carriers operate across multiple states
 */
export const multiStateCarriers = pgTable('multi_state_carriers', {
  id: serial('id').primaryKey(),
  carrierName: varchar('carrier_name', { length: 100 }).notNull(),
  parentCompany: varchar('parent_company', { length: 100 }),

  // States where carrier operates
  states: jsonb('states').notNull(), // Array of state codes

  // Market presence
  totalStates: integer('total_states').notNull(),
  isTrulyNational: boolean('is_truly_national').default(false), // Operates in 40+ states

  // Network reciprocity
  hasNetworkReciprocity: boolean('has_network_reciprocity').default(false), // Can use network across states
  reciprocityDetails: text('reciprocity_details'),

  // Insurance types offered
  offersACA: boolean('offers_aca').default(false),
  offersMedicare: boolean('offers_medicare').default(false),
  offersMedicaid: boolean('offers_medicaid').default(false),
  offersEmployer: boolean('offers_employer').default(false),

  // Contact information
  website: varchar('website', { length: 500 }),
  customerServicePhone: varchar('customer_service_phone', { length: 20 }),

  planYear: integer('plan_year').notNull(),
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Adjacent State Pairs
 * Pre-computed adjacent state relationships for multi-state analysis
 */
export const adjacentStates = pgTable('adjacent_states', {
  id: serial('id').primaryKey(),
  state1: varchar('state1', { length: 2 }).notNull(),
  state2: varchar('state2', { length: 2 }).notNull(),

  // Shared border length (rough measure of connectivity)
  borderMiles: decimal('border_miles', { precision: 10, scale: 2 }),

  // Common carrier overlap
  sharedCarriers: jsonb('shared_carriers'), // Array of carriers operating in both states

  // Network overlap score (0-100)
  networkOverlapScore: integer('network_overlap_score'),

  // Metropolitan areas that span border
  crossBorderMetros: jsonb('cross_border_metros'), // Array of metro area names

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Federal Poverty Level Data
 * Historical FPL thresholds for subsidy calculations
 */
export const federalPovertyLevels = pgTable('federal_poverty_levels', {
  id: serial('id').primaryKey(),
  year: integer('year').notNull(),
  state: varchar('state', { length: 2 }), // AK and HI have different FPLs

  // FPL thresholds by household size
  householdSize: integer('household_size').notNull(),
  annualIncome: decimal('annual_income', { precision: 10, scale: 2 }).notNull(),

  // Effective dates (FPL usually updates in January/February)
  effectiveDate: timestamp('effective_date').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Subsidy Calculation Tables
 * Pre-computed subsidy affordability percentages by income level
 */
export const subsidyTables = pgTable('subsidy_tables', {
  id: serial('id').primaryKey(),
  year: integer('year').notNull(),

  // Income range as % of FPL
  fplPercentageLow: decimal('fpl_percentage_low', { precision: 5, scale: 2 }).notNull(),
  fplPercentageHigh: decimal('fpl_percentage_high', { precision: 5, scale: 2 }).notNull(),

  // Maximum percentage of income for premiums
  maxAffordablePercentage: decimal('max_affordable_percentage', { precision: 5, scale: 2 }).notNull(),

  // Post-IRA 2022 enhancements
  isEnhanced: boolean('is_enhanced').default(false),

  effectiveDate: timestamp('effective_date').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Special Enrollment Period Rules
 * Qualifying life events and their rules by state
 */
export const specialEnrollmentPeriods = pgTable('special_enrollment_periods', {
  id: serial('id').primaryKey(),
  stateCode: varchar('state_code', { length: 2 }), // null for federal rules

  // Event type
  eventType: varchar('event_type', { length: 100 }).notNull(), // 'lost_coverage', 'moved', 'married', etc.
  eventDescription: text('event_description').notNull(),

  // SEP window
  sepDurationDays: integer('sep_duration_days').notNull(), // Usually 60 days
  coverageEffectiveRule: varchar('coverage_effective_rule', { length: 200 }), // When coverage starts

  // Documentation requirements
  requiresDocumentation: boolean('requires_documentation').default(true),
  documentationTypes: jsonb('documentation_types'), // Array of acceptable docs

  // Special rules
  retroactiveEffectiveDate: boolean('retroactive_effective_date').default(false),
  specialInstructions: text('special_instructions'),

  effectiveYear: integer('effective_year').notNull(),
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Enrollment Deadlines
 * Open enrollment and important dates by state/program
 */
export const enrollmentDeadlines = pgTable('enrollment_deadlines', {
  id: serial('id').primaryKey(),
  stateCode: varchar('state_code', { length: 2 }), // null for federal/Medicare
  programType: varchar('program_type', { length: 50 }).notNull(), // 'aca', 'medicare', 'medicaid'

  // Deadline details
  deadlineType: varchar('deadline_type', { length: 100 }).notNull(), // 'open_enrollment_start', 'aca_deadline', etc.
  deadlineDate: timestamp('deadline_date').notNull(),

  // Coverage effective date
  coverageEffectiveDate: timestamp('coverage_effective_date'),

  // Special notes
  notes: text('notes'),
  urgentDeadline: boolean('urgent_deadline').default(false), // Highlight critical deadlines

  year: integer('year').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
