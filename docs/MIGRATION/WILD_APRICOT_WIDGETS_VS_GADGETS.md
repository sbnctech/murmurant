# Wild Apricot: Widgets vs Gadgets

This document clarifies terminology and provides guidance for migration discovery.

Related:
- [Gadget Tagging by Migration Strategy](./WILD_APRICOT_GADGET_TAGGING.md)
- [Migration Intake Checklist](./WILD_APRICOT_MIGRATION_INTAKE_CHECKLIST.md)

---

## Terminology

**Gadget**: The term Wild Apricot uses in its page editor interface. When an
operator adds a functional block to a page (event list, member directory, login
form), WA calls this a "gadget."

**Widget**: A general term used informally by operators and in some WA
documentation. Often used interchangeably with "gadget." Some operators also
use "widget" to describe third-party embeds (Google Calendar, YouTube videos).

**For migration purposes**: We treat these terms as equivalent. The important
distinction is not the name, but whether the content is data-backed (can be
auto-migrated) or presentation-only (requires manual rebuild).

---

## How Gadgets Work in Wild Apricot (Operator Perspective)

1. **Page Editor**: Operators access the page editor from the WA admin panel
2. **Add Gadget**: A button or menu lets operators insert gadgets onto pages
3. **Configuration**: Each gadget has settings (what to display, filters, layout)
4. **Save and Publish**: Changes go live when the page is published

Common gadgets operators encounter:
- Event list / Event calendar
- Member directory
- Login/logout buttons
- Registration forms
- Content blocks (text, images)
- Custom HTML blocks

---

## Why This Matters for Migration

During discovery, we need to identify what gadgets a club uses so we can:

1. **Estimate scope**: More gadgets means more migration work
2. **Categorize correctly**: Data-backed gadgets migrate differently than embeds
3. **Set expectations**: Some gadgets require manual rebuild; some are unsupported

### Migration Categories

| Category | What It Means | Examples |
|----------|---------------|----------|
| AUTO | Data-backed; maps to Murmurant models | Event lists, member directory, login |
| MANUAL | Presentation-only; requires rebuild | Content blocks, embeds, custom layouts |
| UNSUPPORTED | Security risk; requires review | Custom HTML with scripts, third-party widgets |

See [Gadget Tagging](./WILD_APRICOT_GADGET_TAGGING.md) for the full classification.

---

## How to Talk About This With Non-Technical Admins

Use plain language. Avoid "gadget" vs "widget" distinctions unless the operator
brings it up. Focus on what they care about:

**Instead of**: "We need to inventory your gadgets and widgets."

**Say**: "Let's walk through your website pages together. For each page, I'll
ask: What does this page do? Did you add anything special to it, like a
calendar embed or custom formatting?"

**Key questions to ask**:
- "Did you paste any code into your pages?" (Custom HTML)
- "Do you embed Google Docs, YouTube videos, or external calendars?"
- "Do you use Google Analytics or Facebook tracking?"

These questions are documented in the [Intake Checklist](./WILD_APRICOT_MIGRATION_INTAKE_CHECKLIST.md).

---

## Discovery Process

1. **Walk the site**: Visit every page as a logged-in admin
2. **Open the page editor**: Look for gadgets that have been added
3. **Take screenshots**: Capture each page showing what gadgets are present
4. **Note embeds**: Look for iframes, embedded content, custom HTML blocks
5. **Tag each item**: Mark as AUTO, MANUAL, or UNSUPPORTED per the tagging guide

---

## Needs Confirmation

The following claims are based on operator observation and may need verification
against current Wild Apricot behavior:

- The exact menu location for "Add Gadget" may vary by WA version or account type
- WA may use different terms in different parts of its interface (gadget, widget,
  content block, element)
- Third-party integrations available through WA may have changed since this
  document was written

If you discover discrepancies, update this document with the correct information
and note the date of verification.

---

## ClubCalendar (Parallel Deliverable)

For calendar gadget replacement, see the ClubCalendar inline engine (`clubcalendar_sbnc/`). It provides a self-contained calendar widget for WA sites with no external server dependencies.

See [Gadget Tagging - ClubCalendar](./WILD_APRICOT_GADGET_TAGGING.md#clubcalendar-parallel-deliverable) for details.

---

Last updated: 2025-12-26
