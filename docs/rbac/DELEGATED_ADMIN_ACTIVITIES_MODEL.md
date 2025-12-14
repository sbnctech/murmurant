# Delegated Administration Model: Activities (ClubOS)

Worker 3 -- Delegated Admin Activities Model -- Report

## Purpose
Specify delegated administration boundaries so VP of Activities can manage chairs, and chairs can manage their committees/events, without granting overly broad powers.

## Roles (conceptual)
- President: ultimate admin authority
- VP Activities: delegated admin for Activities domain
- Event Chair: manages assigned events
- Committee Lead: manages committee membership and committee-scoped content
- Tech Chair: system admin (infrastructure + security)

## Scope Objects
- committee_id
- event_id
- role_assignment_id
- effective_from / effective_to

## Authority Rules (v1)
VP Activities can:
- assign/remove Event Chair and Committee Lead roles within Activities domain
- view all events + high-level registrant metrics
- view registrant rosters for events in Activities domain
- manage categories/tags for events (if allowed)

Event Chair can:
- manage event content for events they own (details, capacity, waitlist settings)
- view registrant roster for events they own
- communicate with registrants for events they own (future)

Committee Lead can:
- manage committee membership (add/remove within allowed constraints)
- view committee-facing dashboards and communications tools (future)

Tech Chair can:
- manage system-wide RBAC definitions and emergency access procedures
- does not "own" Activities content unless explicitly granted

## Guardrails
- No one edits their own privilege grants (must be granted by superior role)
- Every assignment change is audited (who/when/what)
- Role assignments are time-bounded where practical
- Reads that expose sensitive PII are logged (at least who accessed)

## UI/Workflow Notes
- VP Activities uses an "Assignments" admin screen with allowlisted actions
- Chairs see "My Events" and "My Registrants" views only
- Committees see "My Committee" tools only

## Open Decisions
- Do we require President approval for high-risk actions (e.g., mass email, refunds)?
- Do we allow VP Activities to delegate further (sub-admins)?

## Verdict
READY FOR REVIEW
