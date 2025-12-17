# ClubOS Non-Negotiable Architectural Charter
Copyright (c) Santa Barbara Newcomers Club

## Normative Reference Documents

The following documents are authoritative inputs to ClubOS design decisions.
They define expected operating norms, red flags, and sustainability constraints
that the system must support, surface, or enforce.

- docs/WHAT_IS_NORMAL.md
  Defines normal vs abnormal operating patterns for members, volunteers, and leaders.
  Used to guide UX affordances, guardrails, and alerting.

- docs/ORG/SBNC_Business_Model_and_Sustainability.md
  Defines the canonical business model, sustainability flywheel, and failure modes.
  Used to evaluate feature priority, governance design, and operational risk.

## Purpose
ClubOS is a club operating system designed for non-technical users and maintained primarily by chatbots. This charter defines the invariants that must hold across all code, schemas, APIs, UI workflows, and documentation.

If a change violates this charter, it must not be merged.

------------------------------------------------------------

## A. Non-Negotiable Principles

### P1. Identity and authorization must be provable
- Every privileged action must be attributable to a real authenticated identity.
- Authorization decisions must be made server-side and be explainable:
  - "Allowed because: role X has capability Y scoped to object Z."
- No "implicit admin" behavior.

Enforcement
- One canonical authorization module and policy evaluation function.
- Audit log entries required for every privileged action.

### P2. Default deny, least privilege, object scope
- Access must be denied by default.
- Permissions must be as narrow as possible.
- Authorization must be object-aware (event, committee, member, campaign), not page-based.

Never
- "If user is admin then allow everything" short-cuts.
- UI-only gating (hiding buttons is not security).

### P3. State machines over ad-hoc booleans
All workflow domains must have explicit states and transitions:
- Membership lifecycle
- Event lifecycle (draft -> published -> closed -> archived)
- Registration lifecycle (registered -> waitlisted -> cancelled -> attended)
- Publishing lifecycle (draft -> review -> published)
- Comms lifecycle (draft -> approved -> scheduled -> sent)

Never
- Accumulating boolean flags that imply state.
- Transitions triggered "silently" without visible cause.

### P4. No hidden rules
Rules must be:
- documented in plain English
- discoverable in the UI (help text, explanations)
- inspectable in the system (why a thing happened)

Never
- Behavior that can only be understood by reading code.
- Magic defaults that change outcomes silently.

### P5. Every important action must be undoable or safely reversible
Where possible:
- support undo/rollback (soft delete)
- support "preview before commit"
- provide confirmation steps for destructive actions
- maintain history for recovery

Never
- irreversible destructive operations without explicit warning and audit trail.

### P6. Human-first UI language and consistent terminology
UI and docs must be readable by personas (Alice-Alex):
- everyday language
- consistent terms
- no developer jargon in user-facing messages
- errors must include: what happened, why, and what to do next

Never
- "Forbidden", "500", stack traces, or technical exception text shown to users.

### P7. Observability is a product feature
ClubOS must be operable by non-experts under stress:
- clear status indicators
- meaningful logs
- dashboards for "what changed"
- alerts for critical failures

Never
- silent failures (especially for cron, sends, transitions).

### P8. Schema and APIs are stable contracts
The data model is the core asset. Any change must preserve:
- backward compatibility or migration plan
- stable identifiers
- meaningful history

Never
- breaking schema changes without migration + rollback plan.
- renaming concepts without updating docs, UI, and chatbot knowledge.

### P9. Security must fail closed
If security checks fail (missing secrets, auth failure, role ambiguity):
- deny action
- log the incident
- provide safe user feedback

Never
- fallback behaviors that broaden access or guess intent.

### P10. Chatbots are contributors, not authorities
Chatbots can write code, but the system must enforce truth:
- policies evaluated by code
- tests verify behavior
- schema constraints prevent invalid states
- docs match code

Never
- "the chatbot said it's safe" as justification.

------------------------------------------------------------

## B. ClubOS Must Never Do These Things (Anti-Patterns)

These are the "avoid becoming WA-like" rules.

### N1. Never base security on page visibility or navigation structure
Security must not depend on "members-only page" style gating.

### N2. Never allow coarse, rigid roles to replace capabilities
Roles may exist, but access must be capability- and scope-driven.

### N3. Never lock workflows into vendor-like rigidity
Workflows should be configurable via data (templates, committees, terms), not hard-coded "this is how it's done."

### N4. Never create "hidden admin settings" that users discover accidentally
All admin settings must be:
- in one predictable admin area
- labeled plainly
- change-tracked and reversible

### N5. Never let automation mutate data without:
- explicit authorization
- idempotency
- audit logs
- user-visible explanation

### N6. Never ship without tests for permission boundaries
Every sensitive endpoint must have:
- positive tests (allowed)
- negative tests (denied)
- regression tests for known bypass patterns

### N7. Never store or expose more PII than necessary
Minimize PII and ensure that exports/sends are gated and logged.

### N8. Never allow template fragility
Templates must be safe:
- locked sections
- preview
- variables validated
- audience safeguarded

------------------------------------------------------------

## C. Widget and Chatbot Capability Contract Map

