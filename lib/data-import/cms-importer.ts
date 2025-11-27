/**
 * CMS Data Importer
 *
 * Imports county, rating area, and SLCSP (Second Lowest Cost Silver Plan) data
 * from CMS (Centers for Medicare & Medicaid Services) public data files.
 *
 * Data Sources:
 * - County and Rating Area: https://www.cms.gov/CCIIO/Resources/Data-Resources/marketplace-puf
 * - SLCSP Benchmarks: https://www.healthcare.gov/tax-tool/
 * - Plan Landscape Files: https://download.cms.gov/marketplace-puf/
 *
 * Usage:
 * - Download CMS data files to /data/cms/ directory
 * - Run: npm run import:cms
 * - Data will be imported to Supabase database
 */

import { getDb } from '@/db/client';
import { counties, zipCodeMappings } from '@/db/schema/state-metadata';
import { sql, eq, and, isNull } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';

// CMS data file paths
const DATA_DIR = path.join(process.cwd(), 'data', 'cms');
const COUNTY_FILE = 'county-rating-areas.csv';
const SLCSP_FILE = 'slcsp-benchmarks.csv';
const ZIP_FILE = 'zip-county-mapping.csv';
const CARRIER_FILE = 'carrier-participation.csv';

interface CMSCountyData {
  stateCode: string;
  countyName: string;
  countyFIPS: string;
  ratingArea: string;
  urbanRural: 'urban' | 'rural';
  population?: number;
  medianIncome?: number;
  povertyRate?: number;
  uninsuredRate?: number;
}

interface SLCSPData {
  stateCode: string;
  ratingArea: string;
  year: number;
  age21Premium: number;
  age27Premium: number;
  age30Premium: number;
  age40Premium: number;
  age50Premium: number;
  age60Premium: number;
}

interface ZIPMappingData {
  zipCode: string;
  countyFIPS: string;
  stateCode: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

interface CarrierData {
  stateCode: string;
  countyFIPS: string;
  carrierName: string;
  issuerID: string;
  networkType: 'national' | 'regional' | 'local';
  metalLevelsOffered: string[];
  planCount: number;
  marketShare?: number;
}

/**
 * Import county and rating area data from CMS files
 */
export async function importCountyData(): Promise<void> {
  console.log('📍 Importing county and rating area data...');

  const filePath = path.join(DATA_DIR, COUNTY_FILE);

  if (!fs.existsSync(filePath)) {
    throw new Error(`County data file not found: ${filePath}`);
  }

  const countyData: CMSCountyData[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        countyData.push({
          stateCode: row.state_code || row.StateCode,
          countyName: row.county_name || row.CountyName,
          countyFIPS: row.county_fips || row.CountyFIPS,
          ratingArea: row.rating_area || row.RatingArea,
          urbanRural: (row.urban_rural || row.UrbanRural)?.toLowerCase() === 'urban' ? 'urban' : 'rural',
          population: row.population ? parseInt(row.population) : undefined,
          medianIncome: row.median_income ? parseInt(row.median_income) : undefined,
          povertyRate: row.poverty_rate ? parseFloat(row.poverty_rate) : undefined,
          uninsuredRate: row.uninsured_rate ? parseFloat(row.uninsured_rate) : undefined
        });
      })
      .on('end', async () => {
        console.log(`✅ Parsed ${countyData.length} counties from CSV`);

        try {
          // Insert counties in batches of 100
          const batchSize = 100;
          for (let i = 0; i < countyData.length; i += batchSize) {
            const batch = countyData.slice(i, i + batchSize);

            await getDb().insert(counties).values(
              batch.map(county => ({
                stateCode: county.stateCode,
                countyName: county.countyName,
                countyFips: county.countyFIPS,
                ratingArea: county.ratingArea,
                isUrban: county.urbanRural === 'urban',
                isRural: county.urbanRural === 'rural',
                population: county.population,
                medianIncome: county.medianIncome?.toString(),
                povertyRate: county.povertyRate?.toString(),
                uninsuredRate: county.uninsuredRate?.toString(),
                availableCarriers: [], // Will be populated by carrier import
                carrierCount: 0,
                hasMultipleCarriers: false,
                slcspPremium: null, // Will be populated by SLCSP import
                dataYear: new Date().getFullYear(),
                createdAt: new Date(),
                updatedAt: new Date()
              }))
            ).onConflictDoUpdate({
              target: [counties.countyFips],
              set: {
                ratingArea: sql`excluded.rating_area`,
                updatedAt: new Date()
              }
            });

            console.log(`   Imported batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(countyData.length / batchSize)}`);
          }

          console.log(`✅ Successfully imported ${countyData.length} counties`);
          resolve();
        } catch (error) {
          console.error('❌ Error importing counties:', error);
          reject(error);
        }
      })
      .on('error', reject);
  });
}

