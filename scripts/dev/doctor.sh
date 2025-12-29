#!/bin/zsh
#
# doctor.sh - Environment validation for Murmurant development
# macOS/zsh compatible, ASCII only
#
# Checks that all required tools and files are present
# before running the development environment.
#

SCRIPT_DIR="${0:A:h}"
PROJECT_ROOT="${SCRIPT_DIR}/../.."

echo "=== Murmurant Environment Doctor ==="
echo ""

cd "${PROJECT_ROOT}"

# Track failures
FAILURES=0

# Helper function to print pass/fail
check_pass() {
    echo "[PASS] $1"
}

check_fail() {
    echo "[FAIL] $1"
    FAILURES=$((FAILURES + 1))
}

# Check: Node.js exists and version >= 18
echo "Checking Node.js..."
if command -v node > /dev/null 2>&1; then
    NODE_VERSION=$(node --version | sed 's/v//')
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
    if [ "$NODE_MAJOR" -ge 18 ]; then
        check_pass "Node.js v${NODE_VERSION} (>= 18 required)"
    else
        check_fail "Node.js v${NODE_VERSION} is too old (>= 18 required)"
    fi
else
    check_fail "Node.js not found"
fi

# Check: npm exists
echo "Checking npm..."
if command -v npm > /dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    check_pass "npm v${NPM_VERSION}"
else
    check_fail "npm not found"
fi

# Check: npx exists
echo "Checking npx..."
if command -v npx > /dev/null 2>&1; then
    NPX_VERSION=$(npx --version)
    check_pass "npx v${NPX_VERSION}"
else
    check_fail "npx not found"
fi

# Check: Playwright installed
echo "Checking Playwright..."
if npx playwright --version > /dev/null 2>&1; then
    PW_VERSION=$(npx playwright --version 2>/dev/null)
    check_pass "Playwright ${PW_VERSION}"
else
    check_fail "Playwright not installed (run: npm install)"
fi

# Check: TypeScript available
echo "Checking TypeScript..."
if npx tsc --version > /dev/null 2>&1; then
    TSC_VERSION=$(npx tsc --version 2>/dev/null)
    check_pass "TypeScript ${TSC_VERSION}"
else
    check_fail "TypeScript not available (run: npm install)"
fi

# Check: .env file exists
echo "Checking .env file..."
if [ -f ".env" ]; then
    check_pass ".env file exists"
else
    check_fail ".env file missing (copy from .env.example if available)"
fi

# Check: node_modules exists
echo "Checking node_modules..."
if [ -d "node_modules" ]; then
    check_pass "node_modules directory exists"
else
    check_fail "node_modules missing (run: npm install)"
fi

# Summary
echo ""
echo "=============================="
if [ "$FAILURES" -eq 0 ]; then
    echo "All checks passed! Environment is ready."
    echo ""
    echo "Run 'make dev' to start the development server."
    exit 0
else
    echo "Found ${FAILURES} issue(s) that need attention."
    echo ""
    echo "Common fixes:"
    echo "  - Install Node.js 18+: https://nodejs.org/"
    echo "  - Install dependencies: npm install"
    echo "  - Create .env file: cp .env.example .env"
    exit 1
fi
