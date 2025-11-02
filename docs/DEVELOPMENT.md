# Development Guide

Complete guide for developers working on the Coverage Gap Analyzer application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Debugging](#debugging)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ (comes with Node.js)
- **Git** 2.30+
- **Code Editor** (VS Code recommended)

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd coverage-gap-analyzer
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Jest & React Testing Library
- ESLint

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your values
nano .env.local
```

**Minimum configuration for development:**
```bash
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Workflow

### Daily Workflow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install any new dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Make changes and test

# 5. Run tests before committing
npm test

# 6. Build to check for errors
npm run build

# 7. Commit changes
git add .
git commit -m "Your commit message"
git push
```

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/<name>` - New features
- `bugfix/<name>` - Bug fixes
- `hotfix/<name>` - Production hotfixes

### Commit Message Format

Use conventional commits:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, no logic change)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

**Examples:**
```bash
feat(calculator): add third residence support
fix(validation): correct ZIP code regex pattern
docs(readme): update installation instructions
test(calculator): add edge case for Medicare
```

## Project Structure

```
coverage-gap-analyzer/
├── app/                          # Next.js App Router
│   ├── (pages)/                 # Route groups
│   │   ├── about/
│   │   ├── calculator/
│   │   ├── contact/
│   │   ├── privacy/
│   │   └── results/
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Homepage
│   └── globals.css              # Global styles
│
├── components/                   # React components
│   ├── calculator/              # Calculator step components
│   │   ├── Step1Residences.tsx
│   │   ├── Step2Household.tsx
│   │   ├── Step2_5CurrentInsurance.tsx
│   │   └── Step3Budget.tsx
│   ├── results/                 # Results page components
│   │   ├── RecommendationSummary.tsx
│   │   ├── AlternativeOptions.tsx
│   │   ├── CostBreakdown.tsx
│   │   └── ...
│   ├── __tests__/               # Component tests
│   ├── ErrorBoundary.tsx
│   ├── Navigation.tsx
│   ├── Footer.tsx
│   └── ...
│
├── lib/                          # Utilities and business logic
│   ├── calculator/              # Recommendation engine modules
│   │   ├── analyzeHousehold.ts
│   │   ├── calculateCosts.ts
│   │   ├── generateRecommendations.ts
│   │   └── ...
│   ├── __tests__/               # Unit tests
│   ├── analytics.ts             # Analytics integration
│   ├── constants.ts             # App constants
│   ├── env.ts                   # Environment config
│   ├── validation.ts            # Input validation
│   ├── validationMessages.ts    # Validation messages
│   └── ...
│
├── hooks/                        # Custom React hooks
│   ├── useDebounce.ts
│   ├── useFocusManagement.ts
│   ├── useKeyboardNavigation.ts
│   └── useMobileDetection.ts
│
├── types/                        # TypeScript type definitions
│   └── index.ts
│
├── docs/                         # Documentation
│   ├── ANALYTICS.md
│   ├── SECURITY.md
│   ├── PRINT_EXPORT.md
│   └── ...
│
├── public/                       # Static assets
│   ├── favicon.ico
│   └── og-image.png
│
├── .env.example                  # Environment template
├── .env.local                    # Local environment (gitignored)
├── jest.config.ts                # Jest configuration
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

## Code Standards

### TypeScript

**Always use TypeScript:**
```typescript
// ✅ Good
interface User {
  name: string;
  age: number;
}

function greet(user: User): string {
  return `Hello, ${user.name}!`;
}

// ❌ Bad
function greet(user) {
  return `Hello, ${user.name}!`;
}
```

**Use type inference where possible:**
```typescript
// ✅ Good
const count = 5; // TypeScript infers number

// ❌ Unnecessary
const count: number = 5;
```

### React Components

**Use functional components with TypeScript:**
```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
```

**Use client directive for interactive components:**
```typescript
'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  // ...
}
```

### Styling

**Use Tailwind utility classes:**
```tsx
// ✅ Good
<div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow-md">
  <span className="text-lg font-semibold">Hello</span>
</div>

// ❌ Avoid inline styles
<div style={{ display: 'flex', padding: '24px' }}>
  <span style={{ fontSize: '18px' }}>Hello</span>
</div>
```

**Use semantic color names:**
```tsx
// ✅ Good
className="text-primary bg-accent"

