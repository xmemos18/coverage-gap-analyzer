/**
 * Database Seeding Script
 * Populates database with initial data from hardcoded constants and comprehensive state data
 */

import { eq } from 'drizzle-orm';
import { getDb } from '../client';
import { seedStates } from './states';
import { seedFederalPovertyLevels } from './fpl';
import { seedMedicareCosts } from './medicare';
import { seedSubsidyTables } from './subsidy-tables';
import { seedEnrollmentDeadlines } from './enrollment-deadlines';
import { seedCostConstants } from './cost-constants';
import { seedAdjacentStates } from './adjacent-states';
import { dataImports } from '../schema';

async function main() {
  console.log('🌱 Starting database seeding...\n');

  const db = getDb();
  const startTime = Date.now();

  try {
    // Log the import
    const importRecord = await db
      .insert(dataImports)
      .values({
        importName: 'Initial Database Seed',
        dataSource: 'Hardcoded Constants + Research',
        dataType: 'all',
        status: 'processing',
        importedBy: 'system',
        importMethod: 'automated',
        targetTables: [
          'states',
          'counties',
          'federal_poverty_levels',
          'medicare_costs',
          'subsidy_tables',
          'enrollment_deadlines',
          'adjacent_states',
          'cost_adjustment_factors',
        ],
      })
      .returning();

    console.log(`📝 Import record created: ${importRecord[0].importId}\n`);

    // Seed data in dependency order
    let totalRows = 0;

    // 1. Federal Poverty Levels (no dependencies)
    console.log('1️⃣  Seeding Federal Poverty Levels...');
    const fplRows = await seedFederalPovertyLevels(db);
    totalRows += fplRows;
    console.log(`   ✅ Seeded ${fplRows} FPL records\n`);

    // 2. Medicare costs (no dependencies)
    console.log('2️⃣  Seeding Medicare costs...');
    const medicareRows = await seedMedicareCosts(db);
    totalRows += medicareRows;
    console.log(`   ✅ Seeded ${medicareRows} Medicare records\n`);

    // 3. Subsidy tables (no dependencies)
    console.log('3️⃣  Seeding subsidy tables...');
    const subsidyRows = await seedSubsidyTables(db);
    totalRows += subsidyRows;
    console.log(`   ✅ Seeded ${subsidyRows} subsidy records\n`);

    // 4. States (no dependencies) - ALL 51 JURISDICTIONS
    console.log('4️⃣  Seeding states (all 51 jurisdictions)...');
    const stateRows = await seedStates(db);
    totalRows += stateRows;
    console.log(`   ✅ Seeded ${stateRows} state records\n`);

    // 5. Adjacent states (depends on states)
    console.log('5️⃣  Seeding adjacent state pairs...');
    const adjacentRows = await seedAdjacentStates(db);
    totalRows += adjacentRows;
    console.log(`   ✅ Seeded ${adjacentRows} adjacent state records\n`);

    // 6. Cost constants migrated from lib/constants.ts
    console.log('6️⃣  Seeding cost adjustment factors...');
    const costRows = await seedCostConstants(db);
    totalRows += costRows;
    console.log(`   ✅ Seeded ${costRows} cost factor records\n`);

    // 7. Enrollment deadlines
    console.log('7️⃣  Seeding enrollment deadlines...');
    const deadlineRows = await seedEnrollmentDeadlines(db);
    totalRows += deadlineRows;
    console.log(`   ✅ Seeded ${deadlineRows} deadline records\n`);

    // Update import record as completed
    const endTime = Date.now();
    const processingTime = Math.floor((endTime - startTime) / 1000);

    await db
      .update(dataImports)
      .set({
        status: 'completed',
        completedAt: new Date(),
        processingTime,
        rowsProcessed: totalRows,
        rowsImported: totalRows,
        rowsSkipped: 0,
        rowsFailed: 0,
      })
      .where(eq(dataImports.id, importRecord[0].id));

    console.log('\n✨ Database seeding completed successfully!');
    console.log(`📊 Total records seeded: ${totalRows}`);
    console.log(`⏱️  Processing time: ${processingTime}s`);
    console.log(`\n🎯 Next steps:`);
    console.log(`   1. Import CMS SLCSP data: npm run db:import:slcsp`);
    console.log(`   2. Import rate review data: npm run db:import:rates`);
    console.log(`   3. Import Medicare plan data: npm run db:import:medicare`);
    console.log(`   4. Open Drizzle Studio to verify: npm run db:studio\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);

    // Log the failure
    await db
      .update(dataImports)
      .set({
        status: 'failed',
        completedAt: new Date(),
        logs: error instanceof Error ? error.message : String(error),
      })
      .where(eq(dataImports.importId, importRecord[0].importId));

    process.exit(1);
  }
}

// Run seeding
main();
