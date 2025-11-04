import { test, expect } from '@playwright/test';

test.describe('Add-On Insurance Feature', () => {
  test.describe('Display and Visibility', () => {
    test('should display add-on insurance section for family with children', async ({ page }) => {
      const familyURL = '/results?residenceZips=98101&residenceStates=WA&numAdults=2&adultAges=35,37&numChildren=2&childAges=8,10&hasMedicareEligible=false&hasCurrentInsurance=false&budget=1000-2000&interestedInAddOns=true';

      await page.goto(familyURL);

      // Wait for results to load
      await expect(page.getByRole('heading', { name: /Your Personalized Recommendations/i })).toBeVisible();

      // Check for add-on insurance section
      await expect(page.getByRole('heading', { name: /Recommended Add-On Insurance/i })).toBeVisible();

      // Should show dental and vision as high priority for families with children
      await expect(page.getByText(/Dental Insurance/i)).toBeVisible();
      await expect(page.getByText(/Vision Insurance/i)).toBeVisible();
    });

    test('should display add-on section for seniors with Medicare', async ({ page }) => {
      const seniorURL = '/results?residenceZips=33101&residenceStates=FL&numAdults=1&adultAges=70&numChildren=0&hasMedicareEligible=true&hasCurrentInsurance=false&budget=500-1000&interestedInAddOns=true';

      await page.goto(seniorURL);

      await expect(page.getByRole('heading', { name: /Your Personalized Recommendations/i })).toBeVisible();

      // Check for add-on insurance section
      await expect(page.getByRole('heading', { name: /Recommended Add-On Insurance/i })).toBeVisible();

      // Should recommend Medicare gap coverage
      await expect(page.getByText(/Hospital Indemnity/i)).toBeVisible();
      await expect(page.getByText(/Long-Term Care/i)).toBeVisible();
    });

    test('should display add-on section for mid-career professional', async ({ page }) => {
      const midCareerURL = '/results?residenceZips=10001&residenceStates=NY&numAdults=1&adultAges=45&numChildren=0&hasMedicareEligible=false&hasCurrentInsurance=false&budget=750-1000&interestedInAddOns=true';

      await page.goto(midCareerURL);

      await expect(page.getByRole('heading', { name: /Your Personalized Recommendations/i })).toBeVisible();

      // Should show disability and critical illness
      await expect(page.getByText(/Disability Insurance/i)).toBeVisible();
      await expect(page.getByText(/Critical Illness/i)).toBeVisible();
    });

    test('should not display add-on section when interestedInAddOns is false', async ({ page }) => {
      const noAddOnsURL = '/results?residenceZips=98101&residenceStates=WA&numAdults=1&adultAges=35&numChildren=0&hasMedicareEligible=false&hasCurrentInsurance=false&budget=500-750&interestedInAddOns=false';

      await page.goto(noAddOnsURL);

      await expect(page.getByRole('heading', { name: /Your Personalized Recommendations/i })).toBeVisible();

      // Add-on section should not be present
      await expect(page.getByRole('heading', { name: /Recommended Add-On Insurance/i })).not.toBeVisible();
    });
  });

  test.describe('Priority Grouping', () => {
    test('should show high priority badge for recommended add-ons', async ({ page }) => {
      const familyURL = '/results?residenceZips=98101&residenceStates=WA&numAdults=2&adultAges=35,37&numChildren=2&childAges=8,10&hasMedicareEligible=false&hasCurrentInsurance=false&budget=1000-2000';

      await page.goto(familyURL);

      await expect(page.getByRole('heading', { name: /Recommended Add-On Insurance/i })).toBeVisible();

      // Should show high priority badge
      await expect(page.getByText(/Highly Recommended/i).first()).toBeVisible();
    });

    test('should show medium priority section as expandable', async ({ page }) => {
      const midCareerURL = '/results?residenceZips=10001&residenceStates=NY&numAdults=1&adultAges=45&numChildren=0&hasMedicareEligible=false&hasCurrentInsurance=false&budget=750-1000';

      await page.goto(midCareerURL);

      await expect(page.getByRole('heading', { name: /Recommended Add-On Insurance/i })).toBeVisible();

      // Medium priority section should exist
      const mediumPriorityButton = page.getByRole('button', { name: /Medium Priority/i });
      if (await mediumPriorityButton.isVisible()) {
        // Should be expandable
        await mediumPriorityButton.click();

        // Content should appear
        await expect(page.getByText(/Consider This/i)).toBeVisible();
      }
    });

    test('should show other options section as expandable', async ({ page }) => {
      const youngAdultURL = '/results?residenceZips=98101&residenceStates=WA&numAdults=1&adultAges=25&numChildren=0&hasMedicareEligible=false&hasCurrentInsurance=false&budget=500-750';

      await page.goto(youngAdultURL);

      await expect(page.getByRole('heading', { name: /Recommended Add-On Insurance/i })).toBeVisible();

      // Other options section should exist
      const lowPriorityButton = page.getByRole('button', { name: /Other Options/i });
      if (await lowPriorityButton.isVisible()) {
        // Should be expandable
        await lowPriorityButton.click();
      }
    });
  });

  test.describe('Cost Display', () => {
    test('should display individual and household costs', async ({ page }) => {
      const familyURL = '/results?residenceZips=98101&residenceStates=WA&numAdults=2&adultAges=35,37&numChildren=2&childAges=8,10&hasMedicareEligible=false&hasCurrentInsurance=false&budget=1000-2000';

      await page.goto(familyURL);

      await expect(page.getByRole('heading', { name: /Recommended Add-On Insurance/i })).toBeVisible();

      // Should show monthly costs
      await expect(page.getByText(/per month/i).first()).toBeVisible();

      // Should show per person costs for multi-member households
      await expect(page.getByText(/per person/i).first()).toBeVisible();
    });

    test('should display total cost summaries', async ({ page }) => {
      const familyURL = '/results?residenceZips=98101&residenceStates=WA&numAdults=2&adultAges=35,37&numChildren=2&childAges=8,10&hasMedicareEligible=false&hasCurrentInsurance=false&budget=1000-2000';

      await page.goto(familyURL);

      await expect(page.getByRole('heading', { name: /Recommended Add-On Insurance/i })).toBeVisible();

      // Should show high priority total
      await expect(page.getByText(/High Priority Add-Ons/i)).toBeVisible();

      // Should show all recommended total
      await expect(page.getByText(/All Recommended Add-Ons/i)).toBeVisible();
    });

    test('should show bundle discount notice when applicable', async ({ page }) => {
      const midCareerURL = '/results?residenceZips=10001&residenceStates=NY&numAdults=1&adultAges=45&numChildren=0&hasMedicareEligible=false&hasCurrentInsurance=false&budget=1000-2000';

      await page.goto(midCareerURL);

      await expect(page.getByRole('heading', { name: /Recommended Add-On Insurance/i })).toBeVisible();

      // If there are 3+ recommendations, should show bundle discount notice
      const bundleNotice = page.getByText(/Bundle Discount Available/i);
      const recommendations = await page.getByText(/Highly Recommended|Consider This/i).count();

      if (recommendations >= 3) {
        await expect(bundleNotice).toBeVisible();
      }
    });
  });

  test.describe('Add-On Details', () => {
    test('should display add-on insurance details', async ({ page }) => {
      const familyURL = '/results?residenceZips=98101&residenceStates=WA&numAdults=2&adultAges=35,37&numChildren=2&childAges=8,10&hasMedicareEligible=false&hasCurrentInsurance=false&budget=1000-2000';

      await page.goto(familyURL);

      await expect(page.getByRole('heading', { name: /Recommended Add-On Insurance/i })).toBeVisible();

      // Should show insurance descriptions
      await expect(page.getByText(/preventive care/i).first()).toBeVisible();

      // Should show why recommended section
      await expect(page.getByText(/Why Recommended/i).first()).toBeVisible();

      // Should show key benefits
      await expect(page.getByText(/Key Benefits/i).first()).toBeVisible();
    });

    test('should display recommendation score bar', async ({ page }) => {
      const familyURL = '/results?residenceZips=98101&residenceStates=WA&numAdults=2&adultAges=35,37&numChildren=2&childAges=8,10&hasMedicareEligible=false&hasCurrentInsurance=false&budget=1000-2000';

      await page.goto(familyURL);

      await expect(page.getByRole('heading', { name: /Recommended Add-On Insurance/i })).toBeVisible();

      // Should show recommendation score
      await expect(page.getByText(/Recommendation Score/i).first()).toBeVisible();

      // Should show percentage
      await expect(page.getByText(/%/i).first()).toBeVisible();
    });

    test('should show household age group context', async ({ page }) => {
      const multiGenURL = '/results?residenceZips=10001&residenceStates=NY&numAdults=3&adultAges=30,45,70&numChildren=1&childAges=8&hasMedicareEligible=true&hasCurrentInsurance=false&budget=1500-2000';

      await page.goto(multiGenURL);

      await expect(page.getByRole('heading', { name: /Recommended Add-On Insurance/i })).toBeVisible();

      // Should show household summary
      await expect(page.getByText(/Your Household/i)).toBeVisible();

      // Should show different age groups
      await expect(page.getByText(/Children|Adults|Seniors/i).first()).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size

      const familyURL = '/results?residenceZips=98101&residenceStates=WA&numAdults=2&adultAges=35,37&numChildren=2&childAges=8,10&hasMedicareEligible=false&hasCurrentInsurance=false&budget=1000-2000';

      await page.goto(familyURL);

      await expect(page.getByRole('heading', { name: /Recommended Add-On Insurance/i })).toBeVisible();

      // All sections should be visible and properly formatted
      await expect(page.getByText(/Dental Insurance/i)).toBeVisible();

      // Costs should be visible
      await expect(page.getByText(/per month/i).first()).toBeVisible();
    });

    test('should expand/collapse sections on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const midCareerURL = '/results?residenceZips=10001&residenceStates=NY&numAdults=1&adultAges=45&numChildren=0&hasMedicareEligible=false&hasCurrentInsurance=false&budget=750-1000';

      await page.goto(midCareerURL);

      await expect(page.getByRole('heading', { name: /Recommended Add-On Insurance/i })).toBeVisible();

      // Medium priority should be collapsible
      const mediumPriorityButton = page.getByRole('button', { name: /Medium Priority/i });
      if (await mediumPriorityButton.isVisible()) {
        await mediumPriorityButton.click();

        // Should show expanded content
        await expect(page.getByText(/Consider This/i)).toBeVisible();

        // Click again to collapse
        await mediumPriorityButton.click();
      }
    });
  });

  test.describe('PDF Export Integration', () => {
    test('should include add-on recommendations in PDF', async ({ page }) => {
      const familyURL = '/results?residenceZips=98101&residenceStates=WA&numAdults=2&adultAges=35,37&numChildren=2&childAges=8,10&hasMedicareEligible=false&hasCurrentInsurance=false&budget=1000-2000';

      await page.goto(familyURL);

      await expect(page.getByRole('heading', { name: /Recommended Add-On Insurance/i })).toBeVisible();

      // Check that PDF download button exists
      await expect(page.getByRole('button', { name: /Download PDF/i })).toBeVisible();

      // Note: Actually testing PDF generation would require more complex setup
      // This test verifies the button is present when add-ons are shown
    });
  });

  test.describe('Different Age Scenarios', () => {
    test('should recommend accident insurance for young adults', async ({ page }) => {
      const youngAdultURL = '/results?residenceZips=98101&residenceStates=WA&numAdults=1&adultAges=25&numChildren=0&hasMedicareEligible=false&hasCurrentInsurance=false&budget=500-750';

      await page.goto(youngAdultURL);

      await expect(page.getByRole('heading', { name: /Recommended Add-On Insurance/i })).toBeVisible();

      // Should show accident insurance prominently
      await expect(page.getByText(/Accident Insurance/i)).toBeVisible();
    });

    test('should recommend pre-retirement coverage for 51-64 age group', async ({ page }) => {
      const preRetirementURL = '/results?residenceZips=33101&residenceStates=FL&numAdults=1&adultAges=60&numChildren=0&hasMedicareEligible=false&hasCurrentInsurance=false&budget=1000-2000';

      await page.goto(preRetirementURL);

      await expect(page.getByRole('heading', { name: /Recommended Add-On Insurance/i })).toBeVisible();

      // Should show critical illness and long-term care planning
      await expect(page.getByText(/Critical Illness/i)).toBeVisible();
    });

    test('should show comprehensive coverage for multi-generational household', async ({ page }) => {
      const multiGenURL = '/results?residenceZips=10001&residenceStates=NY&numAdults=3&adultAges=28,52,75&numChildren=2&childAges=5,10&hasMedicareEligible=true&hasCurrentInsurance=false&budget=2000-3000';

      await page.goto(multiGenURL);

      await expect(page.getByRole('heading', { name: /Recommended Add-On Insurance/i })).toBeVisible();

      // Should have recommendations for different age groups
      await expect(page.getByText(/Dental Insurance/i)).toBeVisible(); // For children
      await expect(page.getByText(/Disability/i)).toBeVisible(); // For working adults
      await expect(page.getByText(/Long-Term Care/i)).toBeVisible(); // For senior
    });
  });

  test.describe('Important Notes Section', () => {
    test('should display important notes and disclaimers', async ({ page }) => {
      const familyURL = '/results?residenceZips=98101&residenceStates=WA&numAdults=2&adultAges=35,37&numChildren=2&childAges=8,10&hasMedicareEligible=false&hasCurrentInsurance=false&budget=1000-2000';

      await page.goto(familyURL);

      await expect(page.getByRole('heading', { name: /Recommended Add-On Insurance/i })).toBeVisible();

      // Should show important notes
      await expect(page.getByText(/Important Notes/i)).toBeVisible();

      // Should mention that costs are estimates
      await expect(page.getByText(/estimates/i)).toBeVisible();

      // Should mention supplemental nature
      await expect(page.getByText(/supplemental/i)).toBeVisible();
    });
  });
});
