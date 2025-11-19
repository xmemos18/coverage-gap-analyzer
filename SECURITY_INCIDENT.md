# Security Incident Response - Exposed Credentials

**Date Identified:** 2025-11-19
**Severity:** CRITICAL
**Status:** REQUIRES IMMEDIATE ACTION

## Summary

Database credentials and API keys were exposed in `.env.local` file. This document provides step-by-step instructions to rotate all compromised credentials and prevent future incidents.

## Exposed Credentials

1. **Supabase Database** - PostgreSQL connection string
   - Host: `db.kbmojgflmkvnqxonxlej.supabase.co`
   - Database: `postgres`
   - User: `postgres`
   - ⚠️ **Password exposed**

2. **Healthcare.gov API Key**
   - ⚠️ **API Key exposed:** `qcwVp2637TQ0RaPtbHqH2o5w0WuWmqg8`

---

## IMMEDIATE ACTION REQUIRED

### Step 1: Rotate Supabase Database Password

1. **Login to Supabase Dashboard**
   ```bash
   # Navigate to: https://supabase.com/dashboard/project/kbmojgflmkvnqxonxlej
   ```

2. **Reset Database Password**
   - Go to **Settings** → **Database**
   - Click **"Reset Database Password"**
   - Generate a new strong password (use password manager)
   - **Copy the new password immediately** (only shown once)

3. **Update Local Environment**
   ```bash
   # Edit .env.local
   DATABASE_URL="postgresql://postgres:NEW_PASSWORD_HERE@db.kbmojgflmkvnqxonxlej.supabase.co:5432/postgres"
   ```

4. **Update Production Environment**
   ```bash
   # If deployed on Vercel
   vercel env add DATABASE_URL production
   # Paste the new DATABASE_URL when prompted

   # Redeploy to apply new credentials
   vercel --prod
   ```

5. **Update CI/CD Secrets**
   - GitHub Actions: Settings → Secrets → Update `DATABASE_URL`
   - Other CI/CD: Update secrets in respective platforms

6. **Verify Connection**
   ```bash
   # Test database connection
   npm run db:test-connection
   ```

---

### Step 2: Rotate Healthcare.gov API Key

1. **Login to Healthcare.gov Developer Portal**
   ```bash
   # Navigate to: https://developer.cms.gov/
   ```

2. **Revoke Old API Key**
   - Go to **Dashboard** → **API Keys**
   - Find key: `qcwVp2637TQ0RaPtbHqH2o5w0WuWmqg8`
   - Click **"Revoke"** or **"Delete"**

3. **Generate New API Key**
   - Click **"Create New API Key"**
   - Name: `coverage-gap-analyzer-prod-2025`
   - Copy the new key immediately

4. **Update Local Environment**
   ```bash
   # Edit .env.local
   HEALTHCARE_GOV_API_KEY="NEW_KEY_HERE"
   ```

5. **Update Production Environment**
   ```bash
   # Vercel
   vercel env add HEALTHCARE_GOV_API_KEY production

   # Redeploy
   vercel --prod
   ```

6. **Verify API Access**
   ```bash
   # Test API connection
   npm run test:api
   ```

---

### Step 3: Clean Git History

⚠️ **WARNING:** This rewrites git history. Coordinate with team before proceeding.

#### Option A: BFG Repo-Cleaner (Recommended)

```bash
# 1. Install BFG
brew install bfg  # macOS
# or download from: https://rtyley.github.io/bfg-repo-cleaner/

# 2. Clone a fresh bare repository
git clone --mirror git@github.com:YOUR_USERNAME/coverage-gap-analyzer.git

# 3. Run BFG to remove .env.local from history
bfg --delete-files .env.local coverage-gap-analyzer.git

# 4. Clean up and push
cd coverage-gap-analyzer.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Force push (⚠️ coordinates with team first!)
git push --force

# 6. All team members must re-clone
cd ..
rm -rf coverage-gap-analyzer coverage-gap-analyzer.git
git clone git@github.com:YOUR_USERNAME/coverage-gap-analyzer.git
```

#### Option B: Git Filter-Repo (Alternative)

