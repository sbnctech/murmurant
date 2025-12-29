# Murmurant v0 Publishing System Plan

Version: 0.1.0
Status: Draft
Date: 2025-12-15

---

## Overview

The Murmurant Publishing System enables club administrators to create, edit, and publish web pages for both public visitors and authenticated members. The system supports:

- **Public pages** - Visible to everyone (e.g., About, Contact, Join)
- **Member pages** - Visible only to logged-in members
- **Role-restricted pages** - Visible only to specific roles or groups

The design prioritizes simplicity, flexibility, and freedom from WildApricot-era rigidity.


---

## 1. Page Types and Visibility

### Page Visibility Levels

| Visibility | Audience | Use Cases |
|------------|----------|-----------|
| `PUBLIC` | Everyone | Home, About, Events Calendar, Contact |
| `MEMBERS_ONLY` | Authenticated members with active status | Member Directory, Resources, Archives |
| `ROLE_RESTRICTED` | Members matching audience rules | Board Documents, Committee Pages, President Dashboard |

### Page Status Lifecycle

```
DRAFT --> PUBLISHED --> ARCHIVED
            ^               |
            |_______________|
              (Republish)
```

- **DRAFT** - Work in progress, visible only to editors
- **PUBLISHED** - Live on the site, respects visibility rules
- **ARCHIVED** - Hidden from site, preserved for history


---

## 2. Content Model

### Pages

Pages are the primary content unit. Each page consists of:

- **Metadata**: slug, title, description, SEO fields
- **Content**: Array of blocks (JSON)
- **Template**: Optional base structure
- **Theme**: Optional visual styling override
- **Audience Rule**: For role-restricted pages

### Blocks

Blocks are the building units of page content. Available block types:

| Block Type | Category | Description |
|------------|----------|-------------|
| `hero` | content | Full-width header with background |
| `text` | content | Rich text (HTML) |
| `image` | media | Single image with caption |
| `cards` | content | Grid of content cards |
| `event-list` | interactive | Dynamic list of upcoming events |
| `gallery` | media | Image gallery with lightbox |
| `faq` | content | Accordion FAQ section |
| `contact` | interactive | Contact form |
| `cta` | interactive | Call-to-action button |
| `divider` | layout | Horizontal separator |
| `spacer` | layout | Vertical whitespace |

### Templates

Templates provide reusable page structures:

- **PAGE** - Standard content page
- **LANDING** - Marketing/landing page
- **EMAIL** - Email message layout

Templates define which blocks are available and their default configuration.

### Themes

Themes control visual styling through CSS custom properties (tokens):

- Colors (primary, secondary, background, text, etc.)
- Typography (fonts, sizes, line heights)
- Spacing (xs through xxl)
- Border radius
- Shadows

See [TEMPLATE_THEME_MODEL.md](./TEMPLATE_THEME_MODEL.md) for details.


---

## 3. Audience Rules

Audience rules determine who can view role-restricted content.

### Rule Schema

```typescript
type AudienceRules = {
  isPublic?: boolean;              // If true, everyone can see
  roles?: string[];                // Committee role slugs
  membershipStatuses?: string[];   // Status codes (active, board, etc.)
  memberIds?: string[];            // Specific member UUIDs
  committeeIds?: string[];         // Committee UUIDs
  joinedAfterDays?: number;        // New members (within N days)
  joinedBeforeDate?: string;       // Long-term members
  excludeMemberIds?: string[];     // Exclusion list
};
```

### Evaluation Logic

1. If `isPublic: true`, everyone can view
2. If user is in `excludeMemberIds`, deny access
3. If user matches any positive criteria (roles, statuses, IDs, committees), allow
4. If no positive criteria defined, allow authenticated users
5. Otherwise, deny

### Common Patterns

| Pattern | Rules |
|---------|-------|
| Board only | `{ roles: ["president", "board-member"] }` |
| Committee chairs | `{ roles: ["chair"] }` |
| New members (30 days) | `{ joinedAfterDays: 30 }` |
| Activities committee | `{ committeeIds: ["<activities-id>"] }` |


