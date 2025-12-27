# ClubCalendar SBNC Playground Install Runbook

```
Document Type: Step-by-Step Runbook
Audience: SBNC Operators (Tech Chair or designee)
Browser: Safari (macOS)
Environment: WA Playground (sbnc-website-redesign-playground.wildapricot.org)
Time Required: 30-45 minutes
```

---

## Pre-Flight Checklist

Before starting, confirm:

- [ ] You have WA admin access to the playground site
- [ ] You are using Safari on macOS
- [ ] You have the widget files hosted (see SBNC_HOSTING_GUIDE.md)
- [ ] You know your WA calendar widget ID
- [ ] You have copied the paste-ready HTML blocks to your clipboard app

**Widget hosting URL (example):**
```
https://sbnctech.github.io/sbnc-widget-host/
```

**Your WA calendar feed URL (example):**
```
https://sbnc-website-redesign-playground.wildapricot.org/widget/Calendar/12345.ics
```

---

## PART 1: Create the Config Page

### Step 1.1: Log into WA Admin

1. Open Safari
2. Navigate to: `https://sbnc-website-redesign-playground.wildapricot.org/admin`
3. Click **Log in**
4. Enter your admin credentials
5. Click **Sign in**

**Checkpoint:** You see the WA admin dashboard.

---

### Step 1.2: Navigate to Site Pages

1. In the left sidebar, click **Website**
2. In the submenu, click **Site pages**

**Checkpoint:** You see a list of existing pages.

---

### Step 1.3: Create New Config Page

1. Click the **+ Add page** button (top right)
2. In the "Page title" field, type: `Widget Config`
3. The URL will auto-fill as: `widget-config`
4. Under "Page access", select: **Administrators only**
5. Click **Save**

**Checkpoint:** You see the page editor for "Widget Config".

---

### Step 1.4: Add Custom HTML Gadget

1. In the page editor, click **+ Add gadget**
2. In the gadget picker, scroll to find **Custom HTML**
3. Click **Custom HTML** to add it

**Checkpoint:** A blank Custom HTML gadget appears on the page.

---

### Step 1.5: Open HTML Source Editor

1. Click on the Custom HTML gadget to select it
2. Click the **Edit** button (pencil icon) that appears
3. In the editor toolbar, click the **< >** button (Source/HTML view)
   - If you don't see this button, look for "Source" or "HTML" in the toolbar menu

**Checkpoint:** You see a text editor with raw HTML capability.

---

### Step 1.6: Paste Config Page HTML

1. Select all existing content in the editor (Cmd+A)
2. Delete it
3. Paste the following HTML block:

