#!/bin/bash
# check-env-vars.sh
# Prints required environment variable names and whether they are set locally.
# DOES NOT print values - only checks existence.

echo "ClubOS Environment Variable Check"
echo "================================="
echo ""

# Required variables
REQUIRED_VARS=(
    "DATABASE_URL"
    "CRON_SECRET"
)

# Optional variables
OPTIONAL_VARS=(
    "NEXT_PUBLIC_ENV"
    "NEXT_PUBLIC_BASE_URL"
    "APP_VERSION"
    "BUILD_TIME"
    "GIT_COMMIT"
    "TRANSITION_WIDGET_LEAD_DAYS"
)

echo "Required Variables:"
echo "-------------------"
for var in "${REQUIRED_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        echo "[OK]  $var is set"
    else
        echo "[!!]  $var is NOT set"
    fi
done

echo ""
echo "Optional Variables:"
echo "-------------------"
for var in "${OPTIONAL_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        echo "[OK]  $var is set"
    else
        echo "[--]  $var is not set (optional)"
    fi
done

echo ""
echo "Note: This script only checks if variables are set, not their values."
echo "For Netlify env vars, use: netlify env:list"
