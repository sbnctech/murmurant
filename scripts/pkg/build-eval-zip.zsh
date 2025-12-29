#!/bin/zsh
#
# build-eval-zip.zsh
#
# Builds a curated evaluation packet ZIP for board review.
# macOS zsh compatible (no GNU-only commands).
#
# Usage:
#   ./scripts/pkg/build-eval-zip.zsh
#
# Output:
#   ~/Downloads/Murmurant_Evaluation_Packet_<SHA>_<DATE>.zip
#
# Copyright (c) Santa Barbara Newcomers Club
#

set -e

# --- Configuration ---

SCRIPT_DIR="${0:A:h}"
REPO_ROOT="${SCRIPT_DIR:h:h}"

# Output location
OUTPUT_DIR="${HOME}/Downloads"
DATE_STAMP=$(date +%Y%m%d)

# --- Locate repo and get commit info ---

cd "${REPO_ROOT}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: Not inside a git repository"
  exit 1
fi

COMMIT_SHA=$(git rev-parse --short HEAD)
COMMIT_FULL=$(git rev-parse HEAD)
COMMIT_DATE=$(git log -1 --format=%ci HEAD)
BRANCH=$(git rev-parse --abbrev-ref HEAD)

ZIP_NAME="Murmurant_Evaluation_Packet_${COMMIT_SHA}_${DATE_STAMP}.zip"
ZIP_PATH="${OUTPUT_DIR}/${ZIP_NAME}"

# --- Curated file list (hardcoded for reliability) ---

# Board evaluation documents
EVAL_DOCS=(
  "docs/BIZ/BOARD_EMAIL_EVALUATION_REQUEST.md"
  "docs/BIZ/BOARD_NARRATIVE_VARIANT.md"
  "docs/BIZ/BOARD_QA_RISK_ANALYSIS.md"
  "docs/BIZ/BOARD_TRUST_OVERVIEW.md"
  "docs/BIZ/EVALUATION_CHARTER.md"
  "docs/BIZ/EXHIBIT_B_FIRST_PRINCIPLES.md"
  "docs/BIZ/EXHIBIT_E_DEVELOPMENT_METHODOLOGY.md"
  "docs/GOV/BOARD_MEMO_PLATFORM_VS_POLICY.md"
)

# Business model and governance
BIZ_DOCS=(
  "docs/BIZ/BUSINESS_MODEL_CANONICAL.md"
  "docs/BIZ/COMMERCIALIZATION_AND_GOVERNANCE.md"
  "docs/BIZ/HOW_MURMURANT_IS_BUILT_AND_GOVERNED.md"
)

# Architecture (high-level only)
ARCH_DOCS=(
  "docs/ARCH/CORE_TRUST_SURFACE.md"
  "docs/ARCH/REVERSIBILITY_CONTRACT.md"
)

# Operator-facing trust docs
TRUST_DOCS=(
  "docs/BIZ/TRUST_SURFACE_FOR_OPERATORS.md"
  "docs/BIZ/CALENDAR_TRUST_AND_RELIABILITY.md"
)

# All files to include
ALL_FILES=(
  "${EVAL_DOCS[@]}"
  "${BIZ_DOCS[@]}"
  "${ARCH_DOCS[@]}"
  "${TRUST_DOCS[@]}"
)

# --- Create staging directory ---

TEMP_BASE=$(mktemp -d)
STAGING_DIR="${TEMP_BASE}/Murmurant_Evaluation_Packet"
mkdir -p "${STAGING_DIR}"
trap "rm -rf ${TEMP_BASE}" EXIT

echo "=== Murmurant Evaluation Packet Builder ==="
echo ""
echo "Repository: ${REPO_ROOT}"
echo "Branch:     ${BRANCH}"
echo "Commit:     ${COMMIT_SHA} (${COMMIT_DATE})"
echo "Output:     ${ZIP_PATH}"
echo ""

# --- Copy curated files ---

echo "Copying curated documents..."

INCLUDED_FILES=()
MISSING_FILES=()

