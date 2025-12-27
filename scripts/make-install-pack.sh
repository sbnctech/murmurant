#!/bin/bash
# make-install-pack.sh
# Creates a distributable install pack for ClubOS.
#
# Usage:
#   ./scripts/make-install-pack.sh [--skip-build]
#
# Options:
#   --skip-build    Skip the build step (use existing .next)
#
# Output:
#   dist/clubos-pack/           - Unpacked artifacts
#   dist/clubos-pack.zip        - Zipped pack ready for distribution
#
# Pack contents:
#   - .next/                    - Compiled Next.js application
#   - prisma/schema.prisma      - Database schema
#   - package.json              - Dependencies manifest
#   - package-lock.json         - Locked dependencies
#   - INSTALL.md                - Installation instructions
#
# Prerequisites:
#   - Run from repository root
#   - zip command available (macOS: built-in)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
PACK_DIR="$DIST_DIR/clubos-pack"
PACK_ZIP="$DIST_DIR/clubos-pack.zip"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Parse arguments
SKIP_BUILD=false
for arg in "$@"; do
    case $arg in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
    esac
done

echo "========================================"
echo "ClubOS Install Pack Generator"
echo "========================================"
echo ""

# -----------------------------------------------------------------------------
# Step 1: Check prerequisites
# -----------------------------------------------------------------------------
echo "Step 1: Checking prerequisites..."

# Check zip
if ! command -v zip &> /dev/null; then
    echo -e "${RED}[FAIL]${NC} zip command not found"
    echo "         macOS: Should be built-in. Try: xcode-select --install"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} zip available"

echo ""

# -----------------------------------------------------------------------------
# Step 2: Build (unless skipped)
# -----------------------------------------------------------------------------
if [ "$SKIP_BUILD" = true ]; then
    echo "Step 2: Build skipped (--skip-build)"

    # Verify .next exists
    if [ ! -d "$ROOT_DIR/.next" ] || [ ! -f "$ROOT_DIR/.next/BUILD_ID" ]; then
        echo -e "${RED}[FAIL]${NC} No valid build found in .next/"
        echo "         Run without --skip-build or run build-site.sh first"
        exit 1
    fi
    echo -e "${GREEN}[OK]${NC} Existing build found"
else
    echo "Step 2: Running build..."
    echo ""

    if ! "$SCRIPT_DIR/build-site.sh"; then
        echo -e "${RED}[FAIL]${NC} Build failed"
        exit 1
    fi
fi

echo ""

# -----------------------------------------------------------------------------
# Step 3: Clean dist directory
# -----------------------------------------------------------------------------
echo "Step 3: Preparing dist directory..."

rm -rf "$PACK_DIR" "$PACK_ZIP"
mkdir -p "$PACK_DIR"

echo -e "${GREEN}[OK]${NC} Created $PACK_DIR"
echo ""

# -----------------------------------------------------------------------------
# Step 4: Copy artifacts
# -----------------------------------------------------------------------------
echo "Step 4: Copying artifacts..."

# Copy .next directory
echo "         Copying .next/..."
cp -r "$ROOT_DIR/.next" "$PACK_DIR/"
echo -e "${GREEN}[OK]${NC} .next/"

# Copy prisma schema
echo "         Copying prisma/..."
mkdir -p "$PACK_DIR/prisma"
cp "$ROOT_DIR/prisma/schema.prisma" "$PACK_DIR/prisma/"
echo -e "${GREEN}[OK]${NC} prisma/schema.prisma"

# Copy package files
cp "$ROOT_DIR/package.json" "$PACK_DIR/"
cp "$ROOT_DIR/package-lock.json" "$PACK_DIR/"
echo -e "${GREEN}[OK]${NC} package.json, package-lock.json"

# Copy public directory if exists
if [ -d "$ROOT_DIR/public" ]; then
    cp -r "$ROOT_DIR/public" "$PACK_DIR/"
    echo -e "${GREEN}[OK]${NC} public/"
fi

# Create INSTALL.md
cat > "$PACK_DIR/INSTALL.md" << 'EOF'
# ClubOS Install Pack

This pack contains a pre-built ClubOS application ready for deployment.

## Contents

- `.next/` - Compiled Next.js application
- `prisma/schema.prisma` - Database schema
- `package.json` - Dependencies manifest
- `package-lock.json` - Locked dependencies
- `public/` - Static assets (if present)

## Installation Steps

### 1. Prerequisites

- Node.js 20+ (22 recommended)
- PostgreSQL database (Neon recommended)
- npm

### 2. Install Dependencies

```bash
npm ci --omit=dev
npx prisma generate
```

### 3. Configure Environment

Create a `.env` file:

```bash
DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"
CRON_SECRET="your-random-secret-string"
NEXT_PUBLIC_ENV="production"
```

### 4. Push Database Schema

```bash
npx prisma db push
```

### 5. Start the Application

```bash
npm run start
```

The application will be available at http://localhost:3000

## Deployment

For Netlify deployment, see: docs/deployment/NETLIFY.md

## Troubleshooting

### "Cannot find module" errors

Run `npm ci` again to ensure dependencies are installed.

### Database connection errors

Verify DATABASE_URL is set correctly and the database is accessible.

### Prisma client errors

Run `npx prisma generate` to regenerate the Prisma client.
EOF

echo -e "${GREEN}[OK]${NC} INSTALL.md"
echo ""

# -----------------------------------------------------------------------------
# Step 5: Create zip archive
# -----------------------------------------------------------------------------
echo "Step 5: Creating zip archive..."

cd "$DIST_DIR"
zip -rq "clubos-pack.zip" "clubos-pack"

# Get file size
PACK_SIZE=$(du -h "$PACK_ZIP" | cut -f1)
echo -e "${GREEN}[OK]${NC} Created clubos-pack.zip ($PACK_SIZE)"
echo ""

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
echo "========================================"
echo -e "${GREEN}PACK CREATED SUCCESSFULLY${NC}"
echo "========================================"
echo ""
echo "Pack location: $PACK_ZIP"
echo "Pack size:     $PACK_SIZE"
echo ""
echo "Contents:"
echo "  - .next/              (compiled app)"
echo "  - prisma/             (database schema)"
echo "  - package.json        (dependencies)"
echo "  - package-lock.json   (locked versions)"
echo "  - public/             (static assets)"
echo "  - INSTALL.md          (instructions)"
echo ""
echo "To verify contents:"
echo "  unzip -l $PACK_ZIP | head -20"
echo ""
