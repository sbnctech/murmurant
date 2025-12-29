# Murmurant Backlog Index

Master index of all backlog files. Check this first to find where work is tracked.

## Active Backlogs

| Domain | File | Description |
|--------|------|-------------|
| Migration | [WA_IMPORT_PIPELINE_BACKLOG.md](MIGRATION/WA_IMPORT_PIPELINE_BACKLOG.md) | WA import pipeline, schema changes, cron job discovery |
| Business/Features | [BIZ/IMPLEMENTATION_BACKLOG.md](BIZ/IMPLEMENTATION_BACKLOG.md) | Discovery stage, gadgets, webhooks |
| Specs | [specs/BACKLOG.md](specs/BACKLOG.md) | Approved specs not yet implemented |
| V2 Features | [backlog/V2_TODO.md](backlog/V2_TODO.md) | Board dashboard, org health metrics |
| Page Editor | [../editor/EDITOR_BACKLOG.md](../editor/EDITOR_BACKLOG.md) | Block ordering, drag-and-drop |

## Rules

1. **New backlog items** go in the domain-specific file
2. **Cross-cutting items** go in `BIZ/IMPLEMENTATION_BACKLOG.md`
3. **Migration blockers** go in `MIGRATION/WA_IMPORT_PIPELINE_BACKLOG.md`
4. **Update this index** when creating new backlog files

## Quick Add

If unsure where something goes, add it to `BIZ/IMPLEMENTATION_BACKLOG.md` under `## Unsorted`.

## Session 2025-12-28: Phase 0/1 Deferred Items

| Item | File | Priority | Notes |
|------|------|----------|-------|
| Announcement Prisma model | specs/BACKLOG.md | Medium | Routes return 501 until model added |
| Committee routes requireCapabilitySafe | BIZ/IMPLEMENTATION_BACKLOG.md | Low | Using requireCapability instead |
| ResendEmailService campaigns | BIZ/IMPLEMENTATION_BACKLOG.md | Low | Needs DB, returns "not implemented" |
| E2E test verification | BIZ/IMPLEMENTATION_BACKLOG.md | High | Route conflict fixed, verify tests run |
| Online Renewal UI | backlog/V2_TODO.md | Medium | API exists, needs frontend |
| Event payment checkout | backlog/V2_TODO.md | Medium | Stripe ready, needs checkout flow |
| Reporting/Analytics | backlog/V2_TODO.md | Medium | Not started |
| Data Export | backlog/V2_TODO.md | Low | Not started |
