# ClubOS Templates

Canonical page templates for consistent UI across member and admin surfaces.

## Overview

Templates are composable page layouts that enforce consistent spacing, typography,
and structure. They consume CSS custom properties from the theme system.

## Member Templates

Templates for member-facing pages (public-facing user experience).

- **MemberShell** - Main layout wrapper with nav and footer
- **MemberHomeTemplate** - Hero + feature cards for landing pages
- **MemberContentTemplate** - Article/content pages with optional sidebar

## Admin Templates

Templates for admin/back-office pages.

- **AdminShell** - Admin layout with nav and optional sidebar
- **AdminListTemplate** - List pages with filters, table, pagination
- **AdminDetailTemplate** - Detail/edit pages with section cards

## Usage

```tsx
import { MemberShell, MemberHomeTemplate } from "@/templates";

export default function HomePage() {
  return (
    <MemberShell>
      <MemberHomeTemplate
        heroTitle="Welcome to Our Club"
        heroDescription="Join us for events and activities."
        featureCards={[
          { title: "Events", description: "See upcoming events" },
          { title: "Members", description: "Connect with members" },
        ]}
      />
    </MemberShell>
  );
}
```

## Theming

Templates use CSS custom properties (tokens) for all styling. Change the active
theme by setting `data-theme` on the root element:

```html
<html data-theme="sbnc">
```

Available themes:
- `base` - Neutral professional (default)
- `sbnc` - Santa Barbara Newcomers Club
