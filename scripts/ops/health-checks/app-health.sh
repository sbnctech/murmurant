#!/bin/bash
# =============================================================================
# Murmurant Application Health Check
# =============================================================================
# Purpose: Verify application is running and responding to requests
# Usage: ./app-health.sh [--verbose] [base_url]
# Exit codes: 0 = healthy, 1 = unhealthy, 2 = error
# =============================================================================

set -euo pipefail

VERBOSE="${1:-}"
BASE_URL="${2:-http://localhost:3000}"

# Handle --verbose as first arg
if [[ "$VERBOSE" == "--verbose" ]]; then
    BASE_URL="${2:-http://localhost:3000}"
elif [[ "$VERBOSE" == http* ]]; then
    BASE_URL="$VERBOSE"
    VERBOSE=""
fi

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

# Check if curl is available
check_curl() {
    if ! command -v curl &> /dev/null; then
        log_error "curl is required but not installed"
        exit 2
    fi
}

# Check health endpoint
check_health_endpoint() {
    log_info "Checking health endpoint..."

    local url="${BASE_URL}/api/health"
    local response
    local http_code

    log_verbose "GET $url"

    response=$(curl -s -w "\n%{http_code}" "$url" 2>&1) || {
        log_error "Failed to connect to $url"
        return 1
    }

    http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')

    log_verbose "HTTP $http_code: $body"

    if [[ "$http_code" == "200" ]]; then
        log_info "Health endpoint: OK (HTTP 200)"
        return 0
    else
        log_error "Health endpoint: FAILED (HTTP $http_code)"
        return 1
    fi
}

# Check public page loads
check_public_page() {
    log_info "Checking public page..."

    local url="${BASE_URL}/"
    local http_code

    log_verbose "GET $url"

    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>&1) || {
        log_error "Failed to connect to $url"
        return 1
    }

    if [[ "$http_code" == "200" ]] || [[ "$http_code" == "304" ]]; then
        log_info "Public page: OK (HTTP $http_code)"
        return 0
    else
        log_error "Public page: FAILED (HTTP $http_code)"
        return 1
    fi
}

# Check API responds
check_api_response() {
    log_info "Checking API response..."

    local url="${BASE_URL}/api/events"
    local http_code

    log_verbose "GET $url"

    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>&1) || {
        log_error "Failed to connect to $url"
        return 1
    }

    # 200 = OK, 401 = Unauthorized (expected for protected endpoints)
    if [[ "$http_code" == "200" ]] || [[ "$http_code" == "401" ]]; then
        log_info "API response: OK (HTTP $http_code)"
        return 0
    else
        log_error "API response: FAILED (HTTP $http_code)"
        return 1
    fi
}

# Check response time
check_response_time() {
    log_info "Checking response time..."

    local url="${BASE_URL}/api/health"
    local time_total

    time_total=$(curl -s -o /dev/null -w "%{time_total}" "$url" 2>&1) || {
        log_warn "Failed to measure response time"
        return 0
    }

    # Convert to milliseconds
    local time_ms=$(echo "$time_total * 1000" | bc 2>/dev/null || echo "0")

    log_verbose "Response time: ${time_ms}ms"

    # Warn if > 1000ms
    if (( $(echo "$time_total > 1.0" | bc -l 2>/dev/null || echo "0") )); then
        log_warn "Response time: SLOW (${time_ms}ms)"
    else
        log_info "Response time: OK (${time_ms}ms)"
    fi

    return 0
}

# Main health check
main() {
    log_info "=== Murmurant Application Health Check ==="
    log_info "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    log_info "Target: $BASE_URL"

    local exit_code=0

    check_curl

    check_health_endpoint || exit_code=1
    check_public_page || exit_code=1
    check_api_response || exit_code=1
    check_response_time || true  # Non-critical

    echo ""
    if [[ $exit_code -eq 0 ]]; then
        log_info "=== Health Check: PASSED ==="
    else
        log_error "=== Health Check: FAILED ==="
    fi

    exit $exit_code
}

main "$@"
