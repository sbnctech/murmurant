#!/usr/bin/env bash
#
# Auth Health Check Script
#
# Verifies authentication system status via health endpoint.
# Exit codes:
#   0 - All checks passed
#   1 - One or more checks failed
#   2 - Script error (missing dependencies, etc.)
#
# Usage:
#   ./scripts/ops/health-checks/auth-health.sh [BASE_URL]
#
# Environment:
#   BASE_URL - Application base URL (default: http://localhost:3000)
#   ADMIN_TOKEN - Optional token for detailed checks
#

set -euo pipefail

# Configuration
BASE_URL="${1:-${BASE_URL:-http://localhost:3000}}"
HEALTH_ENDPOINT="${BASE_URL}/api/health/auth"
TIMEOUT=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "============================================================"
echo "  ClubOS Auth Health Check"
echo "============================================================"
echo ""
echo "Target: ${HEALTH_ENDPOINT}"
echo ""

# Check for required tools
if ! command -v curl &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} curl is required but not installed"
    exit 2
fi

if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}[WARN]${NC} jq not installed; output will not be formatted"
    JQ_AVAILABLE=false
else
    JQ_AVAILABLE=true
fi

# Fetch health status
echo "Fetching auth health status..."
echo ""

HTTP_RESPONSE=$(curl -s -w "\n%{http_code}" --max-time "${TIMEOUT}" "${HEALTH_ENDPOINT}" 2>&1) || {
    echo -e "${RED}[FAIL]${NC} Could not connect to ${HEALTH_ENDPOINT}"
    echo "       Check that the application is running and accessible."
    exit 1
}

# Parse response
HTTP_BODY=$(echo "$HTTP_RESPONSE" | sed '$d')
HTTP_CODE=$(echo "$HTTP_RESPONSE" | tail -n 1)

# Check HTTP status
if [[ "$HTTP_CODE" == "200" ]]; then
    echo -e "${GREEN}[OK]${NC} HTTP Status: ${HTTP_CODE}"
elif [[ "$HTTP_CODE" == "503" ]]; then
    echo -e "${RED}[FAIL]${NC} HTTP Status: ${HTTP_CODE} (Service Degraded)"
else
    echo -e "${RED}[FAIL]${NC} HTTP Status: ${HTTP_CODE}"
fi

# Parse JSON response
if [[ "$JQ_AVAILABLE" == true ]]; then
    STATUS=$(echo "$HTTP_BODY" | jq -r '.status // "unknown"')

    echo ""
    echo "Response:"
    echo "$HTTP_BODY" | jq .
    echo ""

    # Check individual components
    echo "Component Status:"

    AUTH_SECRET=$(echo "$HTTP_BODY" | jq -r '.checks.authSecretConfigured.status // "unknown"')
    if [[ "$AUTH_SECRET" == "ok" ]]; then
        echo -e "  ${GREEN}[OK]${NC} Auth Secret Configured"
    else
        echo -e "  ${RED}[FAIL]${NC} Auth Secret Configured: ${AUTH_SECRET}"
    fi

    DB_STATUS=$(echo "$HTTP_BODY" | jq -r '.checks.databaseConnectivity.status // "unknown"')
    DB_LATENCY=$(echo "$HTTP_BODY" | jq -r '.checks.databaseConnectivity.latencyMs // "?"')
    if [[ "$DB_STATUS" == "ok" ]]; then
        echo -e "  ${GREEN}[OK]${NC} Database Connectivity (${DB_LATENCY}ms)"
    else
        echo -e "  ${RED}[FAIL]${NC} Database Connectivity: ${DB_STATUS}"
    fi
else
    echo ""
    echo "Response:"
    echo "$HTTP_BODY"
fi

echo ""
echo "============================================================"

# Final status
if [[ "$HTTP_CODE" == "200" ]]; then
    echo -e "  ${GREEN}Auth Health Check PASSED${NC}"
    echo "============================================================"
    echo ""
    exit 0
else
    echo -e "  ${RED}Auth Health Check FAILED${NC}"
    echo "============================================================"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check AUTH_SECRET environment variable is set (32+ chars)"
    echo "  2. Verify DATABASE_URL is correct and database is accessible"
    echo "  3. Review application logs for detailed errors"
    echo ""
    echo "See: docs/OPS/runbooks/AUTH_RUNBOOK.md"
    echo ""
    exit 1
fi
