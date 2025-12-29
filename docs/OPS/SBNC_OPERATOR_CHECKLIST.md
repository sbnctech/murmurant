# SBNC Operator Checklist

```
Audience: SBNC Technical Staff, Webmaster, Communications Chair
Purpose: Step-by-step checklists for publishing inline widgets
Approach: Inline-only (no server migration)
```

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

---

## Overview

This document provides operator checklists for publishing, verifying, and rolling back inline widgets on the SBNC website. All checklists follow the **inline-only approach** where Murmurant widgets are embedded directly into Wild Apricot pages.

**Core Principle:** Every publish action is reversible. If something goes wrong, you can always roll back to the previous version.

---

## Quick Reference

| Phase | Duration | Risk Level | Reversible |
|-------|----------|------------|------------|
| Pre-Publish | 15-30 min | Low | N/A |
| Publish | 5-10 min | Medium | Yes |
| Verify | 10-15 min | Low | N/A |
| Rollback | 5 min | Low | Yes |

---

## Pre-Publish Checklist

Complete these steps BEFORE making any changes visible to members.

### 1. Environment Verification

- [ ] **Browser ready**: Safari or Chrome with WA admin access
- [ ] **Logged into Wild Apricot**: As admin with page editing permissions
- [ ] **Test account ready**: Separate browser/incognito window for member view testing
- [ ] **Murmurant widget build verified**: `dist/inline-widget/` contains current build

```zsh
# Verify build exists and is recent
ls -la ~/murmurant/dist/inline-widget/
# Check modification date - should be today or expected build date
```

### 2. Configuration Validation

- [ ] **Config JSON syntax valid**: No trailing commas, proper quotes
- [ ] **Organization settings correct**: Name, timezone, shortName
- [ ] **Data source URL correct**: ICS feed URL or static JSON path
- [ ] **Display settings match requirements**: Views, colors, max events

**Validation command (if using local tools):**

```zsh
# Validate JSON syntax
cat ~/murmurant/config-templates/[widget-name]/config.json | jq .
# If jq outputs formatted JSON without errors, syntax is valid
```

### 3. Content Review

- [ ] **Widget renders correctly in test environment**
- [ ] **Event data displays properly** (if using live ICS feed)
- [ ] **Colors and styling match SBNC branding**
- [ ] **Links point to correct Wild Apricot pages**
- [ ] **No broken images or missing assets**

### 4. Backup Current State

**CRITICAL: Always backup before publishing.**

- [ ] **Screenshot current page**: Capture what members currently see
- [ ] **Copy current Custom HTML block**: Save to local file
- [ ] **Note current page URL and slug**
- [ ] **Record backup location**: `~/sbnc-backups/YYYY-MM-DD/`

```zsh
# Create backup directory
mkdir -p ~/sbnc-backups/$(date +%Y-%m-%d)

# Save screenshot (using macOS screen capture)
# Cmd+Shift+4, select area, save to backup folder

# Create notes file
echo "Backup before widget update $(date)" > ~/sbnc-backups/$(date +%Y-%m-%d)/notes.txt
```

### 5. Communication

- [ ] **Notify relevant stakeholders** (if significant change)
- [ ] **Check calendar**: Avoid publishing during high-traffic periods (event days)
- [ ] **Ensure rollback availability**: Someone with admin access is reachable

---

## Publish Checklist

Execute these steps to make changes live.

### 1. Access Wild Apricot Page Editor

- [ ] Log in to Wild Apricot admin
- [ ] Navigate to **Website** > **Site pages**
- [ ] Find the target page (e.g., "Events Calendar")
- [ ] Click **Edit** to enter page editor mode

### 2. Locate Custom HTML Block

- [ ] Find the Custom HTML gadget containing the widget
- [ ] Click to select the gadget
- [ ] Click **Edit HTML** or the edit icon

### 3. Update Widget Code

- [ ] **Select all** existing HTML content (Cmd+A)
- [ ] **Paste** new widget code from your prepared file
- [ ] **Verify paste completed**: Scroll through to confirm all code present
- [ ] Check that opening `<div>` and closing `</div>` tags are balanced

### 4. Preview Before Publishing

- [ ] Click **Preview** button in WA editor
- [ ] Verify widget displays correctly in preview
- [ ] Check console for JavaScript errors (Cmd+Option+I > Console tab)
- [ ] Test interactive elements (navigation, clicks)

### 5. Save and Publish

- [ ] Click **Done** to close HTML editor
- [ ] Click **Save** to save page changes
- [ ] Click **Publish** (or **Publish changes** if prompted)
- [ ] Wait for confirmation message

### 6. Record Publication

- [ ] Note timestamp of publication
- [ ] Record version or change description
- [ ] Update internal change log

```
Publication Record:
- Date: YYYY-MM-DD HH:MM
- Page: [Page Name]
- Change: Updated widget to v1.2
- Operator: [Your Name]
```

---

## Verify Checklist

Complete these steps IMMEDIATELY after publishing.

### 1. Public View Test (Logged Out)

- [ ] **Open incognito/private window**
- [ ] Navigate to the published page URL
- [ ] Verify widget loads and displays correctly
- [ ] Check that public-appropriate content shows
- [ ] Test navigation within widget

### 2. Member View Test (Logged In)

- [ ] Log in as a test member (not admin)
- [ ] Navigate to the published page
- [ ] Verify member-specific content displays
- [ ] Test registration links (if applicable)
- [ ] Verify correct events are visible

### 3. Mobile Verification

- [ ] Open page on mobile device (or use browser responsive mode)
- [ ] Verify widget is readable and usable
- [ ] Test touch interactions
- [ ] Check that content doesn't overflow

