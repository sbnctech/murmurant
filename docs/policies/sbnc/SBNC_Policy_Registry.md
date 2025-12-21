# SBNC Policy Registry (Draft)

Last updated: December 20, 2025
Owner (operational): Secretary or Parliamentarian (confirm via job descriptions)
Scope: SBNC policies and governing documents; independent of ClubOS infrastructure

---

## Registry Metadata Schema

Each policy entry includes structured metadata for automation readiness:

| Field | Values | Description |
|-------|--------|-------------|
| **Status** | ADOPTED / PROPOSED / COMMENTARY / SUPERSEDED / UNKNOWN | Current standing of policy |
| **Authority Source** | Document + Section citation | Where policy is formally stated |
| **Effective Date** | Date or "Unknown" | When policy became effective |
| **Confidence** | High / Medium / Low | Certainty of classification |

---

## Purpose

This registry is the single, board-readable index of SBNC policies and governing documents.  
It answers:

- What policies exist
- Where the authoritative source lives
- Who owns it
- Who can see it
- How changes are proposed, approved, and deployed
- What ClubOS behavior (if any) is governed by the policy

No policy content is modified here. This registry points to sources and records decisions.

## Access Levels

- Board only
- Activities only
- Board + Activities Chairs
- Members

Default for new items: Board only (until reclassified).

## Canonical Policy Areas

- Governance and authority (bylaws, articles, standing rules)
- Membership (tiers, pricing, approvals, term rules, data retention)
- Events (guests, refunds, cancellations, waitlists, safety)
- Finance (reimbursements, spending approvals, controls)
- Communications (email, privacy, photo/media policy)
- Data and privacy (retention, access, audit)
- Roles and job descriptions (operational guidance)

## Change Control

### Definitions

- Policy: A rule approved by the board (or delegated authority) that constrains operations.
- Procedure: An operational process that implements policy.
- Configuration: A system setting that enforces policy.

### Standard Change Workflow (Draft)

1. Intake: change request filed (who, what, why, effective date)
2. Source-of-truth review: locate governing documents and related minutes
3. Impact analysis: what changes in behavior, data, access, and member experience
4. Draft: policy/procedure text prepared for review
5. Approval: recorded vote or delegated approval (TBD by bylaws)
6. Publication: board-only visibility by default; member-facing as approved
7. Implementation: ClubOS config updated only after explicit permission
8. Audit: change logged, linked to approval record, rollback plan recorded

## Policy Roster

Each entry should include:

- Policy ID
- Name
- Category
- Access level
- Status (Draft / Active / Superseded)
- Effective date
- Source(s) and links
- Owner role
- Approval authority
- ClubOS enforcement notes
- Contradictions / ambiguities

---

## Active Policy Roster

### POLICY-001: SBNC Bylaws

**Registry Metadata:**

| Field | Value |
|-------|-------|
| Status | PROPOSED |
| Authority Source | Santa Barbara Newcomers Club - Bylaws (Draft with All Amendments).pdf |
| Effective Date | July 29, 2024 (original adoption); amendments pending |
| Confidence | Medium — Document marked "Draft - If All Amendments Approved" |

- **Category:** Governance and authority
- **Access level:** Members (all members have access per Preamble)
- **Status:** Draft (pending amendment approval)
- **Effective:** July 29, 2024 (original adoption)
- **Owner:** Secretary
- **Approval authority:** Board of Directors (2/3 vote per Art. X §1)
- **Sources:**
  - PDF: `Santa Barbara Newcomers Club - Bylaws (Draft with All Amendments).pdf`
  - Location: Google Drive / Board folder (also archived locally)
- **Summary:** Core governing document defining club structure, membership rules, officer roles, committees, meetings, elections, and amendment procedures. Includes Code of Conduct (Appendix I) and Event Waiver (Appendix II).
- **ClubOS enforcement:**
  - Membership term (2 years) → `src/lib/membership/lifecycle.ts`
  - Officer terms (6 months) → role assignment logic
  - Geographic eligibility (Carpinteria to Goleta, ocean to Camino Cielo) → membership validation
  - Newcomer definition (≤18 months residency) → eligibility checks
  - Third-year extension criteria → Policies and Procedures (not in bylaws)
  - Dues amount → Board-determined, not in bylaws (Art. III §3)
