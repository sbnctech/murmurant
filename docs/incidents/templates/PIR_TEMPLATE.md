<!--
  Copyright © 2025 Murmurant, Inc. All rights reserved.
-->

# Post-Incident Review: PIR-YYYY-###

> Copy this template to `../YYYY/PIR-YYYY-###.md` when creating a new PIR.
> Replace all placeholder values in brackets.

---

## Incident Reference

| Field | Value |
|-------|-------|
| **PIR ID** | PIR-YYYY-### |
| **Incident ID** | INC-YYYY-### |
| **Incident Date** | YYYY-MM-DD |
| **PIR Date** | YYYY-MM-DD |
| **Facilitator** | _[Name]_ |

### Attendees

| Name | Role |
|------|------|
| _[Name]_ | _[Role]_ |
| _[Name]_ | _[Role]_ |

---

## Executive Summary

_[2-3 sentence summary suitable for leadership. Focus on: what happened, impact, and key remediation.]_

---

## Incident Recap

### What Happened

_[Brief narrative of the incident from detection to resolution. 3-5 paragraphs maximum.]_

### Impact Summary

| Metric | Value |
|--------|-------|
| Duration | _[X hours Y minutes]_ |
| Users Affected | _[Number or percentage]_ |
| Revenue Impact | _[If applicable]_ |
| Data Impact | _[If applicable]_ |

---

## Timeline (Detailed)

| Time (UTC) | Event | Actor |
|------------|-------|-------|
| HH:MM | _[Event description]_ | _[Who/What]_ |
| HH:MM | _[Event description]_ | _[Who/What]_ |

---

## Contributing Factors

_List the factors that contributed to this incident occurring. Be specific and blameless._

### Technical Factors

1. _[Technical factor 1 - e.g., "Missing input validation on API endpoint"]_
2. _[Technical factor 2]_

### Process Factors

1. _[Process factor 1 - e.g., "No runbook for this failure mode"]_
2. _[Process factor 2]_

### Environmental Factors

1. _[Environmental factor 1 - e.g., "Unusual traffic spike from marketing campaign"]_
2. _[Environmental factor 2]_

---

## Root Cause Analysis

### Primary Root Cause

_[The fundamental reason the incident occurred. Use "5 Whys" or similar technique.]_

### Why Chain

1. **Why** did the incident occur? _[Answer]_
2. **Why** did that happen? _[Answer]_
3. **Why** did that happen? _[Answer]_
4. **Why** did that happen? _[Answer]_
5. **Why** did that happen? _[Root cause]_

---

## What Went Well

_Acknowledge things that worked during incident response._

- _[Example: "Alert fired within 2 minutes of failure"]_
- _[Example: "Team assembled quickly via Slack"]_
- _[Example: "Rollback procedure worked as documented"]_

---

## What Could Be Improved

_Identify areas for improvement without blame._

- _[Example: "Took 30 minutes to identify which service was failing"]_
- _[Example: "Had to manually check logs across 5 systems"]_
- _[Example: "Communication to users was delayed"]_

---

## Action Items

| ID | Action | Owner | Priority | Due Date | Status | Tracking |
|----|--------|-------|----------|----------|--------|----------|
| 1 | _[Specific, actionable item]_ | _[Name]_ | P1 | YYYY-MM-DD | Open | _[Issue #]_ |
| 2 | _[Specific, actionable item]_ | _[Name]_ | P2 | YYYY-MM-DD | Open | _[Issue #]_ |

### Action Item Categories

- **Prevention**: Actions that prevent this incident from recurring
- **Detection**: Actions that improve detection time
- **Response**: Actions that improve response time or effectiveness
- **Recovery**: Actions that improve recovery time

---

## Detection & Response Metrics

| Metric | Value | Target | Met? |
|--------|-------|--------|------|
| Time to Detect (TTD) | _[X minutes]_ | < 5 min | Yes/No |
| Time to Respond (TTR) | _[X minutes]_ | < 15 min | Yes/No |
| Time to Mitigate (TTM) | _[X minutes]_ | < 1 hour | Yes/No |
| Time to Resolve (TTRes) | _[X hours]_ | < 4 hours | Yes/No |

### Metric Definitions

- **TTD**: Time from incident start to first alert/detection
- **TTR**: Time from detection to first responder engaged
- **TTM**: Time from detection to user impact mitigated
- **TTRes**: Time from detection to full resolution

---

## Recurrence Prevention

_What systemic changes will prevent this class of incident from happening again?_

### Short-term (This Sprint)

- _[Immediate fix or workaround]_

### Medium-term (This Quarter)

- _[More substantial improvement]_

### Long-term (Future)

- _[Architectural or process changes]_

---

## Monitoring & Alerting Changes

| Change | Type | Status |
|--------|------|--------|
| _[New alert for X condition]_ | New Alert | _[Done/Planned]_ |
| _[Updated threshold for Y]_ | Modified | _[Done/Planned]_ |
| _[New dashboard for Z]_ | Dashboard | _[Done/Planned]_ |

---

## Documentation Updates

| Document | Change | Status |
|----------|--------|--------|
| _[Runbook name]_ | _[What was updated]_ | _[Done/Planned]_ |
| _[Architecture doc]_ | _[What was updated]_ | _[Done/Planned]_ |

---

## Follow-up Schedule

| Date | Activity | Owner |
|------|----------|-------|
| +1 week | Review action item progress | _[Name]_ |
| +2 weeks | Verify monitoring changes | _[Name]_ |
| +1 month | Close PIR if all items complete | _[Name]_ |

---

## Appendix

### Related Links

| Resource | Link |
|----------|------|
| Incident Report | [INC-YYYY-###](./INC-YYYY-###.md) |
| Monitoring Dashboard | _[Link]_ |
| Relevant Logs | _[Link or location]_ |
| Slack Thread | _[Link]_ |

### Meeting Recording

_[Link to recording if available, or "Not recorded"]_

### Raw Notes

_[Any additional notes from the PIR meeting that don't fit elsewhere]_

---

## Sign-off

| Role | Name | Date | Approved |
|------|------|------|----------|
| Facilitator | _[Name]_ | YYYY-MM-DD | Yes |
| Incident Commander | _[Name]_ | YYYY-MM-DD | Yes |
| Technical Lead | _[Name]_ | YYYY-MM-DD | Yes |

---

## Metadata

| Field | Value |
|-------|-------|
| Created | YYYY-MM-DD |
| Last Updated | YYYY-MM-DD |
| Status | _[Draft / In Review / Final]_ |
| Next Review | YYYY-MM-DD |

---

_Template version 1.0 - See INCIDENT_LOG_POLICY.md for usage guidelines_