```bash
# 1. Install git-filter-repo
pip install git-filter-repo

# 2. Create backup
git clone coverage-gap-analyzer coverage-gap-analyzer-backup

# 3. Remove .env.local from history
cd coverage-gap-analyzer
git filter-repo --invert-paths --path .env.local

# 4. Force push (⚠️ coordinates with team first!)
git push --force --all
git push --force --tags

# 5. All team members must re-clone
```

---

### Step 4: Verify .gitignore

Ensure `.env.local` is properly ignored:

```bash
# Check .gitignore
cat .gitignore | grep "\.env"

# Should see:
# .env*.local
# .env.local
# .env.development.local
# .env.test.local
# .env.production.local

# Verify file is ignored
git check-ignore .env.local
# Should output: .env.local

# Ensure file is not tracked
git ls-files | grep "\.env\.local"
# Should output nothing
```

If `.env.local` is still tracked:

```bash
# Remove from git tracking
git rm --cached .env.local
git commit -m "Remove .env.local from tracking"
git push
```

---

### Step 5: Setup Secret Scanning

#### Option A: GitHub Secret Scanning (If using GitHub)

1. Go to repository **Settings** → **Security & analysis**
2. Enable **"Secret scanning"**
3. Enable **"Push protection"** (prevents pushing secrets)

#### Option B: GitGuardian (Recommended)

```bash
# 1. Install GitGuardian CLI
pip install ggshield

# 2. Get API key from https://dashboard.gitguardian.com/
export GITGUARDIAN_API_KEY="your-api-key"

# 3. Scan repository history
ggshield secret scan repo .

# 4. Add pre-commit hook
ggshield install -m local

# 5. Add to CI/CD
# .github/workflows/security.yml
name: GitGuardian Scan
on: [push, pull_request]
jobs:
  scanning:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: GitGuardian/ggshield-action@v1
        env:
          GITGUARDIAN_API_KEY: ${{ secrets.GITGUARDIAN_API_KEY }}
```

#### Option C: TruffleHog (Alternative)

```bash
# 1. Install Trufflehog
brew install trufflehog  # macOS

# 2. Scan repository
trufflehog git file://. --since-commit HEAD --json

# 3. Add pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
trufflehog git file://. --since-commit HEAD~1 --fail
EOF
chmod +x .git/hooks/pre-commit
```

---

### Step 6: Audit Database Access

Check for unauthorized access during exposure window:

```sql
-- Connect to Supabase dashboard → SQL Editor
-- Check recent connections
SELECT
  datname,
  usename,
  application_name,
  client_addr,
  backend_start,
  state,
  query
FROM pg_stat_activity
WHERE usename = 'postgres'
ORDER BY backend_start DESC
LIMIT 100;

-- Check for suspicious queries in logs
-- Go to Supabase Dashboard → Logs → Database
-- Filter by time range when credentials were exposed
-- Look for:
--   - Unexpected IP addresses
--   - Mass data exports (SELECT * FROM ...)
--   - Schema changes (DROP, ALTER, CREATE)
--   - Privilege escalations (GRANT, REVOKE)
```

If suspicious activity found:
1. Export logs for forensic analysis
2. Contact Supabase support immediately
3. Consider database restore from pre-incident backup

---

### Step 7: Monitor Healthcare.gov API Usage

```bash
# Check for unusual API usage
# Login to https://developer.cms.gov/dashboard

# Look for:
# - Spike in API calls during exposure window
# - Requests from unexpected IP addresses/regions
# - Rate limit violations
# - Failed authentication attempts

# Export usage logs for analysis
```

If suspicious activity found:
1. Document all unusual patterns
2. Contact CMS.gov API support
3. Consider implementing additional rate limiting

---

## Prevention Measures

### 1. Environment Variable Management

**Update .env.example:**
```bash
# .env.example (safe to commit)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres"
HEALTHCARE_GOV_API_KEY="your-api-key-here"

# Add comment
# ⚠️ NEVER commit .env.local or any file with real credentials
# Copy this file to .env.local and fill in real values
```

