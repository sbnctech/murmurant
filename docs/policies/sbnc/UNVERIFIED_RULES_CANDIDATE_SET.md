# UNVERIFIED RULES CANDIDATE SET

> **WARNING: This document contains candidate rules only. No rule here is safe for automation without board designation.**

**Purpose:** Preserve extracted policy language for board review. This is an analytical artifact, not an authoritative policy source.

**Generated:** December 20, 2024
**Status:** UNVERIFIED - Awaiting board confirmation
**OCR Quality:** Partial (many source PDFs failed extraction)

---

## How to Read This Document

Each candidate rule includes:

| Field | Meaning |
|-------|---------|
| **Quote** | Exact text as extracted (may contain OCR errors) |
| **Source** | Document name |
| **Section** | Page/section reference if available |
| **Category** | Membership / Finance / Authority / Liability / Corporate |
| **Confidence** | High / Medium / Low (extraction quality) |
| **Blocking Issue** | Why this cannot be automated without board action |

**Conflicting versions are shown side-by-side.** Do not choose between them.

---

## CANDIDATE RULES

---

### RULE-001: Corporate Purpose

**Quote:**
> "This corporation is a nonprofit mutual benefit corporation organized under the Nonprofit Mutual Benefit Corporation Law. The purpose of this corporation is to engage in any lawful act or activity, other than credit union business, for which a corporation may be organized under such law."

**Source:** Articles of Inc. SBNC.txt
**Section:** Article 2
**Category:** Corporate
**Confidence:** High
**Blocking Issue:** None - Articles of Incorporation are foundational and filed with state.

---

### RULE-002: Charitable Purpose Statement

**Quote:**
> "The purposes for which this corporation is formed are pleasure, recreation, and other nonprofitable purposes and are a social club for new individuals relocating to Santa Barbara County."

**Source:** Articles of Inc. SBNC.txt
**Section:** Article 3
**Category:** Corporate
**Confidence:** High
**Blocking Issue:** None - foundational document.

---

### RULE-003: Purpose Limitation

**Quote:**
> "Despite any other provision of these Articles, this Corporation shall not, except to an insubstantial degree, engage in any activities or exercise any powers that do not further the purposes of this Corporation."

**Source:** Articles of Inc. SBNC.txt
**Section:** Article 3
**Category:** Corporate
**Confidence:** High
**Blocking Issue:** None - foundational document.

---

### RULE-004: Private Inurement Prohibition

**Quote:**
> "No part of the net earnings of the corporation shall inure to the benefit of any member or private shareholder, as defined in Internal Revenue Code section 501(c)(7)."

**Source:** Articles of Inc. SBNC.txt
**Section:** Article 5
**Category:** Corporate / Finance
**Confidence:** High
**Blocking Issue:** None - foundational document, legally required.

---

### RULE-005: Incorporation Date

**Quote:**
> "Date: November 13, 2007"

**Source:** Articles of Inc. SBNC.txt
**Section:** Declaration
**Category:** Corporate
**Confidence:** High
**Blocking Issue:** None.

---

### RULE-006: Membership Geographic Eligibility

**Quote:**
> "Geographic eligibility: Carpinteria to Goleta, ocean to Camino Cielo."

**Source:** SBNC_Policy_Registry.md (citing Bylaws Art. III)
**Section:** Not specified
**Category:** Membership
**Confidence:** Medium
**Blocking Issue:** Secondary source; original bylaws PDF not extractable. Board should confirm exact boundary language.

---

### RULE-007: Newcomer Residency Definition

**Quote:**
> "Newcomer definition: ≤18 months residency."

**Source:** SBNC_Policy_Registry.md (citing Bylaws)
**Section:** Not specified
**Category:** Membership
**Confidence:** Medium
**Blocking Issue:** Secondary source. Is this "≤18 months since moving to area" or "≤18 months since joining"?

---

### RULE-008: Membership Term Duration

**Quote (Version A):**
> "Membership term (2 years)"

**Source:** SBNC_Policy_Registry.md
**Section:** ClubOS enforcement notes

**Quote (Version B):**
> "two_year_mark_reached: joinDate + 730 days <= now (or calendar 2 years; TBD)"

**Source:** MEMBERSHIP_LIFECYCLE_STATE_MACHINE.md
**Section:** Guard Conditions

**Category:** Membership
**Confidence:** Medium
**Blocking Issue:** Ambiguity - is "2 years" defined as 730 days or calendar years? Document explicitly marks this as "TBD."

---

### RULE-009: Third-Year Extension Eligibility

