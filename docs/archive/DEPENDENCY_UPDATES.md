# Dependency Update Guide

## Current Status

The project uses up-to-date dependencies with some expected deprecation warnings from indirect dependencies.

## Deprecation Warnings Explained

### ESLint v8 → v9 Migration

**Current**: ESLint v8
**Target**: ESLint v9
**Status**: Waiting for ecosystem compatibility

**Why we're on v8**:
- Next.js 15.0 uses `eslint-config-next` which depends on ESLint v8
- ESLint v9 requires significant configuration changes (flat config format)
- Many ESLint plugins haven't migrated to v9 yet

**When to upgrade**:
- Wait for Next.js to officially support ESLint v9
- Check compatibility at: https://nextjs.org/docs/app/building-your-application/configuring/eslint

**How to upgrade** (when ready):
```bash
# 1. Update ESLint
npm install --save-dev eslint@^9

# 2. Migrate config from .eslintrc.json to eslint.config.js
# See: https://eslint.org/docs/latest/use/migrate-to-9.0.0

# 3. Update eslint-config-next
npm install --save-dev eslint-config-next@latest

# 4. Test thoroughly
npm run lint
```

---

### Indirect Dependency Warnings

These warnings come from dependencies of our dependencies (indirect/transitive):

#### 1. `glob` (versions prior to v9)
- **Used by**: ESLint, Jest, various build tools
- **Warning**: "Glob versions prior to v9 are no longer supported"
- **Fix**: Automatically resolved when parent packages update
- **Action**: None needed - will be fixed upstream

#### 2. `inflight` module
- **Used by**: Old versions of `glob`
- **Warning**: "This module is not supported, and leaks memory"
- **Fix**: Automatically resolved when glob updates to v9+
- **Action**: None needed - will be fixed upstream

#### 3. `@eslint/config-array` and `@eslint/object-schema`
- **Warning**: "Use @eslint/config-array or @eslint/object-schema instead"
- **Used by**: ESLint v8 internals
- **Fix**: Resolved in ESLint v9
- **Action**: Wait for ESLint v9 upgrade

#### 4. `rimraf` (versions prior to v4)
- **Used by**: Various build tools
- **Warning**: "Rimraf versions prior to v4 are no longer supported"
- **Fix**: Automatically updated by parent packages
- **Action**: None needed - not a security issue

---

## Safe Dependency Updates

You can safely update these to latest versions:

### Runtime Dependencies
```bash
# Update React (currently 18.3.1 - stable)
npm update react react-dom

# Update Next.js (currently 15.0.0)
npm update next

# Update other runtime dependencies
npm update @react-pdf/renderer recharts
```

### Development Dependencies
```bash
# Update test tools
npm update @playwright/test @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Update build tools
npm update autoprefixer postcss tailwindcss typescript

# Update type definitions
npm update @types/node @types/react @types/react-dom @types/jest
```

---

## Full Dependency Audit

### Check for updates
```bash
# See which packages have updates available
npm outdated

# Check for security vulnerabilities
npm audit

# Fix security issues automatically
npm audit fix
```

### Update all dependencies to latest (CAUTION)
```bash
# This may introduce breaking changes - test thoroughly!
npm update

# Or install npm-check-updates for major version updates
npx npm-check-updates -u
npm install
```

---

## Testing After Updates

Always run these after updating dependencies:

```bash
# 1. Run TypeScript compiler
npm run build

# 2. Run linter
npm run lint

# 3. Run unit tests
npm test

# 4. Run E2E tests
npm run test:e2e

# 5. Manual testing
npm run dev
# Test calculator flow, results page, API integrations
```

---

## Recommended Update Schedule

### Weekly
- Check `npm audit` for security issues
- Apply `npm audit fix` if vulnerabilities found

### Monthly
- Run `npm outdated` to check for updates
- Update patch versions (e.g., 1.2.3 → 1.2.4)
- Test thoroughly

### Quarterly
- Update minor versions (e.g., 1.2.0 → 1.3.0)
- Update development dependencies
- Review deprecation warnings

### Annually or when released
- Major version updates (e.g., 1.0.0 → 2.0.0)
- ESLint v8 → v9 migration
- Next.js major updates
- React major updates

---

## Known Safe Updates

These can be updated anytime without breaking changes:

✅ `@playwright/test` - Patch/minor updates safe
✅ `@testing-library/*` - Usually backwards compatible
✅ `@types/*` - Type definitions are safe to update
✅ `autoprefixer`, `postcss` - CSS tooling updates safe
✅ `tailwindcss` - Patch updates safe (test major versions)
✅ `typescript` - Minor updates usually safe

⚠️ **Caution with these**:
- `next` - Test thoroughly, check migration guides
- `react` - Major updates require code changes
- `eslint` - Major updates require config migration
- `jest` - Configuration may need updates

---

## Current Dependency Versions (as of this update)

```json
{
  "dependencies": {
    "@react-pdf/renderer": "^3.4.4",
    "next": "^15.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^2.12.7"
  },
  "devDependencies": {
    "@playwright/test": "^1.56.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/jest": "^30.0.0",
    "@types/node": "^20.19.24",
    "autoprefixer": "^10.4.20",
    "eslint": "^8",
    "eslint-config-next": "^15.0.0",
    "jest": "^30.2.0",
    "jest-environment-jsdom": "^30.2.0",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "ts-jest": "^29.4.5",
    "typescript": "^5"
  }
}
```

All major dependencies are current and maintained.

---

## Summary

✅ **Current state**: All dependencies are up-to-date and secure
⚠️ **Deprecation warnings**: Expected and will be resolved automatically
📅 **Next action**: Wait for ESLint v9 support in Next.js ecosystem
🔒 **Security**: Run `npm audit` regularly to check for vulnerabilities