---

## 4. Permissions Integration

### Capabilities

Publishing uses the `publishing:manage` capability from the global auth system.

| Role | publishing:manage | Notes |
|------|-------------------|-------|
| admin | Yes | Full access |
| webmaster | Yes | Primary publishing role |
| president | No | Uses capability but not primary publisher |
| vp-activities | No | No publishing access |
| event-chair | No | No publishing access |

### Permission Matrix

| Action | Required Capability | Additional Rules |
|--------|---------------------|------------------|
| List pages | publishing:manage | - |
| Create page | publishing:manage | - |
| Edit page | publishing:manage | Or creator of own draft |
| Publish page | publishing:manage | - |
| Delete draft | publishing:manage | Or creator |
| Delete published | admin:full | Only full admins |
| Manage themes | publishing:manage | - |
| Manage templates | publishing:manage | - |

### View Permission Flow

```
Is page PUBLISHED?
  |-- No --> Does user have publishing:manage? --> Yes/No
  |-- Yes --> Check visibility:
                |-- PUBLIC --> Allow all
                |-- MEMBERS_ONLY --> Check active membership
                |-- ROLE_RESTRICTED --> Evaluate audience rules
```


---

## 5. Admin UX Surface

### Pages List (`/admin/content/pages`)

Features:

- Paginated table of all pages
- Columns: Title, Slug, Status, Visibility, Last Updated
- Filters: Status (Draft/Published/Archived), Visibility
- Search by title or slug
- Actions: Edit, Preview, Publish, Archive, Delete

### Page Editor (`/admin/content/pages/[id]/edit`)

Features:

- **Header**: Title, Slug, Status indicator
- **Settings Panel**: Visibility, Template, Theme, SEO fields
- **Block Canvas**: Drag-and-drop block arrangement
- **Block Toolbar**: Add blocks by type
- **Block Editor**: Per-block configuration forms
- **Actions**: Save Draft, Preview, Publish

### Block Editor UX

Each block type has a dedicated editor form:

- `hero`: Title, subtitle, background image picker, CTA button config
- `text`: Rich text editor (TipTap or similar)
- `image`: Image picker, alt text, caption, link
- `cards`: Card list with add/remove/reorder
- `event-list`: Limit, categories, layout selector
- `gallery`: Image list with captions
- `faq`: Question/answer pairs
- `contact`: Recipient email, field configuration
- `cta`: Button text, link, style selector

### Preview Mode

- Full-page preview in iframe
- Toggle between: Public view, Member view, Editor view
- Device size toggles (desktop, tablet, mobile)

### Templates List (`/admin/content/templates`)

- List all templates
- Create, edit, delete templates
- Template editor: Name, type, block schema

### Themes List (`/admin/content/themes`)

- List all themes
- Create, edit, delete themes
- Theme editor: Token values, custom CSS
- Preview theme with sample content


---

## 6. CSS Strategy

### Design Principles

1. **Token-based** - All styling uses CSS custom properties
2. **Composable** - Themes provide base, pages can override
3. **Scoped** - Per-page CSS is scoped to prevent bleed
4. **Sanitized** - All custom CSS is sanitized for security

### Token Hierarchy

```
Default Tokens (hardcoded fallback)
    |
    v
Theme Tokens (from active theme)
    |
    v
Page-level Overrides (optional per-page CSS)
    |
    v
Block-level Styles (inline from block data)
```

### CSS Variable Naming

```css
:root {
  /* Colors */
  --color-primary: #1a5f7a;
  --color-background: #ffffff;
  --color-text: #333333;

  /* Typography */
  --font-family: system-ui, sans-serif;
  --font-size-base: 16px;
  --font-size-h1: 32px;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-md: 16px;

  /* Border Radius */
  --border-radius-md: 8px;

  /* Shadows */
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
}
```

### Per-Page CSS

Pages can define custom CSS that is:

