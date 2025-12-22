#!/usr/bin/env zsh
set -euo pipefail
setopt NO_NOMATCH

PR_NUM="${1:-135}"
OUT="${2:-docs/backlog/PR135_BUCKET_REPORT.generated.md}"
REPO="${REPO:-sbnctech/clubos}"

tmp="$(mktemp -t pr135_files.XXXXXX)"
trap 'rm -f "$tmp"' EXIT

gh pr view "$PR_NUM" --repo "$REPO" --json files --template '{{range .files}}{{.path}}{{"\n"}}{{end}}' > "$tmp"

print "=== PR #$PR_NUM bucket report (generated) ===\n" > "$OUT"
print "Repo: $REPO" >> "$OUT"
print "Generated: $(date -u '+%Y-%m-%d %H:%M:%SZ')\n" >> "$OUT"

bucket () {
  local title="$1"
  shift
  print "## $title\n" >> "$OUT"
  rg -n --no-filename --fixed-strings --regexp '' "$tmp" \
    | rg -n --no-filename "$@" \
    | sort \
    | sed 's/^/- /' >> "$OUT" || true
  print "" >> "$OUT"
}

print "## All files\n" >> "$OUT"
cat "$tmp" | sort | sed 's/^/- /' >> "$OUT"
print "" >> "$OUT"

bucket "Docs-only" '^docs/'

bucket "Runtime: view-as candidate" 'src/app/ViewAsWrapper\.tsx$|src/app/\(member\)/member/page\.tsx$|src/app/\(public\)/join/page\.tsx$|docs/demos/VIEW_AS_SUPPORT_TOOL\.md$|docs/demos/.*VIEW_AS.*'

bucket "Admin demo surfaces" '^src/app/admin/demo/|^docs/demos/|^scripts/demo/|^scripts/importing/seed_demo_'

bucket "API / OpenAPI / dev docs" '^docs/api/|^docs/DEVELOPER/API_DOCUMENTATION\.md$|^src/app/admin/dev/api-docs/'

bucket "Finance docs/scripts" '^docs/FINANCE/|^docs/operations/ACH_PAYMENT_GUIDE\.md$|^scripts/finance/|^src/app/admin/AchMetricsWidget\.tsx$'

bucket "Policy ingestion / registry docs" '^docs/policies/|^docs/policy/|^scripts/ci/validate-policies\.ts$'

bucket "Hotspots present (must avoid in micro-PR)" '^prisma/schema\.prisma$|^prisma/migrations/|^package\.json$|^package-lock\.json$|^src/app/admin/(AdminSectionNav|VPActivitiesDashboard|communications/page|events/page|events/new/page|governance/annotations/page)\.'

print "=== DONE: wrote $OUT ==="
wc -l "$OUT" | awk '{print "Lines: " $1}'
