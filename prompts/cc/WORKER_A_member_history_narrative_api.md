WORKER A: Member Narrative Builder + API (server-side, test-first)

Implement a new feature in Murmurant: generate a prose-style personal history for each member, intended for the President (and Membership VP). Not public-facing and not member-facing.

Hard requirements:
- ASCII only in all code/comments/docs.
- No meta commentary or "AI tells" in docs/code.
- Deterministic output ordering (stable prose).
- Must include BOTH: participation as attendee and service as volunteer/leader.
- A member may hold multiple roles simultaneously (especially around events). Do not assume one role at a time.

Data assumptions:
- Prisma stores DateTime in UTC.
- Display/policy timezone is America/Los_Angeles. Use existing timezone helpers in src/lib/timezone.ts.

Implement:

1) Library module:
- Create: src/lib/memberHistory/memberNarrative.ts
- Export: buildMemberNarrative(input) -> { summaryText, stats, timeline }

Input includes:
- member basic fields
- memberships (join/renewal/lapse if present)
- registrations (event registrations)
- service records (board/chair/committee/event host, etc.)

Output:
- summaryText: prose paragraphs
- stats: counts (events attended, volunteer roles, leadership roles, years active)
- timeline: structured list of dated items used to build prose (for audit/debug)

Narrative rules:
- No subjective scoring or adjectives. Facts + counts only.
- Chronological structure: joined/tenure -> attendance -> service roles -> leadership roles -> notes (if any).
- Event host role ends the day after the event.
- Include event name and committee name when describing event host service.
- Committee name may be derived from event.category or other available field; if unknown, omit rather than guess.
- For attendance counts: count CONFIRMED registrations as attended by default; document this rule in code.

2) Unit tests:
- Add: tests/unit/memberHistory/memberNarrative.spec.ts
- Fixtures must cover:
  - Member with attendance only
  - Member with committee membership and chair role
  - Member with multiple overlapping roles + event host
  - Member with waitlisted vs confirmed registrations
- Ensure stable string outputs (snapshot or exact string assertions).

3) API endpoint (admin-only):
- Add: GET /api/admin/members/[id]/history
- Response JSON: { memberId, generatedAt, summaryText, stats, timeline }
- Enforce auth/permission checks (President + Membership VP + Board read-only).
- Webmaster must be restricted by default (403). Do NOT assume webmaster == full admin.

4) API contract tests:
- Add: tests/api/api-member-history.spec.ts
- Validate:
  - 200 for allowed roles
  - 403 for webmaster
  - 401 without auth token
  - Response shape and summaryText non-empty for seeded member (or create test data within test if seed IDs are non-deterministic).

Commands to run before finishing:
- npm run typecheck
- npm run lint
- npm run test:unit
- npm run test-api:stable (or npm run test-api)

Deliverables:
- Code + tests green.
- Update SYSTEM_SPEC.md and ARCHITECTURE.md with a short section describing: member history narrative feature, permissions, endpoints.

Do not implement UI in this worker task.