// ❌ Bad
className="text-blue-900 bg-blue-500"
```

### File Naming

- **Components:** PascalCase (`Button.tsx`, `ErrorBoundary.tsx`)
- **Utilities:** camelCase (`validation.ts`, `analytics.ts`)
- **Constants:** camelCase (`constants.ts`, `env.ts`)
- **Tests:** Match source file with `.test` suffix (`Button.test.tsx`)

### Import Order

```typescript
// 1. React imports
import { useState, useEffect } from 'react';

// 2. Next.js imports
import { useRouter } from 'next/navigation';

// 3. Third-party imports
import { someLibrary } from 'some-library';

// 4. Local imports (absolute paths)
import { Button } from '@/components/Button';
import { validateInput } from '@/lib/validation';

// 5. Types
import type { User } from '@/types';

// 6. Styles (if any)
import './styles.css';
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- Button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="validates ZIP code"
```

### Writing Tests

**Component tests:**
```typescript
import { render, screen } from '@testing-library/react';
import Button from '../Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button label="Click" onClick={handleClick} />);

    screen.getByText('Click').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

**Utility tests:**
```typescript
import { validateZipCode } from '../validation';

describe('validateZipCode', () => {
  it('accepts valid ZIP codes', () => {
    expect(validateZipCode('10001').isValid).toBe(true);
  });

  it('rejects invalid ZIP codes', () => {
    expect(validateZipCode('123').isValid).toBe(false);
  });
});
```

### Test Coverage Goals

- **Overall:** 80%+
- **Critical paths:** 100% (validation, calculations)
- **UI components:** 70%+

## Debugging

### Development Tools

**React DevTools:**
1. Install browser extension
2. Open DevTools → React tab
3. Inspect component tree and props

**Next.js DevTools:**
- Fast Refresh automatically enabled
- Error overlay shows stack traces
- Build errors in terminal

### Debug Logging

```typescript
import env from '@/lib/env';

if (env.enableDebug) {
  console.log('[Debug]', data);
}
```

### Common Debug Scenarios

**State not updating:**
```typescript
// Check dependencies
useEffect(() => {
  fetchData();
}, [dependency]); // ← Make sure this is correct
```

**Form not validating:**
```typescript
// Add console logs
const handleSubmit = () => {
  console.log('Form data:', formData);
  console.log('Errors:', errors);
  // ...
};
```

## Common Tasks

### Adding a New Page

```bash
# 1. Create directory
mkdir app/new-page

# 2. Create page.tsx
touch app/new-page/page.tsx

# 3. Add content
export default function NewPage() {
  return <div>New Page</div>;
}

# 4. Add to navigation (components/Navigation.tsx)
```

### Adding a New Component

```bash
# 1. Create component file
touch components/NewComponent.tsx

# 2. Create test file
touch components/__tests__/NewComponent.test.tsx

# 3. Implement component
# 4. Write tests
# 5. Export and use
```

### Adding Environment Variable

```bash
# 1. Add to .env.example
echo "NEXT_PUBLIC_NEW_VAR=value" >> .env.example

# 2. Add to lib/env.ts
export const env = {
  // ...
  newVar: getEnvVar('NEXT_PUBLIC_NEW_VAR', 'default'),
};

# 3. Use in code
import env from '@/lib/env';
console.log(env.newVar);
```

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update specific package
npm update package-name

# Update all packages (careful!)
npm update

# Verify tests still pass
npm test
npm run build
```

## Troubleshooting

### Build Errors

**Error: Module not found**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npm run dev
```

**Error: TypeScript errors**
```bash
# Check tsconfig.json is correct
# Run type check
npx tsc --noEmit

# Fix errors shown in output
```

### Test Failures

**Tests passing locally but failing in CI:**
- Check Node.js version matches
- Verify all dependencies in package.json
- Check for timezone issues in date tests

**Snapshot mismatches:**
```bash
# Update snapshots
npm test -- -u

# Review changes carefully before committing
```

### Performance Issues

**Slow page loads:**
1. Check bundle size: `npm run build`
2. Use React DevTools Profiler
3. Check for unnecessary re-renders
4. Implement code splitting

**Slow tests:**
1. Use `it.only` to isolate slow tests
2. Mock expensive operations
3. Avoid unnecessary renders in tests

### Hot Reload Not Working

```bash
# Restart dev server
# Ctrl+C to stop, then:
npm run dev

# If still not working, clear cache:
rm -rf .next
npm run dev
```

## Next Steps

- Read [COMPONENTS.md](./COMPONENTS.md) for component reference
- Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment guide
- Check existing tests for examples

---

**Last Updated:** 2025-01-01
**Version:** 1.0