for file in "${ALL_FILES[@]}"; do
  if [[ -f "${REPO_ROOT}/${file}" ]]; then
    # Create directory structure in staging
    target_dir="${STAGING_DIR}/$(dirname ${file})"
    mkdir -p "${target_dir}"
    cp "${REPO_ROOT}/${file}" "${target_dir}/"
    INCLUDED_FILES+=("${file}")
    echo "  + ${file}"
  else
    MISSING_FILES+=("${file}")
    echo "  ! Missing: ${file}"
  fi
done

echo ""
echo "Included: ${#INCLUDED_FILES[@]} files"
if [[ ${#MISSING_FILES[@]} -gt 0 ]]; then
  echo "Missing:  ${#MISSING_FILES[@]} files (see INCLUDED_FILES.txt)"
fi

# --- Generate README.md ---

cat > "${STAGING_DIR}/README.md" << EOF
# Murmurant Board Evaluation Packet

This ZIP contains curated documentation for board review of Murmurant.

## Build Information

| Field | Value |
|-------|-------|
| Generated | $(date -u +"%Y-%m-%d %H:%M:%S UTC") |
| Commit | ${COMMIT_FULL} |
| Branch | ${BRANCH} |
| Commit Date | ${COMMIT_DATE} |

## Contents

This packet includes:

### Board Evaluation Documents
Documents specifically prepared for board review of the Murmurant evaluation proposal.

### Business Model
Core business model and commercialization documentation.

### Architecture (High-Level)
Key architectural contracts that define system guarantees.

### Operator Trust
Documentation explaining how Murmurant protects organizational data.

## How to Use This Packet

1. Start with \`docs/BIZ/BOARD_EMAIL_EVALUATION_REQUEST.md\` for the proposal summary
2. Review \`docs/BIZ/EVALUATION_CHARTER.md\` for the evaluation framework
3. See \`docs/BIZ/BOARD_QA_RISK_ANALYSIS.md\` for risk discussion
4. Check \`INCLUDED_FILES.txt\` for the complete file list

## Questions

For questions about this packet, contact the Technology Chair.

---

*This packet was generated automatically. Do not edit files directly.*
*To update, rebuild from the source repository.*
EOF

echo "Generated README.md"

# --- Generate INCLUDED_FILES.txt ---

{
  echo "# Murmurant Evaluation Packet - Included Files"
  echo "#"
  echo "# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
  echo "# Commit: ${COMMIT_SHA}"
  echo "#"
  echo ""
  echo "## Included Files (${#INCLUDED_FILES[@]})"
  echo ""
  for file in "${INCLUDED_FILES[@]}"; do
    echo "${file}"
  done
  if [[ ${#MISSING_FILES[@]} -gt 0 ]]; then
    echo ""
    echo "## Missing Files (${#MISSING_FILES[@]})"
    echo "# These files were in the curated list but not found in the repo."
    echo ""
    for file in "${MISSING_FILES[@]}"; do
      echo "# MISSING: ${file}"
    done
  fi
} > "${STAGING_DIR}/INCLUDED_FILES.txt"

echo "Generated INCLUDED_FILES.txt"

# --- Create ZIP using ditto (macOS native) ---

echo ""
echo "Creating ZIP archive..."

# Remove existing ZIP if present
if [[ -f "${ZIP_PATH}" ]]; then
  rm "${ZIP_PATH}"
fi

# Use ditto for macOS-native ZIP creation
# -c = create archive, -k = PKZip format, --sequesterRsrc = handle resource forks
ditto -c -k --sequesterRsrc --keepParent "${STAGING_DIR}" "${ZIP_PATH}"

# --- Summary ---

ZIP_SIZE=$(stat -f%z "${ZIP_PATH}" 2>/dev/null || stat --format=%s "${ZIP_PATH}" 2>/dev/null)
ZIP_SIZE_KB=$((ZIP_SIZE / 1024))

echo ""
echo "=== Build Complete ==="
echo ""
echo "Output:     ${ZIP_PATH}"
echo "Size:       ${ZIP_SIZE_KB} KB"
echo "Files:      ${#INCLUDED_FILES[@]} documents + 2 index files"
echo ""
echo "To verify contents:"
echo "  unzip -l '${ZIP_PATH}'"
echo ""
