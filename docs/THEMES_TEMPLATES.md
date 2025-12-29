# Murmurant Themes and Templates

This document describes the theming and templating system for Murmurant.

## Overview

Murmurant uses a CSS custom property (CSS variable) based theming system that allows
complete visual customization without changing component code. Templates provide
consistent page layouts for both member and admin surfaces.

## Design Intent

The SBNC theme is derived from sbnewcomers.org which uses a "Cherry Blossom" theme
from Wild Apricot CMS. The theme features:

- Warm coral/pink primary color (#e85a4f) inspired by cherry blossoms
- Soft, welcoming neutrals with warm undertones
- Larger font sizes for accessibility (older demographic)
- Generous spacing for breathing room
- High contrast for readability

The goal is "recognizably aligned, modernized" - not a pixel-perfect clone.

## Directory Structure

```
src/
  styles/
    tokens/
      tokens.css        # Token variable names (--token-* maps to --theme-*)
    themes/
      index.css         # Imports all themes
      base.css          # Neutral professional theme (default)
      sbnc.css          # Santa Barbara Newcomers Club theme
      README.md         # Theme documentation
  templates/
    index.ts            # Template exports
    README.md           # Template documentation
    member/
      index.ts          # Member template exports
      MemberShell.tsx   # Main member layout shell
      MemberHomeTemplate.tsx    # Hero + feature cards
      MemberContentTemplate.tsx # Article/content pages
    admin/
      index.ts          # Admin template exports
      AdminShell.tsx    # Main admin layout shell
      AdminListTemplate.tsx   # List/table pages
      AdminDetailTemplate.tsx # Detail/edit pages
  components/
    layout/
      index.ts          # Layout component exports
      PageHeader.tsx    # Token-based page header
      SectionCard.tsx   # Token-based card component
      DataTableFrame.tsx # Token-based table container
      FormRow.tsx       # Token-based form row
theme-packs/
  sbnc-pack/
    MANIFEST.json       # Pack metadata and file list
    themes/             # Theme CSS files
    templates/          # Template components
scripts/
  theme-pack-export.ts  # Export pack as zip
  theme-pack-install.ts # Install pack from zip
```

## Token System

### Token Categories

Tokens are organized into categories:

| Category | Examples | Purpose |
|----------|----------|---------|
| color | primary, secondary, accent, text, border | All color values |
| font | sans, serif, mono | Font families |
| text | xs, sm, base, lg, xl, 2xl, 3xl | Font sizes |
| leading | tight, normal, relaxed | Line heights |
| weight | normal, medium, semibold, bold | Font weights |
| space | xs, sm, md, lg, xl, 2xl | Spacing values |
| radius | sm, md, lg, full | Border radii |
| shadow | sm, md, lg | Box shadows |
| layout | page-max-width, nav-height, etc. | Layout dimensions |
| control | button-height, input-height | Control sizes |

### Using Tokens in Components

```tsx
const buttonStyle = {
  backgroundColor: "var(--token-color-primary)",
  color: "var(--token-color-primary-text)",
  padding: "var(--token-space-sm) var(--token-space-md)",
  borderRadius: "var(--token-radius-md)",
  fontSize: "var(--token-text-base)",
  fontWeight: "var(--token-weight-medium)",
  height: "var(--token-control-button-height)",
};
```

## Available Themes

### base

Neutral professional theme with blue-gray palette. This is the default fallback.

Key colors:
- Primary: #2563eb (blue)
- Secondary: #64748b (slate)
- Background: #f8fafc

### sbnc

Santa Barbara Newcomers Club theme with cherry blossom palette.

Key colors:
- Primary: #e85a4f (warm coral)
- Secondary: #8b7355 (warm brown)
- Background: #faf8f6 (warm off-white)

## Switching Themes

### In Production

Set `data-theme` attribute on the html or body element:

```html
<html data-theme="sbnc">
```

### In Development

Add `?theme=<themename>` to the URL:

```
http://localhost:3000/member?theme=sbnc
http://localhost:3000/admin?theme=base
```

### Theme Preview Page

Visit `/dev/theme-preview` to see all tokens and components with theme switching.

## Templates

### Member Templates

**MemberShell** - Main layout wrapper

```tsx
import { MemberShell } from "@/templates";

export default function MemberPage() {
  return (
    <MemberShell brandName="My Club">
      {/* Page content */}
    </MemberShell>
  );
}
```

**MemberHomeTemplate** - Landing page with hero and feature cards

```tsx
<MemberHomeTemplate
  heroTitle="Welcome to Our Club"
  heroDescription="Join us for events and activities."
  heroActions={<button>Join Now</button>}
  featureCards={[
    { title: "Events", description: "Upcoming activities" },
    { title: "Members", description: "Connect with others" },
  ]}
/>
```

**MemberContentTemplate** - Article/content pages

```tsx
<MemberContentTemplate
  title="Club Policies"
  subtitle="Last updated January 2024"
  sidebar={<TableOfContents />}
>
  <p>Content here...</p>
</MemberContentTemplate>
```

### Admin Templates

**AdminShell** - Admin layout wrapper

```tsx
import { AdminShell } from "@/templates";

export default function AdminPage() {
  return (
    <AdminShell>
      {/* Page content */}
    </AdminShell>
  );
}
```

**AdminListTemplate** - List pages with tables

```tsx
<AdminListTemplate
  title="Members"
  subtitle="All registered members"
  headerActions={<button>Add Member</button>}
  filters={<select>...</select>}
  pagination={<Pagination />}
>
  <MembersTable />
</AdminListTemplate>
```

**AdminDetailTemplate** - Detail/edit pages

```tsx
<AdminDetailTemplate
  title="John Smith"
  subtitle="Active Member"
  headerActions={<button>Edit</button>}
  sections={[
    { title: "Contact Info", content: <ContactSection /> },
    { title: "Membership", content: <MembershipSection /> },
  ]}
/>
```

## Creating a New Theme

1. Copy `src/styles/themes/base.css` to `src/styles/themes/yourtheme.css`

2. Update the selector:
   ```css
   [data-theme="yourtheme"] {
     /* ... */
   }
   ```

3. Modify the `--theme-*` variable values

4. Add import to `src/styles/themes/index.css`:
   ```css
   @import './yourtheme.css';
   ```

## Theme Pack Export/Import

### Exporting a Pack

```bash
npx tsx scripts/theme-pack-export.ts sbnc
```

Creates `theme-packs/sbnc-pack.zip`

### Installing a Pack

1. Copy the zip file to the target repo's `theme-packs/` directory

2. Run:
   ```bash
   npx tsx scripts/theme-pack-install.ts sbnc
   ```

3. The script will:
   - Extract the zip if needed
   - Copy files to their destinations
   - Update theme index imports

### MANIFEST.json Format

```json
{
  "name": "sbnc",
  "version": "1.0.0",
  "description": "Theme description",
  "files": [
    {
      "source": "themes/sbnc.css",
      "destination": "src/styles/themes/sbnc.css",
      "type": "theme"
    }
  ],
  "themeId": "sbnc",
  "apply": {
    "steps": ["Copy theme CSS...", "Update imports..."],
    "postInstall": "Ensure globals.css imports the theme system"
  }
}
```

## Layout Components

### PageHeader

```tsx
<PageHeader
  title="Page Title"
  subtitle="Optional subtitle"
  actions={<button>Action</button>}
  breadcrumb={<Breadcrumb />}
/>
```

### SectionCard

```tsx
<SectionCard
  title="Section Title"
  subtitle="Optional subtitle"
  variant="elevated"  // default, outlined, elevated
  padding="md"        // none, sm, md, lg
>
  {/* Content */}
</SectionCard>
```

### DataTableFrame

```tsx
<DataTableFrame
  filters={<FilterControls />}
  pagination={<Pagination />}
  loading={isLoading}
  emptyState={<EmptyMessage />}
>
  <table>...</table>
</DataTableFrame>
```

### FormRow

```tsx
<FormRow
  label="Email Address"
  htmlFor="email"
  helpText="We will never share your email."
  error={errors.email}
  required
>
  <input type="email" id="email" />
</FormRow>
```

## Accessibility

The theme system supports accessibility through:

- High contrast color combinations
- Larger font sizes in SBNC theme for older demographics
- Minimum 44px touch targets for interactive elements
- Focus states using `--token-color-border-focus`
- Semantic color tokens for danger, success, warning states

## Tailwind Integration

Theme tokens are mapped to Tailwind's theme system in `globals.css`:

```css
@theme inline {
  --color-primary: var(--token-color-primary);
  --color-secondary: var(--token-color-secondary);
  /* ... */
}
```

This allows using Tailwind classes like `bg-primary` that will use theme tokens.
