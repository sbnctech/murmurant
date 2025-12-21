# Page Editor Vision (One Page)

## Purpose

Create a minimal, safe, non-magical editor that lets non-technical volunteers publish new ClubOS-native pages without engineering help.

This is not a site builder. It is a disciplined publishing tool.

## v1 Scope

- New pages only
- Explicit content blocks
- Explicit metadata (opt-in)
- Accurate preview that matches production

Out of scope:
- Legacy pages
- Auto navigation
- Inferred hierarchy
- SEO automation
- Templates beyond "blank"

## Core Principles

1. Explicit over implicit
2. Preview is truth
3. Stored data explains the output
4. Fail safely, never guess
5. Boring is good

If a feature cannot be explained in one sentence to a volunteer, it does not belong in v1.

## What A Page Is

A page is:
- an ID/slug
- a title
- a list of blocks
- optional features (opt-in flags) with explicit configuration

No hidden meaning. No inference.

## Breadcrumbs

Breadcrumbs exist only as presentation, and only when explicitly enabled per page.
They never define hierarchy and never affect routing.

Defaults:
- OFF
- Invisible

## Crawl / IP Protection

Editor and admin surfaces must not be indexable and must require auth.

Member/internal pages must default to non-indexable unless explicitly enabled.

This reduces accidental exposure and limits crawler-driven discovery.

## Definition of Done (v1)

- Volunteer can create and publish a new page end-to-end.
- Preview output matches production output.
- No new page appears in navigation unless explicitly wired.
- Legacy pages remain untouched.
- Every invariant is captured in EDITOR_RULES.md and validated by EDITOR_ACCEPTANCE_TESTS.md.

