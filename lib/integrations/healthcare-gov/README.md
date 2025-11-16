## Healthcare.gov Marketplace API Integration

This integration provides typed access to the CMS Marketplace API v1, enabling real-time health insurance plan data from Healthcare.gov.

### Features

- **Complete API Coverage**: All major endpoints (plans, eligibility, providers, drugs, geographic data)
- **TypeScript Types**: Fully typed request/response interfaces
- **Auto-sync**: Automated database synchronization with live plan data
- **Rate Limiting**: Built-in request throttling to respect API limits
- **Error Handling**: Comprehensive error handling with detailed messages

### Getting Started

#### 1. Request an API Key

Visit the [CMS Developer Portal](https://developer.cms.gov/marketplace-api/key-request.html) to request your free API key.

#### 2. Set Environment Variable

Add your API key to `.env.local`:

```env
HEALTHCARE_GOV_API_KEY=your_api_key_here
```

#### 3. Use the Client

```typescript
import { createHealthcareGovClient } from '@/lib/integrations/healthcare-gov';

const client = createHealthcareGovClient();

// Search for plans
const plans = await client.searchPlans({
  market: 'Individual',
  place: {
    state: 'CA',
    countyfips: '06037', // Los Angeles County
    zipcode: '90001',
  },
  household: {
    income: 52000,
    people: [{
      age: 27,
      aptc_eligible: true,
      gender: 'Female',
      uses_tobacco: false,
    }],
  },
  year: 2025,
});

// Get eligibility estimates
const eligibility = await client.getEligibilityEstimates({
  market: 'Individual',
  place: {
    state: 'CA',
    countyfips: '06037',
    zipcode: '90001',
  },
  household: {
    income: 52000,
    people: [{
      age: 27,
      aptc_eligible: true,
      gender: 'Female',
      uses_tobacco: false,
    }],
  },
  year: 2025,
});

console.log(`APTC: $${eligibility.eligibility[0]?.aptc}`);
console.log(`CSR: ${eligibility.eligibility[0]?.csr}`);
```

### Syncing Data to Database

The integration includes a data sync service to populate your database with live plan data:

```bash
# Sync all states for current year
npm run api:sync

# Dry run (don't write to database)
npm run api:sync -- --dry-run

# Sync specific states
npm run api:sync -- --states CA,FL,TX

# Sync for specific year
npm run api:sync -- --year 2025

# Clear existing plans before syncing
npm run api:sync -- --clear
```

Or use programmatically:

```typescript
import { syncMarketplacePlans } from '@/lib/integrations/healthcare-gov';

const result = await syncMarketplacePlans({
  states: ['CA', 'FL', 'TX'],
  year: 2025,
  clearExisting: true,
  dryRun: false,
});

console.log(`Added ${result.plansAdded} plans in ${result.duration}ms`);
```

### Available Methods

#### Plan Search & Details
- `searchPlans()` - Search insurance plans with filters
- `getPlan()` - Get basic plan details
- `getPlanWithPremium()` - Get plan with household-specific premiums
- `getPlans()` - Get multiple plans for comparison

#### Household & Eligibility
- `getEligibilityEstimates()` - Calculate APTC and CSR eligibility
- `getSLCSP()` - Get Second Lowest Cost Silver Plan
- `getLCSP()` - Get Lowest Cost Silver Plan
- `getLCBP()` - Get Lowest Cost Bronze Plan
- `getFPLPercentage()` - Calculate Federal Poverty Level percentage

#### Geographic & Reference Data
- `getCountiesByZip()` - Find counties by ZIP code
- `getCounty()` - Get county details by FIPS
- `getStates()` - List all U.S. states
- `getState()` - Get specific state details
- `getStateMedicaid()` - Get state Medicaid eligibility
- `getPovertyGuidelines()` - Get federal poverty guidelines
- `getRateArea()` - Determine insurance rate area

#### Drug Coverage
- `autocompleteDrug()` - Autocomplete drug search
- `searchDrugs()` - Search for prescription drugs
- `getDrugCoverage()` - Check drug coverage by plan

#### Provider Coverage
- `searchProviders()` - Search for healthcare providers
- `autocompleteProvider()` - Autocomplete provider search
- `getProviderCoverage()` - Check provider network status

#### Quality & Issuers
- `getQualityRatings()` - Get plan quality star ratings
- `getIssuers()` - List insurance issuers
- `getIssuer()` - Get specific issuer details

### Rate Limiting

The API is rate-limited per key. The client includes:
- Request timeout (30s default)
- 1-second delay between county syncs
- Automatic error handling for rate limit errors

Rate limit information is included in response headers. Contact the Marketplace API team for limit increases.

### Error Handling

All methods throw descriptive errors:

```typescript
try {
  const plans = await client.searchPlans(request);
} catch (error) {
  if (error instanceof Error) {
    console.error(`API Error: ${error.message}`);
    // Example: "Healthcare.gov API Error (400): Invalid ZIP code"
  }
}
```

### Data Sources

This integration uses official CMS data sources:
- **Healthcare.gov Marketplace API**: Real-time plan data
- **CMS Plan Finder**: Medicare Advantage and Part D plans
- **Federal Poverty Guidelines**: Annual income thresholds
- **State Medicaid Programs**: Eligibility criteria by state

### API Documentation

- **Developer Portal**: https://developer.cms.gov/marketplace-api/
- **API Specifications**: https://developer.cms.gov/marketplace-api/api-spec
- **Support**: marketplace-api@cms-provider-directory.uservoice.com

### License

This integration uses publicly available CMS APIs. Ensure compliance with [CMS Terms of Service](https://www.cms.gov/About-CMS/Agency-Information/Aboutwebsite/Privacy-Policy).
