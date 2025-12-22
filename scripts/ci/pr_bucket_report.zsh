#!/usr/bin/env zsh
set -euo pipefail
setopt NO_NOMATCH

PR_NUM="${1:?usage: pr_bucket_report.zsh <pr-number> <out-file>}"
OUT="${2:?usage: pr_bucket_report.zsh <pr-number> <out-file>}"
REPO="${REPO:-sbnctech/clubos}"

tmp="$(mktemp -t pr_files.XXXXXX)"
trap 'rm -f "$tmp"' EXIT

gh pr view "$PR_NUM" --repo "$REPO" --json title,url,files --template \
'Title: {{.title}}
URL: {{.url}}
{{range .files}}{{.path}}{{"\n"}}{{end}}' > "$tmp"

title="$(head -n 1 "$tmp" | sed 's/^Title: //')"
url="$(head -n 2 "$tmp" | tail -n 1 | sed 's/^URL: //')"

paths="$(mktemp -t pr_paths.XXXXXX)"
trap 'rm -f "$tmp" "$paths"' EXIT
tail -n +3 "$tmp" | sed '/^$/d' > "$paths"

print "=== PR #$PR_NUM bucket report (generated) ===\n" > "$OUT"
print "Repo: $REPO" >> "$OUT"
print "Title: $title" >> "$OUT"
print "URL: $url" >> "$OUT"
print "Generated: $(date -u '+%Y-%m-%d %H:%M:%SZ')\n" >> "$OUT"

bucket () {
  local heading="$1"
  local pattern="$2"
  print "## $heading\n" >> "$OUT"
  rg -n --no-filename "$pattern" "$paths" \
    | sort \
    | sed 's/^/- /' >> "$OUT" || true
  print "" >> "$OUT"
}

print "## All files\n" >> "$OUT"
cat "$paths" | sort | sed 's/^/- /' >> "$OUT"
print "" >> "$OUT"

bucket "Docs-only" '^docs/'

bucket "Hotspots" '^(prisma/schema\.prisma|prisma/migrations/|package\.json|package-lock\.json)$'

bucket "Prisma-adjacent" '^prisma/'

bucket "Core admin app surfaces" '^src/app/admin/'

bucket "Editor/publishing UI surfaces" '^src/app/admin/content/pages/|^src/app/admin/content/|^src/app/\(member\)/|^src/app/\(public\)/|^src/app/ViewAsWrapper\.tsx$'

bucket "Importing runtime" '^src/lib/importing/|^scripts/importing/|^tests/unit/importing/'

bucket "CI/scripts" '^scripts/ci/|^\.github/'

print "=== DONE: wrote $OUT ==="
wc -l "$OUT" | awk '{print "Lines: " $1}'
