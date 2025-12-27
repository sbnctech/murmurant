# WA Config Page Setup Guide

```
Audience: SBNC Tech Chairs
Purpose: Set up and maintain the Widget Configuration Page in Wild Apricot
Time: 15-20 minutes for initial setup
```

---

## What This Is

The Config Page is a special WA page that stores settings for SBNC widgets (like ClubCalendar). Instead of hardcoding settings in each widget embed, widgets read their configuration from this central page.

**Benefits:**
- Change settings in one place, all widgets update
- No need to edit embed code on multiple pages
- Validation before publishing catches errors
- Version tracking (who changed what, when)

---

## Quick Setup

### Step 1: Create the Config Page

1. In WA Admin, go to **Website > Site pages**
2. Click **Add page**
3. Name it: `Widget Config` (or `widget-config` for the URL)
4. Set **Page access** to: `Administrators only`
5. Click **Save**

### Step 2: Add the Config Block

1. Edit the new page
2. Add a **Custom HTML** gadget
3. Switch to **Source/HTML** view
4. Copy the entire contents of `WA_CONFIG_PAGE_BLOCK.html`
5. Paste into the HTML editor
6. Click **Save** on the gadget

### Step 3: Configure Your Settings

1. In the HTML source, find the JSON between:
   ```
   <!-- CONFIG START -->
   ```
   and
   ```
   <!-- CONFIG END -->
   ```

2. Edit these key values:

   | Setting | What to Change |
   |---------|----------------|
   | `_lastModified` | Today's date |
   | `_modifiedBy` | Your name |
   | `dataSource.url` | Your WA calendar feed URL |
   | `eventPageBaseUrl` | Your WA event page base URL |

3. **Save** the gadget

### Step 4: Validate and Publish

1. View the page (not in edit mode)
2. Click the **Validate Config** button
3. If validation passes (green), **Publish** the page
4. If validation fails (red), fix the errors and try again

---

## Where to Find Your Calendar ID

The calendar URL needs your WA calendar widget ID:

1. Go to a WA page with a Calendar widget
2. Click **Edit** on the page
3. Click the **Calendar widget**
4. Click **Settings**
5. Look for the **iCal feed URL** - it contains your ID:
   ```
   https://sbnewcomers.wildapricot.org/widget/Calendar/12345.ics
                                                        ^^^^^
                                                        This is your ID
   ```
6. Copy the full URL into the config

---

## What NOT to Touch

These parts of the config block are structural - don't modify them:

| Element | Why |
|---------|-----|
| `<script type="application/json" id="sbnc-widget-config">` | Widgets look for this exact ID |
| `<!-- CONFIG START -->` / `<!-- CONFIG END -->` | Markers for human editors |
| Curly braces `{ }` | JSON structure |
| Square brackets `[ ]` | JSON arrays |
| Colons `:` | JSON key-value separators |
| Commas `,` | JSON item separators |

**Only edit the values inside quotes.**

---

## Safe vs Unsafe Edits

### Safe Edits

```json
// Changing a string value
"name": "Santa Barbara Newcomers Club"
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Safe to change

// Changing a number
"refreshIntervalMinutes": 15
                          ^^ Safe to change

// Changing true/false
"showPastEvents": false
                  ^^^^^ Safe to change (use true or false, no quotes)

// Changing colors (use hex codes)
"default": "#2563eb"
           ^^^^^^^^^ Safe to change
```

### Unsafe Edits (Don't Do These)

```json
// DON'T remove quotes from strings
"name": Santa Barbara Newcomers   // WRONG - missing quotes

// DON'T add trailing commas
"showPastEvents": false,          // WRONG if it's the last item
}

// DON'T use smart quotes (curly quotes)
"name": "SBNC"                    // WRONG - wrong quote characters

// DON'T change the structure
"dataSource":                     // DON'T remove or rename this
```

---

## Config Reference

### Organization Section

```json
"organization": {
  "name": "Santa Barbara Newcomers Club",   // Full org name
  "shortName": "SBNC",                       // Abbreviation
  "timezone": "America/Los_Angeles"          // IANA timezone
}
```

### Calendar Data Source

```json
"clubcalendar": {
  "dataSource": {
    "type": "ics-feed",                      // Don't change
    "url": "https://...YOUR_CALENDAR_ID.ics", // Your WA feed URL
    "refreshIntervalMinutes": 15              // How often to refresh
  }
}
```

### Display Options

```json
"display": {
  "defaultView": "month",           // month, week, or list
  "views": ["month", "week", "list"], // Which views to show
  "showPastEvents": false,          // true or false
  "maxEventsVisible": 50            // Number of events to load
}
```

### Event Colors

```json
"eventColors": {
  "default": "#2563eb",   // Blue - general events
  "social": "#16a34a",    // Green - social events
  "interest": "#9333ea",  // Purple - interest groups
  "general": "#dc2626"    // Red - general meetings
}
```

### Features

```json
"features": {
  "showRegistrationStatus": false,  // Show "X spots left"
  "showEventDetails": true,         // Show event descriptions
  "linkToEventPage": true,          // Make events clickable
  "eventPageBaseUrl": "https://..." // Where event links go
}
```

---

## Troubleshooting

### "JSON Parse Error"

**Cause:** Invalid JSON syntax.

**Fix:**
1. Check for missing or extra commas
2. Check for missing quotes around strings
3. Check for mismatched brackets `{ }` or `[ ]`
4. Use a JSON validator: https://jsonlint.com

### "Missing organization.name"

**Cause:** Required field is empty or missing.

**Fix:** Add the missing field with a valid value.

### Calendar Not Updating

**Cause:** Wrong calendar URL or CORS issues.

**Fix:**
1. Verify the calendar URL is correct
2. Test the URL directly in your browser
3. Make sure the page is published (not just saved)

### Changes Not Appearing

**Cause:** Page not published, or cached.

**Fix:**
1. Make sure you clicked **Publish**, not just **Save**
2. Clear your browser cache
3. Wait a few minutes for cache to expire

---

## Updating the Config

When you need to make changes:

1. Edit the page
2. Open the Custom HTML gadget in **Source/HTML** view
3. Make your changes to the JSON values
4. Update `_lastModified` and `_modifiedBy`
5. Save the gadget
6. View the page and click **Validate Config**
7. If valid, **Publish** the page

---

## Telling Widgets Where to Find Config

When embedding a widget, point it to the config page:

```html
<script>
  SBNCWidget.calendar({
    container: '#my-calendar',
    configUrl: 'https://sbnewcomers.wildapricot.org/widget-config'
  });
</script>
```

The widget will fetch the config page and extract the settings automatically.

---

## Version History

Keep track of config changes by updating these fields:

```json
"_version": "1.0.0",           // Increment when making changes
"_lastModified": "2025-12-26", // Today's date
"_modifiedBy": "Your Name"     // Who made the change
```

---

## Related Documents

- [WA_CONFIG_PAGE_BLOCK.html](./WA_CONFIG_PAGE_BLOCK.html) - The paste-ready HTML block
- [SBNC_INLINE_ONLY_INSTALL.md](./SBNC_INLINE_ONLY_INSTALL.md) - Widget installation guide
- [SBNC_HOSTING_GUIDE.md](./SBNC_HOSTING_GUIDE.md) - Static hosting setup

---

## Need Help?

If you break the config and can't fix it:

1. Don't panic
2. Don't publish the broken version
3. Copy the original template from `WA_CONFIG_PAGE_BLOCK.html`
4. Paste it fresh and re-enter your settings
5. Validate before publishing
