# Wild Apricot Migration Intake Checklist

Purpose:
Identify Wild Apricot gadgets, widgets, and extensions in use so migration scope is explicit and surprises are minimized.

Use this checklist during:
- Early discovery calls
- Pre-migration intake
- Demo mapping conversations

**Tagging Reference:** For AUTO/MANUAL/UNSUPPORTED classification of each item, see the [Canonical Gadget Matrix](./WILD_APRICOT_GADGET_TAGGING.md#canonical-gadget-matrix).

---

## Website and Pages
- Custom home page layouts
- Static content pages
- Image grids or card layouts
- Custom HTML blocks

## Events
- Event lists
- Event calendars
- Event detail pages
- Registration forms
- Waitlists
- Paid registrations

## Members
- Login/logout
- Member directory
- Profile edit pages
- Member-only content

## Payments
- Event payments
- Membership dues
- Donations
- External payment processors

## Presentation and Embeds

This section covers custom code and third-party content that requires special handling.

### Custom HTML Blocks

- **Why we ask:** Arbitrary HTML may contain scripts, iframes, or vendor widgets that pose security or maintenance risk.
- **Artifact needed:** Screenshot or HTML source of each custom block.
- **Tag mapping:** UNSUPPORTED if contains scripts; MANUAL if static content only.

### Embeds (Google Docs, Calendars, Forms, YouTube, Maps)

- **Why we ask:** Embeds from allowlisted sources can migrate to ClubOS equivalents; others require rebuild or removal.
- **Artifact needed:** List of embed URLs and their locations.
- **Tag mapping:** MANUAL for allowlisted sources (YouTube, Google Maps); UNSUPPORTED for unknown sources.

### Third-Party Widgets

- **Why we ask:** External widgets (chat, booking, social feeds) create ongoing dependencies and security exposure.
- **Artifact needed:** Widget name, vendor, and purpose.
- **Tag mapping:** UNSUPPORTED; evaluate case-by-case for ClubOS alternatives.

### Tracking Pixels

- **Why we ask:** Analytics and advertising pixels may violate privacy policy or require disclosure.
- **Artifact needed:** List of tracking services in use (Google Analytics, Facebook Pixel, etc.).
- **Tag mapping:** UNSUPPORTED; ClubOS provides built-in analytics.

---

## Automations and Integrations
- Zapier or Make
- Google Sheets exports
- Calendar feeds (ICS)
- Custom embeds or scripts

---

## Related Documents

- [Canonical Gadget Matrix](./WILD_APRICOT_GADGET_TAGGING.md) - single source of truth for migration tags
- [WA Custom HTML Blocks](./WILD_APRICOT_CUSTOM_HTML_BLOCKS.md) - detailed HTML handling procedures
