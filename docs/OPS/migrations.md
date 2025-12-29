# Safe Database Migrations

This document describes Murmurant migration safety practices and how to handle destructive schema changes.

**Charter Principles:**

- **P2**: Default deny - dangerous migration patterns are blocked by default
- **P7**: Observability - migrations must be auditable and reversible
- **P9**: Fail closed - CI blocks dangerous patterns unless explicitly approved

---

## Migration Safety Check

Murmurant runs automated checks on all Prisma migrations to prevent accidental data loss.

### Blocked Patterns

The following patterns are blocked unless explicitly approved:

| Pattern | Risk | Example |
|---------|------|---------|
| `DROP TABLE` | Deletes entire table and all data | `DROP TABLE "users";` |
| `DROP COLUMN` | Deletes column and all values | `ALTER TABLE "users" DROP COLUMN "email";` |
| `UPDATE` without `WHERE` | Modifies every row in table | `UPDATE "users" SET status = 'inactive';` |
| `DELETE` without `WHERE` | Deletes every row in table | `DELETE FROM "users";` |

### Running the Check Locally

```bash
# Check all migrations
./scripts/ci/check-migration-safety.sh

# Check a specific directory
./scripts/ci/check-migration-safety.sh prisma/migrations
```

---

## How to Write Safe Migrations

### 1. Additive Changes Are Safe

These patterns are always safe:

```sql
-- Adding a new table
CREATE TABLE "new_feature" (...);

-- Adding a new column (nullable)
ALTER TABLE "users" ADD COLUMN "nickname" TEXT;

-- Adding a new column with default
ALTER TABLE "users" ADD COLUMN "created_at" TIMESTAMP DEFAULT NOW();

-- Adding an index
CREATE INDEX "idx_users_email" ON "users"("email");
```

### 2. Use Phased Migrations for Breaking Changes

Never drop columns or tables in a single migration. Use a phased approach:

**Phase 1: Deprecate (Week 1)**

- Mark the column/table as deprecated in code
- Stop writing to it
- Add the new column/table if replacing

**Phase 2: Migrate Data (Week 2)**

- Copy data to new location if needed
- Verify data integrity

**Phase 3: Remove (Week 3+)**

- Remove code references
- Create the DROP migration with approval annotation

### 3. Always Use WHERE Clauses

```sql
-- BAD: Updates all rows
UPDATE "users" SET status = 'inactive';

-- GOOD: Updates specific rows
UPDATE "users" SET status = 'inactive' WHERE last_login < '2024-01-01';
```

---

## Approving Destructive Changes

When you have a legitimate need for a destructive migration, you must:

### 1. Add an Approval Annotation

Add `-- MIGRATION_APPROVED: <reason>` on the **same line** as the dangerous statement:

```sql
-- Cleanup of deprecated legacy_users table per RFC-2024-003
DROP TABLE "legacy_users"; -- MIGRATION_APPROVED: deprecated table, data migrated to users

-- Removing unused column after verification
ALTER TABLE "events" DROP COLUMN "old_category"; -- MIGRATION_APPROVED: replaced by category_id in v2.3
```

### 2. Document the Reason

The approval reason should include:

- Why the change is necessary
- Reference to RFC, issue, or decision document
- Confirmation that data has been migrated or is no longer needed

### 3. Test Restore Procedure

Before merging any destructive migration:

1. Take a backup
2. Apply the migration
3. Verify the restore procedure works (see [restore-drill.md](./restore-drill.md))

---

## Multi-Statement Migrations

For complex migrations with multiple statements, annotate each dangerous line:

```sql
-- Migration: Consolidate user tables
-- Approved by: Team lead on 2024-03-15
-- Backup verified: Yes

-- Copy data to new structure
INSERT INTO "users_v2" SELECT * FROM "users";

-- Remove old tables
DROP TABLE "user_profiles"; -- MIGRATION_APPROVED: data merged into users_v2
DROP TABLE "user_settings"; -- MIGRATION_APPROVED: data merged into users_v2
DROP TABLE "users"; -- MIGRATION_APPROVED: replaced by users_v2
```

---

## CI Integration

The migration safety check runs automatically in CI. A PR will fail if:

1. Any dangerous pattern is detected without approval
2. The migration files cannot be read
3. The check script encounters an error (fail closed per P9)

### Bypassing in Emergency

There is no bypass. If you need to merge a destructive migration:

1. Add the `MIGRATION_APPROVED` annotation with a clear reason
2. Get code review approval
3. Ensure backup and restore procedures are documented

---

## Rollback Strategy

Every migration should have a mental or documented rollback plan:

| Migration Type | Rollback Strategy |
|----------------|-------------------|
| Add column | Drop column (requires approval) |
| Add table | Drop table (requires approval) |
| Add index | Drop index |
| Drop column | Restore from backup |
| Drop table | Restore from backup |
| Data update | Restore from backup or reverse update |

For destructive changes, the rollback strategy is always: **restore from backup**.

See [restore-drill.md](./restore-drill.md) for restore procedures.

---

## Related Documents

- [restore-drill.md](./restore-drill.md) - Backup and restore procedures
- [ARCHITECTURAL_CHARTER.md](../ARCHITECTURAL_CHARTER.md) - System principles
