# SBNC Inline-Only Widget Hosting Guide

```
Audience: SBNC Technical Staff, Operators
Purpose: Deploy inline-only widget build to static hosting
Prerequisites: macOS with zsh, git, npm installed
```

---

## Overview

This guide provides step-by-step instructions for hosting the inline-only widget build output on static hosting services. No server is required.

**What is the inline-only widget build?**

The inline-only build produces static HTML, CSS, and JavaScript files that can be embedded in external websites. These files are self-contained and require only static file hosting.

**Build output location:** `dist/inline-widget/`

**Contents:**

```
dist/inline-widget/
  index.html        # Demo/test page
  widget.js         # Main widget bundle
  widget.css        # Widget styles
  assets/           # Static assets (images, fonts)
```

---

## Prerequisites

Before starting, ensure you have:

```zsh
# Verify git is installed
git --version

# Verify npm is installed
npm --version

# Verify you have the repository cloned
cd ~/murmurant && pwd
```

---

## Build the Inline-Only Widget

Run these commands from the repository root:

```zsh
# Navigate to repository
cd ~/murmurant

# Install dependencies (if not already done)
npm ci

# Build the inline-only widget
npm run build:inline-widget

# Verify build output exists
ls -la dist/inline-widget/
```

Expected output:

```
total 48
drwxr-xr-x  5 user  staff   160 Dec 26 10:00 .
drwxr-xr-x  3 user  staff    96 Dec 26 10:00 ..
-rw-r--r--  1 user  staff  1234 Dec 26 10:00 index.html
-rw-r--r--  1 user  staff 15678 Dec 26 10:00 widget.js
-rw-r--r--  1 user  staff  4567 Dec 26 10:00 widget.css
drwxr-xr-x  3 user  staff    96 Dec 26 10:00 assets
```

---

## Option A: GitHub Pages

### A1. Create a GitHub Pages Repository

```zsh
# Create a new directory for the GitHub Pages site
mkdir -p ~/sbnc-widget-host
cd ~/sbnc-widget-host

# Initialize git repository
git init

# Create a README
echo "# SBNC Widget Host" > README.md
echo "" >> README.md
echo "Static hosting for SBNC inline widgets." >> README.md

# Create .nojekyll to disable Jekyll processing
touch .nojekyll

# Initial commit
git add .
git commit -m "Initial commit"
```

### A2. Copy Build Output

```zsh
# Copy the inline widget build to the hosting repo
cp -R ~/murmurant/dist/inline-widget/* ~/sbnc-widget-host/

# Verify files were copied
ls -la ~/sbnc-widget-host/
```

### A3. Push to GitHub

```zsh
cd ~/sbnc-widget-host

# Add all files
git add .

# Commit
git commit -m "Deploy inline widget build"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/sbnctech/sbnc-widget-host.git

# Push to main branch
git push -u origin main
```

### A4. Enable GitHub Pages

1. Go to repository Settings > Pages
2. Source: Deploy from a branch
3. Branch: main, folder: / (root)
4. Click Save

### A5. Verify Deployment

```zsh
# Wait 1-2 minutes for GitHub Pages to deploy
# Then open in browser:
open "https://sbnctech.github.io/sbnc-widget-host/"
```

Your widget is now available at:

- Demo page: `https://sbnctech.github.io/sbnc-widget-host/`
- Widget JS: `https://sbnctech.github.io/sbnc-widget-host/widget.js`
- Widget CSS: `https://sbnctech.github.io/sbnc-widget-host/widget.css`

### A6. Update Deployment (Future Updates)

```zsh
# After rebuilding the widget in murmurant:
cd ~/murmurant
npm run build:inline-widget

# Copy to hosting repo
cp -R ~/murmurant/dist/inline-widget/* ~/sbnc-widget-host/

# Commit and push
cd ~/sbnc-widget-host
git add .
git commit -m "Update widget build $(date +%Y-%m-%d)"
git push origin main
```

---

## Option B: Netlify

### B1. Create Netlify Site Directory

```zsh
# Create a new directory for Netlify deployment
mkdir -p ~/sbnc-widget-netlify
cd ~/sbnc-widget-netlify

# Copy the inline widget build
cp -R ~/murmurant/dist/inline-widget/* ~/sbnc-widget-netlify/

# Verify files
ls -la
```

### B2. Install Netlify CLI

```zsh
# Install Netlify CLI globally
npm install -g netlify-cli

# Verify installation
netlify --version

# Login to Netlify (opens browser)
netlify login
```

### B3. Deploy to Netlify

```zsh
cd ~/sbnc-widget-netlify

# Create new Netlify site and deploy
netlify deploy --prod --dir=.

# Follow the prompts:
# - Create & configure a new site: Yes
# - Team: (select your team)
# - Site name: sbnc-inline-widget (or leave blank for random)
```

Expected output:

