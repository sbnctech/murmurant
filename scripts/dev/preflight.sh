#!/bin/zsh
#
# preflight.sh - Run all checks before commit/push
# macOS/zsh compatible, ASCII only
#
# Runs: doctor, TypeScript, ESLint, API tests, admin tests
#

SCRIPT_DIR="${0:A:h}"
PROJECT_ROOT="${SCRIPT_DIR}/../.."
cd "$PROJECT_ROOT" || exit 1

echo "=== preflight.sh ==="
echo ""

# Step 1: Environment doctor
echo "[1/5] Running environment doctor..."
"${SCRIPT_DIR}/doctor.sh"
if [ $? -ne 0 ]; then
    echo ""
    echo "Preflight FAILED: Environment doctor found issues."
    exit 1
fi
echo ""

# Step 2: TypeScript typecheck
echo "[2/5] Running TypeScript typecheck..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo ""
    echo "Preflight FAILED: TypeScript errors found."
    exit 1
fi
echo "TypeScript: OK"
echo ""

# Step 3: ESLint
echo "[3/5] Running ESLint..."
# TODO: Reduce max-warnings to 0 after cleaning up unused imports
npx eslint . --max-warnings=65
if [ $? -ne 0 ]; then
    echo ""
    echo "Preflight FAILED: ESLint errors or warnings found."
    exit 1
fi
echo "ESLint: OK"
echo ""

# Step 4: API tests
echo "[4/5] Running API tests..."
npx playwright test tests/api
if [ $? -ne 0 ]; then
    echo ""
    echo "Preflight FAILED: API tests failed."
    exit 1
fi
echo ""

# Step 5: Admin tests
echo "[5/5] Running admin tests..."
npx playwright test tests/admin
if [ $? -ne 0 ]; then
    echo ""
    echo "Preflight FAILED: Admin tests failed."
    exit 1
fi
echo ""

# All passed
echo "========================================"
echo "All preflight checks passed."
echo "You are ready to commit and push."
echo "========================================"
exit 0