**Quote:**
> "Third-year extension criteria → Policies and Procedures (not in bylaws)"

**Source:** SBNC_Policy_Registry.md
**Section:** ClubOS enforcement notes
**Category:** Membership
**Confidence:** Low
**Blocking Issue:** Criteria deferred to "Policies and Procedures" document which failed OCR extraction. Actual criteria unknown.

---

### RULE-010: Dues Authority

**Quote:**
> "Dues amount → Board-determined, not in bylaws (Art. III §3)"

**Source:** SBNC_Policy_Registry.md
**Section:** Open questions
**Category:** Membership / Finance
**Confidence:** Medium
**Blocking Issue:** Board sets amount, but current rate not found in any extractable document.

---

### RULE-011A: Member Termination - No Appeal (Current?)

**Quote:**
> "Currently, member termination decisions are final with no appeal process. This violates basic due process principles and creates legal risk."

**Source:** Bylaw Commentary and Implementation Analysis.txt
**Section:** Amendment 7 commentary
**Category:** Membership
**Confidence:** High (OCR quality)
**Blocking Issue:** Document describes this as CURRENT state that should be changed. Unclear if amendment was adopted.

---

### RULE-011B: Member Termination - With Appeal (Proposed?)

**Quote:**
> "Appeal process (Art. III §5) → 30-day appeal window, 60-day review"

**Source:** SBNC_Policy_Registry.md
**Section:** Code of Conduct enforcement notes
**Category:** Membership
**Confidence:** Medium
**Blocking Issue:** Appears to describe proposed or adopted amendment. Conflicts with RULE-011A. Board must confirm which is in effect.

---

### RULE-012A: Removal Authority - Executive Committee (Current?)

**Quote:**
> "Currently, 6 people (2/3 of 9-member Executive Committee) can remove any Board member, including committee chairs representing member interests."

**Source:** Bylaw Commentary and Implementation Analysis.txt
**Section:** Amendments 3-6 commentary
**Category:** Authority
**Confidence:** High (OCR quality)
**Blocking Issue:** Document describes this as CURRENT state. Unclear if amendments changing this were adopted.

---

### RULE-012B: Removal Authority - Full Board (Proposed?)

**Quote:**
> "Move all removal decisions from Executive Committee to full Board"

**Source:** Bylaw Commentary and Implementation Analysis.txt
**Section:** Amendments 3-6 commentary
**Category:** Authority
**Confidence:** High (OCR quality)
**Blocking Issue:** This is a PROPOSED change. If adopted, supersedes RULE-012A. Board must confirm.

---

### RULE-013A: Bylaw Amendment Threshold - Simple Majority (Current?)

**Quote:**
> "Current process allows bylaw changes with simple majority and no advance notice"

**Source:** Bylaw Commentary and Implementation Analysis.txt
**Section:** Amendment 10 commentary
**Category:** Authority
**Confidence:** High (OCR quality)
**Blocking Issue:** Described as CURRENT state. May have been changed by amendment.

---

### RULE-013B: Bylaw Amendment Threshold - Supermajority (Proposed or Adopted?)

**Quote:**
> "Approval authority: Board of Directors (2/3 vote per Art. X §1)"

**Source:** SBNC_Policy_Registry.md
**Section:** POLICY-001: SBNC Bylaws
**Category:** Authority
**Confidence:** Medium
**Blocking Issue:** Conflicts with RULE-013A. Board must confirm which threshold applies.

---

### RULE-014A: Quorum - Fixed Number (Current?)

**Quote:**
> "Current requirement for 11 specific Board members creates operational problems when positions are vacant or Board size varies."

**Source:** Bylaw Commentary and Implementation Analysis.txt
**Section:** Amendment 9 commentary
**Category:** Authority
**Confidence:** High (OCR quality)
**Blocking Issue:** Described as CURRENT state. Amendment proposes change.

---

### RULE-014B: Quorum - Majority of Board (Proposed?)

**Quote:**
> "Fixed 11-member quorum → majority of Board in office"

**Source:** Bylaw Commentary and Implementation Analysis.txt
**Section:** Amendment 9 commentary
**Category:** Authority
**Confidence:** High (OCR quality)
**Blocking Issue:** PROPOSED change. If adopted, supersedes RULE-014A.

---

### RULE-015A: Term Limit Waiver - Presidential Discretion (Current?)

**Quote:**
> "Currently, the President can unilaterally waive term limits 'on a case-by-case basis' with no criteria or oversight."

