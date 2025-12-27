# ClubOS Page Builder Primitives

This document defines the complete set of page builder primitives available in ClubOS. Each primitive is a bounded, auditable component that serves a specific purpose.

**Related documents:**
- [WA Gadget Tagging Matrix](../MIGRATION/WILD_APRICOT_GADGET_TAGGING.md) - Migration classification
- [Migration Intake Checklist](../MIGRATION/WILD_APRICOT_MIGRATION_INTAKE_CHECKLIST.md) - Discovery questions

---

## Migration Behavior Key

| Behavior | Meaning |
|----------|---------|
| AUTO | Script migrates data and configuration; no human judgment needed |
| ASSISTED | Script provides starting point; operator reviews and adjusts |
| MANUAL | Operator recreates from scratch using ClubOS primitives |

---

## Structural Primitives

These define page layout and organization.

### Page

**Why this exists:** Every piece of content needs a container with a URL, metadata, and access rules. Pages are the atomic unit of publishing.

| WA Gadget Replaced | Migration |
|--------------------|-----------|
| Page (WA page object) | ASSISTED |

### Section

**Why this exists:** Vertical content regions allow semantic grouping (hero, body, footer) and consistent spacing without CSS hacks.

| WA Gadget Replaced | Migration |
|--------------------|-----------|
| Page layout regions | MANUAL |
| Content areas | MANUAL |

### Column

**Why this exists:** Responsive multi-column layouts that work on all devices without custom CSS.

| WA Gadget Replaced | Migration |
|--------------------|-----------|
| Table-based layouts | MANUAL |
| Column widgets | MANUAL |

### Card

**Why this exists:** Consistent visual treatment for related content (event summary, member profile, activity preview).

| WA Gadget Replaced | Migration |
|--------------------|-----------|
| Image grid/cards | MANUAL |
| Feature boxes | MANUAL |

---

## Content Primitives

These display static or semi-static content.

### TextBlock

**Why this exists:** Rich text content with consistent styling and no XSS vectors. Supports headings, lists, links, and inline formatting.

| WA Gadget Replaced | Migration |
|--------------------|-----------|
| Content gadget (text only) | MANUAL |
| Static HTML (text portions) | MANUAL |

### Image

**Why this exists:** Optimized image display with responsive sizing, lazy loading, and accessibility attributes.

| WA Gadget Replaced | Migration |
|--------------------|-----------|
| Image widgets | MANUAL |
| Header images | MANUAL |

### ImageGallery

**Why this exists:** Photo collections with consistent layout, lightbox viewing, and event tagging.

| WA Gadget Replaced | Migration |
|--------------------|-----------|
| Image gallery | MANUAL |
| Slideshow/carousel | MANUAL |
| Photo albums | MANUAL |

### CallToAction

**Why this exists:** Prominent buttons and links with consistent styling and click tracking.

| WA Gadget Replaced | Migration |
|--------------------|-----------|
| Button widgets | MANUAL |
| CTA banners | MANUAL |

---

## Dynamic Primitives

These display live data from ClubOS models.

### EventList

**Why this exists:** Display upcoming events with filtering, sorting, and registration status. Data-driven from the Event model.

| WA Gadget Replaced | Migration |
|--------------------|-----------|
| Event list gadget | AUTO |
| Event widgets | AUTO |

### EventCalendar

**Why this exists:** Calendar visualization of events with month/week/day views. Same data source as EventList.

| WA Gadget Replaced | Migration |
|--------------------|-----------|
| Event calendar gadget | AUTO |
| Calendar widgets | AUTO |

### EventRegistration

**Why this exists:** Registration form, waitlist status, and payment flow for a specific event.

| WA Gadget Replaced | Migration |
|--------------------|-----------|
| Registration form | AUTO |
| Waitlist display | AUTO |
| Event payment widget | AUTO |

### MemberDirectory

**Why this exists:** Searchable member listing with privacy controls and profile links.

| WA Gadget Replaced | Migration |
|--------------------|-----------|
| Member directory | AUTO |
| Member search | AUTO |

### LoginControl

**Why this exists:** Authentication UI with login, logout, and session status. Passkey-first design.

| WA Gadget Replaced | Migration |
|--------------------|-----------|
| Login widget | AUTO |
| Logout link | AUTO |
| Password reset | AUTO |

---

## Control Primitives

These govern visibility and behavior.

### VisibilityRule

**Why this exists:** Conditional display based on membership status, date ranges, or feature flags without code changes.

| WA Gadget Replaced | Migration |
|--------------------|-----------|
| Member-only page settings | ASSISTED |
| Date-based visibility | ASSISTED |

### RoleGate

**Why this exists:** Restrict content to specific roles (board, committee, staff) with audit logging.

| WA Gadget Replaced | Migration |
|--------------------|-----------|
| Admin-only content | ASSISTED |
| Role-based sections | ASSISTED |

### FeatureFlag

**Why this exists:** Toggle features for testing or gradual rollout without deployment.

