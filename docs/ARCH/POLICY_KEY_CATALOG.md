# Policy Key Catalog

**Status**: Canonical Reference
**Last Updated**: 2024-12-24
**Related Issues**: #232, #263, #275

This document catalogs all policy keys in ClubOS, distinguishing between **tenant-configurable policies** and **platform invariants**.

---

## Overview

ClubOS uses a policy layer to separate organization-specific configuration from platform behavior. This enables:

- **Multi-tenant support**: Different organizations can have different thresholds, schedules, and terminology
- **Safer changes**: Policy values can be modified without code deployments
- **Clear contracts**: Platform invariants are explicitly marked as non-configurable

### Classification

| Classification | Description |
|----------------|-------------|
| **Policy** | Must be configurable per-organization (tenant-specific) |
| **Platform** | Invariant behavior enforced by the platform (security, contracts) |
| **Candidate** | Currently hardcoded; should migrate to policy layer |
| **Feature Flag** | Runtime toggle for platform behavior (not tenant-specific) |

---

## Active Policy Keys

These keys are implemented in the policy layer (`src/lib/policy/`).

### Membership Policies

| Key | Type | Default | Source | Future Storage | Notes |
|-----|------|---------|--------|----------------|-------|
| `membership.newbieDays` | number | 90 | `src/lib/policy/getPolicy.ts:34` | `OrganizationPolicy` table | Days before newbie status expires |
| `membership.extendedDays` | number | 730 | `src/lib/policy/getPolicy.ts:35` | `OrganizationPolicy` table | Days to qualify as extended member (2 years) |
| `membership.gracePeriodDays` | number | 30 | `src/lib/policy/getPolicy.ts:36` | `OrganizationPolicy` table | Days before lapsed status after expiration |
| `membership.renewalReminderDays` | number | 30 | `src/lib/policy/getPolicy.ts:37` | `OrganizationPolicy` table | Days before expiration to send reminder |

### Scheduling Policies

| Key | Type | Default | Source | Future Storage | Notes |
|-----|------|---------|--------|----------------|-------|
| `scheduling.timezone` | string | "America/Los_Angeles" | `src/lib/policy/getPolicy.ts:40` | `OrganizationPolicy` table | IANA timezone for organization |
| `scheduling.registrationOpenDay` | number | 2 | `src/lib/policy/getPolicy.ts:41` | `OrganizationPolicy` table | Day of week (0=Sun, 2=Tue) |
| `scheduling.registrationOpenHour` | number | 8 | `src/lib/policy/getPolicy.ts:42` | `OrganizationPolicy` table | Hour (0-23) for registration open |
| `scheduling.eventArchiveDays` | number | 30 | `src/lib/policy/getPolicy.ts:43` | `OrganizationPolicy` table | Days after event end to archive |
| `scheduling.announcementDay` | number | 0 | `src/lib/policy/getPolicy.ts:44` | `OrganizationPolicy` table | Day of week for announcements (0=Sun) |
| `scheduling.announcementHour` | number | 8 | `src/lib/policy/getPolicy.ts:45` | `OrganizationPolicy` table | Hour for announcements |

### Governance Policies

| Key | Type | Default | Source | Future Storage | Notes |
|-----|------|---------|--------|----------------|-------|
| `governance.minutesReviewDays` | number | 7 | `src/lib/policy/getPolicy.ts:48` | `OrganizationPolicy` table | Days to review meeting minutes |
| `governance.boardEligibilityDays` | number | 730 | `src/lib/policy/getPolicy.ts:49` | `OrganizationPolicy` table | Membership days for board eligibility |
| `governance.quorumPercentage` | number | 50 | `src/lib/policy/getPolicy.ts:50` | `OrganizationPolicy` table | Percentage for quorum |

### KPI Policies

