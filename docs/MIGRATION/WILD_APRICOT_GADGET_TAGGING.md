# Wild Apricot Gadget and Widget Migration Tagging

This document is the **single source of truth** for WA gadget migration classification.

All intake checklists and migration manifests reference this table.

---

## How to Decide Quickly

Use these three questions to classify any WA feature:

### Question 1: Does WA store data for this feature?

- **Yes** (events, members, payments, registrations) → Probably **AUTO**
- **No** (just shows content or layout) → Probably **MANUAL**

### Question 2: Does ClubOS have a matching feature?

- **Yes, exact match** → Definitely **AUTO**
- **Yes, similar** → Likely **MANUAL** (operator adapts)
- **No equivalent** → Likely **UNSUPPORTED**

### Question 3: Does it run custom code or connect to outside services?

- **Yes, runs scripts** → Definitely **UNSUPPORTED**
- **Yes, embeds from known sources** (YouTube, Google Maps) → **MANUAL** (allowlisted)
- **Yes, embeds from unknown sources** → Likely **UNSUPPORTED**

### Quick Reference Card

| If you see... | Tag it... | Because... |
|---------------|-----------|------------|
| Member list, event list, payments | AUTO | It's data, we migrate it |
| Text blocks, images, navigation | MANUAL | It's layout, operator rebuilds |
| Custom HTML, scripts, pixels | UNSUPPORTED | It's risky, we skip it |
| YouTube, Google Maps | MANUAL | It's safe, operator re-adds |
| Third-party widgets (chat, booking) | UNSUPPORTED | It's external, evaluate case-by-case |

---

## Migration Tags

| Tag | Meaning | What Happens |
|-----|---------|--------------|
| AUTO | Data-backed; maps to ClubOS model | Script migrates it automatically |
| MANUAL | Presentation-only; no data | Operator recreates in ClubOS |
| UNSUPPORTED | Security or maintenance risk | Excluded from migration scope |

---

## Tag Decision Rules

### AUTO applies when:

- WA stores structured data (events, members, registrations)
- ClubOS has a direct model equivalent
- Script can map fields without human judgment

### MANUAL applies when:

- Content is presentation-only (layout, styling, static text)
- No structured data to migrate
- Operator must recreate using ClubOS primitives

### UNSUPPORTED applies when:

- Feature poses security risk (arbitrary scripts, untrusted embeds)
- Feature creates maintenance burden (vendor-specific integrations)
- Feature is deprecated or rarely used

---

## Canonical Gadget Matrix

### Events and Registration

| WA Item | Purpose | Data Needed | Tag | ClubOS Equivalent | Operator Notes |
|---------|---------|-------------|-----|-------------------|----------------|
| Event list gadget | Shows upcoming events on a page | Events CSV export | AUTO | Event list component | Filters preserved |
| Event calendar gadget | Calendar view (month/week) | Events CSV export | AUTO | Calendar view | Views configurable |
| Event detail page | Shows one event's info | Events CSV export | AUTO | Event detail route | Waitlist visible |
| Registration form | Collects signups | Registrations CSV export | AUTO | Registration component | Custom fields mapped |
| Waitlist display | Shows position to member | Registrations CSV export | AUTO | Waitlist component | Position preserved |
| Event payment widget | Collects event fees | Payment records (via WA API or CSV) | AUTO | Stripe checkout | History migrated |

### Members and Directory

| WA Item | Purpose | Data Needed | Tag | ClubOS Equivalent | Operator Notes |
|---------|---------|-------------|-----|-------------------|----------------|
| Member directory | Searchable member list | Members CSV export | AUTO | Directory component | Privacy levels kept |
| Profile view | Shows member details | Members CSV export | AUTO | Profile route | Custom fields mapped |
| Profile edit form | Self-service updates | Members CSV export | AUTO | Profile edit form | Validation applied |
| Login widget | Member authentication | Members CSV export (for identity) | AUTO | Auth component | Passkey-first |
| Logout link | Ends session | None | AUTO | Auth component | Session cleared |
| Password reset | Credential recovery | None (flow only) | AUTO | Auth flow | Email verification |

### Payments and Donations

