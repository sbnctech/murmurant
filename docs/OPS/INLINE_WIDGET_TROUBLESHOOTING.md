# Inline Widget Troubleshooting Guide

```
Audience: SBNC Technical Staff, Webmaster
Purpose: Diagnose and resolve inline widget issues
Approach: Inline-only (widgets embedded in Wild Apricot)
```

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

---

## Overview

This guide helps operators diagnose and resolve issues with inline widgets embedded in Wild Apricot pages. It follows the **inline-only approach** where ClubOS widgets run entirely in the browser without a separate server.

**Troubleshooting Philosophy:**
1. **Observe** - What exactly is happening (or not happening)?
2. **Isolate** - Is it the widget, the page, or the data source?
3. **Reproduce** - Can you make it happen consistently?
4. **Resolve** - Apply the appropriate fix
5. **Verify** - Confirm the fix works

---

## Quick Diagnostic Flowchart

```
Widget Not Working?
        │
        ▼
┌───────────────────┐
│ Page loads at all?│
└─────────┬─────────┘
          │
    No ───┴─── Yes
    │           │
    ▼           ▼
[Wild Apricot   ┌───────────────────┐
 Issue - see    │ Widget area shows │
 Section 1]     │ blank/error?      │
                └─────────┬─────────┘
                          │
                    No ───┴─── Yes
                    │           │
                    ▼           ▼
            [Data Issue -  [Widget Code Issue -
             see Section 2] see Section 3]
```

---

## Section 1: Page-Level Issues

### Problem: Page Won't Load

**Symptoms:**
- Browser shows error page
- Page takes forever to load
- "This site can't be reached" message

**Diagnosis:**

```
Step 1: Check Wild Apricot status
- Visit: https://status.wildapricot.com/
- If WA is down, wait for resolution

Step 2: Check your network
- Can you reach other websites?
- Try: ping sbnewcomers.wildapricot.org

Step 3: Try different browser
- Open page in Chrome if using Safari (or vice versa)
- Clear browser cache if needed
```

**Resolution:**

| Cause | Fix |
|-------|-----|
| WA outage | Wait for WA to restore service |
| Network issue | Check your internet connection |
| Browser cache | Clear cache and refresh (Cmd+Shift+R) |
| DNS issue | Try different network or wait |

---

### Problem: Page Loads But Looks Wrong

**Symptoms:**
- Page layout is broken
- Styles missing
- Content out of place

**Diagnosis:**

```
Step 1: Check browser console
- Open Developer Tools (Cmd+Option+I)
- Look at Console tab for errors

Step 2: Check Network tab
- Are CSS/JS files failing to load?
- Look for red entries (failed requests)

Step 3: Compare to another page
- Does another WA page work correctly?
```

**Resolution:**

| Cause | Fix |
|-------|-----|
| CSS blocked by CSP | Review Content Security Policy settings |
| Cached old version | Hard refresh (Cmd+Shift+R) |
| WA theme issue | Check WA theme settings, contact WA support |

---

## Section 2: Data Issues

### Problem: Widget Shows "No Events"

**Symptoms:**
- Calendar displays but shows no events
- "No events to display" message
- Empty calendar grid

**Diagnosis:**

```
Step 1: Check ICS feed directly
- Open the ICS URL in a browser:
  https://sbnewcomers.wildapricot.org/widget/Calendar/YOUR_ID.ics
- Does it download a file or show an error?

Step 2: Verify calendar ID
- Log in to WA admin
- Navigate to Website > Pages
- Find page with Calendar widget
- Check widget settings for calendar ID

Step 3: Check date range
- Are there actually events in the current date range?
- Try navigating to a different month
```

**Resolution:**

| Cause | Fix |
|-------|-----|
| Wrong calendar ID in config | Update `dataSource.url` in config |
| No events exist | Add events in WA Events module |
| Events are private | Check event visibility settings in WA |
| ICS feed disabled | Enable public calendar in WA settings |

---

### Problem: Events Show Wrong Information

**Symptoms:**
- Event titles are incorrect
- Times display in wrong timezone
- Missing event details

**Diagnosis:**

```
Step 1: Check source data
- View the event directly in Wild Apricot
- Compare WA event page to widget display

Step 2: Check timezone config
- Verify organization.timezone in config
- Should be "America/Los_Angeles" for Pacific

Step 3: Check field mapping
- Are all expected fields present in ICS feed?
```

