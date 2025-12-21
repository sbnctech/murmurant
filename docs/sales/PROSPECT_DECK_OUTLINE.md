# ClubOS Prospect Deck Outline

Copyright (c) Santa Barbara Newcomers Club

Status: Sales Enablement
Audience: Board, Prospects, Solutions Team
Last updated: 2025-12-21

---

## Purpose

This document provides a 6-slide outline for prospect conversations. All claims are drawn from existing architectural and competitive analysis documents. This is synthesis, not invention.

**Constraints applied:**

- No new claims beyond source documents
- No new diagrams
- Speaker notes for verbal expansion
- Explicit source mapping

---

## Slide 1: The Problem You Live With

**Headline:** Your current system creates problems that training cannot solve

### Bullets

- Volunteer makes routine change; unexpected cascade corrupts data
- New chair takes weeks to become productive; old chair's knowledge walks out the door
- "Read-only admin" can export your entire contact list
- Event deletion voids invoices and creates phantom credits
- You cannot answer "who did what, when" after an incident

### Speaker Notes

Open with the December 2024 incident if prospect has WA experience. An SBNC volunteer deleted an event to "clean up" the calendar. Wild Apricot automatically voided all associated invoices and created credits on member accounts. Hours of treasurer time to fix. No audit trail showing who did it.

These are not user errors. These are architectural failures. The system lacks safeguards that modern software provides by default.

Ask: "Have you experienced something like this?" Most WA organizations have.

### Source Mapping

| Claim | Source Document |
|-------|-----------------|
| Cascade corrupts data | CLUBOS_WA_PROSPECT_POSITIONING.md:19-40 (Case Study: Event Deletion Cascade) |
| Chair onboarding friction | COGNITIVE_LOAD_AND_TALENT_MARKET_ADVANTAGE.md:83-93 (Volunteer Onboarding Friction) |
| Read-only export issue | CLUBOS_WA_PROSPECT_POSITIONING.md - references WA-004 |
| Event deletion voids invoices | CLUBOS_WA_PROSPECT_POSITIONING.md:27-29, WA_ARCHITECTURE_LIMITS_SLIDE.md:75-85 |
| Cannot determine who | COGNITIVE_LOAD_AND_TALENT_MARKET_ADVANTAGE.md:358-363 |

---

## Slide 2: Why Wild Apricot Cannot Fix This

**Headline:** Architectural constraints, not lack of intent

### Bullets

- Hardcoded 4-role permission model baked into every feature (15+ years)
- Financial and registration data coupled at the schema level
- Audit trail was an afterthought, not a foundation
- 20,000+ customers depend on current behavior; safe changes require opt-in migrations
- Personify acquisition prioritizes revenue extraction over R&D

### Speaker Notes

This is not about competence. WA's team could fix these issues if they started fresh. They cannot start fresh.

**Permissions:** The 4-role model (Admin, Limited Admin, Event Manager, Read-Only) is embedded in code paths throughout the system. To add granular permissions, they would need to audit every feature, add capability-based gates without breaking existing behavior, and migrate 20,000 customers. Multi-year project with zero new revenue.

**Financial coupling:** WA-021 (delete event cascades to invoices) exists because events, registrations, and invoices share database relationships. Decoupling requires rewriting the entire financial subsystem. Risk is too high.

**Acquisition dynamics:** Since Personify acquired WA - support response times up dramatically, 20% annual price increases, no major architectural improvements. This is PE playbook: extract value, minimize R&D.

### Source Mapping

| Claim | Source Document |
|-------|-----------------|
| 4-role model baked in | WA_ARCHITECTURE_LIMITS_SLIDE.md:20-23, 57-69 |
| Coupled schema | WA_ARCHITECTURE_LIMITS_SLIDE.md:25-28, 73-85 |
| Audit afterthought | WA_ARCHITECTURE_LIMITS_SLIDE.md:30-33, 89-100 |
| 20,000 customers | WA_ARCHITECTURE_LIMITS_SLIDE.md:34-37, 52-53, 104-118 |
| Personify dynamics | WA_ARCHITECTURE_LIMITS_SLIDE.md:38-40, 122-134 |

---

## Slide 3: Impossible by Construction

**Headline:** ClubOS guarantees are structural, not policy

