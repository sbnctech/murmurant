# ClubOS Phase 2 – Event Submission & Approval Specification (Draft)

## Purpose
Replace Jotform-based event submission with a native ClubOS workflow
that is policy-aware, auditable, and integrated into officer dashboards.

---

## Submission Entry Point
- Role: Member, Committee Chair
- Method: ClubOS Web UI
- Authentication: Required

---

## Event Submission Sections

### 1. Event Basics
- Event title
- Event type (committee / social / special)
- Hosting committee
- Proposed date(s)
- Location (home / venue / virtual)

### 2. Event Description
- Short description (public)
- Long description (internal)
- Accessibility notes (optional)

### 3. Budget & Financials
- Estimated cost
- Cost breakdown (optional line items)
- Revenue expected (if any)
- Requires Treasurer visibility

### 4. Policy Acknowledgements (Required)
- Code of Conduct
- Event Waiver & Media Release
- Social Media Policy
- Policies & Procedures (events section)
- Acknowledgement version recorded

### 5. Attachments
- Flyers
- Venue contracts
- Menus
- Insurance documents (if applicable)

---

## Validation Rules
- Required fields enforced before submit
- Budget required if cost > $0
- Home events require guest policy acknowledgement

---

## Approval Workflow

### Severity Levels
- Low: Auto-logged
- Medium: VP Activities approval required
- High: VP Activities + Board visibility

### Routing
- VP Activities: required approval
- Treasurer: financial review if budget present
- Board: read-only visibility

---

## Audit & Logging
- All submissions logged
- Approval actions timestamped
- Policy versions recorded per submission

---

## Dashboards
- VP Activities: queue + approval actions
- Treasurer: budget review list
- Board: read-only event pipeline

---

## Open Questions
- Per-event vs annual policy acknowledgement?
- Threshold for Board escalation?
- Budget approval limits?
