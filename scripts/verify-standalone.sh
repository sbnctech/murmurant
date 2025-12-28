#!/bin/bash
# Verify ClubOS can typecheck without WA env vars

echo "=== Verifying Standalone Mode ==="

# Unset all WA env vars
unset WA_API_KEY
unset WA_ACCOUNT_ID
unset WA_CLIENT_ID
unset WA_CLIENT_SECRET

# Run typecheck
echo "Running typecheck without WA env vars..."
npm run typecheck

if [ $? -eq 0 ]; then
  echo "✅ Standalone mode: TypeScript compiles successfully"
  exit 0
else
  echo "❌ Standalone mode: TypeScript compilation failed"
  exit 1
fi
