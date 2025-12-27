# SBNC Inline-Only Widget Installation

```
Audience: SBNC Technical Staff
Purpose: Build and verify the inline-only widget before hosting
Prerequisites: macOS with zsh, Node.js 18+, npm 9+
```

---

## What is the Inline-Only Widget?

The inline-only widget is a standalone build of ClubOS UI components designed to be embedded in external websites without requiring the full ClubOS application server.

**Use cases:**

- Embed event calendar on sbnewcomers.org
- Display upcoming activities on WordPress site
- Show member-only content via secure embed

**What it is NOT:**

- A full ClubOS instance
- A replacement for the ClubOS admin interface
- An offline-capable application

---

## Step 1: Verify Prerequisites

```zsh
# Check Node.js version (must be 18+)
node --version
# Expected: v18.x.x or higher

# Check npm version (must be 9+)
npm --version
# Expected: 9.x.x or higher

# Check git
git --version
# Expected: git version 2.x.x
```

If Node.js is outdated:

```zsh
# Using Homebrew
brew install node@18

# Or using nvm
nvm install 18
nvm use 18
```

---

## Step 2: Clone and Setup Repository

```zsh
# Clone the repository (if not already done)
git clone https://github.com/sbnctech/clubos.git ~/clubos

# Navigate to repository
cd ~/clubos

# Verify you're on main branch
git checkout main
git pull origin main

# Install dependencies
npm ci
```

---

## Step 3: Build the Inline-Only Widget

```zsh
# Run the inline widget build
npm run build:inline-widget
```

Expected output:

```
> clubos@1.0.0 build:inline-widget
> vite build --config vite.inline.config.ts

vite v5.x.x building for production...
transforming...
rendering chunks...
computing gzip size...

dist/inline-widget/widget.js     15.23 kB | gzip: 5.12 kB
dist/inline-widget/widget.css     4.56 kB | gzip: 1.23 kB
dist/inline-widget/index.html     1.23 kB | gzip: 0.45 kB

Build completed in 2.34s
```

---

## Step 4: Verify Build Output

```zsh
# List build output
ls -la dist/inline-widget/

# Verify essential files exist
test -f dist/inline-widget/index.html && echo "OK: index.html"
test -f dist/inline-widget/widget.js && echo "OK: widget.js"
test -f dist/inline-widget/widget.css && echo "OK: widget.css"
```

Expected output:

```
OK: index.html
OK: widget.js
OK: widget.css
```

---

## Step 5: Test Locally

```zsh
# Start a local server to test the build
cd dist/inline-widget
python3 -m http.server 8080
```

Then open in browser:

```zsh
# In a new terminal tab
open http://localhost:8080
```

You should see the widget demo page. Press Ctrl+C to stop the server.

---

## Step 6: Deploy to Hosting

See [SBNC_HOSTING_GUIDE.md](./SBNC_HOSTING_GUIDE.md) for deployment instructions:

- **Option A**: GitHub Pages (free, simple)
- **Option B**: Netlify (free tier, more features)

---

## Build Configuration

The inline widget build uses a separate Vite configuration:

| Setting | Value | Purpose |
|---------|-------|---------|
| Entry point | `src/inline-widget/index.tsx` | Widget entry |
| Output directory | `dist/inline-widget/` | Build output |
| Bundle format | IIFE | Browser-compatible |
| Source maps | Disabled (production) | Smaller bundle |
| Minification | Enabled | Smaller bundle |

---

## Troubleshooting

### "npm run build:inline-widget" not found

```zsh
# Check if the script exists
npm run | grep inline

# If missing, verify you're on the correct branch
git branch
git checkout main
git pull origin main
```

### Build fails with dependency errors

```zsh
# Clean install dependencies
rm -rf node_modules
rm -f package-lock.json
npm install
npm run build:inline-widget
```

### Build output is empty

```zsh
# Check for build errors
npm run build:inline-widget 2>&1 | tee build.log

# Review the log
cat build.log | grep -i error
```

### Widget doesn't load in browser

```zsh
# Check console for errors
# Open browser developer tools (Cmd+Option+I)
# Look at Console and Network tabs

# Verify file permissions
chmod -R 644 dist/inline-widget/*
chmod 755 dist/inline-widget/
```

---

## Security Notes

1. **No secrets in build**: The inline widget build contains no API keys, tokens, or credentials.

2. **Server-side auth required**: The widget must communicate with a ClubOS backend for any authenticated data.

3. **CORS configuration**: The ClubOS backend must allow the hosting domain in its CORS settings.

4. **CSP headers**: If your host site has Content Security Policy, add the widget host to allowed script sources.

---

## Related Documents

- [SBNC_HOSTING_GUIDE.md](./SBNC_HOSTING_GUIDE.md) - Deployment to GitHub Pages and Netlify
- [../widgets/EMBED_WIDGET_SDK_V1.md](../widgets/EMBED_WIDGET_SDK_V1.md) - Widget SDK specification
- [../widgets/EMBEDDED_WIDGETS_SECURITY_MODEL.md](../widgets/EMBEDDED_WIDGETS_SECURITY_MODEL.md) - Security model
- [SBNC Operator Checklist](../OPS/SBNC_OPERATOR_CHECKLIST.md) - Pre-publish, publish, verify, rollback procedures
- [Inline Widget Troubleshooting](../OPS/INLINE_WIDGET_TROUBLESHOOTING.md) - Problem diagnosis and resolution

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-26 | System | Initial installation guide |
