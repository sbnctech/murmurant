# Netlify Configuration

This document explains how ClubOS uses Netlify for web hosting.

---

## Overview

Netlify builds and hosts the ClubOS Next.js application. When code is pushed to GitHub, Netlify automatically builds and deploys it.

### Our Netlify Sites

| Site | Purpose | Admin URL |
|------|---------|-----------|
| clubos-staging-sbnc | Staging/testing | https://app.netlify.com/projects/clubos-staging-sbnc |
| clubos-prod-sbnc | Production | https://app.netlify.com/projects/clubos-prod-sbnc |

---

## How Branch Deploys Work

Netlify can deploy different Git branches to different URLs.

### Current Configuration

- **Staging site** deploys from `sandbox` branch
  - Push to `sandbox` triggers automatic deploy
  - URL: https://clubos-staging-sbnc.netlify.app

- **Production site** should deploy from `main` branch (target architecture)
  - Push to `main` triggers automatic deploy
  - URL: https://clubos-prod-sbnc.netlify.app

### Deploy Flow

```
Developer pushes to sandbox
          |
          v
Netlify detects change
          |
          v
Runs: npm run build
          |
          v
Deploys to: clubos-staging-sbnc.netlify.app
```

---

## How Deploy Previews Work

When you open a Pull Request, Netlify creates a preview deployment.

### PR Preview URLs

Each PR gets a unique preview URL:
```
https://deploy-preview-123--clubos-staging-sbnc.netlify.app
```

Where `123` is the PR number.

### Important Notes

- PR previews use the **staging database** (not production)
- Destructive operations are protected by CRON_SECRET
- Preview deploys are temporary and deleted after the PR closes

---

## Connecting Netlify to GitHub

If you need to connect a new Netlify site to GitHub:

### Step-by-Step (UI)

1. Go to https://app.netlify.com
2. Click the site you want to configure
3. Go to **Site configuration** (left sidebar)
4. Click **Build & deploy**
5. Under "Build settings", click **Link site to Git** or **Configure**
6. Select **GitHub** as provider
7. Authorize Netlify if prompted
8. Select repository: **sbnctech/clubos**
9. Configure build settings:
   - **Branch to deploy**: `main` (for prod) or `sandbox` (for staging)
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
10. Click **Save**

### Configuring Branch Deploys

1. In Site configuration, go to **Build & deploy** > **Branches and deploy contexts**
2. Under "Branch deploys", select the branches that should trigger deploys
3. For staging: select `sandbox`
4. For production: select `main`
5. Click **Save**

---

## Setting Environment Variables

Environment variables store secrets and configuration. They are set in Netlify, not in the code repository.

### Step-by-Step (UI)

1. Go to https://app.netlify.com
2. Click the site
3. Go to **Site configuration** > **Environment variables**
4. Click **Add a variable**
5. Enter the variable name and value
6. Choose scope:
   - **All scopes** - applies to all deploys
   - **Specific scopes** - can limit to production, deploy-preview, etc.
7. Click **Create variable**

### Step-by-Step (CLI)

If you have the Netlify CLI installed:

```bash
# Set a variable for all contexts
netlify env:set VARIABLE_NAME "value"

# Set for specific context
netlify env:set VARIABLE_NAME "value" --context production
```

### Required Variables

| Variable | Example Value | Notes |
|----------|---------------|-------|
| DATABASE_URL | postgresql://user:pass@host/db?sslmode=require | Neon connection string |
| CRON_SECRET | (random 32+ character string) | Protects cron endpoints |
| NEXT_PUBLIC_ENV | production | or "staging" |

---

## Rotating Secrets

### Rotating CRON_SECRET

1. Generate a new secret:
   ```bash
   openssl rand -base64 32
   ```

2. Update in Netlify (see "Setting Environment Variables" above)

3. Update any external cron job configurations that call the endpoint

4. Trigger a redeploy:
   ```bash
   netlify deploy --build --prod
   ```

### Rotating DATABASE_URL

1. In Neon console, reset the database password
2. Copy the new connection string
3. Update DATABASE_URL in Netlify
4. Trigger a redeploy

---

## Build Configuration

ClubOS uses these build settings:

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Publish directory | `.next` |
| Node version | 22.x |
| Package manager | npm |

The Netlify Next.js plugin (`@netlify/plugin-nextjs`) is automatically used.

---

## Troubleshooting

### Build fails with "DATABASE_URL not set"

**Cause**: The DATABASE_URL environment variable is missing.

**Fix**: Add DATABASE_URL to Netlify environment variables (see above).

### Build fails with "prisma generate" error

**Cause**: Prisma needs DATABASE_URL during build.

**Fix**: Ensure DATABASE_URL is set and the Neon database is accessible.

### Deploy preview shows wrong data

**Cause**: PR previews share the staging database.

**Fix**: This is expected. Use seed data or test data that is safe to modify.

### Site shows 404 after deploy

**Cause**: Build succeeded but routing failed.

**Check**:
1. Verify publish directory is `.next`
2. Check Netlify Functions logs for errors
3. Verify the Next.js build completed without errors

### Cron endpoint returns 401

**Cause**: Missing or incorrect CRON_SECRET.

**Fix**: 
1. Verify CRON_SECRET is set in Netlify
2. Ensure the Authorization header matches: `Bearer <CRON_SECRET>`

---

## Useful Commands

```bash
# Check Netlify CLI status
netlify status

# List environment variables (names only)
netlify env:list

# Trigger a build
netlify deploy --build

# Trigger production deploy
netlify deploy --build --prod

# View recent deploys
netlify api listSiteDeploys --data '{"site_id": "<site-id>"}' | jq '.[0:5]'
```

---

## Related Documentation

- [DEPLOYMENT_OVERVIEW.md](./DEPLOYMENT_OVERVIEW.md) - Architecture overview
- [NEON.md](./NEON.md) - Database configuration
- [RELEASE_PROCESS.md](./RELEASE_PROCESS.md) - Release workflow
