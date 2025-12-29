# Murmurant Development Makefile
# macOS/zsh compatible

.PHONY: dev dev-clean dev-safe test test-admin test-api test-smoke test-clean test-report test-changed smoke kill clean reset help types lint search turbopack-reset doctor diagnostics preflight install-hooks

# Default target
help:
	@echo "Murmurant Development Commands"
	@echo "============================"
	@echo ""
	@echo "Setup:"
	@echo "  make doctor        Check environment prerequisites"
	@echo "  make diagnostics   Collect environment and git diagnostics"
	@echo "  make install-hooks Install Git pre-push hook (runs preflight)"
	@echo ""
	@echo "Development:"
	@echo "  make dev          Start Next.js development server"
	@echo "  make dev-clean    Clean cache and start dev server"
	@echo "  make dev-safe     Run doctor, kill Next, reset Turbopack, then start dev"
	@echo ""
	@echo "Testing:"
	@echo "  make test         Run all Playwright tests"
	@echo "  make test-admin   Run admin UI tests only"
	@echo "  make test-api     Run API tests only"
	@echo "  make test-smoke   Run smoke tests (schema, API, UI sanity)"
	@echo "  make test-changed Run tests for spec files changed vs main"
	@echo "  make test-clean   Remove Playwright test artifacts (reports, test-results)"
	@echo "  make test-report  Open the last Playwright HTML report (if available)"
	@echo "  make smoke        Quick doctor + lint + types + core tests"
	@echo ""
	@echo "Code Quality:"
	@echo "  make types        Run TypeScript type check"
	@echo "  make lint         Run ESLint with zero warnings"
	@echo "  make search Q=x   Search src/ for pattern x"
	@echo "  make preflight    Run doctor, types, lint, API tests, admin tests"
	@echo ""
	@echo "Maintenance:"
	@echo "  make kill             Kill running Next.js processes"
	@echo "  make clean            Remove Next.js cache and build artifacts"
	@echo "  make turbopack-reset  Reset Turbopack cache (fixes stuck builds)"
	@echo "  make reset            Full dev environment reset"
	@echo "  make reset-full       Full reset including node_modules reinstall"
	@echo ""

# Development
dev:
	@echo "Starting Next.js development server..."
	npm run dev

dev-clean: clean
	@echo "Starting Next.js development server (clean)..."
	npm run dev

dev-safe:
	@echo "Running doctor, killing Next, resetting Turbopack, then starting dev..."
	./scripts/dev/start-dev-safe.sh

# Testing
test:
	@echo "Running all Playwright tests..."
	npx playwright test

test-admin:
	@echo "Running admin UI tests..."
	npx playwright test tests/admin/

test-api:
	@echo "Running API tests..."
	npx playwright test tests/api/

test-smoke:
	@echo "Running smoke tests (schema, API, UI sanity)..."
	npx playwright test tests/smoke/

test-clean:
	@echo "Cleaning Playwright test artifacts..."
	./scripts/dev/playwright-clean.sh

test-report:
	@echo "Opening Playwright HTML report (if available)..."
	./scripts/dev/playwright-report.sh

test-changed:
	@echo "Running Playwright tests for changed spec files..."
	./scripts/dev/test-changed.sh

smoke:
	@echo "Running quick smoke tests (doctor, types, lint, core specs)..."
	./scripts/dev/smoke.sh

# Maintenance
kill:
	@echo "Killing Next.js processes..."
	./scripts/dev/kill-next.sh

clean:
	@echo "Cleaning Next.js cache..."
	./scripts/dev/clean-next-lock.sh

reset:
	@echo "Resetting development environment..."
	./scripts/dev/reset-dev.sh

reset-full:
	@echo "Full reset (including node_modules)..."
	./scripts/dev/reset-dev.sh --full

turbopack-reset:
	@echo "Resetting Turbopack cache..."
	./scripts/dev/turbopack-reset.sh

# Code Quality
types:
	@echo "Running TypeScript type check..."
	npx tsc --noEmit
	@echo "Type check complete"

lint:
	@echo "Running ESLint..."
	npx eslint . --max-warnings=0
	@echo "Lint complete"

search:
ifndef Q
	@echo "Usage: make search Q=pattern"
	@echo "Example: make search Q=SystemComms"
else
	@echo "Searching src/ for: $(Q)"
	@grep -rni "$(Q)" src --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" || echo "No matches found"
endif

# Setup
doctor:
	@./scripts/dev/doctor.sh || (echo "" && echo "Fix the issues above, then run 'make doctor' again." && exit 1)

diagnostics:
	@echo "Collecting diagnostics (environment and git state)..."
	./scripts/dev/collect-diagnostics.sh

preflight:
	@echo "Running full preflight checks (doctor, types, lint, API tests, admin tests)..."
	./scripts/dev/preflight.sh

install-hooks:
	@echo "Installing Git pre-push hook (runs make preflight before push)..."
	./scripts/dev/install-git-hooks.sh

# Documentation helpers
docs-nav:
	@echo "Regenerating docs/INDEX.md and docs/NAV.md..."
	@./scripts/dev/gen-docs-nav.sh
