# Failure Registry Alignment Analysis

Worker 2 Audit Results
Date: 2025-12-21

---

## Audit Criteria

Every failure mode must clearly answer:

1. **What breaks?** - Specific, observable malfunction
2. **Who notices?** - The affected persona (admin, member, treasurer, etc.)
3. **How ClubOS prevents or contains it?** - Concrete mechanism, not aspiration

---

## Summary of Findings

| Category | Issue Type | Count |
|----------|------------|-------|
| Vague failure language | Needs rewrite | 6 |
| Theoretical/subjective | Consider removal or reclassify | 1 |
| Missing "who notices" | Needs enhancement | 12 |
| Weak guarantees (aspirational) | Needs strengthening | 3 |
| Potential duplicates | Consider merge | 2 pairs |
| Well-formed entries | No action | 28 |

---

## Category 1: Vague Failure Language

These entries describe problems imprecisely. Vague language prevents testing.

### WA-015: Bulk update limitations

**Current:** "Mass updates require CSV import gymnastics. Limited field coverage."

**Problem:** "Gymnastics" and "limited field coverage" are not observable. Which fields? What fails?

**Proposed Rewrite:**
> Mass member updates require exporting to CSV, editing in Excel, and re-importing. Some fields (custom fields, group memberships) cannot be bulk-updated at all. Admin discovers limitation mid-workflow.

**Who notices:** Admin attempting bulk update

---

### WA-018: Field validation inconsistent

**Current:** "Some fields accept invalid data. Profile image size limited with no way to enlarge."

**Problem:** "Some fields" is not testable. Two unrelated issues conflated.

**Proposed Rewrite:**
> Email fields accept malformed addresses that later cause send failures. Phone fields accept non-numeric characters that break integrations. Profile images silently reject files over 2MB without clear error.

**Who notices:** Admin entering data; later, comms team when emails bounce

**Proposed Action:** Split into two entries or consolidate under "data validation gaps."

---

### WA-027: Event cloning loses settings

**Current:** "Cloning does not preserve all configuration. Must manually re-apply settings."

**Problem:** "All configuration" is vague. Which settings are lost?

**Proposed Rewrite:**
> Cloning an event does not copy: custom registration fields, payment settings, confirmation email templates, or capacity limits. Admin discovers missing settings after publishing.

**Who notices:** Event chair after cloning

---

### WA-031: No payment audit trail

**Current:** "Hard to trace payment vs credit vs refund. Cannot link event registration to specific invoice easily."

**Problem:** "Hard to trace" is subjective. What specifically fails?

**Proposed Rewrite:**
> Payment records lack explicit linkage to source (event registration vs donation vs dues). When a member disputes a charge, treasurer cannot quickly identify which transaction applies. Credits appear on member accounts with no explanation of origin.

**Who notices:** Treasurer reconciling accounts; member with unexpected credit

---

### WA-036: Website editor dated

**Current:** "WYSIWYG editor unpredictable. Drag-and-drop limited. Code is bloated."

**Problem:** "Unpredictable" and "bloated" are subjective. What fails?

**Proposed Rewrite:**
> WYSIWYG editor produces inconsistent HTML across browsers. Pasted content from Word introduces hidden formatting that breaks layout. Saved pages render differently than preview. Webmaster cannot reliably predict final appearance.

**Who notices:** Webmaster after publishing; members seeing broken pages

---

### WA-043: Email deliverability issues

**Current:** "Emails frequently land in spam. DKIM/SPF misconfiguration for custom domains is common."

**Problem:** "Frequently" is not measurable. "Common" is vague.

**Proposed Rewrite:**
> Emails sent from custom domains often fail DKIM/SPF checks because WA's setup instructions are incomplete. Members report not receiving event confirmations. Admins discover problem only when members complain.

**Who notices:** Members missing emails; admin after complaints

---

## Category 2: Theoretical or Subjective Entries

### WA-038: Templates look dated

**Current:** "Website themes look dated. Promised updates not materialized."

**Problem:** "Look dated" is aesthetic judgment, not a failure mode. This is a feature gap, not a malfunction.

**Options:**
1. **Remove** - Not a failure mode; it's a preference
2. **Reframe** - If there's a concrete failure (e.g., "themes not mobile-responsive"), state that
3. **Reclassify as OUT-OF-SCOPE** - Aesthetic choices are not architectural

**Recommendation:** Reclassify as OUT-OF-SCOPE with rationale: "Visual design is subjective. ClubOS provides modern components but does not guarantee aesthetic superiority."

---

