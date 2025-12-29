# Murmurant Demo Guide

This guide describes how to run a live demonstration of Murmurant features.

## Why This Matters

**For leadership presentations:** See [LEADERSHIP_DEMO_SCRIPT.md](demos/LEADERSHIP_DEMO_SCRIPT.md) — a verbatim 7-10 minute script that:
- Demonstrates progress without overselling
- Acknowledges risks on both sides (staying vs moving)
- Frames next steps as validation, not forced decisions
- Includes "What we have NOT done yet" honesty section

**For background context:** See [DEMO_NARRATIVE.md](demos/DEMO_NARRATIVE.md) for the "why Murmurant reduces cognitive load" framing.

---

## Risk Tradeoffs: Staying vs Moving

This section is written for board and leadership conversations. It presents both paths honestly.

### What Murmurant Already Does Better

These are observable, demonstrable improvements—not promises.

| Capability | Current System | Murmurant |
|------------|----------------|--------|
| **Lifecycle tracking** | Inferred from payment dates; requires spreadsheet reconciliation | Explicit states with automatic transitions and audit trail |
| **"Why is this member X?"** | Requires investigation across systems | System explains its own logic (Lifecycle Explainer panel) |
| **Waitlist management** | Manual tracking, error-prone promotions | Automatic position tracking and promotion on cancellation |
| **Event registration status** | Requires report generation or page refresh | Real-time counts, instant registration feedback |
| **Support troubleshooting** | "What do you see?" phone conversations | View As tool shows exact member experience safely |
| **Audit trail** | Limited, inconsistent logging | Every privileged action logged with actor, timestamp, context |
| **Role-based access** | Page-level visibility | Object-scoped capabilities (can edit *this* event, not all events) |

### Why This Reduces Tech Lead Risk

The current system works because someone understands how the pieces fit together. That understanding lives in one person's head.

**Institutional knowledge risk:**
- Workarounds are undocumented (which spreadsheet tracks newbie expirations?)
- Sync timing is learned through experience (when does data refresh?)
- Edge cases are handled by memory ("oh, for that situation, you need to...")

**Murmurant approach:**
- Logic is in code, tested automatically (823 unit tests)
- The system explains its own decisions (Lifecycle Explainer, audit logs)
- Documentation is maintained alongside code (changes require doc updates)
- AI-era maintainability: Claude Code can read, understand, and modify the codebase

**Bus factor improvement:** If the current tech lead is unavailable for a month, Murmurant is more likely to continue functioning correctly than a system that depends on tribal knowledge.

### Risks of Staying (Vendor Platform Constraints)

These are not criticisms—they are structural constraints of hosted SaaS platforms.

| Risk | Description | Mitigation Available? |
|------|-------------|----------------------|
| **Customization ceiling** | Cannot implement lifecycle state machine as designed | No—platform architecture |
| **Data access limits** | Export options constrained; real-time API limited | Partial—manual exports |
| **Workaround accumulation** | Each workaround adds cognitive load and failure points | Ongoing vigilance required |
| **Vendor dependency** | Pricing, feature, or policy changes are outside club control | Accept or migrate |
| **Knowledge concentration** | Current workarounds depend on institutional memory | Documentation effort |

**Trend:** These risks do not decrease over time. They accumulate as the club's needs diverge from the platform's capabilities.

### Risks of Moving (Murmurant Adoption)

These are real concerns that require honest assessment.

| Risk | Description | Mitigation |
|------|-------------|------------|
| **Early polish** | Some UI flows are functional but not refined | Iterative improvement; parallel operation first |
| **Migration work** | Data transfer requires validation effort | Phased approach; maintain rollback capability |
| **Unknown unknowns** | Production traffic may reveal untested scenarios | Parallel operation period; gradual traffic shift |
| **Learning curve** | Officers must learn new interfaces | Training sessions; side-by-side documentation |
| **Maintenance burden** | Self-hosted system requires ongoing care | Documented, tested codebase; AI-maintainable |
| **Feature gaps** | Some current workflows may not have equivalents yet | Prioritize based on usage; accept temporary gaps |

**Trend:** These risks decrease over time. Each week of development adds tests, documentation, and polish.

