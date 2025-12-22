#!/usr/bin/env zsh
set -euo pipefail
setopt NO_NOMATCH

ROOT="${1:-.}"
OUT="${2:-docs/SECTIONS_MIGRATION_INVENTORY.generated.md}"

cd "$ROOT"

printf "=== Stripe -> Section inventory (generated) ===\n\n" > "$OUT"
printf "Generated: %s\n\n" "$(date -u '+%Y-%m-%d %H:%M:%SZ')" >> "$OUT"

printf "## Matches: Stripe / Stripes / stripe\n\n" >> "$OUT"
rg -n --hidden --glob '!.git/**' --glob '!node_modules/**' --glob '!package-lock.json' --glob '!**/*.lock' \
  '(Stripe|Stripes|stripe)\b' . \
  | rg -v '^docs/SECTIONS_MIGRATION_INVENTORY\.generated\.md:' \
  | rg -v '^docs/SECTIONS_MIGRATION_INVENTORY\.md:' \
  | rg -v 'docs/policies/sbnc/(ocr|sources)/' \
  | sort \
  | sed 's/^/- /' >> "$OUT" || true

printf "\n## Matches: sections / section (for context)\n\n" >> "$OUT"
rg -n --hidden --glob '!.git/**' --glob '!node_modules/**' --glob '!package-lock.json' --glob '!**/*.lock' \
  '\b(section|sections)\b' . \
  | rg -v '^docs/SECTIONS_MIGRATION_INVENTORY\.generated\.md:' \
  | rg -v 'docs/policies/sbnc/(ocr|sources)/' \
  | head -n 200 \
  | sed 's/^/- /' >> "$OUT" || true

printf "\n=== DONE: wrote %s ===\n" "$OUT"
wc -l "$OUT" | awk '{print "Lines: " $1}'
