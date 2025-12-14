Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

# Pages System Specs (v1)

This folder defines the **page runtime**, **editor model**, **widget model**, and **navigation model** for ClubOS.

These documents are intended to be the implementation contract for the first production-grade publishing system.

## Index
- PAGE_MODEL_AND_RENDERING.md
  - Page + PageVersion model, server-side rendering rules, publish pointer, and safety posture.
- PAGE_EDITOR_V1.md
  - Operator-facing editor behavior, palette rules, permissions, and safe publish workflow.
- BLOCKS_AND_WIDGETS_V1.md
  - Block model vs widget model; widget allowlist control; restricted widget handling.
- WIDGET_PERSISTENCE_MODEL.md
  - Widget instance persistence and versioning patterns; where durable data lives.
- PREVIEW_AS_ROLE_AND_VERSIONING.md
  - Preview-as-role, preview-as-version, and rollback semantics.
- NAVIGATION_MODEL_V1.md
  - Menus/navigation sets, role-aware filtering, multi-style rendering, and auditability.
- HTML_WIDGET_POLICY.md
  - Escape-hatch policy for raw HTML/JS widgets (Tech Chair only) with sandbox/CSP/capability gating.

## Implementation Notes
- Visibility is enforced **server-side** (no client-side hiding of unauthorized content).
- Publishing is explicit, auditable, and reversible (pointer rollback).
- Widget types are allowlisted and controlled by the Tech Chair; HTML widget is restricted and heavily sandboxed.