- Scoped to the page container (`.page-[slug]`)
- Sanitized to remove script injection vectors
- Limited in size (max 50KB)

Example:

```css
.page-about .hero-block {
  background-color: var(--color-primary);
}

.page-about .text-block {
  max-width: 800px;
  margin: 0 auto;
}
```

### Theme vs Page vs Block

| Level | Controls | When to Use |
|-------|----------|-------------|
| Theme | Site-wide colors, fonts, spacing | Brand consistency |
| Page | Page-specific overrides | Unique landing pages |
| Block | Block-level inline styles | Fine-grained adjustments |


---

## 7. Data Model

### Prisma Models (Existing)

The following models are already defined in the Prisma schema:

```prisma
enum PageStatus { DRAFT, PUBLISHED, ARCHIVED }
enum PageVisibility { PUBLIC, MEMBERS_ONLY, ROLE_RESTRICTED }
enum ThemeStatus { DRAFT, ACTIVE, ARCHIVED }
enum TemplateType { PAGE, LANDING, EMAIL }

model Theme {
  id          String      @id @default(uuid())
  name        String
  slug        String      @unique
  description String?
  status      ThemeStatus @default(DRAFT)
  tokens      Json        // ThemeTokens
  cssText     String?     // Custom CSS
  cssUrl      String?     // External CSS
  isDefault   Boolean     @default(false)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  pages       Page[]
}

model Template {
  id            String       @id @default(uuid())
  name          String
  slug          String       @unique
  type          TemplateType
  description   String?
  schemaVersion Int          @default(1)
  content       Json         // Block schema
  themeId       String?
  isActive      Boolean      @default(true)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  pages         Page[]
}

model Page {
  id             String         @id @default(uuid())
  slug           String         @unique
  title          String
  description    String?
  status         PageStatus     @default(DRAFT)
  visibility     PageVisibility @default(PUBLIC)
  templateId     String?
  themeId        String?
  content        Json           // Block content
  seoTitle       String?
  seoDescription String?
  seoImage       String?
  publishAt      DateTime?
  publishedAt    DateTime?
  audienceRuleId String?
  createdById    String?
  updatedById    String?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  template     Template?
  theme        Theme?
  audienceRule AudienceRule?
  createdBy    Member?
  updatedBy    Member?
}

model Navigation {
  id             String  @id @default(uuid())
  name           String
  slug           String  @unique
  items          Json    // Navigation items
  audienceRuleId String?
  sortOrder      Int     @default(0)
  isActive       Boolean @default(true)
  // ...
}

model AudienceRule {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  description String?
  rules       Json     // AudienceRules
  isActive    Boolean  @default(true)
  // ...
}
```


---

## 8. API Routes

### Existing Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/admin/content/pages | List pages (paginated) |
| POST | /api/admin/content/pages | Create page |
| GET | /api/admin/content/pages/[id] | Get page by ID |
| PUT | /api/admin/content/pages/[id] | Update page |
| DELETE | /api/admin/content/pages/[id] | Delete page |
| GET | /api/admin/content/templates | List templates |
| GET | /api/admin/content/themes | List themes |

### Routes to Add

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/admin/content/pages/[id]/publish | Publish page |
| POST | /api/admin/content/pages/[id]/unpublish | Unpublish page |
| POST | /api/admin/content/pages/[id]/archive | Archive page |
| GET | /api/admin/content/pages/[id]/preview | Preview URL |
| POST | /api/admin/content/templates | Create template |
| PUT | /api/admin/content/templates/[id] | Update template |
| DELETE | /api/admin/content/templates/[id] | Delete template |
| POST | /api/admin/content/themes | Create theme |
| PUT | /api/admin/content/themes/[id] | Update theme |
| DELETE | /api/admin/content/themes/[id] | Delete theme |
| GET | /api/admin/content/audience-rules | List rules |
| POST | /api/admin/content/audience-rules | Create rule |
| GET | /api/admin/content/assets | List assets |
| POST | /api/admin/content/assets | Upload asset |

