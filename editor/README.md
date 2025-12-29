# Murmurant Page Editor

## What This Is

The Murmurant Page Editor is a deliberate, minimal, non-magical system for creating
new Murmurant-native pages.

It exists to let non-technical volunteers publish pages safely, without:
- accidental navigation changes
- implicit hierarchy
- hidden behavior
- future migration risk

If something is not explicitly configured, it does not happen.

---

## Scope (v1)

IN SCOPE:
- New pages only
- Explicit content blocks
- Explicit metadata (opt-in)
- Accurate preview

OUT OF SCOPE:
- Legacy pages
- Navigation trees
- Auto menus
- SEO automation
- Templates beyond "blank"
- Page inference or hierarchy

---

## Core Design Principles

1. Explicit over implicit
2. Preview is truth
3. Pages are self-contained
4. Fail quiet, never guess
5. Boring is good

If a feature cannot be explained in one sentence to a volunteer,
it does not belong here.

---

## Breadcrumbs (v1)

- Hidden by default
- Explicit opt-in per page
- Manually defined
- Presentational only
- Never authoritative

Breadcrumbs do not affect routing, navigation, or hierarchy.

---

## Mental Model

Think:

"A disciplined CMS editor with a Notion-like feel — without Notion's magic."

Everything the page does must be visible in the editor UI or data.

---

## Success Criteria

The editor is successful if:
- A volunteer can publish without help
- Engineers do not need to fix content
- No future migration feels scary
- Nothing surprising happens

---

## Non-Goals

The editor is NOT:
- A site builder
- A marketing CMS
- A navigation engine
- A power-user layout tool

Those may come later — this is not that.
