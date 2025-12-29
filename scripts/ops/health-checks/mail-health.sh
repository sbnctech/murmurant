#!/usr/bin/env bash
#
# Mail Health Check Script
#
# Verifies email system configuration and connectivity.
# Exit codes:
#   0 - All checks passed
#   1 - One or more checks failed
#   2 - Script error (missing dependencies, etc.)
#
# Usage:
#   ./scripts/ops/health-checks/mail-health.sh
#
# Environment:
#   MAIL_API_KEY or RESEND_API_KEY or SENDGRID_API_KEY - Mail provider API key
#   MAIL_FROM_ADDRESS - Sender email address
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "============================================================"
echo "  Murmurant Mail Health Check"
echo "============================================================"
echo ""

OVERALL_STATUS="ok"
WARNINGS=()
ERRORS=()

# Check for mail provider API key
echo "Checking mail provider configuration..."
echo ""

MAIL_PROVIDER="unknown"

if [[ -n "${RESEND_API_KEY:-}" ]]; then
    echo -e "${GREEN}[OK]${NC} RESEND_API_KEY is set"
    MAIL_PROVIDER="resend"
    API_KEY="${RESEND_API_KEY}"
elif [[ -n "${SENDGRID_API_KEY:-}" ]]; then
    echo -e "${GREEN}[OK]${NC} SENDGRID_API_KEY is set"
    MAIL_PROVIDER="sendgrid"
    API_KEY="${SENDGRID_API_KEY}"
elif [[ -n "${MAIL_API_KEY:-}" ]]; then
    echo -e "${GREEN}[OK]${NC} MAIL_API_KEY is set"
    MAIL_PROVIDER="generic"
    API_KEY="${MAIL_API_KEY}"
else
    echo -e "${RED}[FAIL]${NC} No mail provider API key found"
    echo "       Set one of: RESEND_API_KEY, SENDGRID_API_KEY, or MAIL_API_KEY"
    ERRORS+=("Mail provider API key not configured")
    OVERALL_STATUS="fail"
fi

# Check sender address
if [[ -n "${MAIL_FROM_ADDRESS:-}" ]]; then
    echo -e "${GREEN}[OK]${NC} MAIL_FROM_ADDRESS: ${MAIL_FROM_ADDRESS}"
else
    echo -e "${YELLOW}[WARN]${NC} MAIL_FROM_ADDRESS not set"
    WARNINGS+=("Sender address not configured")
    if [[ "$OVERALL_STATUS" == "ok" ]]; then
        OVERALL_STATUS="warn"
    fi
fi

# Check reply-to address
if [[ -n "${MAIL_REPLY_TO:-}" ]]; then
    echo -e "${GREEN}[OK]${NC} MAIL_REPLY_TO: ${MAIL_REPLY_TO}"
else
    echo -e "${YELLOW}[INFO]${NC} MAIL_REPLY_TO not set (optional)"
fi

echo ""

# Provider-specific connectivity tests
if [[ "$MAIL_PROVIDER" == "resend" && -n "${API_KEY:-}" ]]; then
    echo "Testing Resend API connectivity..."

    if command -v curl &> /dev/null; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer ${API_KEY}" \
            "https://api.resend.com/domains" 2>&1) || HTTP_CODE="000"

        if [[ "$HTTP_CODE" == "200" ]]; then
            echo -e "${GREEN}[OK]${NC} Resend API reachable (HTTP ${HTTP_CODE})"
        elif [[ "$HTTP_CODE" == "401" ]]; then
            echo -e "${RED}[FAIL]${NC} Resend API key is invalid (HTTP 401)"
            ERRORS+=("Resend API key invalid")
            OVERALL_STATUS="fail"
        elif [[ "$HTTP_CODE" == "000" ]]; then
            echo -e "${YELLOW}[WARN]${NC} Could not reach Resend API"
            WARNINGS+=("Could not verify Resend API connectivity")
        else
            echo -e "${YELLOW}[WARN]${NC} Resend API returned HTTP ${HTTP_CODE}"
            WARNINGS+=("Unexpected Resend API response")
        fi
    else
        echo -e "${YELLOW}[SKIP]${NC} curl not available; skipping API test"
    fi
    echo ""
fi

