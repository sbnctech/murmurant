# Claude Code Task: Membership Lifecycle State Machine (No UI)

Goal
- Implement membership lifecycle transitions as a state machine in Murmurant without building any UI.
- The state machine must encode SBNC rules, be testable, and be safe to run in production.

Business rules to encode
- Contacts and members are stored as the same entity in WA; Murmurant stores one person record and derives membership behavior from status + tier.
- New joiners receive newbie_member for 90 days, then member until the 2-year mark.
- At the 2-year mark, extended_member requires offer + acceptance + payment; otherwise membership ends.
- New rule: when membership ends due to end of member tier time or end of extended member tier time, MembershipStatus becomes lapsed.

Required outputs
1) New library module
- Create src/lib/membership/lifecycle.ts (or similar) that exports:
  - computeEffectiveMembershipState(input): returns status, tier, and derived flags
  - computeNextTransition(input, now): returns next transition (if any) and reason
  - applyScheduledTransitions(now, options): applies transitions safely (dry-run supported)

2) Data model integration (minimal)
- Do not create new tables unless strictly needed.
- If needed, add the minimum fields to support transitions:
  - joinDate (if not already present or derivable)
  - tierStartAt, tierEndAt (or computed from joinDate + rules)
  - extendedOfferAt, extendedAcceptedAt, extendedPaidAt (timestamps)
- Any schema changes must include Prisma migrations and seed updates as required.

3) Test coverage
- Add unit tests covering:
  - newbie_member -> member transition at 90 days
  - member -> lapsed transition at 2-year mark when not extended
  - extended_member -> lapsed transition when extended term ends (if term exists; otherwise mark as TBD and implement policy as configurable)
  - membership status vs tier truth table behavior (active implies member privileges; lapsed implies no privileges)
  - leap year boundary tests (explicitly define chosen policy and test it)

4) Configuration
- Define a single configuration object for policy decisions:
  - twoYearDefinition: "days" (730) OR "calendar" (addYears(2))
  - newbieDays: 90
  - extendedTermDays: optional or null
  - graceDaysAfterOffer: optional
- Default values must be explicit and documented.

5) Operational safety
- Support DRY_RUN=1 mode (no writes, logs planned changes).
- Support ALLOW_PROD_RUN=1 gate to run transitions in production.
- Provide clear logging output suitable for cron.

6) Documentation
- Create docs/membership/MEMBERSHIP_LIFECYCLE_STATE_MACHINE.md describing:
  - states, transitions, and triggers
  - how to run in dry run and in production
  - how it interacts with WA import fields
  - known policy TBD items

Implementation constraints
- ASCII-only content (no smart quotes, no unicode dashes).
- Keep code legible and modular.
- Do not implement UI.
- Prefer deterministic pure functions for state computation.
- Add tests first where practical.

Acceptance criteria
- npm run typecheck passes
- npm run test:unit passes
- Running dry run produces expected transition plan logs on a representative sample set of members
- Documentation explains the policy choices (especially 2-year definition)

Notes
- WA membership level mapping exists but is not authoritative long-term; lifecycle logic should use Murmurant fields and rules.
- Membership ending must set MembershipStatus to lapsed (new rule).
