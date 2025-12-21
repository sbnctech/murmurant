# Cognitive Load Product Audit

WORKER 7 Deliverable
Status: Findings Report
Date: 2025-12-21

---

## Purpose

This audit identifies product surfaces that violate cognitive load principles
defined in `docs/architecture/COGNITIVE_LOAD_AND_TALENT_MARKET_ADVANTAGE.md`.

The goal is to ensure these issues are addressed before Migration Mode, which
would amplify their impact.

---

## Summary

| Category | Score | Status |
|----------|-------|--------|
| State Display | 9/10 | Strong — explicit, color-coded, consistent |
| Forms | 9/10 | Strong — EventForm is exemplary |
| Confirmations | 4/10 | **Weak** — missing for most destructive actions |
| Error Handling | 3/10 | **Critical** — silent failures, no recovery |
| Bulk Operations | N/A | Not implemented — plan needed |

**Bottom line:** Strong foundations in state display and forms. Critical gaps
in error handling and confirmations that must be fixed before Migration Mode.

---

## Part 1: Cognitive Load Violations in Current Product

### V1: Silent Error Swallowing (CRITICAL)

**Principle violated:** CL-4 (Unpredictable Outcomes), Charter P6 (Human-first language)

**Where it occurs:**

| File | Line | Pattern |
|------|------|---------|
| `src/app/admin/members/MembersTable.tsx` | 43 | `catch { }` with comment "Keep existing state on error" |
| `src/app/admin/content/pages/PagesTable.tsx` | 63 | Same pattern |
| `src/app/admin/comms/campaigns/CampaignsTable.tsx` | 70 | Same pattern |
| `src/app/admin/content/templates/TemplatesTable.tsx` | 38 | Same pattern |
| `src/app/admin/content/themes/ThemesTable.tsx` | 46 | Same pattern |
| `src/app/admin/comms/lists/MailingListsTable.tsx` | 35 | Same pattern |
| `src/app/admin/comms/templates/MessageTemplatesTable.tsx` | 37 | Same pattern |

**Impact:**
- User believes data loaded when request failed
- Stale data displayed without indication
- Same action sometimes works, sometimes fails — user sees nothing either way
- Violates "no silent failures" guarantee

**Required fix:** Replace silent catch with error banner in table. Show:
- "Failed to load. [Retry]"
- Do not keep stale data

---

### V2: Alert-Based Error Feedback (HIGH)

**Principle violated:** CL-4 (Unpredictable Outcomes), Charter P6

**Where it occurs:**

| File | Line | Message |
|------|------|---------|
| `src/app/admin/SecretaryDashboard.tsx` | 130 | `alert(\`Failed to ${action}...\`)` |
| `src/app/admin/ParliamentarianDashboard.tsx` | 136 | Same pattern |
| `src/app/admin/governance/flags/[id]/page.tsx` | 112 | Same pattern |
| `src/app/admin/governance/flags/page.tsx` | 130 | Same pattern |
| `src/app/admin/governance/annotations/[id]/page.tsx` | 105, 129, 154 | Same pattern (3x) |
| `src/app/admin/governance/annotations/page.tsx` | 112 | Same pattern |
| `src/app/admin/VPActivitiesDashboard.tsx` | 144 | Same pattern |

**Impact:**
- Blocks interaction until dismissed
- No recovery path after clicking OK
- No audit trail link
- Not accessible
- Generic message without guidance

**Required fix:** Replace `alert()` with inline notification or toast:
- Show error message
- Include [Retry] button
- Include [View Details] for debugging
- Do not block UI

---

### V3: Missing Confirmation for Destructive Actions (HIGH)

**Principle violated:** CL-5 (Training-Dependent Safety), Charter P5

**Evidence:**
- Only ONE `confirm()` call in entire admin: annotation deletion
- No confirmation for: event delete, page delete, member actions, campaign actions
- Tables have no delete buttons visible — but when added, infrastructure is missing

**Impact:**
- Accidental deletions have no guardrail
- Relies on "training" to prevent mistakes
- No preview of what will be affected

**Required fix:** Create confirmation dialog component:
- Show action being taken
- Show affected record count
- Show dependencies ("3 registrations will be cancelled")
- Require explicit confirmation

---

### V4: No Dependency Visibility (MEDIUM)

**Principle violated:** CL-3 (Implicit Dependencies)

**Evidence:**
- Deleting events shows no warning about registrations/payments
- Canceling campaigns shows no recipient count
- Archiving pages shows no warning about links

**Impact:**
- Users cannot predict scope of action
- Cascading effects are discovered after the fact
- Matches WA's hidden cascade pattern we claim to prevent

**Required fix:** Before destructive action, query and display:
- "This event has 12 registrations and 8 payments"
- "These 3 pages link to this page"
- Block or require escalated confirmation for high-impact actions

---

### V5: No Undo/Restore UI (MEDIUM)

**Principle violated:** Charter P5 (reversible actions)

**Evidence:**
- Soft delete may exist in database (needs verification)
- No "Archived" or "Deleted" filter in tables
- No restore action visible anywhere in admin
- Page revision history exists but no UI to rollback

**Impact:**
- Mistakes are perceived as permanent
- Recovery requires database access
- Violates "30-day recovery window" claim

**Required fix:**
- Add "Include archived" filter to tables
- Add "Restore" action on archived records
- Add "Undo" for recent actions (where supported)

---

### V6: Inconsistent Status Display (LOW)

**Principle violated:** CL-2 (Hidden Rules)

