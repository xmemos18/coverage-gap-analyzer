#!/usr/bin/env tsx

/**
 * CMS Data Import Script
 *
 * Command-line script to import CMS (Centers for Medicare & Medicaid) data
 * into the Coverage Gap Analyzer database.
 *
 * Usage:
 *   npm run import:cms                 - Run full import
 *   npm run import:cms:counties        - Import counties only
 *   npm run import:cms:slcsp           - Import SLCSP benchmarks only
 *   npm run import:cms:zips            - Import ZIP mappings only
 *   npm run import:cms:carriers        - Import carriers only
 *   npm run import:cms:validate        - Validate imported data
 */

import {
  importCountyData,
  importSLCSPData,
  importZIPMappings,
  importCarrierData,
  runFullImport,
  validateImportedData
} from '../lib/data-import/cms-importer';

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {
  counties: args.includes('--counties'),
  slcsp: args.includes('--slcsp'),
  zips: args.includes('--zips'),
  carriers: args.includes('--carriers'),
  validate: args.includes('--validate'),
  help: args.includes('--help') || args.includes('-h')
};

// Help text
function showHelp() {
  console.log(`
CMS Data Import Script
======================

Import healthcare data from CMS into the database.

Usage:
  npm run import:cms                 - Run full import (all data types)
  npm run import:cms:counties        - Import county and rating area data
  npm run import:cms:slcsp           - Import SLCSP benchmark pricing
  npm run import:cms:zips            - Import ZIP to county mappings
  npm run import:cms:carriers        - Import carrier participation data
  npm run import:cms:validate        - Validate imported data

Data Files Required:
  Place CSV files in: data/cms/
  - county-rating-areas.csv
  - slcsp-benchmarks.csv
  - zip-county-mapping.csv
  - carrier-participation.csv (optional)

For file format details, see: lib/data-import/README.md

Examples:
  # Import all data types
  npm run import:cms

  # Import only counties and SLCSP data
  npm run import:cms:counties
  npm run import:cms:slcsp

  # Validate data after import
  npm run import:cms:validate
  `);
}

// Main execution
async function main() {
  try {
    // Show help if requested
    if (flags.help) {
      showHelp();
      process.exit(0);
    }

    console.log('🏥 CMS Data Import Tool\n');

    // Validate data only
    if (flags.validate) {
      await validateImportedData();
      process.exit(0);
    }

    // Run selective imports
    if (flags.counties || flags.slcsp || flags.zips || flags.carriers) {
      console.log('Running selective import...\n');

      if (flags.counties) {
        await importCountyData();
        console.log('');
      }

      if (flags.slcsp) {
        await importSLCSPData();
        console.log('');
      }

      if (flags.zips) {
        await importZIPMappings();
        console.log('');
      }

      if (flags.carriers) {
        await importCarrierData();
        console.log('');
      }

      console.log('✅ Selective import completed successfully!');
      console.log('\nRun `npm run import:cms:validate` to verify data.');
      process.exit(0);
    }

    // Run full import (default)
    await runFullImport();
    console.log('\n✅ Full import completed successfully!');
    console.log('\nRun `npm run import:cms:validate` to verify data.');

  } catch (error) {
    console.error('\n❌ Import failed:', error);

    if (error instanceof Error) {
      console.error('\nError details:', error.message);

      if (error.message.includes('file not found')) {
        console.log('\n📝 Note: Ensure CSV files are placed in data/cms/ directory.');
        console.log('See lib/data-import/README.md for file format details.');
      }

      if (error.message.includes('database') || error.message.includes('connection')) {
        console.log('\n📝 Note: Check your DATABASE_URL in .env.local');
        console.log('Ensure Supabase database is running and accessible.');
      }
    }

    process.exit(1);
  }
}

// Run the script
main();
