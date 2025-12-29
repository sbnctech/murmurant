# Murmurant Architecture

This file is a high-level architecture overview.

## UI composition: Blocks and Sections

Murmurant pages are composed from:
- Blocks: first-class, reusable content/functional units (role-aware, data-backed).
- Sections: layout-only wrappers that group Blocks and handle spacing/background/width.

Note: The codebase historically used the term "stripe" for Section. Stripe is being deprecated in favor of Section to avoid confusion with the product concept of Blocks. See docs/ARCHITECTURE_BLOCKS_AND_SECTIONS.md.
