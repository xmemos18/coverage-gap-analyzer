# Medicare Plan Data Integration Guide

## Important: Medicare Data vs Healthcare.gov Data

Unlike the Healthcare.gov Marketplace API, **CMS does not provide a real-time queryable REST API** for Medicare Advantage and Part D plan comparison data similar to Medicare Plan Finder.

## Why This Matters

The Medicare Plan Finder tool on Medicare.gov uses internal CMS databases that are **not publicly accessible via API**. Instead, CMS publishes Medicare plan data as:

1. **Monthly downloadable files** (CSV/Excel)
2. **Data.cms.gov datasets** (static snapshots)
3. **Landscape files** (annual plan offerings)

## Available Medicare Data Sources

### 1. Medicare Landscape Files (Best for Plan Comparisons)

**What**: Annual files released each September with all Medicare Advantage and Part D plan offerings for the upcoming year.

**URL**: https://www.cms.gov/data-research/statistics-trends-and-reports/medicare-advantagepart-d-contract-and-enrollment-data

**Contains**:
- Plan premiums
- Deductibles and out-of-pocket maximums
- Covered benefits (dental, vision, hearing, etc.)
- Star ratings
- Service areas (counties covered)
- Plan types (HMO, PPO, PFFS, etc.)
- Special Needs Plans (SNPs)

**Format**: Single combined CSV/Excel file (as of CY 2025)

**Update Schedule**: Annually in September before open enrollment

### 2. Data.cms.gov Datasets

**URL**: https://data.cms.gov/provider-data/topics/medicare-plan-finder

**API Access**: Yes, but requires dataset ID

**API Pattern**: `https://data.cms.gov/data-api/v1/dataset/{dataset-id}/data`

**Limitations**:
- Data is updated monthly (not real-time)
- Must know specific dataset ID
- Limited filtering compared to Healthcare.gov API
- Primarily enrollment and utilization data, not plan comparison data

### 3. Prescription Drug Plan Data

**Monthly Files**: Plan formulary and pharmacy network information

**URL**: https://data.cms.gov/provider-summary-by-type-of-service/medicare-part-d-prescribers/monthly-prescription-drug-plan-formulary-and-pharmacy-network-information

**Contains**:
- Drug formularies by plan
- Pharmacy network data
- Beneficiary cost sharing details
- Prior authorization requirements

## Implementation Options

### Option 1: Download Landscape Files (Recommended for Now)

Since there's no real-time API, the best approach is:

1. **Download the annual landscape file** from CMS
2. **Parse the CSV file** into your application database
3. **Query locally** by ZIP code, county, or plan features
4. **Update annually** during open enrollment period

**Pros**:
- Complete plan data
- Fast local queries
- No rate limits
- Works offline

**Cons**:
- Manual updates required
- Larger file sizes (~50-100MB)
- Not real-time
- Requires database setup

### Option 2: Use Data.cms.gov API (Limited)

For basic Medicare enrollment statistics and utilization data:

```typescript
// Example: Fetch Medicare Advantage enrollment data
const response = await fetch(
  'https://data.cms.gov/data-api/v1/dataset/{dataset-id}/data?limit=100'
);
const data = await response.json();
```

**Pros**:
- API access available
- No authentication required
- Standard JSON format

**Cons**:
- Limited to available datasets
- No plan comparison endpoint
- Primarily enrollment/utilization data
- Not suitable for "plan finder" features

### Option 3: Wait for Future CMS API Development

CMS is continuously improving their data offerings. Monitor:
- https://developer.cms.gov/
- https://data.cms.gov/
- CMS open enrollment announcements

## What We're Implementing

Given the limitations, here's our approach:

### Phase 1: Static Data Integration (Current)

1. **Provide instructions** for downloading Medicare landscape files
2. **Create parser utilities** for landscape file format
3. **Show sample data** with mock Medicare plans
4. **Display educational content** about Medicare options

### Phase 2: Local Database (Future Enhancement)

1. **Set up database schema** for Medicare plan data
2. **Import landscape files** into local database
3. **Create query functions** for ZIP code/county lookups
4. **Update annually** with new landscape files

### Phase 3: Real-Time API (If/When Available)

1. **Monitor CMS developer portal** for new APIs
2. **Integrate immediately** when Medicare Plan Finder API is released
3. **Maintain backward compatibility** with file-based approach

## Comparison: Healthcare.gov vs Medicare

| Feature | Healthcare.gov API | Medicare Data |
|---------|-------------------|---------------|
| **Real-time API** | ✅ Yes | ❌ No |
| **Plan search by ZIP** | ✅ Yes | ⚠️ Manual (files) |
| **Premium calculations** | ✅ Yes | ⚠️ Manual (files) |
| **Subsidy calculations** | ✅ Yes | N/A |
| **Authentication** | API Key | Not required |
| **Rate limits** | Yes | No (file downloads) |
| **Update frequency** | Real-time | Monthly/Annually |
| **Data format** | JSON (API) | CSV/Excel |
| **Plan details** | Complete | Complete |

## Current Application Behavior

For now, the Coverage Gap Analyzer will:

1. ✅ **Recommend Medicare** for eligible users (age 65+)
2. ✅ **Provide educational content** about Medicare options
3. ✅ **Link to Medicare.gov** Plan Finder for real plan searches
4. ✅ **Show Medicare Advantage comparisons** (Medigap vs MA)
5. ✅ **Display COBRA and HSA analysis** where applicable
6. ⚠️ **Use estimated costs** (not real plan premiums yet)
7. 🔜 **Future: Import landscape files** for real plan data

## Resources for Developers

### CMS Data Resources
- **Developer Portal**: https://developer.cms.gov/
- **Data Portal**: https://data.cms.gov/
- **Medicare Plan Data**: https://www.cms.gov/data-research/statistics-trends-and-reports/medicare-advantagepart-d-contract-and-enrollment-data

### Medicare Plan Finder
- **Official Tool**: https://www.medicare.gov/plan-compare/
- **User must use this** for accurate, real-time plan comparisons

### Documentation
- **API FAQ**: https://data.cms.gov/sites/default/files/2022-12/API%20Guide%20Formatted%201_2_0.pdf
- **Landscape Files**: Updated annually in September
- **Data Dictionary**: Included with landscape file downloads

## Frequently Asked Questions

### Q: Why doesn't Medicare have an API like Healthcare.gov?

A: The Medicare Plan Finder tool uses internal CMS systems that haven't been exposed as public APIs yet. CMS provides the data as downloadable files instead.

### Q: Can I scrape the Medicare Plan Finder website?

A: **No**. Scraping violates CMS terms of service. Use the official landscape files instead.

### Q: How often should I update the data?

A: **Annually** during Medicare open enrollment (October 15 - December 7). CMS releases new landscape files each September.

### Q: What about prescription drug coverage?

A: Part D drug formularies are available as monthly files from data.cms.gov, but they're very large (100k+ rows per file).

### Q: Will CMS ever create a Medicare Plan Finder API?

A: Unknown. CMS continuously improves their developer tools, so monitor https://developer.cms.gov/ for updates.

## Next Steps

If you want to implement Medicare plan data:

1. **Download landscape files** manually from CMS
2. **Set up a database** (PostgreSQL recommended)
3. **Import CSV data** using a script
4. **Create API endpoints** in your app to query the database
5. **Update annually** during open enrollment

This approach gives you the same data as Medicare Plan Finder, but requires more setup work than the Healthcare.gov API.

---

**Note**: This application currently uses **estimated Medicare costs** based on national averages. For accurate plan-specific information, users should visit **Medicare.gov/plan-compare**.