## Category 3: Missing "Who Notices"

These entries have concrete failure descriptions but don't identify the affected persona. Adding this strengthens the guarantee's testability.

| WA ID | Current Failure | Add: Who Notices |
|-------|-----------------|------------------|
| WA-009 | Audit logs not exportable | **Compliance officer** needing external review |
| WA-010 | No before/after diff | **Admin investigating** what changed |
| WA-013 | Limited data export options | **Treasurer** preparing QuickBooks import |
| WA-014 | No point-in-time restore | **Admin after bulk error** needing rollback |
| WA-016 | Data import errors unclear | **Admin mid-import** seeing cryptic failures |
| WA-017 | Duplicate handling weak | **Admin after import** finding merged data |
| WA-019 | Cannot bulk import photos | **Membership chair** onboarding 100+ members |
| WA-020 | Export names in single column | **Treasurer** sorting financial reports |
| WA-032 | Renewal reminders confuse auto-renewers | **Members on auto-renewal** getting conflicting messages |
| WA-034 | Financial reports limited | **Treasurer** needing custom analysis |
| WA-042 | No website import/export | **Admin migrating** to/from platform |
| WA-050 | No volunteer hours tracking | **Volunteer coordinator** needing recognition data |

---

## Category 4: Weak Guarantees (Aspirational)

These guarantees sound good but aren't testable or enforceable.

### WA-038: "Modern, maintainable theming"

**Problem:** "Modern" is subjective. "Maintainable" is developer-facing, not user-observable.

**Proposed Strengthening:**
> Theme changes do not require content migration. New themes apply without breaking existing pages. Theme updates are non-destructive.

---

### WA-043: "Proper email authentication and deliverability guidance"

**Problem:** "Guidance" is documentation, not a guarantee. "Proper" is subjective.

**Proposed Strengthening:**
> ClubOS validates DKIM/SPF/DMARC configuration during custom domain setup. Setup wizard blocks completion until DNS records are verified. Delivery monitoring alerts admin to bounce rate spikes.

---

### WA-050: "Volunteer engagement tracking"

**Problem:** This is a feature statement, not a guarantee. What happens if it fails?

**Proposed Strengthening:**
> Volunteer hours are recorded with date, activity, and duration. Hours cannot be silently lost. Cumulative totals are accurate and auditable.

---

## Category 5: Potential Duplicates

### Pair 1: WA-021 + WA-022

- **WA-021:** Delete event cascades to invoices
- **WA-022:** No cancel vs delete distinction

**Overlap:** Both address the same root problem (destructive event operations). WA-021 describes the symptom; WA-022 describes the missing workflow.

**Recommendation:** Keep both but cross-reference. WA-022's guarantee depends on WA-021's mechanism.

---

### Pair 2: WA-007 + WA-008

- **WA-007:** Limited admin action logging
- **WA-008:** No actor attribution on changes

**Overlap:** Both are aspects of audit trail completeness. WA-007 is about breadth (which actions); WA-008 is about depth (who did it).

**Recommendation:** Keep both. They test different guarantees:
- WA-007 tests: "Is this action logged?"
- WA-008 tests: "Can we identify who did it?"

---

## Category 6: Orphaned Failure Modes

**None found.** All 50 entries have associated guarantees.

---

## Recommended Actions

### Immediate (Update Registry)

1. **Rewrite 6 vague entries** with concrete, observable failure descriptions
2. **Reclassify WA-038** as OUT-OF-SCOPE with rationale
3. **Add "Who notices" column** or embed in failure descriptions
4. **Strengthen 3 aspirational guarantees** with testable language

### Future (Backlog Items)

1. Add test references for DONE guarantees (link to test file)
2. Add mechanism references for IN-PROGRESS guarantees (link to implementation)
3. Consider splitting WA-018 into two entries

---

## Updated Entry Templates

Each entry should follow this pattern:

```
| WA-XXX | [2-3 word label] | [Observable failure]: [Who notices] when [trigger]. [Specific impact]. | **[Testable guarantee]** | [Concrete mechanism with code/config reference] | [Status] |
```

**Example (WA-021 rewritten):**

```
| WA-021 | Event delete cascade | Deleting event voids all linked invoices: Treasurer notices phantom credits on member accounts after event chair deletes past event. Financial reconciliation fails. | **Event deletion blocked when financial records exist** | DELETE /events/:id returns 409 if payments exist. Cancel transitions status without touching invoices. Financial records are append-only. | DONE |
```

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-21 | Initial alignment analysis | Worker 2 |