### Risk Trajectory Comparison

```
                    Risk Level
                         │
  Vendor Platform Risk   │   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━▶
  (accumulates)          │                                    (constant or increasing)
                         │
                         │   ╲
  Murmurant Risk          │    ╲
  (decreases with work)  │     ╲
                         │      ╲━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━▶
                         │                                    (declining)
                         └───────────────────────────────────────▶
                                         Time
```

**Key insight:** The question is not "which option has zero risk?" Neither does. The question is "which risk trajectory do we prefer?"

### Decision Framework

This is not a recommendation. It is a framework for discussion.

**Arguments for continuing current path:**
- Known system, known workarounds
- No migration effort required
- Current volunteers are trained on it

**Arguments for Murmurant investment:**
- Reduces long-term maintenance burden
- Explicit logic reduces "how does this work?" questions
- More sustainable for volunteer-capacity constraints
- AI-maintainable codebase (less dependent on specialized knowledge)

**What we are NOT asking:**
- Commitment to full migration
- Budget allocation
- Timeline decisions

**What we ARE asking:**
- Acknowledgment that this approach addresses real problems
- Permission to continue validation (parallel operation, user testing)
- Feedback on what would increase confidence

---

## One-Page Summary (PDF-Ready)

### Murmurant Risk Assessment — Board Summary

**The problem:** Club operations depend on institutional knowledge. Workarounds accumulate. The current tech lead is a single point of failure.

**What Murmurant provides:**
- Self-explaining system (lifecycle states, audit logs)
- Tested codebase (823 automated tests)
- Documented logic (AI can read and maintain it)
- Reduced manual workarounds (automatic waitlist, real-time registration)

**What Murmurant does NOT provide yet:**
- Payment processing
- Production deployment
- Complete data migration
- Polish on all UI flows

**Risk comparison:**

| | Current System | Murmurant |
|-|----------------|--------|
| **Customization** | Limited by vendor | Unlimited (we control code) |
| **Knowledge dependency** | High (tribal) | Low (documented, tested) |
| **Maintenance trajectory** | Stable but constrained | Improving with each iteration |
| **Migration effort** | Zero | Significant (one-time) |
| **Long-term sustainability** | Depends on workarounds | Depends on continued investment |

**Recommendation:** Continue parallel development. Do not force a migration decision. Validate with real users. Revisit in 90 days with production readiness assessment.

---

## Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Seed demo users (first time only):**
   ```bash
   npx prisma db seed
   ```

3. **Open the Demo Dashboard:**
   Navigate to http://localhost:3000/admin/demo

4. **Reset demo data (optional):**
   ```bash
   npx ts-node scripts/demo/reset-demo-data.ts
   ```

## Demo User Accounts

The seed script creates demo users for each role. Use these accounts to demonstrate role-specific features.

| Role | Email | Capabilities |
|------|-------|--------------|
| President | president@demo.murmurant.test | Full admin access |
| Secretary | secretary@demo.murmurant.test | Minutes management, member records |
| Parliamentarian | parliamentarian@demo.murmurant.test | Governance rules, procedures |
| Event Chair | eventchair@demo.murmurant.test | Event management |
| Member | member@demo.murmurant.test | Basic member access only |

### Logging In as a Demo User

1. Navigate to http://localhost:3000/login
2. Enter the demo user's email address
3. Click "Send sign-in link"
4. In development mode, the magic link URL is logged to the console
5. Click the link or paste it in your browser to authenticate

**Tip:** Keep a terminal visible during demos to quickly grab magic link URLs.

### Role Capabilities by Account

- **President**: Can access all admin features including members, events, registrations, transitions, content, and communications
- **Secretary**: Can draft and edit meeting minutes, view board records
- **Parliamentarian**: Can manage governance rules, view board records
- **Event Chair**: Can manage events and view registrations
- **Member**: Can view their own profile and register for events

## Demo Dashboard Overview

The Demo Dashboard (`/admin/demo`) provides:

- **System Status Panel** - Shows database connectivity, email configuration, and environment info
- **Lifecycle State Demo** - Demo members showing each membership lifecycle state
- **Work Queue** - Lists items to demonstrate:
  - Upcoming events (next 30 days)
  - Recent registrations (last 7 days)
  - Pending governance items

