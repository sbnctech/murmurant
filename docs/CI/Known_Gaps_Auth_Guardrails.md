# Known Gaps: Auth Guardrails

Generated: 2025-12-24

These are **existing** known gaps tolerated by the guardrail (fail on NEW violations).
Goal: burn down to **0**, then switch guardrails to strict PR-blocking mode.

---

## Source of truth

`scripts/ci/check-auth-guardrails.ts`

---

## KNOWN_GAPS (verbatim)

```ts
KNOWN_GAPS: Set<string> = new Set([
  // users:manage endpoints - documented in docs/CI/INVARIANTS.md
  "v1/admin/users/[id]/passkeys/route.ts:48",
  "v1/admin/users/[id]/passkeys/route.ts:98",
  "v1/admin/service-history/route.ts:86",
  "v1/admin/service-history/[id]/close/route.ts:21",
  "v1/admin/transitions/route.ts:72",
  "v1/admin/transitions/[id]/detect-outgoing/route.ts:21",
  "v1/admin/transitions/[id]/cancel/route.ts:21",
  "v1/admin/transitions/[id]/apply/route.ts:24",
  "v1/admin/transitions/[id]/assignments/[aid]/route.ts:18",
  "v1/admin/transitions/[id]/assignments/route.ts:32",
  "v1/admin/transitions/[id]/submit/route.ts:21",
  "v1/admin/transitions/[id]/route.ts:55",
  "v1/admin/transitions/[id]/route.ts:105",
  // admin:full endpoints - read/diagnostic operations, lower priority for safety
  "v1/admin/import/status/route.ts:37",
  "v1/support/cases/route.ts:44",
  "v1/support/cases/route.ts:104",
  "v1/support/cases/[id]/notes/route.ts:42",
  "v1/support/cases/[id]/route.ts:53",
  "v1/support/cases/[id]/route.ts:160",
  "v1/support/dashboard/route.ts:49",
  "v1/officer/governance/minutes/[id]/route.ts:256",
  "v1/officer/governance/meetings/[id]/route.ts:99",
  // Demo endpoints - test/dev only
  "admin/demo/lifecycle-members/route.ts:81",
  "admin/demo/member-list/route.ts:98",
  "admin/demo/status/route.ts:21",
  "admin/demo/work-queue/route.ts:21",
  "admin/demo/scenarios/route.ts:596",
  // OpenAPI endpoint - read-only spec generation
  "openapi/route.ts:57",
])
```
