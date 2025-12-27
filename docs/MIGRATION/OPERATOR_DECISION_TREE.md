# Migration Operator Decision Tree

**Purpose**: Help operators make quick, consistent decisions during WA-to-ClubOS migration.

**Audience**: Board members, tech chairs, migration coordinators.

---

## Quick Reference Card

Print this card and keep it handy during discovery calls.

| If you see... | Tag it... | What to do |
|---------------|-----------|------------|
| Member data, event data, payments | AUTO | Script handles it |
| Page layout, navigation, images | MANUAL | Operator rebuilds |
| Tracking code, custom scripts | UNSUPPORTED | Skip it |
| YouTube, Google Maps | MANUAL | Operator re-adds (safe) |
| Unknown embed or widget | UNSUPPORTED | Ask before proceeding |

---

## The Three Questions

Ask these questions for ANY WA feature to decide how to handle it:

### Question 1: Is it data or decoration?

```
Is this feature backed by data that WA stores?
(members, events, registrations, payments)

    YES → Probably AUTO (script migrates it)
    NO  → Probably MANUAL (operator rebuilds it)
```

### Question 2: Does ClubOS have something similar?

```
Does ClubOS have a matching feature?

    EXACT MATCH   → AUTO (direct migration)
    SIMILAR       → MANUAL (adapt to ClubOS)
    NO EQUIVALENT → UNSUPPORTED (skip or replace)
```

### Question 3: Does it run code or talk to other services?

```
Does this feature run scripts or connect externally?

    RUNS SCRIPTS        → UNSUPPORTED (security risk)
    KNOWN SAFE EMBED    → MANUAL (YouTube, Maps OK)
    UNKNOWN EMBED       → UNSUPPORTED (needs review)
    NO EXTERNAL STUFF   → Follow Question 1 answer
```

---

## Visual Decision Flowchart

```
START: You found a WA feature
        |
        v
   Is it member/event/
   payment data?
        |
    +---+---+
    |       |
   YES      NO
    |       |
    v       v
  AUTO   Does it embed
         external content?
              |
          +---+---+
          |       |
         YES      NO
          |       |
          v       v
    Is source    MANUAL
    allowlisted? (layout/content)
    (YouTube,
    Maps, etc.)
          |
      +---+---+
      |       |
     YES      NO
      |       |
      v       v
   MANUAL   Does it run
   (safe    scripts/code?
   embed)       |
            +---+---+
            |       |
           YES      NO
            |       |
            v       v
      UNSUPPORTED  MANUAL
      (skip)       (review)
```

---

## Decision Tree by Category

### Events and Registration

```
Event-related feature?
    |
    +-- Event list/calendar display
    |       → AUTO: Data migrates, display rebuilds
    |
    +-- Registration form
    |       → AUTO: Form fields and data migrate
    |
    +-- Waitlist
    |       → AUTO: Positions preserved
    |
    +-- Event payments
    |       → AUTO: History migrates to Stripe
    |
    +-- Multi-session events
            → AUTO: Sessions linked to parent event
```

### Members and Directory

```
Member-related feature?
    |
    +-- Member directory
    |       → AUTO: All member data migrates
    |
    +-- Profile pages
    |       → AUTO: Custom fields preserved
    |
    +-- Login/logout
    |       → AUTO: New auth, same members
    |
    +-- Member-only pages
            → MANUAL: Access rules recreated
```

### Payments and Donations

```
Payment-related feature?
    |
    +-- Membership dues
    |       → AUTO: Tiers and history migrate
    |
    +-- Donation forms
    |       → AUTO: Donation records kept
    |
    +-- Payment history
    |       → AUTO: Full transaction log
    |
    +-- PayPal/external buttons
            → UNSUPPORTED: Use Stripe instead
```

### Website Content

```
Website content feature?
    |
    +-- Text/content blocks
    |       → MANUAL: Re-type in ClubOS editor
    |
    +-- Images
    |       → MANUAL: Re-upload files
    |
    +-- Photo galleries
    |       → MANUAL: Recreate with ClubOS gallery
    |
    +-- Navigation menus
    |       → MANUAL: Rebuild menu structure
    |
    +-- Custom CSS
            → MANUAL: Translate to ClubOS theme
```

