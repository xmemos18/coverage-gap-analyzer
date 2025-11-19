# CMS Data Import Guide

This directory contains scripts to import healthcare data from CMS (Centers for Medicare & Medicaid Services) into the Coverage Gap Analyzer database.

## Data Sources

### 1. County and Rating Area Data
**Source:** CMS Marketplace Public Use Files (PUF)
- **URL:** https://www.cms.gov/CCIIO/Resources/Data-Resources/marketplace-puf
- **Download:** Individual Market Medical - Plan Attributes
- **File Type:** CSV/ZIP
- **Contains:** State codes, county names, FIPS codes, rating areas

### 2. SLCSP (Second Lowest Cost Silver Plan) Benchmark Data
**Source:** Healthcare.gov Tax Tool Data
- **URL:** https://www.healthcare.gov/tax-tool/
- **Alternative:** CMS Rate Review & Transparency Files
- **File Type:** CSV
- **Contains:** Benchmark premiums by rating area and age

### 3. ZIP Code to County Mappings
**Source:** HUD USPS ZIP Code Crosswalk Files
- **URL:** https://www.huduser.gov/portal/datasets/usps_crosswalk.html
- **File Type:** XLSX/CSV
- **Contains:** ZIP codes mapped to county FIPS codes

### 4. Carrier Participation Data
**Source:** CMS Plan Landscape Files
- **URL:** https://download.cms.gov/marketplace-puf/
- **File Type:** CSV
- **Contains:** Issuer participation by county, plan counts

---

## Directory Structure

```
data/
└── cms/
    ├── county-rating-areas.csv
    ├── slcsp-benchmarks.csv
    ├── zip-county-mapping.csv
    └── carrier-participation.csv (optional)
```

---

## CSV File Formats

### 1. county-rating-areas.csv

**Required Columns:**
```csv
state_code,county_name,county_fips,rating_area,urban_rural,population,median_income,poverty_rate,uninsured_rate
CA,Los Angeles,06037,7,urban,10014009,71805,13.7,9.1
TX,Harris,48201,11,urban,4731145,61708,15.1,18.3
```

**Column Descriptions:**
- `state_code`: 2-letter state abbreviation (e.g., CA, TX, NY)
- `county_name`: Full county name
- `county_fips`: 5-digit FIPS code (state + county)
- `rating_area`: CMS rating area number for the county
- `urban_rural`: Either "urban" or "rural"
- `population`: County population (optional)
- `median_income`: Median household income in dollars (optional)
- `poverty_rate`: Percentage below poverty line (optional)
- `uninsured_rate`: Percentage uninsured (optional)

### 2. slcsp-benchmarks.csv

**Required Columns:**
```csv
state_code,rating_area,year,age_21,age_27,age_30,age_40,age_50,age_60
CA,7,2024,298.45,325.67,362.15,398.32,525.48,798.21
TX,11,2024,285.12,311.24,346.18,380.56,502.05,763.45
```

**Column Descriptions:**
- `state_code`: 2-letter state abbreviation
- `rating_area`: Rating area number (matches county file)
- `year`: Plan year (e.g., 2024, 2025)
- `age_21` through `age_60`: Monthly premium for SLCSP at each age

### 3. zip-county-mapping.csv

**Required Columns:**
```csv
zip_code,county_fips,state_code,city,latitude,longitude
90001,06037,CA,Los Angeles,33.973,-118.249
77001,48201,TX,Houston,29.759,-95.369
```

**Column Descriptions:**
- `zip_code`: 5-digit ZIP code
- `county_fips`: 5-digit county FIPS code
- `state_code`: 2-letter state abbreviation
- `city`: City name
- `latitude`: Decimal latitude (optional)
- `longitude`: Decimal longitude (optional)

### 4. carrier-participation.csv (Optional)

**Required Columns:**
```csv
state_code,county_fips,carrier_name,issuer_id,network_type,metal_levels,plan_count,market_share
CA,06037,Blue Shield,53517,regional,"Bronze,Silver,Gold,Platinum",45,25.3
TX,48201,Blue Cross Blue Shield,10742,national,"Bronze,Silver,Gold",38,42.1
```

**Column Descriptions:**
- `state_code`: 2-letter state abbreviation
- `county_fips`: 5-digit county FIPS code
- `carrier_name`: Insurance carrier/issuer name
- `issuer_id`: CMS issuer ID number
- `network_type`: national, regional, or local
- `metal_levels`: Comma-separated list of plan tiers offered
- `plan_count`: Number of plans offered in county
- `market_share`: Percentage of market (optional)

---

## Quick Start

### 1. Download CMS Data Files

**For County/Rating Area Data:**
1. Visit https://www.cms.gov/marketplace-puf
2. Download latest "Individual Market Medical - Plan Attributes" file
3. Extract and locate rating area information
4. Convert to `county-rating-areas.csv` format

