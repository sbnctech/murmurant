# ClubCalendar Installation Runbook: SBNC Playground

```
Audience: SBNC Technical Staff
Site: sbnc-website-redesign-playground.wildapricot.org
Purpose: Install, configure, and validate ClubCalendar widget
Prerequisites: Wild Apricot admin access, ICS feed URL
```

---

## Overview

This runbook covers end-to-end installation of ClubCalendar on the SBNC playground site, including:

- Creating the config page (stores widget settings)
- Creating the events page (displays the calendar)
- Pasting the HTML snippets
- Validating logged-out vs logged-in behavior
- Verifying filters
- Verifying timezone and DST handling
- Verifying "My Events" (if enabled)
- Rollback steps

**Estimated time:** 30-45 minutes

---

## Before You Begin

### Required Information

Collect these before starting:

| Item | Where to Find | Your Value |
|------|---------------|------------|
| WA Admin URL | Browser when logged in | `https://sbnc-website-redesign-playground.wildapricot.org/admin` |
| ICS Feed URL | WA Admin > Website > Calendar widget > Subscribe link | `https://sbnc-website-redesign-playground.wildapricot.org/widget/Calendar/[ID].ics` |
| Event Page Base URL | Pattern for event detail links | `https://sbnc-website-redesign-playground.wildapricot.org/event-` |

### Verify Prerequisites

- [ ] You have Wild Apricot admin access
- [ ] You can create new pages in WA
- [ ] You can edit page content with Custom HTML gadget
- [ ] You have the ICS feed URL (or can obtain it)

---

## Phase 1: Create the Config Page

The config page stores widget settings as hidden JSON. Users never see this page directly.

### Step 1.1: Create New Page

1. Log in to Wild Apricot admin
2. Navigate to: **Website > Site pages**
3. Click **Add page**
4. Configure:
   - **Page title:** `ClubCalendar Config`
   - **Page URL:** `clubcalendar-config`
   - **Show in menu:** No (uncheck)
   - **Access:** Public (the config contains no secrets)
5. Click **Save**

### Step 1.2: Add Custom HTML Gadget

1. Open the new page in the page editor
2. Click **Add gadget**
3. Select **Content** gadget
4. Click the gadget to edit
5. Switch to **HTML mode** (click the `</>` button)

### Step 1.3: Paste Config HTML

Copy and paste this entire block:

```html
<!--
  ClubCalendar Config Page

  This page stores widget configuration as JSON.
  The Events page reads this config to initialize the calendar.

  DO NOT add other content to this page.
  DO NOT remove the script tags.
-->

<script id="clubcalendar-config" type="application/json">
{
  "organization": {
    "name": "Santa Barbara Newcomers Club",
    "shortName": "SBNC",
    "timezone": "America/Los_Angeles"
  },

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

  "features": {
    "showRegistrationStatus": false,
    "showEventDetails": true,
    "linkToEventPage": true,
    "eventPageBaseUrl": "https://sbnc-website-redesign-playground.wildapricot.org/event-",
    "showMyEvents": false,
    "filterCategories": ["Social", "Outdoor", "Cultural", "Dining", "Learning"]
  },

  "styling": {
    "fontFamily": "system-ui, -apple-system, sans-serif",
    "borderRadius": "8px",
    "compactMode": false,
    "eventColors": {
      "default": "#2563eb",
      "Social": "#16a34a",
      "Outdoor": "#0d9488",
      "Cultural": "#9333ea",
      "Dining": "#dc2626",
      "Learning": "#ca8a04"
    }
  }
}
</script>

<noscript>
  <p>This is a configuration page for ClubCalendar. No visible content.</p>
</noscript>
```

### Step 1.4: Customize Config Values

Edit these values in the JSON:

| Field | Action |
|-------|--------|
| `dataSource.url` | Replace `YOUR_CALENDAR_ID` with your actual calendar ID |
| `features.filterCategories` | Update to match your actual event categories |
| `styling.eventColors` | Adjust colors if desired (hex format) |
| `features.showMyEvents` | Set to `true` if you want member-specific event display |

