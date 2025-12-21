# SBNC Extracted Policy Rules

**Generated:** December 20, 2024
**Source:** OCR text files from `docs/policies/sbnc/ocr/` and existing documentation
**Status:** Partial extraction - many PDFs failed OCR (image-based documents)

---

## OCR Extraction Status

| Document | Size | OCR Status | Notes |
|----------|------|------------|-------|
| Articles of Inc. SBNC.pdf | 290KB | SUCCESS | Full text extracted |
| Bylaws (Draft with All Amendments).pdf | 16MB | FAILED | Image-based PDF |
| Bylaw Commentary and Implementation Analysis.pdf | 5.5MB | PARTIAL | ~50% extracted |
| Revised Policies and Procedures.pdf | 13MB | FAILED | Image-based PDF |
| Privacy Policy and Terms of Use.pdf | 4.8MB | FAILED | Image-based PDF |
| Social Media Policy.pdf | 3.8MB | FAILED | Image-based PDF |
| Improved Code of Conduct.pdf | 3.5MB | FAILED | Image-based PDF |
| Improved Event Waiver.pdf | 1.8MB | FAILED | Image-based PDF |
| Executive Committee vs. Board Authority.pdf | 2.9MB | FAILED | Image-based PDF |

**Action Required:** Re-extract failed PDFs using proper OCR tooling (Tesseract with preprocessing).

---

## PART 1: EXTRACTED RULES

### 1. MEMBERSHIP RULES

#### 1.1 Membership Eligibility

**Source:** SBNC_Policy_Registry.md (citing Bylaws Art. III)

> "Geographic eligibility: Carpinteria to Goleta, ocean to Camino Cielo."

> "Newcomer definition: ≤18 months residency."

**Confidence:** Medium (secondary source; bylaws PDF not extractable)

---

#### 1.2 Membership Duration

**Source:** SBNC_Policy_Registry.md (citing Bylaws)

> "Membership term (2 years)"

**Source:** Membership Lifecycle State Machine (docs/membership/MEMBERSHIP_LIFECYCLE_STATE_MACHINE.md)

> "two_year_mark_reached: joinDate + 730 days <= now (or calendar 2 years; TBD)"

> "If membershipStatus = Active and tier = member and joinDate + 730 days > now: state = active_member."

**Confidence:** High (multiple sources agree on 2-year term)

---

#### 1.3 Membership Renewal / Extension

**Source:** SBNC_Policy_Registry.md

> "Third-year extension criteria → Policies and Procedures (not in bylaws)"

**Source:** Membership Lifecycle State Machine

> "offer_extended: 2-year mark reached; extended offer sent, awaiting response."

> "active_extended: Extended membership accepted and paid."

**Confidence:** Medium (criteria for extension referenced but not located in extractable documents)

---

#### 1.4 Membership Termination

**Source:** SBNC_Policy_Registry.md (citing Bylaws Art. III §4)

> "Member termination process (Art. III §4) → disciplinary workflow"

**Source:** Bylaw Commentary (OCR extracted)

> "Member termination decisions are final with no appeal process. This violates basic due process principles and creates legal risk."

This appears to reference the **current** bylaws (before proposed amendments). The commentary recommends adding an appeal process.

**Confidence:** High (direct OCR extraction)

---

#### 1.5 Member Appeal Process

**Source:** Bylaw Commentary - Amendment 7

> "Change: Add formal appeal rights for terminated members"

> "Currently, member termination decisions are final with no appeal process."

**Source:** SBNC_Policy_Registry.md (citing proposed Code of Conduct)

> "Appeal process (Art. III §5) → 30-day appeal window, 60-day review"

**Note:** This appears to be a PROPOSED change, not current policy.

**Confidence:** Medium (proposed vs. current unclear)

---

#### 1.6 Membership Dues

**Source:** SBNC_Policy_Registry.md

> "Dues amount → Board-determined, not in bylaws (Art. III §3)"

> "Dues amount not specified in bylaws (Board sets it) - need to find current rate"

**Confidence:** High for process (Board sets amount), LOW for actual amount (not found)

---

### 2. FINANCIAL RULES

#### 2.1 Event Budgets

**Source:** EVENT_SUBMISSION_PHASE2_SPEC.md

