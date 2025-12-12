# ClubOS Project History & Story

This document is the authoritative narrative of how ClubOS evolved,
why architectural decisions were made, and how work is coordinated.

It is intentionally human-readable and decision-focused.

---

## Phase 1: Foundations
Goal:
- Establish a clean, testable API foundation
- Replace mock-backed routes with real Prisma-backed behavior
- Enforce contracts through tests, not assumptions

Outcome:
- All admin and core API endpoints stabilized
- Strong pagination, export, and search semantics
- Test suite validated as contract enforcement layer

---

## Phase 2: RBAC & Governance (Day 3)

### Problem Being Solved
Wild Apricot-style permission models are opaque and brittle.
ClubOS requires:
- Explicit authority
- Clear accountability
- No “magic” permissions

### Key Decisions
- RBAC defines *who you are*
- Data relationships define *what you can touch*
- UI never enforces security
- API is the single enforcement layer

### Roles Defined
- ADMIN
- VP_ACTIVITIES (two peers, shared authority)
- EVENT_CHAIR (scoped to owned events)

### Activities Governance Model
- Each Event has exactly one Event Chair
- Each Event Chair reports to exactly one VP Activities
- Both VP Activities can:
  - See all events
  - Modify any event
  - Override Event Chair changes
- Mutual trust is explicit and intentional

### Why This Matters
This model:
- Enables delegation without fragmentation
- Allows backup coverage without escalation
- Avoids combinatorial permission complexity

---

## Execution Model
Work is dispatched via:
- Explicit worker prompts
- Parallel execution
- Central synthesis document
- Director (human) approval

AI workers are treated as paid team members:
- They receive clear tasks
- They do not guess intent
- They are reviewed and synthesized centrally

---

## Status at End of Day 3
- RBAC foundation complete
- Activities governance locked
- Tests passing
- Docs aligned with behavior
- Safe to extend without rework

Next focus:
- Guardrails
- Developer ergonomics
- Forward-looking polish

