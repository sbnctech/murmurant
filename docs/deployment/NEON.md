# Neon Database Configuration

This document explains how ClubOS uses Neon for PostgreSQL database hosting.

---

## What is Neon?

Neon is a serverless PostgreSQL database service. It provides:

- Managed PostgreSQL with automatic scaling
- Connection pooling (via their pooler endpoints)
- Branching for development workflows
- Automatic backups

Website: https://neon.tech

---

## Current State

ClubOS currently uses one Neon project for staging. Target architecture is two separate projects.

### Current Setup

| Environment | Neon Project | Branch | Endpoint |
|-------------|--------------|--------|----------|
| Staging | neondb | main | ep-flat-water-aerk6hof-pooler.c-2.us-east-2.aws.neon.tech |
| Production | (same project)* | main | (same endpoint)* |

*Target architecture: Separate Neon project for production.

### Target Setup

| Environment | Neon Project | Branch | Endpoint |
|-------------|--------------|--------|----------|
| Staging | clubos-staging | main | (staging endpoint) |
| Production | clubos-prod | main | (production endpoint) |

---

## Connection Strings

Neon provides two types of connection strings:

### Pooled Connection (Recommended)

Use the `-pooler` endpoint for web applications:
```
postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require
```

### Direct Connection

Use for migrations or admin tasks:
```
postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

### Where to Find Your Connection String

1. Go to https://console.neon.tech
2. Select your project
3. Click **Dashboard**
4. Copy the connection string (pooled or direct)

---

## Creating a New Neon Project

### Via Neon Console (UI)

1. Go to https://console.neon.tech
2. Click **New Project**
3. Configure:
   - **Name**: `clubos-prod` or `clubos-staging`
   - **Postgres version**: 17 (latest)
   - **Region**: US East (Ohio) - matches Netlify region
4. Click **Create Project**
5. Copy the connection string

### Via Neon CLI

```bash
# Install CLI (if needed)
npm install -g neonctl

# Authenticate
neonctl auth

# Create project
neonctl projects create --name clubos-prod --region aws-us-east-2

# Get connection string
neonctl connection-string --project-id <project-id>
```

---

## Prisma and Migrations

ClubOS uses Prisma as its database toolkit. Migrations are stored in `prisma/migrations/`.

### Running Migrations on Staging

```bash
# Set DATABASE_URL to staging
export DATABASE_URL="postgresql://..."

# Apply migrations
npx prisma migrate deploy
```

### Running Migrations on Production

**CAUTION**: Production migrations require extra care.

1. **Backup first** (Neon has automatic backups, but verify)

2. **Test on staging** before running on production

3. **Run during low-traffic period** if possible

4. **Execute**:
   ```bash
   export DATABASE_URL="<production-connection-string>"
   npx prisma migrate deploy
   ```

5. **Verify** the application works after migration

### Checking Migration Status

```bash
npx prisma migrate status
```

This shows which migrations have been applied.

---

## Safe Rollback Guidance

### If a Migration Fails

1. Check the error message in the terminal
2. Do NOT run `prisma migrate dev` on production
3. Fix the migration file locally
4. Test on staging first
5. Re-run `prisma migrate deploy`

### If You Need to Rollback Data

Neon provides point-in-time recovery:

1. Go to Neon Console > Your Project > **Restore**
2. Select a point in time before the issue
3. Create a new branch from that point
4. Verify the data
5. If correct, promote the branch

### Manual Rollback (Schema)

Prisma does not have automatic rollback. If needed:

1. Write a new migration that reverses the changes
2. Apply it with `prisma migrate deploy`

---

## Connecting from Local Development

For local development, use either:

### Option A: Local PostgreSQL (Recommended)

Use Docker Compose (see `docs/infra/LOCAL_DEV_ENV.md`):

```
DATABASE_URL="postgresql://clubos:clubos@localhost:5432/clubos_dev"
```

### Option B: Neon Dev Branch

Create a development branch in Neon:

1. In Neon Console, click **Branches**
2. Click **New Branch**
3. Name it `dev-<your-name>`
4. Use that branch's connection string locally

**Important**: Never use production DATABASE_URL locally.

---

## Security Best Practices

1. **Never commit connection strings** to the repository
2. **Use different passwords** for staging and production
3. **Rotate passwords periodically** (see NETLIFY.md)
4. **Use SSL** - always include `?sslmode=require`
5. **Use pooled connections** for the application
6. **Limit IP access** if Neon supports it

---

## Neon Dashboard Quick Reference

| Task | Where to Find |
|------|---------------|
| View databases | Console > Project > **Tables** |
| Check connections | Console > Project > **Monitoring** |
| Reset password | Console > Project > **Settings** > **Roles** |
| View backups | Console > Project > **Restore** |
| Create branch | Console > Project > **Branches** |

---

## Troubleshooting

### Connection Timeout

**Cause**: Neon serverless may have cold start delay.

**Fix**: First connection may take 1-2 seconds. Subsequent connections are faster.

### "password authentication failed"

**Cause**: Wrong password or connection string.

**Fix**: 
1. Go to Neon Console
2. Reset the password under Settings > Roles
3. Update DATABASE_URL in Netlify

### "relation does not exist"

**Cause**: Migrations have not been run.

**Fix**: Run `npx prisma migrate deploy` with the correct DATABASE_URL.

### "too many connections"

**Cause**: Using direct connection without pooling.

**Fix**: Use the `-pooler` endpoint in your connection string.

---

## Related Documentation

- [DEPLOYMENT_OVERVIEW.md](./DEPLOYMENT_OVERVIEW.md) - Architecture overview
- [NETLIFY.md](./NETLIFY.md) - Netlify configuration
- [RELEASE_PROCESS.md](./RELEASE_PROCESS.md) - Release workflow
- [../infra/LOCAL_DEV_ENV.md](../infra/LOCAL_DEV_ENV.md) - Local development
