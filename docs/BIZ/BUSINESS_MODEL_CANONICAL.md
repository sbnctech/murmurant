# ClubOS Business Model - Canonical Overview

One-page reference for ClubOS value proposition, customer journey, and
commercialization approach.

---

## Value Proposition

ClubOS offers **migration-first, safety-first adoption** for organizations
moving from Wild Apricot (or similar platforms) to a modern, self-hostable
club management system.

Core promises to operators:

- **Migration safety**: Staged approach with verification at each step
- **Operator confidence**: Runbooks, deterministic tooling, clear abort criteria
- **Rollback capability**: Never burn bridges; always reversible until cutover
- **Transparency**: No hidden rules, no black-box behavior

---

## Customer Journey: Staged Migration

The "wing-walking" approach ensures organizations never let go of one handhold
before firmly grasping the next:

| Stage | Description |
|-------|-------------|
| 1. Observe/Export | Extract data from Wild Apricot via CSV exports |
| 2. Import | Load data into ClubOS using migration tooling |
| 3. Verify | Run verification scripts; operator spot-checks |
| 4. Shadow | Run ClubOS in parallel; compare behavior |
| 5. Decide | Organization makes go/no-go decision |
| 6. Cutover | Switch production traffic; decommission WA |

Each stage has entry/exit criteria. Operators control the pace.
See [MIGRATION_PHILOSOPHY.md](./MIGRATION_PHILOSOPHY.md) for details.

---

## Commercialization Stance

### Platform vs Policy Separation

ClubOS is a **platform** that supports multiple organizations with
different policies. SBNC (Santa Barbara Newcomers Club) is "Tenant Zero":

- SBNC provides seed data, templates, and real-world validation
- SBNC policies are **never required** for other tenants
- Other organizations bring their own policies
- Platform behavior is policy-driven, not hardcoded

This separation is mandatory for commercialization. See Epic #232.

### Tenant Zero Model

- SBNC is the first customer and primary test bed
- Lessons learned inform platform design
- But: no SBNC-specific logic in platform code
- Policy isolation enables multi-tenant deployment

---

## What Must Be True for v1 Success

1. **Verification tooling works**: ID mappings, count checks, spot-check scripts
2. **Rollback is always possible**: Until cutover, WA remains authoritative
3. **Determinism**: Same input produces same output; bundles are reproducible
4. **Runbooks exist**: Operators have step-by-step guides for every phase
5. **Abort criteria are clear**: Operators know when to stop and investigate

---

## References

- Epic #248 - Business Model
- Epic #232 - Policy Isolation
- Epic #202 - WA Migration
- Recent migration tooling work: PRs #290-#297

---

Last updated: 2025-12-24
