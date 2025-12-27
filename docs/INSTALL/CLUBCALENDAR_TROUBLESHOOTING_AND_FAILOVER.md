# ClubCalendar Troubleshooting and Failover Guide

```
Audience: SBNC Technical Staff, Operators
Purpose: Diagnose and resolve ClubCalendar issues, execute rollback if needed
Prerequisites: Wild Apricot admin access, browser developer tools familiarity
```

---

## Quick Diagnosis Flowchart

```
Calendar not working?
│
├─ Shows "Loading calendar..." forever
│   └─ Go to: Section 1 (Config Loading Failures)
│
├─ Shows "Calendar Error: ..."
│   ├─ "Config script not found" → Section 1.2
│   ├─ "Invalid config JSON" → Section 1.3
│   ├─ "No data source URL" → Section 1.4
│   └─ "Failed to load events" → Section 2
│
├─ Calendar loads but no events shown
│   └─ Go to: Section 3 (Empty Events)
│
├─ Events appear on wrong dates/times
│   └─ Go to: Section 4 (Timezone Issues)
│
├─ Filters don't work or are missing
│   └─ Go to: Section 5 (Filter Problems)
│
├─ Calendar looks broken (styling issues)
│   └─ Go to: Section 6 (CSS Conflicts)
│
└─ Everything else
    └─ Go to: Section 7 (General Debugging)
```

---

## Section 1: Config Loading Failures

### 1.1 Config Page Not Found (HTTP 404)

**Symptoms:**

- Calendar shows "Loading calendar..." indefinitely
- Browser console shows: `GET /clubcalendar-config 404 (Not Found)`
- No error message displayed in calendar container

**Likely Causes:**

| Cause | How to Verify |
|-------|---------------|
| Config page doesn't exist | Navigate to `/clubcalendar-config` directly |
| Config page URL is misspelled | Check page URL in WA admin |
| Config page is unpublished | Check page status in Site pages |
| Config page is member-only but user is logged out | Check page access settings |

**Fix Steps:**

1. **Verify page exists:**
   ```
   Navigate to: https://[your-site].wildapricot.org/clubcalendar-config
   ```
   - If 404: Page doesn't exist, create it (see installation runbook)
   - If redirects to login: Page is member-only, change access settings

2. **Check page URL matches code:**
   - Open Events page in WA admin
   - View HTML source of the Custom HTML gadget
   - Find this line: `var CONFIG_PAGE_URL = '/clubcalendar-config';`
   - Ensure URL matches exactly (case-sensitive)

3. **Verify page is published:**
   - Go to: Website > Site pages
   - Find "ClubCalendar Config" page
   - Ensure status shows "Published" (green checkmark)
   - If draft: Click page > Settings > check "Published" > Save

4. **Check access settings:**
   - Click config page > Settings
   - Under "Access": Select "Everyone (public)"
   - Save changes

**Prevention:**

- Always verify config page URL immediately after creation
- Test in incognito window to catch access issues
- Document the exact config page URL in team notes

---

### 1.2 Config Script Tag Not Found

**Symptoms:**

- Calendar shows: `Calendar Error: Config script not found on page`
- Config page loads but appears blank or has other content

**Likely Causes:**

| Cause | How to Verify |
|-------|---------------|
| Script tag missing from page | View page source, search for "clubcalendar-config" |
| Script tag has wrong ID | Check `id="clubcalendar-config"` attribute |
| Script tag has wrong type | Check `type="application/json"` attribute |
| HTML was corrupted during paste | Compare with original snippet |
| WA editor stripped the script tag | Check if WA sanitized the HTML |

**Fix Steps:**

1. **View page source:**
   ```
   Navigate to: /clubcalendar-config
   Right-click > View Page Source (or Ctrl+U / Cmd+Option+U)
   Search for: clubcalendar-config
   ```

2. **Verify script tag format:**

   The page MUST contain exactly this structure:
   ```html
   <script id="clubcalendar-config" type="application/json">
   {
     ... JSON content ...
   }
   </script>
   ```

   Common problems:
   - Missing `id` attribute
   - Wrong `type` (must be `application/json`, not `text/javascript`)
   - Script tag converted to text by WA editor

3. **Re-paste the config HTML:**
   - Go to: Website > Site pages > ClubCalendar Config
   - Edit the Custom HTML gadget
   - Switch to HTML mode (`</>` button)
   - Select all content and delete
   - Paste fresh config HTML from installation runbook
   - Save and publish

4. **Check WA HTML sanitization:**

   Wild Apricot may strip certain tags. If script tags are removed:
   - Try using a Content gadget instead of Custom HTML
   - Ensure "Allow scripts" is enabled in gadget settings (if available)
   - Contact WA support if scripts are always stripped