```html
<!--
================================================================================
SBNC WIDGET CONFIGURATION PAGE
================================================================================
-->

<style>
  .sbnc-config-container {
    font-family: system-ui, -apple-system, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  .sbnc-config-header {
    background: #1e3a5f;
    color: white;
    padding: 16px 20px;
    border-radius: 8px 8px 0 0;
  }
  .sbnc-config-header h2 { margin: 0; font-size: 1.25rem; }
  .sbnc-config-body {
    border: 2px solid #1e3a5f;
    border-top: none;
    border-radius: 0 0 8px 8px;
    padding: 20px;
    background: #f8fafc;
  }
  .sbnc-config-instructions {
    background: #e0f2fe;
    border: 1px solid #7dd3fc;
    border-radius: 6px;
    padding: 12px 16px;
    margin-bottom: 16px;
    font-size: 0.9rem;
  }
  .sbnc-config-btn {
    background: #2563eb;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    margin-right: 8px;
  }
  .sbnc-config-btn:hover { background: #1d4ed8; }
  .sbnc-config-btn-secondary {
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
  }
  .sbnc-config-btn-secondary:hover { background: #f3f4f6; }
  .sbnc-config-status {
    margin-top: 12px;
    padding: 10px 16px;
    border-radius: 6px;
    display: none;
  }
  .sbnc-config-status.valid {
    display: block;
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #6ee7b7;
  }
  .sbnc-config-status.invalid {
    display: block;
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  }
  .sbnc-config-json {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 16px;
    border-radius: 6px;
    font-family: 'SF Mono', Monaco, monospace;
    font-size: 12px;
    line-height: 1.5;
    white-space: pre;
    overflow-x: auto;
    margin-top: 16px;
  }
</style>

<div class="sbnc-config-container">
  <div class="sbnc-config-header">
    <h2>SBNC Widget Configuration</h2>
  </div>
  <div class="sbnc-config-body">
    <div class="sbnc-config-instructions">
      <strong>To edit:</strong> Click Edit on this page → Click this gadget →
      Switch to Source/HTML view → Find the JSON between CONFIG START and CONFIG END →
      Make changes → Validate → Publish
    </div>

    <button class="sbnc-config-btn" onclick="sbncValidate()">Validate Config</button>
    <button class="sbnc-config-btn sbnc-config-btn-secondary" onclick="sbncCopy()">Copy Config</button>

    <div id="sbnc-status" class="sbnc-config-status"></div>

    <script type="application/json" id="sbnc-widget-config">
<!-- CONFIG START -->
{
  "_version": "1.0.0",
  "_lastModified": "2025-12-26",
  "_modifiedBy": "YOUR_NAME_HERE",

  "organization": {
    "name": "Santa Barbara Newcomers Club",
    "shortName": "SBNC",
    "timezone": "America/Los_Angeles"
  },

  "clubcalendar": {
    "dataSource": {
      "type": "ics-feed",
      "url": "https://sbnc-website-redesign-playground.wildapricot.org/widget/Calendar/YOUR_CALENDAR_ID.ics",
      "refreshIntervalMinutes": 15
    },
    "display": {
      "defaultView": "month",
      "views": ["month", "week", "list"],
      "showPastEvents": false,
      "maxEventsVisible": 50
    },
    "eventColors": {
      "default": "#2563eb",
      "social": "#16a34a",
      "interest": "#9333ea",
      "general": "#dc2626"
    },
    "features": {
      "showRegistrationStatus": false,
      "showEventDetails": true,
      "linkToEventPage": true,
      "eventPageBaseUrl": "https://sbnc-website-redesign-playground.wildapricot.org/event-"
    }
  },

  "widgetHostUrl": "https://sbnctech.github.io/sbnc-widget-host"
}
<!-- CONFIG END -->
    </script>

    <div class="sbnc-config-json" id="sbnc-display">Loading...</div>
  </div>
</div>

<script>
(function() {
  function getConfig() {
    var el = document.getElementById('sbnc-widget-config');
    if (!el) return null;
    var text = el.textContent.replace(/<!--[\s\S]*?-->/g, '').trim();
    return JSON.parse(text);
  }

  function display() {
    var displayEl = document.getElementById('sbnc-display');
    try {
      var config = getConfig();
      displayEl.textContent = JSON.stringify(config, null, 2);
    } catch (e) {
      displayEl.textContent = 'Error: ' + e.message;
    }
  }

  window.sbncValidate = function() {
    var statusEl = document.getElementById('sbnc-status');
    try {
      var config = getConfig();
      var errors = [];
      if (!config.organization) errors.push('Missing organization');
      if (!config.clubcalendar) errors.push('Missing clubcalendar');
      if (config.clubcalendar && config.clubcalendar.dataSource) {
        if (config.clubcalendar.dataSource.url.indexOf('YOUR_CALENDAR_ID') !== -1) {
          errors.push('Replace YOUR_CALENDAR_ID with actual ID');
        }
      }
      if (config._modifiedBy === 'YOUR_NAME_HERE') {
        errors.push('Replace YOUR_NAME_HERE with your name');
      }
      if (errors.length > 0) {
        statusEl.className = 'sbnc-config-status invalid';
        statusEl.innerHTML = '<strong>Fix these:</strong><br>' + errors.join('<br>');
      } else {
        statusEl.className = 'sbnc-config-status valid';
        statusEl.textContent = 'Config is valid! Safe to publish.';
      }
      display();
    } catch (e) {
      statusEl.className = 'sbnc-config-status invalid';
      statusEl.textContent = 'JSON Error: ' + e.message;
    }
  };

  window.sbncCopy = function() {
    try {
      var config = getConfig();
      navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      alert('Copied!');
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  display();
})();
</script>
```

---

### Step 1.7: Edit the Config Values

While still in Source/HTML view, find and replace these values:

| Find | Replace With |
|------|--------------|
| `YOUR_NAME_HERE` | Your actual name |
| `YOUR_CALENDAR_ID` | Your WA calendar widget ID (e.g., `12345`) |

