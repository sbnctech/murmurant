#!/bin/bash
# =============================================================================
# Murmurant Full System Health Check
# =============================================================================
# Purpose: Run all health checks and produce summary report
# Usage: ./full-health.sh [--verbose] [--json]
# Exit codes: 0 = all healthy, 1 = some unhealthy, 2 = error
# =============================================================================

set -euo pipefail

VERBOSE=""
JSON_OUTPUT=""
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse arguments
for arg in "$@"; do
    case $arg in
        --verbose)
            VERBOSE="--verbose"
            ;;
        --json)
            JSON_OUTPUT="true"
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    if [[ -z "$JSON_OUTPUT" ]]; then
        echo -e "${GREEN}[INFO]${NC} $1"
    fi
}

log_error() {
    if [[ -z "$JSON_OUTPUT" ]]; then
        echo -e "${RED}[ERROR]${NC} $1"
    fi
}

# Run a health check and capture result
run_check() {
    local name="$1"
    local script="$2"
    local args="${3:-}"

    local start_time=$(date +%s%N)
    local exit_code=0
    local output=""

    output=$("$script" $args 2>&1) || exit_code=$?

    local end_time=$(date +%s%N)
    local duration_ms=$(( (end_time - start_time) / 1000000 ))

    echo "$name|$exit_code|$duration_ms|$output"
}

# Main
main() {
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local results=()
    local overall_status=0

    if [[ -z "$JSON_OUTPUT" ]]; then
        echo ""
        log_info "╔════════════════════════════════════════════════════════════╗"
        log_info "║           Murmurant Full System Health Check                  ║"
        log_info "╚════════════════════════════════════════════════════════════╝"
        log_info "Timestamp: $timestamp"
        echo ""
    fi

    # Run database health check
    if [[ -z "$JSON_OUTPUT" ]]; then
        log_info "Running database health check..."
    fi
    db_result=$(run_check "database" "$SCRIPT_DIR/db-health.sh" "$VERBOSE")
    results+=("$db_result")

    # Run application health check
    if [[ -z "$JSON_OUTPUT" ]]; then
        log_info "Running application health check..."
    fi
    app_result=$(run_check "application" "$SCRIPT_DIR/app-health.sh" "$VERBOSE")
    results+=("$app_result")

    # Calculate overall status
    for result in "${results[@]}"; do
        local code=$(echo "$result" | cut -d'|' -f2)
        if [[ "$code" != "0" ]]; then
            overall_status=1
        fi
    done

    # Output results
    if [[ -n "$JSON_OUTPUT" ]]; then
        # JSON output
        echo "{"
        echo "  \"timestamp\": \"$timestamp\","
        echo "  \"status\": \"$([ $overall_status -eq 0 ] && echo "healthy" || echo "unhealthy")\","
        echo "  \"checks\": ["

        local first=true
        for result in "${results[@]}"; do
            local name=$(echo "$result" | cut -d'|' -f1)
            local code=$(echo "$result" | cut -d'|' -f2)
            local duration=$(echo "$result" | cut -d'|' -f3)

            if [[ "$first" != "true" ]]; then
                echo ","
            fi
            first=false

            echo -n "    {"
            echo -n "\"name\": \"$name\", "
            echo -n "\"status\": \"$([ "$code" -eq 0 ] && echo "pass" || echo "fail")\", "
            echo -n "\"duration_ms\": $duration"
            echo -n "}"
        done

        echo ""
        echo "  ]"
        echo "}"
    else
        # Human-readable summary
        echo ""
        log_info "═══════════════════════════════════════════════════════════════"
        log_info "                         SUMMARY                               "
        log_info "═══════════════════════════════════════════════════════════════"

        for result in "${results[@]}"; do
            local name=$(echo "$result" | cut -d'|' -f1)
            local code=$(echo "$result" | cut -d'|' -f2)
            local duration=$(echo "$result" | cut -d'|' -f3)

            if [[ "$code" == "0" ]]; then
                echo -e "  ${GREEN}✓${NC} $name (${duration}ms)"
            else
                echo -e "  ${RED}✗${NC} $name (${duration}ms)"
            fi
        done

        echo ""
        if [[ $overall_status -eq 0 ]]; then
            log_info "═══════════════════════════════════════════════════════════════"
            echo -e "  ${GREEN}Overall Status: HEALTHY${NC}"
            log_info "═══════════════════════════════════════════════════════════════"
        else
            log_error "═══════════════════════════════════════════════════════════════"
            echo -e "  ${RED}Overall Status: UNHEALTHY${NC}"
            log_error "═══════════════════════════════════════════════════════════════"
        fi
        echo ""
    fi

    exit $overall_status
}

main "$@"
