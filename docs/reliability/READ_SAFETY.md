# ClubOS — Read Safety and Consistency Guarantees

Status: Canonical Specification
Applies to: All read paths (UI, API, rendering, preview)
Last updated: 2025-12-20

This document defines when ClubOS may read and present data,
how consistency is enforced, and how ambiguity is handled.

This document is normative.

---

## 1. Core Principle

Incorrect data exposure is worse than no data.

If the system cannot determine that a read is safe:
- The data MUST NOT be returned
- The request MUST fail closed
- Prefer 404 or access denied over partial truth

---

## 2. Preconditions for Any Read

Before serving data, ClubOS MUST verify:

- Authentication state (or explicit anonymous access)
- Authorization rules for the target data
- Audience rules and visibility constraints
- Data integrity (no invariant violations)
- Context correctness (member vs public vs admin)

If any precondition fails, the read MUST be denied.

---

## 3. Consistency Requirements

Reads MUST satisfy:
- Single authoritative source of truth
- No mixing of versions across domains
- No partial object reads

Stale-but-consistent reads MAY be allowed.
Inconsistent reads are forbidden.

---

## 4. Audience and Visibility Enforcement

- Visibility rules MUST be enforced server-side
- Client-side filtering is forbidden
- Audience checks MUST precede rendering

If audience rules cannot be evaluated safely:
- The content MUST NOT render

---

## 5. Preview vs Published Reads

- Preview reads MUST be explicitly scoped
- Preview data MUST NOT leak into public paths
- Preview access MUST be auditable

Preview failures MUST NOT fall back to published data.

---

## 6. Error Handling

On read failure:
- No partial data may be returned
- Errors MUST be explicit
- Sensitive existence information MUST NOT leak

"Soft failure" rendering is forbidden.

---

## 7. Degraded Mode

If any dependency required for safe reads is unavailable:
- Reads MAY continue only if correctness is preserved
- Otherwise, return 404 or access denied
- Admin UI MUST display degraded warning

---

## 8. Caching Rules

- Caches MUST respect authorization boundaries
- Cross-audience caching is forbidden
- Cache invalidation MUST be explicit

If cache safety cannot be guaranteed, caching MUST be disabled.

---

## 9. Explicit Non-Guarantees

ClubOS does NOT guarantee:
- Real-time consistency across all views
- Graceful rendering under permission ambiguity
- Partial data availability during failures

---

## 10. Enforcement

- Any read path not conforming to this spec MUST NOT exist.
- Violations are SEV-1 incidents.
- Read safety overrides performance and UX.

This document enforces trust over convenience.
