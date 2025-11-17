// Quick test script for Healthcare.gov API
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.HEALTHCARE_GOV_API_KEY;
const BASE_URL = 'https://marketplace.api.healthcare.gov/api/v1';

async function testAPIConnection() {
  console.log('Testing Healthcare.gov API connection...\n');

  if (!API_KEY) {
    console.error('❌ HEALTHCARE_GOV_API_KEY not found in .env.local');
    process.exit(1);
  }

  console.log('✓ API Key found:', API_KEY.substring(0, 8) + '...\n');

  try {
    // Test 1: Get counties for a sample ZIP code (33101 - Miami, FL - uses federal marketplace)
    console.log('Test 1: Fetching counties for ZIP 33101 (Miami, FL)...');
    const countyResponse = await fetch(
      `${BASE_URL}/counties/by/zip/33101`,
      {
        headers: {
          'apikey': API_KEY
        }
      }
    );

    if (!countyResponse.ok) {
      console.error('❌ County API request failed:', countyResponse.status, countyResponse.statusText);
      const errorText = await countyResponse.text();
      console.error('Error details:', errorText);
      process.exit(1);
    }

    const countyData = await countyResponse.json();
    console.log('✓ County API working!');
    console.log('  Counties found:', countyData.counties?.length || 0);
    if (countyData.counties?.[0]) {
      console.log('  Sample:', countyData.counties[0].name, '-', countyData.counties[0].state);
    }
    console.log();

    // Test 2: Search for plans in that county
    console.log('Test 2: Searching for plans...');

    // Get the FIPS code from the county data
    const fipsCode = countyData.counties?.[0]?.fips;
    if (!fipsCode) {
      console.error('❌ Could not get FIPS code from county data');
      process.exit(1);
    }

    const planSearchBody = {
      market: 'Individual',
      place: {
        countyfips: fipsCode,
        state: 'FL',
        zipcode: '33101'
      },
      year: 2024,
      limit: 5
    };

    const planResponse = await fetch(
      `${BASE_URL}/plans/search?apikey=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(planSearchBody)
      }
    );

    if (!planResponse.ok) {
      console.error('❌ Plan search failed:', planResponse.status, planResponse.statusText);
      const errorText = await planResponse.text();
      console.error('Error details:', errorText);
      process.exit(1);
    }

    const planData = await planResponse.json();
    console.log('✓ Plan search API working!');
    console.log('  Plans found:', planData.plans?.length || 0);
    if (planData.plans?.[0]) {
      console.log('  Sample plan:', planData.plans[0].name);
      console.log('  Issuer:', planData.plans[0].issuer?.name);
      console.log('  Metal level:', planData.plans[0].metal_level);
      console.log('  Type:', planData.plans[0].type);
    }
    console.log();

    console.log('🎉 All API tests passed! Healthcare.gov API is working correctly.\n');

  } catch (error) {
    console.error('❌ API test failed with error:', error.message);
    process.exit(1);
  }
}

testAPIConnection();
