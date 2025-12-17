#!/bin/zsh
set -euo pipefail

echo "Installing Git hooks for ClubOS..."
mkdir -p .git/hooks

cat << 'HOOK' > .git/hooks/pre-push
#!/bin/zsh
set -euo pipefail

echo "Running pre-push hook: charter gate + targeted checks"
echo ""

if [[ -x "scripts/ci_charter_checks.sh" ]]; then
  bash scripts/ci_charter_checks.sh
else
  echo "WARN: scripts/ci_charter_checks.sh not found or not executable; skipping charter gate"
fi

changed_files="$(git diff --name-only --cached --diff-filter=ACMR)"
code_files="$(echo "${changed_files}" | rg -n '\.(ts|tsx|js|jsx|mjs|cjs)$' || true)"

if [[ -n "${code_files}" ]]; then
  echo ""
  echo "Targeted ESLint on staged code files:"
  echo "${code_files}"
  echo ""
  npx eslint ${=code_files} --max-warnings=0
else
  echo ""
  echo "No staged JS/TS files; skipping ESLint."
fi

echo ""
echo "Pre-push hook passed. Proceeding with push."
exit 0
HOOK

chmod +x .git/hooks/pre-push

echo "Installed: .git/hooks/pre-push"
