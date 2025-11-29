/**
 * Healthcare.gov Marketplace API Data Sync Service
 * Syncs live plan data from Healthcare.gov into local database
 */

import { createHealthcareGovClient } from './client';
import type { Plan, Place, PlanSearchRequest } from './types';
import { getDb } from '../../../db/client';
import { acaPlans } from '../../../db/schema/insurance-costs';
import { eq } from 'drizzle-orm';

export interface SyncOptions {
  states?: string[]; // State codes to sync (defaults to all seeded states)
  year?: number; // Plan year (defaults to current year)
  clearExisting?: boolean; // Clear existing plans before syncing
  dryRun?: boolean; // Don't write to database, just log
}

interface SyncResult {
  success: boolean;
  plansAdded: number;
  plansUpdated: number;
  errors: string[];
  duration: number;
}

/**
 * Sync marketplace plans from Healthcare.gov API to database
 */
export async function syncMarketplacePlans(
  options: SyncOptions = {}
): Promise<SyncResult> {
  const startTime = Date.now();
  const result: SyncResult = {
    success: true,
    plansAdded: 0,
    plansUpdated: 0,
    errors: [],
    duration: 0,
  };

  try {
    console.log('🏥 Starting Healthcare.gov marketplace data sync...\n');

    // Initialize API client
    const client = createHealthcareGovClient();
    const db = getDb();

    // Determine states to sync
    const statesToSync = options.states || ['CA', 'FL', 'TX', 'NY', 'AZ'];
    const year = options.year || new Date().getFullYear();

    console.log(`📅 Syncing ${year} plans for states: ${statesToSync.join(', ')}\n`);

    // Clear existing plans if requested
    if (options.clearExisting && !options.dryRun) {
      console.log('🗑️  Clearing existing ACA plans...');
      await db.delete(acaPlans).where(eq(acaPlans.planYear, year));
      console.log('✓ Cleared existing plans\n');
    }

    // Sync each state
    for (const stateCode of statesToSync) {
      try {
        console.log(`📍 Syncing ${stateCode}...`);

        // Get counties for this state
        const counties = await getStateCounties(client, stateCode);
        console.log(`  Found ${counties.length} counties`);

        let statePlansAdded = 0;

        // Sample a few representative counties (to avoid rate limiting)
        const sampleCounties = counties.slice(0, 3);

        for (const county of sampleCounties) {
          try {
            // Search plans for this county
            const place: Place = {
              state: stateCode,
              countyfips: county.fips,
              zipcode: county.zipcode || '00000',
            };

            const searchRequest: PlanSearchRequest = {
              market: 'Individual',
              place,
              year,
              limit: 100,
            };

            const searchResult = await client.searchPlans(searchRequest);
            console.log(`    ${county.name}: ${searchResult.plans.length} plans found`);

            // Convert and store plans
            for (const apiPlan of searchResult.plans) {
              const planRecords = convertAPIPlantoDatabaseRecords(
                apiPlan,
                place,
                year
              );

              if (!options.dryRun) {
                for (const record of planRecords) {
                  await db.insert(acaPlans).values(record).onConflictDoNothing();
                  result.plansAdded++;
                  statePlansAdded++;
                }
              } else {
                result.plansAdded += planRecords.length;
              }
            }

            // Rate limiting: wait 1 second between counties
            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (_error) {
            const errorMsg = `Error syncing ${county.name}: ${_error instanceof Error ? _error.message : 'Unknown error'}`;
            console.error(`    ❌ ${errorMsg}`);
            result.errors.push(errorMsg);
          }
        }

        console.log(`  ✓ Synced ${statePlansAdded} plan records for ${stateCode}\n`);

      } catch (error) {
        const errorMsg = `Error syncing state ${stateCode}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}\n`);
        result.errors.push(errorMsg);
        result.success = false;
      }
    }

    result.duration = Date.now() - startTime;

    console.log('\n📊 Sync Summary:');
    console.log(`  Plans Added: ${result.plansAdded}`);
    console.log(`  Plans Updated: ${result.plansUpdated}`);
    console.log(`  Errors: ${result.errors.length}`);
    console.log(`  Duration: ${(result.duration / 1000).toFixed(2)}s`);
    console.log(`  Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);

    if (result.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      result.errors.forEach(err => console.log(`  - ${err}`));
    }

    return result;

  } catch (error) {
    result.success = false;
    result.duration = Date.now() - startTime;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    console.error('\n❌ Sync failed:', result.errors[0]);
    return result;
  }
}

/**
 * Get counties for a state
 */
async function getStateCounties(
  client: ReturnType<typeof createHealthcareGovClient>,
  stateCode: string
): Promise<Array<{ fips: string; name: string; zipcode?: string }>> {
  // Sample ZIP codes for each state to find counties
  const sampleZipsByState: Record<string, string[]> = {
    CA: ['90001', '94102', '92101'], // LA, SF, SD
    FL: ['33101', '32801', '33701'], // Miami, Orlando, Tampa
    TX: ['77001', '75201', '78701'], // Houston, Dallas, Austin
    NY: ['10001', '14201', '13201'], // NYC, Buffalo, Syracuse
    AZ: ['85001', '85701'], // Phoenix, Tucson
  };

  const zipCodes = sampleZipsByState[stateCode] || [];
  const counties: Array<{ fips: string; name: string; zipcode?: string }> = [];

  for (const zipcode of zipCodes) {
    try {
      const response = await client.getCountiesByZip(zipcode);
      if (response.counties && response.counties.length > 0) {
        const county = response.counties[0];
        // Only add if we have required fields
        if (county && county.fips && county.name) {
          counties.push({
            fips: county.fips,
            name: county.name,
            zipcode,
          });
        }
      }
    } catch (_error) {
      console.warn(`  Warning: Could not get counties for ${zipcode}`);
    }
  }

  return counties;
}

/**
 * Convert Healthcare.gov API plan to database records
 * Creates records for multiple ages with age-rated premiums
 */
function convertAPIPlantoDatabaseRecords(
  apiPlan: Plan,
  place: Place,
  year: number
): Array<{
  state: string;
  county: string;
  ratingArea: string;
  zipCode: string;
  metalTier: string;
  planType: string;
  carrier: string;
  planName: string;
  age: number;
  monthlyPremium: string;
  tobaccoSurcharge: string;
  deductible: string;
  oopMaximum: string;
  primaryCareVisit: string;
  specialistVisit: string;
  networkTier: string;
  nationalNetwork: boolean;
  planYear: number;
  dataSource: string;
  isActive: boolean;
}> {
  const records: Array<{
    state: string;
    county: string;
    ratingArea: string;
    zipCode: string;
    metalTier: string;
    planType: string;
    carrier: string;
    planName: string;
    age: number;
    monthlyPremium: string;
    tobaccoSurcharge: string;
    deductible: string;
    oopMaximum: string;
    primaryCareVisit: string;
    specialistVisit: string;
    networkTier: string;
    nationalNetwork: boolean;
    planYear: number;
    dataSource: string;
    isActive: boolean;
  }> = [];

  // Sample ages for premium calculation (Healthcare.gov uses age rating)
  const sampleAges = [21, 25, 30, 35, 40, 45, 50, 55, 60, 64];

  // Extract base premium (might be number or Premium object)
  const basePremium = typeof apiPlan.premium === 'number'
    ? apiPlan.premium
    : apiPlan.premium?.premium || 0;

  // Extract deductible (first deductible if multiple)
  const deductible = apiPlan.deductibles?.[0]?.amount || 0;

  // Extract out-of-pocket maximum (first MOOP if multiple)
  const oopMax = apiPlan.moops?.[0]?.amount || 0;

  // Extract copays
  const primaryCareCopay = apiPlan.in_network_primary_care?.copay_amount || 0;
  const specialistCopay = apiPlan.in_network_specialist?.copay_amount || 0;

  for (const age of sampleAges) {
    records.push({
      state: place.state,
      county: '', // Would need to look up county name from FIPS
      ratingArea: '', // Would need to call getRateArea API
      zipCode: place.zipcode,
      metalTier: apiPlan.metal_level,
      planType: apiPlan.type,
      carrier: apiPlan.issuer?.name || '',
      planName: apiPlan.name,
      age,
      monthlyPremium: basePremium.toString(),
      tobaccoSurcharge: '0', // Would need state-specific logic
      deductible: deductible.toString(),
      oopMaximum: oopMax.toString(),
      primaryCareVisit: primaryCareCopay.toString(),
      specialistVisit: specialistCopay.toString(),
      networkTier: apiPlan.has_national_network ? 'Broad' : 'Medium',
      nationalNetwork: apiPlan.has_national_network || false,
      planYear: year,
      dataSource: 'Healthcare.gov API',
      isActive: true,
    });
  }

  return records;
}

/**
 * Get eligibility estimates for a household
 */
export async function getHouseholdEligibility(
  place: Place,
  household: {
    income: number;
    people: Array<{
      age: number;
      uses_tobacco: boolean;
    }>;
  }
) {
  const client = createHealthcareGovClient();

  const eligibilityRequest = {
    market: 'Individual' as const,
    place,
    household: {
      income: household.income,
      people: household.people.map(person => ({
        age: person.age,
        aptc_eligible: true,
        gender: 'Female' as const, // Default for eligibility calculation
        uses_tobacco: person.uses_tobacco,
      })),
    },
  };

  const eligibility = await client.getEligibilityEstimates(eligibilityRequest);

  return eligibility;
}

/**
 * Search plans for a specific household
 */
export async function searchPlansForHousehold(
  place: Place,
  household: {
    income: number;
    people: Array<{
      age: number;
      uses_tobacco: boolean;
    }>;
  },
  options: {
    metalLevels?: string[];
    maxPremium?: number;
  } = {}
) {
  const client = createHealthcareGovClient();

  const searchRequest: PlanSearchRequest = {
    market: 'Individual',
    place,
    household: {
      income: household.income,
      people: household.people.map(person => ({
        age: person.age,
        aptc_eligible: true,
        gender: 'Female' as const,
        uses_tobacco: person.uses_tobacco,
      })),
    },
    filter: {
      metal_level: options.metalLevels,
      premium: options.maxPremium ? { max: options.maxPremium } : undefined,
    },
    limit: 50,
  };

  const result = await client.searchPlans(searchRequest);

  return result.plans;
}
