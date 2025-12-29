#!/usr/bin/env zsh
#
# MERGE_CAPTAIN.zsh - Nightly merge captain automation
#
# Copyright (c) Santa Barbara Newcomers Club. All rights reserved.
#
# Usage:
#   DRY_RUN=1 zsh ./MERGE_CAPTAIN.zsh   # Preview mode (default)
#   DRY_RUN=0 zsh ./MERGE_CAPTAIN.zsh   # Execute merges
#
# Prerequisites:
#   - GitHub CLI (gh) installed and authenticated
#   - Clean working tree on main
#

set -euo pipefail

# Configuration
DRY_RUN="${DRY_RUN:-1}"
REPO="sbnctech/murmurant"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Hotspot patterns
HOTSPOT_PATTERNS=(
  "prisma/schema.prisma"
  "prisma/migrations/"
  "package.json"
  "package-lock.json"
  ".github/workflows/"
  "src/app/admin/"
  "src/components/editor/"
  "src/lib/auth"
  "src/lib/rbac"
  "src/lib/publishing"
)

echo "======================================"
echo "  MERGE CAPTAIN SCRIPT"
echo "  $(date)"
echo "======================================"
echo ""

if [[ "$DRY_RUN" == "1" ]]; then
  echo "${YELLOW}DRY RUN MODE - No changes will be made${NC}"
  echo "Set DRY_RUN=0 to execute merges"
  echo ""
fi

# Check prerequisites
echo "${BLUE}Checking prerequisites...${NC}"

if ! command -v gh &> /dev/null; then
  echo "${RED}Error: GitHub CLI (gh) not installed${NC}"
  exit 1
fi

if ! gh auth status &> /dev/null; then
  echo "${RED}Error: GitHub CLI not authenticated. Run: gh auth login${NC}"
  exit 1
fi

echo "${GREEN}Prerequisites OK${NC}"
echo ""

# Sync main
echo "${BLUE}Syncing main branch...${NC}"
git fetch origin
git checkout main
git pull origin main

if [[ -n "$(git status --porcelain)" ]]; then
  echo "${RED}Error: Working tree is not clean${NC}"
  git status
  exit 1
fi

echo "${GREEN}Main is up to date${NC}"
echo ""

# Get open PRs
echo "${BLUE}Fetching open PRs...${NC}"

PR_DATA=$(gh pr list --repo "$REPO" --state open --json number,title,isDraft,headRefName,files,statusCheckRollup)
PR_COUNT=$(echo "$PR_DATA" | jq 'length')

echo "Open PRs: $PR_COUNT"
echo ""

if [[ "$PR_COUNT" == "0" ]]; then
  echo "${GREEN}No open PRs to process${NC}"
  exit 0
fi

# Categorize PRs
echo "${BLUE}Categorizing PRs...${NC}"
echo ""

DOCS_ONLY=()
NON_HOTSPOT=()
HOTSPOT=()
DRAFT=()
FAILING=()

while IFS= read -r pr; do
  NUM=$(echo "$pr" | jq -r '.number')
  TITLE=$(echo "$pr" | jq -r '.title')
  IS_DRAFT=$(echo "$pr" | jq -r '.isDraft')
  FILES=$(echo "$pr" | jq -r '[.files[].path] | join("\n")')

  # Check status
  CHECKS_PASS=true
  while IFS= read -r check; do
    CONCLUSION=$(echo "$check" | jq -r '.conclusion // "null"')
    if [[ "$CONCLUSION" == "FAILURE" ]]; then
      CHECKS_PASS=false
      break
    fi
  done < <(echo "$pr" | jq -c '.statusCheckRollup[]?' 2>/dev/null || echo "")

  # Skip drafts
  if [[ "$IS_DRAFT" == "true" ]]; then
    DRAFT+=("$NUM:$TITLE")
    continue
  fi

  # Skip failing
  if [[ "$CHECKS_PASS" == "false" ]]; then
    FAILING+=("$NUM:$TITLE")
    continue
  fi

  # Check if docs-only
  IS_DOCS_ONLY=true
  IS_HOTSPOT=false

  while IFS= read -r file; do
    [[ -z "$file" ]] && continue

    # Check if non-docs
    if [[ ! "$file" =~ ^docs/ ]] && [[ ! "$file" =~ \.md$ ]]; then
      IS_DOCS_ONLY=false
    fi

    # Check if hotspot
    for pattern in "${HOTSPOT_PATTERNS[@]}"; do
      if [[ "$file" == *"$pattern"* ]]; then
        IS_HOTSPOT=true
        break
      fi
    done
  done <<< "$FILES"

  if [[ "$IS_DOCS_ONLY" == "true" ]]; then
    DOCS_ONLY+=("$NUM:$TITLE")
  elif [[ "$IS_HOTSPOT" == "true" ]]; then
    HOTSPOT+=("$NUM:$TITLE")
  else
    NON_HOTSPOT+=("$NUM:$TITLE")
  fi

