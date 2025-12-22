set -euo pipefail

REPO="sbnctech/clubos"
LIMIT=60

echo "=== PR CONFLICT REPORT ==="
echo "Repo: $REPO"
echo "Scanning open PRs (base=main), top $LIMIT"
echo ""

PRS_JSON="$(gh pr list --repo "$REPO" --state open --base main --limit "$LIMIT" --json number,title,headRefName,isDraft,mergeable 2>/dev/null)"
if [ -z "${PRS_JSON:-}" ] || [ "$PRS_JSON" = "null" ]; then
  echo "No PRs found or cannot read PR list."
  exit 0
fi

echo "=== SUMMARY (number | mergeable | draft | branch | title) ==="
echo "$PRS_JSON" | jq -r '.[] | "#\(.number)\t\(.mergeable)\t(draft=\(.isDraft))\t\(.headRefName)\t\(.title)"' | sed $'s/\t/ | /g'
echo ""

HOT_RE='^(prisma/schema\.prisma|playwright\.config\.ts|src/app/page\.tsx|src/app/admin/|package\.json|package-lock\.json|docs/backlog/WORK_QUEUE\.md)'

echo "=== HOTSPOT OVERLAP (PRs touching conflict magnets) ==="
PRS_NUMS="$(echo "$PRS_JSON" | jq -r '.[].number' | tr '\n' ' ')"

for PR in ${(z)PRS_NUMS}; do
  FILES="$(gh pr view "$PR" --repo "$REPO" --json files -q '.files[].path' 2>/dev/null || true)"
  if [ -z "${FILES:-}" ]; then
    continue
  fi
  HOTS="$(echo "$FILES" | rg -n "$HOT_RE" || true)"
  if [ -n "${HOTS:-}" ]; then
    TITLE="$(echo "$PRS_JSON" | jq -r ".[] | select(.number==$PR) | .title")"
    BRANCH="$(echo "$PRS_JSON" | jq -r ".[] | select(.number==$PR) | .headRefName")"
    MERGEABLE="$(echo "$PRS_JSON" | jq -r ".[] | select(.number==$PR) | .mergeable")"
    DRAFT="$(echo "$PRS_JSON" | jq -r ".[] | select(.number==$PR) | .isDraft")"
    echo ""
    echo "PR #$PR | mergeable=$MERGEABLE | draft=$DRAFT | $BRANCH"
    echo "$TITLE"
    echo "Hot files:"
    echo "$HOTS" | sed 's/^/  - /'
  fi
done

echo ""
echo "=== RECOMMENDED NEXT MOVE ==="
echo "1) Run merge captain to merge anything MERGEABLE + clean."
echo "2) For CONFLICTING PRs that touch hotspots, stop trying to rebase each one."
echo "3) Pick ONE theme (e.g. editor, eligibility, home/view-as) and create an integration branch for it."
echo ""
echo "Run merge captain:"
echo "  cd \"$HOME/clubos\" && zsh ./MERGE_CAPTAIN.zsh"
