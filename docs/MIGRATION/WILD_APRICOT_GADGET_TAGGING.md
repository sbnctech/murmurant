# Wild Apricot Gadget and Widget Migration Tagging

This document classifies WA gadgets and widgets by migration strategy.

## Auto-migrate
Structured, data-backed features that map directly to ClubOS models.

Examples:
- Event lists and calendars
- Event registration and waitlists
- Member directory and profiles
- Login/logout
- Payments

## Manual rebuild
Presentation-only constructs that require re-creation using ClubOS primitives.

Examples:
- Content gadgets
- Layout gadgets
- Image grids
- Custom page designs

## Unsupported (initially)
Features that introduce security or maintenance risk.

Examples:
- Arbitrary HTML
- Inline scripts
- Custom payment embeds
