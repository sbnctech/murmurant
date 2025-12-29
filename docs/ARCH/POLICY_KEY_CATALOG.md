# Policy Key Catalog

This document provides a complete reference for all configurable policy keys in Murmurant.

**Related Issues:** #263 (Policy Configuration Layer), #232 (SBNC as Tenant Zero)

**See Also:** [PLATFORM_VS_POLICY.md](./PLATFORM_VS_POLICY.md)

---

## Overview

Murmurant separates **platform invariants** (hard-coded, non-negotiable) from **policy keys**
(organization-configurable). This catalog documents all policy keys that organizations can
customize to match their operating model.

### Key Concepts

- **Policy Key**: A typed, namespaced configuration value (e.g., `membership.newbieDays`)
- **Default Value**: The SBNC "Tenant Zero" value used as fallback
- **Scope**: Whether the policy applies at organization level or globally
- **Type**: The data type (number, string, boolean, object)

### Access Pattern

All policy access MUST go through the `getPolicy()` function:

```typescript
import { getPolicy } from "@/lib/policy";

const newbieDays = getPolicy("membership.newbieDays", { orgId });
```

---

## Policy Key Reference

### 1. Membership Policies (`membership.*`)

These policies control membership lifecycle timing, tier classification, and status
transitions.

#### membership.newbieDays

| Property | Value |
|----------|-------|
| **Key** | `membership.newbieDays` |
| **Type** | `number` |
| **Default** | `90` (SBNC: 90 days) |
| **Scope** | Organization |
| **Unit** | Days |

**Description**: Number of days a new member is considered a "newbie" after joining.
During this period, members have the `active_newbie` lifecycle state.

**Invariant vs Policy**: This is a POLICY - organizations may have longer or shorter
onboarding periods. The INVARIANT is that the newbie period exists and is enforced
by the state machine.

**Pitfalls**:

- Changing this value does NOT retroactively update existing member states
- Value must be positive (0 would skip newbie period entirely)

**Used By**:

- `src/lib/membership/lifecycle.ts` - State machine transitions
- `tests/contracts/lifecycle.contract.spec.ts` - Boundary tests

---

#### membership.extendedDays

| Property | Value |
|----------|-------|
| **Key** | `membership.extendedDays` |
| **Type** | `number` |
| **Default** | `730` (SBNC: 2 years) |
| **Scope** | Organization |
| **Unit** | Days |

**Description**: Number of days of membership before a member qualifies for the
"extended member" offer. This is the "two-year mark" that triggers `offer_extended`
state.

**Invariant vs Policy**: This is a POLICY - organizations may offer extended membership
at different milestones (1 year, 3 years, etc.). The INVARIANT is that the transition
to extended membership is explicit, not automatic.

**Pitfalls**:

- Must be greater than `membership.newbieDays`
- Value of 0 would trigger immediate extended offer

**Used By**:

- `src/lib/membership/lifecycle.ts` - State machine transitions
- `tests/contracts/lifecycle.contract.spec.ts` - Boundary tests

---

#### membership.gracePeriodDays

| Property | Value |
|----------|-------|
| **Key** | `membership.gracePeriodDays` |
| **Type** | `number` |
| **Default** | `30` (SBNC: 30 days) |
| **Scope** | Organization |
| **Unit** | Days |

**Description**: Number of days after membership expiration before a member is
classified as "lapsed". During grace period, members retain access but receive
renewal reminders.

**Invariant vs Policy**: This is a POLICY - organizations may want longer or shorter
grace periods. The INVARIANT is that lapsed status is a distinct state with
specific restrictions.

**Pitfalls**:

- Value of 0 would immediately lapse members on expiration
- Very long grace periods may cause confusion about active vs expired status

**Used By**:

- `src/lib/membership/lifecycle.ts` - Expiration handling

---

#### membership.renewalReminderDays

| Property | Value |
|----------|-------|
| **Key** | `membership.renewalReminderDays` |
| **Type** | `number` |
| **Default** | `30` (SBNC: 30 days) |
| **Scope** | Organization |
| **Unit** | Days |

**Description**: Number of days before membership expiration to begin sending
renewal reminder communications.

**Invariant vs Policy**: This is a POLICY - organizations may want more or fewer
reminders. The INVARIANT is that renewal reminders are audit-logged and
rate-limited.

**Pitfalls**:

- Should be less than or equal to `gracePeriodDays` for logical consistency
- Too many reminders may annoy members

**Used By**:

- Future: Renewal notification system

---

#### membership.tiers.enabled

