#!/bin/bash
# check-canonical-grounding-links.sh
# Verify that required documents reference the canonical grounding document.
#
# This script ensures that key documentation files maintain their connection
# to docs/ORG/SBNC_BUSINESS_MODEL.md as the canonical grounding reference.
#
# Exit codes:
#   0 - All required documents reference the canonical doc
#   1 - One or more required documents are missing the reference

set -euo pipefail

CANONICAL_DOC="docs/ORG/SBNC_BUSINESS_MODEL.md"
CANONICAL_PATTERN="SBNC_BUSINESS_MODEL\.md"

# Documents that MUST reference the canonical grounding document
REQUIRED_DOCS=(
  "docs/roles/MENTOR.md"
  "docs/roles/MENTOR_ROLE_SPECIFICATION.md"
  "docs/governance/LEADERSHIP_ACTION_LOG.md"
  "docs/CHATBOT_CONTRIBUTOR_RULES.md"
  "docs/onboarding/OFFICER_ONBOARDING.md"
  "docs/onboarding/BOARD_ORIENTATION.md"
  "docs/review/HUMAN_REVIEW_PACK.md"
)

echo "Checking canonical grounding links..."
echo "Canonical document: $CANONICAL_DOC"
echo ""

# Verify canonical document exists
if [ ! -f "$CANONICAL_DOC" ]; then
  echo "ERROR: Canonical grounding document not found: $CANONICAL_DOC"
  exit 1
fi

errors=0

for doc in "${REQUIRED_DOCS[@]}"; do
  if [ ! -f "$doc" ]; then
    echo "WARNING: Document not found (skipping): $doc"
    continue
  fi

  if grep -q "$CANONICAL_PATTERN" "$doc"; then
    echo "OK: $doc references canonical doc"
  else
    echo "ERROR: $doc does NOT reference canonical doc"
    echo "       Expected pattern: $CANONICAL_PATTERN"
    ((errors++)) || true
  fi
done

echo ""

if [ $errors -gt 0 ]; then
  echo "FAILED: $errors document(s) missing canonical grounding reference"
  echo ""
  echo "To fix: Add a link to $CANONICAL_DOC in the missing documents."
  echo "Example: **Canonical Grounding**: [SBNC_BUSINESS_MODEL.md](../ORG/SBNC_BUSINESS_MODEL.md)"
  exit 1
else
  echo "PASSED: All required documents reference the canonical grounding document"
  exit 0
fi
