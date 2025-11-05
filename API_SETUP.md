# API Configuration Guide

This application integrates with several free APIs to provide real-time data. Follow the setup instructions below to enable these features.

## 1. Healthcare.gov Marketplace API

### What it does
- Fetches real ACA marketplace health insurance plans by ZIP code
- Shows actual premiums, deductibles, and out-of-pocket maximums
- Provides plan details (HMO, PPO, metal levels, quality ratings)
- Calculates premium tax credits and cost-sharing reductions

### Setup Instructions

1. **Request an API Key**
   - Visit: https://developer.cms.gov/marketplace-api/key-request.html
   - Fill out the API key request form
   - You'll receive your API key via email (usually within 1-2 business days)

2. **Add API Key to Environment**
   ```bash
   # Create .env.local if it doesn't exist
   touch .env.local

   # Add your API key
   echo "NEXT_PUBLIC_HEALTHCARE_GOV_API_KEY=your_api_key_here" >> .env.local
   ```

3. **Restart Development Server**
   ```bash
   npm run dev
   ```

### Verification
To verify the API is working, check the browser console. If configured correctly, you'll see real plan data when analyzing results. If not configured, you'll see a warning:
```
Healthcare.gov API key not configured. Request one at: https://developer.cms.gov/marketplace-api/key-request.html
```

### API Features Available
- ✅ Search plans by ZIP code and household info
- ✅ Get detailed plan information (benefits, costs, networks)
- ✅ Calculate subsidy eligibility (APTC, CSR)
- ✅ Filter by metal level, plan type, premium range
- ✅ Quality ratings for plans

### Rate Limits
- Rate limits are enforced by CMS
- Typically sufficient for development and small-scale production use
- Monitor API response headers for rate limit information

### Documentation
- Full API Docs: https://developer.cms.gov/marketplace-api/
- API Specifications: https://developer.cms.gov/marketplace-api/api-spec
- Support: marketplace-api@cms-provider-directory.uservoice.com

---

## 2. Zippopotam.us ZIP Code API

### What it does
- Validates US ZIP codes in real-time
- Returns city, state, and geographic coordinates
- Calculates distances between ZIP codes

### Setup Instructions
**No setup required!** This API is completely free and doesn't require an API key.

### Features
- ✅ Real-time ZIP validation
- ✅ Auto-populate city and state from ZIP
- ✅ Visual feedback for valid/invalid ZIPs
- ✅ Distance calculations between locations

### Documentation
- API Website: https://www.zippopotam.us/
- No rate limits
- No authentication required

---

## 3. Medicare Plan Data

### Important Note: No Real-Time API Available

**Unlike Healthcare.gov, Medicare does NOT have a public REST API** for plan comparison data.

CMS publishes Medicare plan data as downloadable files instead of providing a queryable API like the Marketplace API.

### What's Available

Medicare plan data is distributed through:

1. **Annual Landscape Files** - Complete plan offerings released each September
2. **Monthly Data Files** - Enrollment and utilization statistics
3. **Medicare Plan Finder** - CMS's own tool (no public API)

### Why This Matters

- ✅ You can get the **same data** as Medicare Plan Finder
- ❌ But it requires **downloading files** and importing to a database
- ❌ **Not real-time** - updated monthly/annually
- ❌ **No API key** available for plan searches

### How to Use Medicare Data

See **MEDICARE_DATA.md** in the project root for complete instructions on:

- Downloading CMS landscape files
- Setting up a local database
- Importing plan data
- Querying by ZIP code/county
- Update schedules

### Current Application Behavior

For Medicare-eligible users, this application:

- ✅ Recommends Medicare + Medigap or Medicare Advantage
- ✅ Provides educational content about Medicare options
- ✅ Estimates costs based on national averages
- ✅ Links to Medicare.gov Plan Finder for real plan searches
- ⚠️ **Does not show real plan premiums** (no API available)

### Future Enhancement

To add real Medicare plan data:

1. Download annual landscape file from CMS
2. Import CSV data into PostgreSQL/MySQL database
3. Create API endpoints to query the database
4. Update the application to use local data
5. Re-import annually during open enrollment

**Estimated effort**: 8-16 hours for initial setup + annual updates

### Resources

- **Landscape Files**: https://www.cms.gov/data-research/statistics-trends-and-reports/medicare-advantagepart-d-contract-and-enrollment-data
- **Medicare Plan Finder**: https://www.medicare.gov/plan-compare/
- **Implementation Guide**: See MEDICARE_DATA.md in this repository

---

## Environment Variables Reference

Create a `.env.local` file in the project root with the following:

```bash
# Healthcare.gov Marketplace API
NEXT_PUBLIC_HEALTHCARE_GOV_API_KEY=your_healthcare_gov_api_key

# Future APIs will be added here
# NEXT_PUBLIC_MEDICARE_API_KEY=your_medicare_api_key
```

**Important:**
- Never commit `.env.local` to version control (already in `.gitignore`)
- Use `NEXT_PUBLIC_` prefix for client-side environment variables in Next.js
- Restart the dev server after adding/changing environment variables

---

## Testing Without API Keys

The application will work without API keys, but with limited functionality:

### Without Healthcare.gov API:
- ✅ Basic insurance recommendations still work
- ✅ Cost estimates based on national averages
- ❌ No real marketplace plan data
- ❌ No actual premium quotes
- ❌ No plan-specific details

### With Healthcare.gov API:
- ✅ Everything above, plus:
- ✅ Real marketplace plans available in your area
- ✅ Actual premium costs for your household
- ✅ Quality ratings and plan comparisons
- ✅ Direct enrollment links

---

## Troubleshooting

### "API key not configured" warning
- Check that `.env.local` exists in project root
- Verify the variable name is exactly `NEXT_PUBLIC_HEALTHCARE_GOV_API_KEY`
- Ensure you've restarted the dev server after adding the key

### "API error: 401 Unauthorized"
- Your API key may be invalid or expired
- Request a new key from CMS

### "API error: 404" when searching plans
- ZIP code may not have marketplace coverage
- Try a different ZIP code
- Verify the ZIP is valid using the ZIP validation feature

### "API error: 429 Too Many Requests"
- You've hit the rate limit
- Wait a few minutes before trying again
- Consider implementing caching for production use

---

## Production Deployment

### Vercel / Netlify
Add environment variables in your hosting platform's dashboard:
- Variable name: `NEXT_PUBLIC_HEALTHCARE_GOV_API_KEY`
- Value: Your API key

### Self-Hosted
Set environment variables in your hosting environment or use a `.env.production` file (remember to add to `.gitignore`).

### Security Notes
- API keys with `NEXT_PUBLIC_` prefix are exposed to the browser
- The Healthcare.gov API is designed for client-side use
- Never expose server-side-only keys with the `NEXT_PUBLIC_` prefix
- Consider implementing rate limiting in production
- Monitor API usage through CMS developer portal

---

## Getting Help

- **Healthcare.gov API Issues**: marketplace-api@cms-provider-directory.uservoice.com
- **Application Issues**: Create an issue on GitHub
- **General Questions**: Check the FAQ in the project README

---

## API Costs

All APIs used in this application are **completely free**:

| API | Cost | Rate Limit | Registration |
|-----|------|------------|--------------|
| Healthcare.gov | Free | Yes | API Key Required |
| Zippopotam.us | Free | None | No Registration |
| Medicare.gov | Free | TBD | Coming Soon |