| Property | Value |
|----------|-------|
| **Key** | `membership.tiers.enabled` |
| **Type** | `boolean` |
| **Default** | `false` |
| **Scope** | Organization |

**Description**: Whether the membership tier system is active. When disabled,
all members are treated as having a single default tier.

**Invariant vs Policy**: This is a POLICY - some organizations have simple
single-tier membership, others have complex tier structures. The INVARIANT is
that tier assignment is explicit and audited when enabled.

**Pitfalls**:

- Enabling tiers requires tier configuration to exist
- Disabling tiers does NOT remove tier data from existing members

**Feature Flag**: Gated by feature flag system during rollout

---

#### membership.tiers.defaultCode

| Property | Value |
|----------|-------|
| **Key** | `membership.tiers.defaultCode` |
| **Type** | `string` |
| **Default** | `"GENERAL"` |
| **Scope** | Organization |

**Description**: Default tier code assigned to members when tier cannot be
determined from source data (e.g., during migration).

**Invariant vs Policy**: This is a POLICY - organizations define their own
tier codes. The INVARIANT is that every member has exactly one tier when
tiers are enabled.

**Pitfalls**:

- Must match a valid tier code in the organization's tier configuration
- Changing this does NOT update existing members

---

#### membership.tiers.waMapping

| Property | Value |
|----------|-------|
| **Key** | `membership.tiers.waMapping` |
| **Type** | `object` (Record<string, string>) |
| **Default** | See below |
| **Scope** | Organization |

**Description**: Mapping from Wild Apricot membership level names to Murmurant
tier codes. Used during WA migration to translate levels.

**Default Value (SBNC)**:

```json
{
  "New Member": "NEWCOMER",
  "Newcomer": "NEWCOMER",
  "1st Year": "FIRST_YEAR",
  "2nd Year": "SECOND_YEAR",
  "Third Year": "THIRD_YEAR",
  "3rd Year": "THIRD_YEAR",
  "Alumni": "ALUMNI",
  "Lapsed": "LAPSED",
  "Prospect": "PROSPECT"
}
```

**Invariant vs Policy**: This is a POLICY - every organization has different
WA level names. The INVARIANT is that unmapped levels fall back to
`membership.tiers.defaultCode`.

**Pitfalls**:

- Keys are case-sensitive and must match WA exactly
- Empty mapping will cause all members to get default tier

---

### 2. Scheduling Policies (`scheduling.*`)

These policies control event timing, timezone handling, and automated schedules.

#### scheduling.timezone

| Property | Value |
|----------|-------|
| **Key** | `scheduling.timezone` |
| **Type** | `string` (IANA timezone) |
| **Default** | `"America/Los_Angeles"` (SBNC: Pacific) |
| **Scope** | Organization |

**Description**: The organization's primary timezone for all date/time display
and scheduling calculations. Uses IANA timezone format.

**Invariant vs Policy**: This is a POLICY - organizations operate in different
timezones. The INVARIANT is that all times are stored in UTC and converted
using this timezone for display.

**Pitfalls**:

- MUST be a valid IANA timezone identifier
- Changing timezone affects all future event displays
- Historical events retain their original scheduled times
- DST transitions are handled automatically by the timezone library

**Common Values**:

| Timezone | Description |
|----------|-------------|
| `America/Los_Angeles` | Pacific Time (PT) |
| `America/Denver` | Mountain Time (MT) |
| `America/Chicago` | Central Time (CT) |
| `America/New_York` | Eastern Time (ET) |

**Used By**:

- All date/time formatting utilities
- Event scheduling and display
- Registration open time calculations

---

#### scheduling.registrationOpenDay

| Property | Value |
|----------|-------|
| **Key** | `scheduling.registrationOpenDay` |
| **Type** | `number` (0-6) |
| **Default** | `2` (SBNC: Tuesday) |
| **Scope** | Organization |

**Description**: Day of week when event registration opens. Uses JavaScript
day-of-week numbering (0 = Sunday, 6 = Saturday).

**Invariant vs Policy**: This is a POLICY - organizations may prefer different
registration days. The INVARIANT is that registration opening is deterministic
and auditable.

**Day Values**:

| Value | Day |
|-------|-----|
| 0 | Sunday |
| 1 | Monday |
| 2 | Tuesday |
| 3 | Wednesday |
| 4 | Thursday |
| 5 | Friday |
| 6 | Saturday |

**Pitfalls**:

- Must be in range 0-6
- Works in conjunction with `scheduling.registrationOpenHour`

---