| Key | Type | Default | Source | Future Storage | Notes |
|-----|------|---------|--------|----------------|-------|
| `kpi.membershipWarningThreshold` | number | 200 | `src/lib/policy/getPolicy.ts:53` | `OrganizationPolicy` table | Membership count warning level |
| `kpi.membershipDangerThreshold` | number | 150 | `src/lib/policy/getPolicy.ts:54` | `OrganizationPolicy` table | Membership count danger level |
| `kpi.eventAttendanceWarningPercent` | number | 50 | `src/lib/policy/getPolicy.ts:55` | `OrganizationPolicy` table | Attendance warning percentage |
| `kpi.eventAttendanceDangerPercent` | number | 25 | `src/lib/policy/getPolicy.ts:56` | `OrganizationPolicy` table | Attendance danger percentage |

### Display Policies

| Key | Type | Default | Source | Future Storage | Notes |
|-----|------|---------|--------|----------------|-------|
| `display.organizationName` | string | "Organization" | `src/lib/policy/getPolicy.ts:59` | `OrganizationPolicy` table | Display name for UI |
| `display.memberTermSingular` | string | "member" | `src/lib/policy/getPolicy.ts:60` | `OrganizationPolicy` table | Term for single member |
| `display.memberTermPlural` | string | "members" | `src/lib/policy/getPolicy.ts:61` | `OrganizationPolicy` table | Term for multiple members |

---

## Platform Invariants

These are **NOT configurable** and are enforced by the platform for security or contractual reasons.

### Security Invariants

| Constant | Type | Value | Source | Reason |
|----------|------|-------|--------|--------|
| `BLOCKED_WHILE_IMPERSONATING` | Capability[] | ["finance:manage", "comms:send", "users:manage", "events:delete", "admin:full"] | `src/lib/auth.ts:375` | Prevents privilege escalation during admin impersonation |

### Type Contracts

| Type | Location | Reason |
|------|----------|--------|
| `GlobalRole` | `src/lib/auth.ts:33-43` | Platform role contract; changing requires migration |
| `Capability` | `src/lib/auth.ts:50-118` | Platform capability contract; defines all possible permissions |
| `EventStatus` | `@prisma/client` | Database schema contract |
| `LifecycleState` | `src/lib/membership/lifecycle.ts:24-33` | State machine contract |

### State Machine Transitions

| Constant | Location | Reason |
|----------|----------|--------|
| `CHAIR_TRANSITIONS` | `src/lib/events/status.ts:107` | Event workflow contract |
| `VP_TRANSITIONS` | `src/lib/events/status.ts:115` | Event workflow contract |
| `CANCELABLE_STATES` | `src/lib/events/status.ts:123` | Event workflow contract |
| `EDITABLE_STATES` | `src/lib/events/status.ts:127` | Event workflow contract |

---

## Candidates for Policy Migration

These are currently hardcoded but **should be migrated** to the policy layer.

### Role Capabilities (High Priority)

| Constant | Type | Source | Priority | Notes |
|----------|------|--------|----------|-------|
| `ROLE_CAPABILITIES` | Record\<GlobalRole, Capability[]\> | `src/lib/auth.ts:136-319` | High | SBNC-specific coupling (RD-002). Must migrate per #262 |
| `ROLE_PRIORITY` | Record\<GlobalRole, number\> | `src/lib/auth.ts:321` | Medium | Role hierarchy may vary by org |
| `COMMITTEE_ROLE_TO_GLOBAL_ROLE` | Record\<string, GlobalRole\> | `src/lib/auth.ts:347` | Medium | Committee slug mappings may vary |

**Proposed keys:**

- `roles.capabilities.{role}` - Capability array for each role
- `roles.priority.{role}` - Priority value for each role

### Event Defaults (Medium Priority)

| Constant | Type | Value | Source | Notes |
|----------|------|-------|--------|-------|
| `DEFAULT_DURATION_MS` | number | 7200000 (2 hours) | `src/lib/events/defaults.ts:14` | Default event duration |
| `SBNC_TIMEZONE` | string | "America/Los_Angeles" | `src/lib/events/scheduling.ts:27` | Duplicates `scheduling.timezone` |
| `DEFAULT_REGISTRATION_OPEN_HOUR` | number | 8 | `src/lib/events/scheduling.ts:30` | Duplicates `scheduling.registrationOpenHour` |
| `ARCHIVE_DAYS_AFTER_END` | number | 30 | `src/lib/events/scheduling.ts:33` | Duplicates `scheduling.eventArchiveDays` |