### Lifecycle Demo

The Lifecycle State Demo section shows demo members in each lifecycle state. Click any member to view their lifecycle explainer panel.

For detailed lifecycle demo instructions, see [docs/demos/LIFECYCLE_DEMO_FIXTURES.md](demos/LIFECYCLE_DEMO_FIXTURES.md).

**Seed lifecycle demo members:**

```bash
npx tsx scripts/importing/seed_demo_members.ts
```

## Demo Walkthrough

### 0. Home Page & View-As Demo (NEW)

The modern home page demonstrates role-aware rendering and the "View As" feature.

**Key URLs:**
- Public home: http://localhost:3000/
- Member home: http://localhost:3000/my
- Gift certificate: http://localhost:3000/gift

**View-As Control:**
- Located in header (top-right)
- Switch between: Public, Member, Event Chair, VP Membership, President, Tech Lead
- Yellow banner indicates simulated view

**What to show:**
1. Public home with marketing layout and Gift Certificate link
2. Member home with two-column utility/curated layout
3. Role-aware gadgets that change based on selected role
4. How officers see their tools without navigating to admin

For detailed walkthrough, see [docs/demos/HOME_PAGE_STRIPES_DEMO.md](demos/HOME_PAGE_STRIPES_DEMO.md).

### 1. System Health Check

Start by showing the System Status panel:

- Database connection status and latency
- Email provider configuration
- Environment (development/production)
- Passkey authentication status

### 2. Event Management Demo

From the work queue, click on an upcoming event to demonstrate:

- Event details view
- Registration list
- Capacity management
- Publishing workflow

### 3. Registration Flow Demo

Show the member registration experience:

- Browse events as a member
- Register for an event
- View confirmation
- Check waitlist behavior (if event is full)

### 4. Governance Features Demo

If governance items appear in the work queue:

- Review flags workflow
- Minutes approval process
- Motion tracking

### 5. Authentication Demo

Demonstrate the authentication flows:

**Magic Link Login:**
1. Go to /login
2. Enter a demo user's email (e.g., president@demo.murmurant.test)
3. Click "Send sign-in link"
4. Show the magic link URL in the console
5. Click the link to authenticate

**Passkey Registration:**
1. Log in using magic link first
2. Go to /account/security
3. Click "Add Passkey"
4. Complete Touch ID / Face ID / security key prompt
5. Name the device

**Passkey Login:**
1. Log out first
2. Go to /login
3. Click "Sign in with Passkey"
4. Complete Touch ID / Face ID / security key prompt
5. Instantly authenticated

**Account Indicator:**
- Show the account menu in the header (name, email, role badge)
- Demonstrate logout functionality

**Authorization UI:**
- Log in as Member to show limited navigation
- Log in as President to show full admin navigation
- Show the Access Denied page by accessing a restricted URL directly

## API Endpoints

The demo system uses these API endpoints:

| Endpoint | Description |
|----------|-------------|
| `GET /api/admin/demo/status` | System health indicators |
| `GET /api/admin/demo/work-queue` | Demo work queue items |

Both endpoints require `admin:full` capability.

## Demo Reset

To reset demo data for a fresh demonstration:

```bash
npx ts-node scripts/demo/reset-demo-data.ts
```

This script:

- Clears recent event registrations (last 7 days)
- Removes expired auth challenges
- Preserves members, events, and governance records

**Safety:** The script refuses to run in production unless `FORCE_DEMO_RESET=true` is set.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `PASSKEY_RP_ID` | WebAuthn relying party ID | Production |
| `PASSKEY_ORIGIN` | Expected origin for WebAuthn | Production |
| `RESEND_API_KEY` | Email provider API key | Optional |

## Troubleshooting

### "Unable to fetch system status"

- Check database connection
- Verify `DATABASE_URL` is set correctly
- Ensure the database is running

### "Unable to fetch work queue"

- Verify admin authentication
- Check that `admin:full` capability is granted
- Look for errors in server logs

### No items in work queue

- Seed the database with demo data
- Create sample events and registrations
- Add governance records if demonstrating those features
