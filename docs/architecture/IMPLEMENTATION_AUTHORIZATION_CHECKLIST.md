# Implementation Authorization Checklist (ClubOS)
## Scope: Photo Gallery + Events Calendar Widgets

Purpose
- This is a go/no-go gate for implementation.
- We move fast by preventing rework, not by skipping decisions.

Gate rule
- Implementation beyond scaffolding is NOT authorized unless every REQUIRED item is satisfied.
- If unsure, STOP and open a decision item.

1. Contract Completeness (REQUIRED)
- [ ] Photo Gallery System Spec exists and is approved
- [ ] Photo Gallery Widget Contract exists and is approved
- [ ] Events Calendar Widget Contract exists and is approved
- [ ] Widget Data Contract Principles exists and is approved
- [ ] Each contract explicitly states:
  - Widgets are untrusted UI
  - Widgets render server-provided data only
  - Widgets dispatch intent, not decisions

2. Authority and Enforcement Clarity (REQUIRED)
- [ ] Authentication occurs only in ClubOS (never in widgets)
- [ ] Authorization decisions occur only server-side
- [ ] Privacy enforcement occurs only server-side
- [ ] Storage providers are untrusted
- [ ] ViewerContext is defined as:
  - server-issued
  - opaque to widgets
  - not modifiable client-side

3. Privacy and Member Lifecycle Rules (REQUIRED)
- [ ] Photo metadata schema approved
- [ ] Member privacy preferences defined and enforced at read time
- [ ] Lapsed members retain historical labels (no deletion)
- [ ] Face labeling opt-out is enforced at read time
- [ ] Label changes are audited (who, when, before/after)
- [ ] Widgets cannot override privacy preferences

4. API Surface Discipline (REQUIRED)
- [ ] Widget APIs are read-only unless explicitly authorized
- [ ] No raw query or SQL-like parameters exposed to widgets
- [ ] All endpoints validate ViewerContext
- [ ] All endpoints return pre-filtered data
- [ ] Error behavior defined (401/403/404) and consistent

5. Storage Provider Abstraction (REQUIRED)
- [ ] PhotoStorageProvider interface exists
- [ ] Initial provider uses local storage (mail server)
- [ ] Widgets do not depend on provider semantics
- [ ] URLs are treated as opaque artifacts
- [ ] Future providers (SmugMug/external) require no widget changes

6. Scope Lock (REQUIRED)
- [ ] No work beyond:
  - interface stubs
  - type definitions
  - NotImplemented handlers
  - docs and tests for contracts/guards
- [ ] No UX polish or layout tuning
- [ ] No caching strategies
- [ ] No background jobs
- [ ] No migrations that are not reversible

7. Review and Accountability (REQUIRED)
- [ ] Every PR maps to exactly one contract section
- [ ] Every PR references governing docs
- [ ] No PR mixes architecture and implementation
- [ ] Reporting Contract followed (single-screen report)
- [ ] Reviewer assigned before code begins

Authorization decision
- [ ] AUTHORIZED: proceed with Phase 1 scaffolding only
- [ ] NOT AUTHORIZED: resolve gaps and re-review
