# Wild Apricot Gadget and Widget Migration Tagging

This document is the **single source of truth** for WA gadget migration classification.

All intake checklists and migration manifests reference this table.

---

## Migration Tags

| Tag | Meaning |
|-----|---------|
| AUTO | Data-backed; maps directly to ClubOS model; migrated by script |
| MANUAL | Presentation-only; requires operator rebuild in ClubOS |
| UNSUPPORTED | Security or maintenance risk; excluded from migration scope |

---

## Tag Decision Rules

1. **AUTO** applies when:
   - WA stores structured data (events, members, registrations)
   - ClubOS has a direct model equivalent
   - Script can map fields without human judgment

2. **MANUAL** applies when:
   - Content is presentation-only (layout, styling, static text)
   - No structured data to migrate
   - Operator must recreate using ClubOS primitives

3. **UNSUPPORTED** applies when:
   - Feature poses security risk (arbitrary scripts, untrusted embeds)
   - Feature creates maintenance burden (vendor-specific integrations)
   - Feature is deprecated or rarely used

---

## Canonical Gadget Matrix

### Events and Registration

| WA Item | What It Does | Typical Use | Tag | ClubOS Equivalent | Operator Notes |
|---------|--------------|-------------|-----|-------------------|----------------|
| Event list gadget | Displays upcoming events | Home page, events page | AUTO | Event list component | Filters preserved |
| Event calendar gadget | Calendar view of events | Events page | AUTO | Calendar view | Month/week views |
| Event detail page | Shows single event info | Event pages | AUTO | Event detail route | Waitlist shown |
| Registration form | Collects registration | Event pages | AUTO | Registration component | Custom fields mapped |
| Waitlist display | Shows waitlist position | Member view | AUTO | Waitlist component | Position preserved |
| Event payment widget | Processes event fees | Registration flow | AUTO | Stripe checkout | Payment history kept |

### Members and Directory

| WA Item | What It Does | Typical Use | Tag | ClubOS Equivalent | Operator Notes |
|---------|--------------|-------------|-----|-------------------|----------------|
| Member directory | Lists searchable members | Members-only page | AUTO | Directory component | Privacy levels honored |
| Profile view | Shows member profile | Directory links | AUTO | Profile route | Custom fields mapped |
| Profile edit form | Edits own profile | Member area | AUTO | Profile edit form | Validation rules apply |
| Login widget | Handles authentication | Header, login page | AUTO | Auth component | Passkey-first |
| Logout link | Ends session | Header, nav | AUTO | Auth component | Session cleared |
| Password reset | Resets credentials | Login flow | AUTO | Auth flow | Email verified |

### Payments and Donations

| WA Item | What It Does | Typical Use | Tag | ClubOS Equivalent | Operator Notes |
|---------|--------------|-------------|-----|-------------------|----------------|
| Membership dues | Collects annual dues | Join/renew flow | AUTO | Dues component | Tier preserved |
| Donation form | Accepts donations | Donation page | AUTO | Donation component | Fund allocation kept |
| Payment history | Shows past payments | Member area | AUTO | Payment log | Full history |
| Invoice display | Shows invoice details | Email, member area | AUTO | Invoice component | PDF available |
| External processor embed | Third-party payment | Custom pages | UNSUPPORTED | None | Security risk |

### Website and Presentation

| WA Item | What It Does | Typical Use | Tag | ClubOS Equivalent | Operator Notes |
|---------|--------------|-------------|-----|-------------------|----------------|
| Content gadget | Static text/HTML | Any page | MANUAL | Block editor | Recreate content |
| Image gallery | Displays photos | Activity pages | MANUAL | Gallery component | Re-upload images |
| Image grid/cards | Card layout | Home, landing | MANUAL | Card layout | Recreate design |
| Menu/navigation | Site navigation | Header, sidebar | MANUAL | Nav config | Rebuild structure |
| Page layout | Page structure | All pages | MANUAL | Layout templates | Match design |
| Custom CSS | Styling overrides | Site-wide | MANUAL | Theme settings | Translate to tokens |
| Slideshow/carousel | Rotating images | Home page | MANUAL | Carousel component | Re-upload assets |

### Embeds and Custom Code

| WA Item | What It Does | Typical Use | Tag | ClubOS Equivalent | Operator Notes |
|---------|--------------|-------------|-----|-------------------|----------------|
| Arbitrary HTML block | Raw HTML | Custom pages | UNSUPPORTED | None | Security risk |
| Inline JavaScript | Custom scripts | Various | UNSUPPORTED | None | XSS risk |
| Google Calendar embed | Shows calendar | Events page | MANUAL | Native calendar | Use ClubOS calendar |
| Google Docs embed | Shows document | Info pages | MANUAL | Link or PDF | Convert or link |
| Google Forms embed | Collects data | Survey pages | MANUAL | Form builder | Rebuild in ClubOS |
| YouTube embed | Shows video | Various | MANUAL | Video component | Allowlisted source |
| Google Maps embed | Shows location | Event pages | MANUAL | Map component | Allowlisted source |
| Social media widget | Shows feed | Footer, sidebar | MANUAL | Social links | Links only |
| Tracking pixel | Analytics | Site-wide | UNSUPPORTED | None | Privacy risk |
| Third-party widget | External service | Various | UNSUPPORTED | None | Evaluate per case |

### Automations and Integrations

| WA Item | What It Does | Typical Use | Tag | ClubOS Equivalent | Operator Notes |
|---------|--------------|-------------|-----|-------------------|----------------|
| ICS calendar feed | Calendar subscription | External calendars | AUTO | ICS export | URL changes |
| Email templates | Automated emails | Notifications | MANUAL | Email builder | Recreate templates |
| Zapier integration | Workflow automation | Various | MANUAL | Webhook config | Rebuild triggers |
| Make integration | Workflow automation | Various | MANUAL | Webhook config | Rebuild triggers |
| Google Sheets export | Data export | Reporting | MANUAL | CSV/API export | New export format |
| Custom API usage | Direct API calls | Integrations | MANUAL | ClubOS API | New endpoints |

---

## Process for Adding New Items

When you encounter a WA feature not listed:

1. Determine if it stores structured data (AUTO candidate)
2. Check if ClubOS has equivalent functionality
3. Evaluate security/maintenance risk
4. Add to appropriate table above
5. Update intake checklist if new category needed

---

## Related Documents

- [Migration Intake Checklist](./WILD_APRICOT_MIGRATION_INTAKE_CHECKLIST.md) - discovery questions
- [WA Custom HTML Blocks](./WILD_APRICOT_CUSTOM_HTML_BLOCKS.md) - detailed HTML handling
