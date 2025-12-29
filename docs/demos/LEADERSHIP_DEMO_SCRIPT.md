# Murmurant Leadership Demo Script

**Duration:** 7-10 minutes
**Audience:** Board members, officers, decision-makers
**Tone:** Cautious, credible, focused on reliability and transition options

---

## Why This Matters

This demo isn't about selling a replacement. It's about answering three questions:

1. **Can we reduce cognitive load for volunteers?** — Fewer systems to reconcile, fewer manual workarounds, clearer explanations of "why is this member in this state?"

2. **Can we sustain this without heroic effort?** — Current tech lead capacity is finite. A system that explains itself, tests itself, and documents itself is more maintainable than one that requires institutional memory.

3. **Can we transition safely if we decide to?** — No cliff edges. Parallel operation, phased cutover, rollback options.

This demo shows observable progress. It does not require a decision today.

---

## Demo Flow (7-10 minutes)

### Part A: My SBNC Personalized Home (2 minutes)

**Navigate to:** http://localhost:3000/my

**What to say:**

> "This is what a logged-in member sees. Notice three things:
>
> First, it knows who I am. My name, my membership status, how long I've been a member — right at the top.
>
> Second, it shows me what's relevant to me. My upcoming events. Events I'm registered for. Not a generic calendar — my calendar.
>
> Third, the gadgets are live. That 'Upcoming Events' section has a Register button. One click, and I'm signed up. No form pages, no confirmation screens unless payment is involved."

**Key observation:**
> "In the current system, getting to 'my registrations' requires navigating through several pages. Here, it's on my home screen."

---

### Part B: Profile Edit + "What Others See" (1 minute)

**Navigate to:** http://localhost:3000/my/profile

**What to say:**

> "Members can update their own profile — first name, last name, phone.
>
> Notice the email field is read-only. That's intentional. Changing an email requires verification to prevent lockouts.
>
> When I save, two things happen: immediate feedback, and an audit log entry. Every profile change is recorded with who changed what, when."

**Security note:**
> "Under the hood, there's a field allowlist. Even if someone tried to send unauthorized fields like 'membershipStatus', the server ignores them. This is defense in depth."

---

### Part C: Events Discovery + Event Detail + Registration (2 minutes)

**Navigate to:** http://localhost:3000/events

**What to say:**

> "This is the public events page. No login required. Anyone can browse.
>
> I can search by name, filter by category, toggle between upcoming and past events. Real-time filtering — no page reloads.
>
> Let me click into an event..."

**Click any event**

> "Here's the event detail. Date, time, location, capacity — all visible.
>
> Notice the 'spots remaining' count. That's live. If someone cancels right now, the count updates.
>
> The 'Add to Calendar' button downloads an ICS file. One click, and it's in your calendar.
>
> If I'm logged in and click 'Register', I'm immediately registered. If the event is full, I'm automatically added to the waitlist with my position number."

**Key observation:**
> "Currently, waitlist management is manual. Someone tracks positions in a spreadsheet. Here, the system tracks it automatically and can promote waitlisted members when spots open."

---

### Part D: Lifecycle Explainer (2 minutes)

**Navigate to:** http://localhost:3000/admin/demo → Click a lifecycle demo member (e.g., Nancy Newbie)

**What to say:**

> "This is the part that's hardest to replicate in a vendor system.
>
> Every member has a lifecycle state — Newbie, Active, Extended, Lapsed. The state is computed deterministically from data: join date, tier, status.
>
> Nancy here joined 80 days ago. The system knows she's in her newbie period. It shows when she'll transition to regular member — automatically, no manual intervention.
>
> Click the explainer panel. It tells you:
> - What state she's in
> - Why she's in that state (the exact logic)
> - What happens next (with dates if automatic)
> - What would need to happen for her to transition"

**Why this matters:**
> "In the current system, answering 'why is this member showing as X?' requires investigating. Here, the system explains itself. That reduces the 'why is this happening?' support burden."

---

### Part E: View As Tool — Supportability and Safety (1 minute)

**Navigate to:** http://localhost:3000/admin/demo → View as Member section

**What to say:**

> "This is the 'View As' tool. It lets tech leads see exactly what a specific member sees — for troubleshooting, not impersonation.
>
> Notice the red banner: 'READ-ONLY.' While viewing as someone else, destructive actions are blocked. I can't send emails, can't modify records, can't approve transactions.
>
> Every 'View As' session is audit-logged. When it started, when it ended, who did it."

**Key observation:**
> "This is how we support members without taking their word for 'I see X.' We can verify exactly what they see, safely."

---

## What We Have NOT Done Yet (Honesty Slide)

This is a prototype demonstrating architecture. These areas are not production-ready:

| Area | Status | Notes |
|------|--------|-------|
| **Payment processing** | Not implemented | No Stripe integration, no financial transactions |
| **Email sending** | Stubbed | Infrastructure exists, actual sends disabled |
| **Renewal workflows** | Not implemented | No automated renewal notices or payment collection |
| **Data migration** | Partial | Import tools exist for events/members; registration history incomplete |
| **Production hosting** | Not deployed | Running locally; no production infrastructure |
| **Load testing** | Not performed | Unknown behavior under real traffic |
| **Mobile optimization** | Basic | Responsive but not mobile-first |
| **Accessibility audit** | Not performed | Likely issues with screen readers |

**What this means:** We can demonstrate architecture and UX, but we cannot run the club on this system tomorrow. Production readiness is a separate phase.

---

## How We Prove Reliability

### Test Suite

```
823 unit tests (all passing)
API endpoint tests for every route
Playwright end-to-end tests for critical flows
```

Tests run on every change. If a test fails, the change doesn't merge.

### Audit Logs

Every privileged action produces an audit log entry:
- Who did it (member ID)
- What they did (action type)
- What changed (before/after state)
- When it happened (timestamp)

Audit logs are immutable. They cannot be edited or deleted through the application.

### Invariants

The system enforces rules at the database level:
- A member cannot have two active registrations for the same event
- Lifecycle state is computed, not stored (cannot become inconsistent)
- Email changes require verification flow

These aren't "the chatbot said it's safe" rules. They're enforced by code and tested automatically.

### Explainability

When a member is in a particular state, the system can explain why. This reduces "works on my machine" debugging and makes the system auditable by non-technical reviewers.

---

## What Transition Could Look Like

This is not a recommendation to transition. These are options if the board decides to pursue it.

### Option A: Parallel Operation (Lowest Risk)

**How it works:**
- Murmurant runs alongside the current system
- Member and event data synced periodically (one-way: WA → Murmurant)
- Officers use Murmurant for read-only visibility, reporting, lifecycle tracking
- Current system remains authoritative for registrations, payments, communications

**Risk:** Data sync can have delays; two systems to monitor
**Benefit:** No disruption to current operations; builds confidence over time

### Option B: Phased Cutover (Moderate Risk)

**How it works:**
- Phase 1: Member directory and lifecycle tracking moves to Murmurant
- Phase 2: Event registration moves to Murmurant (WA used for payment only)
- Phase 3: Communications move to Murmurant
- Phase 4: Full cutover when all workflows validated

**Risk:** Longer transition period; more complex to manage
**Benefit:** Issues caught early, before full commitment

### Option C: Big Bang (Higher Risk, Faster)

**How it works:**
- Full data migration at a specific date
- All operations move to Murmurant simultaneously
- Current system archived for reference

**Risk:** Any issues affect all operations; harder to roll back
**Benefit:** Clean break; no ongoing sync complexity

### Rollback

All options require a rollback plan:
- Member data can be exported back to WA format
- Event data is portable (standard fields, ICS compatible)
- Audit logs retained regardless of transition direction

---

## Framing for Discussion

### Risks of Staying

This is not criticism of the vendor platform. These are constraints inherent to hosted SaaS:

- **Customization limits:** Lifecycle logic cannot be implemented as we've defined it
- **Data access:** Export options are limited; real-time API access is constrained
- **Sustainability:** Current workarounds (spreadsheets, manual tracking) depend on institutional memory
- **Tech lead bus factor:** If the current maintainer is unavailable, tribal knowledge is lost

### Risks of Moving

- **Unknown unknowns:** Production traffic may reveal issues not caught in testing
- **Learning curve:** Officers must learn new interfaces
- **Feature gaps:** Some current workflows may not have Murmurant equivalents yet
- **Maintenance burden:** Self-hosted system requires ongoing care

### What We're Not Asking Today

We're not asking for:
- A commitment to migrate
- Funding for development
- A timeline for decision

We're asking for:
- Acknowledgment that this approach has merit
- Permission to continue validation (parallel operation, user testing)
- Feedback on what would make the board more comfortable

---

## Demo Links Reference

| What | URL |
|------|-----|
| Member Home (My SBNC) | http://localhost:3000/my |
| Profile Edit | http://localhost:3000/my/profile |
| Events Discovery | http://localhost:3000/events |
| Event Detail | http://localhost:3000/events/[click any event] |
| Demo Dashboard | http://localhost:3000/admin/demo |
| Lifecycle Demo Members | Click member names in Demo Dashboard |
| View As Tool | Demo Dashboard → View as Member section |

---

## Closing

> "What you've seen today is architecture proof. The member home, the lifecycle explainer, the event registration — these demonstrate that the system works as designed.
>
> What we haven't proven yet is production reliability under real load with real data. That's the next phase if we choose to pursue it.
>
> The question isn't 'should we migrate tomorrow?' The question is 'does this direction warrant continued investment?' We're not asking for a decision. We're asking for feedback."

---

*Last updated: December 2025*
