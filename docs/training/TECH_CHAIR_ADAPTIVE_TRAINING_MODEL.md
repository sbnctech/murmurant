# Tech Chair Adaptive Training Model

Worker 4 — Q-032 Adaptive Tech Chair Training — Report

## Purpose

Design training that adapts to vastly different Tech Chair experience levels,
addressing each archetype's specific fears, needs, and learning preferences.

---

## Tech Chair Archetypes

### Archetype A: Volunteer Operator

Profile: Non-technical volunteer who accepted the role because they are
"good with computers" (meaning they can use email and browse the web).
No programming or system administration background. Often inherited the
role unexpectedly when the previous Tech Chair left.

Experience level: Minimal technical experience.
Typical background: Retired teacher, administrator, or manager.
Time in role: Often new or recently appointed.

### Archetype B: Reluctant Inheritor

Profile: Technically capable individual who did not seek the Tech Chair
role but accepted it out of obligation or because no one else would.
Has some technical skills but limited time and motivation to go deep.
Wants to fulfill responsibilities without becoming the permanent expert.

Experience level: Moderate technical comfort.
Typical background: Former IT user support, office technology coordinator.
Time in role: Variable; may be actively seeking a successor.

### Archetype C: Engineering Steward

Profile: Professional software engineer (active or retired) who volunteers
to ensure systems are well-architected and maintainable. Thinks in terms
of sustainability, security, and long-term technical debt. May be skeptical
of AI-assisted workflows or pre-built systems.

Experience level: High technical expertise.
Typical background: Software developer, systems architect, IT manager.
Time in role: Often multi-year; may mentor other Tech Chairs.

---

## What Each Archetype Fears

### Archetype A: Volunteer Operator

1. Breaking something they cannot fix
2. Being asked to do things beyond their skills
3. Security incidents occurring on their watch
4. Being stuck with no one to help
5. Embarrassing the club through technical failures
6. Making the wrong decision and being blamed

### Archetype B: Reluctant Inheritor

1. The role consuming more time than expected
2. Being permanently stuck as the "tech person"
3. Having to learn new systems repeatedly
4. Lack of documentation making handoff impossible
5. Scope creep beyond original responsibilities
6. Being held accountable for legacy decisions

### Archetype C: Engineering Steward

1. Inheriting unmaintainable technical debt
2. Security vulnerabilities they did not create
3. Vendor lock-in limiting future options
4. Knowledge concentrated in one person or system
5. AI-assisted tools producing incorrect or opaque results
6. Volunteers making well-intentioned but harmful changes

---

## What Each Archetype Needs to Trust the System

### Archetype A: Volunteer Operator

- Clear boundaries: "You are responsible for X, not Y"
- Step-by-step instructions with screenshots
- Explicit escalation path: who to contact when stuck
- Automatic monitoring that alerts before problems escalate
- Confirmation that their actions succeeded
- Reassurance that mistakes can be undone

### Archetype B: Reluctant Inheritor

- Defined scope: what the role actually requires
- Time estimates: how long tasks should take
- Handoff documentation: what a successor needs to know
- Automation: reduce recurring manual work
- Clear "not my job" boundaries
- Evidence the system runs itself most of the time

### Archetype C: Engineering Steward

- Architecture documentation: how the system works
- Security audit trail: what changed and when
- API documentation: how to integrate or extend
- Source access: ability to inspect and verify
- Change control: how modifications are reviewed
- Evidence that AI assistance is auditable and reversible

---

## Training Delivery Modes by Archetype

### Archetype A: Volunteer Operator

| Mode | Purpose | Example |
|------|---------|---------|
| Checklist | Daily/weekly operational tasks | "Weekly health check: 5 items" |
| Video walkthrough | Complex procedures | "How to respond to an alert" |
| Interactive guide | First-time setup | "Claim your Tech Chair access" |
| Quick reference card | Common tasks | "One-page: resetting a password" |
| Human backup | When stuck | "Contact support via chat" |

Delivery principle: Never assume prior knowledge. Every step explicit.

### Archetype B: Reluctant Inheritor

| Mode | Purpose | Example |
|------|---------|---------|
| Task-based guides | Specific workflows | "Monthly: review access logs" |
| Time-boxed training | Respect limited time | "15-minute overview" |
| Handoff template | Prepare for transition | "What your successor needs" |
| Automation setup | Reduce manual work | "Set up auto-alerts" |
| Scope document | Define boundaries | "Tech Chair responsibilities" |

Delivery principle: Respect time. Show what can be delegated or automated.

### Archetype C: Engineering Steward

| Mode | Purpose | Example |
|------|---------|---------|
| Architecture docs | System understanding | "Data flow diagram" |
| API reference | Integration capability | "REST API documentation" |
| Security report | Audit capability | "Monthly security summary" |
| Change log | Verify modifications | "Git commit history" |
| Discussion forum | Peer exchange | "Tech steward community" |

Delivery principle: Provide depth. Trust their ability to evaluate.

---

## How AI-Assisted Support Reduces Burden

### For Archetype A: Volunteer Operator