**Prevention:**

- Always use HTML mode when pasting config
- Verify page source after every edit
- Keep a backup of the config HTML in a text file

---

### 1.3 Config JSON Parse Error

**Symptoms:**

- Calendar shows: `Calendar Error: Invalid config JSON: [error details]`
- Common error details:
  - `Unexpected token } in JSON`
  - `Unexpected token , in JSON`
  - `Unexpected end of JSON input`

**Likely Causes:**

| Cause | How to Verify |
|-------|---------------|
| Trailing comma after last property | Check for `,` before `}` |
| Missing comma between properties | Check for missing `,` after `"value"` |
| Unquoted property names | Property names must be in `"quotes"` |
| Single quotes instead of double | JSON requires `"double quotes"` |
| Unescaped special characters | Check for unescaped `"` or `\` in strings |
| Comments in JSON | JSON does not allow `//` or `/* */` comments |
| HTML entities in JSON | Check for `&quot;` instead of `"` |

**Fix Steps:**

1. **Extract and validate JSON:**
   - View config page source
   - Copy content between `<script ...>` and `</script>`
   - Paste into [JSONLint.com](https://jsonlint.com)
   - Fix reported errors

2. **Common JSON fixes:**

   **Trailing comma (WRONG):**
   ```json
   {
     "name": "SBNC",
     "timezone": "America/Los_Angeles",  ← Remove this comma
   }
   ```

   **Trailing comma (CORRECT):**
   ```json
   {
     "name": "SBNC",
     "timezone": "America/Los_Angeles"
   }
   ```

   **Missing comma (WRONG):**
   ```json
   {
     "name": "SBNC"   ← Add comma here
     "timezone": "America/Los_Angeles"
   }
   ```

   **Single quotes (WRONG):**
   ```json
   {
     'name': 'SBNC'   ← Must use double quotes
   }
   ```

   **Unescaped quotes (WRONG):**
   ```json
   {
     "description": "The "best" club"   ← Escape inner quotes
   }
   ```

   **Unescaped quotes (CORRECT):**
   ```json
   {
     "description": "The \"best\" club"
   }
   ```

3. **Check for HTML encoding issues:**

   If WA converted special characters:
   ```
   &quot;  →  "
   &amp;   →  &
   &lt;    →  <
   &gt;    →  >
   ```

   Re-paste the config in HTML mode to avoid encoding.

4. **Validate and re-paste:**
   - Fix JSON in a text editor
   - Validate at JSONLint.com
   - Re-paste into config page (HTML mode)
   - Save and test

**Prevention:**

- Always validate JSON before pasting
- Use a JSON-aware editor (VS Code, Sublime Text)
- Never edit JSON in WA's visual editor (always use HTML mode)

---

### 1.4 Missing Data Source URL

**Symptoms:**

- Calendar shows: `Calendar Error: No data source URL configured`
- Config loads successfully but events don't load

**Likely Causes:**

| Cause | How to Verify |
|-------|---------------|
| `dataSource.url` is empty string | Check config JSON |
| `dataSource.url` is missing entirely | Check config JSON |
| `dataSource` object is missing | Check config JSON structure |
| Placeholder URL not replaced | Check for `YOUR_CALENDAR_ID` in URL |

**Fix Steps:**

1. **Verify dataSource configuration:**

   Config MUST have this structure:
   ```json
   {
     "dataSource": {
       "type": "ics-feed",
       "url": "https://your-site.wildapricot.org/widget/Calendar/12345.ics",
       "refreshIntervalMinutes": 15
     }
   }
   ```

2. **Get your ICS feed URL:**
   - Go to: WA Admin > Website > Site pages
   - Find a page with an Event Calendar gadget
   - Click the calendar gadget > Settings
   - Look for "Subscribe" or "ICS feed" link
   - Copy the full URL (should end in `.ics`)

3. **Update config with correct URL:**
   - Edit config page (HTML mode)
   - Replace the `url` value with your ICS feed URL
   - Ensure no placeholder text remains
   - Save and test

4. **Test ICS URL directly:**
   ```
   Open in browser: https://your-site.wildapricot.org/widget/Calendar/12345.ics
   ```
   - Should download or display ICS file content
   - If 404: Calendar widget doesn't exist or ID is wrong
   - If redirect to login: Calendar is member-only

**Prevention:**

- Never deploy with placeholder URLs
- Test ICS URL in browser before adding to config
- Document the ICS feed URL in team notes

---

## Section 2: Event Loading Failures

### 2.1 ICS Feed HTTP Errors

**Symptoms:**

- Calendar shows: `Calendar Error: Failed to load events: HTTP 404`
- Or: `Failed to load events: HTTP 403`
- Or: `Failed to load events: HTTP 500`

**Likely Causes by HTTP Status:**

| Status | Meaning | Likely Cause |
|--------|---------|--------------|
| 404 | Not Found | ICS URL is wrong or calendar was deleted |
| 403 | Forbidden | Calendar is member-only, user not authenticated |
| 500 | Server Error | WA server issue, try again later |
| 0 | Network Error | CORS blocked, network offline, or SSL error |

**Fix Steps:**

1. **For HTTP 404:**
   - Verify the calendar widget still exists in WA
   - Go to: WA Admin > Website > Site pages
   - Check if the calendar gadget is present
   - Get the correct ICS URL from gadget settings
   - Update config with correct URL

2. **For HTTP 403:**
   - The ICS feed may require authentication
   - Check calendar gadget settings for "Public access" option
   - If calendar must be member-only:
     - Consider creating a public calendar for the widget
     - Or accept that logged-out users won't see events

3. **For HTTP 500:**
   - This is a WA server error
   - Wait 5-10 minutes and try again
   - Check WA status page for outages
   - If persistent, contact WA support

4. **For HTTP 0 (Network/CORS error):**
   - Open browser console (F12 > Console)
   - Look for CORS error messages
   - If CORS blocked:
     - WA may not allow cross-origin ICS requests
     - Consider using a CORS proxy (add to config)
     - Or host the widget on the same WA domain

**Prevention:**

- Test ICS URL works before deployment
- Set up monitoring to detect feed failures
- Have a backup static events JSON file

---

### 2.2 ICS Feed Parse Errors

**Symptoms:**

- Calendar shows no events but no error message
- Browser console shows: `Error parsing ICS` or similar
- Events array is empty after load

**Likely Causes:**

| Cause | How to Verify |
|-------|---------------|
| ICS feed is empty | Download and open ICS file |
| ICS format is non-standard | Compare with ICS specification |
| ICS has encoding issues | Check for special characters |
| Feed returns HTML (not ICS) | Download and check content type |

**Fix Steps:**

1. **Download and inspect ICS file:**
   ```
   Open ICS URL in browser
   Save as file
   Open in text editor
   ```

2. **Verify ICS structure:**

   Valid ICS should look like:
   ```
   BEGIN:VCALENDAR
   VERSION:2.0
   PRODID:-//Wild Apricot//...
   BEGIN:VEVENT
   DTSTART:20251215T180000
   DTEND:20251215T200000
   SUMMARY:Holiday Party
   ...
   END:VEVENT
   END:VCALENDAR
   ```

3. **Check for HTML response:**

   If file contains `<html>` or `<!DOCTYPE>`, the URL is returning a login page or error page, not the ICS feed.

4. **Check for encoding issues:**
   - Look for garbled characters
   - Ensure file is UTF-8 encoded
   - Special characters should be escaped in ICS format

5. **Test with a known-good ICS file:**
   - Create a simple test event in WA
   - Download ICS and verify it parses
   - If test event works, issue is with specific event data

**Prevention:**

- Periodically validate ICS feed format
- Monitor for empty feed responses
- Log parse errors for debugging

---

### 2.3 CORS (Cross-Origin) Blocking

**Symptoms:**

- Calendar shows "Loading calendar..." forever or network error
- Browser console shows:
  ```
  Access to XMLHttpRequest at 'https://...' from origin 'https://...'
  has been blocked by CORS policy
  ```

**Likely Causes:**

| Cause | Explanation |
|-------|-------------|
| Different domains | Widget on domain A requesting ICS from domain B |
| WA doesn't send CORS headers | WA may not allow cross-origin requests |
| Protocol mismatch | HTTP page requesting HTTPS resource (or vice versa) |

**Fix Steps:**

1. **Verify the CORS error:**
   - Open browser console (F12)
   - Look for red error messages mentioning CORS
   - Note the requesting origin and target URL

2. **Option A: Host widget on same domain:**
   - If widget is on `mysite.com` and ICS is on `org.wildapricot.org`
   - Move widget to a WA page on `org.wildapricot.org`
   - Same-origin requests don't need CORS

3. **Option B: Use a CORS proxy:**

   Update config to use a proxy:
   ```json
   {
     "dataSource": {
       "type": "ics-feed",
       "url": "https://org.wildapricot.org/widget/Calendar/123.ics",
       "corsProxy": "https://cors-anywhere.herokuapp.com/"
     }
   }
   ```

   Note: Public CORS proxies have rate limits and reliability issues.

4. **Option C: Server-side fetch:**
   - Set up a server endpoint that fetches the ICS
   - Widget requests from your server (same origin)
   - Server fetches from WA (server-to-server, no CORS)

5. **Option D: Contact WA support:**
   - Request CORS headers be added to ICS feeds
   - This is unlikely to be granted but worth asking

**Prevention:**

- Design widget to run on same domain as ICS feed
- Test cross-origin requests early in development
- Have CORS proxy as backup plan

---

## Section 3: Empty Events Display

### 3.1 No Events in Feed

**Symptoms:**

- Calendar loads successfully (no errors)
- Calendar grid shows but all days are empty
- List view shows "No upcoming events"

**Likely Causes:**

| Cause | How to Verify |
|-------|---------------|
| No events exist in WA | Check WA Admin > Events |
| All events are in the past | Check event dates |
| Events are unpublished | Check event status |
| ICS feed is filtered | Check calendar widget settings |
| `showPastEvents: false` hiding events | Check config |

**Fix Steps:**

1. **Check WA for events:**
   - Go to: WA Admin > Events
   - Verify events exist
   - Check that events have future dates
   - Ensure events are "Published" (not draft)

2. **Check ICS feed content:**
   - Download ICS file directly
   - Open in text editor
   - Verify `VEVENT` blocks are present
   - Check `DTSTART` dates are in the future

3. **Check calendar widget filter settings:**
   - In WA, find the calendar widget
   - Check if it filters by event type or tag
   - Ensure filter includes events you want to show

4. **Check config settings:**
   ```json
   {
     "display": {
       "showPastEvents": false,  ← Set to true to show past events
       "maxEventsVisible": 50    ← Increase if you have many events
     }
   }
   ```

5. **Create a test event:**
   - Create new event in WA with today's date
   - Publish it
   - Wait for ICS feed refresh (up to 15 minutes)
   - Check if test event appears

**Prevention:**

- Always have at least one future event for testing
- Monitor event count in feed
- Set up alert if feed becomes empty

---

### 3.2 All Events Filtered Out

**Symptoms:**

- Calendar has events in feed (verified by downloading ICS)
- Calendar displays but shows no events
- Changing filter buttons doesn't help

**Likely Causes:**

| Cause | How to Verify |
|-------|---------------|
| All filters are deselected | Check filter button states |
| Filter categories don't match event categories | Compare config categories with ICS |
| Events have no categories assigned | Check ICS for CATEGORIES field |
| Category names are case-sensitive mismatch | Compare exact spelling |

**Fix Steps:**

1. **Check current filter state:**
   - Look at filter buttons in calendar
   - At least one should be "active" (highlighted)
   - Click "All" or re-select all categories

2. **Compare category names:**

   In config:
   ```json
   "filterCategories": ["Social", "Outdoor", "Cultural"]
   ```

   In ICS file:
   ```
   CATEGORIES:social        ← Case mismatch! "social" vs "Social"
   ```

   Category names must match exactly (case-sensitive).

3. **Check if events have categories:**
   - Download ICS file
   - Search for `CATEGORIES:`
   - If missing, events won't match any filter
   - Assign categories in WA event settings

4. **Update config to match actual categories:**
   - List all unique categories from ICS file
   - Update `filterCategories` in config to match exactly
   - Include all categories you want to display

5. **Handle events without categories:**

   The widget should show uncategorized events when filters are active. If not, modify the filter logic or assign categories to all events.

**Prevention:**

- Document the exact category names used in WA
- Test filters after any category changes
- Consider a "Show All" option that bypasses filters

---

### 3.3 Events Outside Date Range

**Symptoms:**

- Events exist in feed (verified)
- Navigating to specific months shows events
- Current month view is empty but future months have events

**Likely Causes:**

| Cause | How to Verify |
|-------|---------------|
| No events this month | Navigate to months with events |
| Calendar defaulting to wrong month | Check initial date calculation |
| Timezone causing date shift | Event on Jan 1 showing as Dec 31 |

**Fix Steps:**

1. **Navigate to find events:**
   - Click "Next" to go to future months
   - Verify events appear in correct months
   - Note which months have events

2. **Check timezone configuration:**
   ```json
   {
     "organization": {
       "timezone": "America/Los_Angeles"
     }
   }
   ```

   Ensure this matches your WA timezone setting.

3. **Check for date boundary issues:**
   - Events near midnight may appear on wrong day
   - All-day events may shift by timezone offset
   - See Section 4 for timezone fixes

**Prevention:**

- Always test with events in current month
- Verify timezone settings match between WA and config

---

## Section 4: Timezone and Date/Time Issues

### 4.1 Events on Wrong Day

**Symptoms:**

- Event scheduled for Monday appears on Sunday (or Tuesday)
- All-day events shifted by one day
- Pattern: all events off by same amount

**Likely Causes:**

| Cause | How to Verify |
|-------|---------------|
| Timezone mismatch | Compare config timezone with WA timezone |
| UTC conversion error | Check if offset matches timezone hours |
| All-day event handling | Check if DTSTART has time component |

**Fix Steps:**

1. **Verify WA timezone:**
   - Go to: WA Admin > Settings > Regional settings
   - Note the timezone (e.g., "Pacific Time (US & Canada)")
   - This should be `America/Los_Angeles`

2. **Verify config timezone:**
   ```json
   {
     "organization": {
       "timezone": "America/Los_Angeles"
     }
   }
   ```

   Must match WA timezone exactly.

3. **Check ICS date format:**

   Download ICS and look for DTSTART:
   ```
   All-day: DTSTART;VALUE=DATE:20251215
   Timed:   DTSTART:20251215T180000
   UTC:     DTSTART:20251215T180000Z
   ```

   - All-day events should NOT have time component
   - `Z` suffix means UTC, needs conversion
   - No `Z` means local time

4. **Fix all-day event handling:**

   If all-day events are shifted, the parser may be applying timezone offset incorrectly. All-day events should use the date as-is without timezone conversion.

5. **Test with known event:**
   - Create event for specific date/time (e.g., Dec 15, 3:00 PM)
   - Check how it displays in calendar
   - Calculate expected vs actual difference
   - Adjust timezone or parser logic

**Prevention:**

- Set timezone once and don't change
- Test with events at various times of day
- Test near timezone boundaries

---

### 4.2 Event Times Wrong

**Symptoms:**

- Events appear on correct day but wrong time
- Times off by consistent amount (e.g., always 8 hours off)
- Times show as UTC instead of local

**Likely Causes:**

| Cause | How to Verify |
|-------|---------------|
| UTC not converted to local | Times off by timezone offset hours |
| Double timezone conversion | Times off by 2x timezone offset |
| Browser timezone override | Test in different browser/device |
| DST not applied | Times off by 1 hour near DST transitions |

**Fix Steps:**

1. **Calculate the offset:**
   - Note expected time (from WA event)
   - Note displayed time (in calendar)
   - Calculate difference
   - Pacific Time is UTC-8 (standard) or UTC-7 (daylight)

2. **Check for UTC indicator:**

   In ICS file:
   ```
   DTSTART:20251215T180000Z    ← Z means UTC, must convert
   DTSTART:20251215T180000     ← No Z means local time
   ```

3. **Verify timezone handling in code:**

   The `formatTime` function should use:
   ```javascript
   date.toLocaleTimeString('en-US', {
     hour: 'numeric',
     minute: '2-digit',
     timeZone: 'America/Los_Angeles'  ← Explicit timezone
   });
   ```

4. **Test DST transitions:**
   - Create event on March 10 (DST starts) at 1:30 AM
   - Create event on November 3 (DST ends) at 1:30 AM
   - Verify times display correctly on both sides

**Prevention:**

- Always specify timezone explicitly in formatting functions
- Test events near DST transitions
- Log raw and formatted times for debugging

---

### 4.3 DST (Daylight Saving Time) Errors

**Symptoms:**

- Events correct most of year, wrong in spring or fall
- Events off by 1 hour after DST transition
- All-day events spanning DST change display incorrectly

**Likely Causes:**

| Cause | How to Verify |
|-------|---------------|
| Hardcoded UTC offset | Using `-08:00` instead of timezone name |
| ICS TZID not processed | Check for VTIMEZONE blocks |
| Browser caching old times | Hard refresh (Ctrl+Shift+R) |

**Fix Steps:**

1. **Use timezone names, not offsets:**

   WRONG:
   ```javascript
   // Hardcoded offset breaks on DST
   var offset = -8 * 60 * 60 * 1000;
   ```

   CORRECT:
   ```javascript
   // Timezone name handles DST automatically
   date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
   ```

2. **Check ICS for timezone definition:**

   Look for VTIMEZONE block:
   ```
   BEGIN:VTIMEZONE
   TZID:America/Los_Angeles
   BEGIN:DAYLIGHT
   ...
   END:DAYLIGHT
   BEGIN:STANDARD
   ...
   END:STANDARD
   END:VTIMEZONE
   ```

   If present, parser should use this for conversion.

3. **Test across DST boundary:**
   - Create event on last Sunday before DST change
   - Create event on first Sunday after DST change
   - Both should display with correct local times

4. **Force cache refresh:**
   - Clear browser cache
   - Hard refresh the page (Ctrl+Shift+R / Cmd+Shift+R)
   - Test in incognito window

**Prevention:**

- Never hardcode UTC offsets
- Always use IANA timezone names
- Test during DST transition weeks (March and November)

---

## Section 5: Filter Problems

### 5.1 Filter Bar Not Showing

**Symptoms:**

- Calendar loads and shows events
- No filter buttons visible above/below calendar
- Expected categories not available for filtering

**Likely Causes:**

| Cause | How to Verify |
|-------|---------------|
| `filterCategories` is empty array | Check config |
| `filterCategories` is missing | Check config structure |
| CSS hiding filter bar | Inspect element in browser |
| Filter bar not rendered | Check `renderFilters()` output |

**Fix Steps:**

1. **Check config has filter categories:**
   ```json
   {
     "features": {
       "filterCategories": ["Social", "Outdoor", "Cultural", "Dining", "Learning"]
     }
   }
   ```

   - Array must have at least one item
   - Categories should be strings

2. **Verify in page source:**
   - View page source
   - Search for `filterCategories`
   - Ensure it's an array with values

3. **Check for CSS issues:**
   - Right-click where filters should be
   - Select "Inspect" or "Inspect Element"
   - Look for `cc-filters` element
   - Check if `display: none` or `visibility: hidden` is applied

4. **Check for JavaScript errors:**
   - Open browser console (F12)
   - Look for errors during `renderFilters()`
   - Fix any reported issues

**Prevention:**

- Include at least one filter category in config
- Test filter visibility after any config changes

---

### 5.2 Filter Buttons Don't Toggle

**Symptoms:**

- Filter buttons are visible
- Clicking buttons doesn't change their appearance
- Events don't filter when buttons clicked

**Likely Causes:**

| Cause | How to Verify |
|-------|---------------|
| Event handlers not attached | Check browser console for errors |
| Wrong element selected | Check `data-filter` attributes |
| `activeFilters` array not updating | Add console.log to debug |
| Re-render not triggered | Check if `render()` is called |

**Fix Steps:**

1. **Check for JavaScript errors:**
   - Open browser console
   - Click a filter button
   - Look for errors

2. **Verify event handlers:**
   - In browser console, type:
     ```javascript
     document.querySelectorAll('[data-filter]').length
     ```
   - Should return number of filter buttons
   - If 0, handlers aren't attached

3. **Debug filter logic:**
   - Add to `attachHandlers()` function:
     ```javascript
     console.log('Filter clicked:', filter);
     console.log('Active filters:', activeFilters);
     ```
   - Click filters and check console output

4. **Check render cycle:**
   - Ensure `render()` is called after filter change
   - Check that `render()` calls `attachHandlers()` again

**Prevention:**

- Test filter clicks immediately after deployment
- Log filter state changes during development

---

### 5.3 Categories Not Matching Events

**Symptoms:**

- Filter buttons work (toggle on/off)
- Selecting a category shows no events
- Unrelated categories show events

**Likely Causes:**

| Cause | How to Verify |
|-------|---------------|
| Category names don't match | Compare config with ICS CATEGORIES |
| Case sensitivity mismatch | "Social" vs "social" |
| Extra whitespace | "Social " vs "Social" |
| Different category source | WA uses tags vs categories |

**Fix Steps:**

1. **Extract actual categories from ICS:**
   - Download ICS file
   - Search for all `CATEGORIES:` lines
   - List unique values

2. **Compare with config:**
   - Open config and find `filterCategories`
   - Compare each value with ICS categories
   - Fix any mismatches (exact case and spelling)

3. **Update config to match:**
   ```json
   "filterCategories": ["Social Events", "outdoor-activities", "CULTURAL"]
   ```

   Use exact strings from ICS file.

4. **Standardize categories in WA:**
   - Go to: WA Admin > Events
   - Review event categories/tags
   - Use consistent naming convention
   - Update existing events if needed

**Prevention:**

- Document official category names
- Use consistent case (e.g., all Title Case)
- Validate category names during event creation

---

## Section 6: CSS and Styling Issues

### 6.1 Calendar Looks Broken

**Symptoms:**

- Calendar elements overlap or misaligned
- Text unreadable (wrong color, size, or font)
- Buttons don't look like buttons
- Grid layout not displaying properly

**Likely Causes:**

| Cause | How to Verify |
|-------|---------------|
| WA theme CSS conflicts | Inspect elements, check applied styles |
| Missing calendar CSS | Check if `<style>` block is present |
| CSS specificity issues | WA styles overriding calendar styles |
| Mobile styles broken | Test on different screen sizes |

**Fix Steps:**

1. **Inspect broken elements:**
   - Right-click broken element
   - Select "Inspect"
   - In Styles panel, see which CSS rules apply
   - Look for crossed-out (overridden) styles

2. **Check CSS is present:**
   - View page source
   - Search for `#clubcalendar-root`
   - Verify `<style>` block with calendar CSS exists

3. **Increase CSS specificity:**

   If WA styles override calendar styles, increase specificity:

   BEFORE:
   ```css
   .cc-header { ... }
   ```

   AFTER:
   ```css
   #clubcalendar-root .cc-header { ... }
   ```

   Or add `!important`:
   ```css
   .cc-header {
     background: #f9fafb !important;
   }
   ```

4. **Test responsive breakpoints:**
   - Open browser DevTools
   - Click device toggle (mobile icon)
   - Test at various widths
   - Fix mobile-specific issues

**Prevention:**

- Use `#clubcalendar-root` prefix on all selectors
- Test on WA theme variations
- Include mobile styles in initial deployment

---

### 6.2 Event Colors Wrong

**Symptoms:**

- All events same color (ignoring categories)
- Colors don't match config
- Some categories have color, others don't

**Likely Causes:**

| Cause | How to Verify |
|-------|---------------|
| Color config not loaded | Check `eventColors` in config |
| Category names don't match | Compare color keys with event categories |
| Missing default color | Events without categories have no color |
| CSS overriding inline styles | Inspect event elements |

**Fix Steps:**

1. **Verify color configuration:**
   ```json
   {
     "styling": {
       "eventColors": {
         "default": "#2563eb",
         "Social": "#16a34a",
         "Outdoor": "#0d9488",
         "Cultural": "#9333ea"
       }
     }
   }
   ```

   - Keys must match event category names exactly
   - Values must be valid CSS colors (hex, rgb, or names)

2. **Check `getEventColor` function:**
   - Add logging to see which color is selected
   - Verify category lookup logic

3. **Ensure default color exists:**
   - Events without categories should use `default` color
   - Add `"default": "#2563eb"` if missing

4. **Check for CSS conflicts:**
   - Inspect event element
   - Verify `background` inline style is applied
   - Check if CSS rules override it

**Prevention:**

- Always include a `default` color
- Use exact category names from WA
- Test colors after any config changes

---

## Section 7: General Debugging

### 7.1 How to Access Browser Console

**Chrome / Edge:**

1. Right-click page > "Inspect"
2. Click "Console" tab
3. Or press F12, then click "Console"

**Firefox:**

1. Right-click page > "Inspect Element"
2. Click "Console" tab
3. Or press F12, then click "Console"

**Safari:**

1. Safari > Preferences > Advanced > "Show Develop menu"
2. Develop > Show JavaScript Console
3. Or press Cmd+Option+C

### 7.2 Common Console Errors

| Error | Meaning | Fix |
|-------|---------|-----|
| `Uncaught SyntaxError` | JavaScript syntax error | Check for typos in code |
| `Uncaught ReferenceError: X is not defined` | Variable/function doesn't exist | Check spelling, ensure code loaded |
| `Uncaught TypeError: Cannot read property 'X' of undefined` | Object is null/undefined | Add null checks before accessing |
| `CORS policy` | Cross-origin request blocked | See Section 2.3 |
| `404 Not Found` | Resource doesn't exist | Check URLs in config |
| `Failed to fetch` | Network request failed | Check network, URL, CORS |

### 7.3 Adding Debug Logging

Temporarily add logging to diagnose issues:

```javascript
// Add at start of init()
console.log('ClubCalendar: Starting initialization');

// Add after config load
console.log('ClubCalendar: Config loaded', config);

// Add after events load
console.log('ClubCalendar: Events loaded', events.length, 'events');

// Add in render()
console.log('ClubCalendar: Rendering', currentView, 'view');
```

Remove debug logging before production deployment.

### 7.4 Testing in Isolation

Create a minimal test page to isolate issues:

```html
<!DOCTYPE html>
<html>
<head>
  <title>ClubCalendar Test</title>
</head>
<body>
  <h1>ClubCalendar Debug Page</h1>

  <!-- Inline config for testing -->
  <script id="clubcalendar-config" type="application/json">
  {
    "organization": { "timezone": "America/Los_Angeles" },
    "dataSource": {
      "type": "ics-feed",
      "url": "YOUR_ICS_URL_HERE"
    },
    "display": { "defaultView": "month" },
    "features": { "filterCategories": ["Test"] }
  }
  </script>

  <div id="clubcalendar-root">
    <p>Loading...</p>
  </div>

  <!-- Paste calendar JavaScript here -->
  <script>
    // ... calendar code ...
  </script>
</body>
</html>
```

Open this file locally to test without WA interference.

---

## Section 8: Rollback Procedures

### 8.1 Quick Rollback (Revert Gadget HTML)

If the calendar is broken and you need to restore service quickly:

**Step 1: Access the page**

1. Log in to WA Admin
2. Go to: Website > Site pages
3. Find the Events Calendar page
4. Click to edit

**Step 2: Revert gadget content**

1. Click the Custom HTML gadget
2. Switch to HTML mode (`</>` button)
3. Select all content (Ctrl+A / Cmd+A)
4. Delete all content

**Step 3: Paste last known good version**

1. Locate your backup HTML (see Section 8.4)
2. Paste the backup content
3. Click Save
4. Click Publish

**Step 4: Verify**

1. Open events page in new browser tab
2. Confirm calendar works
3. Test basic functionality (navigation, events display)

---

### 8.2 Full Rollback (Remove Calendar Completely)

If you need to completely remove ClubCalendar:

**Step 1: Remove events page calendar**

1. Edit Events Calendar page
2. Click the Custom HTML gadget
3. Delete the gadget entirely (or replace with "Calendar coming soon" message)
4. Save and Publish

**Step 2: Unpublish config page**

1. Go to: Website > Site pages
2. Find ClubCalendar Config page
3. Click Settings
4. Uncheck "Published"
5. Save

**Step 3: Update navigation**

1. Go to: Website > Navigation
2. Remove Events Calendar from menu (if added)
3. Save

**Step 4: Notify stakeholders**

- Email board/tech team about rollback
- Document reason for rollback
- Create ticket for fix

---

### 8.3 Rollback Checklist

Print this checklist for emergency use:

```
CLUBCALENDAR EMERGENCY ROLLBACK CHECKLIST
=========================================

Date: _____________ Time: _____________
Operator: _____________________________
Reason for rollback: __________________

PRE-ROLLBACK:
[ ] Screenshot current error/issue
[ ] Note browser console errors
[ ] Save current HTML to backup file

ROLLBACK STEPS:
[ ] Log in to WA Admin
[ ] Navigate to Website > Site pages
[ ] Edit Events Calendar page
[ ] Open Custom HTML gadget
[ ] Switch to HTML mode
[ ] Delete current content
[ ] Paste last known good version
[ ] Save gadget
[ ] Publish page

VERIFICATION:
[ ] Open events page in new tab
[ ] Verify calendar displays
[ ] Test month navigation
[ ] Test at least one filter
[ ] Test logged-out view (incognito)

POST-ROLLBACK:
[ ] Notify team of rollback
[ ] Document issue details
[ ] Create fix ticket
[ ] Schedule post-mortem if needed

BACKUP FILE LOCATION:
_____________________________________

LAST KNOWN GOOD VERSION DATE:
_____________________________________
```

---

### 8.4 Maintaining Backup Versions

**Best Practice: Version Control**

Keep dated backups of working configurations:

```
clubcalendar-backups/
├── 2025-12-15-config-page.html
├── 2025-12-15-events-page.html
├── 2025-12-20-config-page.html    (after filter update)
├── 2025-12-20-events-page.html
└── CURRENT-KNOWN-GOOD.txt         (points to latest working version)
```

**When to Create Backups:**

- Before any config change
- After successful deployment
- Before WA platform updates
- Weekly (automated if possible)

**Backup Procedure:**

1. Navigate to config page
2. View Page Source
3. Copy all content
4. Save to dated file: `YYYY-MM-DD-config-page.html`

5. Navigate to events page
6. View Page Source
7. Find the Custom HTML gadget content
8. Copy the content
9. Save to dated file: `YYYY-MM-DD-events-page.html`

10. Update `CURRENT-KNOWN-GOOD.txt` with the date

**Storage Options:**

- Git repository (recommended)
- Shared team drive
- Password manager secure notes
- Email to yourself (searchable archive)

---

## Section 9: Escalation Path

### When to Escalate

Escalate if:

- Rollback doesn't resolve the issue
- Issue affects WA platform functionality
- Security concern identified
- Data loss suspected
- Multiple failed fix attempts

### Escalation Contacts

| Issue Type | Contact | Method |
|------------|---------|--------|
| WA platform issues | Wild Apricot Support | support.wildapricot.com |
| ClubCalendar code bugs | ClubOS Team | GitHub issue |
| SBNC-specific config | Tech Committee | Internal email |
| Security concerns | Tech Committee Chair | Phone + email |

### Information to Include

When escalating, provide:

1. **Symptoms**: What user sees
2. **Timeline**: When issue started
3. **Changes**: What changed before issue
4. **Console errors**: Copy/paste from browser
5. **Screenshots**: Visual evidence
6. **Attempted fixes**: What you tried
7. **Impact**: Who is affected, severity

---

## Related Documents

- [ClubCalendar Playground Runbook](./SBNC_PLAYGROUND_CLUBCALENDAR_RUNBOOK.md) - Installation steps
- [Config Templates](../../config-templates/clubcalendar/README.md) - Pre-built configs
- [WA Custom HTML Guide](../MIGRATION/WILD_APRICOT_CUSTOM_HTML_BLOCKS_GUIDE.md) - WA embed patterns

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-26 | Worker 5 | Initial troubleshooting guide |