**Resolution:**

| Cause | Fix |
|-------|-----|
| Source data incorrect | Fix event data in WA Events |
| Timezone mismatch | Set correct timezone in config |
| Field mapping issue | Check ICS feed format |

---

### Problem: Old Events Still Showing

**Symptoms:**
- Cancelled events appear
- Past events won't go away
- Stale data persists

**Diagnosis:**

```
Step 1: Check cache settings
- What is refreshIntervalMinutes in config?
- Default should be 15 minutes

Step 2: Force refresh
- Clear browser cache
- Hard refresh (Cmd+Shift+R)

Step 3: Check ICS feed
- Open ICS URL directly
- Is the old event still in the feed?
```

**Resolution:**

| Cause | Fix |
|-------|-----|
| Cache not expired | Wait for refresh interval or hard refresh |
| Event not deleted in WA | Delete or update event in WA Events |
| Browser cache | Clear browser cache |

---

## Section 3: Widget Code Issues

### Problem: JavaScript Error

**Symptoms:**
- Widget area is blank
- Console shows red error messages
- Widget partially loads then stops

**Diagnosis:**

```
Step 1: Open browser console
- Cmd+Option+I (macOS) or F12 (Windows)
- Click Console tab
- Look for red error messages

Step 2: Identify error type
- SyntaxError: Code has typo or missing bracket
- TypeError: Variable or function doesn't exist
- ReferenceError: Trying to use undefined variable

Step 3: Check line number
- Error message includes file:line
- This points to problem location
```

**Common Errors and Fixes:**

```javascript
// ERROR: Uncaught SyntaxError: Unexpected token '}'
// CAUSE: Extra closing brace or missing opening brace
// FIX: Check brace matching in config/code

// ERROR: Uncaught TypeError: Cannot read property 'x' of undefined
// CAUSE: Trying to access property of undefined variable
// FIX: Check that all required config properties exist

// ERROR: Uncaught ReferenceError: SBNCWidget is not defined
// CAUSE: Widget script not loaded
// FIX: Verify widget.js is included and loads correctly
```

**Resolution:**

| Error Type | Likely Cause | Fix |
|------------|--------------|-----|
| SyntaxError | Malformed JSON/code | Validate JSON syntax |
| TypeError | Missing config value | Check all required fields |
| ReferenceError | Script not loaded | Verify script URL and order |
| NetworkError | Failed to load script | Check hosting and URLs |

---

### Problem: Widget Loads But Doesn't Work

**Symptoms:**
- Widget displays but clicks don't work
- Navigation buttons unresponsive
- Hover effects missing

**Diagnosis:**

```
Step 1: Check for CSS conflicts
- WA theme may override widget styles
- Look for !important declarations

Step 2: Check for JS conflicts
- Other scripts on page may interfere
- Look for jQuery conflicts

Step 3: Test in isolation
- Open widget demo page directly (not embedded)
- Does it work there?
```

**Resolution:**

| Cause | Fix |
|-------|-----|
| CSS conflicts | Add more specific selectors or scoped styles |
| JS conflicts | Check for jQuery version issues, namespace conflicts |
| Event handlers blocked | Check for pointer-events: none in CSS |
| z-index issues | Widget may be behind other elements |

---

### Problem: CORS Error

**Symptoms:**
- Console shows "Access-Control-Allow-Origin" error
- Data fails to load
- "Cross-Origin Request Blocked" message

**Diagnosis:**

```
Step 1: Identify the blocked request
- Look at Network tab for failed request
- Note the URL being blocked

Step 2: Check origin vs destination
- What domain is the page on?
- What domain is the request going to?

Step 3: Check CORS proxy setting
- Is corsProxy configured in config?
```

**Resolution:**

| Scenario | Fix |
|----------|-----|
| ICS feed blocked | Use a CORS proxy or same-origin feed |
| API request blocked | Ensure ClubOS backend allows the origin |
| Mixed content | Ensure both page and requests use HTTPS |

**CORS Proxy Configuration:**

```json
{
  "dataSource": {
    "type": "ics-feed",
    "url": "https://example.com/calendar.ics",
    "corsProxy": "https://corsproxy.io/?"
  }
}
```

---

## Section 4: Configuration Issues

### Problem: Config JSON Invalid

**Symptoms:**
- Widget doesn't initialize
- "JSON parse error" in console
- Validation button shows errors