#### scheduling.registrationOpenHour

| Property | Value |
|----------|-------|
| **Key** | `scheduling.registrationOpenHour` |
| **Type** | `number` (0-23) |
| **Default** | `8` (SBNC: 8 AM) |
| **Scope** | Organization |

**Description**: Hour of day when event registration opens, in the organization's
configured timezone. Uses 24-hour format.

**Invariant vs Policy**: This is a POLICY - organizations may prefer different
opening times. The INVARIANT is that opening time is consistent and predictable.

**Pitfalls**:

- Must be in range 0-23
- Uses organization timezone, not UTC
- Opening at midnight (0) may cause date confusion

**Used By**:

- Event registration scheduler
- eNews event listing cutoff

---

#### scheduling.eventArchiveDays

| Property | Value |
|----------|-------|
| **Key** | `scheduling.eventArchiveDays` |
| **Type** | `number` |
| **Default** | `30` (SBNC: 30 days) |
| **Scope** | Organization |
| **Unit** | Days |

**Description**: Number of days after an event ends before it is automatically
archived and removed from active listings.

**Invariant vs Policy**: This is a POLICY - organizations may want events visible
longer for photo uploads or shorter for cleaner UI. The INVARIANT is that
archived events remain accessible for historical queries.

**Pitfalls**:

- Very short values may archive events before photos are uploaded
- Very long values may clutter event listings

---

#### scheduling.announcementDay

| Property | Value |
|----------|-------|
| **Key** | `scheduling.announcementDay` |
| **Type** | `number` (0-6) |
| **Default** | `0` (SBNC: Sunday) |
| **Scope** | Organization |

**Description**: Day of week when weekly announcements (eNews) are sent.
Uses JavaScript day-of-week numbering.

**Invariant vs Policy**: This is a POLICY - organizations may prefer different
send days based on member reading habits. The INVARIANT is that announcements
are rate-limited and audit-logged.

**Pitfalls**:

- Should typically be before `registrationOpenDay` to give members time to read
- SBNC pattern: Sunday announcement, Tuesday registration opens

---

#### scheduling.announcementHour

| Property | Value |
|----------|-------|
| **Key** | `scheduling.announcementHour` |
| **Type** | `number` (0-23) |
| **Default** | `8` (SBNC: 8 AM) |
| **Scope** | Organization |

**Description**: Hour of day when weekly announcements are sent, in the
organization's configured timezone.

**Invariant vs Policy**: This is a POLICY - organizations may prefer morning,
afternoon, or evening sends. The INVARIANT is that send times are predictable
and logged.

**Pitfalls**:

- Early morning sends may have lower open rates
- Very late sends may arrive the next day for some recipients

---

### 3. Governance Policies (`governance.*`)

These policies control board procedures, voting, and officer requirements.

#### governance.minutesReviewDays

| Property | Value |
|----------|-------|
| **Key** | `governance.minutesReviewDays` |
| **Type** | `number` |
| **Default** | `7` |
| **Scope** | Organization |
| **Unit** | Days |

**Description**: Number of days board members have to review meeting minutes
before they are finalized.

---

#### governance.boardEligibilityDays

| Property | Value |
|----------|-------|
| **Key** | `governance.boardEligibilityDays` |
| **Type** | `number` |
| **Default** | `730` (2 years) |
| **Scope** | Organization |
| **Unit** | Days |

**Description**: Minimum days of membership required to be eligible for
board positions.

---

#### governance.quorumPercentage

| Property | Value |
|----------|-------|
| **Key** | `governance.quorumPercentage` |
| **Type** | `number` |
| **Default** | `50` |
| **Scope** | Organization |
| **Unit** | Percentage |

**Description**: Percentage of board members required for quorum at meetings.

---

### 4. KPI Policies (`kpi.*`)

These policies control dashboard warning thresholds and health indicators.

#### kpi.membershipWarningThreshold

| Property | Value |
|----------|-------|
| **Key** | `kpi.membershipWarningThreshold` |
| **Type** | `number` |
| **Default** | `200` |
| **Scope** | Organization |

**Description**: Membership count below which dashboard shows warning indicator.

---

#### kpi.membershipDangerThreshold

| Property | Value |
|----------|-------|
| **Key** | `kpi.membershipDangerThreshold` |
| **Type** | `number` |
| **Default** | `150` |
| **Scope** | Organization |

**Description**: Membership count below which dashboard shows danger indicator.

---

#### kpi.eventAttendanceWarningPercent

