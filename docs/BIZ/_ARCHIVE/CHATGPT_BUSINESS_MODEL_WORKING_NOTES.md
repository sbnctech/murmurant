# ChatGPT Business Model Working Notes

```
Source: ChatGPT architectural/business design sessions (Dec 2025)
Status: Preserved working notes; authoritative until superseded
Provenance: External AI-assisted design exploration, captured for repo permanence
```

---

## Purpose of This Document

This document preserves the business model reasoning developed in ChatGPT sessions
during December 2025. It captures the *why* behind architectural decisions before
distilling them into canonical specifications.

This is an **archive**, not a specification. Canonical rules are in:
- [BUSINESS_MODEL_CANONICAL.md](../BUSINESS_MODEL_CANONICAL.md)
- [PRICING_AND_ENTITLEMENTS.md](../PRICING_AND_ENTITLEMENTS.md)
- [BILLING_INVARIANTS.md](../BILLING_INVARIANTS.md)

---

## 1. Tier Philosophy

### Why Tiers Exist

Membership tiers exist to:

1. **Reflect organizational lifecycle** - Members progress through natural stages
   (newcomer -> active -> veteran -> alumni). Tiers make this explicit.

2. **Enable differential treatment** - Different stages may have different needs,
   privileges, or expectations. Tiers provide the hook for this.

3. **Support business model** - Commercial deployments may offer different service
   levels. Tiers provide the mechanism without hard-coding pricing.

### What Tiers Control

Tiers provide a **classification** that other systems can query:

- Eligibility for certain events (e.g., "newcomer-only socials")
- Priority in waitlists or registration windows
- Access to tier-specific content or communications
- Reporting and segmentation

### What Tiers Do NOT Control

Tiers are NOT:

- **Authorization** - RBAC capabilities are separate from tier. A NEWCOMER with
  the `event:create` capability can create events. Tier != permission.

- **Identity** - Tier is a classification, not an identity. A member's core
  identity (email, profile, auth credentials) is tier-independent.

- **Pricing** - Tiers inform pricing decisions but do not encode prices. Pricing
  is a billing concern, not a tier concern.

- **Hard enforcement** - Tiers are advisory by default. Hard enforcement (e.g.,
  "must be EXTENDED to register") requires explicit policy configuration.

### Design Decision: Tiers Are Organization-Specific

SBNC's tiers (NEWCOMER, FIRST_YEAR, SECOND_YEAR, THIRD_YEAR, ALUMNI) are
organization policy, not platform invariants. Other organizations may have:
- Completely different tier structures
- No tiers at all (flat membership)
- Tiers based on different criteria (payment level, not tenure)

Therefore: Tiers must be configurable per organization. See #232, #263.

---

## 2. Entitlements vs Capabilities vs Limits

### Definitions

These terms were carefully distinguished:

| Term | Definition | Example |
|------|------------|---------|
| **Capability** | A discrete permission to perform an action. Part of RBAC. | `event:create`, `member:view`, `admin:impersonate` |
| **Entitlement** | A feature or service a member has access to based on their tier/plan. | "Access to premium content", "Priority registration" |
| **Limit** | A quantitative boundary on usage. | "5 events per month", "100MB storage" |

### Why the Distinction Matters

1. **Capabilities are security-critical** - They gate what actions are permitted.
   Default-deny. Server-enforced. Audited. Part of the Charter (P1, P2).

2. **Entitlements are product decisions** - They describe what value a tier
   provides. Marketing-visible. May change frequently. Not security boundaries.

3. **Limits are abuse prevention** - They protect the system from overuse.
   Rate limits, quotas, storage caps. Operational, not product.

### Mixing These Is Dangerous

Previous discussions identified anti-patterns:

- **Using entitlements as security gates** - "Premium members can see admin
  panel" conflates product tier with authorization. Wrong.

- **Using capabilities for product features** - Creating capabilities for every
  product feature bloats the RBAC system. Capabilities should be coarse.

- **Limits without observability** - Limits that can't be monitored are
  unenforceable. Every limit needs a counter.

### Canonical Separation

