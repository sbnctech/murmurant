#!/usr/bin/env bash
set -euo pipefail

TAG="v0.2.2"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERROR: working tree is not clean. Commit or stash first."
  git status -sb
  exit 1
fi

git fetch origin --tags

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "ERROR: tag already exists locally: $TAG"
  exit 1
fi

if git ls-remote --tags origin | rg -q "refs/tags/${TAG}$"; then
  echo "ERROR: tag already exists on origin: $TAG"
  exit 1
fi

# Require that current HEAD is reachable from origin/main
if ! git merge-base --is-ancestor HEAD origin/main; then
  echo "ERROR: current HEAD is not on origin/main."
  echo "Merge the PR into main first, then checkout/pull main, then re-run this script."
  echo
  echo "Current:"
  git log --oneline -1 --decorate
  echo
  echo "origin/main:"
  git log --oneline -1 --decorate origin/main
  exit 1
fi

git tag -a "$TAG" -m "Murmurant $TAG"
git push origin "$TAG"

echo "OK: tagged and pushed $TAG at:"
git show -s --format='%h %d %s' "$TAG"
