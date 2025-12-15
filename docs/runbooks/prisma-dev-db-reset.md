# Prisma Dev DB Reset and Drift Recovery

## Scope

**LOCAL DEV ONLY** - `clubos_dev` on `localhost:5432`

Never run these procedures against production databases.

## When to Use

- Prisma reports "drift detected" or schema mismatch
- Error: "migration(s) applied to the database but missing locally"
- You switched branches and migrations/seed data disagree
- Fresh local dev environment setup

## Symptoms of Drift

```
Error: P3006
Migration `20241201_xyz` failed to apply cleanly to the shadow database.
```

```
Drift detected: Your database schema is not in sync with your migration history.
```

## Safe Recovery Procedure

### Step 1: Confirm Target Database

```bash
# Verify you're targeting LOCAL dev DB
echo $DATABASE_URL
# Should show: postgresql://...@localhost:5432/clubos_dev
```

**STOP** if DATABASE_URL points to anything other than localhost.

### Step 2: Check Drift (Non-Destructive)

```bash
scripts/ops/db/check_drift.sh
```

This inspects alignment without modifying the database.

### Step 3: Reset Dev DB (If Needed)

```bash
# Requires explicit consent
PRISMA_RESET_CONSENT=yes scripts/ops/db/reset_dev_db.sh
```

This will:

1. Drop and recreate the local dev database
2. Apply all migrations from scratch
3. Regenerate Prisma client
4. Run seed script (if available)

### Step 4: Verify

```bash
npm run typecheck
npm run test-admin  # or relevant test suite
```

## Helper Scripts

| Script | Purpose | Destructive? |
|--------|---------|--------------|
| `scripts/ops/db/check_drift.sh` | Detect drift, print status | No |
| `scripts/ops/db/reset_dev_db.sh` | Full dev DB reset | Yes (requires consent) |

## Common Scenarios

### Switched Branches with Different Migrations

Your dev DB has migrations from branch A, but you're now on branch B with different migrations.

**Solution:** Reset dev DB to get a clean slate matching current branch.

### Created Migration on Wrong Branch

You accidentally ran `prisma migrate dev` on the wrong branch.

**Solution:**

1. Delete the unwanted migration file from `prisma/migrations/`
2. Reset dev DB
3. Switch to correct branch
4. Re-run migrations

### Shadow Database Errors

Prisma uses a shadow database for migration validation. If it reports shadow DB issues:

**Solution:** Reset dev DB - this clears both main and shadow databases.

## Safety Notes

- These scripts only affect LOCAL development databases
- Production databases require different procedures and approvals
- Always verify `DATABASE_URL` before running destructive commands
- The consent environment variable prevents accidental execution
