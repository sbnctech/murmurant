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

## Content Blocks

These are the block types available in the page editor, organized by category.

### Content Blocks

| Block Type | Description | Key Props |
|------------|-------------|-----------|
| `hero` | Full-width header with background | title, subtitle, backgroundImage, ctaText, ctaLink |
| `text` | Rich text content | content (HTML), alignment |
| `cards` | Grid of content cards | columns, cards[] with title, description, image, linkUrl |
| `faq` | Expandable Q&A pairs | title, items[] with question, answer |
| `testimonial` | Rotating member quotes | testimonials[] with quote, author, role, image |
| `stats` | Animated number counters | stats[] with value, prefix, suffix, label |
| `timeline` | Vertical chronological layout | events[] with date, title, description |

### Media Blocks

| Block Type | Description | Key Props |
|------------|-------------|-----------|
| `image` | Single image with caption | src, alt, caption, alignment, linkUrl |
| `gallery` | Grid of images with lightbox | images[], columns, enableLightbox |

### Interactive Blocks

| Block Type | Description | Key Props |
|------------|-------------|-----------|
| `event-list` | Dynamic upcoming events | title, limit, categories, layout (list/cards/calendar) |
| `contact` | Configurable contact form | recipientEmail, fields[], submitText |
| `cta` | Call-to-action button | text, link, style, size, alignment |
| `flip-card` | Cards that flip on hover | cards[] with frontImage, backTitle, backDescription |
| `accordion` | Expandable content sections | items[] with title, content; allowMultiple |
| `tabs` | Tabbed content panels | tabs[] with label, content; alignment |
| `before-after` | Draggable image comparison slider | beforeImage, afterImage, initialPosition |

### Layout Blocks

| Block Type | Description | Key Props |
|------------|-------------|-----------|
| `divider` | Horizontal line separator | style (solid/dashed/dotted), width |
| `spacer` | Vertical whitespace | height (small/medium/large) |

**Full specification:** `docs/pages/BLOCK_TYPES_REFERENCE.md`
**Original v1 spec:** `docs/pages/BLOCKS_AND_WIDGETS_V1.md`

---

## Widget Types

Widgets are dynamic blocks that display live data. All data access is RBAC-filtered server-side.

### eventList

Displays upcoming events with optional filtering.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | No | Section heading |
| `limit` | number | No | Max events to show (default: 5) |
| `categories` | string[] | No | Filter by category slugs |
| `showPastEvents` | boolean | No | Include past events (default: false) |
| `layout` | enum | No | `list` | `cards` | `calendar` (default: list) |
| `showRegistrationButton` | boolean | No | Show quick-register buttons (default: true) |

### announcementList

Displays club announcements for members.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | No | Section heading |
| `limit` | number | No | Max announcements (default: 3) |
| `showDate` | boolean | No | Display post date (default: true) |
| `categories` | string[] | No | Filter by announcement category |

### quickLinks

Configurable grid of navigation links.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | No | Section heading |
| `columns` | number | No | Grid columns: 2, 3, or 4 (default: 3) |
| `links` | array | **Yes** | Array of link objects |

**Link object properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `label` | string | **Yes** | Link text |
| `href` | string | **Yes** | Destination URL |
| `icon` | string | No | Icon name (optional) |
| `description` | string | No | Subtitle text |

### photoGallery

Image gallery with optional lightbox.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | No | Section heading |
| `albumId` | string | No | Filter to specific album |
| `limit` | number | No | Max images (default: 12) |
| `columns` | number | No | Grid columns: 2, 3, or 4 (default: 4) |
| `enableLightbox` | boolean | No | Click to enlarge (default: true) |

### adminQueueSummary

Dashboard widget showing pending admin tasks.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `queues` | string[] | No | Which queues to show (default: all accessible) |
| `showCounts` | boolean | No | Show item counts (default: true) |
| `maxItems` | number | No | Max items per queue (default: 5) |

**Available queues:** `membership_applications`, `pending_payments`, `event_approvals`, `content_review`

### htmlEmbedWidget (Restricted)

Raw HTML embed - **Tech Chair only**.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `html` | string | **Yes** | HTML content |
| `sandboxed` | boolean | No | Render in iframe sandbox (default: true) |
| `allowScripts` | boolean | No | Allow script execution (default: false) |

**Security:** Requires Tech Chair role. See `docs/pages/HTML_WIDGET_POLICY.md`.

### Planned/Future Widgets

| Widget Type | Status | Notes |
|-------------|--------|-------|
| `memberDirectory` | Planned | Role-gated member lookup |
| `committeeRoster` | Planned | Committee member listing |
| `calendarEmbed` | Planned | ClubCalendar integration |

