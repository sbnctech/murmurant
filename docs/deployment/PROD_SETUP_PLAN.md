# Production Setup Plan

This document outlines the steps to reach target architecture where production deploys from `main` branch with an isolated database.

---

## Current State

| Item | Current | Target |
|------|---------|--------|
| Production branch | sandbox | main |
| Production database | Shared with staging | Separate Neon project |
| Staging branch | sandbox | sandbox (no change) |

---

## Phase 1: Merge Sandbox to Main

Before switching production to main, ensure main has the latest code.

### Prerequisites

- [ ] Sandbox is stable and tested
- [ ] No pending critical fixes

### Steps

```bash
# Fetch latest
git fetch origin

# Checkout main
git checkout main
git pull origin main

# Merge sandbox into main
git merge origin/sandbox

# Push
git push origin main
```

---

## Phase 2: Create Production Neon Project

### Option A: Via Neon CLI (Preferred)

```bash
# Authenticate if needed
npx neonctl auth

# Create production project
npx neonctl projects create --name murmurant-prod --region aws-us-east-2

# Get connection string
npx neonctl connection-string --project-id <new-project-id>
```

### Option B: Via Neon Console (UI)

1. Go to https://console.neon.tech
2. Click **New Project**
3. Configure:
   - **Name**: `murmurant-prod`
   - **Postgres version**: 17
   - **Region**: US East (Ohio) - `aws-us-east-2`
4. Click **Create Project**
5. Copy the **pooled** connection string

---

## Phase 3: Run Migrations on Production Database

After creating the production Neon project:

```bash
# Set the production DATABASE_URL
export DATABASE_URL="postgresql://...new-prod-connection..."

# Verify connection
npx prisma migrate status

# Apply all migrations
npx prisma migrate deploy

# Verify tables exist
npx prisma db execute --stdin <<< "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
```

---

## Phase 4: Update Production Netlify Environment Variables

### Via Netlify CLI

```bash
# Link to production site
netlify link --id 5b615a0d-e4d9-47f0-894a-88770c5f5bb0

# Set DATABASE_URL (replace with actual value)
netlify env:set DATABASE_URL "postgresql://...new-prod-connection..."

# Verify CRON_SECRET is set (should already be set)
netlify env:list
```

### Via Netlify UI

1. Go to https://app.netlify.com/projects/murmurant-prod-sbnc
2. Navigate to **Site configuration** > **Environment variables**
3. Update **DATABASE_URL** to the new production Neon connection string
4. Verify **CRON_SECRET** is set
5. Verify **NEXT_PUBLIC_ENV** is set to `production`

---

## Phase 5: Change Production Branch to Main (UI Required)

This step requires the Netlify UI.

### Step-by-Step

1. Go to https://app.netlify.com/projects/murmurant-prod-sbnc

2. Click **Site configuration** (left sidebar)

3. Click **Build & deploy**

4. Under **Branches and deploy contexts**, click **Configure**

5. Change **Production branch** from `sandbox` to `main`

6. Under **Branch deploys**, ensure only `main` is selected (or "None" if you only want production deploys)

7. Click **Save**

### Trigger Deploy

After saving, trigger a deploy:

```bash
netlify deploy --build --prod --site murmurant-prod-sbnc
```

Or push to main:

```bash
git checkout main
git commit --allow-empty -m "chore: trigger production deploy"
git push origin main
```

---

## Phase 6: Verify Production

### Health Check

```bash
# API health
curl https://murmurant-prod-sbnc.netlify.app/api/health

# Version endpoint
curl https://murmurant-prod-sbnc.netlify.app/api/v1/version

# Cron health (no auth needed for GET)
curl https://murmurant-prod-sbnc.netlify.app/api/cron/transitions
```

### Database Verification

```bash
# Connect to production database and verify tables
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"Member\";"
```

---

## Rollback Plan

If something goes wrong after switching to main:

### Revert Branch Setting

1. Go to Netlify > Site configuration > Build & deploy > Branches
2. Change Production branch back to `sandbox`
3. Save and wait for deploy

### Revert Database

If using the new production database caused issues:

1. Update DATABASE_URL in Netlify to point back to staging database
2. Trigger redeploy

---

## Post-Migration Checklist

After completing all phases:

- [ ] Production deploys from `main` branch
- [ ] Production uses separate Neon database
- [ ] Staging continues to deploy from `sandbox`
- [ ] Health endpoints respond correctly
- [ ] Cron endpoint works with CRON_SECRET
- [ ] Documentation updated with actual endpoints

---

## Timeline Recommendation

1. **Phase 1-2**: Can be done immediately (safe, reversible)
2. **Phase 3**: Run after Phase 2, during low-traffic time
3. **Phase 4-5**: Coordinate together, brief downtime possible
4. **Phase 6**: Immediately after Phase 5

Total time: 30-60 minutes if done sequentially.