**How to find your Calendar ID:**
1. Open another browser tab
2. Go to any page with a WA calendar widget
3. Edit that page
4. Click the calendar widget
5. Click Settings
6. Look for the iCal URL - the number before `.ics` is your ID

---

### Step 1.8: Save the Gadget

1. Click **Save** or **Done** on the gadget editor
2. The gadget should now display the config page interface

**Checkpoint:** You see a blue header saying "SBNC Widget Configuration" with buttons.

---

### Step 1.9: Validate the Config

1. Click the **Validate Config** button
2. Look for green "Config is valid!" message
3. If you see red errors, fix them and validate again

**Checkpoint:** Green validation message appears.

---

### Step 1.10: Publish the Config Page

1. Click the **Publish** button (top right of page editor)
2. Confirm publication if prompted

**Checkpoint:** Page status shows "Published".

---

### Step 1.11: Record the Config Page URL

1. Click **View page** or open the page in a new tab
2. Copy the full URL from the address bar
3. Save it - you'll need it for the events page

**Expected URL format:**
```
https://sbnc-website-redesign-playground.wildapricot.org/widget-config
```

---

## PART 2: Create the Events Page

### Step 2.1: Navigate Back to Site Pages

1. In WA admin, click **Website** → **Site pages**

---

### Step 2.2: Create New Events Page

1. Click **+ Add page**
2. Page title: `Calendar Demo`
3. URL: `calendar-demo`
4. Page access: **Everyone** (for testing both logged in and out)
5. Click **Save**

**Checkpoint:** You see the page editor for "Calendar Demo".

---

### Step 2.3: Add Heading (Optional)

1. Click **+ Add gadget**
2. Select **Text/HTML** or **Content**
3. Add a heading: "SBNC Events Calendar"
4. Save the gadget

---

### Step 2.4: Add Custom HTML Gadget for Calendar

1. Click **+ Add gadget**
2. Select **Custom HTML**
3. Click **Edit** on the gadget
4. Switch to **Source/HTML view**

---

### Step 2.5: Paste Calendar Widget HTML

1. Delete any existing content
2. Paste the following:

```html
<!--
================================================================================
SBNC CLUBCALENDAR WIDGET
================================================================================
This widget displays the SBNC events calendar.
Configuration is loaded from the Widget Config page.
================================================================================
-->

<style>
  #sbnc-calendar-container {
    font-family: system-ui, -apple-system, sans-serif;
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px 0;
  }

  #sbnc-calendar-loading {
    text-align: center;
    padding: 60px 20px;
    color: #6b7280;
  }

  #sbnc-calendar-error {
    background: #fee2e2;
    border: 1px solid #fca5a5;
    color: #991b1b;
    padding: 16px 20px;
    border-radius: 8px;
    display: none;
  }

  #sbnc-calendar-widget {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }

  .sbnc-cal-header {
    background: #1e3a5f;
    color: white;
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .sbnc-cal-title {
    font-size: 1.25rem;
    font-weight: 600;
  }

  .sbnc-cal-nav button {
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    margin-left: 8px;
  }

  .sbnc-cal-nav button:hover {
    background: rgba(255,255,255,0.3);
  }

  .sbnc-cal-body {
    background: white;
    min-height: 400px;
    padding: 20px;
  }

  .sbnc-cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background: #e5e7eb;
  }

  .sbnc-cal-day-header {
    background: #f3f4f6;
    padding: 8px;
    text-align: center;
    font-weight: 600;
    font-size: 0.8rem;
    color: #6b7280;
  }

  .sbnc-cal-day {
    background: white;
    min-height: 100px;
    padding: 8px;
  }

  .sbnc-cal-day-num {
    font-weight: 600;
    color: #374151;
    margin-bottom: 4px;
  }

  .sbnc-cal-day.other-month {
    background: #f9fafb;
  }

  .sbnc-cal-day.other-month .sbnc-cal-day-num {
    color: #9ca3af;
  }

  .sbnc-cal-event {
    background: #2563eb;
    color: white;
    font-size: 0.75rem;
    padding: 2px 6px;
    border-radius: 3px;
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }

  .sbnc-cal-event:hover {
    background: #1d4ed8;
  }

  .sbnc-cal-event.social { background: #16a34a; }
  .sbnc-cal-event.social:hover { background: #15803d; }
  .sbnc-cal-event.interest { background: #9333ea; }
  .sbnc-cal-event.interest:hover { background: #7e22ce; }
  .sbnc-cal-event.general { background: #dc2626; }
  .sbnc-cal-event.general:hover { background: #b91c1c; }

  .sbnc-cal-footer {
    background: #f9fafb;
    padding: 12px 20px;
    border-top: 1px solid #e5e7eb;
    font-size: 0.8rem;
    color: #6b7280;
  }

  .sbnc-debug-info {
    margin-top: 20px;
    padding: 12px;
    background: #f3f4f6;
    border-radius: 6px;
    font-family: monospace;
    font-size: 0.75rem;
    color: #6b7280;
  }
</style>

<div id="sbnc-calendar-container">
  <div id="sbnc-calendar-loading">
    Loading calendar...
  </div>

  <div id="sbnc-calendar-error"></div>

  <div id="sbnc-calendar-widget" style="display: none;">
    <div class="sbnc-cal-header">
      <span class="sbnc-cal-title" id="sbnc-cal-month-title">December 2025</span>
      <div class="sbnc-cal-nav">
        <button onclick="sbncCalPrev()">← Prev</button>
        <button onclick="sbncCalToday()">Today</button>
        <button onclick="sbncCalNext()">Next →</button>
      </div>
    </div>
    <div class="sbnc-cal-body">
      <div class="sbnc-cal-grid" id="sbnc-cal-grid">
        <!-- Calendar grid will be generated here -->
      </div>
    </div>
    <div class="sbnc-cal-footer">
      <span id="sbnc-cal-status">Loading events...</span>
    </div>
  </div>

  <div class="sbnc-debug-info" id="sbnc-debug">
    Debug: Initializing...
  </div>
</div>

<script>
(function() {
  'use strict';

  var CONFIG_URL = '/widget-config';
  var config = null;
  var events = [];
  var currentDate = new Date();

  var debugEl = document.getElementById('sbnc-debug');
  function debug(msg) {
    debugEl.textContent = 'Debug: ' + msg + ' (' + new Date().toLocaleTimeString() + ')';
    console.log('[ClubCalendar]', msg);
  }

  function showError(msg) {
    document.getElementById('sbnc-calendar-loading').style.display = 'none';
    var errorEl = document.getElementById('sbnc-calendar-error');
    errorEl.style.display = 'block';
    errorEl.textContent = 'Error: ' + msg;
    debug('Error: ' + msg);
  }

  function showCalendar() {
    document.getElementById('sbnc-calendar-loading').style.display = 'none';
    document.getElementById('sbnc-calendar-widget').style.display = 'block';
  }

  // Load config from config page
  function loadConfig() {
    debug('Loading config from ' + CONFIG_URL);

    fetch(CONFIG_URL)
      .then(function(response) {
        if (!response.ok) throw new Error('Config page returned ' + response.status);
        return response.text();
      })
      .then(function(html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var configEl = doc.getElementById('sbnc-widget-config');

        if (!configEl) throw new Error('Config element not found on config page');

        var configText = configEl.textContent.replace(/<!--[\s\S]*?-->/g, '').trim();
        config = JSON.parse(configText);

        debug('Config loaded: v' + config._version);
        loadEvents();
      })
      .catch(function(err) {
        showError('Failed to load config: ' + err.message);
      });
  }

  // Load events (demo: generate sample events)
  function loadEvents() {
    debug('Loading events...');

    // For demo purposes, generate sample events
    // In production, this would fetch from the ICS feed
    var sampleEvents = [
      { title: 'Monthly General Meeting', date: '2025-12-15', category: 'general' },
      { title: 'Wine Tasting Social', date: '2025-12-18', category: 'social' },
      { title: 'Book Club', date: '2025-12-20', category: 'interest' },
      { title: 'New Member Welcome', date: '2025-12-22', category: 'social' },
      { title: 'Holiday Party', date: '2025-12-28', category: 'social' },
      { title: 'Board Meeting', date: '2026-01-05', category: 'general' },
      { title: 'Hiking Group', date: '2026-01-08', category: 'interest' },
      { title: 'Coffee Chat', date: '2026-01-10', category: 'social' }
    ];

    events = sampleEvents;
    debug('Loaded ' + events.length + ' events');

    showCalendar();
    renderCalendar();
  }

  function renderCalendar() {
    var year = currentDate.getFullYear();
    var month = currentDate.getMonth();

    // Update title
    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('sbnc-cal-month-title').textContent =
      monthNames[month] + ' ' + year;

    // Generate calendar grid
    var grid = document.getElementById('sbnc-cal-grid');
    grid.innerHTML = '';

    // Day headers
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(function(day) {
      var div = document.createElement('div');
      div.className = 'sbnc-cal-day-header';
      div.textContent = day;
      grid.appendChild(div);
    });

    // Find first day of month
    var firstDay = new Date(year, month, 1);
    var lastDay = new Date(year, month + 1, 0);
    var startPadding = firstDay.getDay();

    // Previous month padding
    var prevMonth = new Date(year, month, 0);
    for (var i = startPadding - 1; i >= 0; i--) {
      var div = document.createElement('div');
      div.className = 'sbnc-cal-day other-month';
      div.innerHTML = '<div class="sbnc-cal-day-num">' + (prevMonth.getDate() - i) + '</div>';
      grid.appendChild(div);
    }

    // Current month days
    for (var d = 1; d <= lastDay.getDate(); d++) {
      var div = document.createElement('div');
      div.className = 'sbnc-cal-day';

      var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var dayEvents = events.filter(function(e) { return e.date === dateStr; });

      var html = '<div class="sbnc-cal-day-num">' + d + '</div>';
      dayEvents.forEach(function(e) {
        html += '<div class="sbnc-cal-event ' + e.category + '">' + e.title + '</div>';
      });

      div.innerHTML = html;
      grid.appendChild(div);
    }

    // Next month padding
    var totalCells = startPadding + lastDay.getDate();
    var remaining = (7 - (totalCells % 7)) % 7;
    for (var n = 1; n <= remaining; n++) {
      var div = document.createElement('div');
      div.className = 'sbnc-cal-day other-month';
      div.innerHTML = '<div class="sbnc-cal-day-num">' + n + '</div>';
      grid.appendChild(div);
    }

    // Update status
    var eventsThisMonth = events.filter(function(e) {
      return e.date.startsWith(year + '-' + String(month + 1).padStart(2, '0'));
    }).length;
    document.getElementById('sbnc-cal-status').textContent =
      eventsThisMonth + ' events this month | Config: v' + (config ? config._version : '?');
  }

  window.sbncCalPrev = function() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  };

  window.sbncCalNext = function() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  };

  window.sbncCalToday = function() {
    currentDate = new Date();
    renderCalendar();
  };

  // Initialize
  loadConfig();
})();
</script>
```

