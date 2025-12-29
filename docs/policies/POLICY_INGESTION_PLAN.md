# Policy Registry Ingestion Plan

Copyright (c) Santa Barbara Newcomers Club

## Overview

This document describes the "no-surprises" approach to importing SBNC organizational policies into the Murmurant Policy Registry. The goal is to make policies inspectable without changing any system behavior.

**Key Principle**: Read-only first. We import and display policies before any enforcement integration.

---

## Phase 1: Document Inventory (Week 1)

### Step 1.1: Gather Source Documents

Collect all policy documents from current locations:

| Source | Document Types | Format | Owner |
|--------|---------------|--------|-------|
| Google Drive (Board folder) | Bylaws, Standing Rules | PDF, DOCX | Secretary |
| Google Drive (Committee folders) | Committee procedures | DOCX, Google Docs | Committee Chairs |
| Website | Public policies | HTML, PDF | Webmaster |
| Email archives | Board resolutions | Email/PDF | Secretary |
| WildApricot | System-embedded policies | Database fields | Admin |

### Step 1.2: Create Document Inventory Spreadsheet

For each document, record:

```
| Title | Type | Category | Last Modified | Source Location | Owner | Status |
|-------|------|----------|---------------|-----------------|-------|--------|
| SBNC Bylaws | BYLAWS | GOVERNANCE | 2024-01-15 | Drive/Board/Bylaws.pdf | Secretary | Current |
| Standing Rules | STANDING_RULES | GOVERNANCE | 2024-03-01 | Drive/Board/StandingRules.pdf | Secretary | Current |
| Event Refund Policy | PROCEDURE | EVENTS | 2023-06-15 | Drive/Activities/Refunds.docx | VP Activities | Needs Review |
```

### Step 1.3: Identify Gaps

Flag documents that:

- Have no clear owner
- Haven't been reviewed in 2+ years
- Exist only in email or informal notes
- Contradict each other on the surface

**Deliverable**: Inventory spreadsheet shared with Board for review.

---

## Phase 2: Priority Classification (Week 2)

### Step 2.1: Classify by Importance

| Priority | Criteria | Examples |
|----------|----------|----------|
| P0 - Critical | Governs club structure, legal requirements | Bylaws, Articles of Incorporation |
| P1 - High | Affects member rights or money | Dues policy, Refund policy, Privacy policy |
| P2 - Medium | Operational procedures | Event scheduling, Committee guidelines |
| P3 - Low | Informational, rarely referenced | Historical procedures, archived policies |

### Step 2.2: Classify by Audience

Determine who should see each document:

| Audience | Who Can View | Example Documents |
|----------|--------------|-------------------|
| BOARD_ONLY | President, VPs, Secretary, Treasurer | Executive session procedures, Personnel policies |
| OFFICERS | All elected/appointed officers | Delegation authorities, Internal procedures |
| COMMITTEE_CHAIRS | Officers + committee chairs | Committee-specific procedures |
| ALL_MEMBERS | Any authenticated member | Bylaws, Standing Rules, General policies |

### Step 2.3: Board Review Meeting

Present inventory to board with recommendations:

- Which documents to import first (P0, P1)
- Which documents need updates before import
- Which documents should be consolidated or retired

**Deliverable**: Board-approved import list with priorities.

---

## Phase 3: Initial Import (Weeks 3-4)

### Step 3.1: Import P0 Documents

Start with the most critical documents:

1. **SBNC Bylaws**
   - Upload PDF to Policy Registry
   - Enter metadata (effective date, authority, etc.)
   - Manually create extracts for key articles
   - Mark as BOARD_ONLY initially

2. **Articles of Incorporation**
   - Upload PDF
   - Enter metadata
   - Create extracts for key provisions

3. **Standing Rules**
   - Upload PDF
   - Enter metadata
   - Create extracts for each rule

### Step 3.2: Manual Extract Creation

For each document, a human (Secretary or Admin) creates extracts:

```
Document: SBNC Bylaws 2024
Section: Article IV, Section 2
Text: "Members shall pay annual dues as established by the Board..."
Topics: [membership, dues, renewal]
```

**Why Manual?** Automated extraction is error-prone. Manual extraction ensures accuracy and lets us verify as we go.

### Step 3.3: Verification Workflow

1. Secretary creates initial extracts
2. President reviews and verifies
3. Verified extracts are marked with timestamp and verifier

**Deliverable**: P0 documents imported with verified extracts.

---

## Phase 4: Contradiction Detection (Week 5)

### Step 4.1: Configure Murmurant Config Mapping

Map policy topics to Murmurant configuration keys:

```yaml
# Policy topics → Murmurant config mapping
mappings:
  - topics: [dues, membership, fees]
    configKeys:
      - membership.duesAmount
      - membership.duesTotalAmount

  - topics: [renewal, membership, grace period]
    configKeys:
      - membership.renewalPeriodDays
      - membership.gracePeriodDays

  - topics: [cancellation, refund, events]
    configKeys:
      - events.cancellationDeadlineHours
      - events.refundPolicy
```

