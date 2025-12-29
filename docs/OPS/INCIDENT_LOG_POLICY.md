<!--
  Copyright © 2025 Murmurant, Inc. All rights reserved.
-->

# Incident Log Storage and Retention Policy

```
Status: PROPOSED
Version: 1.0
Created: 2025-12-29
Related: WORK_QUEUE.md D4, ARCHITECTURAL_CHARTER.md P7
```

---

## 1. Overview

This document defines where and how incident logs are stored, retained, and
accessed. Per Charter P7 (observability is a product feature), incidents must
be tracked, attributable, and available for post-incident review.

### 1.1 Scope

This policy covers:
- Production incidents (outages, degradations, security events)
- Near-misses (issues caught before user impact)
- Post-incident reviews (PIRs/postmortems)
- Operator actions during incidents

---

## 2. Storage Location

### 2.1 Primary Storage (Phase 1: Manual)

During initial deployment, incident logs are stored manually:

| Type | Location | Format |
|------|----------|--------|
| Incident Reports | `docs/incidents/YYYY/` | Markdown files |
| Post-Incident Reviews | `docs/incidents/YYYY/PIR-###.md` | Markdown template |
| Timeline Logs | Same as incident report | Section within report |
| Action Items | GitHub Issues | Labeled `incident-followup` |

**Directory Structure:**
```
docs/
└── incidents/
    ├── 2025/
    │   ├── INC-2025-001.md
    │   ├── INC-2025-002.md
    │   └── PIR-2025-001.md
    ├── templates/
    │   ├── INCIDENT_REPORT_TEMPLATE.md
    │   └── PIR_TEMPLATE.md
    └── README.md
```

### 2.2 Future Storage (Phase 2: Automated)

When automated incident management is implemented:

| Type | Location | Format |
|------|----------|--------|
| Incident Records | Database (Incident table) | Structured data |
| Audit Logs | Append-only log table | JSON events |
| Metrics | Observability stack | Time-series |
| Alerts | Alert management system | Structured alerts |

---

## 3. Retention Policy

### 3.1 Retention Periods

| Record Type | Retention | Rationale |
|-------------|-----------|-----------|
| Incident Reports | 3 years | Legal/compliance, trend analysis |
| Post-Incident Reviews | 5 years | Learning, pattern recognition |
| Audit Logs | 1 year (min) | Security, compliance |
| Alert History | 90 days | Operational analysis |
| Metrics Data | 13 months | Year-over-year comparison |

### 3.2 Retention Actions

| Period | Action |
|--------|--------|
| 0-90 days | Full detail retained, immediately accessible |
| 90 days - 1 year | Archived but accessible on request |
| 1-3 years | Summarized, full detail available on request |
| 3+ years | Anonymized summaries only, detail deleted |

### 3.3 Exceptions

Extended retention may be required for:
- Ongoing legal proceedings
- Regulatory investigations
- Unresolved security incidents
- Recurring incident patterns under investigation

---

## 4. Incident Classification

### 4.1 Severity Levels

| Severity | Definition | Response Time | Example |
|----------|------------|---------------|---------|
| SEV-1 | Complete outage, all users affected | Immediate | Site down |
| SEV-2 | Major feature broken, many users affected | < 1 hour | Can't register |
| SEV-3 | Minor feature degraded, some users affected | < 4 hours | Slow search |
| SEV-4 | Cosmetic issue, minimal impact | Next business day | UI glitch |

### 4.2 Incident Types

| Type | Code | Description |
|------|------|-------------|
| Outage | OUT | Service unavailable |
| Performance | PERF | Degraded performance |
| Security | SEC | Security incident |
| Data | DATA | Data integrity issue |
| Integration | INT | Third-party integration failure |
| Deployment | DEP | Deployment-related issue |

---

## 5. Incident Report Template

### 5.1 Required Fields

```markdown
# Incident Report: INC-YYYY-###

## Summary
| Field | Value |
|-------|-------|
| Incident ID | INC-YYYY-### |
| Date/Time | YYYY-MM-DD HH:MM UTC |
| Duration | X hours Y minutes |
| Severity | SEV-1/2/3/4 |
| Type | OUT/PERF/SEC/DATA/INT/DEP |
| Status | Open/Resolved/Closed |

## Impact
- Users affected: [number or percentage]
- Features affected: [list]
- Revenue impact: [if applicable]

## Timeline
| Time (UTC) | Event |
|------------|-------|
| HH:MM | First alert fired |
| HH:MM | Incident declared |
| HH:MM | Mitigation started |
| HH:MM | Service restored |
| HH:MM | Incident closed |

## Root Cause
[Brief description of what caused the incident]

## Resolution
[What was done to fix it]

## Action Items
- [ ] [Action 1] - Owner: [name] - Due: [date]
- [ ] [Action 2] - Owner: [name] - Due: [date]

## Lessons Learned
[Key takeaways for preventing recurrence]
```