**Evidence:**
- `PagesTable`, `CampaignsTable`: Proper color-coded badges
- `MembersTable`, `EventsTable`: Raw status strings without badges

**Impact:**
- Minor cognitive friction
- Status less visible at a glance

**Required fix:** Apply badge component consistently to all status columns.

---

## Part 2: Migration Mode Stress Amplifiers

These are places where current gaps would cause acute problems during migration.

### M1: Silent Import Failures

**Current gap:** V1 (Silent Error Swallowing)

**Migration stress:** When importing WA records, some will fail (duplicates,
validation errors, missing references). If failures are silent:
- User doesn't know what succeeded vs failed
- Data appears complete but has gaps
- Trust in migrated data is destroyed

**Required before migration:**
- Batch operation progress UI
- Per-record success/failure reporting
- Summary: "Imported 450 of 500 members. 50 failed. [View failures]"

---

### M2: No Bulk Action Preview

**Current gap:** V3 (Missing Confirmations), no bulk operations exist

**Migration stress:** Importing hundreds of records requires bulk actions.
Without preview:
- "Import 500 members" with no visibility into what will happen
- No ability to verify before commit
- Mistakes at scale are catastrophic

**Required before migration:**
- Bulk action framework with preview modal
- Show sample of records to be affected
- Show count and estimated impact
- Require confirmation for > N records

---

### M3: No Rollback for Migration Batches

**Current gap:** V5 (No Undo/Restore UI)

**Migration stress:** If a migration batch imports wrong data:
- No way to "undo last import"
- Manual cleanup required
- User fear prevents using migration features

**Required before migration:**
- Migration batch tracking
- "Undo batch" capability (delete/archive all records from batch)
- Point-in-time snapshot before migration starts

---

### M4: Alert Fatigue During Batch Operations

**Current gap:** V2 (Alert-Based Error Feedback)

**Migration stress:** If each failed record shows an `alert()`:
- User must click OK hundreds of times
- UI is blocked for duration
- Unusable for any real migration volume

**Required before migration:**
- Replace all `alert()` with non-blocking notifications
- Batch errors into summary, not per-record
- Progress bar with error count, not error popups

---

### M5: WA→ClubOS Discrepancy Anxiety

**Current gap:** No comparison UI

**Migration stress:** After migration, users need to verify:
- "Did all my members come over?"
- "Are the event dates correct?"
- "Is the payment history complete?"

Without comparison UI:
- Users manually check records
- Discrepancies cause panic
- Trust in system is fragile

**Required before migration:**
- Migration verification dashboard
- Side-by-side comparison views
- Discrepancy highlighting
- "All records verified" confirmation

---

### M6: No Import Dry-Run

**Current gap:** No preview-before-commit pattern for bulk operations

**Migration stress:** Users want to:
- See what will be imported before importing
- Catch obvious errors (wrong file, wrong mapping)
- Validate before committing

**Required before migration:**
- Dry-run mode that parses and validates without writing
- Show preview of first N records
- Show validation errors before import starts
- "Looks good? [Import] [Cancel]"

---

## Priority Matrix

| Issue | Severity | Migration Impact | Fix Complexity |
|-------|----------|------------------|----------------|
| V1: Silent errors | Critical | Blocks M1 | Low (error banner) |
| V2: Alert-based errors | High | Blocks M4 | Low (toast pattern) |
| V3: Missing confirmations | High | Blocks M2 | Medium (dialog component) |
| V4: No dependency visibility | Medium | Worsens M2 | Medium (query dependencies) |
| V5: No undo/restore UI | Medium | Blocks M3 | Medium (filter + action) |
| V6: Inconsistent badges | Low | None | Low (apply component) |

---

## Recommendations

### Before Migration Mode

**Must fix:**
1. Replace silent `catch {}` with error display (V1)
2. Replace `alert()` with non-blocking notifications (V2)
3. Create confirmation dialog component (V3)

**Should fix:**
4. Add dependency preview to destructive actions (V4)
5. Add archived/restore UI (V5)

### For Migration Mode

**Must build:**
1. Batch operation progress UI
2. Per-record success/failure reporting
3. Migration batch tracking with undo
4. Dry-run/preview mode

**Should build:**
5. WA→ClubOS comparison dashboard
6. Discrepancy highlighting

---

## Appendix: Positive Patterns to Preserve

These patterns are exemplary and should be the template for fixes:

### EventForm Field Metadata

```tsx
// FIELD_METADATA documents every field as required/optional/calculated
// FieldTypeBadge shows field type on every input
// InfoTooltip explains WHY a field is automatic
```

This directly addresses CL-2 (hidden rules) by making field behavior visible.

### Status Badge Pattern

```tsx
function getStatusBadge(status: string): { bg: string; text: string } {
  switch (status) {
    case "PUBLISHED": return { bg: "#e6ffe6", text: "#006600" };
    case "DRAFT": return { bg: "#fff3e0", text: "#995500" };
    ...
  }
}
```

Consistent, color-coded, immediately scannable. Apply everywhere.

### Loading State Management

```tsx
{actionInProgress === event.id ? "..." : "Approve"}
```

47+ uses of this pattern. Prevents double-submission, shows feedback.

---

## Done Criteria Met

- [x] Listed UI/workflow areas that violate cognitive load assumptions
- [x] Listed places where Migration Mode could amplify stress if not fixed
- [x] Identified where product friction could undermine trust later

---

*This document is a findings report, not an implementation plan.
Fixes should be scheduled based on Migration Mode timeline.*
