#!/usr/bin/env bash
# ClubOS Charter Compliance Audit Script
# Run this script to check for common charter violations
#
# Usage: ./scripts/audit_charter.sh
#
# Returns exit code 0 if no violations, 1 if violations found

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC_DIR="$PROJECT_ROOT/src"

RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

VIOLATION_COUNT=0
WARNING_COUNT=0

echo "========================================"
echo "ClubOS Charter Compliance Audit"
echo "========================================"
echo ""

# Function to report violations
report_violation() {
    local severity="$1"
    local principle="$2"
    local message="$3"
    local details="$4"

    if [ "$severity" = "CRITICAL" ] || [ "$severity" = "HIGH" ]; then
        echo -e "${RED}[$severity] $principle: $message${NC}"
        VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
    else
        echo -e "${YELLOW}[$severity] $principle: $message${NC}"
        WARNING_COUNT=$((WARNING_COUNT + 1))
    fi

    if [ -n "$details" ]; then
        echo "  $details"
    fi
    echo ""
}

# Check 1: Admin routes without authentication (P1, P2)
echo "Checking for admin routes without authentication..."
# Include event-specific auth functions from eventAuth.ts (requireVPOrAdmin, requireEventViewAccess, etc.)
UNAUTH_ROUTES=$(find "$SRC_DIR/app/api/admin" -name "route.ts" -exec grep -L "requireAuth\|requireCapability\|requireAdmin\|requireVPOrAdmin\|requireEventViewAccess\|requireEventEditAccess\|requireEventDeleteAccess" {} \; 2>/dev/null || true)

if [ -n "$UNAUTH_ROUTES" ]; then
    COUNT=$(echo "$UNAUTH_ROUTES" | wc -l | tr -d ' ')
    report_violation "CRITICAL" "P1/P2" "Found $COUNT admin routes without authentication" ""
    echo "$UNAUTH_ROUTES" | while read -r file; do
        echo "  - ${file#$PROJECT_ROOT/}"
    done
    echo ""
fi

# Check 2: Inline role checks (N2)
echo "Checking for inline role checks..."
# Exclude: auth.ts (centralized auth layer), eventAuth.ts (event authorization layer),
# approvals.ts (position-based approval authority), and test files
ROLE_CHECKS=$(grep -rn 'role\s*===\?\s*["'"'"']admin["'"'"']\|role\s*===\?\s*["'"'"']president["'"'"']\|role\s*===\?\s*["'"'"']vp-activities["'"'"']' "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "auth.ts" | grep -v "eventAuth.ts" | grep -v "approvals.ts" | grep -v "\.spec\." || true)

if [ -n "$ROLE_CHECKS" ]; then
    COUNT=$(echo "$ROLE_CHECKS" | wc -l | tr -d ' ')
    report_violation "HIGH" "N2" "Found $COUNT inline role checks (use capability checks instead)" ""
    echo "$ROLE_CHECKS" | head -10 | while read -r line; do
        echo "  $line"
    done
    if [ "$COUNT" -gt 10 ]; then
        echo "  ... and $((COUNT - 10)) more"
    fi
    echo ""
fi

# Check 3: Silent catch blocks (P7)
echo "Checking for silent catch blocks..."
SILENT_CATCH=$(grep -rn 'catch\s*{' "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null || true)

if [ -n "$SILENT_CATCH" ]; then
    COUNT=$(echo "$SILENT_CATCH" | wc -l | tr -d ' ')
    report_violation "MEDIUM" "P7" "Found $COUNT potential silent catch blocks" ""
    echo "$SILENT_CATCH" | head -10 | while read -r line; do
        echo "  $line"
    done
    if [ "$COUNT" -gt 10 ]; then
        echo "  ... and $((COUNT - 10)) more"
    fi
    echo ""
fi

# Check 4: Technical error messages (P6)
echo "Checking for technical error messages..."
TECH_ERRORS=$(grep -rn 'error:\s*["'"'"']Forbidden["'"'"']\|error:\s*["'"'"']500["'"'"']\|error:\s*["'"'"']Unauthorized["'"'"']' "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null || true)

if [ -n "$TECH_ERRORS" ]; then
    COUNT=$(echo "$TECH_ERRORS" | wc -l | tr -d ' ')
    report_violation "LOW" "P6" "Found $COUNT technical error messages (use human-friendly language)" ""
fi

# Check 5: Date operations without timezone utils (P4)
echo "Checking for unsafe date operations..."
UNSAFE_DATES=$(grep -rn 'new Date()\.get\(Day\|Month\|FullYear\|Hours\)\|toLocaleDateString\|toLocaleTimeString' "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null || true)

if [ -n "$UNSAFE_DATES" ]; then
    COUNT=$(echo "$UNSAFE_DATES" | wc -l | tr -d ' ')
    report_violation "MEDIUM" "P4" "Found $COUNT potentially unsafe date operations" ""
    echo "$UNSAFE_DATES" | head -5 | while read -r line; do
        echo "  $line"
    done
    echo ""
fi

# Check 6: Missing data-test-id on interactive elements (P10)
echo "Checking for buttons/inputs without data-test-id..."
MISSING_TESTID=$(grep -rn '<button\|<input\|<select' "$SRC_DIR" --include="*.tsx" 2>/dev/null | grep -v 'data-test-id' | head -10 || true)

if [ -n "$MISSING_TESTID" ]; then
    COUNT=$(echo "$MISSING_TESTID" | wc -l | tr -d ' ')
    if [ "$COUNT" -gt 0 ]; then
        report_violation "LOW" "P10" "Found interactive elements without data-test-id" ""
    fi
fi

# Check 7: isPublished boolean (P3)
echo "Checking for ad-hoc boolean flags..."
BOOL_FLAGS=$(grep -rn 'isPublished\s*[=!]=\|isActive\s*[=!]=\|isDraft\s*[=!]=' "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "prisma\|\.d\.ts\|status" | head -5 || true)

if [ -n "$BOOL_FLAGS" ]; then
    report_violation "LOW" "P3" "Found potential ad-hoc boolean flags (consider state machine)" ""
fi

# Summary
echo "========================================"
echo "Audit Summary"
echo "========================================"
echo ""

if [ "$VIOLATION_COUNT" -eq 0 ] && [ "$WARNING_COUNT" -eq 0 ]; then
    echo -e "${GREEN}No charter violations found.${NC}"
    exit 0
elif [ "$VIOLATION_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}Found $WARNING_COUNT warnings (no critical violations).${NC}"
    exit 0
else
    echo -e "${RED}Found $VIOLATION_COUNT violations and $WARNING_COUNT warnings.${NC}"
    echo ""
    echo "See AUDIT_REPORT.md for details."
    echo "See WORK_PLAN.md for remediation tasks."
    exit 1
fi