- **Open questions / contradictions:**
  - Document is marked "Draft - If All Amendments Approved" - need to confirm which version is officially adopted
  - Third-year extension criteria deferred to "Policies and Procedures" - need to locate that document
  - Dues amount not specified in bylaws (Board sets it) - need to find current rate

---

### POLICY-002: Code of Conduct

**Registry Metadata:**

| Field | Value |
|-------|-------|
| Status | ADOPTED |
| Authority Source | Bylaws Appendix I (pages 11-17) |
| Effective Date | July 29, 2024 |
| Confidence | High — Appendix to governing document with defined adoption date |

- **Category:** Membership (behavioral standards)
- **Access level:** Members
- **Status:** Active (part of bylaws)
- **Effective:** July 29, 2024
- **Owner:** Secretary (as part of bylaws)
- **Approval authority:** Board of Directors
- **Sources:**
  - Bylaws Appendix I (pages 11-17)
- **Summary:** Behavioral expectations covering: (I) Respectful Community Behavior, (II) Integrity and Honesty, (III) Digital Citizenship and Social Media, (IV) Event Participation and Safety, (V) Business and Solicitation Guidelines, (VI) Leadership Responsibilities, (VII) Compliance and Enforcement, (VIII) Continuous Improvement, (IX) Acknowledgment and Commitment.
- **Core Values:** Caring, Community Focus, Fairness, Friendliness, Fun, Honesty, Humility, Impartiality, Inclusiveness, Realism, Respect
- **ClubOS enforcement:**
  - Member termination process (Art. III §4) → disciplinary workflow
  - Appeal process (Art. III §5) → 30-day appeal window, 60-day review
  - Annual Code review by Board (§VIII) → governance calendar
- **Open questions / contradictions:** None identified

---

### POLICY-003: Event Waiver and Media Release

**Registry Metadata:**

| Field | Value |
|-------|-------|
| Status | ADOPTED |
| Authority Source | Bylaws Appendix II (pages 17-20) |
| Effective Date | July 29, 2024 |
| Confidence | High — Appendix to governing document with defined adoption date |

- **Category:** Events (liability and media)
- **Access level:** Members
- **Status:** Active (part of bylaws)
- **Effective:** July 29, 2024
- **Owner:** VP of Activities / Secretary
- **Approval authority:** Board of Directors
- **Sources:**
  - Bylaws Appendix II (pages 17-20)
- **Summary:** Combined waiver covering: Participation Agreement, Assumption of Risk, Waiver and Release of Liability, Indemnification, Medical Treatment Consent, Age Certification (18+), and Audio/Photo/Video Media Release.
- **ClubOS enforcement:**
  - Event registration requires waiver acceptance → registration flow
  - Media release consent tracking → member profile
  - Emergency contact collection → member data
- **Open questions / contradictions:**
  - Is waiver acceptance recorded per-event or once at joining?
  - How is media release opt-out handled?

---

## Pending Investigation

### Documents to Locate

| Document | Expected Location | Priority |
|----------|-------------------|----------|
| Policies and Procedures | Google Drive / Board | P1 - Contains third-year extension criteria |
| Committee Chair Guidelines | Google Drive / Activities | P2 - VP Activities maintains |
| Standing Rules | Google Drive / Board | P1 - If separate from bylaws |
| Articles of Incorporation | Secretary / State filing | P0 - Legal foundation |

---

## Template

### POLICY-000: Template

**Registry Metadata:**

| Field | Value |
|-------|-------|
| Status | (ADOPTED / PROPOSED / COMMENTARY / SUPERSEDED / UNKNOWN) |
| Authority Source | (Document + Section) |
| Effective Date | (Date or "Unknown") |
| Confidence | (High / Medium / Low) |

- **Category:**
- **Access level:**
- **Status:**
- **Effective:**
- **Owner:**
- **Approval authority:**
- **Sources:**
  - (link)