/**
 * Import SLCSP benchmark pricing data
 */
export async function importSLCSPData(): Promise<void> {
  console.log('💰 Importing SLCSP benchmark pricing...');

  const filePath = path.join(DATA_DIR, SLCSP_FILE);

  if (!fs.existsSync(filePath)) {
    throw new Error(`SLCSP data file not found: ${filePath}`);
  }

  const slcspData: SLCSPData[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        slcspData.push({
          stateCode: row.state_code || row.StateCode,
          ratingArea: row.rating_area || row.RatingArea,
          year: row.year ? parseInt(row.year) : new Date().getFullYear(),
          age21Premium: parseFloat(row.age_21 || row.Age21 || '0'),
          age27Premium: parseFloat(row.age_27 || row.Age27 || '0'),
          age30Premium: parseFloat(row.age_30 || row.Age30 || '0'),
          age40Premium: parseFloat(row.age_40 || row.Age40 || '0'),
          age50Premium: parseFloat(row.age_50 || row.Age50 || '0'),
          age60Premium: parseFloat(row.age_60 || row.Age60 || '0')
        });
      })
      .on('end', async () => {
        console.log(`✅ Parsed ${slcspData.length} SLCSP records from CSV`);

        try {
          // Update counties with SLCSP pricing
          for (const slcsp of slcspData) {
            await getDb().update(counties)
              .set({
                slcspPremium: slcsp.age27Premium.toString(), // Store age 27 as baseline
                updatedAt: new Date()
              })
              .where(
                and(
                  eq(counties.stateCode, slcsp.stateCode),
                  eq(counties.ratingArea, slcsp.ratingArea)
                )
              );
          }

          console.log(`✅ Successfully updated ${slcspData.length} rating areas with SLCSP pricing`);
          resolve();
        } catch (error) {
          console.error('❌ Error importing SLCSP data:', error);
          reject(error);
        }
      })
      .on('error', reject);
  });
}

/**
 * Import ZIP to county mappings
 *
 * Note: County names are looked up from the counties table using a batch query
 * for efficiency, rather than individual lookups per ZIP code.
 */
export async function importZIPMappings(): Promise<void> {
  console.log('🗺️  Importing ZIP to county mappings...');

  const filePath = path.join(DATA_DIR, ZIP_FILE);

  if (!fs.existsSync(filePath)) {
    throw new Error(`ZIP mapping file not found: ${filePath}`);
  }

  const zipData: ZIPMappingData[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        zipData.push({
          zipCode: row.zip_code || row.ZipCode || row.zip,
          countyFIPS: row.county_fips || row.CountyFIPS || row.fips,
          stateCode: row.state_code || row.StateCode || row.state,
          city: row.city || row.City || '',
          latitude: row.latitude ? parseFloat(row.latitude) : undefined,
          longitude: row.longitude ? parseFloat(row.longitude) : undefined
        });
      })
      .on('end', async () => {
        console.log(`✅ Parsed ${zipData.length} ZIP code mappings from CSV`);

        try {
          // Build a cache of county names by FIPS to avoid repeated queries
          console.log('   Building county name lookup cache...');
          const uniqueFips = [...new Set(zipData.map(z => z.countyFIPS))];
          const countyNameCache = new Map<string, string>();

          // Query all counties at once for efficiency
          const allCounties = await getDb()
            .select({ countyFips: counties.countyFips, countyName: counties.countyName })
            .from(counties);

          for (const county of allCounties) {
            countyNameCache.set(county.countyFips, county.countyName);
          }

          console.log(`   Loaded ${countyNameCache.size} county names for ${uniqueFips.length} unique FIPS codes`);

          // Insert ZIP mappings in batches
          const batchSize = 500;
          for (let i = 0; i < zipData.length; i += batchSize) {
            const batch = zipData.slice(i, i + batchSize);

            await getDb().insert(zipCodeMappings).values(
              batch.map(zip => ({
                zipCode: zip.zipCode,
                countyFips: zip.countyFIPS,
                countyName: countyNameCache.get(zip.countyFIPS) || '',
                stateCode: zip.stateCode,
                cityName: zip.city,
                latitude: zip.latitude?.toString(),
                longitude: zip.longitude?.toString(),
                createdAt: new Date()
              }))
            ).onConflictDoNothing();

            console.log(`   Imported batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(zipData.length / batchSize)}`);
          }

          console.log(`✅ Successfully imported ${zipData.length} ZIP code mappings`);
          resolve();
        } catch (error) {
          console.error('❌ Error importing ZIP mappings:', error);
          reject(error);
        }
      })
      .on('error', reject);
  });
}

/**
 * Import carrier participation data
 */
