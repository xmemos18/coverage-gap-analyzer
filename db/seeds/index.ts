/**
 * Main Database Seeding Script
 * Run with: npm run db:seed
 */

import 'dotenv/config';
import { seedACAPlans } from './01-aca-marketplace-plans';
import { seedMedicareAdvantagePlans } from './02-medicare-advantage-plans';
import { seedCarriersAndStates } from './03-carriers-and-states';
import { seedMedicareAndMedigapCosts } from './04-medicare-costs';
import { getDb } from '../client';

async function main() {
  console.log('🚀 Starting database seeding...\n');

  try {
    // Ensure database connection
    getDb();

    // Run seeds in order
    await seedCarriersAndStates();
    console.log('');

    await seedACAPlans();
    console.log('');

    await seedMedicareAdvantagePlans();
    console.log('');

    await seedMedicareAndMedigapCosts();
    console.log('');

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

main();