### Public Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | /[slug] | Render published page |
| GET | /api/pages/[slug] | Get page content (API) |
| GET | /api/theme.css | Active theme CSS |


---

## 9. E2E Test Coverage Plan

### API Tests (`tests/api/admin-content-*.spec.ts`)

**Pages API:**

- GET /api/admin/content/pages returns paginated list
- POST /api/admin/content/pages creates page with valid data
- POST /api/admin/content/pages validates slug format
- POST /api/admin/content/pages rejects duplicate slugs
- PUT /api/admin/content/pages/[id] updates page
- DELETE /api/admin/content/pages/[id] deletes draft
- DELETE /api/admin/content/pages/[id] requires admin for published
- Webmaster can access pages API
- Event-chair cannot access pages API

**Templates API:**

- GET returns templates list
- POST creates template
- PUT updates template
- DELETE deletes template

**Themes API:**

- GET returns themes list
- POST creates theme
- PUT updates theme
- DELETE deletes theme

### UI Tests (`tests/admin/admin-content-*.spec.ts`)

**Pages List:**

- Page loads with table and pagination
- Filter by status works
- Search by title works
- Create button navigates to editor

**Page Editor:**

- Editor loads with page data
- Can edit title and slug
- Can add blocks
- Can reorder blocks
- Can delete blocks
- Save draft works
- Publish works

**Preview:**

- Preview iframe loads
- Public preview shows content
- Member preview respects visibility

### Permissions Tests

- Webmaster can access all publishing features
- President cannot access publishing features
- Event-chair gets 403 on publishing routes
- Anonymous user cannot access admin routes

### Content Rendering Tests

- Public page renders for anonymous
- Members-only page redirects anonymous
- Members-only page shows for authenticated
- Role-restricted page checks audience rules


---

## 10. Implementation Phases

### Phase 1: Core Pages (Current Sprint)

- Pages list UI
- Page editor with basic blocks (hero, text, image, cta)
- Save/publish workflow
- Public page rendering

### Phase 2: Templates and Themes

- Template management UI
- Theme management UI
- Theme token editor
- Per-page CSS overrides

### Phase 3: Advanced Blocks

- Event list block (dynamic)
- Gallery block with lightbox
- Contact form block (with email sending)
- FAQ accordion block

### Phase 4: Audience Rules

- Audience rule editor
- Role-restricted page visibility
- Navigation with audience rules

### Phase 5: Assets and Media

- Asset upload
- Asset library
- Image picker integration in blocks


---

## 11. Security Considerations

### Input Validation

- Slug format validation (lowercase, alphanumeric, hyphens)
- HTML sanitization for text blocks
- CSS sanitization for custom CSS
- JSON schema validation for block content

### Authorization

- All admin routes require authentication
- Capability checks on all mutations
- Only full admins can delete published pages

### XSS Prevention

- All user content escaped on render
- CSS sanitization removes script vectors
- No raw HTML injection


---

## 12. Migration from WildApricot

### Data Migration (Future)

1. Export WildApricot pages as HTML
2. Parse HTML into block structure
3. Import as draft pages
4. Manual review and cleanup
5. Publish when ready

### URL Redirects (Future)

- Maintain old URL slugs where possible
- 301 redirects for changed slugs
- 404 page with search


---

## Appendix: File Locations

| Type | Location |
|------|----------|
| Prisma schema | `prisma/schema.prisma` |
| Block types | `src/lib/publishing/blocks.ts` |
| Theme system | `src/lib/publishing/theme.ts` |
| Audience rules | `src/lib/publishing/audience.ts` |
| Permissions | `src/lib/publishing/permissions.ts` |
| Pages API | `src/app/api/admin/content/pages/` |
| Templates API | `src/app/api/admin/content/templates/` |
| Themes API | `src/app/api/admin/content/themes/` |
| Admin UI | `src/app/admin/content/` |
| Public pages | `src/app/[slug]/` |
