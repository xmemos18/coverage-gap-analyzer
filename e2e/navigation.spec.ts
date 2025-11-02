import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to all main pages from homepage', async ({ page }) => {
    await page.goto('/');

    // Check homepage loaded
    await expect(page).toHaveTitle(/Coverage Gap Analyzer/);
    await expect(page.getByRole('heading', { name: /Find Health Insurance/i })).toBeVisible();

    // Navigate to About
    await page.getByRole('link', { name: /^About$/i }).first().click();
    await expect(page).toHaveURL('/about');
    await expect(page.getByRole('heading', { name: /About/i })).toBeVisible();

    // Go back to home
    await page.goto('/');

    // Navigate to Contact
    await page.getByRole('link', { name: /^Contact$/i }).first().click();
    await expect(page).toHaveURL('/contact');
    await expect(page.getByRole('heading', { name: /Contact/i })).toBeVisible();
  });

  test('should navigate to calculator from homepage CTA', async ({ page }) => {
    await page.goto('/');

    // Click primary CTA button
    await page.getByRole('link', { name: /Get Started/i }).first().click();

    // Should navigate to calculator
    await expect(page).toHaveURL('/calculator');
    await expect(page.getByRole('heading', { name: /Your Residences/i })).toBeVisible();
  });

  test('should navigate using header logo', async ({ page }) => {
    await page.goto('/calculator');

    // Click logo to go home
    await page.getByRole('link', { name: /Coverage Gap Analyzer/i }).first().click();

    // Should navigate to homepage
    await expect(page).toHaveURL('/');
  });

  test('should maintain navigation state across pages', async ({ page }) => {
    await page.goto('/');

    // Header should be visible on all pages
    await expect(page.getByRole('navigation')).toBeVisible();

    // Go to different pages
    await page.goto('/about');
    await expect(page.getByRole('navigation')).toBeVisible();

    await page.goto('/calculator');
    await expect(page.getByRole('navigation')).toBeVisible();

    await page.goto('/contact');
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should have footer on all pages', async ({ page }) => {
    const pages = ['/', '/about', '/calculator', '/contact'];

    for (const pagePath of pages) {
      await page.goto(pagePath);

      // Footer should be visible
      await expect(page.getByRole('contentinfo')).toBeVisible();

      // Footer should have links
      await expect(page.getByRole('contentinfo').getByRole('link', { name: /About/i })).toBeVisible();
    }
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    // Start on homepage
    await page.goto('/');
    await expect(page).toHaveURL('/');

    // Navigate to about
    await page.goto('/about');
    await expect(page).toHaveURL('/about');

    // Navigate to contact
    await page.goto('/contact');
    await expect(page).toHaveURL('/contact');

    // Go back
    await page.goBack();
    await expect(page).toHaveURL('/about');

    // Go back again
    await page.goBack();
    await expect(page).toHaveURL('/');

    // Go forward
    await page.goForward();
    await expect(page).toHaveURL('/about');
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    // Navigate to non-existent page
    const response = await page.goto('/non-existent-page');

    // Should get 404 status
    expect(response?.status()).toBe(404);

    // Should show 404 page (Next.js default or custom)
    await expect(page.getByText(/404|not found/i)).toBeVisible();
  });

  test('should navigate footer links', async ({ page }) => {
    await page.goto('/');

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Click footer About link
    await page.getByRole('contentinfo').getByRole('link', { name: /About/i }).click();
    await expect(page).toHaveURL('/about');

    // Go back
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Click footer Contact link
    await page.getByRole('contentinfo').getByRole('link', { name: /Contact/i }).click();
    await expect(page).toHaveURL('/contact');
  });
});