**Source:** Bylaw Commentary and Implementation Analysis.txt
**Section:** Amendment 2 commentary
**Category:** Authority
**Confidence:** High (OCR quality)
**Blocking Issue:** Described as CURRENT state. Amendment proposes change.

---

### RULE-015B: Term Limit Waiver - Committee + Board Approval (Proposed?)

**Quote:**
> "Presidential discretion → Nominating Committee + Board approval with criteria"

**Source:** Bylaw Commentary and Implementation Analysis.txt
**Section:** Amendment 2 commentary
**Category:** Authority
**Confidence:** High (OCR quality)
**Blocking Issue:** PROPOSED change. If adopted, supersedes RULE-015A.

---

### RULE-016: Officer Title

**Quote:**
> "Change: 'VP of Publicity and Marketing' → 'VP of Marketing'"

**Source:** Bylaw Commentary and Implementation Analysis.txt
**Section:** Amendment 1 commentary
**Category:** Corporate
**Confidence:** High (OCR quality)
**Blocking Issue:** Commentary says current practice uses "VP of Marketing" but bylaws say "VP of Publicity and Marketing." Legal inconsistency.

---

### RULE-017: Officer Term Length

**Quote:**
> "Officer terms (6 months) → role assignment logic"

**Source:** SBNC_Policy_Registry.md
**Section:** ClubOS enforcement notes
**Category:** Corporate
**Confidence:** Medium
**Blocking Issue:** Secondary source. Original bylaws not extractable.

---

### RULE-018A: Indemnification - None (Current?)

**Quote:**
> "Currently, volunteers and officers have no protection from personal liability when serving the organization. This is a critical gap that could discourage volunteer service."

**Source:** Bylaw Commentary and Implementation Analysis.txt
**Section:** Amendment 8 commentary
**Category:** Liability
**Confidence:** High (OCR quality)
**Blocking Issue:** Described as CURRENT state. Amendment proposes adding protection.

---

### RULE-018B: Indemnification - Standard Nonprofit (Proposed?)

**Quote:**
> "Add standard nonprofit indemnification protection"

**Source:** Bylaw Commentary and Implementation Analysis.txt
**Section:** Amendment 8 commentary
**Category:** Liability
**Confidence:** High (OCR quality)
**Blocking Issue:** PROPOSED change. Critical for volunteer protection. Board must confirm adoption status.

---

### RULE-019: Event Waiver Coverage

**Quote:**
> "Combined waiver covering: Participation Agreement, Assumption of Risk, Waiver and Release of Liability, Indemnification, Medical Treatment Consent, Age Certification (18+), and Audio/Photo/Video Media Release."

**Source:** SBNC_Policy_Registry.md
**Section:** POLICY-003: Event Waiver and Media Release
**Category:** Liability
**Confidence:** Medium
**Blocking Issue:** Structure confirmed; exact text not extractable (PDF failed OCR).

---

### RULE-020A: Code of Conduct - Minimal (Current?)

**Quote:**
> "Current Code of Conduct is inadequate for modern nonprofit governance (only 3 bullet points)"

**Source:** Bylaw Commentary and Implementation Analysis.txt
**Section:** Amendments 11-12 commentary
**Category:** Liability
**Confidence:** High (OCR quality)
**Blocking Issue:** Described as CURRENT state.

---

### RULE-020B: Code of Conduct - Expanded (Proposed?)

**Quote:**
> "Expanded from 3 bullet points to 9 comprehensive sections"

**Source:** Bylaw Commentary and Implementation Analysis.txt
**Section:** Amendments 11-12 commentary
**Category:** Liability
**Confidence:** High (OCR quality)
**Blocking Issue:** PROPOSED enhancement. Actual section text not extractable.

---

### RULE-021: Code of Conduct Sections (Proposed?)

**Quote:**
> "Behavioral expectations covering: (I) Respectful Community Behavior, (II) Integrity and Honesty, (III) Digital Citizenship and Social Media, (IV) Event Participation and Safety, (V) Business and Solicitation Guidelines, (VI) Leadership Responsibilities, (VII) Compliance and Enforcement, (VIII) Continuous Improvement, (IX) Acknowledgment and Commitment."

**Source:** SBNC_Policy_Registry.md
**Section:** POLICY-002: Code of Conduct
**Category:** Liability
**Confidence:** Medium
**Blocking Issue:** Appears to describe PROPOSED expanded code. May not be currently adopted.

---

### RULE-022: Core Values

**Quote:**
> "Core Values: Caring, Community Focus, Fairness, Friendliness, Fun, Honesty, Humility, Impartiality, Inclusiveness, Realism, Respect"

