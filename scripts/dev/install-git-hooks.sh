#!/bin/zsh
#
# install-git-hooks.sh - Install Git pre-push hook for green checks
# macOS/zsh compatible, ASCII only
#
# This installs a pre-push hook that runs "npm run green" before each push.
# The push will be blocked if any gate fails.
#

SCRIPT_DIR="${0:A:h}"
PROJECT_ROOT="${SCRIPT_DIR}/../.."
cd "$PROJECT_ROOT" || exit 1

echo "=== install-git-hooks.sh ==="
echo ""

# Verify this is a Git repo
if [ ! -d ".git" ]; then
    echo "[ERROR] .git directory not found. Are you inside a Git clone?"
    exit 1
fi

HOOK_PATH=".git/hooks/pre-push"

# Handle existing pre-push hook
if [ -e "$HOOK_PATH" ]; then
    if [ ! -f "$HOOK_PATH" ]; then
        echo "[ERROR] $HOOK_PATH exists but is not a regular file."
        exit 1
    fi
    # Backup existing hook
    cp "$HOOK_PATH" "${HOOK_PATH}.backup"
    echo "Backed up existing pre-push hook to ${HOOK_PATH}.backup"
fi

# Write new pre-push hook
cat > "$HOOK_PATH" << 'EOF'
#!/bin/zsh
#
# Git pre-push hook - runs all green gates before pushing
# Installed by: make install-hooks or ./scripts/dev/install-git-hooks.sh
#

set -uo pipefail

echo "========================================"
echo "Pre-push hook: Running npm run green"
echo "========================================"
echo ""

RESULTS=()

run_gate() {
    local name="$1"
    local cmd="$2"
    echo "--- $name ---"
    if eval "$cmd"; then
        RESULTS+=("$name: PASS")
        return 0
    else
        RESULTS+=("$name: FAIL")
        return 1
    fi
}

FAILED=0

run_gate "typecheck" "npm run typecheck" || FAILED=1
echo ""
run_gate "lint" "npm run lint" || FAILED=1
echo ""
run_gate "unit" "npm run test:unit" || FAILED=1
echo ""
run_gate "db:seed" "npm run db:seed" || FAILED=1
echo ""
run_gate "admin:stable" "npm run test-admin:stable" || FAILED=1
echo ""
run_gate "api:stable" "npm run test-api:stable" || FAILED=1

echo ""
echo "========================================"
echo "Pre-push Results"
echo "========================================"
for r in "${RESULTS[@]}"; do
    echo "  $r"
done
echo "========================================"

if [ $FAILED -ne 0 ]; then
    echo ""
    echo "Pre-push hook FAILED. Push blocked."
    echo "Fix the issues above and try again."
    exit 1
fi

echo ""
echo "All gates passed. Proceeding with push."
exit 0
EOF

# Make hook executable
chmod +x "$HOOK_PATH"

echo ""
echo "Installed Git pre-push hook to run \"npm run green\"."
echo ""
echo "Now, before each \"git push\", all green gates will run automatically."
echo "If any gate fails, the push will be blocked."