- **Summary:**
- **ClubOS enforcement:**
- **Open questions / contradictions:**

---

## Policies Pending Authority Resolution

The following policies cannot be safely classified until authoritative source documents are located, reviewed, or clarified by the Board.

### Pending: Bylaws Amendment Status

| Issue | Details | Resolution Needed |
|-------|---------|-------------------|
| Bylaws version uncertainty | Document titled "Draft with All Amendments" — unclear if amendments were formally adopted | Board confirmation of which version is in force |
| Amendment approval records | No Board minutes or resolutions linked confirming specific amendments | Secretary to locate adoption records |

**Impact:** POLICY-001 (Bylaws) marked PROPOSED until confirmed ADOPTED.

---

### Pending: Fee Schedule Location

| Item | Current Information | Resolution Needed |
|------|---------------------|-------------------|
| Year 1 dues | Not stated in bylaws (Art. III §3 defers to Board) | Locate Board-approved fee schedule |
| Year 2 dues | Not stated in bylaws | Locate Board-approved fee schedule |
| Third-year extension fee | "$85" cited in Business Model document | Confirm via Board resolution |
| Alumni annual fee | "$25" cited in Non-Member and Guest Policy | Confirm via Board resolution |

**Impact:** Fee-related policies cannot have High confidence without documented Board approval.

---

### Pending: Policies and Procedures Document

| Issue | Details | Resolution Needed |
|-------|---------|-------------------|
| Document location | Bylaws Art. III §3 references "Policies and Procedures" for third-year criteria | Locate and review this document |
| Host guest limit source | Non-Member and Guest Policy cites "per Policies and Procedures" for 2-guest limit | Cross-reference with P&P |

**Impact:** Multiple rules reference this document; OCR extraction in progress.

---

### Pending: Insurance Policy Terms

| Issue | Details | Resolution Needed |
|-------|---------|-------------------|
| Private home event restriction | Non-Member and Guest Policy §5.1 states "Required by club insurance policy terms" | Locate insurance policy or carrier documentation |
| Liability coverage scope | Not documented | Confirm coverage requirements |

**Impact:** EVT-006 (home event insurance mandate) cannot be verified without source document.

---

### Pending: Contradictions Requiring Board Clarification

| Policy IDs | Contradiction | Status |
|------------|---------------|--------|
| EVT-007 + EVT-008 | "No exceptions" for home events vs. "Host may invite 2 guests" | Awaiting clarification |
| MBR-002 + MBR-005 | "2-3 years total" membership vs. three 12-month tiers (36 months max) | Awaiting clarification |
| MBR-013 | Registration eligibility rule contradicted by data (196 expired registrations) | Awaiting clarification |

---

### Pending: Commentary Requiring Formal Adoption

The following items are documented in operational guidance (SBNC Business Model and Sustainability v1.0) but lack formal Board adoption:

| Topic | Document Reference | Recommended Action |
|-------|-------------------|-------------------|
| Mission statement | Business Model §Mission | Board resolution to adopt |
| Events as core function | Business Model §Flywheel | Board resolution to adopt |
| $50k cash buffer target | Business Model §Financial Stability | Board resolution to adopt |
| Cost recovery principle | Business Model §Event Pricing | Board resolution to adopt |
| Volunteer pathway model | Business Model §Volunteer Development | Board resolution to adopt |

**Impact:** These items are marked COMMENTARY, not ADOPTED, until Board action.

---

## Registry Statistics

| Status | Count | Notes |
|--------|-------|-------|
| ADOPTED | 2 | Code of Conduct, Event Waiver |
| PROPOSED | 1 | Bylaws (pending confirmation) |
| COMMENTARY | 0 | (items in Business Model not yet added as entries) |
| SUPERSEDED | 0 | — |
| UNKNOWN | 0 | — |

| Confidence | Count |
|------------|-------|
| High | 2 |
| Medium | 1 |
| Low | 0 |

---

*This registry is a READ-ONLY inventory. Policy meaning has not been altered. Uncertainty is explicitly labeled.*

*Registry Maintainer: Secretary (with ClubOS Development Team support)*
*Last Updated: December 20, 2025*
