#!/usr/bin/env bash
#
# Audit Coverage Check Script
#
# Charter References:
# - P1: Identity and authorization must be provable
# - P7: Observability is a product feature
# - P9: Security must fail closed
#
# Anti-patterns avoided:
# - N6: Never allow silent failures
# - N8: Never use ad-hoc logging
#
# This script scans privileged mutation routes to ensure they have audit logging.
# Privileged mutations = POST/PATCH/PUT/DELETE under admin/officer paths.
#
# Allowed patterns:
# - audit.log( - canonical audit API
# - withAudit( - audit wrapper
# - createAuditLog( - legacy audit function (for content routes)
#
# Waiver annotation (must be inside function body as first comment):
#   // AUDIT:WAIVE reason=<reason> owner=<owner> expires=YYYY-MM-DD

set -uo pipefail

# Configuration
ROUTES_DIR="${1:-src/app/api}"
EXIT_CODE=0
CHECKED_COUNT=0
VIOLATION_COUNT=0
WAIVED_COUNT=0

# Colors for output
if [[ -t 1 ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  CYAN='\033[0;36m'
  NC='\033[0m'
else
  RED=''
  GREEN=''
  YELLOW=''
  CYAN=''
  NC=''
fi

echo "== Audit Coverage Check =="
echo "Directory: ${ROUTES_DIR}"
echo

# Privileged paths that require audit logging
PRIVILEGED_PATTERNS=(
  "v1/admin"
  "v1/officer"
  "admin/content"
  "admin/comms"
)

# HTTP methods that are mutations
MUTATION_METHODS="POST|PUT|PATCH|DELETE"

# Patterns that indicate audit logging is present
AUDIT_PATTERNS="audit\.log\(|audit\.mutation\(|withAudit\(|createAuditLog\("

# Find all route.ts files in privileged paths
find_privileged_routes() {
  local routes=()
  for pattern in "${PRIVILEGED_PATTERNS[@]}"; do
    while IFS= read -r -d '' file; do
      routes+=("$file")
    done < <(find "${ROUTES_DIR}" -path "*/${pattern}/*" -name "route.ts" -print0 2>/dev/null)
  done
  printf '%s\n' "${routes[@]}" | sort -u
}

# Check if a file has mutation handlers
has_mutation_handlers() {
  local file="$1"
  grep -qE "export (async )?function (${MUTATION_METHODS})" "$file"
}

# Check if a file has audit logging
has_audit_logging() {
  local file="$1"
  grep -qE "${AUDIT_PATTERNS}" "$file"
}

# Check if a mutation method has a waiver
has_waiver() {
  local file="$1"
  local method="$2"
  # Look for waiver comment in the function body (within 10 lines after export)
  grep -A 10 "export.*function ${method}" "$file" | grep -qE "AUDIT:WAIVE.*reason=.*owner=.*expires="
}

# Check waiver expiration
is_waiver_expired() {
  local file="$1"
  local today
  today=$(date +%Y-%m-%d)

  # Extract expiration date from waiver
  local expires
  expires=$(grep -o "expires=[0-9-]*" "$file" | head -1 | cut -d= -f2)

  if [[ -n "$expires" && "$expires" < "$today" ]]; then
    return 0  # Expired
  fi
  return 1  # Not expired or no date found
}

# Get mutation methods from a file
get_mutation_methods() {
  local file="$1"
  grep -oE "export (async )?function (${MUTATION_METHODS})" "$file" | \
    grep -oE "(${MUTATION_METHODS})" | sort -u
}

# Main check logic
check_routes() {
  local routes
  routes=$(find_privileged_routes)

  if [[ -z "$routes" ]]; then
    echo -e "${YELLOW}INFO: No privileged routes found${NC}"
    return 0
  fi

  while IFS= read -r file; do
    [[ -z "$file" ]] && continue

    # Skip if no mutation handlers
    if ! has_mutation_handlers "$file"; then
      continue
    fi

    ((CHECKED_COUNT++))

    # Get relative path for cleaner output
    local rel_path="${file#${ROUTES_DIR}/}"

    # Check if file has audit logging
    if has_audit_logging "$file"; then
      echo -e "${GREEN}OK${NC} ${rel_path}"
      continue
    fi

    # No audit logging found - check for waivers per method
    local methods
    methods=$(get_mutation_methods "$file")
    local file_has_violation=0

    for method in $methods; do
      if has_waiver "$file" "$method"; then
        if is_waiver_expired "$file"; then
          echo -e "${RED}EXPIRED WAIVER${NC} ${rel_path}:${method}"
          echo "  The AUDIT:WAIVE annotation has expired. Add audit logging or renew the waiver."
          ((VIOLATION_COUNT++))
          file_has_violation=1
        else
          echo -e "${YELLOW}WAIVED${NC} ${rel_path}:${method}"
          ((WAIVED_COUNT++))
        fi
      else
        echo -e "${RED}VIOLATION${NC} ${rel_path}:${method}"
        echo "  No audit.log(), withAudit(), or createAuditLog() found"
        echo "  Fix: Add audit logging or add waiver annotation inside function:"
        echo "  // AUDIT:WAIVE reason=<reason> owner=<email> expires=YYYY-MM-DD"
        echo
        ((VIOLATION_COUNT++))
        file_has_violation=1
      fi
    done

    if [[ $file_has_violation -eq 1 ]]; then
      EXIT_CODE=1
    fi

  done <<< "$routes"
}

# Run the check
check_routes

echo
echo "== Summary =="
echo "Routes checked: ${CHECKED_COUNT}"
echo "Violations: ${VIOLATION_COUNT}"
echo "Waivers: ${WAIVED_COUNT}"
echo

if [[ ${EXIT_CODE} -eq 0 ]]; then
  echo -e "${GREEN}RESULT: PASS${NC}"
else
  echo -e "${RED}RESULT: FAIL${NC}"
  echo
  echo "All privileged mutation endpoints must have audit logging."
  echo "See docs/ARCHITECTURE/audit.md for implementation guide."
fi

exit ${EXIT_CODE}