### Embeds and Custom Code

```
Embed or code feature?
    |
    +-- YouTube video
    |       → MANUAL: Allowlisted, re-add in editor
    |
    +-- Google Maps
    |       → MANUAL: Allowlisted, re-add in editor
    |
    +-- Google Calendar
    |       → MANUAL: Use ClubOS native calendar
    |
    +-- Google Forms
    |       → MANUAL: Rebuild with ClubOS forms
    |
    +-- Custom HTML (no scripts)
    |       → MANUAL: Review content, recreate if safe
    |
    +-- Custom JavaScript
    |       → UNSUPPORTED: Security risk
    |
    +-- Tracking pixels (GA, FB)
    |       → UNSUPPORTED: Privacy risk
    |
    +-- Third-party widgets
            → UNSUPPORTED: Evaluate case-by-case
```

### Integrations

```
Integration feature?
    |
    +-- ICS calendar feed
    |       → AUTO: New URL, same data
    |
    +-- Zapier/Make workflows
    |       → MANUAL: Rebuild with ClubOS webhooks
    |
    +-- Email templates
    |       → MANUAL: Recreate in ClubOS editor
    |
    +-- API integrations
            → MANUAL: Update to ClubOS API
```

---

## Common Scenarios and Answers

### "We have a YouTube video on our homepage"

**Answer**: MANUAL - Allowlisted and safe.

**Action**: After migration, add a Video block in ClubOS and paste the YouTube URL.

---

### "We use Google Analytics to track visitors"

**Answer**: UNSUPPORTED - Privacy risk.

**Action**: ClubOS has built-in analytics. If you need GA, configure it through ClubOS admin settings (not page embeds).

---

### "We have a custom form that emails the board"

**Answer**: MANUAL - Rebuild needed.

**Action**: Use ClubOS form builder to create the form. Configure email notifications in settings.

---

### "We embed our Google Calendar for events"

**Answer**: MANUAL - Use native calendar instead.

**Action**: ClubOS has a native event calendar. Your events migrate automatically and display in ClubOS calendar.

---

### "We have JavaScript that shows a popup welcome message"

**Answer**: UNSUPPORTED - XSS risk.

**Action**: Skip this feature. Consider ClubOS native announcements if needed.

---

### "Our treasurer exports data to QuickBooks"

**Answer**: MANUAL - Different export format.

**Action**: ClubOS provides CSV exports. Workflow may need adjustment for new format.

---

## When to Escalate

Escalate to the migration team if:

1. You cannot classify a feature using the decision tree
2. Customer insists on an UNSUPPORTED feature
3. You find custom code that seems critical to operations
4. Third-party integration handles payments or sensitive data
5. Customer has more than 50 custom HTML blocks

---

## Migration Phases Summary

```
PHASE 1: Discovery
    - Walk through site with customer
    - Tag each feature (AUTO/MANUAL/UNSUPPORTED)
    - Document special requirements

PHASE 2: Data Export
    - Export members, events, registrations
    - Download images and documents
    - Capture email templates

PHASE 3: Data Import
    - Script runs AUTO migrations
    - Verify data integrity
    - Generate migration report

PHASE 4: Manual Rebuild
    - Operator recreates MANUAL items
    - Customer reviews each page
    - Adjust styling and layout

PHASE 5: Verification
    - Customer signs off
    - Test member login
    - Verify payments work

PHASE 6: Cutover
    - Point DNS to ClubOS
    - Disable WA login
    - Monitor for issues
```

---

## Related Documents

- [Gadget Classification Matrix](./WILD_APRICOT_GADGET_TAGGING.md) - Complete tag reference
- [Intake Checklist](./WILD_APRICOT_MIGRATION_INTAKE_CHECKLIST.md) - Discovery questions
- [Custom HTML Guide](./WILD_APRICOT_CUSTOM_HTML_BLOCKS_GUIDE.md) - Handling embeds
- [Widgets vs Gadgets](./WILD_APRICOT_WIDGETS_VS_GADGETS.md) - Terminology

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-26 | Worker 5 | Initial decision tree document |