> "Budget required if cost > $0"

> "Treasurer: financial review if budget present"

**Confidence:** Low (this is a ClubOS spec, not an SBNC policy document)

---

#### 2.2 Approval Thresholds

**Source:** EVENT_SUBMISSION_PHASE2_SPEC.md

> "Severity Levels: Low: Auto-logged / Medium: VP Activities approval required / High: VP Activities + Board visibility"

> "Open Questions: Threshold for Board escalation? Budget approval limits?"

**Confidence:** Low (explicitly marked as "Open Questions")

---

#### 2.3 Reimbursements

**No extractable policy found.**

---

#### 2.4 Spending Authority

**Source:** Bylaw Commentary - Executive Committee vs. Board

> "Currently, 6 people (2/3 of 9-member Executive Committee) can remove any Board member"

This references governance authority, not spending authority. No specific spending thresholds found.

**Confidence:** N/A (not extracted)

---

### 3. APPROVAL AUTHORITY

#### 3.1 VP Activities Authority

**Source:** EVENT_SUBMISSION_PHASE2_SPEC.md

> "VP Activities: required approval" (for events)

> "VP Activities: queue + approval actions"

**Confidence:** Medium (ClubOS spec, not SBNC policy document)

---

#### 3.2 Executive Committee Authority

**Source:** Bylaw Commentary

> "Currently, 6 people (2/3 of 9-member Executive Committee) can remove any Board member, including committee chairs representing member interests."

> "This represents a fundamental shift toward democratic governance." (referring to proposed change)

**Confidence:** High (direct OCR)

---

#### 3.3 Board of Directors Authority

**Source:** Bylaw Commentary - Amendments 3-6

> "Move all removal decisions from Executive Committee to full Board"

> "Full Board should decide major personnel issues"

> "Member representation: Committee chairs need protection from arbitrary removal"

**Source:** SBNC_Policy_Registry.md

> "Approval authority: Board of Directors (2/3 vote per Art. X §1)" (for bylaw amendments)

**Confidence:** High (multiple sources)

---

#### 3.4 Bylaw Amendment Process

**Source:** Bylaw Commentary - Amendment 10

> "Current process allows bylaw changes with simple majority and no advance notice"

**Proposed Change:**
> "Simple majority → 2/3 supermajority with notice"

**Confidence:** High (direct OCR)

---

#### 3.5 Quorum Requirements

**Source:** Bylaw Commentary - Amendment 9

> "Current requirement for 11 specific Board members creates operational problems when positions are vacant or Board size varies."

**Proposed Change:**
> "Fixed 11-member quorum → majority of Board in office"

**Confidence:** High (direct OCR)

---

### 4. LIABILITY, WAIVERS, AND ACKNOWLEDGEMENTS

#### 4.1 Event Waiver

**Source:** SBNC_Policy_Registry.md (citing Bylaws Appendix II)

> "Combined waiver covering: Participation Agreement, Assumption of Risk, Waiver and Release of Liability, Indemnification, Medical Treatment Consent, Age Certification (18+), and Audio/Photo/Video Media Release."

**Source:** Bylaw Commentary - Amendment 12

> "Improved Event Waiver: Reformatted for readability, Clear sections instead of dense paragraph"

> "Enhanced legal protection: Maintains all original protections while improving clarity"

> "Modern media considerations: Explicit social media and digital distribution language"

> "Comprehensive coverage: Activity risks, medical consent, photography rights, conduct expectations"

**Confidence:** High (structure confirmed; exact text not extractable)

---

#### 4.2 Indemnification

**Source:** Bylaw Commentary - Amendment 8

> "Currently, volunteers and officers have no protection from personal liability when serving the organization. This is a critical gap that could discourage volunteer service."

**Proposed Change:**
> "Add standard nonprofit indemnification protection"

> "Volunteer protection: Essential for recruiting and retaining leadership"

> "Legal standard: Expected in all modern nonprofit bylaws"

**Confidence:** High (direct OCR; this is a PROPOSED change)

---

#### 4.3 Code of Conduct

**Source:** SBNC_Policy_Registry.md (citing Bylaws Appendix I)

