# ClubOS Deployment Overview

This document explains how ClubOS is deployed to the web and what databases it uses.

---

## Current State (as of December 2025)

ClubOS uses two cloud services for hosting:

- **Netlify** - Hosts the web application
- **Neon** - Hosts the PostgreSQL database

### Netlify Sites

| Site Name | URL | Git Branch | Purpose |
|-----------|-----|------------|---------|
| clubos-staging-sbnc | https://clubos-staging-sbnc.netlify.app | sandbox | Testing before production |
| clubos-prod-sbnc | https://clubos-prod-sbnc.netlify.app | sandbox* | Live production site |

*Note: Production is currently deploying from `sandbox` branch. Target architecture is `main` branch.

### Neon Databases

| Environment | Neon Endpoint | Status |
|-------------|---------------|--------|
| Staging | ep-flat-water-aerk6hof-pooler.c-2.us-east-2.aws.neon.tech | Active |
| Production | (same as staging)* | Active |

*Note: Current state uses one Neon project. Target architecture is two separate projects.

---

## Target Architecture

The recommended architecture isolates production from staging completely.

### Environment Matrix

| Environment | Netlify Site | Git Branch | Neon Project | URL |
|-------------|--------------|------------|--------------|-----|
| Production | clubos-prod-sbnc | main | clubos-prod (separate) | https://clubos-prod-sbnc.netlify.app |
| Staging | clubos-staging-sbnc | sandbox | clubos-staging | https://clubos-staging-sbnc.netlify.app |
| PR Preview | (auto-generated) | PR branch | clubos-staging | https://deploy-preview-NNN--clubos-staging-sbnc.netlify.app |
| Local Dev | none | any | localhost:5432 | http://localhost:3000 |

### Architecture Diagram

```
                    GitHub (sbnctech/clubos)
                              |
            +-----------------+-----------------+
            |                                   |
      [main branch]                      [sandbox branch]
            |                                   |
            v                                   v
   +------------------+               +------------------+
   | clubos-prod-sbnc |               | clubos-staging-sbnc |
   | (Netlify)        |               | (Netlify)           |
   +------------------+               +------------------+
            |                                   |
            v                                   v
   +------------------+               +------------------+
   | Neon: clubos-prod|               | Neon: clubos-staging |
   | (isolated)       |               | (shared with PR previews) |
   +------------------+               +------------------+
```

---

## Key Principles

1. **Production and staging databases are fully isolated**
   - No shared credentials
   - No shared data
   - Prevents accidental data exposure or corruption

2. **PR previews use the staging database**
   - Safe for testing
   - CRON_SECRET protects destructive operations
   - Clear "Preview" banner in UI (future)

3. **Production database is never shared**
   - Only the production Netlify site connects to production DB
   - Local development never points to production

4. **Secrets live in Netlify, not the repo**
   - DATABASE_URL, CRON_SECRET stored in Netlify env vars
   - .env files are local-only and gitignored

---

## Environment Variables

These environment variables must be set in Netlify for each site:

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string (Neon) |
| CRON_SECRET | Yes | Bearer token for cron endpoints |
| NEXT_PUBLIC_ENV | Yes | "production" or "staging" |
| APP_VERSION | No | Version string for /api/health |
| TRANSITION_WIDGET_LEAD_DAYS | No | Days before transition to show widget |

See [NETLIFY.md](./NETLIFY.md) for how to set these.

---

## Related Documentation

- [NETLIFY.md](./NETLIFY.md) - Netlify configuration and deployment
- [NEON.md](./NEON.md) - Database setup and migrations
- [RELEASE_PROCESS.md](./RELEASE_PROCESS.md) - How to release changes
- [../infra/LOCAL_DEV_ENV.md](../infra/LOCAL_DEV_ENV.md) - Local development setup

---

## Migration Path to Target Architecture

To reach the target architecture from current state:

1. Create separate Neon project for production
2. Change production Netlify site to deploy from `main` branch
3. Merge `sandbox` to `main` (with appropriate review)
4. Update DATABASE_URL in production Netlify to point to new Neon project
5. Run migrations on production database

See [RELEASE_PROCESS.md](./RELEASE_PROCESS.md) for detailed steps.