| WA Gadget Replaced | Migration |
|--------------------|-----------|
| None | N/A |

---

## Implementation Details

This section documents the concrete implementation of Page Builder primitives in ClubOS.

### Page Structure: Page → Sections → Blocks

Pages use a hierarchical structure:

```
Page (slug, title, visibility, audienceRule)
  └── Sections[] (id, name, order, layout, visibilityRule, roleGate)
        └── Blocks[] (id, type, order, data, visibilityRule, roleGate)
```

**Key files:**

- `src/lib/publishing/blocks.ts` - Block type definitions
- `src/lib/publishing/visibility.ts` - VisibilityRule and RoleGate evaluation
- `src/components/publishing/BlockRenderer.tsx` - Render path

### Section Type Definition

```typescript
type Section = {
  id: string;
  name?: string;                    // Display name, e.g., "Hero", "Main Content"
  order: number;                    // Sort order within page
  blocks: Block[];                  // Blocks in this section
  visibilityRule?: VisibilityRuleData;  // Optional visibility control
  roleGate?: RoleGateData;          // Optional role restriction
  layout?: "full-width" | "contained" | "narrow";  // Layout hint
};
```

### VisibilityRule Type Definition

Controls conditional display based on membership status and date ranges:

```typescript
type VisibilityRuleData = {
  isPublic?: boolean;              // Visible to all if true
  membershipStatuses?: string[];   // e.g., ["active", "board"]
  dateRange?: {
    start?: string;                // ISO date string
    end?: string;                  // ISO date string
  };
  featureFlags?: string[];         // Future: feature flag names
};
```

**Example: Show section only to active members:**

```typescript
const memberOnlySection: Section = {
  id: "members-welcome",
  name: "Member Welcome",
  order: 1,
  blocks: [/* ... */],
  visibilityRule: {
    membershipStatuses: ["active", "board"]
  }
};
```

### RoleGate Type Definition

Restricts content to specific committee roles:

```typescript
type RoleGateData = {
  allowedRoles: string[];      // Committee role slugs
  committeeIds?: string[];     // Optional: limit to specific committees
};
```

**Example: Show block only to board members:**

```typescript
const boardBlock: Block = {
  id: "board-notice",
  type: "text",
  order: 0,
  data: { content: "<p>Board-only content here.</p>" },
  roleGate: {
    allowedRoles: ["president", "board-member", "treasurer"]
  }
};
```

### Render-Time Visibility Enforcement

Visibility is enforced at render time, not at the database level. This ensures:

1. **Server-side enforcement** (Charter P2) - Not just UI gating
2. **Audit trail** - User context is evaluated per request
3. **Fail closed** (Charter P9) - If evaluation fails, content is hidden

**Render flow:**

```
1. Page route fetches published content
2. Session provides user context (roles, membership status)
3. normalizeToSections() converts content to section format
4. filterVisibleSections() applies visibility rules
5. BlockRenderer renders only visible sections/blocks
```

### Block Types Reference

| Type | Component | Editable Fields |
|------|-----------|-----------------|
| text | TextBlock | content, alignment |
| image | ImageBlock | src, alt, caption, width, alignment, linkUrl |
| hero | HeroBlock | title, subtitle, backgroundImage, ctaText, ctaLink |
| gallery | GalleryBlock | images[], columns, enableLightbox |
| cta | CtaBlock | text, link, style, size, alignment |
| cards | CardsBlock | cards[], columns |
| faq | FaqBlock | title, items[] |
| contact | ContactBlock | title, description, recipientEmail, fields[] |
| event-list | EventListBlock | title, limit, categories, layout |
| divider | DividerBlock | style, width |
| spacer | SpacerBlock | height |

### Adding a New Block to a Page

Admin UI workflow:

1. Open page in admin → Content → Pages
2. Navigate to desired section
3. Click "Add Block" button
4. Select block type from palette
5. Configure block fields
6. Save and preview

### Backwards Compatibility

The system supports both legacy `blocks[]` format (schemaVersion 1) and new `sections[]` format (schemaVersion 2+):

```typescript
// Legacy format (auto-converted to single section)
{ schemaVersion: 1, blocks: [...] }

// New format (explicit sections)
{ schemaVersion: 2, sections: [...] }
```

The `normalizeToSections()` function transparently handles both formats.

---

## SafeEmbed Specification

SafeEmbed renders external content via a locked-down iframe. It replaces arbitrary HTML embeds from Wild Apricot custom blocks with a secure, auditable alternative.

**Why this exists:** Video and map content from trusted sources only. Prevents arbitrary iframe injection.

| WA Gadget Replaced | Migration |
|--------------------|-----------|
| YouTube embed | MANUAL |
| Vimeo embed | MANUAL |
| Google Maps embed | MANUAL |
| Calendly embed | MANUAL |

### Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| providerType | string | yes | Identifier from the allowlist (e.g., "youtube", "google-maps") |
| url | string | yes | Full URL to embed; must match allowlist rules |
| title | string | yes | Accessible title for the iframe |
| height | number | no | Height in pixels (default: 315) |
| width | number | no | Width in pixels (default: 560) |
| allowFullscreen | boolean | no | Enable fullscreen (default: false; must be allowed by provider config) |

### Allowlist Model

Admin-configurable with safety constraints:

- **Default deny.** Only URLs matching an explicit allowlist entry are rendered.
- **Hostname-based entries.** No wildcards by default.
- **HTTPS only.** HTTP URLs are rejected.

Each allowlist entry defines:

| Field | Required | Description |
|-------|----------|-------------|
| hostname | yes | Exact hostname (e.g., "www.youtube.com") |
| pathPrefixes | no | Allowed URL path prefixes (e.g., ["/embed/"]) |
| queryParamsAllowed | no | Whether query params are permitted (default: true) |
| allowFullscreen | no | Whether fullscreen is permitted (default: false) |
| notes | no | Human-readable reason for this entry |

### Iframe Security

The rendered iframe uses locked-down attributes:

```
sandbox="allow-scripts allow-same-origin"
referrerpolicy="no-referrer"
allow=""
```

Notes:
- `allow-scripts` and `allow-same-origin` are needed for most video players.
- `allow=""` disables camera, microphone, geolocation, and other sensitive features.
- If a provider does not require `allow-same-origin`, omit it.

### Audit Requirements

All allowlist changes must be logged:

- Who: Admin user ID
- When: Timestamp
- What: Entry added, modified, or removed

### Default Allowlist (v1)

Shipped out of the box:

| Provider | Hostname | Path Prefix | Fullscreen |
|----------|----------|-------------|------------|
| YouTube | www.youtube.com | /embed/ | yes |
| YouTube (short) | youtu.be | / | yes |
| Vimeo | player.vimeo.com | /video/ | yes |
| Google Maps | www.google.com | /maps/embed | no |
| Calendly | calendly.com | / | no |

Admins may add entries for other providers following the safety rules above.

---

## Explicit Non-Goals

The following are **permanently excluded** from ClubOS page builder. These are not "future features" or "escape hatches" - they are architectural decisions that protect the platform.

### Arbitrary HTML

**Why excluded:** Arbitrary HTML enables XSS attacks, breaks accessibility, creates maintenance burden, and makes content ungovernable.

| WA Gadget | Status |
|-----------|--------|
| Arbitrary HTML block | UNSUPPORTED |
| Custom HTML widgets | UNSUPPORTED |

**What to do instead:** Use TextBlock for formatted text, Image for graphics, SafeEmbed for videos/maps.

### Inline Scripts

**Why excluded:** JavaScript injection enables session hijacking, data exfiltration, and UI spoofing. No "trusted script" exception exists.

| WA Gadget | Status |
|-----------|--------|
| Inline JavaScript | UNSUPPORTED |
| Script widgets | UNSUPPORTED |
| Custom JS tracking | UNSUPPORTED |

**What to do instead:** ClubOS provides built-in analytics. Interactive features are implemented as platform primitives.

### Unbounded Embeds

**Why excluded:** Arbitrary iframes can load any content, bypass CSP, track users, and create liability.

| WA Gadget | Status |
|-----------|--------|
| Generic iframe embed | UNSUPPORTED |
| Third-party widgets | UNSUPPORTED |
| Tracking pixels | UNSUPPORTED |
| Social media feeds | UNSUPPORTED |
| External payment embeds | UNSUPPORTED |

**What to do instead:** Use SafeEmbed with allowlisted sources. For integrations, use ClubOS API or webhooks.

### Custom CSS

**Why excluded:** Custom CSS breaks responsive design, creates inconsistent branding, and makes updates fragile.

| WA Gadget | Status |
|-----------|--------|
| Custom CSS blocks | UNSUPPORTED |
| Inline styles | UNSUPPORTED |

**What to do instead:** Use theme configuration for colors, fonts, and spacing.

---

## Migration Decision Tree

When evaluating a WA feature for migration:

```
1. Is it backed by structured data (events, members, registrations)?
   YES -> Map to Dynamic primitive (AUTO migration)
   NO  -> Continue

2. Is it presentation content (text, images, layout)?
   YES -> Map to Content/Structural primitive (MANUAL migration)
   NO  -> Continue

3. Does it require arbitrary code execution or untrusted sources?
   YES -> UNSUPPORTED - explain limitation to customer
   NO  -> Continue

4. Is it from an allowlisted source (YouTube, Google Maps)?
   YES -> SafeEmbed (MANUAL migration)
   NO  -> UNSUPPORTED
```

---

## Related Documents

- [WA Gadget Tagging Matrix](../MIGRATION/WILD_APRICOT_GADGET_TAGGING.md) - Canonical migration classification
- [Migration Intake Checklist](../MIGRATION/WILD_APRICOT_MIGRATION_INTAKE_CHECKLIST.md) - Discovery questions for operators
- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) - Principles N1-N8 (anti-patterns)