```
Deploy path: /Users/you/sbnc-widget-netlify
Deploying to main site URL...

Logs:              https://app.netlify.com/sites/sbnc-inline-widget/deploys/...
Unique Deploy URL: https://12345678--sbnc-inline-widget.netlify.app
Website URL:       https://sbnc-inline-widget.netlify.app
```

### B4. Verify Deployment

```zsh
# Open the deployed site
open "https://sbnc-inline-widget.netlify.app"
```

Your widget is now available at:

- Demo page: `https://sbnc-inline-widget.netlify.app/`
- Widget JS: `https://sbnc-inline-widget.netlify.app/widget.js`
- Widget CSS: `https://sbnc-inline-widget.netlify.app/widget.css`

### B5. Update Deployment (Future Updates)

```zsh
# After rebuilding the widget in murmurant:
cd ~/murmurant
npm run build:inline-widget

# Copy to Netlify directory
cp -R ~/murmurant/dist/inline-widget/* ~/sbnc-widget-netlify/

# Deploy update
cd ~/sbnc-widget-netlify
netlify deploy --prod --dir=.
```

### B6. Alternative: Drag-and-Drop Deploy

If you prefer not to use the CLI:

1. Go to https://app.netlify.com/drop
2. Drag the `dist/inline-widget/` folder onto the page
3. Wait for upload to complete
4. Note the generated URL

---

## Embedding the Widget

Once deployed, embed the widget in any HTML page:

```html
<!-- Add to <head> -->
<link rel="stylesheet" href="https://YOUR-HOST/widget.css">

<!-- Add where you want the widget to appear -->
<div id="sbnc-widget"></div>

<!-- Add before </body> -->
<script src="https://YOUR-HOST/widget.js"></script>
<script>
  SBNCWidget.init({
    container: '#sbnc-widget',
    // Add configuration options here
  });
</script>
```

Replace `YOUR-HOST` with:

- GitHub Pages: `sbnctech.github.io/sbnc-widget-host`
- Netlify: `sbnc-inline-widget.netlify.app`

---

## Troubleshooting

### Build fails with "command not found"

```zsh
# Ensure npm scripts exist
npm run | grep inline

# If missing, the build script may have a different name
# Check package.json for available scripts
cat package.json | grep -A 20 '"scripts"'
```

### GitHub Pages shows 404

```zsh
# Verify .nojekyll exists
ls -la ~/sbnc-widget-host/.nojekyll

# Verify index.html exists at root
ls -la ~/sbnc-widget-host/index.html

# Check GitHub Pages settings in repository
# Settings > Pages > should show "Your site is live at..."
```

### Netlify deploy fails

```zsh
# Check Netlify login status
netlify status

# Re-login if needed
netlify login

# Verify you're in the correct directory
pwd
ls -la
```

### CORS errors when embedding

If you see CORS errors when embedding the widget:

1. Ensure you're using the full URL (not relative paths)
2. For development, use a local server instead of file://
3. Check browser console for specific error messages

---

## Quick Reference

### GitHub Pages Commands

```zsh
# Full deploy from scratch
cd ~/murmurant && npm run build:inline-widget
mkdir -p ~/sbnc-widget-host && cd ~/sbnc-widget-host
git init && touch .nojekyll
cp -R ~/murmurant/dist/inline-widget/* .
git add . && git commit -m "Deploy widget"
git remote add origin https://github.com/sbnctech/sbnc-widget-host.git
git push -u origin main
```

### Netlify Commands

```zsh
# Full deploy from scratch
cd ~/murmurant && npm run build:inline-widget
mkdir -p ~/sbnc-widget-netlify && cd ~/sbnc-widget-netlify
cp -R ~/murmurant/dist/inline-widget/* .
netlify deploy --prod --dir=.
```

### Update Commands

```zsh
# GitHub Pages update
cd ~/murmurant && npm run build:inline-widget
cp -R dist/inline-widget/* ~/sbnc-widget-host/
cd ~/sbnc-widget-host && git add . && git commit -m "Update" && git push

# Netlify update
cd ~/murmurant && npm run build:inline-widget
cp -R dist/inline-widget/* ~/sbnc-widget-netlify/
cd ~/sbnc-widget-netlify && netlify deploy --prod --dir=.
```

---

## Related Documents

- [Embed Widget SDK](../widgets/EMBED_WIDGET_SDK_V1.md) - Widget SDK specification
- [Embedded Widgets Security Model](../widgets/EMBEDDED_WIDGETS_SECURITY_MODEL.md) - Security requirements
- [SBNC Operator Checklist](../OPS/SBNC_OPERATOR_CHECKLIST.md) - Pre-publish, publish, verify, rollback procedures
- [Inline Widget Troubleshooting](../OPS/INLINE_WIDGET_TROUBLESHOOTING.md) - Problem diagnosis and resolution

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-26 | System | Initial hosting guide |