---

## 6. Post-Incident Review (PIR)

### 6.1 When Required

PIR is required for:
- All SEV-1 incidents
- SEV-2 incidents lasting > 1 hour
- Any security incident
- Recurring incidents (3+ occurrences)
- Incidents with customer impact

### 6.2 PIR Timeline

| Activity | Deadline |
|----------|----------|
| Incident report completed | Within 24 hours |
| PIR meeting scheduled | Within 3 business days |
| PIR document drafted | Within 5 business days |
| Action items assigned | At PIR meeting |
| PIR published | Within 7 business days |

### 6.3 PIR Template

```markdown
# Post-Incident Review: PIR-YYYY-###

## Incident Reference
- Incident ID: INC-YYYY-###
- PIR Date: YYYY-MM-DD
- Facilitator: [name]
- Attendees: [list]

## Executive Summary
[2-3 sentence summary for leadership]

## Incident Recap
[Brief recap of what happened]

## Contributing Factors
1. [Factor 1 - what contributed to the incident]
2. [Factor 2]
3. [Factor 3]

## What Went Well
- [Thing that worked during response]
- [Another thing]

## What Could Be Improved
- [Area for improvement]
- [Another area]

## Action Items
| ID | Action | Owner | Priority | Due Date | Status |
|----|--------|-------|----------|----------|--------|
| 1 | | | P1/P2/P3 | | |
| 2 | | | P1/P2/P3 | | |

## Detection & Response Metrics
- Time to detect: X minutes
- Time to respond: X minutes
- Time to mitigate: X minutes
- Time to resolve: X hours

## Recurrence Prevention
[What systemic changes will prevent this class of incident]
```

---

## 7. Access Control

### 7.1 Access Levels

| Role | Can View | Can Create | Can Edit | Can Delete |
|------|----------|------------|----------|------------|
| Operator | All incidents | Yes | Own incidents | No |
| Admin | All incidents | Yes | All incidents | With approval |
| Auditor | All incidents | No | No | No |
| Member | None | No | No | No |

### 7.2 Sensitive Incidents

Security incidents (SEC type) may be restricted:
- Initial access: Incident responders only
- Post-resolution: Expand to operators
- Public summary: Anonymized if published

---

## 8. Reporting

### 8.1 Regular Reports

| Report | Frequency | Audience | Content |
|--------|-----------|----------|---------|
| Weekly Ops Summary | Weekly | Operators | Open incidents, trends |
| Monthly Incident Report | Monthly | Leadership | Stats, patterns, progress |
| Quarterly Review | Quarterly | Stakeholders | Trends, investments needed |

### 8.2 Metrics to Track

| Metric | Definition | Target |
|--------|------------|--------|
| MTTR | Mean time to resolve | < 1 hour (SEV-1/2) |
| MTTD | Mean time to detect | < 5 minutes |
| Incident Rate | Incidents per month | Decreasing trend |
| Recurrence Rate | Repeat incidents | < 10% |
| PIR Completion | PIRs completed on time | 100% |
| Action Item Closure | Items closed by due date | > 90% |

---

## 9. Integration Points

### 9.1 Current (Manual)

| System | Integration | Purpose |
|--------|-------------|---------|
| GitHub Issues | Manual creation | Action item tracking |
| Slack | Manual posting | Real-time updates |
| Email | Manual sending | Stakeholder notification |

### 9.2 Future (Automated)

| System | Integration | Purpose |
|--------|-------------|---------|
| PagerDuty/Opsgenie | API | Alert routing |
| Datadog/Grafana | Webhook | Metric correlation |
| Jira/Linear | API | Action item sync |
| Slack | Bot | Automated updates |

---

## 10. Compliance

### 10.1 Audit Requirements

Incident logs must support:
- Who was notified and when
- What actions were taken and by whom
- When the incident was opened and closed
- What data was potentially affected

### 10.2 Privacy Considerations

Incident logs must NOT contain:
- Raw PII (use anonymized identifiers)
- Authentication credentials
- Encryption keys or secrets
- Detailed vulnerability information (before patch)

---

## 11. Implementation Checklist

### Phase 1 (Immediate - Manual)

- [ ] Create `docs/incidents/` directory structure
- [ ] Add incident report template
- [ ] Add PIR template
- [ ] Document in runbook
- [ ] Train operators on process

### Phase 2 (Future - Automated)

- [ ] Implement Incident database model
- [ ] Build incident creation UI
- [ ] Add alert integration
- [ ] Create dashboards
- [ ] Automate reports

---

_Policy version 1.0 - Last updated 2025-12-29_