---

### Step 2.6: Save the Calendar Gadget

1. Click **Save** or **Done**

**Checkpoint:** The calendar widget appears with "Loading calendar..."

---

### Step 2.7: Publish the Events Page

1. Click **Publish** (top right)
2. Confirm if prompted

**Checkpoint:** Page status shows "Published".

---

## PART 3: Test the Installation

### Test 3.1: Test as Admin (Logged In)

1. Click **View page** to see the published events page
2. Verify:
   - [ ] Calendar header appears (blue bar with month/year)
   - [ ] Navigation buttons work (Prev, Today, Next)
   - [ ] Sample events appear on the calendar
   - [ ] Debug info shows "Config loaded"
   - [ ] Footer shows event count and config version

**Success criteria:** Calendar displays with sample events and shows config version.

---

### Test 3.2: Test Config Page Access

1. Navigate to your config page URL:
   ```
   https://sbnc-website-redesign-playground.wildapricot.org/widget-config
   ```
2. Verify:
   - [ ] Blue header "SBNC Widget Configuration" appears
   - [ ] JSON configuration is displayed
   - [ ] Validate button shows green "Config is valid!"
   - [ ] Copy button works

---

### Test 3.3: Test as Logged Out User

1. Open a new **Private/Incognito window** in Safari
   - Safari menu → File → New Private Window
2. Navigate to your events page:
   ```
   https://sbnc-website-redesign-playground.wildapricot.org/calendar-demo
   ```
