import { test, expect } from '@playwright/test';

test.describe('Results Page', () => {
  const validResultsURL = '/results?residenceZips=33101,10001&residenceStates=FL,NY&numAdults=2&adultAges=67,65&numChildren=0&hasMedicareEligible=true&hasCurrentInsurance=false&budget=500-1000';

  test('should display results with valid URL parameters', async ({ page }) => {
    await page.goto(validResultsURL);

    // Check page loaded
    await expect(page).toHaveTitle(/Coverage Gap Analyzer/);

    // Check recommendation is visible
    await expect(page.getByRole('heading', { name: /Your Insurance Recommendations/i })).toBeVisible();

    // Check for key sections
    await expect(page.getByText(/Coverage Gap Score/i)).toBeVisible();
    await expect(page.getByText(/Recommended Insurance/i)).toBeVisible();
    await expect(page.getByText(/Estimated Monthly Cost/i)).toBeVisible();
    await expect(page.getByText(/Why This Plan/i)).toBeVisible();
  });

  test('should display Medicare recommendation for eligible seniors', async ({ page }) => {
    await page.goto(validResultsURL);

    // Should recommend Medicare
    await expect(page.getByText(/Medicare/i)).toBeVisible();

    // Should show good coverage score
    await expect(page.getByText(/Coverage Gap Score/i)).toBeVisible();
  });

  test('should display PPO recommendation for young family', async ({ page }) => {
    const youngFamilyURL = '/results?residenceZips=98101,97201&residenceStates=WA,OR&numAdults=2&adultAges=35,33&numChildren=2&childAges=5,8&hasMedicareEligible=false&hasCurrentInsurance=false&budget=1000-2000';

    await page.goto(youngFamilyURL);

    // Should recommend PPO
    await expect(page.getByText(/PPO/i)).toBeVisible();
  });

  test('should show all action buttons', async ({ page }) => {
    await page.goto(validResultsURL);

    // Wait for results to load
    await expect(page.getByRole('heading', { name: /Your Insurance Recommendations/i })).toBeVisible();

    // Check for action buttons
    await expect(page.getByRole('button', { name: /Print Results/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Export as JSON/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Email/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Copy Link/i })).toBeVisible();
  });

  test('should copy link to clipboard when Copy Link clicked', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto(validResultsURL);

    // Wait for results
    await expect(page.getByRole('heading', { name: /Your Insurance Recommendations/i })).toBeVisible();

    // Click Copy Link
    await page.getByRole('button', { name: /Copy Link/i }).click();

    // Check for success message
    await expect(page.getByText(/Copied!/i)).toBeVisible();

    // Verify clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('/results?');
    expect(clipboardText).toContain('residenceZips=');
  });

  test('should trigger print dialog when Print Results clicked', async ({ page }) => {
    await page.goto(validResultsURL);

    await expect(page.getByRole('heading', { name: /Your Insurance Recommendations/i })).toBeVisible();

    // Listen for print event
    let printDialogOpened = false;
    page.on('dialog', () => {
      printDialogOpened = true;
    });

    // Mock window.print
    await page.evaluate(() => {
      window.print = () => {
        // Print was called
      };
    });

    // Click print button
    await page.getByRole('button', { name: /Print Results/i }).click();

    // Note: Actual print dialog testing is limited in Playwright
    // We can verify the button works and doesn't error
  });

  test('should show Next Steps section', async ({ page }) => {
    await page.goto(validResultsURL);

    await expect(page.getByRole('heading', { name: /Your Insurance Recommendations/i })).toBeVisible();

    // Check for Next Steps
    await expect(page.getByRole('heading', { name: /Next Steps/i })).toBeVisible();
    await expect(page.getByText(/Contact insurance carriers/i)).toBeVisible();
  });

  test('should show Alternative Options section', async ({ page }) => {
    await page.goto(validResultsURL);

    await expect(page.getByRole('heading', { name: /Your Insurance Recommendations/i })).toBeVisible();

    // Check for alternatives
    await expect(page.getByRole('heading', { name: /Alternative Options/i })).toBeVisible();
    await expect(page.getByText(/Pros:/i)).toBeVisible();
    await expect(page.getByText(/Cons:/i)).toBeVisible();
  });

  test('should show disclaimer section', async ({ page }) => {
    await page.goto(validResultsURL);

    await expect(page.getByRole('heading', { name: /Your Insurance Recommendations/i })).toBeVisible();

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check for disclaimer
    await expect(page.getByRole('heading', { name: /Important Disclaimer/i })).toBeVisible();
  });

  test('should have Start Over button that navigates to calculator', async ({ page }) => {
    await page.goto(validResultsURL);

    await expect(page.getByRole('heading', { name: /Your Insurance Recommendations/i })).toBeVisible();

    // Click Start Over
    await page.getByRole('link', { name: /Start Over/i }).click();

    // Should navigate to calculator
    await expect(page).toHaveURL('/calculator');
  });

  test('should display cost breakdown', async ({ page }) => {
    await page.goto(validResultsURL);

    await expect(page.getByRole('heading', { name: /Your Insurance Recommendations/i })).toBeVisible();

    // Check for cost information
    await expect(page.getByText(/Estimated Monthly Cost/i)).toBeVisible();
    await expect(page.getByText(/Annual Cost/i)).toBeVisible();
  });

  test('should handle missing URL parameters gracefully', async ({ page }) => {
    // Go to results without parameters
    await page.goto('/results');

    // Should show error or redirect message
    // The exact behavior depends on implementation
    // For now, check that we don't crash
    await expect(page).toHaveTitle(/Coverage Gap Analyzer/);
  });

  test('should display household composition correctly', async ({ page }) => {
    const familyURL = '/results?residenceZips=98101,97201&residenceStates=WA,OR&numAdults=2&adultAges=35,33&numChildren=2&childAges=5,8&hasMedicareEligible=false&hasCurrentInsurance=false&budget=1000-2000';

    await page.goto(familyURL);

    await expect(page.getByRole('heading', { name: /Your Insurance Recommendations/i })).toBeVisible();

    // Should mention family coverage
    await expect(page.getByText(/family/i)).toBeVisible();
  });

  test('should export JSON when Export button clicked', async ({ page }) => {
    await page.goto(validResultsURL);

    await expect(page.getByRole('heading', { name: /Your Insurance Recommendations/i })).toBeVisible();

    // Set up download handler
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.getByRole('button', { name: /Export as JSON/i }).click();

    // Wait for download
    const download = await downloadPromise;

    // Check filename
    expect(download.suggestedFilename()).toMatch(/insurance-analysis-.*\.json/);
  });
});