**Source:** SBNC_Policy_Registry.md
**Section:** POLICY-002: Code of Conduct
**Category:** Liability
**Confidence:** Medium
**Blocking Issue:** Source document (Code of Conduct appendix) not directly extractable.

---

### RULE-023: Event Waiver Improvements (Proposed?)

**Quote:**
> "Improved Event Waiver: Reformatted for readability, Clear sections instead of dense paragraph, Enhanced legal protection: Maintains all original protections while improving clarity, Modern media considerations: Explicit social media and digital distribution language"

**Source:** Bylaw Commentary and Implementation Analysis.txt
**Section:** Amendment 12 commentary
**Category:** Liability
**Confidence:** High (OCR quality)
**Blocking Issue:** PROPOSED improvement. Actual improved text not extractable.

---

### RULE-024: Annual Code Review

**Quote:**
> "Annual Code review by Board (§VIII) → governance calendar"

**Source:** SBNC_Policy_Registry.md
**Section:** Code of Conduct enforcement
**Category:** Authority
**Confidence:** Medium
**Blocking Issue:** References §VIII which may be part of proposed expanded code, not current.

---

### RULE-025: Newbie Window Duration

**Quote:**
> "active_newbie: Approved; in 90-day newbie window."

**Source:** MEMBERSHIP_LIFECYCLE_STATE_MACHINE.md
**Section:** States table
**Category:** Membership
**Confidence:** Medium
**Blocking Issue:** This is ClubOS implementation, not policy source. Need bylaws confirmation of 90-day period.

---

### RULE-026: Event Budget Requirement

**Quote:**
> "Budget required if cost > $0"

**Source:** EVENT_SUBMISSION_PHASE2_SPEC.md
**Section:** Validation Rules
**Category:** Finance
**Confidence:** Low
**Blocking Issue:** This is a ClubOS system specification, NOT an SBNC policy document. Do not treat as authoritative.

---

### RULE-027: Event Approval Routing

**Quote:**
> "VP Activities: required approval, Treasurer: financial review if budget present, Board: read-only visibility"

**Source:** EVENT_SUBMISSION_PHASE2_SPEC.md
**Section:** Routing
**Category:** Authority
**Confidence:** Low
**Blocking Issue:** ClubOS specification, NOT SBNC policy. Actual approval authority not confirmed by policy document.

---

### RULE-028: Waiver Acceptance Timing

**Quote:**
> "Is waiver acceptance recorded per-event or once at joining?"

**Source:** SBNC_Policy_Registry.md
**Section:** Open questions
**Category:** Liability
**Confidence:** N/A
**Blocking Issue:** Explicitly flagged as undefined. Board decision required.

---

### RULE-029: Media Release Opt-Out

**Quote:**
> "How is media release opt-out handled?"

**Source:** SBNC_Policy_Registry.md
**Section:** Open questions
**Category:** Liability
**Confidence:** N/A
**Blocking Issue:** Explicitly flagged as undefined. Board decision required.

---

### RULE-030: Home Event Guest Policy

**Quote:**
> "Home events require guest policy acknowledgement"

**Source:** EVENT_SUBMISSION_PHASE2_SPEC.md
**Section:** Validation Rules
**Category:** Liability
**Confidence:** Low
**Blocking Issue:** References "guest policy" but actual policy text not found. ClubOS spec, not policy source.

---

---

## SUMMARY

| Metric | Count |
|--------|-------|
| Total candidate rules | 30 |
| High confidence | 12 |
| Medium confidence | 13 |
| Low confidence | 5 |
| Rules with conflicting versions | 8 pairs |
| Rules explicitly undefined | 3 |

### Conflicting Version Pairs (Do Not Choose)

| Rule ID | Version A | Version B |
|---------|-----------|-----------|
| RULE-011 | No appeal process | 30-day appeal window |
| RULE-012 | Exec Committee removal | Full Board removal |
| RULE-013 | Simple majority | 2/3 supermajority |
| RULE-014 | 11-member quorum | Majority quorum |
| RULE-015 | Presidential discretion | Committee + Board approval |
| RULE-018 | No indemnification | Standard indemnification |
| RULE-020 | 3 bullet points | 9 sections |

### Master Blocking Issue

**Source Document Titled:** "Santa Barbara Newcomers Club - Bylaws (Draft with All Amendments)"

The word "Draft" and phrase "If All Amendments Approved" suggest this is a proposed document, not the currently adopted bylaws. Until board confirms adoption status, ALL rules derived from this source or its commentary are provisional.

---

## NEXT STEPS FOR BOARD