This section maps each high-level experience to required data + permissions. Treat this as a contract: if you build the UI without these constraints, it will eventually become unsafe.

### 1) Event Widget (Member-facing)
Capabilities
- View published events
- Register/cancel (if allowed)
- See personal registration status

Required data
- Event (public fields)
- EventRegistration (per-member view)
- EventCapacity/Waitlist state

Permissions
- event:view_published
- registration:create_self
- registration:cancel_self
- Must enforce: members can only see their own registration details.

### 2) Host Mode Widget (Jack)
Capabilities
- Mobile-friendly check-in
- Waitlist ordering
- One-click exports (name tags, attendee list)

Required data
- EventRegistration with check-in status
- Waitlist position and transition history

Permissions
- event:host_checkin scoped to event
- event:view_attendees scoped to event
- event:export_attendees scoped to event
- Must log every check-in and waitlist promotion.

### 3) Membership Pipeline Widget (Ellen)
Capabilities
- View applicants, approve/deny, promote status
- Automated reminders
- Timeline of membership status changes

Required data
- Member + MembershipStatus (explicit state machine)
- MembershipTransition history
- Reminders / notifications schedule

Permissions
- membership:review_applications
- membership:change_status scoped to membership team/role
- Must require audit entries for every status transition.

### 4) Communications Composer Widget (Grace)
Capabilities
- Draft newsletter/announcement
- Use locked templates
- Preview with personalization
- Audience safeguards
- Approval/send flow

Required data
- MessageTemplate (locked + editable regions)
- MessageCampaign (draft/approved/scheduled/sent state)
- AudienceDefinition (saved segments + explainability)
- SendLog with outcomes

Permissions
- comms:draft
- comms:preview
- comms:request_approval
- comms:approve_send
- comms:send
- Must enforce two-person rule for large sends (recommended).

### 5) Publishing Widget (Pages, Templates, Navigation)
Capabilities
- Edit content safely
- Preview and rollback
- Publish with approvals
- Role-scoped editing

Required data
- Page, Theme, Template, Navigation
- PublishRevision history

Permissions
- content:edit scoped to section/committee
- content:publish
- Must preserve revision history.

### 6) Photo/Gallery Widget (Henry)
Capabilities
- Upload albums
- Tag by event
- Moderate/select featured photos
- Consistent layout

Required data
- MediaAsset, Album, Event linkage
- metadata fields (event id, upload date, caption/tags)

Permissions
- media:upload scoped to event/committee
- media:edit_metadata
- media:publish_gallery
- Must restrict deletion and maintain history.

### 7) Context-Aware Training/Orientation Chatbot (Irene + everyone)
Capabilities
- Answer "how do I..." in plain English
- Provide step-by-step guidance for the user's role
- Explain "why can't I do this"
- Provide data-backed answers where permitted
- Link users directly to the correct UI page

Required data
- Current user identity + roles + capabilities
- Object context (what page, event, member, campaign)
- Help content indexed by feature and persona
- Policy explanation hooks ("reason codes")

Permissions
- Chatbot must obey all same permission checks:
  - chat:read_context
  - chat:read_object scoped to object
- Chatbot must never reveal data the user can't see in UI.
- Chatbot must never "execute" state changes without the same confirmations and audit trails required in UI.

------------------------------------------------------------

## D. Chatbot-Authored Software Risks and Guardrails

Because ClubOS is maintained by chatbots, the system must assume:
- high velocity of changes
- risk of inconsistent patterns
- "hallucinated" implementation details
- overconfidence in security

### Risk R1: Inconsistent enforcement paths
Guardrail
- Authorization must be called in exactly one way across all routes.
- Add a lint rule or test that fails if endpoints bypass auth.

### Risk R2: Schema drift and accidental breaking changes
Guardrail
- Every schema change requires:
  - migration file
  - backward compatibility notes
  - updated docs + chatbot knowledge file
  - automated migration test

### Risk R3: Proliferation of one-off helpers ("just this time")
Guardrail
- No ad-hoc utility functions in route files.
- Shared libraries only, documented.

### Risk R4: Tests that don't reflect reality
Guardrail
- E2E tests must cover:
  - forbidden access
  - role transitions
  - major flows (registration, send, publish)
- For every privileged action, require:
  - deny tests
  - audit log assertion

### Risk R5: Security regression via "temporary bypass"
Guardrail
- All bypass mechanisms must be:
  - removed from production builds
  - forbidden by CI checks
  - behind explicit compile-time flags

### Risk R6: Documentation mismatch
Guardrail
- Docs are part of acceptance:
  - PR fails if "public behavior changed" without doc updates.
- The chatbot should be trained only on approved docs and schema, not random code comments.

------------------------------------------------------------

## E. Enforcement: How This Charter Must Be Used by Chatbots

Every chatbot working on ClubOS must:
1. Quote the relevant charter principles in its planning output.
2. Identify which principles are impacted by a change.
3. Add or update tests that enforce the principles.
4. Update the doc set when behavior changes.
5. Demonstrate permission checks and audit entries in code.

Non-negotiable acceptance criteria for merges
- Permission checks present and tested
- Audit logs present for privileged actions
- State machine transitions explicit and validated
- No hidden side effects
- Docs updated
