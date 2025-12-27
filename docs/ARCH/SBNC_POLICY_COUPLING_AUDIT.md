# SBNC Policy Coupling Audit

This document inventories SBNC-specific policy constants, strings, and business logic hard-coded in the codebase. These couplings would need to be parameterized for multi-tenant or white-label deployment.

**Generated:** 2025-12-23
**Epic:** #232 (Tenant Decoupling)
**Issue:** #262

---

## Summary

| Category | Count | Risk Level |
|----------|-------|------------|
| Membership Lifecycle | 6 | High |
| Role Definitions | 10 | High |
| Governance Workflows | 8 | Medium |
| Scheduling/Timezone | 12 | Medium |
| Fee Structures | 4 | High |
| Organization Identity | 15 | Low |
| KPI/Alert Thresholds | 6 | Medium |
| Demo/Test Fixtures | 8 | Low |

**Total Coupling Points:** 69

---

## Coupling Inventory

| ID | File | Line(s) | Hard-coded Value | Category | Why SBNC-specific | Proposed Config Home | Notes |
|----|------|---------|------------------|----------|-------------------|---------------------|-------|
| ML-001 | `src/lib/membership/lifecycle.ts` | 97 | `90` | Membership Lifecycle | SBNC defines 90-day newbie period | `tenant.membership.newbiePeriodDays` | Used in multiple places |
| ML-002 | `src/lib/membership/lifecycle.ts` | 98 | `730` | Membership Lifecycle | SBNC defines 2-year mark for extended offer | `tenant.membership.twoYearMarkDays` | Business rule |
| ML-003 | `src/lib/membership/lifecycle.ts` | 103 | `"Active Newbie"` | Membership Lifecycle | SBNC-specific tier label | `tenant.membership.tierLabels` | UI labels |
| ML-004 | `src/lib/membership/lifecycle.ts` | 115-116 | Tier descriptions | Membership Lifecycle | SBNC narrative text | `tenant.membership.tierDescriptions` | User-facing text |
| ML-005 | `src/lib/importing/wildapricot/config.ts` | 87 | `730` (eventsLookbackDays) | Membership Lifecycle | 2-year lookback for WA sync | `tenant.import.lookbackDays` | Import setting |
| ML-006 | `src/lib/email/tracking.ts` | 69 | `90` (retentionDays) | Membership Lifecycle | Email log retention policy | `tenant.email.retentionDays` | Compliance |
| RD-001 | `src/lib/auth.ts` | 33-43 | `GlobalRole` type | Role Definitions | SBNC officer structure | `tenant.roles.definitions` | Core architecture |
| RD-002 | `src/lib/auth.ts` | 136-300 | `ROLE_CAPABILITIES` | Role Definitions | SBNC role permissions | `tenant.roles.capabilities` | Per-role permissions |
| RD-003 | `src/lib/auth.ts` | 363-383 | `COMMITTEE_ROLE_TO_GLOBAL_ROLE` | Role Definitions | SBNC committee slugs | `tenant.committees.roleMapping` | Maps committees to roles |
| RD-004 | `src/lib/auth.ts` | 420-430 | `ROLE_PRIORITY` | Role Definitions | SBNC role precedence | `tenant.roles.priority` | For multi-role users |
| RD-005 | `src/lib/auth.ts` | 13-31 | Role descriptions (comments) | Role Definitions | SBNC role semantics | Documentation | Comments only |
| RD-006 | `src/lib/serviceHistory/approvals.ts` | 23 | `"President"`, `"VP Activities"` | Role Definitions | SBNC officer titles | `tenant.roles.displayNames` | UI labels |
| RD-007 | `src/lib/serviceHistory/approvals.ts` | 75, 91-92 | `"president"`, `"vp-activities"` | Role Definitions | SBNC approver roles | `tenant.workflows.approvers` | Workflow config |
| RD-008 | `src/lib/governance/minutes.ts` | 17, 67-73 | President/Secretary workflow | Role Definitions | SBNC minutes approval chain | `tenant.governance.minutesWorkflow` | Approval workflow |
| RD-009 | `src/app/api/admin/demo/scenarios/route.ts` | 170+ | `ROLE_DEFINITIONS` array | Role Definitions | Demo role setup | Test fixtures | Demo only |
| RD-010 | `src/lib/publishing/permissions.ts` | 183 | `"ROLE_RESTRICTED"` | Role Definitions | Visibility enum | Schema constant | May be universal |
| GW-001 | `src/lib/serviceHistory/transitionWidget.ts` | 6-12 | Feb 1 / Aug 1 transitions | Governance Workflows | SBNC semi-annual terms | `tenant.governance.transitionDates` | Core workflow |
| GW-002 | `src/lib/serviceHistory/transitionWidget.ts` | 9-10 | Winter/Summer term names | Governance Workflows | SBNC term naming | `tenant.governance.termNames` | UI labels |
| GW-003 | `src/lib/serviceHistory/scheduler.ts` | 74-80 | Feb 1 / Aug 1 dates | Governance Workflows | Transition schedule | `tenant.governance.transitionDates` | Cron timing |
| GW-004 | `src/lib/governance/schemas.ts` | 17 | `["BOARD", "EXECUTIVE", "SPECIAL", "ANNUAL"]` | Governance Workflows | SBNC meeting types | `tenant.governance.meetingTypes` | Schema enum |
| GW-005 | `src/lib/governance/schemas.ts` | 25, 32 | `quorumMet` field | Governance Workflows | Quorum tracking | Universal | May be universal |
| GW-006 | `src/lib/governance/schemas.ts` | 93-95 | Vote tally fields | Governance Workflows | Voting structure | Universal | May be universal |
| GW-007 | `src/lib/policies/boardDecisions.ts` | 12 | `"sbnc"` | Governance Workflows | Organization identifier | `tenant.id` | Tenant key |
| GW-008 | `src/app/api/cron/transitions/route.ts` | 11-12 | 8:00 UTC cron time | Governance Workflows | Pacific midnight trigger | `tenant.cron.transitionTime` | Cron schedule |
| TZ-001 | `src/lib/timezone.ts` | 1 | `"America/Los_Angeles"` | Scheduling/Timezone | SBNC location | `tenant.timezone` | Core setting |
| TZ-002 | `src/lib/events/scheduling.ts` | 27 | `SBNC_TIMEZONE = "America/Los_Angeles"` | Scheduling/Timezone | Event scheduling | `tenant.timezone` | Exported constant |
| TZ-003 | `src/lib/events/scheduling.ts` | 30 | `8` (8:00 AM) | Scheduling/Timezone | Registration open time | `tenant.events.registrationOpenHour` | Business rule |
| TZ-004 | `src/lib/events/scheduling.ts` | 6-7 | Sunday announce, Tuesday open | Scheduling/Timezone | eNews publication cycle | `tenant.events.publicationSchedule` | SBNC workflow |
| TZ-005 | `src/lib/events/scheduling.ts` | 248 | `"SBNC policy: Announce in eNews..."` | Scheduling/Timezone | Policy explanation string | `tenant.events.scheduleExplanation` | UI text |
| TZ-006 | `src/lib/events/scheduling.ts` | 112-142 | `getNextSunday()` logic | Scheduling/Timezone | Sunday-based schedule | `tenant.events.publicationDayOfWeek` | Could be parameterized |
| TZ-007 | `src/lib/events/scheduling.ts` | 163-169 | `getFollowingTuesday()` logic | Scheduling/Timezone | Tuesday registration open | `tenant.events.registrationOpenDayOffset` | Could be parameterized |
| TZ-008 | `src/lib/events/index.ts` | 62 | Comment: "SBNC Sunday/Tuesday policy" | Scheduling/Timezone | Documentation | Documentation | Comment only |
| TZ-009 | `src/lib/serviceHistory/transitionWidget.ts` | 37-44 | PST/PDT offset logic | Scheduling/Timezone | Pacific time handling | `tenant.timezone` | DST handling |
| TZ-010 | `src/lib/serviceHistory/scheduler.ts` | 8-9 | 8:00 UTC reference | Scheduling/Timezone | Pacific midnight in UTC | Derived from timezone | Calculation |
| TZ-011 | `src/app/api/v1/admin/communications/enews-week/route.ts` | 30, 164 | `SBNC_TIMEZONE` import | Scheduling/Timezone | eNews week calculation | `tenant.timezone` | API route |
| TZ-012 | `src/lib/events/scheduling.ts` | 70 | `"ARCHIVED"` comment: "Past archive threshold" | Scheduling/Timezone | Archive timing | `tenant.events.archiveDaysAfterEnd` | Implied constant |
| FE-001 | `src/lib/finance/personify-fees.ts` | 24 | `0.029` (2.9%) | Fee Structures | Personify standard rate | `tenant.payments.standardPercent` | Payment processor |
| FE-002 | `src/lib/finance/personify-fees.ts` | 29 | `0.035` (3.5%) | Fee Structures | Personify AmEx rate | `tenant.payments.amexPercent` | Payment processor |
| FE-003 | `src/lib/finance/personify-fees.ts` | 34 | `0.30` ($0.30) | Fee Structures | Personify flat fee | `tenant.payments.flatFee` | Payment processor |
| FE-004 | `src/lib/finance/personify-fees.ts` | 7-10 | Fee structure comments | Fee Structures | Documentation | Documentation | Comments |
| OI-001 | `src/lib/publishing/email.ts` | 35 | `"Santa Barbara Newcomers Club"` | Organization Identity | Club name | `tenant.name` | Branding |
| OI-002 | `src/lib/publishing/email.ts` | 36 | `"https://sbnewcomers.org"` | Organization Identity | Website URL | `tenant.website` | Branding |
| OI-003 | `src/lib/publishing/email.ts` | 37 | `"info@sbnewcomers.org"` | Organization Identity | Contact email | `tenant.email` | Branding |
| OI-004 | `src/lib/serviceHistory/proseGenerator.ts` | 144-149 | `"Santa Barbara Newcomers Club"` | Organization Identity | Narrative text | `tenant.name` | Generated prose |
| OI-005 | `src/lib/serviceHistory/proseGenerator.ts` | 356 | `"Santa Barbara Newcomers Club"` | Organization Identity | Header text | `tenant.name` | Generated prose |
| OI-006 | `src/app/api/admin/comms/campaigns/[id]/route.ts` | 314-316 | Club name, website, email | Organization Identity | Campaign footer | `tenant.*` | Email templates |
| OI-007 | `src/app/api/admin/comms/campaigns/[id]/route.ts` | 481-483 | Club name, website, email | Organization Identity | Campaign footer | `tenant.*` | Duplicate |
| OI-008 | `src/app/api/v1/policies/[id]/export-pdf/route.ts` | 381 | `"Santa Barbara Newcomers Club - Club Policy"` | Organization Identity | PDF footer | `tenant.name` | PDF export |
| OI-009 | `src/app/api/v1/policies/export-pdf/route.ts` | 145, 430, 450 | Club name in PDF | Organization Identity | PDF header/footer | `tenant.name` | PDF export |
| OI-010 | `src/app/api/v1/docs/openapi/route.ts` | 21 | `"Santa Barbara Newcomers Club"` | Organization Identity | API docs | `tenant.name` | OpenAPI spec |
| OI-011 | `src/app/api/v1/docs/openapi/route.ts` | 25 | `"github.com/sbnewcomers/clubos"` | Organization Identity | GitHub URL | `tenant.sourceRepo` | OpenAPI spec |
| OI-012 | `src/lib/passkey/config.ts` | 8-10 | SBNC domain examples | Organization Identity | Config comments | Documentation | Comments |
| OI-013 | `src/lib/passkey/config.ts` | 63, 102 | `"sbnc.club"` examples | Organization Identity | Config comments | Documentation | Comments |
| OI-014 | `src/lib/config/externalLinks.ts` | 16, 23 | `"sbnewcomers.org"` URLs | Organization Identity | External links | `tenant.externalLinks` | Gift certificates, etc. |
| OI-015 | `src/app/api/admin/members/[id]/history/route.ts` | 43 | `"Santa Barbara Newcomers Club"` | Organization Identity | History narrative | `tenant.name` | Generated prose |
| KP-001 | `src/lib/email/tracking.ts` | 474 | `5` (5% bounce threshold) | KPI/Alert Thresholds | Email health alert | `tenant.email.bounceThreshold` | Alert config |
| KP-002 | `src/lib/email/tracking.ts` | 484 | `0.1` (0.1% complaint threshold) | KPI/Alert Thresholds | Email health alert | `tenant.email.complaintThreshold` | Alert config |
| KP-003 | `src/lib/email/tracking.ts` | 491, 494 | `90` (90% delivery threshold) | KPI/Alert Thresholds | Email health alert | `tenant.email.deliveryThreshold` | Alert config |
| KP-004 | `src/lib/kpi/defaults.ts` | 46-50 | KPI warning/danger thresholds | KPI/Alert Thresholds | Membership health | `tenant.kpi.thresholds` | Multiple thresholds |
| KP-005 | `src/app/api/v1/officer/communications/dashboard/route.ts` | 266 | `75` (75% capacity threshold) | KPI/Alert Thresholds | Events filling fast | `tenant.events.fillingFastThreshold` | Dashboard |
| KP-006 | `src/lib/importing/wildapricot/importer.ts` | 895, 898 | `100`, `10` | KPI/Alert Thresholds | Suspicious sync thresholds | `tenant.import.suspiciousThresholds` | Import warnings |
| DM-001 | `scripts/importing/seed_demo_members.ts` | 100-181 | `@sbnc.example` emails | Demo/Test Fixtures | Demo member emails | Test fixtures | Demo only |
| DM-002 | `scripts/demo/seed_demo_scenarios.ts` | 103 | `"sbnc.example"` domain | Demo/Test Fixtures | Demo email domain | Test fixtures | Demo only |
| DM-003 | `src/app/api/admin/demo/lifecycle-members/route.ts` | 69-76, 89 | `@sbnc.example` emails | Demo/Test Fixtures | Demo member lookup | Test fixtures | Demo only |
| DM-004 | `tests/api/demo-lifecycle-members.spec.ts` | 45-52 | `@sbnc.example` emails | Demo/Test Fixtures | Test expectations | Test fixtures | Test only |
| DM-005 | `tests/api/admin-demo.spec.ts` | 157-174 | `@sbnc.example` emails | Demo/Test Fixtures | Test expectations | Test fixtures | Test only |
| DM-006 | `prisma/seed.ts` | 91 | `"New member within first 2 years"` | Demo/Test Fixtures | Seed description | Test fixtures | Seed only |
| DM-007 | `scripts/importing/seed_demo_members.ts` | 114, 136 | `80`, `750` days ago | Demo/Test Fixtures | Demo lifecycle states | Test fixtures | Demo only |
| DM-008 | `src/app/api/admin/demo/scenarios/route.ts` | 98-104 | Demo scenario descriptions | Demo/Test Fixtures | Demo UI | Test fixtures | Demo only |

