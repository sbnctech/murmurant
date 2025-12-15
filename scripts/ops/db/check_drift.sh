#!/usr/bin/env bash
# Check for Prisma schema drift (non-destructive)
# This script inspects migration/schema alignment without modifying the database.

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

echo "=== Prisma Drift Check ==="
echo "Target: LOCAL DEV ONLY"
echo

# Verify we're targeting localhost
if [[ "${DATABASE_URL:-}" != *"localhost"* && "${DATABASE_URL:-}" != *"127.0.0.1"* ]]; then
  echo "ERROR: DATABASE_URL does not point to localhost."
  echo "This script is for LOCAL DEV ONLY."
  echo "Current DATABASE_URL: ${DATABASE_URL:-<not set>}"
  exit 1
fi

echo "Database URL check: OK (localhost)"
echo

# Run migrate status to check alignment
echo "Checking migration status..."
echo

MIGRATE_OUTPUT=$(npx prisma migrate status 2>&1) || true

echo "$MIGRATE_OUTPUT"
echo

# Check for drift indicators
if echo "$MIGRATE_OUTPUT" | grep -qi "drift detected"; then
  echo
  echo "=========================================="
  echo "DRIFT DETECTED"
  echo "=========================================="
  echo
  echo "Next steps:"
  echo "1. Review the drift details above"
  echo "2. If safe, run: PRISMA_RESET_CONSENT=yes scripts/ops/db/reset_dev_db.sh"
  echo "3. See docs/runbooks/prisma-dev-db-reset.md for full procedure"
  exit 1
fi

if echo "$MIGRATE_OUTPUT" | grep -qi "database schema is not in sync"; then
  echo
  echo "=========================================="
  echo "SCHEMA OUT OF SYNC"
  echo "=========================================="
  echo
  echo "Next steps:"
  echo "1. Run: PRISMA_RESET_CONSENT=yes scripts/ops/db/reset_dev_db.sh"
  echo "2. See docs/runbooks/prisma-dev-db-reset.md for full procedure"
  exit 1
fi

if echo "$MIGRATE_OUTPUT" | grep -qi "pending migration"; then
  echo
  echo "=========================================="
  echo "PENDING MIGRATIONS"
  echo "=========================================="
  echo
  echo "Next steps:"
  echo "1. Run: npx prisma migrate dev"
  echo "2. Or if issues persist: PRISMA_RESET_CONSENT=yes scripts/ops/db/reset_dev_db.sh"
  exit 0
fi

echo "=========================================="
echo "NO DRIFT DETECTED"
echo "=========================================="
echo "Database schema is in sync with migrations."
