#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

echo "=== GREEN: typecheck ==="
npm run typecheck

echo
echo "=== GREEN: lint ==="
npm run lint

echo
echo "=== GREEN: unit ==="
npm run test:unit

echo
echo "=== GREEN: db seed ==="
npm run db:seed

echo
echo "=== GREEN: admin stable ==="
npm run test-admin:stable

echo
echo "=== GREEN: api stable ==="
npm run test-api:stable

echo
echo "=== GREEN: DONE ==="
git status -sb