### Bullets

- Event deletion is blocked when financial records exist
- Cancel is a status change; delete is removal - separate capabilities
- Financial records are append-only; no cascade from event state
- Destructive actions require confirmation showing exactly what will happen
- Every privileged action is logged with actor, timestamp, and before/after state

### Speaker Notes

These are not promises. They are structural properties of the system.

**Mechanism example:** Calling `deleteEvent(id)` in ClubOS is rejected if:
- Financial records exist (registrations, payments, invoices)
- Event was ever published
- Any registrations exist (even cancelled ones)

Delete is only possible for draft events with no registrations. This is enforced by code that cannot be bypassed, not a policy that might be forgotten.

**Financial immutability:** Invoice #1 is created. Payment #1 is received. Event is cancelled. Invoice #1: unchanged. Payment #1: unchanged. If refund is needed, Refund #1 is created as a new record. Original records are preserved.

There is no code path where event state change modifies invoice or payment records.

### Source Mapping

| Claim | Source Document |
|-------|-----------------|
| Delete blocked when financial records exist | CLUBOS_WA_PROSPECT_POSITIONING.md:103-112 |
| Cancel vs delete separation | CLUBOS_WA_PROSPECT_POSITIONING.md:64-99 (Failure Class 1) |
| Append-only financial records | CLUBOS_WA_PROSPECT_POSITIONING.md:115-160 (Failure Class 2) |
| Confirmation with preview | CLUBOS_WA_PROSPECT_POSITIONING.md:163-209 (Failure Class 3) |
| Actor attribution in audit | CLUBOS_WA_PROSPECT_POSITIONING.md:245-259 |

---

## Slide 4: The Cognitive Load Advantage

**Headline:** Designed for volunteers, not consultants

### Bullets

- Standard SaaS terminology: Members, Events, Pages, Roles - not "Gadgets" and "Levels"
- Explicit state machines: Draft -> Published -> Archived with visible status
- Predictable permissions: capability-based, object-scoped, visible in UI
- Mistakes are recoverable: soft delete, audit trail, rollback
- Help is findable in the general labor market, not WA-specialist consultants

### Speaker Notes

Cognitive load is the mental effort required to operate a system. For volunteer organizations, this is a first-order sustainability risk.

