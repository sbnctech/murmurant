# SBNC Murmurant Widget Installation Guide

**For**: SBNC Board Members and Tech Chairs
**Version**: 1.0
**Date**: December 2025

---

## What's In This Package

This package contains two HTML snippets you paste into your Wild Apricot website to display Murmurant widgets:

| File | Purpose | Where to Paste |
|------|---------|----------------|
| `events-calendar.html` | Shows the club event calendar | Your Events or Calendar page |
| `config-widget.html` | Shows widget configuration options | Admin/settings page (optional) |

---

## Before You Start

You need:

- Wild Apricot admin access
- Permission to edit site pages
- The page where you want the widget to appear

No software installation required. Just copy and paste.

---

## Step 1: Open Wild Apricot Page Editor

1. Log in to Wild Apricot admin
2. Go to **Website** > **Site pages**
3. Click the page where you want the widget (e.g., "Events" or "Calendar")
4. Click **Edit** to open the page editor

---

## Step 2: Add a Custom HTML Block

1. In the page editor, click **Add content**
2. Choose **HTML** (or **Content** then switch to HTML mode)
3. This creates an empty HTML block on the page

---

## Step 3: Paste the Widget Code

1. Open the appropriate `.html` file from this package in a text editor:
   - For events: `events-calendar.html`
   - For configuration: `config-widget.html`

2. Select ALL the text (Cmd+A on Mac, Ctrl+A on Windows)

3. Copy it (Cmd+C / Ctrl+C)

4. In Wild Apricot, click inside the HTML block

5. Paste (Cmd+V / Ctrl+V)

6. Click **Save** on the page

---

## Step 4: Preview and Publish

1. Click **Preview** to see how the widget looks
2. If it looks correct, click **Publish**
3. Visit the live page to confirm it works

---

## Customization Options

### Changing Widget Size

Find this line in the HTML:

```html
height="600"
```

Change the number to adjust height:

- `400` - Compact view
- `600` - Standard view (default)
- `800` - Expanded view

### Changing Widget Width

The widget defaults to full width of the page. To set a specific width, find:

```html
width="100%"
```

Change to a specific pixel value:

```html
width="800"
```

---

## Troubleshooting

### Widget shows blank or error

- Verify you copied ALL the HTML (nothing cut off)
- Check that you pasted into an HTML block, not a text block
- Clear your browser cache and reload

### Widget shows "Loading..." forever

- Check your internet connection
- The Murmurant server may be temporarily unavailable
- Wait a few minutes and refresh

### Widget looks squished or cut off

- Increase the `height` value in the HTML
- Make sure the containing element is wide enough

### Need help?

Contact your SBNC technology coordinator or email support.

---

## Security Notes

- These widgets run in a secure iframe
- No Wild Apricot data is sent to Murmurant
- Murmurant data is read-only in these widgets
- No login is required for public event display

---

## Technical Details (For Tech Chairs)

The widgets use iframe embedding with these properties:

| Property | Value | Purpose |
|----------|-------|---------|
| `src` | Murmurant embed URL | Points to hosted widget |
| `sandbox` | allow-scripts allow-same-origin | Security restrictions |
| `loading` | lazy | Performance optimization |
| `referrerpolicy` | no-referrer | Privacy |

The hosting location is:

- Production: `https://murmurant-prod-sbnc.netlify.app`
- Staging: `https://murmurant-staging-sbnc.netlify.app`

By default, widgets point to production. For testing, you can change the URL in the HTML to use staging.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2025 | Initial release |
