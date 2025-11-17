// Test Next.js API endpoints
const BASE_URL = 'http://localhost:3000';

async function testEndpoints() {
  console.log('Testing Next.js API endpoints...\n');

  try {
    // Test 1: Counties endpoint
    console.log('Test 1: GET /api/counties/33101');
    const countyRes = await fetch(`${BASE_URL}/api/counties/33101`);
    if (!countyRes.ok) {
      throw new Error(`County endpoint failed: ${countyRes.status}`);
    }
    const countyData = await countyRes.json();
    console.log('✓ Counties endpoint working');
    console.log('  Counties:', countyData.counties?.length || 0);
    console.log();

    // Test 2: Marketplace plans search
    console.log('Test 2: POST /api/marketplace-plans/search');
    const searchRes = await fetch(`${BASE_URL}/api/marketplace-plans/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zipcode: '33101',
        state: 'FL',
        year: 2024
      })
    });
    if (!searchRes.ok) {
      throw new Error(`Plan search endpoint failed: ${searchRes.status}`);
    }
    const searchData = await searchRes.json();
    console.log('✓ Marketplace plans search working');
    console.log('  Plans found:', searchData.plans?.length || 0);
    console.log();

    // Test 3: Subsidy estimates
    console.log('Test 3: POST /api/subsidies');
    const subsidyRes = await fetch(`${BASE_URL}/api/subsidies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zipcode: '33101',
        household: {
          income: 50000,
          people: [
            { age: 35, gender: 'Male', uses_tobacco: false, aptc_eligible: true }
          ]
        },
        year: 2024
      })
    });
    if (!subsidyRes.ok) {
      throw new Error(`Subsidy endpoint failed: ${subsidyRes.status}`);
    }
    const subsidyData = await subsidyRes.json();
    console.log('✓ Subsidy calculation working');
    console.log('  APTC:', subsidyData.aptc || 'N/A');
    console.log('  CSR:', subsidyData.csr || 'N/A');
    console.log();

    console.log('🎉 All API endpoints are working correctly!\n');

  } catch (error) {
    console.error('❌ Endpoint test failed:', error.message);
    process.exit(1);
  }
}

testEndpoints();