AI assistance handles:
- Answering "how do I" questions without requiring documentation search
- Generating step-by-step instructions on demand
- Detecting potential issues before they become problems
- Drafting communications (status updates, incident notices)
- Translating technical alerts into plain language

Human remains responsible for:
- Final decisions on any action that affects members
- Escalation judgment (when to call for help)
- Relationship management with board and volunteers

### For Archetype B: Reluctant Inheritor

AI assistance handles:
- Routine monitoring and alerting
- Generating reports for board meetings
- Maintaining documentation as systems change
- Identifying tasks that can be automated
- Drafting handoff materials

Human remains responsible for:
- Approving changes before they take effect
- Training and supporting successors
- Making scope decisions (what to accept vs decline)

### For Archetype C: Engineering Steward

AI assistance handles:
- Code review assistance (style, patterns, security)
- Documentation generation from code
- Dependency update tracking
- Test coverage analysis
- Change impact assessment

Human remains responsible for:
- Architecture decisions
- Security policy
- Vendor selection
- Mentoring other Tech Chairs
- Final approval on all changes

---

## Escalation Model

### Tier 0: Self-Service (All Archetypes)

- Chatbot answers common questions
- Training units surface at point of need
- Health dashboard shows system status
- Deep links navigate to relevant pages

### Tier 1: AI-Assisted Resolution

- Chatbot helps diagnose issues
- AI generates step-by-step remediation
- AI drafts communications for review
- Automatic ticket creation if unresolved

### Tier 2: Human Support (Remote)

- Tech support contact via chat or email
- Response within 24 hours (non-urgent)
- Response within 4 hours (urgent)
- Access to shared screen assistance

### Tier 3: Human Support (Escalated)

- Direct contact with system maintainer
- Response within 1 hour (critical)
- On-call availability for emergencies
- Post-incident review and documentation

### Escalation Triggers by Archetype

| Archetype | Escalate When |
|-----------|---------------|
| Volunteer Operator | Any uncertainty; when instructions unclear |
| Reluctant Inheritor | Task exceeds 30 minutes; scope unclear |
| Engineering Steward | Security concern; architecture question |

### Escalation Paths

```
Volunteer Operator:
  Self-help -> Chatbot -> Human support -> System maintainer

Reluctant Inheritor:
  Self-help -> Quick guide -> Human support (if over 30 min)

Engineering Steward:
  Self-help -> Documentation -> Peer discussion -> Maintainer (security only)
```

---

## Success Criteria

### Criteria for Archetype A: Volunteer Operator

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to complete weekly health check | Under 15 minutes | Self-reported |
| Escalations per month | Fewer than 3 | Support tickets |
| Confidence score (survey) | 4+ out of 5 | Quarterly survey |
| Successful handoff to successor | Documentation complete | Checklist |

Training succeeded when: Volunteer Operator can maintain system health
without anxiety, knows when to escalate, and can hand off the role.

### Criteria for Archetype B: Reluctant Inheritor

| Metric | Target | Measurement |
|--------|--------|-------------|
| Hours per month on Tech Chair duties | Under 5 hours | Self-reported |
| Tasks automated vs manual | 80% automated | Task audit |
| Handoff documentation completeness | 100% of critical paths | Review |
| Time to train successor | Under 4 hours | Handoff log |

Training succeeded when: Reluctant Inheritor fulfills responsibilities
in minimal time and can exit the role cleanly.

### Criteria for Archetype C: Engineering Steward

| Metric | Target | Measurement |
|--------|--------|-------------|
| Architecture documentation coverage | 100% of components | Doc audit |
| Security audit findings addressed | Within 30 days | Audit log |
| Knowledge sharing sessions held | At least 2 per year | Calendar |
| Successor pipeline | At least 1 candidate | Board report |

Training succeeded when: Engineering Steward has documented the system,
addressed security concerns, and prepared successors.

### Universal Success Criteria

| Metric | Target | Applies To |
|--------|--------|------------|
| System uptime | 99.5% | All |
| Security incidents | Zero preventable | All |
| Member complaints (technical) | Fewer than 5 per quarter | All |
| Tech Chair turnover (unplanned) | Zero | All |

---

## Training Content Ownership

| Content Type | Author | Reviewer |
|--------------|--------|----------|
| Operational checklists | AI (from procedures) | Tech Chair |
| Architecture documentation | Engineering Steward | Peer |
| Quick reference cards | AI (from docs) | Volunteer Operator |
| Escalation procedures | System maintainer | Board |
| Handoff templates | AI (from role definition) | Outgoing Tech Chair |

---

## Implementation Notes

### Phase 1: Assessment

- Identify current Tech Chair archetype
- Survey for fears and needs
- Establish baseline metrics

### Phase 2: Personalized Onboarding

- Deliver archetype-appropriate training path
- Provide role-specific documentation
- Establish escalation contacts

### Phase 3: Ongoing Support

- Monitor engagement with training materials
- Track escalation frequency and patterns
- Adjust delivery modes based on feedback

### Phase 4: Succession Planning

- Generate handoff documentation automatically
- Facilitate knowledge transfer sessions
- Verify successor readiness

---

## Verdict

READY FOR REVIEW
