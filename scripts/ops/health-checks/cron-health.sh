#!/usr/bin/env bash
#
# Cron Health Check Script
#
# Verifies cron job system status via health endpoint.
# Exit codes:
#   0 - All checks passed
#   1 - One or more checks failed
#   2 - Script error (missing dependencies, etc.)
#
# Usage:
#   ./scripts/ops/health-checks/cron-health.sh [BASE_URL]
#
# Environment:
#   BASE_URL - Application base URL (default: http://localhost:3000)
#   ADMIN_TOKEN - Optional token for detailed checks
#

set -euo pipefail

# Configuration
BASE_URL="${1:-${BASE_URL:-http://localhost:3000}}"
HEALTH_ENDPOINT="${BASE_URL}/api/health/cron"
TIMEOUT=10

# Thresholds
MAX_DUE_TRANSITIONS=0          # Alert if any transitions are due
MAX_HOURS_SINCE_CRON=2         # Alert if cron hasn't run in 2 hours

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "============================================================"
echo "  Murmurant Cron Health Check"
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

# Build request headers
CURL_HEADERS=""
if [[ -n "${ADMIN_TOKEN:-}" ]]; then
    CURL_HEADERS="-H \"Authorization: Bearer ${ADMIN_TOKEN}\""
    echo "Using admin token for detailed checks"
    echo ""
fi

# Fetch health status
echo "Fetching cron health status..."
echo ""

if [[ -n "${ADMIN_TOKEN:-}" ]]; then
    HTTP_RESPONSE=$(curl -s -w "\n%{http_code}" --max-time "${TIMEOUT}" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        "${HEALTH_ENDPOINT}" 2>&1) || {
        echo -e "${RED}[FAIL]${NC} Could not connect to ${HEALTH_ENDPOINT}"
        exit 1
    }
else
    HTTP_RESPONSE=$(curl -s -w "\n%{http_code}" --max-time "${TIMEOUT}" \
        "${HEALTH_ENDPOINT}" 2>&1) || {
        echo -e "${RED}[FAIL]${NC} Could not connect to ${HEALTH_ENDPOINT}"
        exit 1
    }
fi

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
OVERALL_STATUS="ok"

if [[ "$JQ_AVAILABLE" == true ]]; then
    STATUS=$(echo "$HTTP_BODY" | jq -r '.status // "unknown"')

    echo ""
    echo "Response:"
    echo "$HTTP_BODY" | jq .
    echo ""

    # Check individual components
    echo "Component Status:"

    # CRON_SECRET configured
    CRON_SECRET=$(echo "$HTTP_BODY" | jq -r '.checks.cronSecretConfigured.status // "unknown"')
    if [[ "$CRON_SECRET" == "ok" ]]; then
        echo -e "  ${GREEN}[OK]${NC} Cron Secret Configured"
    else
        echo -e "  ${RED}[FAIL]${NC} Cron Secret Configured: ${CRON_SECRET}"
        OVERALL_STATUS="fail"
    fi

    # Due transitions count
    DUE_COUNT=$(echo "$HTTP_BODY" | jq -r '.checks.dueTransitionsCount // 0')
    if [[ "$DUE_COUNT" -le "$MAX_DUE_TRANSITIONS" ]]; then
        echo -e "  ${GREEN}[OK]${NC} Due Transitions: ${DUE_COUNT}"
    else
        echo -e "  ${YELLOW}[WARN]${NC} Due Transitions: ${DUE_COUNT} (should be 0)"
        OVERALL_STATUS="warn"
    fi

    # Last cron run
    LAST_RUN=$(echo "$HTTP_BODY" | jq -r '.checks.lastCronRun // "never"')
    if [[ "$LAST_RUN" != "never" && "$LAST_RUN" != "null" ]]; then
        echo -e "  ${GREEN}[OK]${NC} Last Cron Run: ${LAST_RUN}"
    else
        echo -e "  ${YELLOW}[WARN]${NC} Last Cron Run: ${LAST_RUN}"
    fi

    # Alert field
    ALERT=$(echo "$HTTP_BODY" | jq -r '.checks.alert // ""')
    if [[ -n "$ALERT" && "$ALERT" != "null" ]]; then
        echo -e "  ${YELLOW}[ALERT]${NC} ${ALERT}"
        OVERALL_STATUS="warn"
    fi
else
    echo ""
    echo "Response:"
    echo "$HTTP_BODY"
fi

echo ""
echo "============================================================"

# Final status
if [[ "$HTTP_CODE" == "200" && "$OVERALL_STATUS" == "ok" ]]; then
    echo -e "  ${GREEN}Cron Health Check PASSED${NC}"
    echo "============================================================"
    echo ""
    exit 0
elif [[ "$OVERALL_STATUS" == "warn" ]]; then
    echo -e "  ${YELLOW}Cron Health Check PASSED WITH WARNINGS${NC}"
    echo "============================================================"
    echo ""
    echo "Recommendations:"
    echo "  1. Check for pending transitions that need processing"
    echo "  2. Verify cron job is scheduled in hosting platform"
    echo "  3. Manually trigger cron if needed:"
    echo "     curl -X POST -H 'Authorization: Bearer \$CRON_SECRET' \\"
    echo "       ${BASE_URL}/api/cron/transitions"
    echo ""
    echo "See: docs/OPS/runbooks/CRON_RUNBOOK.md"
    echo ""
    exit 0
else
    echo -e "  ${RED}Cron Health Check FAILED${NC}"
    echo "============================================================"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check CRON_SECRET environment variable is set"
    echo "  2. Verify cron job is configured in hosting platform"
    echo "  3. Check application logs for cron execution errors"
    echo ""
    echo "See: docs/OPS/runbooks/CRON_RUNBOOK.md"
    echo ""
    exit 1
fi