**For SLCSP Benchmarks:**
1. Visit https://www.healthcare.gov/tax-tool/
2. Download premium benchmark data
3. Convert to `slcsp-benchmarks.csv` format

**For ZIP Mappings:**
1. Visit https://www.huduser.gov/portal/datasets/usps_crosswalk.html
2. Download latest ZIP-County crosswalk
3. Convert to `zip-county-mapping.csv` format

### 2. Place Files in Data Directory

```bash
mkdir -p data/cms
# Move downloaded/converted CSV files to data/cms/
```

### 3. Run Import Script

```bash
# Full import (all data)
npm run import:cms

# Individual imports
npm run import:cms:counties
npm run import:cms:slcsp
npm run import:cms:zips
npm run import:cms:carriers
```

### 4. Validate Imported Data

```bash
npm run import:cms:validate
```

---

## Sample Data for Top 10 States

We've included sample data for the top 10 priority states to get started quickly:

**States Included:**
1. California (CA)
2. Texas (TX)
3. Florida (FL)
4. New York (NY)
5. Pennsylvania (PA)
6. Illinois (IL)
7. Ohio (OH)
8. Georgia (GA)
9. North Carolina (NC)
10. Michigan (MI)

To use sample data:
```bash
# Copy sample data to data directory
cp data/samples/cms/*.csv data/cms/

# Run import
npm run import:cms
```

---

## Automation & Updates

### Quarterly Data Refresh

CMS updates marketplace data quarterly. To refresh:

```bash
# Download latest CMS files
./scripts/download-cms-data.sh

# Run import with --update flag
npm run import:cms -- --update
```

### Scheduled Updates

Set up a cron job or GitHub Action to auto-update:

```yaml
# .github/workflows/update-cms-data.yml
name: Update CMS Data
on:
  schedule:
    - cron: '0 0 1 */3 *'  # Every quarter on the 1st
  workflow_dispatch:  # Manual trigger

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Download CMS Data
        run: ./scripts/download-cms-data.sh
      - name: Import Data
        run: npm run import:cms
```

---

## Troubleshooting

### Common Issues

**1. "County data file not found"**
- Ensure files are in `data/cms/` directory
- Check file names match exactly (case-sensitive)
- Verify CSV format is correct

**2. "Database connection error"**
- Check `DATABASE_URL` in `.env.local`
- Ensure Supabase database is running
- Verify network connectivity

**3. "Duplicate county FIPS error"**
- Some ZIPs span multiple counties (handled automatically)
- Check for data quality issues in source files
- Use `--update` flag to update existing records

**4. "Missing SLCSP pricing for some counties"**
- Not all counties have marketplace plans
- Rural areas may not have rating area data
- Check CMS data coverage for your state

### Data Quality Checks

After import, run validation:
```bash
npm run import:cms:validate
```

This will report:
- Total counties imported
- Counties missing SLCSP pricing
- Counties without carrier data
- ZIP codes without county mappings

---

## API Integration (Alternative to File Import)

For automated, real-time data updates, consider using CMS APIs directly:

### Healthcare.gov API
```typescript
import { getCountyRatingArea, getSLCSPBenchmark } from '@/lib/api/healthcare-gov';

const ratingArea = await getCountyRatingArea('06037'); // LA County
const slcsp = await getSLCSPBenchmark('CA', '7', 27); // CA Rating Area 7, Age 27
```

### Benefits:
- Always current data
- No manual file downloads
- Automatic updates

### Drawbacks:
- Rate limits (10 req/min)
- Requires API key
- Network dependency

---

## Advanced Usage

### Import Specific States Only

```typescript
import { importCountyData } from '@/lib/data-import/cms-importer';

// Filter function to import only California
await importCountyData({
  filter: (county) => county.stateCode === 'CA'
});
```

### Custom Data Transformations

```typescript
import { importSLCSPData } from '@/lib/data-import/cms-importer';

// Apply cost adjustment multiplier
await importSLCSPData({
  transform: (slcsp) => ({
    ...slcsp,
    age27Premium: slcsp.age27Premium * 1.05 // 5% adjustment
  })
});
```

---

## References

- [CMS Marketplace PUF Documentation](https://www.cms.gov/marketplace-puf)
- [Healthcare.gov Developer Portal](https://www.healthcare.gov/developers/)
- [Rating Areas Explained](https://www.cms.gov/CCIIO/Programs-and-Initiatives/Health-Insurance-Market-Reforms/state-gra)
- [SLCSP Calculator Documentation](https://www.irs.gov/affordable-care-act/individuals-and-families/questions-and-answers-on-the-premium-tax-credit)

---

## Support

For questions or issues:
1. Check existing GitHub issues
2. Review CMS documentation
3. Open new issue with error details
4. Include sample data files (no PII)
