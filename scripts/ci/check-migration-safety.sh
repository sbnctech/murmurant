#!/usr/bin/env bash
#
# Migration Safety Check Script
#
# Charter Principles:
# - P2: Default deny - dangerous patterns are blocked unless explicitly approved
# - P7: Observability - clear output about what was checked and why
# - P9: Fail closed - if the check encounters errors, it fails
#
# This script scans Prisma migration files for dangerous patterns:
# - DROP TABLE
# - DROP COLUMN
# - UPDATE without WHERE
# - DELETE without WHERE
#
# Patterns can be approved by adding a comment on the SAME LINE:
#   -- MIGRATION_APPROVED: <reason>
#
# Example:
#   DROP TABLE "old_table"; -- MIGRATION_APPROVED: cleanup of deprecated table per RFC-123
#

set -uo pipefail

MIGRATIONS_DIR="${1:-prisma/migrations}"
EXIT_CODE=0
CHECKED_COUNT=0
VIOLATION_COUNT=0

# Colors for output (if terminal supports it)
if [[ -t 1 ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  NC='\033[0m' # No Color
else
  RED=''
  GREEN=''
  YELLOW=''
  NC=''
fi

echo "== Migration Safety Check =="
echo "Directory: ${MIGRATIONS_DIR}"
echo

# Charter P9: Fail closed - if migrations directory doesn't exist, that's OK (new repo)
if [[ ! -d "${MIGRATIONS_DIR}" ]]; then
  echo -e "${YELLOW}INFO: No migrations directory found at ${MIGRATIONS_DIR}${NC}"
  echo "RESULT: PASS (no migrations to check)"
  exit 0
fi

# Find all SQL migration files
migration_files=()
while IFS= read -r -d '' file; do
  migration_files+=("$file")
done < <(find "${MIGRATIONS_DIR}" -name "*.sql" -type f -print0 2>/dev/null | sort -z)

if [[ ${#migration_files[@]} -eq 0 ]]; then
  echo -e "${YELLOW}INFO: No .sql files found in ${MIGRATIONS_DIR}${NC}"
  echo "RESULT: PASS (no migrations to check)"
  exit 0
fi

echo "Found ${#migration_files[@]} migration file(s) to check"
echo

# Check each migration file
for file in "${migration_files[@]}"; do
  ((CHECKED_COUNT++))

  # Charter P9: Fail closed on file read errors
  if [[ ! -r "${file}" ]]; then
    echo -e "${RED}ERROR: Cannot read file: ${file}${NC}"
    EXIT_CODE=1
    continue
  fi

  line_number=0

  while IFS= read -r line || [[ -n "$line" ]]; do
    ((line_number++))

    # Skip empty lines and pure comments
    if [[ -z "${line// }" ]] || [[ "${line}" =~ ^[[:space:]]*-- ]]; then
      continue
    fi

    # Normalize line for pattern matching (uppercase, collapse whitespace)
    normalized=$(echo "$line" | tr '[:lower:]' '[:upper:]' | tr -s '[:space:]' ' ')

    # Check if line has MIGRATION_APPROVED annotation
    is_approved=0
    if [[ "${line}" =~ MIGRATION_APPROVED ]]; then
      is_approved=1
    fi

    # Pattern 1: DROP TABLE
    if [[ "${normalized}" =~ DROP[[:space:]]+TABLE ]]; then
      if [[ ${is_approved} -eq 0 ]]; then
        echo -e "${RED}VIOLATION${NC} ${file}:${line_number}"
        echo "  Pattern: DROP TABLE (destructive - data loss)"
        echo "  Line: ${line}"
        echo "  Fix: Add '-- MIGRATION_APPROVED: <reason>' to the same line"
        echo
        ((VIOLATION_COUNT++))
        EXIT_CODE=1
      else
        echo -e "${YELLOW}APPROVED${NC} ${file}:${line_number} - DROP TABLE"
      fi
    fi

    # Pattern 2: DROP COLUMN (ALTER TABLE ... DROP COLUMN or DROP "column")
    if [[ "${normalized}" =~ DROP[[:space:]]+COLUMN ]] || \
       [[ "${normalized}" =~ ALTER.*DROP[[:space:]]+\"[^\"]+\" ]]; then
      if [[ ${is_approved} -eq 0 ]]; then
        echo -e "${RED}VIOLATION${NC} ${file}:${line_number}"
        echo "  Pattern: DROP COLUMN (destructive - data loss)"
        echo "  Line: ${line}"
        echo "  Fix: Add '-- MIGRATION_APPROVED: <reason>' to the same line"
        echo
        ((VIOLATION_COUNT++))
        EXIT_CODE=1
      else
        echo -e "${YELLOW}APPROVED${NC} ${file}:${line_number} - DROP COLUMN"
      fi
    fi

    # Pattern 3: UPDATE without WHERE (only if it's the main statement, not part of other SQL)
    if [[ "${normalized}" =~ ^[[:space:]]*UPDATE[[:space:]] ]]; then
      # Check if there's a WHERE clause (could be on same line or we check naively)
      if [[ ! "${normalized}" =~ WHERE ]]; then
        if [[ ${is_approved} -eq 0 ]]; then
          echo -e "${RED}VIOLATION${NC} ${file}:${line_number}"
          echo "  Pattern: UPDATE without WHERE (affects all rows)"
          echo "  Line: ${line}"
          echo "  Fix: Add WHERE clause or '-- MIGRATION_APPROVED: <reason>'"
          echo
          ((VIOLATION_COUNT++))
          EXIT_CODE=1
        else
          echo -e "${YELLOW}APPROVED${NC} ${file}:${line_number} - UPDATE without WHERE"
        fi
      fi
    fi

    # Pattern 4: DELETE without WHERE
    if [[ "${normalized}" =~ ^[[:space:]]*DELETE[[:space:]] ]]; then
      if [[ ! "${normalized}" =~ WHERE ]]; then
        if [[ ${is_approved} -eq 0 ]]; then
          echo -e "${RED}VIOLATION${NC} ${file}:${line_number}"
          echo "  Pattern: DELETE without WHERE (deletes all rows)"
          echo "  Line: ${line}"
          echo "  Fix: Add WHERE clause or '-- MIGRATION_APPROVED: <reason>'"
          echo
          ((VIOLATION_COUNT++))
          EXIT_CODE=1
        else
          echo -e "${YELLOW}APPROVED${NC} ${file}:${line_number} - DELETE without WHERE"
        fi
      fi
    fi

  done < "$file"
done

echo
echo "== Summary =="
echo "Files checked: ${CHECKED_COUNT}"
echo "Violations found: ${VIOLATION_COUNT}"
echo

if [[ ${EXIT_CODE} -eq 0 ]]; then
  echo -e "${GREEN}RESULT: PASS${NC}"
else
  echo -e "${RED}RESULT: FAIL${NC}"
  echo
  echo "To approve a destructive migration, add a comment on the same line:"
  echo "  DROP TABLE \"old_table\"; -- MIGRATION_APPROVED: reason here"
  echo
  echo "See docs/OPS/migrations.md for safe migration practices."
fi

exit ${EXIT_CODE}