> "Behavioral expectations covering: (I) Respectful Community Behavior, (II) Integrity and Honesty, (III) Digital Citizenship and Social Media, (IV) Event Participation and Safety, (V) Business and Solicitation Guidelines, (VI) Leadership Responsibilities, (VII) Compliance and Enforcement, (VIII) Continuous Improvement, (IX) Acknowledgment and Commitment."

> "Core Values: Caring, Community Focus, Fairness, Friendliness, Fun, Honesty, Humility, Impartiality, Inclusiveness, Realism, Respect"

**Source:** Bylaw Commentary - Amendment 11

> "Current Code of Conduct is inadequate for modern nonprofit governance (only 3 bullet points)"

> "Expanded from 3 bullet points to 9 comprehensive sections"

> "Added modern issues: Digital citizenship, social media conduct, privacy protection"

**Note:** This describes PROPOSED enhanced Code of Conduct, not necessarily current policy.

**Confidence:** Medium (current vs. proposed unclear)

---

#### 4.4 Media Release / Photography

**Source:** SBNC_Policy_Registry.md

> "Media release consent tracking → member profile"

**Source:** Bylaw Commentary

> "Modern media considerations: Explicit social media and digital distribution language"

**Open Question (from SBNC_Policy_Registry.md):**
> "How is media release opt-out handled?"

**Confidence:** Low (referenced but not extractable)

---

### 5. CORPORATE STRUCTURE

#### 5.1 Articles of Incorporation

**Source:** Articles of Inc. SBNC.txt (OCR extracted)

> "The name of the existing unincorporated association now being incorporated by the filing of these Articles is Santa Barbara Newcomers Group."

> "This corporation is a nonprofit mutual benefit corporation organized under the Nonprofit Mutual Benefit Corporation Law."

> "The purposes for which this corporation is formed are pleasure, recreation, and other nonprofitable purposes and are a social club for new individuals relocating to Santa Barbara County."

> "Despite any other provision of these Articles, this Corporation shall not, except to an insubstantial degree, engage in any activities or exercise any powers that do not further the purposes of this Corporation."

> "No part of the net earnings of the corporation shall inure to the benefit of any member or private shareholder, as defined in Internal Revenue Code section 501(c)(7)."

> "Date: November 13, 2007"

**Confidence:** High (direct OCR from Articles of Incorporation)

---

#### 5.2 Officer Terms

**Source:** SBNC_Policy_Registry.md

> "Officer terms (6 months) → role assignment logic"

**Confidence:** Medium (secondary source)

---

#### 5.3 Term Limit Waivers

**Source:** Bylaw Commentary - Amendment 2

> "Currently, the President can unilaterally waive term limits 'on a case-by-case basis' with no criteria or oversight."

**Proposed Change:**
> "Presidential discretion → Nominating Committee + Board approval with criteria"

> "Reduces presidential overreach"

> "Establishes clear criteria and process"

**Confidence:** High (direct OCR)

---

---

## PART 2: CONTRADICTIONS AND GAPS

### CONTRADICTIONS

#### C-1: Current vs. Proposed Code of Conduct

**Documents:**
- Current Bylaws Appendix I: "3 bullet points"
- Proposed Amendment 11: "9 comprehensive sections"

**Issue:** Documentation references both versions. Unclear which is currently in effect.

---

#### C-2: Appeal Rights for Terminated Members

**Document A:** Bylaw Commentary (current state)
> "Currently, member termination decisions are final with no appeal process."

**Document B:** SBNC_Policy_Registry.md (citing Code of Conduct)
> "Appeal process (Art. III §5) → 30-day appeal window, 60-day review"

**Issue:** Registry cites appeal process that Commentary says doesn't exist. One may describe proposed vs. current state.

---

#### C-3: Removal Authority

**Document A:** Bylaw Commentary (current state)
> "Currently, 6 people (2/3 of 9-member Executive Committee) can remove any Board member"

**Document B:** Bylaw Commentary (proposed change)
> "Move all removal decisions from Executive Committee to full Board"

**Issue:** Which is currently in effect? Document is titled "Draft with All Amendments" - adoption status unclear.

---

#### C-4: Bylaw Amendment Threshold

**Document A:** Bylaw Commentary (current state)
> "Current process allows bylaw changes with simple majority and no advance notice"

