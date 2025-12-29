#!/bin/bash
# prisma-verify.sh
# Safe read-only Prisma checks. Does NOT modify the database.

set -e

echo "Murmurant Prisma Verification"
echo "=========================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "[ERROR] DATABASE_URL is not set."
    echo "Set it with: export DATABASE_URL='postgresql://...'"
    exit 1
fi

# Mask the connection string for display
MASKED_URL=$(echo "$DATABASE_URL" | sed 's/:\/\/[^:]*:[^@]*@/:\/\/***:***@/')
echo "Database: $MASKED_URL"
echo ""

# Check migration status
echo "Migration Status:"
echo "-----------------"
npx prisma migrate status 2>&1 || {
    echo "[ERROR] Failed to check migration status"
    exit 1
}

echo ""
echo "Schema Validation:"
echo "------------------"
npx prisma validate 2>&1 && echo "[OK] Schema is valid" || {
    echo "[ERROR] Schema validation failed"
    exit 1
}

echo ""
echo "Prisma Client Status:"
echo "---------------------"
if [ -d "node_modules/.prisma/client" ]; then
    echo "[OK] Prisma client is generated"
else
    echo "[!!] Prisma client not found. Run: npx prisma generate"
fi

echo ""
echo "Done. All checks are read-only."