### 4. Functional Verification

- [ ] **Calendar navigation works**: Can switch months/weeks
- [ ] **Event details load**: Clicking events shows details
- [ ] **External links work**: Links to WA event pages function
- [ ] **No console errors**: Check browser developer tools

### 5. Performance Check

- [ ] Page loads in reasonable time (< 5 seconds)
- [ ] Widget data refreshes properly
- [ ] No visible layout shifts during load

### 6. Confirmation

If all checks pass:

- [ ] Close test browsers
- [ ] Update deployment log with "Verified OK"
- [ ] Notify stakeholders of successful deployment

If any check fails:

- [ ] **IMMEDIATELY proceed to Rollback Checklist**
- [ ] Do not attempt fixes on live page
- [ ] Document the failure for later investigation

---

## Rollback Checklist

Execute these steps if verification fails or issues are reported.

### 1. Immediate Assessment

- [ ] **Determine severity**:
  - Critical: Widget broken, page unusable → Rollback NOW
  - Major: Significant display issues → Rollback within 15 minutes
  - Minor: Cosmetic issues → Can schedule fix

- [ ] **Notify stakeholders** that rollback is in progress

### 2. Access Page Editor

- [ ] Log in to Wild Apricot admin
- [ ] Navigate to **Website** > **Site pages**
- [ ] Find the affected page
- [ ] Click **Edit**

### 3. Restore Previous Version

**Option A: From Backup (Preferred)**

- [ ] Open your backup file from `~/sbnc-backups/YYYY-MM-DD/`
- [ ] Select the Custom HTML gadget
- [ ] Click **Edit HTML**
- [ ] Select all and paste backup content
- [ ] Click **Done**

**Option B: From Wild Apricot Revision History (if available)**

- [ ] In page editor, look for **Revisions** or **History**
- [ ] Select the previous version
- [ ] Click **Restore**

**Option C: Remove Widget Entirely (Emergency)**

- [ ] Select the Custom HTML gadget
- [ ] Delete or replace with placeholder text:
  ```html
  <div style="padding: 20px; text-align: center; background: #f5f5f5; border: 1px solid #ddd;">
    <p>Calendar temporarily unavailable. Please check back soon.</p>
    <p>For event information, contact <a href="mailto:info@sbnewcomers.org">info@sbnewcomers.org</a></p>
  </div>
  ```

### 4. Publish Rollback

- [ ] Click **Save**
- [ ] Click **Publish**
- [ ] Wait for confirmation

### 5. Verify Rollback

- [ ] Open page in incognito window
- [ ] Confirm previous (working) version is restored
- [ ] Check that site is functional

### 6. Post-Rollback Actions

- [ ] Update deployment log with rollback details
- [ ] Document what went wrong
- [ ] Schedule investigation/fix for off-peak time
- [ ] Notify stakeholders of rollback completion

```
Rollback Record:
- Date: YYYY-MM-DD HH:MM
- Page: Events Calendar
- Reason: Widget failed to load - JavaScript error
- Rolled back to: Previous backup from YYYY-MM-DD
- Operator: [Your Name]
- Next steps: Investigate console errors, test locally before retry
```

---

## Emergency Contacts

| Role | Contact | Use Case |
|------|---------|----------|
| Tech Chair | [Contact Info] | Technical issues, rollback assistance |
| Webmaster | [Contact Info] | Wild Apricot access, page editing |
| President | [Contact Info] | Escalation, member communication |

---

## Best Practices

### Before Any Change

1. **Always backup first** - No exceptions
2. **Test in isolation** - Use local preview when possible
3. **Avoid peak times** - Don't publish during events or high-traffic periods
4. **Have rollback ready** - Know your rollback path before you start

### During Publishing

1. **One change at a time** - Don't combine multiple updates
2. **Verify at each step** - Don't skip preview
3. **Keep notes** - Record what you did and when
4. **Watch for errors** - Check browser console during preview

### After Publishing

1. **Verify immediately** - Don't assume it worked
2. **Test as a user** - Use incognito/member view
3. **Stay available** - Be reachable for 30 minutes after publish
4. **Document success** - Update logs with verification status

### General

1. **When in doubt, don't publish** - Ask first
2. **Rollback is not failure** - It's good judgment
3. **Communication matters** - Keep stakeholders informed
4. **Learn from issues** - Document and review problems

---

## Change Log Maintenance

Maintain a running log of all widget changes:

```
## Widget Change Log

### 2025-12-26 - Calendar Widget v1.2 Update
- Operator: Jane Smith
- Change: Updated to new calendar widget version
- Verification: Passed all checks
- Notes: Improved mobile display

### 2025-12-15 - Initial Calendar Widget Deploy
- Operator: John Doe
- Change: First deployment of calendar widget
- Verification: Passed with minor styling adjustments
- Notes: Adjusted colors in config
```

---

## Related Documents

- [Publishing and Content Lifecycle](../BIZ/PUBLISHING_AND_CONTENT_LIFECYCLE.md) - Content publishing workflow
- [SBNC Inline-Only Installation](../INSTALL/SBNC_INLINE_ONLY_INSTALL.md) - Build and install guide
- [SBNC Hosting Guide](../INSTALL/SBNC_HOSTING_GUIDE.md) - Deployment to static hosting
- [Trust Surface for Operators](../BIZ/TRUST_SURFACE_FOR_OPERATORS.md) - Core guarantees
- [Inline Widget Troubleshooting](./INLINE_WIDGET_TROUBLESHOOTING.md) - Problem resolution guide

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-26 | System | Initial operator checklist |