| WA Item | Purpose | Data Needed | Tag | ClubOS Equivalent | Operator Notes |
|---------|---------|-------------|-----|-------------------|----------------|
| Membership dues | Collects annual/monthly fees | Member levels + payment history | AUTO | Dues component | Tier preserved |
| Donation form | Accepts contributions | Donation records | AUTO | Donation component | Fund tracking kept |
| Payment history | Shows past payments | Invoice/payment records | AUTO | Payment log | Full history |
| Invoice display | Shows invoice details | Invoice records | AUTO | Invoice component | PDF available |
| External processor embed | Third-party payment form | None (not migrated) | UNSUPPORTED | None | Security risk |

### Website and Presentation

| WA Item | Purpose | Data Needed | Tag | ClubOS Equivalent | Operator Notes |
|---------|---------|-------------|-----|-------------------|----------------|
| Content gadget | Static text/HTML block | None (content recreated) | MANUAL | Block editor | Operator types content |
| Image gallery | Photo collection display | Image files (download) | MANUAL | Gallery component | Re-upload images |
| Image grid/cards | Card-style layout | Image files (download) | MANUAL | Card layout | Recreate design |
| Menu/navigation | Site structure | None (structure recreated) | MANUAL | Nav config | Rebuild menu |
| Page layout | Page structure/columns | None | MANUAL | Layout templates | Match design intent |
| Custom CSS | Styling overrides | CSS file (download) | MANUAL | Theme settings | Translate to tokens |
| Slideshow/carousel | Rotating banner | Image files (download) | MANUAL | Carousel component | Re-upload assets |

### Embeds and Custom Code

| WA Item | Purpose | Data Needed | Tag | ClubOS Equivalent | Operator Notes |
|---------|---------|-------------|-----|-------------------|----------------|
| Arbitrary HTML block | Raw HTML content | None (not migrated) | UNSUPPORTED | None | Security risk |
| Inline JavaScript | Custom scripts | None (not migrated) | UNSUPPORTED | None | XSS risk |
| Google Calendar embed | External calendar | None | MANUAL | Native calendar | Use ClubOS calendar |
| Google Docs embed | Document display | None | MANUAL | Link or PDF | Convert or link |
| Google Forms embed | Survey/form | None | MANUAL | Form builder | Rebuild form |
| YouTube embed | Video player | Video URL | MANUAL | Video component | Allowlisted |
| Google Maps embed | Location map | Address/coordinates | MANUAL | Map component | Allowlisted |
| Social media widget | Social feed display | None | MANUAL | Social links | Links only |
| Tracking pixel | Analytics/advertising | None (not migrated) | UNSUPPORTED | None | Privacy risk |
| Third-party widget | External service | None (case-by-case) | UNSUPPORTED | None | Evaluate need |

### Automations and Integrations

| WA Item | Purpose | Data Needed | Tag | ClubOS Equivalent | Operator Notes |
|---------|---------|-------------|-----|-------------------|----------------|
| ICS calendar feed | Calendar subscription | None (auto-generated) | AUTO | ICS export | URL will change |
| Email templates | Notification messages | Template text (copy) | MANUAL | Email builder | Recreate content |
| Zapier integration | Workflow automation | Zap configuration notes | MANUAL | Webhook config | Rebuild triggers |
| Make integration | Workflow automation | Scenario notes | MANUAL | Webhook config | Rebuild triggers |
| Google Sheets export | Data export | None | MANUAL | CSV/API export | New format |
| Custom API usage | Direct API calls | API usage notes | MANUAL | ClubOS API | New endpoints |

---

## Process for Adding New Items

When you encounter a WA feature not listed:

1. Ask the three questions from "How to Decide Quickly"
2. Determine what data (if any) needs to be exported
3. Check if ClubOS has equivalent functionality
4. Evaluate security/maintenance risk
5. Add to appropriate table above with all columns filled
6. Update intake checklist if new category needed

---

## Related Documents

- [Migration Intake Checklist](./WILD_APRICOT_MIGRATION_INTAKE_CHECKLIST.md) - step-by-step discovery
- [Presentation Discovery Stage](./PRESENTATION_DISCOVERY_STAGE.md) - automated site crawling
- [Widgets vs Gadgets](./WILD_APRICOT_WIDGETS_VS_GADGETS.md) - terminology guide
