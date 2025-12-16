#!/usr/bin/env bash
# =============================================================================
# CI Route Audit Logging Coverage Check
# Charter P7: Observability is a product feature
# Charter N5: Never let automation mutate data without audit logs
#
# This script scans privileged mutation routes and verifies they call audit
# logging functions (auditMutation, createAuditEntry, createAuditLog).
#
# NOTE: This script ONLY checks a limited set of sensitive routes that are
# explicitly listed in SENSITIVE_ROUTES. Routes not in this list are not
# checked to allow incremental audit coverage.
#
# Exit codes:
#   0 - All sensitive routes have audit logging
#   1 - One or more sensitive routes missing audit logging
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Configuration
ROUTES_DIR="src/app/api"

# Sensitive routes that MUST have audit logging
# These are privileged mutation endpoints that affect security-sensitive data.
# Add new sensitive routes here when they are implemented.
SENSITIVE_ROUTES=(
  # Transition management (role changes, user permissions)
  "v1/admin/transitions/route.ts"
  "v1/admin/transitions/[id]/route.ts"
  "v1/admin/transitions/[id]/approve/route.ts"
  "v1/admin/transitions/[id]/submit/route.ts"
  "v1/admin/transitions/[id]/cancel/route.ts"
  "v1/admin/transitions/[id]/apply/route.ts"
  "v1/admin/transitions/[id]/assignments/route.ts"
  "v1/admin/transitions/[id]/assignments/[aid]/route.ts"

  # Service history (member records)
  "v1/admin/service-history/route.ts"
  "v1/admin/service-history/[id]/close/route.ts"

  # Officer management (meetings, board records)
  "v1/officer/meetings/route.ts"
  "v1/officer/meetings/[id]/route.ts"
  "v1/officer/board-records/route.ts"
  "v1/officer/board-records/[id]/route.ts"

  # Governance (flags - compliance/audit items)
  "v1/officer/governance/flags/route.ts"
  "v1/officer/governance/flags/[id]/route.ts"

  # Publishing (pages have audit via createAuditLog)
  "admin/content/pages/[id]/route.ts"
)

# Audit patterns to search for
# Includes all audit logging functions
AUDIT_PATTERNS="auditMutation|createAuditEntry|createAuditLog"

echo "============================================="
echo "CI Route Audit Logging Coverage Check"
echo "============================================="
echo ""

TOTAL_ROUTES=${#SENSITIVE_ROUTES[@]}
MISSING_AUDIT=0
CHECKED_COUNT=0
MISSING_FILES=()

# Process each sensitive route
for route_pattern in "${SENSITIVE_ROUTES[@]}"; do
  file="$ROUTES_DIR/$route_pattern"

  if [[ ! -f "$file" ]]; then
    echo -e "${YELLOW}[NOT FOUND]${NC} $file"
    continue
  fi

  CHECKED_COUNT=$((CHECKED_COUNT + 1))

  # Check if file contains audit logging calls
  if grep -qE "$AUDIT_PATTERNS" "$file"; then
    echo -e "${GREEN}[OK]${NC} $file"
  else
    echo -e "${RED}[MISSING]${NC} $file"
    MISSING_AUDIT=$((MISSING_AUDIT + 1))
    MISSING_FILES+=("$file")
  fi
done

echo ""
echo "============================================="
echo "Summary"
echo "============================================="
echo "Sensitive routes defined: $TOTAL_ROUTES"
echo "Routes checked:           $CHECKED_COUNT"
echo "Routes with audit:        $((CHECKED_COUNT - MISSING_AUDIT))"
echo -e "Missing audit:            ${MISSING_AUDIT}"

if [[ $MISSING_AUDIT -gt 0 ]]; then
  echo ""
  echo -e "${RED}ERROR: The following sensitive routes are missing audit logging:${NC}"
  for file in "${MISSING_FILES[@]}"; do
    echo "  - $file"
  done
  echo ""
  echo "Each privileged mutation route MUST call one of these functions:"
  echo "  - auditMutation(req, auth.context, {...}) - Canonical audit helper"
  echo "  - createAuditEntry({...})                 - Core audit function"
  echo "  - createAuditLog({...})                   - Publishing audit helper"
  echo ""
  echo "Reference: Charter P7 (Observability) and N5 (No mutation without audit)"
  echo ""
  exit 1
fi

echo ""
echo -e "${GREEN}All sensitive routes have proper audit logging coverage.${NC}"
exit 0
