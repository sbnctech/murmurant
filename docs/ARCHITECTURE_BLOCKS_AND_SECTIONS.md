# Murmurant UI Architecture: Blocks and Sections

Last updated: 2025-12-20

## Why this document exists

The codebase currently uses the term "stripe" for a page-level layout container. That naming has caused confusion because the intended product concept is "blocks" (content/functional units), not "stripes".

This document clarifies the intended architecture and defines a rename and deprecation plan.

## Definitions

### Block (first-class concept)

A Block is the primary authoring and product concept for Murmurant pages.

A Block:
- Represents a self-contained content or functional unit.
- Is independently renderable.
- May be role-aware (RBAC-aware) and data-backed.
- Is reusable across multiple pages.
- Is the unit of composition for future editing tools.

Examples:
- Upcoming Events
- My Registrations
- Membership Status
- VP Activities Dashboard
- Support Cases
- Policies List
- Payment Method Selector

### Section (layout-only concept)

A Section is a layout-only wrapper that groups one or more Blocks into a visually cohesive region of a page.

A Section:
- Owns layout concerns only (width constraints, padding, background, spacing).
- Does not own business logic.
- Does not own permissions decisions (permissions attach to Blocks).
- May contain 1..n Blocks.

In the current implementation, "Stripe" is effectively "Section".

## Target composition model

Page
  -> Section (layout-only)
      -> Block (1..n, first-class)

Key rule:
- Blocks never need to know whether they are inside a Section.
- Sections never contain domain logic.

## Naming policy

### Current state (legacy)

- The term "stripe" appears in:
  - Component names (e.g. Stripe.tsx, HeroStripe.tsx)
  - Folder paths (src/components/stripes)
  - Page composition code and copy

This is a legacy naming convenience and should not be treated as the product concept.

### Desired state

- Use "Section" for the layout wrapper
- Use "Block" for the content/functional unit

## Deprecation plan: Stripe -> Section

Phase 0 (now): Documentation and new code guidance
- Stop introducing new "stripe" naming in new code.
- Use "Section" in docs, PR descriptions, and UX vocabulary.

Phase 1: Introduce Section components as wrappers around existing Stripe components
- Add src/components/sections/Section.tsx and HeroSection.tsx
- Implement as light wrappers delegating to existing Stripe/HeroStripe
- Export both names temporarily; add comments marking Stripe as deprecated

Phase 2: Migrate imports and usages
- Update pages to import Section/HeroSection instead of Stripe/HeroStripe
- Update folder references in code to sections/
- Keep stripes/ for compatibility during the migration

Phase 3: Remove Stripe
- Delete stripes/ components and any remaining "Stripe" naming
- Ensure all docs and tests refer to Sections and Blocks

## Editorial tooling alignment

Future page editing should operate on Blocks:
- Add/remove/reorder Blocks
- Configure Block properties
- Apply audience/role gating at the Block level
- Preview role-based experiences via View-As

Sections remain layout scaffolding:
- Choose background / spacing presets
- Choose grid layout
- Group Blocks visually

