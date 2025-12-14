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


## Sunday, 2025-12-14 ~09:30 PT - Worker Docs Sprint (Status Update)

A Sunday morning "worker" sprint produced multiple docs-only pull requests to keep governance, safety, and operating conventions ahead of implementation.

Merged:
- PR #60: docs(widgets): embed safety and RBAC guardrails.
  - Notable: Vercel deploy check failed; merges are not gated by required checks under current repo plan settings, so this is treated as advisory for now.

Opened/Updated:
- PR #62: docs(widgets): assess events widget fit to ClubOS model (Worker 1).
- PR #65: docs(architecture): open source adoption policy (Worker 5).

Queued docs PRs observed in the open set:
- PR #66: docs(gadgets): admin gadgets catalog (Worker 3).
- PR #67: docs(governance): implementation authorization checklist (Worker 2).
- PR #68: docs(chatbot): chatbot plugin spec (Worker 4).
- PR #61: docs(training): JIT training system spec (Worker 4).

Operational note:
- Treat deployment preview failures as non-blocking for docs-only changes, but track and resolve them before relying on preview deploys for user-facing work.

## Sunday Morning 2025-12-14 (Merge Wave 2: Contracts First)
Merged:
- PR #34: embedded widgets security model.
- PR #36: RBAC admin widgets security model.
- PR #45: embed widget SDK contract (v1) + finance approval queue widget contract.
- PR #53: embed widget SDK v1 (iframe-first) + public embed README stub.
- PR #39: activities delegated admin model + deny-path tests + activities chatbot support playbook.

Closed:
- PR #40 closed as superseded by #39 (same playbook path) to avoid conflicting documentation.

Result:
- The project now has written security models and first-class contracts for embedding and admin widget behavior, plus a concrete delegated-admin blueprint for Activities.
