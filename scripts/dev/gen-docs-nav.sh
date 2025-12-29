#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "${ROOT_DIR}"

echo "=== gen-docs-nav.sh ==="
echo "Project root: ${ROOT_DIR}"

mkdir -p docs

# Regenerate docs/INDEX.md
cat << 'INDEX_EOF' > docs/INDEX.md
# Murmurant Documentation Index

This is the main entry point for all Murmurant developer documentation.

## Getting Started
- [Developer Onboarding](ONBOARDING.md)
- [Development Workflow](DEVELOPMENT_WORKFLOW.md)

## Architecture
- [Admin Architecture Map](ADMIN_ARCHITECTURE_MAP.md)
- [API Surface](API_SURFACE.md)

## Admin Feature Guides
- [Admin Dashboard Overview](ADMIN_DASHBOARD_OVERVIEW.md)
- [Admin Members UI](ADMIN_MEMBERS_UI.md)
- [Admin Events UI](ADMIN_EVENTS_UI.md)
- [Admin Registrations UI](ADMIN_REGISTRATIONS_UI.md)
- [Admin Activity UI](ADMIN_ACTIVITY_UI.md)

## Testing and Tooling
- Test scripts under scripts/dev/*
- Make targets documented in README.md
- Playwright test suites in tests/api and tests/admin

## Reference
- Mock data definitions under lib/mock/*
- Utility helpers under lib/*
INDEX_EOF

echo "Wrote docs/INDEX.md"

# Regenerate docs/NAV.md
cat << 'NAV_EOF' > docs/NAV.md
# Documentation Navigation

This file provides a structured navigation index for all Murmurant documentation.

## Developer Onboarding
- ONBOARDING.md
- DEVELOPMENT_WORKFLOW.md

## Architecture
- ADMIN_ARCHITECTURE_MAP.md
- API_SURFACE.md

## Admin Features
- ADMIN_DASHBOARD_OVERVIEW.md
- ADMIN_MEMBERS_UI.md
- ADMIN_EVENTS_UI.md
- ADMIN_REGISTRATIONS_UI.md
- ADMIN_ACTIVITY_UI.md

## Testing
- Make targets (in README.md)
- scripts/dev/* tooling
- Playwright test suites under tests/api and tests/admin

## Reference
- Mock data under lib/mock/*
- Helper utilities under lib/*
- ENV setup and Doctor script expectations

This file is intended to be linked from README.md as a navigation sidebar.
NAV_EOF

echo "Wrote docs/NAV.md"

echo "Docs navigation regeneration complete."