---

## Risk Assessment

### High Risk (Requires Tenant Parameterization)

1. **Membership Lifecycle Thresholds** - Core business rules that differ between clubs
2. **Role Definitions** - Officer structures vary significantly
3. **Fee Structures** - Payment processor rates are vendor-specific

### Medium Risk (Configurable but Less Critical)

1. **Governance Workflows** - Meeting types, approval chains
2. **Scheduling/Timezone** - Location-dependent
3. **KPI Thresholds** - May need tuning per tenant

### Low Risk (Cosmetic/Branding)

1. **Organization Identity** - Easily templated
2. **Demo/Test Fixtures** - Isolated to test code

---

## Recommended Decoupling Approach

### Phase 1: Configuration Layer

Create `TenantConfig` interface:

```typescript
interface TenantConfig {
  id: string;
  name: string;
  website: string;
  email: string;
  timezone: string;

  membership: {
    newbiePeriodDays: number;      // Default: 90
    twoYearMarkDays: number;       // Default: 730
    tierLabels: Record<string, string>;
  };

  events: {
    publicationDayOfWeek: number;  // 0 = Sunday
    registrationOpenDayOffset: number;  // 2 = Tuesday
    registrationOpenHour: number;  // 8 = 8:00 AM
  };

  governance: {
    transitionDates: Array<{ month: number; day: number }>;
    termNames: string[];
    meetingTypes: string[];
  };

  roles: {
    definitions: GlobalRole[];
    capabilities: Record<string, Capability[]>;
    displayNames: Record<string, string>;
  };
}
```

### Phase 2: Extraction

1. Replace hard-coded constants with config lookups
2. Add tenant context to API routes
3. Template organization identity in email/PDF exports

### Phase 3: Validation

1. Add contract tests for config defaults
2. Verify backward compatibility with SBNC as default tenant

---

## References

- Epic #232: Tenant Decoupling
- Issue #262: SBNC Policy Coupling Inventory
- `docs/ARCHITECTURAL_CHARTER.md` - P4 (No hidden rules)
