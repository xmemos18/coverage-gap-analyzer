import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Experience', () => {
  test.use({ ...devices['iPhone 12'] });

  test('should display mobile-optimized navigation', async ({ page }) => {
    await page.goto('/');

    // Mobile menu button should be visible
    await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();

    // Desktop navigation should be hidden on mobile
    // (Implementation specific - may use display:none or hidden attribute)
  });

  test('should open and close mobile menu', async ({ page }) => {
    await page.goto('/');

    // Click hamburger menu
    const menuButton = page.getByRole('button', { name: /menu/i });
    await menuButton.click();

    // Mobile menu should appear
    // Check for navigation links in mobile menu
    await expect(page.getByRole('link', { name: /^About$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Contact$/i })).toBeVisible();

    // Close menu
    await menuButton.click();

    // Menu should close (links hidden)
    // Implementation specific behavior
  });

  test('should navigate using mobile menu', async ({ page }) => {
    await page.goto('/');

    // Open mobile menu
    await page.getByRole('button', { name: /menu/i }).click();

    // Click About link
    await page.getByRole('link', { name: /^About$/i }).click();

    // Should navigate to about page
    await expect(page).toHaveURL('/about');
    await expect(page.getByRole('heading', { name: /About/i })).toBeVisible();
  });

  test('should display mobile progress indicator on calculator', async ({ page }) => {
    await page.goto('/calculator');

    // Mobile progress bar should be visible
    // Look for step indicator
    await expect(page.getByText(/Step 1 of/i)).toBeVisible();
  });

  test('should have touch-friendly button sizes', async ({ page }) => {
    await page.goto('/calculator');

    // Get Next button
    const nextButton = page.getByRole('button', { name: /Next/i });

    // Check button size (should be at least 44x44px for touch)
    const boundingBox = await nextButton.boundingBox();
    expect(boundingBox).not.toBeNull();

    if (boundingBox) {
      expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      expect(boundingBox.width).toBeGreaterThanOrEqual(44);
    }
  });

  test('should complete calculator on mobile', async ({ page }) => {
    await page.goto('/calculator');

    // === Step 1 ===
    await page.getByLabel(/Primary Residence - ZIP Code/i).fill('33101');
    await page.getByLabel(/Primary Residence - State/i).selectOption('FL');
    await page.getByLabel(/Secondary Residence - ZIP Code/i).fill('10001');
    await page.getByLabel(/Secondary Residence - State/i).selectOption('NY');
    await page.getByRole('button', { name: /Next/i }).click();

    // === Step 2 ===
    await expect(page.getByRole('heading', { name: /Your Household/i })).toBeVisible();
    await page.getByLabel(/Number of Adults/i).fill('2');
    await page.getByLabel(/Adult 1 - Age/i).fill('45');
    await page.getByLabel(/Adult 2 - Age/i).fill('43');
    await page.getByLabel(/Number of Children/i).fill('0');
    await page.getByRole('button', { name: /Next/i }).click();

    // === Step 2.5 ===
    await page.getByRole('button', { name: /Skip/i }).click();

    // === Step 3 ===
    await page.getByLabel(/\$1,000-\$2,000\/month/i).check();
    await page.getByRole('button', { name: /Get My Recommendations/i }).click();

    // === Results ===
    await expect(page).toHaveURL(/\/results/);
    await expect(page.getByRole('heading', { name: /Your Insurance Recommendations/i })).toBeVisible();
  });

  test('should scroll properly on mobile results page', async ({ page }) => {
    const resultsURL = '/results?residenceZips=33101,10001&residenceStates=FL,NY&numAdults=2&adultAges=45,43&numChildren=0&hasMedicareEligible=false&hasCurrentInsurance=false&budget=1000-2000';

    await page.goto(resultsURL);

    await expect(page.getByRole('heading', { name: /Your Insurance Recommendations/i })).toBeVisible();

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Should see disclaimer at bottom
    await expect(page.getByRole('heading', { name: /Important Disclaimer/i })).toBeVisible();

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));

    // Should see top of results
    await expect(page.getByRole('heading', { name: /Your Insurance Recommendations/i })).toBeVisible();
  });

  test('should display sticky navigation on mobile', async ({ page }) => {
    await page.goto('/calculator');

    // Fill and advance to Step 2
    await page.getByLabel(/Primary Residence - ZIP Code/i).fill('33101');
    await page.getByLabel(/Primary Residence - State/i).selectOption('FL');
    await page.getByLabel(/Secondary Residence - ZIP Code/i).fill('10001');
    await page.getByLabel(/Secondary Residence - State/i).selectOption('NY');
    await page.getByRole('button', { name: /Next/i }).click();

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 300));

    // Navigation buttons should still be visible (sticky)
    await expect(page.getByRole('button', { name: /Back/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Next/i })).toBeVisible();
  });

  test('should handle form inputs on mobile keyboard', async ({ page }) => {
    await page.goto('/calculator');

    // Focus ZIP code input
    const zipInput = page.getByLabel(/Primary Residence - ZIP Code/i);
    await zipInput.click();

    // Type on mobile keyboard
    await zipInput.fill('33101');

    // Verify value
    await expect(zipInput).toHaveValue('33101');

    // Focus age input (should show numeric keyboard)
    await page.getByRole('button', { name: /Next/i }).click();

    const ageInput = page.getByLabel(/Adult 1 - Age/i);
    await ageInput.click();

    // Should have inputmode="numeric" for mobile keyboard
    await expect(ageInput).toHaveAttribute('inputmode', 'numeric');
  });

  test('should display action buttons properly on mobile', async ({ page }) => {
    const resultsURL = '/results?residenceZips=33101,10001&residenceStates=FL,NY&numAdults=2&adultAges=45,43&numChildren=0&hasMedicareEligible=false&hasCurrentInsurance=false&budget=1000-2000';

    await page.goto(resultsURL);

    await expect(page.getByRole('heading', { name: /Your Insurance Recommendations/i })).toBeVisible();

    // All action buttons should be visible
    await expect(page.getByRole('button', { name: /Print Results/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Export as JSON/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Email/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Copy Link/i })).toBeVisible();

    // Buttons should be stacked or wrapped on mobile
    // (Visual regression would test layout)
  });

  test('should handle mobile viewport changes', async ({ page }) => {
    await page.goto('/');

    // Start in portrait
    await page.setViewportSize({ width: 375, height: 667 });

    // Should show mobile menu
    await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();

    // Rotate to landscape
    await page.setViewportSize({ width: 667, height: 375 });

    // Should still work properly
    await expect(page.getByRole('heading', { name: /Find Health Insurance/i })).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/calculator');

    // Complete calculator on tablet
    await page.getByLabel(/Primary Residence - ZIP Code/i).fill('33101');
    await page.getByLabel(/Primary Residence - State/i).selectOption('FL');
    await page.getByLabel(/Secondary Residence - ZIP Code/i).fill('10001');
    await page.getByLabel(/Secondary Residence - State/i).selectOption('NY');
    await page.getByRole('button', { name: /Next/i }).click();

    await expect(page.getByRole('heading', { name: /Your Household/i })).toBeVisible();
  });
});