| Property | Value |
|----------|-------|
| **Key** | `kpi.eventAttendanceWarningPercent` |
| **Type** | `number` |
| **Default** | `50` |
| **Scope** | Organization |
| **Unit** | Percentage |

**Description**: Event attendance percentage below which dashboard shows warning.

---

#### kpi.eventAttendanceDangerPercent

| Property | Value |
|----------|-------|
| **Key** | `kpi.eventAttendanceDangerPercent` |
| **Type** | `number` |
| **Default** | `25` |
| **Scope** | Organization |
| **Unit** | Percentage |

**Description**: Event attendance percentage below which dashboard shows danger.

---

### 5. Display Policies (`display.*`)

These policies control terminology and branding.

#### display.organizationName

| Property | Value |
|----------|-------|
| **Key** | `display.organizationName` |
| **Type** | `string` |
| **Default** | `"Organization"` |
| **Scope** | Organization |

**Description**: Display name for the organization in UI and communications.

---

#### display.memberTermSingular

| Property | Value |
|----------|-------|
| **Key** | `display.memberTermSingular` |
| **Type** | `string` |
| **Default** | `"member"` |
| **Scope** | Organization |

**Description**: Term used for a single member (e.g., "member", "participant",
"newcomer").

---

#### display.memberTermPlural

| Property | Value |
|----------|-------|
| **Key** | `display.memberTermPlural` |
| **Type** | `string` |
| **Default** | `"members"` |
| **Scope** | Organization |

**Description**: Plural term for members.

---

## How to Add a New Policy Key

### 1. Document First

Before writing code, add the key to this catalog:

1. Choose the appropriate namespace (`membership.`, `scheduling.`, etc.)
2. Document all properties: key, type, default, scope, description
3. Add "Invariant vs Policy" clarification
4. Document pitfalls and edge cases

### 2. Update Type Definitions

Add the key to `src/lib/policy/types.ts`:

```typescript
export type NewPolicyKey =
  | "namespace.keyName";

// Add to PolicyValueMap
export interface PolicyValueMap {
  "namespace.keyName": string; // or number, boolean, etc.
}
```

### 3. Add Default Value

Add to `POLICY_DEFAULTS` in `src/lib/policy/getPolicy.ts`:

```typescript
const POLICY_DEFAULTS: PolicyValueMap = {
  // ... existing
  "namespace.keyName": "default-value",
};
```

### 4. Write Contract Tests

Add tests to `tests/contracts/policy.contract.spec.ts`:

```typescript
it("namespace.keyName defaults to expected value", () => {
  expect(getPolicy("namespace.keyName", TEST_ORG)).toBe("default-value");
});
```

### 5. Reviewer Checklist

Before merging, verify:

- [ ] Key documented in this catalog
- [ ] Type definition added
- [ ] Default value added
- [ ] Contract test written
- [ ] "Invariant vs Policy" clarified
- [ ] Pitfalls documented
- [ ] PLATFORM_VS_POLICY.md updated if new category

---

## Future Work: Hardcoded Constants to Migrate

The following code locations use hardcoded constants that should eventually be migrated
to use `getPolicy()`. This is tracked for future work; no behavior changes are required now.

| File | Constant | Should Use Policy Key |
|------|----------|----------------------|
| `src/lib/events/scheduling.ts` | `SBNC_TIMEZONE` | `scheduling.timezone` |
| `src/lib/events/scheduling.ts` | `DEFAULT_REGISTRATION_OPEN_HOUR` | `scheduling.registrationOpenHour` |
| `src/lib/events/scheduling.ts` | `ARCHIVE_DAYS_AFTER_END` | `scheduling.eventArchiveDays` |
| `src/lib/timezone.ts` | `CLUB_TIMEZONE` | `scheduling.timezone` |

**Note:** These are not bugs. The current behavior is correct for SBNC (Tenant Zero).
Migration to `getPolicy()` enables future multi-tenant support.

---

## Related Documents

- [WA Policy Capture](../IMPORTING/WA_POLICY_CAPTURE.md) - Migration policy capture process
- [Migration Customer Journey](../IMPORTING/MIGRATION_CUSTOMER_JOURNEY.md) - Policy capture in migration context

> **Note:** The following documents are planned but not yet created:
> - `PLATFORM_VS_POLICY.md` - Philosophy and decision framework (Issue #263)
> - `docs/policy/INDEX.md` - Operational policy registry
> - `docs/policy/POLICY_CROSSWALK.md` - SBNC-specific mappings

---

*Last updated: 2025-12-24*
*Maintainer: Murmurant Development Team*
