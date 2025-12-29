set -euo pipefail

fail=0

echo "== Murmurant Charter CI Checks =="
echo

req_files=(
  "docs/ARCHITECTURAL_CHARTER.md"
  "CLAUDE.md"
)

for f in "${req_files[@]}"; do
  if [[ ! -f "${f}" ]]; then
    echo "FAIL: missing required file: ${f}"
    fail=1
  else
    echo "OK: found ${f}"
  fi
done

echo
echo "== Basic risk pattern scan (best-effort) =="

if command -v rg >/dev/null 2>&1; then
  patterns=(
    "TEST_TOKEN|DEV_TOKEN|bypass auth|skip auth|mock user|assumeUser|x-user|x-auth"
  )
  for p in "${patterns[@]}"; do
    echo
    echo "-- scanning: ${p}"
    if rg -n --hidden --glob '!.git/*' --glob '!docs/**' --glob '!scripts/ci_charter_checks.sh' "${p}" .; then
      echo "WARN: pattern matched: ${p}"
    else
      echo "OK: no matches for: ${p}"
    fi
  done
else
  echo "WARN: ripgrep (rg) not found in CI environment; skipping scans."
fi

echo

# == Migration Safety Check (P2, P7, P9) ==
echo "== Migration Safety Check =="
if [[ -x "scripts/ci/check-migration-safety.sh" ]]; then
  if ! bash scripts/ci/check-migration-safety.sh; then
    echo "FAIL: Migration safety check failed"
    fail=1
  fi
else
  echo "WARN: scripts/ci/check-migration-safety.sh not found or not executable; skipping"
fi

echo
if [[ "${fail}" -ne 0 ]]; then
  echo "RESULT: FAIL (one or more checks failed)"
  exit 1
fi

echo "RESULT: PASS"