if [[ "$MAIL_PROVIDER" == "sendgrid" && -n "${API_KEY:-}" ]]; then
    echo "Testing SendGrid API connectivity..."

    if command -v curl &> /dev/null; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer ${API_KEY}" \
            "https://api.sendgrid.com/v3/user/profile" 2>&1) || HTTP_CODE="000"

        if [[ "$HTTP_CODE" == "200" ]]; then
            echo -e "${GREEN}[OK]${NC} SendGrid API reachable (HTTP ${HTTP_CODE})"
        elif [[ "$HTTP_CODE" == "401" ]]; then
            echo -e "${RED}[FAIL]${NC} SendGrid API key is invalid (HTTP 401)"
            ERRORS+=("SendGrid API key invalid")
            OVERALL_STATUS="fail"
        elif [[ "$HTTP_CODE" == "000" ]]; then
            echo -e "${YELLOW}[WARN]${NC} Could not reach SendGrid API"
            WARNINGS+=("Could not verify SendGrid API connectivity")
        else
            echo -e "${YELLOW}[WARN]${NC} SendGrid API returned HTTP ${HTTP_CODE}"
            WARNINGS+=("Unexpected SendGrid API response")
        fi
    else
        echo -e "${YELLOW}[SKIP]${NC} curl not available; skipping API test"
    fi
    echo ""
fi

# DNS checks for sender domain
if [[ -n "${MAIL_FROM_ADDRESS:-}" ]]; then
    SENDER_DOMAIN="${MAIL_FROM_ADDRESS#*@}"
    echo "Checking DNS for sender domain: ${SENDER_DOMAIN}"

    if command -v dig &> /dev/null; then
        # Check SPF
        SPF_RECORD=$(dig +short TXT "${SENDER_DOMAIN}" 2>/dev/null | grep -i "v=spf1" || true)
        if [[ -n "$SPF_RECORD" ]]; then
            echo -e "${GREEN}[OK]${NC} SPF record found"
        else
            echo -e "${YELLOW}[WARN]${NC} No SPF record found for ${SENDER_DOMAIN}"
            WARNINGS+=("SPF record not configured")
        fi

        # Check DMARC
        DMARC_RECORD=$(dig +short TXT "_dmarc.${SENDER_DOMAIN}" 2>/dev/null | grep -i "v=DMARC1" || true)
        if [[ -n "$DMARC_RECORD" ]]; then
            echo -e "${GREEN}[OK]${NC} DMARC record found"
        else
            echo -e "${YELLOW}[WARN]${NC} No DMARC record found for ${SENDER_DOMAIN}"
            WARNINGS+=("DMARC record not configured")
        fi
    else
        echo -e "${YELLOW}[SKIP]${NC} dig not available; skipping DNS checks"
    fi
    echo ""
fi

# Summary
echo "============================================================"
echo ""
echo "Mail Provider: ${MAIL_PROVIDER}"
echo ""

if [[ ${#ERRORS[@]} -gt 0 ]]; then
    echo "Errors:"
    for err in "${ERRORS[@]}"; do
        echo "  - ${err}"
    done
    echo ""
fi

if [[ ${#WARNINGS[@]} -gt 0 ]]; then
    echo "Warnings:"
    for warn in "${WARNINGS[@]}"; do
        echo "  - ${warn}"
    done
    echo ""
fi

echo "============================================================"

# Final status
if [[ "$OVERALL_STATUS" == "ok" ]]; then
    echo -e "  ${GREEN}Mail Health Check PASSED${NC}"
    echo "============================================================"
    echo ""
    exit 0
elif [[ "$OVERALL_STATUS" == "warn" ]]; then
    echo -e "  ${YELLOW}Mail Health Check PASSED WITH WARNINGS${NC}"
    echo "============================================================"
    echo ""
    echo "Recommendations:"
    echo "  1. Configure missing environment variables"
    echo "  2. Set up SPF, DKIM, and DMARC records for better deliverability"
    echo ""
    echo "See: docs/OPS/runbooks/MAIL_RUNBOOK.md"
    echo ""
    exit 0
else
    echo -e "  ${RED}Mail Health Check FAILED${NC}"
    echo "============================================================"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Set mail provider API key (RESEND_API_KEY, SENDGRID_API_KEY)"
    echo "  2. Set MAIL_FROM_ADDRESS to a valid sender address"
    echo "  3. Verify API key is valid in provider dashboard"
    echo ""
    echo "See: docs/OPS/runbooks/MAIL_RUNBOOK.md"
    echo ""
    exit 1
fi