```
RBAC (Capabilities)           Product (Entitlements)        Ops (Limits)
-------------------           ---------------------         -------------
Who can DO what               What VALUE you GET            How MUCH you use
Security boundary             Product boundary              Abuse prevention
Default deny                  Default varies                Default high
```

---

## 3. Why Continuous WA <-> Murmurant Sync Is Explicitly Dangerous

### The Temptation

It's tempting to want "bidirectional sync" where changes in WA automatically
flow to Murmurant and vice versa. This seems convenient.

### Why It's Dangerous

1. **Two Sources of Truth** - If both systems can be edited, which is canonical?
   Conflicts are inevitable and unresolvable without human judgment.

2. **Cascade Failures** - A bug in sync logic can corrupt both systems
   simultaneously. With bidirectional sync, recovery is extremely difficult.

3. **Audit Trail Destruction** - Syncing back to WA means WA's audit trail is
   polluted with automated changes. Compliance nightmare.

4. **Vendor Lock-in Reinforcement** - Bidirectional sync makes you MORE
   dependent on WA, not less. The goal is migration, not permanent coupling.

5. **Operator Confusion** - "Which system do I edit?" becomes a constant
   question. Error-prone and frustrating.

### The Correct Model

Migration is **staged and one-directional**:

```
WA (read-only source) --> Murmurant (destination, becomes authoritative)
```

After migration:
- WA is frozen or deprecated
- Murmurant is the single source of truth
- No sync back to WA

During transition:
- Explicit import operations (not continuous sync)
- Operator validates each import
- Rollback is always possible

---

## 4. Why Staged Migration + Rollback Is Mandatory for Customer Trust

### The Customer Promise

Organizations migrating to Murmurant are trusting us with their membership data.
This is existential for them - losing member data could destroy a club.

### Therefore: Rollback Is Non-Negotiable

Every migration operation must be reversible. This means:

1. **Pre-migration snapshots** - Full database backup before any import
2. **Run-scoped operations** - Every import has a run_id that can be reverted
3. **No destructive imports** - Imports create/update, never delete
4. **Verification before commit** - Dry run, then verify, then commit

### Why "Just Trust the Automation" Fails

1. **Source data quality varies** - WA exports may have inconsistencies
2. **Mapping logic may have bugs** - Despite testing, edge cases exist
3. **Organization context matters** - Automated decisions may be wrong for this org
4. **Operator knows their data** - The VP of Membership knows if "John Smith" and
   "J. Smith" are the same person. Automation doesn't.

### Staged Migration Pattern

```
1. Export from WA         (WA -> files)
2. Dry run import         (files -> preview, no DB writes)
3. Operator review        (human validates preview)
4. Create snapshot        (backup current DB state)
5. Execute import         (files -> DB with run_id)
6. Verify import          (automated checks + human spot-check)
7. Confirm or rollback    (keep or revert)
```

Each stage has explicit human checkpoints. This builds trust.

---

## 5. Why Policy Isolation Exists

### The Problem

Murmurant was built for SBNC. SBNC's policies are embedded throughout:

- 90-day "newbie" period
- 730-day "extended member" threshold
- Pacific timezone assumptions
- Board role structures
- Event approval workflows

### Why This Blocks Commercialization

Another organization adopting Murmurant would inherit SBNC governance by accident:

- "Why does our club have a 90-day newbie period? We don't have that."
- "What's a 'VP Activities'? We have a 'Social Chair'."
- "We're in Eastern time, not Pacific."

### The Solution: Separation

Two categories of system behavior:

| Category | Description | Example |
|----------|-------------|---------|
| **Platform Invariants** | Core behavior that MUST be consistent | Default-deny auth, audit logging, capability-based RBAC |
| **Organization Policy** | Configurable per organization | Tier thresholds, role names, timezone, approval workflows |

Platform invariants are in code. Organization policy is in configuration.

### Connection to Issues

- **#232** - Audit of what is policy vs platform
- **#263** - Architecture for policy configuration layer
- **#275** - Policy capture during migration

---

## 6. Why Operator Validation Is Required (Not Optional Automation)

### The Philosophy

Murmurant is opinionated: **humans must remain in the loop** for consequential
operations. Full automation is explicitly NOT a goal.

### What This Means in Practice