**Spec:** `docs/pages/BLOCKS_AND_WIDGETS_V1.md`

---

## Admin List Widgets

These are specialized widgets for admin dashboards with full RBAC filtering. All use the List Gadget Runtime.

### Common Properties (All List Widgets)

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `template_id` | string | **Yes** | Server-side template identifier |
| `params` | object | No | Template-specific filter parameters |
| `page_size` | number | No | Items per page (server clamps to max 50) |
| `cursor` | string | No | Pagination cursor from previous response |

### Members List

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `params.status` | enum | No | `active` | `inactive` | `pending` | `alumni` |
| `params.joinDateFrom` | date | No | Filter by join date (start) |
| `params.joinDateTo` | date | No | Filter by join date (end) |
| `params.tags` | string[] | No | Filter by member tags |
| `params.committeeId` | string | No | Filter by committee assignment |

**Roles:** Membership admin, Tech Chair, President
**Output fields:** name, status, contact (role-gated), last activity

### Events List

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `params.dateFrom` | date | No | Filter by start date |
| `params.dateTo` | date | No | Filter by end date |
| `params.category` | string | No | Filter by category slug |
| `params.visibility` | enum | No | `public` | `members` | `draft` |
| `params.committeeId` | string | No | Filter by sponsoring committee |

**Roles:** Public/Member/Chair/Admin variants
**Output fields:** title, date, visibility, registration metrics

### Registrants List

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `params.eventId` | string | **Yes** | Event to show registrants for |
| `params.status` | enum | No | `registered` | `waitlisted` | `cancelled` |
| `params.paymentStatus` | enum | No | `paid` | `pending` | `refunded` |

**Roles:** Event chair (own events), VP Activities, President
**Output fields:** name, status, payment status, registration date

### Payments List

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `params.dateFrom` | date | No | Filter by transaction date |
| `params.dateTo` | date | No | Filter by transaction date |
| `params.status` | enum | No | `completed` | `pending` | `failed` | `refunded` |
| `params.eventId` | string | No | Filter by event |
| `params.memberId` | string | No | Filter by payer |

**Roles:** Finance roles, President
**Output fields:** amount, status, reference, payer (role-gated)

### Committees List

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `params.committeeId` | string | No | Filter to specific committee |
| `params.roleType` | string | No | Filter by role type (chair, member) |
| `params.activeOnly` | boolean | No | Only show active assignments (default: true) |

**Roles:** VP Activities, Tech Chair
**Output fields:** assignee, role, committee, effective dates

**Spec:** `docs/widgets/ADMIN_LIST_WIDGETS_CATALOG.md`

---

## Dashboard Gadgets

These are self-contained React components for member and admin home screens.

### Common Gadget Properties

All gadgets receive these props from `GadgetHost`:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `slot` | string | No | Layout hint: `primary` | `secondary` | `sidebar` |

### UpcomingEventsGadget

Displays upcoming events with quick registration.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `slot` | string | No | Layout slot hint |

**Data fetched:** `/api/v1/events?limit=5`
**Features:**
- Shows next 5 upcoming events
- Quick-register button for logged-in members
- Registration status badges (Registered/Waitlisted)
- Spots remaining indicator
- Links to event detail pages

**Output fields per event:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Event ID |
| `title` | string | Event title |
| `startTime` | datetime | Event start time |
| `category` | string | Event category |
| `spotsRemaining` | number | Available spots (null = unlimited) |
| `isWaitlistOpen` | boolean | Whether waitlist is accepting |

### MyRegistrationsGadget

Displays member's event registrations.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `slot` | string | No | Layout slot hint |

**Data fetched:** `/api/v1/me/registrations`
**Features:**
- Shows up to 5 registrations
- Color-coded status badges
- Past event indication
- Links to event detail pages

**Output fields per registration:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Registration ID |
| `eventId` | string | Event ID |
| `eventTitle` | string | Event title |
| `eventDate` | datetime | Event date |
| `status` | enum | `CONFIRMED` | `PENDING` | `WAITLISTED` | `CANCELLED` |
| `isPast` | boolean | Whether event has passed |

### Gadget Templates (Server-side)

These are template IDs for the List Gadget Runtime:

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
| `docs/pages/BLOCK_TYPES_REFERENCE.md` | Full block type specifications with examples |
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
| Content blocks | 17 block types documented in BLOCK_TYPES_REFERENCE.md |
| Widget block contract | Defined in spec |
| Dashboard gadgets | 2 implemented (UpcomingEvents, MyRegistrations) |
| Admin list widgets | Spec complete, implementation pending |
| Widget runtime | Basic implementation exists |
| Embed SDK | Spec complete |
