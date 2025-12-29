#!/usr/bin/env bash
#
# Backup Health Check Script
#
# Verifies Neon database backup configuration and status.
# Exit codes:
#   0 - All checks passed
#   1 - One or more checks failed
#   2 - Script error (missing dependencies, etc.)
#
# Usage:
#   ./scripts/ops/health-checks/backup-health.sh
#
# Environment:
#   DATABASE_URL - PostgreSQL connection string
#   NEON_PROJECT_ID - Neon project ID (optional, for CLI operations)
#   NEON_API_KEY - Neon API key (optional, for detailed checks)
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "============================================================"
echo "  Murmurant Backup Health Check"
echo "============================================================"
echo ""

OVERALL_STATUS="ok"
WARNINGS=()
ERRORS=()

# Check database connection
echo "Checking database configuration..."
echo ""

if [[ -n "${DATABASE_URL:-}" ]]; then
    echo -e "${GREEN}[OK]${NC} DATABASE_URL is set"

    # Check if it's a Neon database
    if [[ "$DATABASE_URL" == *"neon.tech"* ]]; then
        echo -e "${GREEN}[OK]${NC} Database hosted on Neon (automatic PITR enabled)"
        IS_NEON=true
    else
        echo -e "${YELLOW}[INFO]${NC} Database not on Neon; manual backup strategy required"
        IS_NEON=false
    fi
else
    echo -e "${RED}[FAIL]${NC} DATABASE_URL is not set"
    ERRORS+=("DATABASE_URL not configured")
    OVERALL_STATUS="fail"
    IS_NEON=false
fi

echo ""

# Check database connectivity
echo "Testing database connectivity..."

