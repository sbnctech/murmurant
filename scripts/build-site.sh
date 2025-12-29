#!/bin/bash
# build-site.sh
# Builds the Murmurant Next.js application for production deployment.
#
# Usage:
#   ./scripts/build-site.sh
#
# Output:
#   .next/              - Compiled Next.js application
#   .next/standalone/   - Standalone server (if enabled in next.config)
#   .next/static/       - Static assets
#
# Prerequisites:
#   - Node.js 20+ (22 recommended)
#   - npm dependencies installed
#   - DATABASE_URL set (for Prisma client generation)
#
# Exit codes:
#   0 - Success
#   1 - Prerequisites check failed
#   2 - Build failed
#   3 - Verification failed

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "Murmurant Build Script"
echo "========================================"
echo ""

# -----------------------------------------------------------------------------
# Step 1: Check prerequisites
# -----------------------------------------------------------------------------
echo "Step 1: Checking prerequisites..."

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ -z "$NODE_VERSION" ]; then
    echo -e "${RED}[FAIL]${NC} Node.js not found"
    exit 1
fi
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}[FAIL]${NC} Node.js 20+ required (found v$NODE_VERSION)"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Node.js v$(node --version | sed 's/v//')"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[FAIL]${NC} npm not found"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} npm $(npm --version)"

# Check node_modules
if [ ! -d "$ROOT_DIR/node_modules" ]; then
    echo -e "${YELLOW}[WARN]${NC} node_modules not found, running npm install..."
    cd "$ROOT_DIR" && npm ci
fi
echo -e "${GREEN}[OK]${NC} node_modules present"

# Check DATABASE_URL (required for Prisma)
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}[WARN]${NC} DATABASE_URL not set"
    echo "         Prisma generate may fail without database connection"
    echo "         Set DATABASE_URL or use: export DATABASE_URL='postgresql://...'"
fi

echo ""

# -----------------------------------------------------------------------------
# Step 2: Generate Prisma client
# -----------------------------------------------------------------------------
echo "Step 2: Generating Prisma client..."
cd "$ROOT_DIR"

if npx prisma generate 2>/dev/null; then
    echo -e "${GREEN}[OK]${NC} Prisma client generated"
else
    echo -e "${RED}[FAIL]${NC} Prisma generate failed"
    exit 2
fi

echo ""

# -----------------------------------------------------------------------------
# Step 3: Run Next.js build
# -----------------------------------------------------------------------------
echo "Step 3: Building Next.js application..."
echo "         This may take 1-3 minutes..."
echo ""

cd "$ROOT_DIR"
if npm run build; then
    echo ""
    echo -e "${GREEN}[OK]${NC} Next.js build completed"
else
    echo ""
    echo -e "${RED}[FAIL]${NC} Next.js build failed"
    exit 2
fi

echo ""

# -----------------------------------------------------------------------------
# Step 4: Verify output
# -----------------------------------------------------------------------------
echo "Step 4: Verifying build output..."

EXPECTED_FILES=(
    ".next/BUILD_ID"
    ".next/build-manifest.json"
    ".next/package.json"
)

ALL_PRESENT=true
for file in "${EXPECTED_FILES[@]}"; do
    if [ -f "$ROOT_DIR/$file" ]; then
        echo -e "${GREEN}[OK]${NC} $file"
    else
        echo -e "${RED}[MISSING]${NC} $file"
        ALL_PRESENT=false
    fi
done

# Check static directory
if [ -d "$ROOT_DIR/.next/static" ]; then
    STATIC_COUNT=$(find "$ROOT_DIR/.next/static" -type f | wc -l | tr -d ' ')
    echo -e "${GREEN}[OK]${NC} .next/static/ ($STATIC_COUNT files)"
else
    echo -e "${RED}[MISSING]${NC} .next/static/"
    ALL_PRESENT=false
fi

# Check server directory
if [ -d "$ROOT_DIR/.next/server" ]; then
    echo -e "${GREEN}[OK]${NC} .next/server/"
else
    echo -e "${RED}[MISSING]${NC} .next/server/"
    ALL_PRESENT=false
fi

if [ "$ALL_PRESENT" = false ]; then
    echo ""
    echo -e "${RED}[FAIL]${NC} Build verification failed - some files missing"
    exit 3
fi

echo ""
echo "========================================"
echo -e "${GREEN}BUILD SUCCESSFUL${NC}"
echo "========================================"
echo ""
echo "Output directory: $ROOT_DIR/.next"
echo ""
echo "To deploy:"
echo "  - Netlify: Push to main or sandbox branch"
echo "  - Manual:  Use npm run start (requires .next + node_modules)"
echo ""
echo "To create install pack:"
echo "  ./scripts/make-install-pack.sh"
echo ""
