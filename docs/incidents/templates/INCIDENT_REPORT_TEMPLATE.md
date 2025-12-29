<!--
  Copyright © 2025 Murmurant, Inc. All rights reserved.
-->

# Incident Report: INC-YYYY-###

> Copy this template to `../YYYY/INC-YYYY-###.md` when creating a new incident report.
> Replace all placeholder values in brackets.

---

## Summary

| Field | Value |
|-------|-------|
| **Incident ID** | INC-YYYY-### |
| **Date/Time** | YYYY-MM-DD HH:MM UTC |
| **Duration** | _[X hours Y minutes]_ |
| **Severity** | _[SEV-1 / SEV-2 / SEV-3 / SEV-4]_ |
| **Type** | _[OUT / PERF / SEC / DATA / INT / DEP]_ |
| **Status** | _[Open / Mitigated / Resolved / Closed]_ |
| **Reporter** | _[Name]_ |
| **Incident Commander** | _[Name]_ |

### Severity Reference

| Level | Definition |
|-------|------------|
| SEV-1 | Complete outage, all users affected |
| SEV-2 | Major feature broken, many users affected |
| SEV-3 | Minor feature degraded, some users affected |
| SEV-4 | Cosmetic issue, minimal impact |

### Type Reference

| Code | Description |
|------|-------------|
| OUT | Service unavailable |
| PERF | Degraded performance |
| SEC | Security incident |
| DATA | Data integrity issue |
| INT | Third-party integration failure |
| DEP | Deployment-related issue |

---

## Impact

### Users Affected

_[Number or percentage of users affected]_

### Features Affected

- _[Feature 1]_
- _[Feature 2]_

### Business Impact

_[Revenue impact, reputation impact, compliance impact if applicable]_

---

## Timeline

| Time (UTC) | Event |
|------------|-------|
| HH:MM | _[First symptoms observed / alert fired]_ |
| HH:MM | _[Incident declared]_ |
| HH:MM | _[Investigation started]_ |
| HH:MM | _[Root cause identified]_ |
| HH:MM | _[Mitigation started]_ |
| HH:MM | _[Service restored]_ |
| HH:MM | _[Incident closed]_ |

---

## Root Cause

_[Brief description of what caused the incident. Be specific about the technical failure or human error that led to the incident.]_

---

## Resolution

_[What was done to fix the issue. Include specific commands, config changes, or code deployments.]_

---

## Detection

### How Was It Detected?

- [ ] Automated monitoring/alerting
- [ ] User report
- [ ] Internal discovery
- [ ] External party notification

### Detection Gap (if applicable)

_[If detection was delayed, explain why and how to improve]_

---

## Communication

| Audience | Channel | Time | Message Summary |
|----------|---------|------|-----------------|
| _[Internal team]_ | _[Slack]_ | HH:MM | _[Summary]_ |
| _[Users]_ | _[Email]_ | HH:MM | _[Summary]_ |
| _[Stakeholders]_ | _[Email]_ | HH:MM | _[Summary]_ |

---

## Action Items

| ID | Action | Owner | Priority | Due Date | Status |
|----|--------|-------|----------|----------|--------|
| 1 | _[Action description]_ | _[Name]_ | P1/P2/P3 | YYYY-MM-DD | Open |
| 2 | _[Action description]_ | _[Name]_ | P1/P2/P3 | YYYY-MM-DD | Open |

### Priority Reference

| Priority | Definition | Target Resolution |
|----------|------------|-------------------|
| P1 | Prevents recurrence of SEV-1/2 | 1 week |
| P2 | Improves detection or response | 2 weeks |
| P3 | Nice to have improvement | 1 month |

---

## Lessons Learned

### What Went Well

- _[Thing that worked during the response]_
- _[Another positive observation]_

### What Could Be Improved

- _[Area for improvement]_
- _[Another improvement opportunity]_

---

## Related Documents

| Document | Link |
|----------|------|
| PIR (if applicable) | _[Link to PIR-YYYY-###.md]_ |
| Related incident | _[Link if this is related to another incident]_ |
| Monitoring dashboard | _[Link]_ |
| Runbook used | _[Link]_ |

---

## Metadata

| Field | Value |
|-------|-------|
| Created | YYYY-MM-DD |
| Last Updated | YYYY-MM-DD |
| PIR Required | _[Yes / No]_ |
| PIR Completed | _[Yes / No / N/A]_ |

---

_Template version 1.0 - See INCIDENT_LOG_POLICY.md for usage guidelines_
