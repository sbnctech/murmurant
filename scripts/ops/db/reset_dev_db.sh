#!/usr/bin/env bash
# Reset local dev database (DESTRUCTIVE)
# Requires explicit consent via environment variable.

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

echo "=== LOCAL DEV DB RESET ==="
echo "This is a DESTRUCTIVE operation."
echo

# Safety check 1: Require explicit consent
if [[ "${PRISMA_RESET_CONSENT:-}" != "yes" ]]; then
  echo "ERROR: This script requires explicit consent."
  echo
  echo "To proceed, run:"
  echo "  PRISMA_RESET_CONSENT=yes $0"
  echo
  echo "See docs/runbooks/prisma-dev-db-reset.md for full procedure."
  exit 2
fi

# Safety check 2: Verify localhost target
if [[ "${DATABASE_URL:-}" != *"localhost"* && "${DATABASE_URL:-}" != *"127.0.0.1"* ]]; then
  echo "ERROR: DATABASE_URL does not point to localhost."
  echo "This script is for LOCAL DEV ONLY."
  echo "Current DATABASE_URL: ${DATABASE_URL:-<not set>}"
  echo
  echo "REFUSING TO PROCEED - this may be a production database."
  exit 1
fi

echo "Safety checks passed:"
echo "  - Consent: PRISMA_RESET_CONSENT=yes"
echo "  - Target: localhost (local dev)"
echo

echo "Proceeding with reset in 3 seconds..."
echo "(Press Ctrl+C to abort)"
sleep 3

echo
echo "[1/4] Resetting database..."
npx prisma migrate reset --force

echo
echo "[2/4] Applying migrations..."
npx prisma migrate dev

echo
echo "[3/4] Regenerating Prisma client..."
npx prisma generate

echo
echo "[4/4] Running seed (if available)..."
if npm run --silent 2>/dev/null | grep -qE "^\s*db:seed$"; then
  npm run db:seed
  echo "Seed completed."
else
  echo "No db:seed script found, skipping."
fi

echo
echo "=========================================="
echo "DEV DB RESET COMPLETE"
echo "=========================================="
echo
echo "Next steps:"
echo "1. Run: npm run typecheck"
echo "2. Run: npm run test-admin (or relevant tests)"