### Step 4.2: Run Initial Contradiction Check

Generate first contradiction report:

1. Compare policy extracts to Murmurant config values
2. Flag any mismatches
3. Present to Board for review

### Step 4.3: Triage Contradictions

For each detected contradiction:

| Action | When to Use |
|--------|-------------|
| **Acknowledge** | Known discrepancy, will address later |
| **Resolve - Update Config** | Policy is correct, config needs change |
| **Resolve - Update Policy** | Config is correct, policy is outdated |
| **Won't Fix** | Intentional difference with documented reason |

**Deliverable**: First contradictions report, reviewed by Board.

---

## Phase 5: Expand Coverage (Weeks 6-8)

### Step 5.1: Import P1 Documents

Import high-priority operational policies:

- Membership policies (eligibility, renewal, termination)
- Event policies (registration, cancellation, refunds)
- Finance policies (spending authority, reimbursement)
- Privacy policies

### Step 5.2: Import P2 Documents

Import medium-priority procedures:

- Committee guidelines
- Event chair procedures
- Communication policies

### Step 5.3: Ongoing Verification

Continue verification workflow for all new extracts.

**Deliverable**: Comprehensive policy registry with P0, P1, P2 documents.

---

## Phase 6: Board Access (Week 9)

### Step 6.1: Enable Board UI

Deploy board-facing UI:

- `/admin/policies/registry` - Policy document list
- `/admin/policies/registry/:id` - Document detail with extracts
- `/admin/policies/contradictions` - Contradictions dashboard
- `/admin/policies/search` - Full-text search

### Step 6.2: Board Training

Brief training session:

- How to navigate the registry
- How to search for policies
- How to acknowledge/resolve contradictions
- How to request new policy imports

### Step 6.3: Feedback Collection

Collect feedback from board on:

- Missing policies
- Incorrect extracts
- Usability issues
- Feature requests

**Deliverable**: Board actively using Policy Registry.

---

## No-Surprises Checklist

Before each phase, verify:

- [ ] **No behavior changes** - This phase only adds visibility, not enforcement
- [ ] **Board approval** - Board has approved what we're importing
- [ ] **Owner notification** - Policy owners know their documents are being imported
- [ ] **Accuracy check** - Extracts have been verified by a human
- [ ] **Access control** - Audience levels are correctly set
- [ ] **Rollback plan** - We can remove imported documents if issues arise

---

## Success Criteria

### Phase 1-5 (Import Complete)

- [ ] All P0 and P1 documents imported
- [ ] 80%+ of extracts verified by a human
- [ ] Contradictions report generated with 0 critical unresolved items
- [ ] Board review completed

### Phase 6 (Board Access)

- [ ] Board members can access registry UI
- [ ] Board members can search policies
- [ ] Board members can view contradictions report
- [ ] No P0/P1 bugs reported in first 2 weeks

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Inaccurate extracts | Manual creation + verification workflow |
| Missing documents | Comprehensive inventory with board review |
| Access control errors | Board-only default, explicit audience assignment |
| Contradictions panic | Frame as "informational" not "enforcement" |
| Scope creep | Strict phase boundaries, no enforcement until Phase 7+ |

---

## Future Phases (Not in Scope)

### Phase 7: Officer Access

Expand access to all officers, not just board.

### Phase 8: Automated Extraction

Implement PDF text extraction with AI section detection.

### Phase 9: Enforcement Integration

Connect Policy Registry to code-level `requirePolicy()` system.

### Phase 10: Policy Workflow

Add policy amendment and approval workflow.

---

## Appendix: SBNC Document Inventory (Template)

| # | Title | Type | Category | Audience | Effective | Source | Owner | Priority | Status |
|---|-------|------|----------|----------|-----------|--------|-------|----------|--------|
| 1 | SBNC Bylaws 2024 | BYLAWS | GOVERNANCE | ALL_MEMBERS | 2024-01-01 | Drive/Board | Secretary | P0 | Current |
| 2 | Standing Rules 2024 | STANDING_RULES | GOVERNANCE | ALL_MEMBERS | 2024-03-01 | Drive/Board | Secretary | P0 | Current |
| 3 | Event Refund Policy | PROCEDURE | EVENTS | ALL_MEMBERS | 2023-06-15 | Drive/Activities | VP Activities | P1 | Needs Review |
| 4 | Committee Chair Guidelines | GUIDELINE | COMMITTEES | COMMITTEE_CHAIRS | 2022-09-01 | Drive/Committees | VP Membership | P2 | Outdated |
| 5 | Privacy Policy | PROCEDURE | PRIVACY | ALL_MEMBERS | 2023-01-01 | Website | Webmaster | P1 | Current |

---

## Related Documents

- [POLICY_REGISTRY_SPEC.md](./POLICY_REGISTRY_SPEC.md) - Technical specification
- [POLICY_REGISTRY.yaml](./POLICY_REGISTRY.yaml) - Code-enforced policies