**Create setup script:**
```bash
# scripts/setup-env.sh
#!/bin/bash
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "✅ Created .env.local from template"
  echo "⚠️  Please edit .env.local with real credentials"
else
  echo "⚠️  .env.local already exists"
fi
```

### 2. Use Secret Management Services

**Option A: Vercel Environment Variables (Production)**
```bash
# All production secrets in Vercel dashboard
# Never store in .env.local for production

# Set variables:
vercel env add DATABASE_URL production
vercel env add HEALTHCARE_GOV_API_KEY production
```

**Option B: AWS Secrets Manager**
```typescript
// lib/secrets/aws.ts
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export async function getSecret(secretName: string): Promise<string> {
  const client = new SecretsManagerClient({ region: 'us-east-1' });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  return response.SecretString || '';
}
```

**Option C: HashiCorp Vault**
```typescript
// lib/secrets/vault.ts
import vault from 'node-vault';

const client = vault({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

export async function getSecret(path: string): Promise<Record<string, string>> {
  const result = await client.read(path);
  return result.data;
}
```

### 3. Implement Git Hooks

**Pre-commit hook to prevent secret commits:**
```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Check for potential secrets
if git diff --cached --name-only | grep -E "\.env\.local$"; then
  echo "❌ ERROR: Attempting to commit .env.local"
  echo "This file contains secrets and should never be committed"
  exit 1
fi

# Run secret scanner
npx secretlint --secretlintrc .secretlintrc.json $(git diff --cached --name-only)
```

**Install:**
```bash
npm install --save-dev husky secretlint @secretlint/secretlint-rule-preset-recommend
npx husky install
npx husky add .husky/pre-commit "npm run pre-commit"
```

### 4. Regular Security Audits

Add to calendar:
- **Weekly:** Review API access logs
- **Monthly:** Rotate API keys (best practice)
- **Quarterly:** Full security audit
- **Yearly:** Penetration testing

### 5. Team Training

- Never commit `.env` files
- Use password managers (1Password, Bitwarden)
- Enable 2FA on all accounts
- Review git commits before pushing
- Report security incidents immediately

---

## Incident Timeline

| Time | Action | Status |
|------|--------|--------|
| 2025-11-19 | Credentials exposed in .env.local | ❌ Vulnerable |
| PENDING | Rotate Supabase password | ⏳ Waiting |
| PENDING | Rotate Healthcare.gov API key | ⏳ Waiting |
| PENDING | Clean git history | ⏳ Waiting |
| PENDING | Setup secret scanning | ⏳ Waiting |
| PENDING | Audit access logs | ⏳ Waiting |

---

## Checklist

Use this checklist to track progress:

- [ ] Rotated Supabase database password
- [ ] Updated DATABASE_URL in .env.local
- [ ] Updated DATABASE_URL in Vercel/production
- [ ] Verified database connection works
- [ ] Revoked old Healthcare.gov API key
- [ ] Generated new Healthcare.gov API key
- [ ] Updated HEALTHCARE_GOV_API_KEY in .env.local
- [ ] Updated HEALTHCARE_GOV_API_KEY in Vercel/production
- [ ] Verified API access works
- [ ] Cleaned git history (BFG or filter-repo)
- [ ] Verified .env.local in .gitignore
- [ ] Setup secret scanning (GitGuardian/TruffleHog)
- [ ] Added pre-commit hooks
- [ ] Audited database access logs
- [ ] Audited API usage logs
- [ ] Updated .env.example with safe template
- [ ] Documented incident in security log
- [ ] Notified team members to re-clone
- [ ] Scheduled follow-up security review

---

## Support Contacts

- **Supabase Support:** support@supabase.io
- **CMS.gov API Support:** https://developer.cms.gov/support
- **Security Team:** [Your security contact]

---

## References

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod#security)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [Git Filter-Repo](https://github.com/newren/git-filter-repo)
- [GitGuardian Documentation](https://docs.gitguardian.com/)
- [TruffleHog Documentation](https://github.com/trufflesecurity/trufflehog)
- [OWASP Secret Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

**Last Updated:** 2025-11-19
**Next Review:** After all checklist items completed