**Diagnosis:**

```
Step 1: Copy config JSON to validator
- Use https://jsonlint.com/
- Paste your config and validate

Step 2: Look for common JSON errors
- Trailing commas: {"a": 1,} ← remove trailing comma
- Unquoted keys: {key: "value"} ← quote keys
- Single quotes: {'key': 'value'} ← use double quotes

Step 3: Check special characters
- Escape quotes inside strings: "He said \"hello\""
- Escape backslashes: "path\\to\\file"
```

**Common JSON Errors:**

```json
// WRONG: Trailing comma
{
  "name": "SBNC",
  "timezone": "America/Los_Angeles",  // ← trailing comma
}

// CORRECT: No trailing comma
{
  "name": "SBNC",
  "timezone": "America/Los_Angeles"
}

// WRONG: Single quotes
{'name': 'SBNC'}

// CORRECT: Double quotes
{"name": "SBNC"}

// WRONG: Unquoted key
{name: "SBNC"}

// CORRECT: Quoted key
{"name": "SBNC"}
```

---

### Problem: Config Missing Required Fields

**Symptoms:**
- Widget loads but displays incorrectly
- Console shows undefined errors
- Partial functionality

**Diagnosis:**

```
Step 1: Review required fields
- organization.name
- organization.timezone
- dataSource.type
- dataSource.url (for ics-feed type)

Step 2: Compare to template
- Check against config-templates/clubcalendar/sbnc-wa-feed.config.json

Step 3: Check nested structure
- Is organization an object, not a string?
- Is dataSource properly structured?
```

**Required Fields Reference:**

```json
{
  "organization": {
    "name": "Required",
    "timezone": "Required (e.g., America/Los_Angeles)"
  },
  "dataSource": {
    "type": "Required (ics-feed or static-json)",
    "url": "Required for ics-feed type"
  }
}
```

---

## Section 5: Display Issues

### Problem: Widget Too Small/Large

**Symptoms:**
- Widget doesn't fit container
- Content cut off
- Scrollbars appear unexpectedly

**Diagnosis:**

```
Step 1: Check container size
- Inspect the parent element in Developer Tools
- What width/height is set?

Step 2: Check widget config
- Is maxEventsVisible set appropriately?
- Is compactMode enabled/disabled?

Step 3: Check responsive behavior
- Does it change at different screen sizes?
```

**Resolution:**

| Issue | Fix |
|-------|-----|
| Container too narrow | Adjust WA gadget width settings |
| Content overflows | Enable compactMode or reduce maxEventsVisible |
| Mobile display issues | Check styling.compactMode setting |

---

### Problem: Colors Don't Match

**Symptoms:**
- Widget colors clash with site theme
- Text hard to read
- Events have wrong category colors

**Diagnosis:**

```
Step 1: Check eventColors in config
- Are colors specified as hex codes?
- Example: "#2563eb" (not "blue")

Step 2: Check for CSS overrides
- WA theme may override widget colors
- Inspect element to see computed styles

Step 3: Check color contrast
- Use browser accessibility tools
- Ensure text is readable
```

**Resolution:**

```json
{
  "display": {
    "eventColors": {
      "default": "#2563eb",
      "social": "#16a34a",
      "interest": "#9333ea",
      "general": "#dc2626"
    }
  }
}
```

---

## Section 6: Performance Issues

### Problem: Widget Loads Slowly

**Symptoms:**
- Long delay before widget appears
- Spinner shows for extended time
- Page feels sluggish

**Diagnosis:**

```
Step 1: Check Network tab timing
- How long does widget.js take to load?
- How long does ICS feed take to fetch?

Step 2: Check ICS feed size
- Large calendars take longer to parse
- Consider reducing date range

Step 3: Check hosting performance
- Is widget hosted on fast CDN?
- Test from different locations
```

**Resolution:**

| Cause | Fix |
|-------|-----|
| Large ICS feed | Reduce date range or filter events |
| Slow hosting | Use CDN (Netlify, GitHub Pages) |
| Too many events | Set lower maxEventsVisible |
| Slow initial load | Ensure scripts load async |

---

### Problem: High Memory Usage

**Symptoms:**
- Browser becomes sluggish over time
- Page freezes periodically
- Memory warnings in console

**Diagnosis:**