1. **Migration requires operator confirmation** - No "auto-import overnight"
2. **Policy changes require review** - No "synced from WA automatically"
3. **Destructive operations require extra confirmation** - Deletion is slow
4. **Bulk operations show previews** - Before affecting 500 members, show what will happen

### Why Not Full Automation?

1. **Accountability** - If something goes wrong, who is responsible? With
   human-in-loop, there's always an operator who approved the action.

2. **Error Detection** - Humans catch "this doesn't look right" errors that
   automated validation misses.

3. **Trust** - Organizations trust a system where they approve changes more
   than one that changes things silently.

4. **Compliance** - Many regulations require human approval for PII operations.

### Where Automation IS Appropriate

Automation handles:
- Validation (is this data well-formed?)
- Transformation (convert date formats)
- Reporting (show what would happen)
- Execution (after human approval)

Automation does NOT handle:
- Decision (should we do this?)
- Confirmation (is this result correct?)
- Exception handling (what about this weird case?)

---

## 7. Explicit Non-Goals

The following were discussed and explicitly rejected:

### Non-Goal: Wild Apricot Feature Parity

Murmurant is NOT a WA clone. Many WA features are intentionally not replicated:
- Widget-based page builder
- Event registration payment processing (use Stripe directly)
- Email campaign builder (use external tools)
- Website hosting (Murmurant is member management, not CMS)

### Non-Goal: Multi-Tenant SaaS (Initial Phase)

Initial deployment is single-tenant per-org. True multi-tenancy is future work:
- Separate databases per org (not shared schema)
- Per-org deployments (not shared infrastructure)
- Policy isolation is foundation, not multi-tenancy itself

### Non-Goal: Real-Time Sync

No real-time synchronization with any external system:
- No webhooks from WA
- No continuous polling
- Import is explicit operator action

### Non-Goal: Self-Service Onboarding

Initial organizations are onboarded manually:
- Migration is assisted, not self-service
- Configuration is set up by platform team
- No "sign up and go" flow

### Non-Goal: Free Tier

No free tier is planned for initial commercial offering:
- All organizations pay
- Pricing is by organization size/features
- Free trials may exist, but no permanent free tier

---

## 8. Open Questions (Intentionally Deferred)

These questions were raised but explicitly deferred:

### Pricing Model

- Per-member pricing vs flat tier pricing?
- Annual vs monthly billing?
- What features are premium vs standard?

**Deferred because:** Market validation needed first.

### Payment Processing

- Stripe only, or other processors?
- Handle payments in Murmurant or via integration?
- PCI compliance approach?

**Deferred because:** Depends on pricing model.

### Multi-Organization Management

- Can one admin manage multiple organizations?
- Shared login across orgs?
- Cross-org reporting?

**Deferred because:** Single-org first, multi-org is phase 2+.

### White-Labeling

- Can organizations customize branding?
- Custom domains?
- Removal of Murmurant branding?

**Deferred because:** Not needed for early adopters.

### Data Portability

- Can organizations export their data?
- What format?
- How often?

**Deferred because:** Will be required, but format TBD.

---

## 9. Key Decisions Summary

| Decision | Status | Rationale |
|----------|--------|-----------|
| Tiers are org-configurable, not platform | DECIDED | Commercialization requirement |
| Capabilities are separate from entitlements | DECIDED | Security/product separation |
| No bidirectional WA sync | DECIDED | Data integrity risk |
| Staged migration with rollback | DECIDED | Customer trust requirement |
| Operator validation required | DECIDED | Accountability principle |
| Single-tenant initial deployment | DECIDED | Simplicity for phase 1 |
| No free tier | DECIDED | Business model clarity |
| Pricing model | DEFERRED | Needs market validation |
| Payment processing | DEFERRED | Depends on pricing |

---

## 10. Related Issues and Documents

- **#248** - Business Model -> Software Requirements (parent epic)
- **#232** - Policy Isolation (SBNC-specific vs platform)
- **#263** - Policy Configuration Layer architecture
- **#275** - Policy Capture during migration
- **#202** - WA Migration wave

---

_This document preserves reasoning developed in ChatGPT sessions. It is not a
specification but a record of design thinking. Canonical specifications are in
sibling documents in docs/BIZ/._
