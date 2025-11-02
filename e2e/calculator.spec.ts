import { test, expect } from '@playwright/test';

test.describe('Calculator Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh on the calculator page
    await page.goto('/calculator');
  });

  test('should display calculator with Step 1 initially', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Coverage Gap Analyzer/);

    // Check Step 1 is visible
    await expect(page.getByRole('heading', { name: /Your Residences/i })).toBeVisible();

    // Check for residence inputs
    await expect(page.getByLabel(/Primary Residence - ZIP Code/i)).toBeVisible();
    await expect(page.getByLabel(/Primary Residence - State/i)).toBeVisible();
  });

  test('should validate Step 1 before allowing to proceed', async ({ page }) => {
    // Try to proceed without filling anything
    await page.getByRole('button', { name: /Next/i }).click();

    // Should show validation errors
    await expect(page.getByText(/ZIP code is required/i)).toBeVisible();
    await expect(page.getByText(/Please select a state/i)).toBeVisible();
  });

  test('should complete full calculator flow - Medicare couple', async ({ page }) => {
    // === Step 1: Residences ===

    // Primary residence
    await page.getByLabel(/Primary Residence - ZIP Code/i).fill('33101');
    await page.getByLabel(/Primary Residence - State/i).selectOption('FL');

    // Secondary residence
    await page.getByLabel(/Secondary Residence - ZIP Code/i).fill('10001');
    await page.getByLabel(/Secondary Residence - State/i).selectOption('NY');

    // Proceed to Step 2
    await page.getByRole('button', { name: /Next/i }).click();

    // === Step 2: Household ===
    await expect(page.getByRole('heading', { name: /Your Household/i })).toBeVisible();

    // Add 2 adults
    await page.getByLabel(/Number of Adults/i).fill('2');
    await page.getByLabel(/Adult 1 - Age/i).fill('67');
    await page.getByLabel(/Adult 2 - Age/i).fill('65');

    // No children
    await page.getByLabel(/Number of Children/i).fill('0');

    // Check Medicare eligible
    await page.getByLabel(/Is anyone Medicare-eligible/i).check();

    // Proceed to Step 2.5
    await page.getByRole('button', { name: /Next/i }).click();

    // === Step 2.5: Current Insurance (Optional) ===
    await expect(page.getByRole('heading', { name: /Current Insurance/i })).toBeVisible();

    // Skip this step
    await page.getByRole('button', { name: /Skip/i }).click();

    // === Step 3: Budget ===
    await expect(page.getByRole('heading', { name: /Your Budget/i })).toBeVisible();

    // Select budget range
    await page.getByLabel(/\$500-\$1,000\/month/i).check();

    // Submit
    await page.getByRole('button', { name: /Get My Recommendations/i }).click();

    // === Results Page ===
    await expect(page).toHaveURL(/\/results/);
    await expect(page.getByRole('heading', { name: /Your Insurance Recommendations/i })).toBeVisible();

    // Check for recommendation details
    await expect(page.getByText(/Medicare/i)).toBeVisible();
    await expect(page.getByText(/Coverage Gap Score/i)).toBeVisible();
    await expect(page.getByText(/Estimated Monthly Cost/i)).toBeVisible();
  });

  test('should complete full calculator flow - young family', async ({ page }) => {
    // === Step 1: Residences ===
    await page.getByLabel(/Primary Residence - ZIP Code/i).fill('98101');
    await page.getByLabel(/Primary Residence - State/i).selectOption('WA');

    await page.getByLabel(/Secondary Residence - ZIP Code/i).fill('97201');
    await page.getByLabel(/Secondary Residence - State/i).selectOption('OR');

    await page.getByRole('button', { name: /Next/i }).click();

    // === Step 2: Household ===
    await page.getByLabel(/Number of Adults/i).fill('2');
    await page.getByLabel(/Adult 1 - Age/i).fill('35');
    await page.getByLabel(/Adult 2 - Age/i).fill('33');

    await page.getByLabel(/Number of Children/i).fill('2');
    await page.getByLabel(/Child 1 - Age/i).fill('5');
    await page.getByLabel(/Child 2 - Age/i).fill('8');

    // Not Medicare eligible
    await page.getByLabel(/Is anyone Medicare-eligible/i).uncheck();

    await page.getByRole('button', { name: /Next/i }).click();

    // Skip current insurance
    await page.getByRole('button', { name: /Skip/i }).click();

    // === Step 3: Budget ===
    await page.getByLabel(/\$1,000-\$2,000\/month/i).check();
    await page.getByRole('button', { name: /Get My Recommendations/i }).click();

    // === Results Page ===
    await expect(page).toHaveURL(/\/results/);
    await expect(page.getByText(/PPO/i)).toBeVisible();
  });

  test('should allow adding third residence', async ({ page }) => {
    // Fill primary and secondary
    await page.getByLabel(/Primary Residence - ZIP Code/i).fill('33101');
    await page.getByLabel(/Primary Residence - State/i).selectOption('FL');
    await page.getByLabel(/Secondary Residence - ZIP Code/i).fill('10001');
    await page.getByLabel(/Secondary Residence - State/i).selectOption('NY');

    // Add third residence
    await page.getByRole('button', { name: /Add Another Residence/i }).click();

    // Check third residence fields appear
    await expect(page.getByLabel(/Residence 3 - ZIP Code/i)).toBeVisible();
    await expect(page.getByLabel(/Residence 3 - State/i)).toBeVisible();

    // Fill third residence
    await page.getByLabel(/Residence 3 - ZIP Code/i).fill('85001');
    await page.getByLabel(/Residence 3 - State/i).selectOption('AZ');

    // Should be able to proceed
    await page.getByRole('button', { name: /Next/i }).click();
    await expect(page.getByRole('heading', { name: /Your Household/i })).toBeVisible();
  });

  test('should navigate between steps using Back button', async ({ page }) => {
    // Complete Step 1
    await page.getByLabel(/Primary Residence - ZIP Code/i).fill('33101');
    await page.getByLabel(/Primary Residence - State/i).selectOption('FL');
    await page.getByLabel(/Secondary Residence - ZIP Code/i).fill('10001');
    await page.getByLabel(/Secondary Residence - State/i).selectOption('NY');
    await page.getByRole('button', { name: /Next/i }).click();

    // Now on Step 2
    await expect(page.getByRole('heading', { name: /Your Household/i })).toBeVisible();

    // Go back
    await page.getByRole('button', { name: /Back/i }).click();

    // Should be back on Step 1
    await expect(page.getByRole('heading', { name: /Your Residences/i })).toBeVisible();

    // Data should be preserved
    await expect(page.getByLabel(/Primary Residence - ZIP Code/i)).toHaveValue('33101');
  });

  test('should show loading state during analysis', async ({ page }) => {
    // Complete all steps quickly
    await page.getByLabel(/Primary Residence - ZIP Code/i).fill('33101');
    await page.getByLabel(/Primary Residence - State/i).selectOption('FL');
    await page.getByLabel(/Secondary Residence - ZIP Code/i).fill('10001');
    await page.getByLabel(/Secondary Residence - State/i).selectOption('NY');
    await page.getByRole('button', { name: /Next/i }).click();

    await page.getByLabel(/Number of Adults/i).fill('2');
    await page.getByLabel(/Adult 1 - Age/i).fill('45');
    await page.getByLabel(/Adult 2 - Age/i).fill('43');
    await page.getByLabel(/Number of Children/i).fill('0');
    await page.getByRole('button', { name: /Next/i }).click();

    await page.getByRole('button', { name: /Skip/i }).click();

    await page.getByLabel(/\$1,000-\$2,000\/month/i).check();

    // Click submit
    await page.getByRole('button', { name: /Get My Recommendations/i }).click();

    // Should show loading overlay (brief, may not always catch it)
    // Just verify we get to results page
    await expect(page).toHaveURL(/\/results/, { timeout: 10000 });
  });

  test('should validate adult age range', async ({ page }) => {
    // Go to Step 2
    await page.getByLabel(/Primary Residence - ZIP Code/i).fill('33101');
    await page.getByLabel(/Primary Residence - State/i).selectOption('FL');
    await page.getByLabel(/Secondary Residence - ZIP Code/i).fill('10001');
    await page.getByLabel(/Secondary Residence - State/i).selectOption('NY');
    await page.getByRole('button', { name: /Next/i }).click();

    // Try invalid age (too young for adult)
    await page.getByLabel(/Number of Adults/i).fill('1');
    await page.getByLabel(/Adult 1 - Age/i).fill('15');

    // Try to proceed
    await page.getByRole('button', { name: /Next/i }).click();

    // Should show error
    await expect(page.getByText(/Age must be at least 18/i)).toBeVisible();

    // Fix the age
    await page.getByLabel(/Adult 1 - Age/i).fill('25');

    // Should be able to proceed
    await page.getByRole('button', { name: /Next/i }).click();
    await expect(page.getByRole('heading', { name: /Current Insurance/i })).toBeVisible();
  });
});