**Document B:** SBNC_Policy_Registry.md
> "Approval authority: Board of Directors (2/3 vote per Art. X §1)"

**Issue:** Commentary says simple majority; Registry says 2/3 vote. One may be current, other proposed.

---

#### C-5: Quorum Requirements

**Document A:** Bylaw Commentary (current state)
> "Current requirement for 11 specific Board members"

**Document B:** Bylaw Commentary (proposed change)
> "majority of Board in office"

**Issue:** Which is in effect?

---

### GAPS / MISSING RULES

#### G-1: Third-Year Extension Criteria

**Reference:** SBNC_Policy_Registry.md
> "Third-year extension criteria deferred to 'Policies and Procedures' - need to locate that document"

**Status:** Policies and Procedures PDF failed OCR. Criteria not extracted.

---

#### G-2: Current Dues Amount

**Reference:** SBNC_Policy_Registry.md
> "Dues amount not specified in bylaws (Board sets it) - need to find current rate"

**Status:** Actual dollar amount not found in any extractable document.

---

#### G-3: Event Cancellation and Refund Policy

**Status:** No extractable policy text found. Referenced in EVENT_SUBMISSION_PHASE2_SPEC.md as policy acknowledgement requirement, but actual policy text not available.

---

#### G-4: Budget Approval Thresholds

**Reference:** EVENT_SUBMISSION_PHASE2_SPEC.md
> "Open Questions: Threshold for Board escalation? Budget approval limits?"

**Status:** Explicitly identified as undefined.

---

#### G-5: Reimbursement Policy

**Status:** No policy text found.

---

#### G-6: Waiver Acceptance Frequency

**Reference:** SBNC_Policy_Registry.md
> "Is waiver acceptance recorded per-event or once at joining?"

**Status:** Explicitly identified as undefined.

---

#### G-7: Media Release Opt-Out Process

**Reference:** SBNC_Policy_Registry.md
> "How is media release opt-out handled?"

**Status:** Explicitly identified as undefined.

---

#### G-8: Guest Policy (for Home Events)

**Reference:** EVENT_SUBMISSION_PHASE2_SPEC.md
> "Home events require guest policy acknowledgement"

**Status:** Guest policy text not found.

---

#### G-9: Spending Authority by Role

**Status:** No specific dollar thresholds found for:
- VP Activities spending authority
- Committee Chair spending authority
- Treasurer pre-approval requirements
- Board approval threshold

---

#### G-10: Standing Rules

**Reference:** SBNC_Policy_Registry.md - Documents to Locate
> "Standing Rules | Google Drive / Board | P1 - If separate from bylaws"

**Status:** Document not in OCR corpus.

---

### AMBIGUOUS RULES REQUIRING CLARIFICATION

#### A-1: Definition of "2 Years"

**Source:** Membership Lifecycle State Machine
> "Definition of '2 years' (730 days vs calendar years with leap year handling)."

**Recommendation:** Board should clarify whether membership term is:
- 730 calendar days
- 24 calendar months
- Anniversary date based

---

#### A-2: Extended Membership Duration

**Source:** Membership Lifecycle State Machine
> "Whether extended membership has a fixed end date or is perpetual until lapsed."

**Recommendation:** Board should clarify extended member term length.

---

#### A-3: Grace Period Duration

**Source:** Membership Lifecycle State Machine
> "Grace period duration after extended offer sent."

**Recommendation:** Board should specify grace period for accepting extended membership offer.

---

#### A-4: Bylaws Adoption Status

**Issue:** Document titled "Santa Barbara Newcomers Club - Bylaws (Draft with All Amendments)" suggests amendments are proposed, not adopted.

**Recommendation:** Board should confirm which version of bylaws is currently in effect.

---

---

## SUMMARY

### Extractable Rules Found: 18
### Contradictions Identified: 5
### Gaps Requiring Policy Text: 10
### Ambiguities Requiring Clarification: 4

### Next Steps

1. **Re-run OCR** on failed PDFs using Tesseract with image preprocessing
2. **Board confirmation** of which bylaws version is currently adopted
3. **Locate Standing Rules** and Policies and Procedures documents
4. **Board clarification** on identified gaps (G-1 through G-10)
5. **Resolve contradictions** (C-1 through C-5) by confirming current vs. proposed language
