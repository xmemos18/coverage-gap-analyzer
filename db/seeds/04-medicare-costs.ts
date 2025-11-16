/**
 * Medicare and Medigap Plan Seed Data
 * Based on comprehensive US health insurance plan database framework
 * Data sources: Medicare.gov, CMS official rates
 */

import { getDb } from '../client';
import { medicareCosts, medigapPlans, partDPlans } from '../schema/insurance-costs';

export async function seedMedicareAndMedigapCosts() {
  console.log('🏥 Seeding Medicare and Medigap costs...');

  const db = getDb();

  // Clear existing data
  await db.delete(medicareCosts);
  await db.delete(medigapPlans);
  await db.delete(partDPlans);

  const planYear = 2025;

  // Medicare Parts A & B Standard Costs (2025 official rates)
  const medicareCostsData = [
    // No IRMAA
    {
      partAPremium: '0.00', // Free if 40+ quarters worked
      partADeductible: '1632.00', // 2025 Part A deductible
      partBPremium: '185.00', // 2025 standard Part B premium (increased from $174.70)
      partBDeductible: '257.00', // 2025 Part B deductible (increased from $240)
      irmaaTier: 0,
      irmaaThreshold: '106000.00', // Individual, $212,000 joint
      irmaaAmount: '0.00',
      planYear,
      effectiveDate: new Date('2025-01-01'),
    },
    // IRMAA Tier 1
    {
      partAPremium: '0.00',
      partADeductible: '1632.00',
      partBPremium: '259.00', // Standard + IRMAA
      partBDeductible: '257.00',
      irmaaTier: 1,
      irmaaThreshold: '106000.00',
      irmaaAmount: '74.00',
      planYear,
      effectiveDate: new Date('2025-01-01'),
    },
    // IRMAA Tier 2
    {
      partAPremium: '0.00',
      partADeductible: '1632.00',
      partBPremium: '370.00',
      partBDeductible: '257.00',
      irmaaTier: 2,
      irmaaThreshold: '133000.00',
      irmaaAmount: '185.00',
      planYear,
      effectiveDate: new Date('2025-01-01'),
    },
    // IRMAA Tier 3
    {
      partAPremium: '0.00',
      partADeductible: '1632.00',
      partBPremium: '481.00',
      partBDeductible: '257.00',
      irmaaTier: 3,
      irmaaThreshold: '167000.00',
      irmaaAmount: '296.00',
      planYear,
      effectiveDate: new Date('2025-01-01'),
    },
    // IRMAA Tier 4
    {
      partAPremium: '0.00',
      partADeductible: '1632.00',
      partBPremium: '592.00',
      partBDeductible: '257.00',
      irmaaTier: 4,
      irmaaThreshold: '200000.00',
      irmaaAmount: '407.00',
      planYear,
      effectiveDate: new Date('2025-01-01'),
    },
    // IRMAA Tier 5 (highest)
    {
      partAPremium: '0.00',
      partADeductible: '1632.00',
      partBPremium: '629.00',
      partBDeductible: '257.00',
      irmaaTier: 5,
      irmaaThreshold: '500000.00',
      irmaaAmount: '444.00',
      planYear,
      effectiveDate: new Date('2025-01-01'),
    },
  ];

  await db.insert(medicareCosts).values(medicareCostsData);
  console.log(`  ✓ Inserted ${medicareCostsData.length} Medicare cost records`);

  // Medigap Plans (Sample premiums by state and plan)
  const medigapPlansData = [
    // California - Attained-age pricing
    {
      state: 'CA',
      zipCode: '90001',
      planLetter: 'G', // Most popular plan
      carrier: 'AARP/UnitedHealthcare',
      ratingMethod: 'attained-age',
      age: 65,
      gender: null,
      tobacco: false,
      monthlyPremium: '165.00',
      householdDiscount: '7.00',
      planYear,
      isActive: true,
    },
    {
      state: 'CA',
      zipCode: '90001',
      planLetter: 'G',
      carrier: 'AARP/UnitedHealthcare',
      ratingMethod: 'attained-age',
      age: 75,
      gender: null,
      tobacco: false,
      monthlyPremium: '205.00',
      householdDiscount: '7.00',
      planYear,
      isActive: true,
    },
    {
      state: 'CA',
      zipCode: '90001',
      planLetter: 'N', // Lower-cost alternative
      carrier: 'Blue Shield of California',
      ratingMethod: 'attained-age',
      age: 65,
      gender: null,
      tobacco: false,
      monthlyPremium: '125.00',
      householdDiscount: '5.00',
      planYear,
      isActive: true,
    },

    // Florida - Attained-age pricing
    {
      state: 'FL',
      zipCode: '33101',
      planLetter: 'G',
      carrier: 'AARP/UnitedHealthcare',
      ratingMethod: 'attained-age',
      age: 65,
      gender: null,
      tobacco: false,
      monthlyPremium: '145.00',
      householdDiscount: '7.00',
      planYear,
      isActive: true,
    },
    {
      state: 'FL',
      zipCode: '33101',
      planLetter: 'G',
      carrier: 'AARP/UnitedHealthcare',
      ratingMethod: 'attained-age',
      age: 75,
      gender: null,
      tobacco: false,
      monthlyPremium: '180.00',
      householdDiscount: '7.00',
      planYear,
      isActive: true,
    },
    {
      state: 'FL',
      zipCode: '33101',
      planLetter: 'N',
      carrier: 'Florida Blue',
      ratingMethod: 'attained-age',
      age: 65,
      gender: null,
      tobacco: false,
      monthlyPremium: '110.00',
      householdDiscount: '5.00',
      planYear,
      isActive: true,
    },

    // Texas
    {
      state: 'TX',
      zipCode: '77001',
      planLetter: 'G',
      carrier: 'AARP/UnitedHealthcare',
      ratingMethod: 'attained-age',
      age: 65,
      gender: null,
      tobacco: false,
      monthlyPremium: '138.00',
      householdDiscount: '7.00',
      planYear,
      isActive: true,
    },
    {
      state: 'TX',
      zipCode: '77001',
      planLetter: 'N',
      carrier: 'Blue Cross Blue Shield of Texas',
      ratingMethod: 'attained-age',
      age: 65,
      gender: null,
      tobacco: false,
      monthlyPremium: '105.00',
      householdDiscount: '5.00',
      planYear,
      isActive: true,
    },

    // New York - Community-rated (same price for all ages)
    {
      state: 'NY',
      zipCode: '10001',
      planLetter: 'G',
      carrier: 'AARP/UnitedHealthcare',
      ratingMethod: 'community',
      age: null,
      gender: null,
      tobacco: false,
      monthlyPremium: '245.00', // Higher but age-stable
      householdDiscount: '7.00',
      planYear,
      isActive: true,
    },
    {
      state: 'NY',
      zipCode: '10001',
      planLetter: 'N',
      carrier: 'EmblemHealth',
      ratingMethod: 'community',
      age: null,
      gender: null,
      tobacco: false,
      monthlyPremium: '185.00',
      householdDiscount: '5.00',
      planYear,
      isActive: true,
    },

    // Arizona
    {
      state: 'AZ',
      zipCode: '85001',
      planLetter: 'G',
      carrier: 'AARP/UnitedHealthcare',
      ratingMethod: 'attained-age',
      age: 65,
      gender: null,
      tobacco: false,
      monthlyPremium: '142.00',
      householdDiscount: '7.00',
      planYear,
      isActive: true,
    },
    {
      state: 'AZ',
      zipCode: '85001',
      planLetter: 'N',
      carrier: 'Blue Cross Blue Shield of Arizona',
      ratingMethod: 'attained-age',
      age: 65,
      gender: null,
      tobacco: false,
      monthlyPremium: '108.00',
      householdDiscount: '5.00',
      planYear,
      isActive: true,
    },
  ];

  await db.insert(medigapPlans).values(medigapPlansData);
  console.log(`  ✓ Inserted ${medigapPlansData.length} Medigap plan records`);

  // Part D Plans (Prescription Drug Coverage)
  const partDPlansData = [
    // California
    {
      state: 'CA',
      region: 'California',
      planName: 'AARP MedicareRx Preferred (PDP)',
      carrier: 'UnitedHealthcare',
      monthlyPremium: '42.00',
      annualDeductible: '590.00', // 2025 max deductible (up from $545)
      coverageGapDiscount: '75.00',
      formularyTiers: 5,
      preferredPharmacy: true,
      mailOrderAvailable: true,
      starRating: '4.5',
      contractId: 'S5820',
      planId: '001',
      planYear,
      isActive: true,
    },
    {
      state: 'CA',
      region: 'California',
      planName: 'SilverScript Choice (PDP)',
      carrier: 'CVS Health',
      monthlyPremium: '35.00',
      annualDeductible: '545.00',
      coverageGapDiscount: '75.00',
      formularyTiers: 5,
      preferredPharmacy: true,
      mailOrderAvailable: true,
      starRating: '4.0',
      contractId: 'S5660',
      planId: '002',
      planYear,
      isActive: true,
    },

    // Florida
    {
      state: 'FL',
      region: 'Florida',
      planName: 'Humana Walmart Value Rx Plan (PDP)',
      carrier: 'Humana',
      monthlyPremium: '28.00',
      annualDeductible: '0.00',
      coverageGapDiscount: '75.00',
      formularyTiers: 4,
      preferredPharmacy: true,
      mailOrderAvailable: true,
      starRating: '4.0',
      contractId: 'S5884',
      planId: '003',
      planYear,
      isActive: true,
    },
    {
      state: 'FL',
      region: 'Florida',
      planName: 'WellCare Classic (PDP)',
      carrier: 'WellCare',
      monthlyPremium: '32.00',
      annualDeductible: '250.00',
      coverageGapDiscount: '75.00',
      formularyTiers: 5,
      preferredPharmacy: true,
      mailOrderAvailable: true,
      starRating: '3.5',
      contractId: 'S5768',
      planId: '004',
      planYear,
      isActive: true,
    },

    // Texas
    {
      state: 'TX',
      region: 'Texas',
      planName: 'AARP MedicareRx Saver Plus (PDP)',
      carrier: 'UnitedHealthcare',
      monthlyPremium: '38.00',
      annualDeductible: '0.00',
      coverageGapDiscount: '75.00',
      formularyTiers: 4,
      preferredPharmacy: true,
      mailOrderAvailable: true,
      starRating: '4.5',
      contractId: 'S5820',
      planId: '005',
      planYear,
      isActive: true,
    },

    // New York
    {
      state: 'NY',
      region: 'New York',
      planName: 'EmblemHealth Rx Plus (PDP)',
      carrier: 'EmblemHealth',
      monthlyPremium: '45.00',
      annualDeductible: '350.00',
      coverageGapDiscount: '75.00',
      formularyTiers: 5,
      preferredPharmacy: true,
      mailOrderAvailable: true,
      starRating: '4.0',
      contractId: 'S5925',
      planId: '006',
      planYear,
      isActive: true,
    },

    // Arizona
    {
      state: 'AZ',
      region: 'Arizona',
      planName: 'Cigna Extra Rx (PDP)',
      carrier: 'Cigna',
      monthlyPremium: '36.00',
      annualDeductible: '200.00',
      coverageGapDiscount: '75.00',
      formularyTiers: 4,
      preferredPharmacy: true,
      mailOrderAvailable: true,
      starRating: '4.0',
      contractId: 'S5617',
      planId: '007',
      planYear,
      isActive: true,
    },
  ];

  await db.insert(partDPlans).values(partDPlansData);
  console.log(`  ✓ Inserted ${partDPlansData.length} Part D plan records`);

  console.log(`✅ Seeded Medicare and Medigap costs`);
}
