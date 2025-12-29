# Release Process

This document explains how to release changes to Murmurant.

---

## Overview

Changes flow through this path:

```
feature branch --> Pull Request --> sandbox --> main
                                      |           |
                                      v           v
                                   Staging    Production
```

---

## Step 1: Create a Feature Branch

Start from the latest `sandbox` branch:

```bash
git checkout sandbox
git pull origin sandbox
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New functionality
- `fix/` - Bug fixes
- `chore/` - Maintenance tasks
- `docs/` - Documentation updates

---

## Step 2: Make Your Changes

1. Write your code
2. Run tests locally:
   ```bash
   npm run test:unit
   npm run lint
   npm run typecheck
   ```
3. Commit your changes with clear messages

---

## Step 3: Open a Pull Request

1. Push your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Go to GitHub and create a Pull Request
   - Base: `sandbox`
   - Compare: `feature/your-feature-name`

3. Fill in the PR template:
   - What changed
   - How to test
   - Any risks or concerns

4. Wait for CI checks to pass

5. Request review if needed

---

## Step 4: Merge to Sandbox (Staging Deploy)

When the PR is approved:

1. Click **Merge Pull Request** on GitHub
2. Netlify automatically deploys to staging
3. Verify at: https://murmurant-staging-sbnc.netlify.app

### Staging Verification Checklist

- [ ] Site loads without errors
- [ ] Key features work as expected
- [ ] No console errors in browser
- [ ] API endpoints respond correctly

---

## Step 5: Promote to Production

When staging is verified and ready for production:

### Merge Sandbox to Main

```bash
git checkout main
git pull origin main
git merge sandbox
git push origin main
```

Or via GitHub:
1. Create PR from `sandbox` to `main`
2. Review the diff
3. Merge

### Verify Production

1. Wait for Netlify to deploy (usually 1-2 minutes)
2. Verify at: https://murmurant-prod-sbnc.netlify.app

### Production Verification Checklist

- [ ] Site loads without errors
- [ ] Login works
- [ ] Key features work
- [ ] Cron endpoint responds (GET for health check)
- [ ] No error alerts triggered

---

## Rollback Procedures

### If Production Has a Critical Bug

#### Option A: Revert the Merge (Recommended)

```bash
git checkout main
git revert -m 1 <merge-commit-hash>
git push origin main
```

This creates a new commit that undoes the merge.

#### Option B: Force Push to Previous State (Emergency Only)

```bash
git checkout main
git reset --hard <previous-good-commit>
git push --force origin main
```

**Warning**: This rewrites history. Use only in emergencies.

### After Rollback

1. Verify production is working
2. Investigate the issue on staging
3. Fix and re-test before re-deploying

---

## Database Migration Releases

If your release includes database changes:

### Before Merging

1. Ensure migration files are committed
2. Test migration on staging:
   ```bash
   DATABASE_URL="<staging-url>" npx prisma migrate deploy
   ```
3. Verify staging app works with new schema

### After Merging to Main

1. Run migration on production:
   ```bash
   DATABASE_URL="<prod-url>" npx prisma migrate deploy
   ```
2. Verify production app works

### Migration Rollback

If a migration causes issues:

1. Do NOT use `prisma migrate dev` on production
2. Write a new migration to reverse changes
3. Test reversal migration on staging
4. Apply to production

---

## Hotfix Process

For urgent production fixes:

1. Create branch from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-fix
   ```

2. Make the minimal fix

3. Open PR to `main` (not sandbox)

4. After merging to main, also merge to sandbox:
   ```bash
   git checkout sandbox
   git merge main
   git push origin sandbox
   ```

---

## Required Checks

Before merging, ensure:

- [ ] All CI tests pass
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] No new security vulnerabilities
- [ ] PR has been reviewed (if required)

---

## Environment-Specific Notes

### Staging

- Safe for experimentation
- Shares database with PR previews
- CRON_SECRET required for cron endpoints
- Okay to have test data

### Production

- Real member data
- Careful with destructive operations
- CRON_SECRET must be different from staging
- Changes should be well-tested on staging first

---

## Monitoring After Release

After deploying to production:

1. **Check Netlify logs**: Functions tab for any errors
2. **Check browser console**: No new errors on page load
3. **Check API health**: `curl https://murmurant-prod-sbnc.netlify.app/api/health`
4. **Watch for user reports**: First 30 minutes are critical

---

## Related Documentation

- [DEPLOYMENT_OVERVIEW.md](./DEPLOYMENT_OVERVIEW.md) - Architecture overview
- [NETLIFY.md](./NETLIFY.md) - Netlify configuration
- [NEON.md](./NEON.md) - Database configuration
- [Release Channels](../reliability/RELEASE_CHANNELS.md) - Channel definitions and promotion rules
