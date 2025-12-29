Membership Application Widget + Workflow

Goal
Build a premium, modern membership application experience (public-facing) and the associated admin workflow (back office) to review, approve, and onboard applicants.

Why
The application experience is the first "moment of delight" for prospective members.
It should feel special, trustworthy, and easy.

Scope (v1)
Public UI (Application Widget)
- Multi-step application flow with clear progress indicator
- Save/resume support (magic link optional; no account required to start)
- Mobile-first, accessible, fast
- Friendly validation (inline, non-scolding) and clear privacy language
- Photo upload support (optional) using the new file storage system (if appropriate)
- Final review screen + submit confirmation + next steps

Workflow (Admin)
- Queue view: new applications, in-review, approved, declined, needs-info
- Detail view: applicant data, notes, internal comments, audit trail
- Actions: request more info, approve, decline, convert to Member record
- Email templates: receipt, request-info, approval/welcome, decline
- Governance/audit integration for decisions (who, when, what changed)

Data model (draft)
- MembershipApplication
  - id, status, submittedAt, reviewedAt
  - applicant contact info + key fields (structured)
  - rawPayload JSON for future-proofing
  - internalNotes (separate from applicant-visible)
  - createdBy, updatedBy (audit)
- Links to:
  - Files (optional supporting documents)
  - Member (once approved and converted)

Integration assumptions
- This replaces or supplements Wild Apricot membership application forms.
- May support importing applicants from WA later, but v1 can be Murmurant-native.

UX bar
- "Special" feel: clean typography, generous spacing, tasteful motion, strong confirmation states
- Reduce friction: fewer fields upfront; ask more only when needed
- Trust cues: clear privacy, secure handling, support contact, and predictable next steps

Non-goals (v1)
- Payments inside the application (can be phase 2)
- Complex conditional logic for every edge case (start simple, expand)

Open questions (later)
- Does SBNC require references, sponsor, or orientation step?
- Does application require payment before approval?
- What is the exact membership committee approval policy?

Acceptance criteria (for later implementation)
- End-to-end happy path: start -> submit -> admin review -> approve -> member created
- Robust audit log for status changes
- High-quality UI on mobile and desktop