```
Step 1: Check for memory leaks
- Open Performance tab in Developer Tools
- Take heap snapshot before and after use
- Compare memory growth

Step 2: Check refresh behavior
- Is widget refetching data continuously?
- Check refreshIntervalMinutes setting

Step 3: Check event count
- Too many events can cause memory issues
- Limit maxEventsVisible
```

**Resolution:**

| Cause | Fix |
|-------|-----|
| Continuous polling | Set reasonable refreshIntervalMinutes (15+) |
| Too many events | Reduce maxEventsVisible |
| Memory leak | Report to development team |

---

## Section 7: Wild Apricot-Specific Issues

### Problem: Custom HTML Not Saving

**Symptoms:**
- Changes disappear after saving
- Editor reverts to old content
- "Save failed" message

**Diagnosis:**

```
Step 1: Check HTML validity
- WA may reject invalid HTML
- Ensure all tags are properly closed

Step 2: Check character encoding
- Special characters may cause issues
- Use HTML entities for special chars

Step 3: Check size limits
- WA may have content size limits
- Large embeds may need splitting
```

**Resolution:**

| Cause | Fix |
|-------|-----|
| Invalid HTML | Validate HTML structure |
| Special characters | Use HTML entities (&amp; &lt; etc.) |
| Size limit | Split into multiple gadgets if needed |
| Session expired | Log in again before saving |

---

### Problem: Widget Conflicts with WA Theme

**Symptoms:**
- Widget styles look wrong
- Fonts don't match
- Layout breaks

**Diagnosis:**

```
Step 1: Inspect conflicting styles
- Use Developer Tools to see which styles apply
- Look for WA theme overrides

Step 2: Check CSS specificity
- Widget styles may be too generic
- WA styles may use !important

Step 3: Test with default WA theme
- Temporarily switch theme to isolate issue
```

**Resolution:**

| Cause | Fix |
|-------|-----|
| Theme CSS override | Add more specific widget selectors |
| !important conflicts | Use scoped styles or CSS variables |
| Font conflicts | Explicitly set font in widget config |

---

## Emergency Procedures

### Widget Completely Broken - Quick Recovery

```
1. Access WA admin immediately
2. Navigate to affected page
3. Edit the Custom HTML gadget
4. Replace with emergency placeholder:

<div style="padding: 20px; background: #fff3cd; border: 1px solid #ffc107; text-align: center;">
  <strong>Calendar temporarily unavailable</strong><br>
  We're working to restore this feature.<br>
  For event information: <a href="mailto:info@sbnewcomers.org">info@sbnewcomers.org</a>
</div>

5. Save and publish
6. Notify Tech Chair
7. Begin troubleshooting offline
```

### When to Escalate

Escalate to Tech Chair or development team if:

- [ ] Issue persists after trying all relevant troubleshooting steps
- [ ] Error messages reference internal ClubOS code
- [ ] Problem affects multiple pages or widgets
- [ ] Data appears corrupted or incorrect at source
- [ ] Security-related error messages appear

---

## Diagnostic Commands Reference

### Browser Console Commands

```javascript
// Check if widget initialized
typeof SBNCWidget !== 'undefined'

// Check widget version (if exposed)
SBNCWidget.version

// Check current config (if exposed)
SBNCWidget.getConfig()

// Force data refresh (if exposed)
SBNCWidget.refresh()
```

### Terminal Commands (macOS)

```zsh
# Test ICS feed URL
curl -I "https://sbnewcomers.wildapricot.org/widget/Calendar/YOUR_ID.ics"

# Validate JSON config file
cat config.json | jq .

# Check file sizes
ls -la dist/inline-widget/

# Test local server
python3 -m http.server 8080
```

---

## Related Documents

- [SBNC Operator Checklist](./SBNC_OPERATOR_CHECKLIST.md) - Pre-publish, publish, verify, rollback procedures
- [Publishing and Content Lifecycle](../BIZ/PUBLISHING_AND_CONTENT_LIFECYCLE.md) - Content publishing workflow
- [SBNC Inline-Only Installation](../INSTALL/SBNC_INLINE_ONLY_INSTALL.md) - Build and install guide
- [SBNC Hosting Guide](../INSTALL/SBNC_HOSTING_GUIDE.md) - Deployment to static hosting
- [Trust Surface for Operators](../BIZ/TRUST_SURFACE_FOR_OPERATORS.md) - Core guarantees

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-26 | System | Initial troubleshooting guide |