### Step 1.5: Save and Verify

1. Click **Save** to save the gadget
2. Click **Publish** to publish the page
3. Navigate to: `https://sbnc-website-redesign-playground.wildapricot.org/clubcalendar-config`
4. Verify the page loads (it will appear mostly blank - that's correct)
5. View page source (Ctrl+U or Cmd+Option+U) and confirm JSON is present

**Checkpoint:** Config page exists and contains valid JSON.

---

## Phase 2: Create the Events Page

The events page displays the actual calendar widget.

### Step 2.1: Create New Page

1. Navigate to: **Website > Site pages**
2. Click **Add page**
3. Configure:
   - **Page title:** `Events Calendar`
   - **Page URL:** `events-calendar`
   - **Show in menu:** Yes (or as desired)
   - **Access:** Public (or Members Only if preferred)
4. Click **Save**

### Step 2.2: Add Custom HTML Gadget

1. Open the new page in the page editor
2. Click **Add gadget**
3. Select **Content** gadget
4. Click the gadget to edit
5. Switch to **HTML mode** (click the `</>` button)

### Step 2.3: Paste Events Page HTML

Copy and paste this entire block:

```html
<!--
  ClubCalendar Events Page

  This page displays the calendar widget.
  Configuration is loaded from /clubcalendar-config

  Widget container must have id="clubcalendar-root"
-->

<style>
  /* ClubCalendar container styles */
  #clubcalendar-root {
    min-height: 500px;
    font-family: system-ui, -apple-system, sans-serif;
  }

  #clubcalendar-root .cc-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
    color: #6b7280;
  }

  #clubcalendar-root .cc-error {
    padding: 20px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    color: #dc2626;
  }

  /* Calendar view styles */
  #clubcalendar-root .cc-calendar {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }

  #clubcalendar-root .cc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  #clubcalendar-root .cc-nav-btn {
    padding: 8px 16px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    cursor: pointer;
  }

  #clubcalendar-root .cc-nav-btn:hover {
    background: #f3f4f6;
  }

  #clubcalendar-root .cc-month-title {
    font-size: 1.25rem;
    font-weight: 600;
  }

  #clubcalendar-root .cc-view-toggle {
    display: flex;
    gap: 4px;
  }

  #clubcalendar-root .cc-view-btn {
    padding: 6px 12px;
    border: 1px solid #d1d5db;
    background: white;
    cursor: pointer;
  }

  #clubcalendar-root .cc-view-btn:first-child {
    border-radius: 6px 0 0 6px;
  }

  #clubcalendar-root .cc-view-btn:last-child {
    border-radius: 0 6px 6px 0;
  }

  #clubcalendar-root .cc-view-btn.active {
    background: #2563eb;
    color: white;
    border-color: #2563eb;
  }

  #clubcalendar-root .cc-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
  }

  #clubcalendar-root .cc-day-header {
    padding: 8px;
    text-align: center;
    font-weight: 500;
    font-size: 0.875rem;
    color: #6b7280;
    border-bottom: 1px solid #e5e7eb;
  }

  #clubcalendar-root .cc-day {
    min-height: 100px;
    padding: 4px;
    border-right: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
  }

  #clubcalendar-root .cc-day:nth-child(7n) {
    border-right: none;
  }

  #clubcalendar-root .cc-day-number {
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 4px;
  }

  #clubcalendar-root .cc-day.other-month .cc-day-number {
    color: #d1d5db;
  }

  #clubcalendar-root .cc-day.today .cc-day-number {
    background: #2563eb;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  #clubcalendar-root .cc-event {
    padding: 2px 4px;
    margin-bottom: 2px;
    border-radius: 4px;
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
  }

  #clubcalendar-root .cc-event:hover {
    opacity: 0.8;
  }

  /* Filter bar styles */
  #clubcalendar-root .cc-filters {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    flex-wrap: wrap;
  }

  #clubcalendar-root .cc-filter-btn {
    padding: 4px 12px;
    border: 1px solid #d1d5db;
    border-radius: 16px;
    background: white;
    font-size: 0.875rem;
    cursor: pointer;
  }

  #clubcalendar-root .cc-filter-btn.active {
    background: #dbeafe;
    border-color: #2563eb;
    color: #1d4ed8;
  }

  /* My Events toggle */
  #clubcalendar-root .cc-my-events-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #fef3c7;
    border-bottom: 1px solid #fcd34d;
  }

  #clubcalendar-root .cc-my-events-toggle input {
    width: 16px;
    height: 16px;
  }

  /* List view styles */
  #clubcalendar-root .cc-list-view {
    padding: 16px;
  }

  #clubcalendar-root .cc-list-item {
    display: flex;
    gap: 16px;
    padding: 12px;
    border-bottom: 1px solid #e5e7eb;
  }

  #clubcalendar-root .cc-list-item:last-child {
    border-bottom: none;
  }

  #clubcalendar-root .cc-list-date {
    text-align: center;
    min-width: 60px;
  }

  #clubcalendar-root .cc-list-date-day {
    font-size: 1.5rem;
    font-weight: 600;
  }

  #clubcalendar-root .cc-list-date-month {
    font-size: 0.75rem;
    text-transform: uppercase;
    color: #6b7280;
  }

  #clubcalendar-root .cc-list-details {
    flex: 1;
  }

  #clubcalendar-root .cc-list-title {
    font-weight: 500;
    margin-bottom: 4px;
  }

  #clubcalendar-root .cc-list-time {
    font-size: 0.875rem;
    color: #6b7280;
  }
</style>

<div id="clubcalendar-root">
  <div class="cc-loading">Loading calendar...</div>
</div>

<script>
(function() {
  'use strict';

  // Configuration
  var CONFIG_PAGE_URL = '/clubcalendar-config';
  var config = null;
  var events = [];
  var currentDate = new Date();
  var currentView = 'month';
  var activeFilters = [];
  var showMyEventsOnly = false;

  // Utility functions
  function formatDate(date) {
    return date.toLocaleDateString('en-US', {
      timeZone: config?.organization?.timezone || 'America/Los_Angeles'
    });
  }

  function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: config?.organization?.timezone || 'America/Los_Angeles'
    });
  }

  function parseICSDate(str) {
    // Handle YYYYMMDD and YYYYMMDDTHHMMSS formats
    if (!str) return null;
    str = str.replace(/^.*:/, ''); // Remove TZID prefix if present

    if (str.length === 8) {
      // All-day event: YYYYMMDD
      return new Date(
        parseInt(str.substr(0, 4)),
        parseInt(str.substr(4, 2)) - 1,
        parseInt(str.substr(6, 2))
      );
    } else if (str.length >= 15) {
      // Date-time: YYYYMMDDTHHMMSS
      var year = parseInt(str.substr(0, 4));
      var month = parseInt(str.substr(4, 2)) - 1;
      var day = parseInt(str.substr(6, 2));
      var hour = parseInt(str.substr(9, 2));
      var min = parseInt(str.substr(11, 2));
      var sec = parseInt(str.substr(13, 2));

      if (str.endsWith('Z')) {
        return new Date(Date.UTC(year, month, day, hour, min, sec));
      }
      return new Date(year, month, day, hour, min, sec);
    }
    return null;
  }

  function parseICS(icsText) {
    var lines = icsText.split(/\r?\n/);
    var events = [];
    var currentEvent = null;
    var currentKey = null;
    var currentValue = '';

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      // Handle line continuation
      if (line.match(/^[ \t]/)) {
        currentValue += line.substr(1);
        continue;
      }

      // Process previous key-value
      if (currentKey && currentEvent) {
        currentEvent[currentKey] = currentValue;
      }

      // Parse new line
      var colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      var key = line.substr(0, colonIndex).split(';')[0].toUpperCase();
      currentValue = line.substr(colonIndex + 1);
      currentKey = key;

      if (key === 'BEGIN' && currentValue === 'VEVENT') {
        currentEvent = {};
      } else if (key === 'END' && currentValue === 'VEVENT') {
        if (currentEvent && currentEvent.DTSTART) {
          events.push({
            id: currentEvent.UID || Math.random().toString(36),
            title: (currentEvent.SUMMARY || 'Untitled Event').replace(/\\,/g, ',').replace(/\\n/g, '\n'),
            start: parseICSDate(currentEvent.DTSTART),
            end: parseICSDate(currentEvent.DTEND),
            location: (currentEvent.LOCATION || '').replace(/\\,/g, ','),
            description: (currentEvent.DESCRIPTION || '').replace(/\\,/g, ',').replace(/\\n/g, '\n'),
            categories: (currentEvent.CATEGORIES || '').split(',').map(function(c) { return c.trim(); }).filter(Boolean)
          });
        }
        currentEvent = null;
        currentKey = null;
      }
    }

    return events;
  }

  // Load configuration
  function loadConfig(callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', CONFIG_PAGE_URL, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          var match = xhr.responseText.match(/<script[^>]*id="clubcalendar-config"[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/i);
          if (match) {
            try {
              config = JSON.parse(match[1]);
              currentView = config.display?.defaultView || 'month';
              activeFilters = config.features?.filterCategories?.slice() || [];
              callback(null, config);
            } catch (e) {
              callback('Invalid config JSON: ' + e.message);
            }
          } else {
            callback('Config script not found on page');
          }
        } else {
          callback('Failed to load config: HTTP ' + xhr.status);
        }
      }
    };
    xhr.send();
  }

  // Load events from ICS feed
  function loadEvents(callback) {
    if (!config?.dataSource?.url) {
      callback('No data source URL configured');
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', config.dataSource.url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          events = parseICS(xhr.responseText);
          callback(null, events);
        } else {
          callback('Failed to load events: HTTP ' + xhr.status);
        }
      }
    };
    xhr.send();
  }

  // Get events for a specific date
  function getEventsForDate(date) {
    var start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var end = new Date(start.getTime() + 86400000);

    return events.filter(function(event) {
      if (!event.start) return false;

      // Filter by category
      if (activeFilters.length > 0 && activeFilters.length < (config.features?.filterCategories?.length || 0)) {
        var hasMatch = event.categories.some(function(cat) {
          return activeFilters.includes(cat);
        });
        if (!hasMatch && event.categories.length > 0) return false;
      }

      // Filter by date
      return event.start >= start && event.start < end;
    });
  }

  // Get event color
  function getEventColor(event) {
    var colors = config?.styling?.eventColors || {};
    for (var i = 0; i < event.categories.length; i++) {
      if (colors[event.categories[i]]) {
        return colors[event.categories[i]];
      }
    }
    return colors.default || '#2563eb';
  }

  // Render calendar header
  function renderHeader() {
    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

    var html = '<div class="cc-header">';
    html += '<button class="cc-nav-btn" data-action="prev">&larr; Previous</button>';
    html += '<span class="cc-month-title">' + monthNames[currentDate.getMonth()] + ' ' + currentDate.getFullYear() + '</span>';
    html += '<button class="cc-nav-btn" data-action="next">Next &rarr;</button>';
    html += '</div>';

    // View toggle
    html += '<div class="cc-header" style="justify-content: flex-end; padding: 8px 16px;">';
    html += '<div class="cc-view-toggle">';
    var views = config?.display?.views || ['month', 'week', 'list'];
    views.forEach(function(view) {
      html += '<button class="cc-view-btn' + (currentView === view ? ' active' : '') + '" data-view="' + view + '">';
      html += view.charAt(0).toUpperCase() + view.slice(1);
      html += '</button>';
    });
    html += '</div></div>';

    return html;
  }

  // Render filters
  function renderFilters() {
    var categories = config?.features?.filterCategories || [];
    if (categories.length === 0) return '';

    var html = '<div class="cc-filters">';
    html += '<span style="font-size: 0.875rem; color: #6b7280; margin-right: 8px;">Filter:</span>';
    categories.forEach(function(cat) {
      var isActive = activeFilters.includes(cat);
      html += '<button class="cc-filter-btn' + (isActive ? ' active' : '') + '" data-filter="' + cat + '">' + cat + '</button>';
    });
    html += '</div>';

    return html;
  }

  // Render My Events toggle
  function renderMyEventsToggle() {
    if (!config?.features?.showMyEvents) return '';

    var html = '<div class="cc-my-events-toggle">';
    html += '<input type="checkbox" id="cc-my-events" ' + (showMyEventsOnly ? 'checked' : '') + '>';
    html += '<label for="cc-my-events">Show only my registered events</label>';
    html += '</div>';

    return html;
  }

  // Render month view
  function renderMonthView() {
    var html = '<div class="cc-grid">';

    // Day headers
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(function(day) {
      html += '<div class="cc-day-header">' + day + '</div>';
    });

    // Calculate grid
    var firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    var lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    var startOffset = firstDay.getDay();
    var today = new Date();

    // Previous month days
    var prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    for (var i = startOffset - 1; i >= 0; i--) {
      var dayNum = prevMonth.getDate() - i;
      html += '<div class="cc-day other-month"><div class="cc-day-number">' + dayNum + '</div></div>';
    }

    // Current month days
    for (var d = 1; d <= lastDay.getDate(); d++) {
      var date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
      var isToday = date.toDateString() === today.toDateString();
      var dayEvents = getEventsForDate(date);

      html += '<div class="cc-day' + (isToday ? ' today' : '') + '">';
      html += '<div class="cc-day-number">' + d + '</div>';

      dayEvents.slice(0, 3).forEach(function(event) {
        var color = getEventColor(event);
        var url = config?.features?.eventPageBaseUrl ? config.features.eventPageBaseUrl + event.id : '#';
        html += '<div class="cc-event" style="background: ' + color + '; color: white;" ';
        html += 'data-event-id="' + event.id + '" title="' + event.title.replace(/"/g, '&quot;') + '">';
        html += event.title;
        html += '</div>';
      });

      if (dayEvents.length > 3) {
        html += '<div style="font-size: 0.75rem; color: #6b7280;">+' + (dayEvents.length - 3) + ' more</div>';
      }

      html += '</div>';
    }

    // Next month days
    var totalCells = startOffset + lastDay.getDate();
    var remainingCells = (7 - (totalCells % 7)) % 7;
    for (var n = 1; n <= remainingCells; n++) {
      html += '<div class="cc-day other-month"><div class="cc-day-number">' + n + '</div></div>';
    }

    html += '</div>';
    return html;
  }

  // Render list view
  function renderListView() {
    var now = new Date();
    var futureEvents = events
      .filter(function(e) { return e.start >= now; })
      .filter(function(event) {
        if (activeFilters.length > 0 && activeFilters.length < (config.features?.filterCategories?.length || 0)) {
          return event.categories.some(function(cat) { return activeFilters.includes(cat); }) || event.categories.length === 0;
        }
        return true;
      })
      .sort(function(a, b) { return a.start - b.start; })
      .slice(0, config?.display?.maxEventsVisible || 50);

    if (futureEvents.length === 0) {
      return '<div class="cc-list-view"><p style="color: #6b7280;">No upcoming events.</p></div>';
    }

    var html = '<div class="cc-list-view">';
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    futureEvents.forEach(function(event) {
      html += '<div class="cc-list-item">';
      html += '<div class="cc-list-date">';
      html += '<div class="cc-list-date-day">' + event.start.getDate() + '</div>';
      html += '<div class="cc-list-date-month">' + months[event.start.getMonth()] + '</div>';
      html += '</div>';
      html += '<div class="cc-list-details">';
      html += '<div class="cc-list-title">' + event.title + '</div>';
      html += '<div class="cc-list-time">' + formatTime(event.start);
      if (event.location) {
        html += ' &bull; ' + event.location;
      }
      html += '</div>';
      html += '</div>';
      html += '</div>';
    });

    html += '</div>';
    return html;
  }

  // Main render function
  function render() {
    var root = document.getElementById('clubcalendar-root');
    if (!root) return;

    var html = '<div class="cc-calendar">';
    html += renderHeader();
    html += renderFilters();
    html += renderMyEventsToggle();

    if (currentView === 'month') {
      html += renderMonthView();
    } else if (currentView === 'list') {
      html += renderListView();
    } else {
      html += '<div style="padding: 40px; text-align: center; color: #6b7280;">Week view coming soon</div>';
    }

    html += '</div>';
    root.innerHTML = html;

    // Attach event handlers
    attachHandlers();
  }

  // Attach event handlers
  function attachHandlers() {
    var root = document.getElementById('clubcalendar-root');
    if (!root) return;

    // Navigation
    root.querySelectorAll('[data-action]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var action = this.getAttribute('data-action');
        if (action === 'prev') {
          currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        } else if (action === 'next') {
          currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        }
        render();
      });
    });

    // View toggle
    root.querySelectorAll('[data-view]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        currentView = this.getAttribute('data-view');
        render();
      });
    });

    // Filters
    root.querySelectorAll('[data-filter]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var filter = this.getAttribute('data-filter');
        var idx = activeFilters.indexOf(filter);
        if (idx >= 0) {
          activeFilters.splice(idx, 1);
        } else {
          activeFilters.push(filter);
        }
        render();
      });
    });

    // My Events toggle
    var myEventsCheckbox = document.getElementById('cc-my-events');
    if (myEventsCheckbox) {
      myEventsCheckbox.addEventListener('change', function() {
        showMyEventsOnly = this.checked;
        render();
      });
    }

    // Event clicks
    root.querySelectorAll('[data-event-id]').forEach(function(el) {
      el.addEventListener('click', function() {
        var eventId = this.getAttribute('data-event-id');
        if (config?.features?.linkToEventPage && config.features.eventPageBaseUrl) {
          window.location.href = config.features.eventPageBaseUrl + eventId;
        }
      });
    });
  }

  // Show error
  function showError(message) {
    var root = document.getElementById('clubcalendar-root');
    if (root) {
      root.innerHTML = '<div class="cc-error"><strong>Calendar Error:</strong> ' + message + '</div>';
    }
  }

  // Initialize
  function init() {
    loadConfig(function(err) {
      if (err) {
        showError(err);
        return;
      }

      loadEvents(function(err) {
        if (err) {
          showError(err);
          return;
        }

        render();

        // Set up auto-refresh
        if (config?.dataSource?.refreshIntervalMinutes > 0) {
          setInterval(function() {
            loadEvents(function(err) {
              if (!err) render();
            });
          }, config.dataSource.refreshIntervalMinutes * 60 * 1000);
        }
      });
    });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>
```

### Step 2.4: Save and Verify

1. Click **Save** to save the gadget
2. Click **Publish** to publish the page
3. Navigate to: `https://sbnc-website-redesign-playground.wildapricot.org/events-calendar`
4. Verify the calendar loads and displays events

**Checkpoint:** Events page shows calendar with events from ICS feed.

---

## Phase 3: Validation Tests

Run these tests to verify correct installation.

### Test 3.1: Logged-Out Behavior

1. Open a new incognito/private browser window
2. Navigate to the events calendar page
3. Verify:
   - [ ] Calendar displays without login
   - [ ] Events are visible (public events)
   - [ ] Navigation (prev/next month) works
   - [ ] View toggle (month/list) works
   - [ ] "My Events" toggle is NOT visible (requires login)

**Expected:** Public calendar view works without authentication.

### Test 3.2: Logged-In Behavior

1. Log in as a member account
2. Navigate to the events calendar page
3. Verify:
   - [ ] Calendar displays correctly
   - [ ] All events visible (including member-only if any)
   - [ ] "My Events" toggle appears (if enabled in config)
   - [ ] Clicking an event navigates to event detail page

**Expected:** Full calendar functionality for logged-in members.

### Test 3.3: Filter Verification

1. On the events calendar page
2. Verify filter bar shows configured categories
3. Click a filter to deselect it
4. Verify:
   - [ ] Filter button appearance changes (active/inactive)
   - [ ] Calendar updates to hide events of that category
   - [ ] Re-clicking filter restores events

**Expected:** Filters control which events are displayed.

### Test 3.4: Timezone and DST Verification

Test that event times display correctly in Pacific Time.

**Test A: Current timezone**

1. Check an event with a known time
2. Verify displayed time matches expected Pacific Time
3. Compare with Wild Apricot event detail page

**Test B: DST boundary (if applicable)**

1. If testing near a DST transition date (March/November)
2. Check events before and after the transition
3. Verify times are correct on both sides

**Test C: All-day events**

1. Find an all-day event
2. Verify it does not show a specific time
3. Verify it appears on the correct date

**Expected:** All times display in Pacific Time (America/Los_Angeles).

### Test 3.5: "My Events" Verification (If Enabled)

Skip this test if `features.showMyEvents` is `false` in config.

1. Log in as a member who has registered for events
2. Navigate to calendar page
3. Check the "Show only my registered events" checkbox
4. Verify:
   - [ ] Calendar shows only events member is registered for
   - [ ] Uncheck restores full event list

**Note:** This feature requires integration with WA registration data. If not yet implemented, the toggle will have no effect.

---

## Phase 4: Rollback Steps

If installation fails or causes issues, follow these steps to remove ClubCalendar.

### Rollback Option 1: Hide Pages (Quick, Reversible)

1. Navigate to: **Website > Site pages**
2. Find "ClubCalendar Config" page
3. Click **Settings** > uncheck "Published" > **Save**
4. Find "Events Calendar" page
5. Click **Settings** > uncheck "Published" > **Save**

This hides the pages but preserves the content for later.

### Rollback Option 2: Delete Pages (Complete Removal)

1. Navigate to: **Website > Site pages**
2. Find "ClubCalendar Config" page
3. Click **Delete** > confirm
4. Find "Events Calendar" page
5. Click **Delete** > confirm

This removes all ClubCalendar content from the site.

### Rollback Verification

After rollback:

1. Navigate to `/clubcalendar-config` - should return 404
2. Navigate to `/events-calendar` - should return 404
3. Site navigation should not show calendar links

---

## Troubleshooting

### Calendar shows "Loading calendar..." forever

**Causes:**

- Config page URL is wrong
- Config page is not published
- JSON syntax error in config

**Fix:**

1. Verify config page is published
2. Check browser console for errors (F12 > Console)
3. Validate JSON at [jsonlint.com](https://jsonlint.com)

### Calendar shows "Failed to load events"

**Causes:**

- ICS feed URL is incorrect
- ICS feed is not publicly accessible
- CORS blocking the request

**Fix:**

1. Test ICS URL directly in browser
2. Verify calendar widget is set to public in WA
3. Check if WA blocks cross-origin requests

### Events appear on wrong dates

**Causes:**

- Timezone mismatch between ICS feed and display
- All-day events not handled correctly

**Fix:**

1. Verify `organization.timezone` in config matches your WA timezone
2. Check ICS feed for VTIMEZONE definition
3. Compare raw ICS dates with displayed dates

### Filters don't work

**Causes:**

- Category names don't match event categories
- Events have no categories assigned

**Fix:**

1. Check event categories in WA event settings
2. Update `features.filterCategories` in config to match exact category names

### "My Events" toggle has no effect

**Causes:**

- Feature requires integration with WA member session
- ClubCalendar doesn't have access to registration data

**Current status:** This feature placeholder exists but requires additional backend integration. For now, it shows the toggle but doesn't filter.

---

## Post-Installation Checklist

After successful installation:

- [ ] Calendar page added to main navigation (if desired)
- [ ] Config page URL noted for future reference
- [ ] ICS feed URL documented
- [ ] Screenshot taken of working calendar
- [ ] Rollback steps reviewed with team
- [ ] Timezone verified against production WA site

---

## Related Documents

- [Config Templates](../../config-templates/clubcalendar/README.md) - Pre-built config files
- [SBNC Inline-Only Install](./SBNC_INLINE_ONLY_INSTALL.md) - Build process (if needed)
- [WA Custom HTML Guide](../MIGRATION/WILD_APRICOT_CUSTOM_HTML_BLOCKS_GUIDE.md) - WA embed patterns

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-26 | Worker 5 | Initial runbook |
