# Build and Pack Scripts

This document describes how to build ClubOS locally and create distributable install packs.

---

## Overview

ClubOS provides two scripts for building and packaging:

| Script | Purpose |
|--------|---------|
| `scripts/build-site.sh` | Builds the Next.js application |
| `scripts/make-install-pack.sh` | Creates a distributable zip package |

---

## build-site.sh

Builds the ClubOS Next.js application for production deployment.

### Usage

```bash
./scripts/build-site.sh
```

### What It Does

1. **Checks prerequisites**
   - Node.js 20+ installed
   - npm available
   - node_modules present (runs `npm ci` if missing)

2. **Generates Prisma client**
   - Runs `npx prisma generate`
   - Requires DATABASE_URL for schema validation

3. **Runs Next.js build**
   - Executes `npm run build`
   - Compiles TypeScript, bundles assets

4. **Verifies output**
   - Checks for required files in `.next/`
   - Reports success/failure

### Output Files

```
.next/
  BUILD_ID              # Unique build identifier
  build-manifest.json   # Build metadata
  package.json          # Runtime package info
  static/               # Static assets (JS, CSS, images)
  server/               # Server-side code
```

### macOS Notes

- Works out of the box on macOS with Homebrew Node.js
- If you see permission errors, check file ownership in node_modules

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "Node.js not found" | Install Node.js 20+ via `brew install node` |
| "Prisma generate failed" | Set DATABASE_URL or check database connection |
| "Build failed" | Check TypeScript errors with `npm run typecheck` |

---

## make-install-pack.sh

Creates a distributable install pack containing everything needed to deploy ClubOS.

### Usage

```bash
# Full build + pack
./scripts/make-install-pack.sh

# Skip build (use existing .next)
./scripts/make-install-pack.sh --skip-build
```

### What It Does

1. Runs `build-site.sh` (unless `--skip-build`)
2. Creates clean `dist/clubos-pack/` directory
3. Copies required artifacts
4. Generates `INSTALL.md` with deployment instructions
5. Creates `dist/clubos-pack.zip`

### Pack Contents

```
clubos-pack/
  .next/              # Compiled Next.js application
  prisma/
    schema.prisma     # Database schema
  package.json        # Dependencies manifest
  package-lock.json   # Locked dependency versions
  public/             # Static assets (if present)
  INSTALL.md          # Installation instructions
```

### Expected Pack Size

- Typical size: 50-100 MB (depends on dependencies)
- Contains compiled code, not source

### Verification

After creating the pack, verify contents:

```bash
# List pack contents
unzip -l dist/clubos-pack.zip | head -30

# Check pack size
du -h dist/clubos-pack.zip

# Test extraction
cd /tmp && unzip ~/path/to/clubos-pack.zip
ls clubos-pack/
```

### Installing from Pack

See the generated `INSTALL.md` inside the pack, or:

```bash
# Extract
unzip clubos-pack.zip
cd clubos-pack

# Install production dependencies
npm ci --omit=dev
npx prisma generate

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Push schema to database
npx prisma db push

# Start
npm run start
```

---

## Exit Codes

### build-site.sh

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Prerequisites check failed |
| 2 | Build failed |
| 3 | Verification failed |

### make-install-pack.sh

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Prerequisites check failed or zip missing |

---

## Related Documentation

- [NETLIFY.md](./NETLIFY.md) - Netlify deployment configuration
- [ENVIRONMENT.md](../runtime/ENVIRONMENT.md) - Environment variables
- [DEPLOYMENT_OVERVIEW.md](./DEPLOYMENT_OVERVIEW.md) - Deployment architecture
