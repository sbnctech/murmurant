# Home Page Stripes Demo

Modern home page implementation with stripes layout and role-aware rendering.

Copyright (c) Santa Barbara Newcomers Club

---

## Overview

This demo showcases Murmurant's flexible page model:

- **Public home page** (`/`): Marketing-forward with hero, events, gift certificates
- **Member home page** (`/my`): Two-column utility/curated layout
- **Role-aware gadgets**: Different content based on viewer role
- **View-as control**: Demo tool for simulating different user contexts

---

## Demo Walkthrough (5-7 minutes)

### Part 1: Public Home Page (2 min)

1. Navigate to `http://localhost:3000/`

2. Observe the marketing-forward layout:
   - Hero section with "Join SBNC" CTA
   - Gift Certificate banner (visible above the fold)
   - Upcoming Events section
   - Photo highlights
   - About/Join CTA

3. Click "Gift Certificate" to see the placeholder page at `/gift`

4. Note: The "View as" control appears in the header (top-right)

### Part 2: Member Home Page (2 min)

1. Click "Member Portal" or navigate to `http://localhost:3000/my`

2. If viewing as "Public", you'll see a "Members Only" message
   - Use the "View as" control to switch to "Member" view

3. Observe the two-column layout:
   - **Left column** (utility):
     - My Next Things (upcoming activities)
     - Membership status
   - **Right column** (curated):
     - Recent Photos
     - Club News
     - My Committees

4. Note: Regular members do NOT see officer gadgets

### Part 3: Role-Aware Rendering (2 min)

1. Use the "View as" control (top-right) to switch between roles:

   | Role | What appears |
   |------|--------------|
   | Public | "Members Only" message |
   | Member | Basic member content |
   | Event Chair | + My Events gadget |
   | VP Membership | + VP Membership gadget with pending count |
   | President | + Governance Summary gadget |
   | Tech Lead | + System Status gadget |

2. Watch the left column update as you switch roles

3. The yellow banner indicates when viewing as a simulated role

### Part 4: Breaking Out of Rigidity (1 min)

Compare to legacy system limitations:

| Legacy System | Murmurant |
|---------------|--------|
| Separate admin/member sites | Single site, role-aware rendering |
| Rigid page templates | Composable stripes |
| No role customization | Gadgets appear based on role |
| One-size-fits-all | Personalized experience |

---

## Key URLs

| URL | Description |
|-----|-------------|
| `http://localhost:3000/` | Public home page |
| `http://localhost:3000/my` | Member home page (My SBNC) |
| `http://localhost:3000/gift` | Gift certificate page |

---

## Why This Matters

### For Members

- See what matters to THEM, not generic content
- Officers see their tools without navigating to admin
- Dense utility vs curated social balance

### For Tech Lead / Webmaster

The "View as" control reduces cognitive load:

- Test how pages look for different roles
- Debug member support issues without logging in as them
- Demonstrate role-specific features to board

### For Board / Decision Makers

This demonstrates Murmurant can:

- Deliver personalized experiences
- Unify admin and member portals
- Support extensible role-based content
- Break free from rigid template constraints

---

## Technical Details

### Stripes System

Pages are composed of horizontal "stripes":

- `Stripe` - Base full-width section
- `HeroStripe` - Marketing hero with title, description, CTAs
- `ContentStripe` - Content section with optional title
- `TwoColumnStripe` - Two-column responsive layout

Usage:
```tsx
<HeroStripe
  title="Making Connections"
  description="Join SBNC..."
  background="primary"
  actions={<Link href="/join">Join</Link>}
/>
```

### View-As System

Controlled by cookie (`murmurant_view_as`):

- Server reads via `getViewContext()` in server components
- Client reads via `useViewAs()` hook
- Simulated views show yellow banner
- Reset returns to actual user context

Enable in development automatically; in production set `DEMO_VIEW_AS=1`.

### Role-Aware Gadgets

Components check viewer context and render accordingly:

```tsx
// In MySBNCContent.tsx
{showOfficerGadgets && <OfficerGadgetSelector role={effectiveRole} />}
```

---

## Files Changed

### New Components

- `src/components/stripes/` - Stripe layout components
- `src/components/home/` - Home page gadgets
- `src/components/view-as/` - View-as control and context

### New Pages

- `src/app/page.tsx` - Public home page (replaced placeholder)
- `src/app/my/page.tsx` - Member home page
- `src/app/gift/page.tsx` - Gift certificate placeholder

### New Utilities

- `src/lib/view-context.ts` - View context types and helpers

### Tests

- `tests/unit/home/view-context.spec.ts` - View context tests

---

## Running the Demo

```bash
# Start development server
npm run dev

# Open public home
open http://localhost:3000/

# Open member home
open http://localhost:3000/my

# Run tests
npx vitest run tests/unit/home/
```

---

## What's NOT Implemented (Demo Scope)

- Real data from database (uses demo fixtures)
- Actual authentication flow (view-as is simulation only)
- Photo upload/management
- News/announcement CMS
- Committee management
- Gift certificate purchasing

These are future features; this demo establishes the flexible page model.