1. **Confirm adoption status** of Bylaws amendments (which are in effect?)
2. **Provide current dues amount**
3. **Provide third-year extension criteria** (or confirm location)
4. **Clarify "2 years" definition** (730 days vs calendar)
5. **Provide Standing Rules** document for extraction
6. **Re-OCR source PDFs** for complete extraction

---

*This document is an analytical artifact. It must not be used to configure system behavior.*

---

## Refined Membership and Finance Rule Index

**Purpose:** Organize already-identified Membership and Finance rules for future automation readiness assessment.

**Scope:** This index includes ONLY rules already extracted above. No new rules added.

**Warning:** All rules remain unverified. Automation impact assessment does not imply authorization.

---

### Membership Domain

| Rule ID | Short Name | Source | Blocking Issue | Automation Impact |
|---------|------------|--------|----------------|-------------------|
| RULE-006 | Geographic Eligibility | SBNC_Policy_Registry.md | Secondary source; original bylaws not extractable | **Blocking** |
| RULE-007 | Newcomer Residency Definition | SBNC_Policy_Registry.md | Ambiguous: "since moving" vs "since joining" unclear | **Blocking** |
| RULE-008 | Membership Term Duration | SBNC_Policy_Registry.md / MEMBERSHIP_LIFECYCLE_STATE_MACHINE.md | "2 years" undefined: 730 days vs calendar years marked TBD | **Blocking** |
| RULE-009 | Third-Year Extension Eligibility | SBNC_Policy_Registry.md | Criteria in unextractable "Policies and Procedures" document | **Blocking** |
| RULE-010 | Dues Authority | SBNC_Policy_Registry.md | Current dollar amount unknown; only authority documented | **Blocking** |
| RULE-011A | Member Termination (No Appeal) | Bylaw Commentary | Described as "current" but amendment status unknown | **Blocking** |
| RULE-011B | Member Termination (With Appeal) | SBNC_Policy_Registry.md | Conflicts with RULE-011A; adoption status unknown | **Blocking** |
| RULE-025 | Newbie Window Duration | MEMBERSHIP_LIFECYCLE_STATE_MACHINE.md | ClubOS implementation, not policy source; needs bylaws confirmation | **Blocking** |

**Membership Rules Summary:**
- rules_indexed: 8
- blocking_rules: 8
- non_blocking_rules: 0

---

### Finance Domain

| Rule ID | Short Name | Source | Blocking Issue | Automation Impact |
|---------|------------|--------|----------------|-------------------|
| RULE-004 | Private Inurement Prohibition | Articles of Inc. SBNC.txt | None - foundational legal document | Non-blocking |
| RULE-010 | Dues Authority | SBNC_Policy_Registry.md | Current dollar amount unknown; only authority documented | **Blocking** |
| RULE-026 | Event Budget Requirement | EVENT_SUBMISSION_PHASE2_SPEC.md | ClubOS spec, NOT SBNC policy document | **Blocking** |

**Finance Rules Summary:**
- rules_indexed: 3
- blocking_rules: 2
- non_blocking_rules: 1

---

### Combined Index Summary

| Domain | Rules Indexed | Blocking | Non-Blocking |
|--------|---------------|----------|--------------|
| Membership | 8 | 8 | 0 |
| Finance | 3 | 2 | 1 |
| **Total** | **11** | **10** | **1** |

**Note:** RULE-010 (Dues Authority) appears in both domains as it spans Membership and Finance.

---

### Blocking Issue Categories

| Category | Rules Affected | Resolution Required |
|----------|----------------|---------------------|
| Secondary source (bylaws not extractable) | RULE-006, RULE-007, RULE-010 | Re-OCR bylaws PDF or obtain text version |
| Ambiguous definition | RULE-007, RULE-008 | Board clarification |
| Conflicting versions | RULE-011A, RULE-011B | Board confirms which is adopted |
| Missing source document | RULE-009 | Locate and extract "Policies and Procedures" |
| ClubOS spec, not policy | RULE-025, RULE-026 | Obtain authoritative SBNC policy source |
| Unknown current value | RULE-010 | Board provides current dues amount |

---

### Automation Readiness: NOT READY

**All membership rules are blocking.** No membership automation is safe without:

1. Board confirmation of bylaws adoption status
2. Clarification of "2 years" definition
3. Extraction of third-year extension criteria
4. Resolution of termination appeal conflict

**Finance automation limited to:**

- RULE-004 (Private Inurement Prohibition) - informational only, no system behavior

---

*Index generated: December 20, 2024*
*This index does not authorize automation. Board designation required.*
