ELIGIBILITY WAVE 2025-12-15

Primary reference PR: #78 (db(schema): add event eligibility models)

Rules:
- Each worker uses their own branch and PR
- No PR mixes schema + logic + admin UX
- If unsure, STOP and ask Ed
- No schema edits unless explicitly assigned (Worker 1/2/3: NO schema edits)

Worker 1 (Logic + Unit Tests)
- Branch: feat/eligibility-logic-v1
- Goal: implement eligibility evaluation service (pure logic)
- Inputs: Member, Event, TicketType
- Output: eligibility decision + reason codes
- Tests: unit tests only, no admin UI, no Playwright

Worker 2 (API Layer + Contract Tests)
- Branch: chore/api-eligibility-v1
- Goal: add read-only endpoints using the service
  - GET /api/v1/events/:id/eligibility
  - GET /api/v1/tickets/:id/eligibility
- Tests: contract tests only (API), no admin UI

Worker 3 (Admin UX - READ ONLY)
- Branch: feat/admin-ticket-eligibility-visibility-v1
- Target: Admin Ticket Types page ONLY
- Goal: show eligibility status + reason codes per ticket type (read-only)
- Data source: GET /api/v1/tickets/:id/eligibility
- Feature flag allowed (recommended)
