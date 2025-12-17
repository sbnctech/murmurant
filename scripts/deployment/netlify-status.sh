#!/bin/bash
# netlify-status.sh
# Shows current Netlify site configurations and recent deploy status.

echo "ClubOS Netlify Status"
echo "====================="
echo ""

# Check if netlify CLI is available
if ! command -v netlify &> /dev/null; then
    echo "[ERROR] Netlify CLI not found. Install with: npm install -g netlify-cli"
    exit 1
fi

# Site IDs
STAGING_SITE="404d918d-1fe9-4c4a-ba3c-5a6e727a44f5"
PROD_SITE="5b615a0d-e4d9-47f0-894a-88770c5f5bb0"

echo "Staging Site (clubos-staging-sbnc):"
echo "-----------------------------------"
netlify api getSite --data "{\"site_id\": \"$STAGING_SITE\"}" 2>&1 | \
    jq '{url, branch: .build_settings.repo_branch, cmd: .build_settings.cmd}' 2>/dev/null || \
    echo "[ERROR] Could not fetch staging site info"

echo ""
echo "Latest Staging Deploy:"
netlify api listSiteDeploys --data "{\"site_id\": \"$STAGING_SITE\"}" 2>&1 | \
    jq '.[0] | {state, branch, created_at: .created_at}' 2>/dev/null || \
    echo "[ERROR] Could not fetch staging deploys"

echo ""
echo "Production Site (clubos-prod-sbnc):"
echo "-----------------------------------"
netlify api getSite --data "{\"site_id\": \"$PROD_SITE\"}" 2>&1 | \
    jq '{url, branch: .build_settings.repo_branch, cmd: .build_settings.cmd}' 2>/dev/null || \
    echo "[ERROR] Could not fetch production site info"

echo ""
echo "Latest Production Deploy:"
netlify api listSiteDeploys --data "{\"site_id\": \"$PROD_SITE\"}" 2>&1 | \
    jq '.[0] | {state, branch, created_at: .created_at}' 2>/dev/null || \
    echo "[ERROR] Could not fetch production deploys"

echo ""
echo "Quick Health Checks:"
echo "--------------------"

# Staging health
STAGING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://clubos-staging-sbnc.netlify.app/api/health 2>/dev/null)
if [ "$STAGING_STATUS" = "200" ]; then
    echo "[OK]  Staging API: https://clubos-staging-sbnc.netlify.app/api/health"
else
    echo "[!!]  Staging API returned: $STAGING_STATUS"
fi

# Production health
PROD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://clubos-prod-sbnc.netlify.app/api/health 2>/dev/null)
if [ "$PROD_STATUS" = "200" ]; then
    echo "[OK]  Production API: https://clubos-prod-sbnc.netlify.app/api/health"
else
    echo "[!!]  Production API returned: $PROD_STATUS"
fi

echo ""
echo "Done."