**Proposed keys:**

- `events.defaultDurationMinutes` - Default event duration in minutes

### Urgency Thresholds (Low Priority)

| Threshold | Type | Value | Source | Notes |
|-----------|------|-------|--------|-------|
| Spots urgent | number | <= 2 | `src/lib/events/defaults.ts:206` | Last few spots trigger urgent |
| Spots high | number | <= 5 | `src/lib/events/defaults.ts:209` | Low spots trigger high |
| Days urgent | number | 0 | `src/lib/events/defaults.ts:216` | Same-day is urgent |
| Days high | number | 1 | `src/lib/events/defaults.ts:219` | Tomorrow is high |
| Days medium | number | 3 | `src/lib/events/defaults.ts:222` | Within 3 days is medium |
| Days low | number | 7 | `src/lib/events/defaults.ts:225` | Within week is low |

**Proposed keys:**

- `urgency.spotsUrgent` - Spots remaining for urgent level
- `urgency.spotsHigh` - Spots remaining for high level
- `urgency.daysUrgent` - Days until event for urgent
- `urgency.daysHigh` - Days until event for high
- `urgency.daysMedium` - Days until event for medium
- `urgency.daysLow` - Days until event for low

### Transition Widget (Low Priority)

| Constant | Type | Value | Source | Notes |
|----------|------|-------|--------|-------|
| `TRANSITION_WIDGET_LEAD_DAYS` | number | 60 | `src/lib/config.ts:17-26` | Days before transition to show widget |

**Proposed key:**

- `governance.transitionWidgetLeadDays` - Days before transition countdown appears

---

## Feature Flags

These are runtime toggles that affect platform behavior (not tenant-specific).

| Flag | Type | Default | Env Var | Source | Notes |
|------|------|---------|---------|--------|-------|
| Webmaster Debug | boolean | false | `WEBMASTER_DEBUG_READONLY` | `src/lib/config.ts:53-55` | Grants webmaster read-only debug access |

---

## API Reference

### Reading Policy Values

```typescript
import { getPolicy, getPolicyDefault } from "@/lib/policy/getPolicy";

// With organization context (future multi-tenant)
const newbieDays = getPolicy("membership.newbieDays", { orgId: "org_123" });

// Get platform default (no org context)
const defaultDays = getPolicyDefault("membership.newbieDays");
```

### Type Safety

```typescript
import type { PolicyKey, PolicyValue } from "@/lib/policy/types";

// PolicyKey is a union of all valid keys
type Key = PolicyKey; // "membership.newbieDays" | "scheduling.timezone" | ...

// PolicyValue extracts the correct type for a key
type Days = PolicyValue<"membership.newbieDays">; // number
type TZ = PolicyValue<"scheduling.timezone">; // string
```

---

## Migration Tracking

| Phase | Status | Issue | Description |
|-------|--------|-------|-------------|
| 1. Policy Layer | Complete | #263 | `getPolicy()` function and type-safe keys |
| 2. Lifecycle Thresholds | Complete | #235 | Membership thresholds use policy layer |
| 3. Role Capabilities | In Progress | #262 | ROLE_CAPABILITIES policy migration |
| 4. Database Storage | Not Started | #275 | `OrganizationPolicy` table and API |
| 5. Admin UI | Not Started | - | Policy editor in admin panel |

---

## References

- [Issue #232](https://github.com/sbnctech/clubos/issues/232) - Policy Configuration Layer
- [Issue #263](https://github.com/sbnctech/clubos/issues/263) - Policy Layer Implementation
- [Issue #275](https://github.com/sbnctech/clubos/issues/275) - Policy Database Storage
- [ARCHITECTURAL_CHARTER.md](../ARCHITECTURAL_CHARTER.md) - Platform principles
