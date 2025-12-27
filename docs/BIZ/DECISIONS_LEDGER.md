# Decisions Ledger

A dated log of key business and product decisions for ClubOS.

---

## Decision Log

| Date | Decision | Status | Rationale | Links |
|------|----------|--------|-----------|-------|
| 2025-12-24 | No continuous sync for v1 | Final | Creates dual source of truth; data integrity risk; debugging complexity | Epic #202 |
| 2025-12-24 | Policy capture may require manual operator mapping | Accepted | WA API does not reliably expose membership levels; manual input is acceptable workaround | Epic #202, docs/IMPORTING/WA_POLICY_CAPTURE.md |
| 2025-12-24 | Presentation layer migration deferred | Final | HTML scraping is fragile; content structure varies; scope boundary for v1 | Epic #202 |
| 2025-12-24 | Tenant Zero is allowed but never required | Final | SBNC informs design but platform must work for any organization; policy isolation is mandatory | Epic #232 |
| 2025-12-24 | Verification and rollback are product requirements | Final | Operator trust requires transparency; migration must be reversible until cutover | Epic #202, Epic #248 |
| 2025-12-24 | Bi-directional sync excluded for v1 | Final | Conflict resolution complexity; authority confusion; massively increased testing surface | Epic #202 |
| 2025-12-24 | DRY RUN before LIVE RUN is mandatory | Final | Operators must validate before committing; safety-first adoption | Epic #202, docs/IMPORTING/PRODUCTION_MIGRATION_RUNBOOK.md |

---

## How to Add Decisions

When a significant product or business decision is made:

1. Add a row to the table above
2. Use format: YYYY-MM-DD date
3. Status options: Proposed, Accepted, Final, Superseded
4. Include brief rationale (one sentence)
5. Link to relevant epics, PRs, or docs

Decisions marked "Final" should only be changed via a new decision
that explicitly supersedes the old one.

---

## Decision Categories

Decisions generally fall into these categories:

- **Scope boundaries**: What we do and do not build
- **Technical approach**: How we solve specific problems
- **Operator model**: How operators interact with the system
- **Commercialization**: How the product goes to market

---

## References

- Epic #248 - Business Model
- Epic #232 - Policy Isolation
- Epic #202 - WA Migration

---

Last updated: 2025-12-24
