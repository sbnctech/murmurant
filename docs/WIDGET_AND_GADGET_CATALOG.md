# Widget and Gadget Catalog

**Last updated:** 2025-12-28

This document consolidates the widget and gadget inventory for Murmurant. It provides a single reference for what exists, what's planned, and where to find detailed specifications.

---

## Terminology

- **Block**: A content unit in a Page Document (heading, image, richText, etc.)
- **Widget**: A dynamic block that fetches and displays data (eventList, memberDirectory)
- **Gadget**: A self-contained UI component for member/admin dashboards (MyRegistrations, UpcomingEvents)

In practice, "widget" and "gadget" are often used interchangeably. The key distinction is where they appear:
- Widgets appear within pages (via the page editor)
- Gadgets appear on dashboards and home screens

---

## Content Blocks (v1 Palette)

These are static content blocks available in the page editor.

| Block Type | Description | Props |
|------------|-------------|-------|
| `heading` | Section heading | level (1-3), text |
| `richText` | Formatted text content | format, content (tiptap-json) |
| `divider` | Horizontal rule | variant (optional) |
| `callout` | Highlighted message box | tone (info/warning/success/neutral), title, content |
| `buttonRow` | Row of action buttons | buttons[] with label, href, variant |
| `image` | Image with caption | assetId or src, alt, caption, size |
| `spacer` | Vertical spacing | size (xs/sm/md/lg) |
| `columns` | Multi-column layout | columns (2/3), gap, blocksLeft, blocksRight |
| `section` | Grouping container | (layout construct) |

**Spec:** `docs/pages/BLOCKS_AND_WIDGETS_V1.md`

---

## Widget Types

Widgets are dynamic blocks that display live data. All data access is RBAC-filtered server-side.

### Public/Member Widgets

| Widget Type | Audience | Description |
|-------------|----------|-------------|
| `eventList` | Public/Member | Upcoming events with filters |
| `announcementList` | Member | Club announcements |
| `quickLinks` | Public/Member | Configurable link grid |
| `photoGallery` | Public/Member | Image gallery from assets |

### Admin Widgets

| Widget Type | Required Role | Description |
|-------------|---------------|-------------|
| `adminQueueSummary` | Admin roles | Pending items dashboard |
| `htmlEmbedWidget` | Tech Chair only | Raw HTML embed (restricted) |

### Planned/Future Widgets

| Widget Type | Status | Notes |
|-------------|--------|-------|
| `memberDirectory` | Planned | Role-gated member lookup |
| `committeeRoster` | Planned | Committee member listing |
| `calendarEmbed` | Planned | ClubCalendar integration |

**Spec:** `docs/pages/BLOCKS_AND_WIDGETS_V1.md`

---

## Admin List Widgets

These are specialized widgets for admin dashboards with full RBAC filtering.

| Widget | Viewer Roles | Filters | Output |
|--------|--------------|---------|--------|
| **Members List** | Membership admin, Tech Chair, President | status, join date, tags, committee | name, status, contact (role-gated) |
| **Events List** | Public/Member/Chair/Admin variants | date range, category, visibility, committee | title, date, visibility, metrics |
| **Registrants List** | Event chair, VP Activities, President | status, waitlist, payment | name, status, counts |
| **Payments List** | Finance roles, President | date range, status, event, payer | amounts, status, references |
| **Committees List** | VP Activities, Tech Chair | committee, role type, active range | assignee, role, scope, dates |

**Spec:** `docs/widgets/ADMIN_LIST_WIDGETS_CATALOG.md`

---

## Dashboard Gadgets

These are self-contained React components for member and admin home screens.

### Implemented Gadgets

| Gadget | Location | Description |
|--------|----------|-------------|
| `UpcomingEventsGadget` | `src/components/gadgets/` | Member's upcoming events |
| `MyRegistrationsGadget` | `src/components/gadgets/` | Member's event registrations |
| `GadgetHost` | `src/components/gadgets/` | Container/runtime for gadgets |

### Gadget Templates (Server-side)

| Template ID | Audience | Use Case |
|-------------|----------|----------|
| `MEM_MY_DIRECTORY` | Member | Personal directory view |
| `EVT_UPCOMING_MEMBER` | Member | My upcoming events |
| `EVT_MY_EVENTS_CHAIR` | Event Chair | Events I'm chairing |
| `REG_EVENT_ROSTER_CHAIR` | Event Chair | Registrants for my event |
| `FIN_OPEN_ITEMS_VP_FINANCE` | VP Finance | Open invoices needing review |

**Spec:** `docs/gadgets/LIST_GADGETS_SPEC.md`

---

## Widget Security Model

All widgets follow these security principles:

1. **Server-side RBAC**: Data is filtered before reaching the client
2. **Allowlisted parameters**: No arbitrary queries; params are validated
3. **No raw SQL/code**: Widget config cannot contain executable content
4. **Audit for exports**: CSV downloads are logged with who/when/what
5. **Tech Chair governance**: Only Tech Chair can add new widget types

### Embed Security (External Widgets)

For widgets embedded on external sites:

- Signed token with short TTL required
- Origin allowlist + CSP + iframe sandbox
- Widget endpoints only (no raw API access)

**Specs:**
- `docs/widgets/EMBEDDED_WIDGETS_SECURITY_MODEL.md`
- `docs/widgets/EMBED_WIDGET_SAFETY_RBAC_GUARDRAILS.md`
- `docs/pages/HTML_WIDGET_POLICY.md`

---

## Widget Runtime

| Component | Location | Purpose |
|-----------|----------|---------|
| `listGadgetRuntime.ts` | `src/lib/widgets/` | Server-side gadget execution |
| `list/route.ts` | `src/app/api/widgets/` | Widget list API endpoint |
| `widget/route.ts` | `src/app/api/v1/admin/transitions/` | Transition widget API |

**Spec:** `docs/widgets/LIST_GADGET_RUNTIME_V1.md`

---

## Migration from Wild Apricot

WA uses "gadget" for page editor blocks. Migration categories:

| Category | Migration Path | Examples |
|----------|---------------|----------|
| AUTO | Maps to ClubOS models | Event lists, member directory, login |
| MANUAL | Requires rebuild | Content blocks, embeds, layouts |
| UNSUPPORTED | Security review needed | Custom HTML with scripts |

**Specs:**
- `docs/MIGRATION/WILD_APRICOT_WIDGETS_VS_GADGETS.md`
- `docs/MIGRATION/WILD_APRICOT_GADGET_TAGGING.md`

---

## Related Documentation

| Document | Description |
|----------|-------------|
| `docs/pages/PAGE_MODEL_AND_RENDERING.md` | Page Document structure |
| `docs/pages/WIDGET_PERSISTENCE_MODEL.md` | Widget state storage |
| `docs/widgets/EMBED_WIDGET_SDK_V1.md` | External embed SDK |
| `docs/widgets/HELP_WIDGET_V1.md` | Help/support widget spec |
| `docs/widgets/EVENTS_WIDGET_FIT_ASSESSMENT.md` | Events widget analysis |
| `docs/demos/MEMBER_HOME_GADGETS_DEMO.md` | Gadget demo script |

---

## Implementation Status

| Category | Status |
|----------|--------|
| Content blocks (v1) | Defined in spec |
| Widget block contract | Defined in spec |
| Dashboard gadgets | 2 implemented (UpcomingEvents, MyRegistrations) |
| Admin list widgets | Spec complete, implementation pending |
| Widget runtime | Basic implementation exists |
| Embed SDK | Spec complete |