**WA reality:** New volunteers require extensive shadowing and cannot safely perform tasks independently for weeks or months. Knowledge is tacit (in people's heads), not explicit (in the system). Bus factor approaches 1 for critical operations.

**ClubOS design:** A volunteer who has used Mailchimp, Stripe, or WordPress should recognize ClubOS patterns immediately. State transitions are visible, explicit, audited, and reversible.

**Quantified impact (SBNC projection):**
- Wild Apricot: ~60 errors/year, 80-120 recovery hours, 2-4 major incidents
- ClubOS: ~15 errors/year, 15-25 recovery hours, 0-1 major incidents
- Reduction: 75% fewer errors, 80% less recovery time

### Source Mapping

| Claim | Source Document |
|-------|-----------------|
| Standard terminology | COGNITIVE_LOAD_AND_TALENT_MARKET_ADVANTAGE.md:155-164 |
| Explicit state machines | COGNITIVE_LOAD_AND_TALENT_MARKET_ADVANTAGE.md:166-181 |
| Predictable permissions | COGNITIVE_LOAD_AND_TALENT_MARKET_ADVANTAGE.md:183-195 |
| Recoverable mistakes | COGNITIVE_LOAD_AND_TALENT_MARKET_ADVANTAGE.md:197-213 |
| General labor market | COGNITIVE_LOAD_AND_TALENT_MARKET_ADVANTAGE.md:95-108, 289-303 |
| Error rate projection | COGNITIVE_LOAD_AND_TALENT_MARKET_ADVANTAGE.md:569-583 |

---

## Slide 5: Safe Delegation for Leadership

**Headline:** Committees and roles that work like your bylaws expect

### Bullets

- Committees are first-class entities with defined scope, not just contact groups
- Roles define capabilities scoped to specific committees: Chair, Secretary, Host
- Time-bounded authority: access activates and expires automatically with terms
- Transition windows: incoming and outgoing chairs overlap with appropriate access
- Full audit trail: who assigned, who accepted, when it ended, why

### Speaker Notes

**WA reality:** "Activities Committee" is just a contact group. "Activities Chair" is a person with "Limited Admin" access to everything. When the chair changes, access persists until someone remembers to remove it. Knowledge walks out the door.

**ClubOS solution:**

Committee: Activities
- Role: Chair - capabilities: events:create, events:edit, events:publish (scope: activities)
- Role: Vice Chair - capabilities: events:edit (scope: activities)
- Role: Host Coordinator - capabilities: events:checkin (scope: activities)

Each role has exactly the permissions needed, scoped to Activities only.

**Temporary coverage example:** Board member covers for absent chair. In WA, they get full admin access that persists. In ClubOS:

Assignment: Board Member as Activities Chair (acting)
- Effective: March 1 - April 15
- Access automatically revokes after 6 weeks
- No manual cleanup needed

### Source Mapping

| Claim | Source Document |
|-------|-----------------|
| Committees as first-class entities | COMMITTEE_AND_LEADERSHIP_ENABLEMENT.md:56-66 |
| Roles define scoped capabilities | COMMITTEE_AND_LEADERSHIP_ENABLEMENT.md:68-78, 229-249 |
| Time-bounded authority | COMMITTEE_AND_LEADERSHIP_ENABLEMENT.md:79-100, 199-211 |
| Transition windows | COMMITTEE_AND_LEADERSHIP_ENABLEMENT.md:161-181 |
| Full audit trail | COMMITTEE_AND_LEADERSHIP_ENABLEMENT.md:213-224 |

---

## Slide 6: Summary - What Changes

**Headline:** From constant vigilance to confident delegation

### Bullets

| Today (WA) | Tomorrow (ClubOS) |
|------------|-------------------|
| Training cannot prevent incidents | Architecture prevents incidents |
| Expertise concentrates in few people | Knowledge is in the system |
| Handoffs lose institutional memory | Transitions preserve continuity |
| Errors are expensive to fix | Mistakes are recoverable |
| Consultants are scarce and expensive | Standard patterns, findable help |

### Speaker Notes

**The fundamental shift:** Training is a supplement, not a substitute for system design that prevents errors and enables recovery.

**What we are NOT saying:**
- We are not smarter than the WA team
- ClubOS is not perfect
- Training is still valuable

**What we ARE saying:**
- Architectural choices have consequences
- ClubOS was designed knowing what WA got wrong
- We do not have 15 years of technical debt and 20,000 customers depending on broken behavior

**Close with:** "Would you like to see how this works in practice?"

### Source Mapping

| Claim | Source Document |
|-------|-----------------|
| Training vs architecture comparison | COGNITIVE_LOAD_AND_TALENT_MARKET_ADVANTAGE.md:586-622 |
| Error rate reduction | COGNITIVE_LOAD_AND_TALENT_MARKET_ADVANTAGE.md:709-720 |
| Closing framing | WA_ARCHITECTURE_LIMITS_SLIDE.md:138-143 |

---

## Source Document Index

| Document | Location | Primary Content |
|----------|----------|-----------------|
| WA_ARCHITECTURE_LIMITS_SLIDE.md | docs/competitive/ | Why WA cannot economically fix issues |
| CLUBOS_WA_PROSPECT_POSITIONING.md | docs/competitive/ | "Impossible by construction" guarantees |
| COGNITIVE_LOAD_AND_TALENT_MARKET_ADVANTAGE.md | docs/architecture/ | Volunteer training friction, error rates |
| COMMITTEE_AND_LEADERSHIP_ENABLEMENT.md | docs/architecture/ | Safe delegation, time-bounded authority |

---

## Usage Guidelines

- Use with prospects who are evaluating alternatives to Wild Apricot
- Pair with demo of ClubOS capabilities
- Focus on architecture, not WA bashing
- Let prospects share their own WA frustrations
- This is a conversation guide, not a script

---

## Not Included (Requires New Content)

The following would strengthen the deck but require new material:

- Before/after screenshots (not in source docs)
- Pricing comparison (not in these docs - see DELIVERY_MODEL_PRICING_AND_TIERS.md)
- Implementation timeline (not in these docs)
- Reference customer quotes (none available yet)

These should be developed separately as the Solutions practice matures.
