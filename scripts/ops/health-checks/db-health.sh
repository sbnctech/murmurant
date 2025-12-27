#!/bin/bash
# =============================================================================
# ClubOS Database Health Check
# =============================================================================
# Purpose: Verify database connectivity and basic health metrics
# Usage: ./db-health.sh [--verbose]
# Exit codes: 0 = healthy, 1 = unhealthy, 2 = error
# =============================================================================

set -euo pipefail

VERBOSE="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_verbose() {
    if [[ "$VERBOSE" == "--verbose" ]]; then
        echo -e "[DEBUG] $1"
    fi
}

# Check if DATABASE_URL is set
check_env() {
    if [[ -z "${DATABASE_URL:-}" ]]; then
        # Try to load from .env
        if [[ -f "$PROJECT_ROOT/.env" ]]; then
            log_verbose "Loading DATABASE_URL from .env"
            export $(grep -E '^DATABASE_URL=' "$PROJECT_ROOT/.env" | xargs)
        fi
    fi

    if [[ -z "${DATABASE_URL:-}" ]]; then
        log_error "DATABASE_URL not set"
        exit 2
    fi
    log_verbose "DATABASE_URL is configured"
}

# Check database connectivity
check_connectivity() {
    log_info "Checking database connectivity..."

    if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
        log_info "Database connection: OK"
        return 0
    else
        log_error "Database connection: FAILED"
        return 1
    fi
}

# Check migration status
check_migrations() {
    log_info "Checking migration status..."

    local status
    status=$(npx prisma migrate status 2>&1) || true

    if echo "$status" | grep -q "Database schema is up to date"; then
        log_info "Migrations: UP TO DATE"
        return 0
    elif echo "$status" | grep -q "Following migration have not yet been applied"; then
        log_warn "Migrations: PENDING"
        log_verbose "$status"
        return 1
    else
        log_error "Migration status: UNKNOWN"
        log_verbose "$status"
        return 1
    fi
}

# Check table counts
check_table_counts() {
    log_info "Checking table counts..."

    local query="SELECT
        (SELECT COUNT(*) FROM \"Member\") as members,
        (SELECT COUNT(*) FROM \"Event\") as events,
        (SELECT COUNT(*) FROM \"Committee\") as committees;"

    local result
    result=$(npx prisma db execute --stdin <<< "$query" 2>&1) || {
        log_error "Failed to query table counts"
        return 1
    }

    log_verbose "Table counts: $result"
    log_info "Table counts: OK"
    return 0
}

# Check for recent audit log entries
check_audit_log() {
    log_info "Checking audit log..."

    local query="SELECT COUNT(*) FROM \"AuditLog\" WHERE \"createdAt\" > NOW() - INTERVAL '24 hours';"

    local count
    count=$(npx prisma db execute --stdin <<< "$query" 2>&1) || {
        log_warn "Failed to query audit log (table may not exist yet)"
        return 0
    }

    log_verbose "Audit entries (24h): $count"
    log_info "Audit log: OK"
    return 0
}

# Main health check
main() {
    log_info "=== ClubOS Database Health Check ==="
    log_info "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

    local exit_code=0

    check_env

    check_connectivity || exit_code=1

    if [[ $exit_code -eq 0 ]]; then
        check_migrations || exit_code=1
        check_table_counts || exit_code=1
        check_audit_log || true  # Non-critical
    fi

    echo ""
    if [[ $exit_code -eq 0 ]]; then
        log_info "=== Health Check: PASSED ==="
    else
        log_error "=== Health Check: FAILED ==="
    fi

    exit $exit_code
}

main "$@"
