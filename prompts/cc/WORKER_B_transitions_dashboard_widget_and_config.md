You are Worker B in the Murmurant repo.

Goal: Finalize the Term Transition dashboard widget behavior and make it configurable and test-protected.

Assumptions (implement without asking):
- Widget appears for President and Past President.
- Default lead time is 60 days before term end, but it must be configurable (config value).
- Term boundaries are Feb 1 and Aug 1 at 00:00 America/Los_Angeles.
- Use src/lib/timezone.ts helpers; no direct local-time formatting.

Tasks:
1) Config
   - Ensure there is a config setting for lead days (default 60).
   - Validate and document the config key in SYSTEM_SPEC.md and/or ARCHITECTURE.md.

2) Widget logic
   - Widget should appear when: now is within leadDays of the current term end.
   - Widget should not appear outside that window.
   - Widget should tolerate DST boundaries correctly.

3) API contract
   - Ensure the widget API (if used) returns:
     - visible: boolean
     - currentTermStart, currentTermEnd (ISO)
     - nextTransitionDate (Feb 1 or Aug 1) (ISO)
     - leadDays
   - Ensure authorization matches policy:
     - president: 200
     - past-president: 200 (view-only)
     - vp-activities: allowed if already in approval flow
     - webmaster: 403

4) Tests
   - Unit tests: cover term window math and DST edge.
   - Admin E2E: president sees widget when in window; does not see it when out of window (use time mocking if available in test harness).
   - API tests: role-based access and response shape.

5) Gates
   - Run npm run green and keep everything green.

Deliverables:
- PR-ready commit(s) on current branch.
- Short summary + how to verify (exact commands).
