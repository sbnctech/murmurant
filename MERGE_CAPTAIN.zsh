set -euo pipefail

REPO="sbnctech/clubos"
WORKDIR="$HOME/clubos"
LIMIT=50

cd "$WORKDIR"

echo "=== MERGE CAPTAIN (merge-often mode) ==="
echo "Repo: $REPO"
echo "Rule: not draft + base main + rebase clean + checks green (CheckRun: SUCCESS/SKIPPED/NEUTRAL; StatusContext: state==SUCCESS)"
echo ""

git checkout main >/dev/null 2>&1 || true
git pull --ff-only origin main >/dev/null

merge_one () {
  local PR="$1"

  echo ""
  echo "=============================================="
  echo "PR #$PR"
  echo "=============================================="

  local VIEW
  VIEW="$(gh pr view "$PR" --repo "$REPO" --json number,state,isDraft,baseRefName,headRefName,mergeable,url,title 2>/dev/null || true)"
  if [ -z "$VIEW" ]; then
    echo "SKIP: unable to read PR"
    return 0
  fi

  local STATE DRAFT BASE HEAD MERGEABLE URL
  STATE="$(echo "$VIEW" | jq -r '.state // ""')"
  DRAFT="$(echo "$VIEW" | jq -r '.isDraft // false')"
  BASE="$(echo "$VIEW" | jq -r '.baseRefName // ""')"
  HEAD="$(echo "$VIEW" | jq -r '.headRefName // ""')"
  MERGEABLE="$(echo "$VIEW" | jq -r '.mergeable // ""')"
  URL="$(echo "$VIEW" | jq -r '.url // ""')"

  echo "State: $STATE"
  echo "Draft: $DRAFT"
  echo "Base:  $BASE"
  echo "Head:  $HEAD"
  echo "Mergeable: $MERGEABLE"
  echo "URL:   $URL"

  if [ "$STATE" != "OPEN" ]; then echo "SKIP: not open"; return 0; fi
  if [ "$DRAFT" = "true" ]; then echo "SKIP: draft"; return 0; fi
  if [ "$BASE" != "main" ]; then echo "SKIP: base is not main"; return 0; fi
  if [ "$MERGEABLE" = "CONFLICTING" ]; then echo "SKIP: mergeable is CONFLICTING"; return 0; fi

  echo ""
  echo "=== REBASE branch onto origin/main ==="
  git fetch origin main >/dev/null
  git fetch origin "$HEAD":"refs/remotes/origin/$HEAD" >/dev/null 2>&1 || true

  git checkout -B "$HEAD" "origin/$HEAD" >/dev/null 2>&1 || {
    echo "SKIP: cannot checkout branch origin/$HEAD"
    git checkout main >/dev/null 2>&1 || true
    return 0
  }

  if ! git rebase "origin/main" >/dev/null 2>&1; then
    echo "SKIP: rebase conflict (aborting)"
    git rebase --abort >/dev/null 2>&1 || true
    git checkout main >/dev/null 2>&1 || true
    return 0
  fi

  echo "Rebase OK. Pushing (force-with-lease)."
  git push --force-with-lease origin "$HEAD" >/dev/null 2>&1 || true

  echo ""
  echo "=== WAIT FOR CHECKS TO APPEAR (up to ~180s) ==="
  local i
  for i in {1..18}; do
    if gh pr checks "$PR" --repo "$REPO" >/dev/null 2>&1; then
      break
    fi
    sleep 10
  done

  echo ""
  echo "=== PR CHECKS (human) ==="
  gh pr checks "$PR" --repo "$REPO" || true

  echo ""
  echo "=== GREEN GATE ==="
  local OK
  OK="$(
    gh pr view "$PR" --repo "$REPO" --json statusCheckRollup -q '
      [
        .statusCheckRollup[]
        | if .["__typename"] == "CheckRun" then
            ((.conclusion == "SUCCESS") or (.conclusion == "SKIPPED") or (.conclusion == "NEUTRAL"))
          elif .["__typename"] == "StatusContext" then
            ((.state // "") == "SUCCESS")
          else
            false
          end
      ] | all(. == true)
    '
  )"
  echo "Gate: $OK"

  if [ "$OK" != "true" ]; then
    echo "SKIP: not green (or checks missing)"
    git checkout main >/dev/null 2>&1 || true
    return 0
  fi

  echo ""
  echo "=== MERGE ==="
  gh pr merge "$PR" --repo "$REPO" --squash --delete-branch

  echo ""
  echo "=== SYNC MAIN LOCALLY ==="
  git checkout main >/dev/null 2>&1 || true
  git pull --ff-only origin main >/dev/null

  echo "DONE: merged PR #$PR"
}

echo "=== CANDIDATES (open PRs, base=main, top $LIMIT) ==="
gh pr list --repo "$REPO" --state open --base main --limit "$LIMIT" --json number,title,headRefName,isDraft \
  -q '.[] | "#\(.number)\t\(.headRefName)\t(draft=\(.isDraft))\t\(.title)"'

echo ""
echo "=== AUTO MERGE PASS ==="
PRS_STR="$(gh pr list --repo "$REPO" --state open --base main --limit "$LIMIT" --json number -q '[.[].number] | join(" ")')"
if [ -z "${PRS_STR:-}" ]; then
  echo "No open PRs found."
  exit 0
fi

for PR in ${(z)PRS_STR}; do
  merge_one "$PR"
done

echo ""
echo "=== DONE ==="
echo "Re-run anytime:"
echo "  cd \"$HOME/clubos\" && zsh ./MERGE_CAPTAIN.zsh"
