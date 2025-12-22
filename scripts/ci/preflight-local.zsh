#!/usr/bin/env zsh
set -euo pipefail

echo "=== PREFLIGHT: context ==="
echo "branch: $(git rev-parse --abbrev-ref HEAD)"
echo "node:   $(node -v)"
echo "npm:    $(npm -v)"
echo ""

echo "=== PREFLIGHT: clean working tree ==="
if [[ -n "$(git status --porcelain)" ]]; then
  echo "FAIL: working tree not clean"
  git status -sb
  exit 1
fi
echo "OK"

echo ""
echo "=== PREFLIGHT: typecheck ==="
npm run -s typecheck
echo "OK"

echo ""
echo "=== PREFLIGHT: style-guard baseline (if available) ==="
if node -e 'const j=require("./package.json"); process.exit(j.scripts && j.scripts["ci:style-guard:baseline"] ? 0 : 1)'; then
  npm run -s ci:style-guard:baseline
  echo "OK"
else
  echo "SKIP: ci:style-guard:baseline script not present on this branch"
fi

echo ""
echo "=== PREFLIGHT: DONE ==="
