# ClubOS

Admin and membership management system.

## Development

### Install Dependencies
npm install

### Run Dev Server
npm run dev

### Testing
See docs/INDEX.md for full testing instructions.

**Run all gates before pushing:**
```
npm run green
```

Other test commands:
- make test-api
- make test-admin
- make test-changed
- make smoke

### Releasing
See [docs/release/RELEASE_CHECKLIST.md](docs/release/RELEASE_CHECKLIST.md) for the release process.

### Documentation

Full documentation index:
- docs/INDEX.md

Quick links:

#### Developer Guides
- docs/ONBOARDING.md
- docs/DEVELOPMENT_WORKFLOW.md
- docs/ADMIN_ARCHITECTURE_MAP.md

#### Admin Feature Guides
- docs/ADMIN_DASHBOARD_OVERVIEW.md
- docs/ADMIN_MEMBERS_UI.md
- docs/ADMIN_EVENTS_UI.md
- docs/ADMIN_REGISTRATIONS_UI.md
- docs/ADMIN_ACTIVITY_UI.md

#### API Reference
- docs/API_SURFACE.md

#### Navigation Overview
- docs/NAV.md

### Tooling

#### Development Scripts (scripts/dev)
- green.sh - Run all gates (typecheck, lint, unit, seed, admin, api)
- doctor.sh - Check environment prerequisites
- smoke.sh - Quick sanity checks
- install-git-hooks.sh - Install pre-push hook
- collect-diagnostics.sh - Environment diagnostics
- test-changed.sh - Run tests for changed files
- playwright-clean.sh - Clean test artifacts
- playwright-report.sh - Open test report

All scripts are ASCII-only, zsh-based, and autodetect the project root.

