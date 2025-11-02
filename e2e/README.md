# End-to-End (E2E) Tests

Comprehensive end-to-end tests using Playwright to verify the entire application workflow.

## Overview

E2E tests simulate real user interactions across multiple browsers and devices to ensure the application works correctly from start to finish.

## Test Coverage

### 1. **calculator.spec.ts** - Calculator Flow
- Basic calculator display and validation
- Complete flow for Medicare-eligible couple
- Complete flow for young family
- Adding third residence
- Navigation between steps
- Loading states
- Age validation

**8 tests total**

### 2. **results.spec.ts** - Results Page
- Display with valid URL parameters
- Medicare recommendation
- PPO recommendation for families
- Action buttons (Print, Export, Email, Copy)
- Next steps and alternatives
- Cost breakdown
- Error handling

**13 tests total**

### 3. **navigation.spec.ts** - Navigation & Routing
- Navigate to main pages (About, Contact)
- Homepage CTA navigation
- Header logo navigation
- Footer links
- Browser back/forward
- 404 handling
- Navigation state persistence

**8 tests total**

### 4. **accessibility.spec.ts** - Accessibility
- Heading hierarchy
- Keyboard navigation
- ARIA labels
- Screen reader announcements
- Focus indicators
- Form labels and fieldsets
- Landmark regions

**12 tests total**

### 5. **mobile.spec.ts** - Mobile Experience
- Mobile navigation menu
- Touch-friendly buttons
- Mobile progress indicator
- Form completion on mobile
- Sticky navigation
- Mobile keyboard handling
- Viewport changes
- Tablet viewport

**12 tests total**

**Total: 53 E2E tests**

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install
```

### Basic Commands

```bash
# Run all E2E tests (headless mode)
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests step-by-step
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Run Specific Tests

```bash
# Run single test file
npx playwright test calculator.spec.ts

# Run specific test
npx playwright test -g "should complete full calculator flow"

# Run tests matching pattern
npx playwright test calculator
```

### Run on Specific Browsers

```bash
# Run on Chromium only
npx playwright test --project=chromium

# Run on Firefox only
npx playwright test --project=firefox

# Run on WebKit (Safari) only
npx playwright test --project=webkit

# Run on Mobile Chrome
npx playwright test --project="Mobile Chrome"

# Run on Mobile Safari
npx playwright test --project="Mobile Safari"
```

## Test Configuration

Configuration is in `playwright.config.ts`:

- **Test Directory**: `./e2e`
- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile Devices**: Pixel 5, iPhone 12
- **Retries**: 2 on CI, 0 locally
- **Reporter**: HTML report
- **Screenshots**: On failure only
- **Trace**: On first retry

## Browser Support

Tests run on:
- ✅ Desktop Chrome
- ✅ Desktop Firefox
- ✅ Desktop Safari (WebKit)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

## Development Workflow

### 1. Write New Test

```typescript
// e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Hello')).toBeVisible();
  });
});
```

### 2. Run Test in UI Mode

```bash
npm run test:e2e:ui
```

Use the Playwright UI to:
- Run tests interactively
- Inspect DOM
- View network requests
- Debug failures

### 3. Debug Failing Test

```bash
# Open test in debug mode
npx playwright test my-feature.spec.ts --debug
```

### 4. View Test Report

```bash
npm run test:e2e:report
```

## Common Test Patterns

### Navigation
```typescript
await page.goto('/calculator');
await expect(page).toHaveURL('/calculator');
```

### Form Filling
```typescript
await page.getByLabel(/ZIP Code/i).fill('33101');
await page.getByLabel(/State/i).selectOption('FL');
```

### Button Clicks
```typescript
await page.getByRole('button', { name: /Next/i }).click();
```

### Assertions
```typescript
await expect(page.getByRole('heading', { name: /Results/i })).toBeVisible();
await expect(page.getByText(/Medicare/i)).toBeVisible();
```

### Wait for Navigation
```typescript
await page.getByRole('button', { name: /Submit/i }).click();
await expect(page).toHaveURL('/results');
```

## Troubleshooting

### Tests Fail Locally

**Problem**: Tests timeout waiting for page load

**Solution**:
```bash
# Ensure dev server is running
npm run dev

# Or let Playwright start it automatically (configured in playwright.config.ts)
```

### Tests Pass Locally, Fail on CI

**Problem**: Different behavior in CI environment

**Solutions**:
- Check CI has Node.js 18+
- Verify all dependencies installed
- Check for timing issues (increase timeout)
- Review CI-specific configuration in `playwright.config.ts`

### Flaky Tests

**Problem**: Tests fail intermittently

**Solutions**:
- Add explicit waits: `await expect(element).toBeVisible()`
- Increase timeout for slow operations
- Use `waitForLoadState`: `await page.waitForLoadState('networkidle')`
- Avoid hardcoded delays (`page.waitForTimeout`)

### Browser Not Found

**Problem**: `browserType.launch: Executable doesn't exist`

**Solution**:
```bash
# Install Playwright browsers
npx playwright install
```

## Best Practices

### 1. Use Accessibility Selectors
```typescript
// ✅ Good - Use role and accessible name
await page.getByRole('button', { name: /Next/i })

// ❌ Avoid - Fragile CSS selectors
await page.locator('.btn-next')
```

### 2. Wait for Elements
```typescript
// ✅ Good - Explicit wait
await expect(page.getByText('Success')).toBeVisible()

// ❌ Avoid - Race conditions
await page.waitForTimeout(1000)
```

### 3. Isolate Tests
```typescript
// ✅ Good - Fresh state for each test
test.beforeEach(async ({ page }) => {
  await page.goto('/calculator');
});

// ❌ Avoid - Tests depending on each other
```

### 4. Descriptive Test Names
```typescript
// ✅ Good
test('should display Medicare recommendation for eligible seniors', ...)

// ❌ Avoid
test('test 1', ...)
```

### 5. Group Related Tests
```typescript
test.describe('Calculator Flow', () => {
  test('should validate Step 1', ...);
  test('should navigate to Step 2', ...);
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Selectors Guide](https://playwright.dev/docs/selectors)

---

**Last Updated**: 2025-01-01
**Playwright Version**: 1.56+
