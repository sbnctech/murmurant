<!--
  Copyright © 2025 Murmurant, Inc. All rights reserved.
-->

# Incident Management

This directory contains incident reports and post-incident reviews (PIRs) for the Murmurant platform.

---

## Quick Start

### Creating an Incident Report

1. Copy `templates/INCIDENT_REPORT_TEMPLATE.md` to `YYYY/INC-YYYY-###.md`
2. Fill in all required fields
3. Update as the incident progresses
4. Close when fully resolved

### Creating a PIR

1. Copy `templates/PIR_TEMPLATE.md` to `YYYY/PIR-YYYY-###.md`
2. Schedule PIR meeting within 3 business days of incident
3. Complete PIR document within 7 business days
4. Track action items to completion

---

## Directory Structure

```
incidents/
├── README.md                 # This file
├── templates/
│   ├── INCIDENT_REPORT_TEMPLATE.md
│   └── PIR_TEMPLATE.md
└── YYYY/                     # Year directories
    ├── INC-YYYY-001.md       # Incident reports
    ├── INC-YYYY-002.md
    └── PIR-YYYY-001.md       # Post-incident reviews
```

---

## Naming Conventions

| Type | Format | Example |
|------|--------|---------|
| Incident Report | `INC-YYYY-###` | INC-2025-001 |
| Post-Incident Review | `PIR-YYYY-###` | PIR-2025-001 |

- Numbers are sequential per year, starting at 001
- PIR numbers correspond to the incident they review

---

## Severity Levels

| Level | Definition | Response Time | PIR Required? |
|-------|------------|---------------|---------------|
| SEV-1 | Complete outage, all users affected | Immediate | Yes |
| SEV-2 | Major feature broken, many users affected | < 1 hour | If > 1 hour |
| SEV-3 | Minor feature degraded, some users affected | < 4 hours | No |
| SEV-4 | Cosmetic issue, minimal impact | Next business day | No |

---

## Incident Types

| Code | Type | Description |
|------|------|-------------|
| OUT | Outage | Service unavailable |
| PERF | Performance | Degraded performance |
| SEC | Security | Security incident |
| DATA | Data | Data integrity issue |
| INT | Integration | Third-party integration failure |
| DEP | Deployment | Deployment-related issue |

---

## Workflow

```
Incident Detected
       │
       ▼
┌─────────────────┐
│ Create Incident │
│     Report      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Investigate   │
│   & Mitigate    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Resolve &    │
│  Close Incident │
└────────┬────────┘
         │
         ▼
    PIR Required?
     │         │
    Yes        No
     │         │
     ▼         ▼
┌─────────┐   Done
│   PIR   │
│ Meeting │
└────┬────┘
     │
     ▼
┌─────────────────┐
│  Create PIR     │
│   Document      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Track Action    │
│    Items        │
└────────┬────────┘
         │
         ▼
      Done
```

---

## Retention Policy

| Record Type | Retention Period |
|-------------|------------------|
| Incident Reports | 3 years |
| Post-Incident Reviews | 5 years |
| Action Item Tracking | Until closed + 1 year |

See `docs/OPS/INCIDENT_LOG_POLICY.md` for full policy details.

---

## Action Item Priority

| Priority | Definition | Target Resolution |
|----------|------------|-------------------|
| P1 | Prevents recurrence of SEV-1/2 | 1 week |
| P2 | Improves detection or response | 2 weeks |
| P3 | Nice to have improvement | 1 month |

---

## Related Documents

| Document | Description |
|----------|-------------|
| [INCIDENT_LOG_POLICY.md](../OPS/INCIDENT_LOG_POLICY.md) | Full incident management policy |
| [GO_NOGO_TEMPLATE.md](../OPS/GO_NOGO_TEMPLATE.md) | Deployment decision template |
| [ARCHITECTURAL_CHARTER.md](../ARCHITECTURAL_CHARTER.md) | P7: Observability requirements |

---

## Contact

For questions about incident management processes, contact the operations team.

---

_Last updated: 2025-12-29_