export async function importCarrierData(): Promise<void> {
  console.log('🏥 Importing carrier participation data...');

  const filePath = path.join(DATA_DIR, CARRIER_FILE);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Carrier data file not found: ${filePath} (skipping)`);
    return;
  }

  const carrierData: CarrierData[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        carrierData.push({
          stateCode: row.state_code || row.StateCode,
          countyFIPS: row.county_fips || row.CountyFIPS,
          carrierName: row.carrier_name || row.CarrierName,
          issuerID: row.issuer_id || row.IssuerID,
          networkType: (row.network_type || row.NetworkType || 'regional') as 'national' | 'regional' | 'local',
          metalLevelsOffered: (row.metal_levels || row.MetalLevels || '').split(',').map((m: string) => m.trim()),
          planCount: parseInt(row.plan_count || row.PlanCount || '0'),
          marketShare: row.market_share ? parseFloat(row.market_share) : undefined
        });
      })
      .on('end', async () => {
        console.log(`✅ Parsed ${carrierData.length} carrier participation records from CSV`);

        try {
          // Group carriers by county
          const carriersByCounty = new Map<string, string[]>();

          for (const carrier of carrierData) {
            const existing = carriersByCounty.get(carrier.countyFIPS) || [];
            if (!existing.includes(carrier.carrierName)) {
              existing.push(carrier.carrierName);
            }
            carriersByCounty.set(carrier.countyFIPS, existing);
          }

          // Update counties with carrier lists
          for (const [countyFIPS, carriers] of carriersByCounty.entries()) {
            await getDb().update(counties)
              .set({
                availableCarriers: carriers,
                carrierCount: carriers.length,
                hasMultipleCarriers: carriers.length > 1,
                updatedAt: new Date()
              })
              .where(eq(counties.countyFips, countyFIPS));
          }

          console.log(`✅ Successfully updated ${carriersByCounty.size} counties with carrier participation`);
          resolve();
        } catch (error) {
          console.error('❌ Error importing carrier data:', error);
          reject(error);
        }
      })
      .on('error', reject);
  });
}

/**
 * Run all CMS data imports in sequence
 */
export async function runFullImport(): Promise<void> {
  console.log('🚀 Starting full CMS data import...\n');

  const startTime = Date.now();

  try {
    // Step 1: Import counties and rating areas
    await importCountyData();
    console.log('');

    // Step 2: Import SLCSP benchmark pricing
    await importSLCSPData();
    console.log('');

    // Step 3: Import ZIP to county mappings
    await importZIPMappings();
    console.log('');

    // Step 4: Import carrier participation (optional)
    await importCarrierData();
    console.log('');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Full import completed in ${duration}s`);
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}

/**
 * Validate imported data
 */
export async function validateImportedData(): Promise<void> {
  console.log('🔍 Validating imported data...\n');

  const countyCount = await getDb().select({ count: sql`count(*)` }).from(counties);
  const zipCount = await getDb().select({ count: sql`count(*)` }).from(zipCodeMappings);

  console.log(`📊 Data Summary:`);
  console.log(`   Counties: ${countyCount[0]?.count || 0}`);
  console.log(`   ZIP Codes: ${zipCount[0]?.count || 0}`);

  // Check for counties without SLCSP pricing
  const countiesWithoutSLCSP = await getDb().select()
    .from(counties)
    .where(isNull(counties.slcspPremium))
    .limit(10);

  if (countiesWithoutSLCSP.length > 0) {
    console.log(`\n⚠️  Found ${countiesWithoutSLCSP.length} counties without SLCSP pricing (showing first 10):`);
    countiesWithoutSLCSP.forEach(c => {
      console.log(`   - ${c.countyName}, ${c.stateCode} (Rating Area: ${c.ratingArea})`);
    });
  } else {
    console.log(`\n✅ All counties have SLCSP pricing`);
  }

  // Check for counties without carriers
  const countiesWithoutCarriers = await getDb().select()
    .from(counties)
    .where(sql`array_length(${counties.availableCarriers}, 1) IS NULL OR array_length(${counties.availableCarriers}, 1) = 0`)
    .limit(10);

  if (countiesWithoutCarriers.length > 0) {
    console.log(`\n⚠️  Found ${countiesWithoutCarriers.length} counties without carrier data (showing first 10):`);
    countiesWithoutCarriers.forEach(c => {
      console.log(`   - ${c.countyName}, ${c.stateCode}`);
    });
  } else {
    console.log(`\n✅ All counties have carrier data`);
  }
}

// Export individual functions for selective imports
const cmsImporter = {
  importCountyData,
  importSLCSPData,
  importZIPMappings,
  importCarrierData,
  runFullImport,
  validateImportedData
};

export default cmsImporter;
