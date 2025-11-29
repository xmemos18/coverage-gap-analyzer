#!/usr/bin/env tsx
/**
 * Healthcare.gov Marketplace API Sync Script
 * Syncs live plan data from Healthcare.gov into local database
 *
 * Usage:
 *   npm run api:sync
 *   npm run api:sync -- --dry-run
 *   npm run api:sync -- --states CA,FL,TX
 *   npm run api:sync -- --year 2025 --clear
 */

import 'dotenv/config';
import { syncMarketplacePlans, type SyncOptions } from '../lib/integrations/healthcare-gov/sync';

// Parse command line arguments
const args = process.argv.slice(2);
const options: SyncOptions = {
  dryRun: args.includes('--dry-run'),
  clearExisting: args.includes('--clear'),
};

// Parse states
const statesArg = args.find(arg => arg.startsWith('--states='));
if (statesArg) {
  const statesValue = statesArg.split('=')[1];
  if (statesValue) {
    options.states = statesValue.split(',');
  }
}

// Parse year
const yearArg = args.find(arg => arg.startsWith('--year='));
if (yearArg) {
  const yearValue = yearArg.split('=')[1];
  if (yearValue) {
    options.year = parseInt(yearValue, 10);
  }
}

// Show help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Healthcare.gov Marketplace API Sync

Usage:
  npm run api:sync [options]

Options:
  --dry-run              Don't write to database, just log what would happen
  --clear                Clear existing plans before syncing
  --states=CA,FL,TX      Sync specific states (comma-separated)
  --year=2025            Sync plans for specific year
  --help, -h             Show this help message

Examples:
  npm run api:sync
  npm run api:sync -- --dry-run
  npm run api:sync -- --states=CA,FL --year=2025
  npm run api:sync -- --clear --states=NY

Environment Variables:
  HEALTHCARE_GOV_API_KEY    Your Healthcare.gov API key (required)

Get an API key at:
  https://developer.cms.gov/marketplace-api/key-request.html
  `);
  process.exit(0);
}

// Check for API key
if (!process.env.HEALTHCARE_GOV_API_KEY) {
  console.error(`
❌ Error: HEALTHCARE_GOV_API_KEY environment variable not set.

Please add your API key to .env.local:

  HEALTHCARE_GOV_API_KEY=your_api_key_here

Request an API key at:
  https://developer.cms.gov/marketplace-api/key-request.html
  `);
  process.exit(1);
}

// Run sync
async function main() {
  console.log('Healthcare.gov Marketplace API Sync\n');

  if (options.dryRun) {
    console.log('⚠️  Running in DRY RUN mode - no data will be written\n');
  }

  if (options.states) {
    console.log(`States: ${options.states.join(', ')}`);
  }

  if (options.year) {
    console.log(`Year: ${options.year}`);
  }

  if (options.clearExisting) {
    console.log('⚠️  Will clear existing plans before syncing');
  }

  console.log('');

  try {
    const result = await syncMarketplacePlans(options);

    if (result.success) {
      console.log('\n✅ Sync completed successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Sync completed with errors');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  }
}

main();