if [[ -n "${DATABASE_URL:-}" ]] && command -v psql &> /dev/null; then
    if psql "${DATABASE_URL}" -c "SELECT 1;" &> /dev/null; then
        echo -e "${GREEN}[OK]${NC} Database connection successful"

        # Get database size
        DB_SIZE=$(psql "${DATABASE_URL}" -t -c "SELECT pg_size_pretty(pg_database_size(current_database()));" 2>/dev/null | tr -d ' ' || echo "unknown")
        echo -e "${GREEN}[OK]${NC} Database size: ${DB_SIZE}"

        # Get table count
        TABLE_COUNT=$(psql "${DATABASE_URL}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "unknown")
        echo -e "${GREEN}[OK]${NC} Table count: ${TABLE_COUNT}"
    else
        echo -e "${RED}[FAIL]${NC} Database connection failed"
        ERRORS+=("Cannot connect to database")
        OVERALL_STATUS="fail"
    fi
elif [[ -z "${DATABASE_URL:-}" ]]; then
    echo -e "${YELLOW}[SKIP]${NC} No DATABASE_URL; skipping connectivity test"
else
    echo -e "${YELLOW}[SKIP]${NC} psql not available; skipping connectivity test"
fi

echo ""

# Check Neon CLI availability and configuration
echo "Checking Neon CLI configuration..."

if command -v neonctl &> /dev/null; then
    echo -e "${GREEN}[OK]${NC} neonctl CLI is installed"

    # Check if authenticated
    if neonctl me &> /dev/null; then
        echo -e "${GREEN}[OK]${NC} neonctl is authenticated"
        NEON_CLI_READY=true
    else
        echo -e "${YELLOW}[WARN]${NC} neonctl not authenticated (run: neonctl auth)"
        WARNINGS+=("Neon CLI not authenticated")
        NEON_CLI_READY=false
    fi
else
    echo -e "${YELLOW}[INFO]${NC} neonctl CLI not installed (optional)"
    echo "       Install with: npm install -g neonctl"
    NEON_CLI_READY=false
fi

# Check project ID
if [[ -n "${NEON_PROJECT_ID:-}" ]]; then
    echo -e "${GREEN}[OK]${NC} NEON_PROJECT_ID: ${NEON_PROJECT_ID}"
else
    echo -e "${YELLOW}[INFO]${NC} NEON_PROJECT_ID not set (optional for CLI operations)"
fi

echo ""

# Neon-specific checks
if [[ "$NEON_CLI_READY" == true && -n "${NEON_PROJECT_ID:-}" ]]; then
    echo "Checking Neon project status..."

    # Get project details
    PROJECT_INFO=$(neonctl projects get "${NEON_PROJECT_ID}" --output json 2>/dev/null || echo "{}")

    if [[ -n "$PROJECT_INFO" && "$PROJECT_INFO" != "{}" ]]; then
        if command -v jq &> /dev/null; then
            # Get retention period
            RETENTION=$(echo "$PROJECT_INFO" | jq -r '.history_retention_seconds // 0')
            RETENTION_HOURS=$((RETENTION / 3600))
            RETENTION_DAYS=$((RETENTION_HOURS / 24))

            if [[ $RETENTION_DAYS -ge 7 ]]; then
                echo -e "${GREEN}[OK]${NC} PITR retention: ${RETENTION_DAYS} days"
            elif [[ $RETENTION_HOURS -ge 24 ]]; then
                echo -e "${YELLOW}[WARN]${NC} PITR retention: ${RETENTION_HOURS} hours (consider Pro plan for 7 days)"
                WARNINGS+=("Limited PITR retention window")
            else
                echo -e "${YELLOW}[WARN]${NC} PITR retention: ${RETENTION_HOURS} hours"
                WARNINGS+=("Very limited PITR retention")
            fi

            # Count branches
            BRANCHES=$(neonctl branches list --project-id "${NEON_PROJECT_ID}" --output json 2>/dev/null || echo "[]")
            BRANCH_COUNT=$(echo "$BRANCHES" | jq 'length')
            echo -e "${GREEN}[OK]${NC} Branch count: ${BRANCH_COUNT}"
        else
            echo -e "${YELLOW}[SKIP]${NC} jq not available; skipping detailed project analysis"
        fi
    else
        echo -e "${YELLOW}[WARN]${NC} Could not fetch Neon project details"
        WARNINGS+=("Could not verify Neon project status")
    fi
    echo ""
fi

# Check last restore drill
echo "Checking restore drill status..."
DRILL_DIR="/Users/edf/murmurant/docs/OPS/drills"

if [[ -d "$DRILL_DIR" ]]; then
    LATEST_DRILL=$(ls -1t "$DRILL_DIR"/*restore-drill*.md 2>/dev/null | head -1 || echo "")
    if [[ -n "$LATEST_DRILL" ]]; then
        DRILL_DATE=$(stat -f "%Sm" -t "%Y-%m-%d" "$LATEST_DRILL" 2>/dev/null || echo "unknown")
        echo -e "${GREEN}[OK]${NC} Last restore drill: ${DRILL_DATE}"
        echo "       File: $(basename "$LATEST_DRILL")"
    else
        echo -e "${YELLOW}[WARN]${NC} No restore drill documentation found"
        WARNINGS+=("No restore drill records found")
    fi
else
    echo -e "${YELLOW}[INFO]${NC} Drill documentation directory not found"
    echo "       Create: mkdir -p ${DRILL_DIR}"
fi

echo ""

# Summary
echo "============================================================"
echo ""

if [[ "$IS_NEON" == true ]]; then
    echo "Backup Strategy: Neon PITR (automatic)"
else
    echo "Backup Strategy: Manual (review backup-health.sh)"
fi

echo ""

if [[ ${#ERRORS[@]} -gt 0 ]]; then
    echo "Errors:"
    for err in "${ERRORS[@]}"; do
        echo "  - ${err}"
    done
    echo ""
fi

if [[ ${#WARNINGS[@]} -gt 0 ]]; then
    echo "Warnings:"
    for warn in "${WARNINGS[@]}"; do
        echo "  - ${warn}"
    done
    echo ""
fi

echo "============================================================"

# Final status
if [[ "$OVERALL_STATUS" == "ok" && ${#WARNINGS[@]} -eq 0 ]]; then
    echo -e "  ${GREEN}Backup Health Check PASSED${NC}"
    echo "============================================================"
    echo ""
    exit 0
elif [[ "$OVERALL_STATUS" == "ok" ]]; then
    echo -e "  ${YELLOW}Backup Health Check PASSED WITH WARNINGS${NC}"
    echo "============================================================"
    echo ""
    echo "Recommendations:"
    echo "  1. Configure NEON_PROJECT_ID for CLI operations"
    echo "  2. Authenticate neonctl: neonctl auth"
    echo "  3. Schedule quarterly restore drills"
    echo "  4. Consider Neon Pro plan for 7-day PITR retention"
    echo ""
    echo "See: docs/OPS/runbooks/BACKUPS_RUNBOOK.md"
    echo ""
    exit 0
else
    echo -e "  ${RED}Backup Health Check FAILED${NC}"
    echo "============================================================"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Verify DATABASE_URL is correctly configured"
    echo "  2. Check database connectivity"
    echo "  3. Install neonctl for backup management: npm i -g neonctl"
    echo ""
    echo "See: docs/OPS/runbooks/BACKUPS_RUNBOOK.md"
    echo ""
    exit 1
fi