3. Verify:
   - [ ] Calendar displays (you're not logged in)
   - [ ] Events are visible
   - [ ] Navigation works

---

### Test 3.4: Verify Config Page is Protected

1. In the same private window (logged out)
2. Navigate to config page:
   ```
   https://sbnc-website-redesign-playground.wildapricot.org/widget-config
   ```
3. Verify:
   - [ ] Page requires login OR shows access denied
   - [ ] Config is NOT visible to public

**Success criteria:** Config page is admin-only; events page is public.

---

## PART 4: What Success Looks Like

### Config Page (Admin Only)

```
+--------------------------------------------------+
| SBNC Widget Configuration                        |
+--------------------------------------------------+
| To edit: Click Edit on this page → ...           |
|                                                  |
| [Validate Config] [Copy Config]                  |
|                                                  |
| ✓ Config is valid! Safe to publish.             |
|                                                  |
| {                                                |
|   "_version": "1.0.0",                           |
|   "_lastModified": "2025-12-26",                 |
|   ...                                            |
| }                                                |
+--------------------------------------------------+
```

### Events Page (Public)

```
+--------------------------------------------------+
|                SBNC Events Calendar              |
+--------------------------------------------------+
| December 2025                    [←Prev][Today][Next→]
+--------------------------------------------------+
| Sun | Mon | Tue | Wed | Thu | Fri | Sat |
+-----+-----+-----+-----+-----+-----+-----+
|     |     |     |     |     |     |     |
|     |  15 |     |  18 |     |  20 |     |
|     | Gen |     |Wine |     |Book |     |
|     | Mtg |     |Tast |     |Club |     |
+-----+-----+-----+-----+-----+-----+-----+
| 3 events this month | Config: v1.0.0    |
+--------------------------------------------------+
| Debug: Config loaded (3:45:22 PM)               |
+--------------------------------------------------+
```

---

## PART 5: Rollback Procedures

### Rollback Option A: Unpublish Pages

If something goes wrong, unpublish to hide from public:

1. Go to **Website** → **Site pages**
2. Find the problem page
3. Click the **⋮** menu next to it
4. Click **Unpublish**

The page remains in WA but is not visible to visitors.

---

### Rollback Option B: Restore Previous HTML

If you need to undo HTML changes:

1. Edit the page
2. Click the Custom HTML gadget
3. Switch to Source/HTML view
4. Select all (Cmd+A) and delete
5. Paste the original/backup HTML
6. Save and publish

---

### Rollback Option C: Delete the Gadget

If the gadget is broken beyond repair:

1. Edit the page
2. Click the Custom HTML gadget
3. Click the **trash/delete** icon
4. Confirm deletion
5. Re-add a fresh Custom HTML gadget with correct code

---

### Rollback Option D: Delete the Page

Nuclear option - removes everything:

1. Go to **Website** → **Site pages**
2. Find the page
3. Click the **⋮** menu
4. Click **Delete**
5. Confirm deletion

Start over with Part 1 or Part 2.

---

## Troubleshooting

### "Config element not found"

**Cause:** Config page doesn't have the correct HTML or isn't published.

**Fix:**
1. Verify config page is published
2. Verify the HTML contains `id="sbnc-widget-config"`
3. Check the config page URL matches what the widget expects

---

### Calendar shows "Loading..." forever

**Cause:** Config page fetch failed.

**Fix:**
1. Check browser console for errors (Cmd+Option+J)
2. Verify config page URL is correct
3. Verify config page is published
4. Check for CORS errors (should not happen on same domain)

---

### Validation shows errors

**Cause:** Placeholder values not replaced.

**Fix:**
1. Edit the config page HTML source
2. Replace `YOUR_CALENDAR_ID` with actual ID
3. Replace `YOUR_NAME_HERE` with your name
4. Save and validate again

---

### Page shows blank

**Cause:** JavaScript error or malformed HTML.

**Fix:**
1. Check browser console for errors
2. Verify HTML is complete (no missing closing tags)
3. Re-paste the complete HTML block

---

## Quick Reference

### URLs

| Page | URL |
|------|-----|
| Config Page | `/widget-config` |
| Events Page | `/calendar-demo` |
| WA Admin | `/admin` |

### Key Element IDs

| Element | ID |
|---------|-----|
| Config JSON | `sbnc-widget-config` |
| Calendar Container | `sbnc-calendar-container` |
| Debug Info | `sbnc-debug` |

### Files Needed

| File | Purpose |
|------|---------|
| Config page HTML | Stores widget configuration |
| Events page HTML | Displays calendar widget |

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-26 | System | Initial runbook |
