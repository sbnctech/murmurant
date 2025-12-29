# Murmurant Demo Narrative

**Purpose:** A leadership-ready walkthrough explaining why Murmurant reduces cognitive load.

**Audience:** Board members, prospective adopters, stakeholders evaluating the system.

---

## The Core Problem Murmurant Solves

Club volunteers manage complex operations—events, memberships, communications, finances—while juggling day jobs and personal commitments. The tools they use should reduce mental overhead, not add to it.

Murmurant is designed around three observable principles:

1. **Single system of record** — No sync lag, no "which system is right?" questions
2. **Deterministic lifecycle logic** — States and transitions are explicit, not inferred
3. **Fewer manual workarounds** — The system handles edge cases that currently require human intervention

---

## What Makes This Different

### 1. Single System (No Sync Mental Tax)

**Observable behavior:**
- Member data lives in one place
- Event registrations are immediately visible
- Changes made by any volunteer are instantly available to all

**What this eliminates:**
- Waiting for overnight sync jobs
- Reconciling discrepancies between systems
- "I updated it in WA but it's not showing here" conversations

### 2. Deterministic Lifecycle Logic

**Observable behavior:**
- Every member has a visible lifecycle state (Newbie, Active, Extended, Lapsed)
- State transitions have explicit triggers and are logged
- The system can explain *why* a member is in their current state

**Demo proof point:**
Navigate to any member → Lifecycle Explainer panel shows:
- Current state with plain-English description
- How they got there (transition history)
- What happens next (upcoming milestones or required actions)

**What this eliminates:**
- Guessing whether someone's "active" status is current
- Manual tracking of 90-day newbie windows
- Spreadsheet-based membership anniversary tracking

### 3. Fewer Manual Workarounds

**Observable behavior:**
- Waitlist management is automatic (position tracking, promotion on cancellation)
- Event capacity enforcement is real-time
- Registration status updates without manual intervention

**Demo proof point:**
1. Fill an event to capacity
2. New registration goes to waitlist with position #1
3. Cancel a confirmed registration
4. Waitlist member is automatically promoted

**What this eliminates:**
- Manual waitlist spreadsheets
- "I need to check if anyone cancelled" before promoting
- Overbooking due to race conditions between volunteers

---

## What This Replaces

This section documents observed behaviors in the current system that Murmurant addresses. These are factual observations, not criticisms.

| Current Behavior | Murmurant Approach |
|-----------------|-----------------|
| Member status derived from payment date calculations | Explicit lifecycle states with transition history |
| Event registrations require page refresh to see updates | Real-time registration counts and status |
| Waitlist is a manual note field | Structured waitlist with automatic position tracking |
| "Who registered" requires report generation | Instant attendee list on event page |
| Admin actions have no audit trail | Every privileged action logged with actor and timestamp |
| Role-based access is page-level | Capability-based access scoped to specific objects |
| Email sends have no preview of actual recipients | Audience preview shows exact member list before send |
| Template changes affect all future uses | Versioned templates with rollback capability |

### Specific Pain Points Addressed

**Membership transitions:**
- Current: VP Membership manually tracks 90-day newbie expirations using a spreadsheet
- Murmurant: System displays countdown, surfaces members approaching transition, logs all status changes

**Event registration edge cases:**
- Current: If someone cancels during an event, waitlist promotion requires manual check
- Murmurant: Cancellation triggers automatic waitlist promotion with notification

**Communication sends:**
- Current: "Who will receive this?" requires running a separate report
- Murmurant: Audience preview shows exact recipients before send, with explanation of selection criteria

**Volunteer handoffs:**
- Current: Incoming chair must learn where data lives, which reports to run, what's in progress
- Murmurant: Role-scoped dashboard shows relevant work queue; audit log shows recent activity

---

## 10-Minute Leadership Demo Path

### Setup (1 minute)
- Navigate to `/admin/demo`
- Show system status panel (database connected, healthy)

### Member Lifecycle (3 minutes)
1. Click "Active Newbie" scenario card
2. Show Lifecycle Explainer panel:
   - "Newbie expires in X days"
   - Transition history
   - Clear next-step guidance
3. Click "Extended Member" card
4. Show third-year status with milestone tracking

### Event Registration (3 minutes)
1. Open "Upcoming (Open)" event
2. Show registration list with real-time count
3. Open "Full (Waitlist)" event
4. Show waitlist with position numbers
5. Demonstrate: cancel one registration → waitlist member promoted

### Role-Based Access (2 minutes)
1. Log in as Event Chair
2. Show: can see own events, cannot see member financials
3. Log in as President
4. Show: full visibility, approval authority visible

### Audit Trail (1 minute)
1. Show recent activity log
2. Click any entry to see full context
3. Point out: every action has actor, timestamp, explanation

---

## Key Demo URLs

| Purpose | URL |
|---------|-----|
| Demo Dashboard | http://localhost:3000/admin/demo |
| Member List with Lifecycle | http://localhost:3000/admin/demo/members |
| Member Dashboard (logged-in view) | http://localhost:3000/my |
| Events List | http://localhost:3000/events |
| Public Home | http://localhost:3000/ |

---

## Questions This Demo Answers

**"Why not just improve the current system?"**
The current system's data model doesn't support explicit lifecycle states or object-scoped permissions. These aren't features that can be added—they require a different foundation.

**"How do volunteers learn this?"**
- Role-scoped dashboards show only relevant functions
- Every screen has context-appropriate help
- Lifecycle explainers provide plain-English state descriptions

**"What about our existing data?"**
- Import tools preserve membership history
- Historical events and registrations are migrated
- No data loss during transition

**"Who maintains this?"**
- Self-hosted, club-controlled
- Documentation maintained alongside code
- Test suite prevents regression

---

## After the Demo

**For skeptics:**
- Invite them to try a specific workflow (register for event, check member status)
- Show the audit log for their actions
- Ask: "What would you need to do this in the current system?"

**For decision-makers:**
- Emphasize: this is operational infrastructure, not a website
- Point out: the system explains itself (lifecycle panels, audit logs)
- Note: fewer "how do I do X?" questions because the answer is visible

---

*Last updated: December 2025*