done < <(echo "$PR_DATA" | jq -c '.[]')

# Print summary
echo "======================================"
echo "  PR CATEGORIES"
echo "======================================"
echo ""

echo "${GREEN}DOCS-ONLY (merge first):${NC}"
if [[ ${#DOCS_ONLY[@]} -eq 0 ]]; then
  echo "  (none)"
else
  for pr in "${DOCS_ONLY[@]}"; do
    echo "  #${pr%%:*} - ${pr#*:}"
  done
fi
echo ""

echo "${BLUE}NON-HOTSPOT (merge second):${NC}"
if [[ ${#NON_HOTSPOT[@]} -eq 0 ]]; then
  echo "  (none)"
else
  for pr in "${NON_HOTSPOT[@]}"; do
    echo "  #${pr%%:*} - ${pr#*:}"
  done
fi
echo ""

echo "${YELLOW}HOTSPOT (merge captain only):${NC}"
if [[ ${#HOTSPOT[@]} -eq 0 ]]; then
  echo "  (none)"
else
  for pr in "${HOTSPOT[@]}"; do
    echo "  #${pr%%:*} - ${pr#*:}"
  done
fi
echo ""

echo "DRAFT (skipped):"
if [[ ${#DRAFT[@]} -eq 0 ]]; then
  echo "  (none)"
else
  for pr in "${DRAFT[@]}"; do
    echo "  #${pr%%:*} - ${pr#*:}"
  done
fi
echo ""

echo "${RED}FAILING (skipped):${NC}"
if [[ ${#FAILING[@]} -eq 0 ]]; then
  echo "  (none)"
else
  for pr in "${FAILING[@]}"; do
    echo "  #${pr%%:*} - ${pr#*:}"
  done
fi
echo ""

# Print merge commands
echo "======================================"
echo "  MERGE COMMANDS"
echo "======================================"
echo ""

echo "# Docs-only PRs"
for pr in "${DOCS_ONLY[@]}"; do
  NUM="${pr%%:*}"
  echo "gh pr merge $NUM --repo $REPO --squash --delete-branch"
done
echo ""

echo "# Non-hotspot PRs"
for pr in "${NON_HOTSPOT[@]}"; do
  NUM="${pr%%:*}"
  echo "gh pr merge $NUM --repo $REPO --squash --delete-branch"
done
echo ""

echo "# Hotspot PRs (manual review required)"
for pr in "${HOTSPOT[@]}"; do
  NUM="${pr%%:*}"
  echo "# gh pr merge $NUM --repo $REPO --squash --delete-branch  # REVIEW FIRST"
done
echo ""

# Execute if not dry run
if [[ "$DRY_RUN" == "0" ]]; then
  echo "======================================"
  echo "  EXECUTING MERGES"
  echo "======================================"
  echo ""

  for pr in "${DOCS_ONLY[@]}"; do
    NUM="${pr%%:*}"
    echo "${GREEN}Merging PR #$NUM...${NC}"
    gh pr merge "$NUM" --repo "$REPO" --squash --delete-branch || echo "${RED}Failed to merge #$NUM${NC}"
  done

  for pr in "${NON_HOTSPOT[@]}"; do
    NUM="${pr%%:*}"
    echo "${GREEN}Merging PR #$NUM...${NC}"
    gh pr merge "$NUM" --repo "$REPO" --squash --delete-branch || echo "${RED}Failed to merge #$NUM${NC}"
  done

  echo ""
  echo "${YELLOW}Hotspot PRs not auto-merged. Review and merge manually.${NC}"
fi

echo ""
echo "======================================"
echo "  NEXT STEPS"
echo "======================================"
echo "1. Review and merge any hotspot PRs manually"
echo "2. Run smoke tests: npm run typecheck && npm run test:unit"
echo "3. Record notes in daily log"
echo ""
echo "Done at $(date)"
