# Database Setup Guide

This guide covers setting up the PostgreSQL database using Supabase for the Coverage Gap Analyzer.

## Overview

The application uses:
- **PostgreSQL** (via Supabase free tier) for data persistence
- **Drizzle ORM** for type-safe database operations
- **Drizzle Kit** for migrations and schema management

## Table of Contents

1. [Database Schema](#database-schema)
2. [Supabase Setup](#supabase-setup)
3. [Local Development Setup](#local-development-setup)
4. [Database Operations](#database-operations)
5. [Data Management](#data-management)
6. [Troubleshooting](#troubleshooting)

## Database Schema

The database is organized into three main schema categories:

### 1. Insurance Costs (`db/schema/insurance-costs.ts`)

Contains all premium and cost data:

- **`aca_plans`** - Age-rated ACA marketplace plan premiums by state/county/metal tier
- **`slcsp_benchmarks`** - Second Lowest Cost Silver Plan data for subsidy calculations
- **`medicare_costs`** - Medicare Parts A/B premiums and IRMAA tiers
- **`medigap_plans`** - Supplemental Medicare insurance (Plans A-N)
- **`medicare_advantage_plans`** - Medicare Advantage (Part C) plans with benefits
- **`part_d_plans`** - Prescription drug coverage plans
- **`employer_insurance_costs`** - Average employer plan costs by state
- **`add_on_insurance_costs`** - Dental, vision, life, disability insurance
- **`cost_adjustment_factors`** - Geographic cost multipliers and indexes

### 2. State Metadata (`db/schema/state-metadata.ts`)

State-specific insurance information:

- **`states`** - Core state insurance data (exchanges, Medicaid expansion, carriers)
- **`counties`** - County-level data (rating areas, carrier availability, costs)
- **`zip_code_mappings`** - ZIP code to county mappings
- **`provider_networks`** - Carrier network availability and adequacy
- **`multi_state_carriers`** - Carriers operating across multiple states
- **`adjacent_states`** - State adjacency relationships and network overlap
- **`federal_poverty_levels`** - FPL thresholds by year and household size
- **`subsidy_tables`** - Premium tax credit affordability percentages
- **`special_enrollment_periods`** - SEP rules and qualifying events
- **`enrollment_deadlines`** - Open enrollment and important dates

### 3. Audit & Versioning (`db/schema/audit.ts`)

Data integrity and monitoring:

- **`audit_log`** - Tracks all data modifications
- **`data_versions`** - Versioned data snapshots for rollback
- **`analysis_sessions`** - User calculator sessions (privacy-respecting, no PII)
- **`api_call_logs`** - External API call tracking (Healthcare.gov, Medicare.gov)
- **`data_quality_alerts`** - Flags for outdated or suspicious data
- **`system_health_metrics`** - Application performance metrics
- **`data_imports`** - Bulk data import history from CMS/exchanges

## Supabase Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Configure your project:
   - **Name**: `coverage-gap-analyzer` (or your preference)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users (e.g., `us-east-1`)
   - **Pricing Plan**: Free tier (500 MB database, 500 MB storage)

4. Wait 2-3 minutes for project to provision

### Step 2: Get Database Connection Strings

1. In Supabase Dashboard, go to **Settings** → **Database**
2. Find "Connection string" section
3. Copy **Transaction** mode connection string:
   ```
   postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
4. Also copy **Direct** connection string (for migrations):
   ```
   postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres
   ```

### Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your database URLs:
   ```bash
   # Transaction mode (use for application)
   DATABASE_URL=postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

   # Direct connection (use for migrations)
   DATABASE_URL_DIRECT=postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres
   ```

3. **Important**: Replace `[password]` in URLs with your actual database password

## Local Development Setup

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `@supabase/supabase-js` - Supabase client
- `drizzle-orm` - ORM for type-safe queries
- `drizzle-kit` - Migration and schema management
- `postgres` - PostgreSQL client for Node.js

### Step 2: Generate Migrations

Generate SQL migration files from your TypeScript schema:

```bash
npm run db:generate
```

This creates migration files in `db/migrations/` directory.

### Step 3: Apply Migrations

Push your schema to the Supabase database:

```bash
npm run db:push
```

Or use migrations (recommended for production):

```bash
npm run db:migrate
```

### Step 4: Verify Database

Open Drizzle Studio to browse your database:

```bash
npm run db:studio
```

This opens a web interface at `https://local.drizzle.studio` where you can:
- View all tables
- Browse data
- Run queries
- Inspect relationships

## Database Operations

### Available NPM Scripts

```bash
# Generate migrations from schema changes
npm run db:generate

# Push schema directly to database (dev only)
npm run db:push

# Run pending migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio

# Seed database with initial data
npm run db:seed

# Reset database (WARNING: deletes all data!)
npm run db:reset
```

### Making Schema Changes

1. **Edit schema files** in `db/schema/`:
   - `insurance-costs.ts` - Cost data tables
   - `state-metadata.ts` - State information tables
   - `audit.ts` - Audit and tracking tables

2. **Generate migration**:
   ```bash
   npm run db:generate
   ```

3. **Review migration** in `db/migrations/` to ensure it's correct

4. **Apply migration**:
   ```bash
   npm run db:migrate
   ```

### Querying the Database

```typescript
import { getDb } from '@/db/client';
import { states, acaPlans } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Get database instance
const db = getDb();

// Query examples
const californiaData = await db
  .select()
  .from(states)
  .where(eq(states.stateCode, 'CA'));

const silverPlans = await db
  .select()
  .from(acaPlans)
  .where(eq(acaPlans.metalTier, 'Silver'))
  .limit(10);
```

## Data Management

### Seeding Initial Data

The application includes comprehensive seed scripts to populate the database with:

1. **All 51 jurisdictions** - Complete state data
2. **Federal Poverty Levels** - Historical FPL data for subsidy calculations
3. **Medicare costs** - Part A/B/D premiums and IRMAA tiers
4. **Subsidy tables** - Premium tax credit affordability percentages
5. **Enrollment deadlines** - Open enrollment dates
6. **Base cost data** - Migrated from hardcoded constants

To seed the database:

```bash
npm run db:seed
```

This will:
- Check for existing data (won't duplicate)
- Populate all tables with initial values
- Create data version snapshot
- Log import to `data_imports` table

### Importing CMS Data

The application supports importing real plan data from CMS public datasets:

```bash
# Download and import SLCSP data
npm run db:import:slcsp

# Import rate review data
npm run db:import:rates

# Import Medicare Plan Finder data
npm run db:import:medicare
```

See `docs/DATA_SOURCES.md` for details on data sources and import procedures.

### Data Versioning

All critical data changes are tracked:

```typescript
// Create a new data version before major updates
await createDataVersion({
  versionName: '2025-Q1-Cost-Update',
  description: 'Updated ACA plan costs for 2025',
  dataType: 'insurance_costs',
  affectedTables: ['aca_plans', 'slcsp_benchmarks'],
  affectedStates: ['CA', 'NY', 'TX'], // or null for all states
});

// Make your data changes...

// Activate the version
await activateDataVersion(versionId);

// Rollback if needed
await rollbackDataVersion(versionId);
```

### Admin API Routes

Admin endpoints for data management (requires authentication):

```typescript
// GET /api/admin/states - List all states
// POST /api/admin/states - Create/update state data
// GET /api/admin/plans?state=CA - Get plans by state
// POST /api/admin/plans/import - Import bulk plan data
// GET /api/admin/audit?table=aca_plans - View audit log
```

See `docs/API.md` for full API documentation.

## Troubleshooting

### Connection Issues

**Error**: `Error: DATABASE_URL is not defined`

**Solution**: Ensure `.env.local` exists and contains `DATABASE_URL`:
```bash
cp .env.example .env.local
# Edit .env.local and add your Supabase connection string
```

---

**Error**: `connection timed out` or `could not connect to server`

**Solutions**:
1. Check your internet connection
2. Verify Supabase project is active (not paused due to inactivity)
3. Check Supabase status: https://status.supabase.com
4. Ensure you're using Transaction mode URL for app, Direct for migrations

---

**Error**: `prepare must not be called while in pipeline mode`

**Solution**: The database client is configured with `prepare: false` for Supabase compatibility. This is already set in `db/client.ts`.

### Migration Issues

**Error**: `relation "table_name" already exists`

**Solution**: Your database already has these tables. Either:
1. Drop tables and re-run: `npm run db:reset && npm run db:push`
2. Or create a new migration: `npm run db:generate`

---

**Error**: Migration fails with foreign key constraint violation

**Solution**:
1. Check data dependencies
2. Seed data in correct order (states → counties → plans)
3. Review migration SQL in `db/migrations/`

### Performance Issues

**Slow queries**

**Solutions**:
1. Add indexes to frequently queried columns (see schema files)
2. Use connection pooling (already configured)
3. Enable caching for expensive queries
4. Consider upgrading Supabase plan for better performance

---

**Connection pool exhausted**

**Solution**: Adjust pool size in `db/client.ts`:
```typescript
max: process.env.NODE_ENV === 'production' ? 20 : 5, // Increase if needed
```

### Data Quality Issues

**Outdated data warnings**

**Solution**: The `data_quality_alerts` table flags outdated data. Run updates:
```bash
npm run db:update:cms-data
```

---

**Missing state data**

**Solution**: Seed missing states:
```bash
npm run db:seed:states
```

## Best Practices

### Development

1. **Always use migrations** for schema changes (not `db:push` in production)
2. **Test migrations** locally before deploying
3. **Backup before major changes**: Supabase auto-backups daily, but create manual backup for safety
4. **Use transactions** for multi-table updates
5. **Monitor query performance** with Drizzle Studio

### Production

1. **Enable RLS** (Row Level Security) in Supabase for admin tables
2. **Set up monitoring** with data quality alerts
3. **Schedule regular data updates** (weekly CMS data refresh)
4. **Monitor connection pool** usage
5. **Review audit logs** regularly for anomalies

### Data Updates

1. **Create data version** before major updates
2. **Validate data** before activation
3. **Test with sample data** first
4. **Enable rollback** capability
5. **Document changes** in version notes

## Next Steps

1. ✅ Complete Supabase setup
2. ✅ Apply migrations
3. 🔄 Seed initial data: `npm run db:seed`
4. 📊 Populate state data for all 51 jurisdictions
5. 📥 Import CMS datasets (SLCSP, rate data)
6. 🔌 Integrate Healthcare.gov API
7. 🔌 Integrate Medicare.gov API
8. ✨ Build admin dashboard
9. 📈 Set up monitoring and alerts

## Resources

- **Drizzle ORM Docs**: https://orm.drizzle.team/docs/overview
- **Supabase Docs**: https://supabase.com/docs
- **CMS Data Sources**: `docs/DATA_SOURCES.md`
- **API Documentation**: `docs/API.md`
- **Schema Reference**: `db/schema/README.md`

## Support

For issues or questions:
1. Check this documentation
2. Review Drizzle Studio for data issues
3. Check Supabase logs: Dashboard → Logs
4. Consult `docs/TROUBLESHOOTING.md`
5. File an issue on GitHub

---

**Version**: 1.0.0
**Last Updated**: 2025-11-14
**Maintained By**: Coverage Gap Analyzer Team
