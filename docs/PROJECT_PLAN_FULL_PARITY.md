# Murmurant Full Parity Project Plan

**Goal:** Complete Murmurant to full feature parity with Wild Apricot + mail server, supporting both greenfield clubs and WA migration paths.

**Timeline:** 4-5 months with 8-worker harness
**Start Date:** December 27, 2024

---

## Executive Summary

This plan delivers a standalone club management system that:
- Operates independently without Wild Apricot
- Supports new clubs starting fresh (greenfield)
- Supports clubs migrating from Wild Apricot
- Matches or exceeds WA + mail server functionality

---

## Phase 0: Architecture Foundation (Weeks 1-2)

**Objective:** Establish clean separation between core system and WA adapter. Define contracts that enable parallel development.

### Work Streams (8 Workers)

| Worker | Task | Deliverable |
|--------|------|-------------|
| 1 | Core/Adapter separation | Refactor WA code into `/src/adapters/wild-apricot/` |
| 2 | Native auth data model | User, Session, Password tables; auth service interface |
| 3 | Payment abstraction | Payment provider interface, transaction model |
| 4 | Email abstraction | Email service interface, template model, queue model |
| 5 | Member model cleanup | Remove WA dependencies from core member model |
| 6 | Event model cleanup | Remove WA dependencies from core event model |
| 7 | API route structure | Define REST/tRPC contracts for all core entities |
| 8 | Admin permission model | Role, Permission tables; RBAC service interface |

### Milestone: Architecture Complete
- [ ] Core system compiles and runs without WA environment variables
- [ ] All WA-specific code isolated in adapter module
- [ ] Interface contracts documented for: Auth, Payment, Email, Members, Events

---

## Phase 1: Core CRUD + Native Auth (Weeks 3-5)

**Objective:** Build the fundamental create/read/update/delete operations for all core entities with native authentication.

### Week 3-4: Auth + Member + Event CRUD

| Worker | Task | Deliverable |
|--------|------|-------------|
| 1 | Native auth - registration | Sign-up flow, email verification |
| 2 | Native auth - login/session | Login, logout, session management, JWT |
| 3 | Native auth - password reset | Forgot password flow, secure reset |
| 4 | Member CRUD API | Create, read, update, delete members |
| 5 | Member CRUD UI | Admin forms for member management |
| 6 | Event CRUD API | Create, read, update, delete events |
| 7 | Event CRUD UI | Admin forms for event management |
| 8 | Membership levels | Level CRUD, pricing, benefits assignment |

### Week 5: Registration + Capacity

| Worker | Task | Deliverable |
|--------|------|-------------|
| 1 | Event registration API | Register, cancel, waitlist logic |
| 2 | Event registration UI | Registration flow, confirmation |
| 3 | Waitlist management | Auto-promotion, notifications |
| 4 | Guest registration | Non-member registration flow |
| 5 | Capacity management | Limits, overbooking rules |
| 6 | Check-in system | Event check-in UI, attendance tracking |
| 7 | Member search/filter | Advanced search, saved filters |
| 8 | Event search/filter | Date range, category, status filters |

### Milestone: Core CRUD Complete
- [ ] Can create a member without WA
- [ ] Can create an event without WA
- [ ] Can register for an event without WA
- [ ] Native login/logout works
- [ ] Password reset works

---

## Phase 2: Payments (Weeks 6-8)

**Objective:** Integrate Stripe for all payment scenarios.

### Week 6: Stripe Foundation

| Worker | Task | Deliverable |
|--------|------|-------------|
| 1 | Stripe account connection | OAuth flow for club to connect Stripe |
| 2 | Stripe customer sync | Create Stripe customers for members |
| 3 | Payment method management | Add/remove cards, default payment |
| 4 | Checkout session API | Create Stripe checkout sessions |
| 5 | Webhook handler | Handle Stripe events (payment success, failure) |
| 6 | Transaction model | Store payment history, receipts |
| 7 | Invoice generation | Create and store invoices |
| 8 | Receipt emails | Transactional email for payment confirmation |

### Week 7: Membership Payments

| Worker | Task | Deliverable |
|--------|------|-------------|
| 1 | Membership purchase flow | New member payment |
| 2 | Renewal payment flow | Existing member renewal |
| 3 | Auto-renewal (subscriptions) | Stripe subscription integration |
| 4 | Renewal reminders | Scheduled emails before expiration |
| 5 | Grace period handling | Lapsed membership logic |
| 6 | Prorated upgrades | Change membership level mid-term |
| 7 | Payment history UI | Member view of their payments |
| 8 | Admin payment UI | Admin view, manual adjustments |

### Week 8: Event Payments + Refunds

| Worker | Task | Deliverable |
|--------|------|-------------|
| 1 | Event registration payment | Pay at registration |
| 2 | Event pricing tiers | Member vs non-member pricing |
| 3 | Early bird pricing | Time-based pricing rules |
| 4 | Refund processing | Full and partial refunds |
| 5 | Cancellation policies | Configurable refund rules |
| 6 | Donation processing | One-time donations |
| 7 | Financial dashboard | Revenue summary, trends |
| 8 | Payment reports | Exportable financial reports |

### Milestone: Payments Complete
- [ ] Can purchase membership with credit card
- [ ] Can pay for event registration
- [ ] Auto-renewal works
- [ ] Refunds process correctly
- [ ] Financial reports accurate

---

## Phase 3: Email System (Weeks 9-12)

**Objective:** Full email capability including transactional, bulk marketing, and role-based forwarding.

### Week 9: Transactional Email

| Worker | Task | Deliverable |
|--------|------|-------------|
| 1 | Email provider integration | SendGrid/Postmark/AWS SES setup |
| 2 | Email queue system | Background job processing |
| 3 | Template engine | Handlebars/Mjml template rendering |
| 4 | Core templates | Welcome, receipt, password reset |
| 5 | Event templates | Registration confirm, reminder, cancellation |
| 6 | Membership templates | Renewal reminder, expiration, welcome |
| 7 | Email logging | Track sent, delivered, bounced |
| 8 | Bounce handling | Mark bad emails, retry logic |

### Week 10: Bulk Email

| Worker | Task | Deliverable |
|--------|------|-------------|
| 1 | Email composer UI | Rich text editor, preview |
| 2 | Recipient selection | Filter by level, committee, status |
| 3 | Merge fields | Personalization tokens |
| 4 | Saved templates | Create, edit, reuse templates |
| 5 | Send scheduling | Schedule for future delivery |
| 6 | Send throttling | Rate limiting for deliverability |
| 7 | Unsubscribe handling | Preference center, compliance |
| 8 | Email analytics | Open rates, click tracking |

### Week 11: Email Forwarding

| Worker | Task | Deliverable |
|--------|------|-------------|
| 1 | DNS/MX configuration | Domain setup documentation |
| 2 | Inbound email processing | Receive and parse emails |
| 3 | Forwarding rules engine | Role → person mapping |
| 4 | Role management UI | Assign email aliases to roles |
| 5 | Committee email lists | Group forwarding |
| 6 | Forwarding logs | Track forwarded messages |
| 7 | Spam filtering | Basic spam protection |
| 8 | Reply handling | Reply-to configuration |

### Week 12: Email Polish

| Worker | Task | Deliverable |
|--------|------|-------------|
| 1 | Email preferences UI | Member email settings |
| 2 | Admin email dashboard | Send history, analytics |
| 3 | Template library | Pre-built templates for common uses |
| 4 | A/B testing | Subject line testing |
| 5 | Segment builder | Complex recipient queries |
| 6 | Drip campaigns | Automated email sequences |
| 7 | Email API | Programmatic email access |
| 8 | Deliverability monitoring | Reputation tracking |

### Milestone: Email Complete
- [ ] Transactional emails send reliably
- [ ] Can compose and send bulk email to segments
- [ ] Role-based forwarding works (president@club.org → person)
- [ ] Unsubscribe/preferences work
- [ ] Email analytics available

---

## Phase 4: Self-Service + Reporting (Weeks 13-15)

**Objective:** Member-facing portal and comprehensive reporting.

### Week 13: Member Portal

| Worker | Task | Deliverable |
|--------|------|-------------|
| 1 | Profile editing | Update contact info, photo |
| 2 | Password change | Self-service password update |
| 3 | Event history | Past registrations, attendance |
| 4 | Upcoming events | Registered events, calendar |
| 5 | Payment history | Invoices, receipts |
| 6 | Membership status | Level, expiration, renewal |
| 7 | Email preferences | Subscription management |
| 8 | Committee membership | View/manage group affiliations |

### Week 14: Reporting

| Worker | Task | Deliverable |
|--------|------|-------------|
| 1 | Membership reports | Counts, trends, demographics |
| 2 | Retention reports | Renewal rates, churn |
| 3 | Event reports | Attendance, revenue per event |
| 4 | Financial reports | Revenue by type, time period |
| 5 | Committee reports | Activity, membership |
| 6 | Export engine | CSV, Excel, PDF exports |
| 7 | Report scheduler | Automated report delivery |
| 8 | Dashboard widgets | At-a-glance metrics |

### Week 15: Admin Polish

| Worker | Task | Deliverable |
|--------|------|-------------|
| 1 | Admin dashboard | Home screen with key metrics |
| 2 | Quick actions | Common task shortcuts |
| 3 | Bulk operations | Multi-select actions |
| 4 | Audit logging | Track admin actions |
| 5 | Settings UI | Club configuration |
| 6 | Branding settings | Logo, colors, name |
| 7 | Admin roles | Permission management UI |
| 8 | Help/documentation | In-app help, tooltips |

### Milestone: Self-Service + Reporting Complete
- [ ] Members can manage their own profile
- [ ] Members can view their history and status
- [ ] Admins have comprehensive reports
- [ ] Reports exportable in multiple formats
- [ ] Admin dashboard provides useful overview

---

## Phase 5: WA Migration Adapter (Weeks 16-17)

**Objective:** Clean, reliable migration path for clubs leaving Wild Apricot.

### Week 16: Import Infrastructure

| Worker | Task | Deliverable |
|--------|------|-------------|
| 1 | WA API client (refactored) | Clean adapter module |
| 2 | Member import | Full member data migration |
| 3 | Event import | Historical and future events |
| 4 | Registration import | Event registration history |
| 5 | Payment history import | Transaction records |
| 6 | Committee/group import | Group structures |
| 7 | Document import | Files and attachments |
| 8 | Import validation | Data quality checks, reports |

### Week 17: Migration Workflow

| Worker | Task | Deliverable |
|--------|------|-------------|
| 1 | Migration wizard UI | Step-by-step guide |
| 2 | WA OAuth bridge | Temporary auth during transition |
| 3 | Sync mode | Ongoing sync during parallel run |
| 4 | Cutover workflow | Final migration steps |
| 5 | Rollback capability | Undo migration if needed |
| 6 | Data reconciliation | Compare WA vs Murmurant |
| 7 | Migration status dashboard | Progress tracking |
| 8 | Migration documentation | Runbook, FAQ |

### Milestone: Migration Complete
- [ ] Can import full club data from WA
- [ ] Parallel run mode works
- [ ] Clean cutover process
- [ ] Members can auth during transition
- [ ] Documentation complete

---

## Phase 6: Greenfield Onboarding (Week 18)

**Objective:** Smooth setup experience for new clubs.

| Worker | Task | Deliverable |
|--------|------|-------------|
| 1 | Setup wizard | Club info, admin account |
| 2 | Membership level templates | Common configurations |
| 3 | Sample content | Example events, pages |
| 4 | Stripe onboarding | Payment setup guide |
| 5 | Email domain setup | DNS configuration guide |
| 6 | Branding wizard | Logo, colors upload |
| 7 | First event guide | Interactive tutorial |
| 8 | Admin training mode | Guided tour of features |

### Milestone: Greenfield Complete
- [ ] New club can be operational in < 1 hour
- [ ] Sensible defaults in place
- [ ] Clear guidance at each step

---

## Phase 7: Integration Testing + Hardening (Weeks 19-20)

**Objective:** Production readiness.

### Week 19: Testing

| Worker | Task | Deliverable |
|--------|------|-------------|
| 1 | End-to-end test suite | Critical path coverage |
| 2 | Payment testing | Stripe test mode validation |
| 3 | Email testing | Delivery verification |
| 4 | Migration testing | Full import validation |
| 5 | Performance testing | Load testing, optimization |
| 6 | Security audit | OWASP checks, penetration testing |
| 7 | Accessibility audit | WCAG compliance |
| 8 | Mobile testing | Responsive validation |

### Week 20: Hardening

| Worker | Task | Deliverable |
|--------|------|-------------|
| 1 | Error handling | Graceful failures, user messages |
| 2 | Monitoring | Alerting, dashboards |
| 3 | Backup/restore | Data protection |
| 4 | Rate limiting | Abuse prevention |
| 5 | Documentation | Admin guide, API docs |
| 6 | Edge cases | Handle unusual scenarios |
| 7 | Performance optimization | Query optimization, caching |
| 8 | Launch checklist | Final verification |

### Milestone: Production Ready
- [ ] All critical paths tested
- [ ] Security review passed
- [ ] Performance acceptable
- [ ] Monitoring in place
- [ ] Documentation complete

---

## Summary Timeline

| Phase | Weeks | Dates | Focus |
|-------|-------|-------|-------|
| 0 | 1-2 | Dec 27 - Jan 10 | Architecture |
| 1 | 3-5 | Jan 11 - Jan 31 | Core CRUD + Auth |
| 2 | 6-8 | Feb 1 - Feb 21 | Payments |
| 3 | 9-12 | Feb 22 - Mar 21 | Email System |
| 4 | 13-15 | Mar 22 - Apr 11 | Self-Service + Reporting |
| 5 | 16-17 | Apr 12 - Apr 25 | WA Migration |
| 6 | 18 | Apr 26 - May 2 | Greenfield Onboarding |
| 7 | 19-20 | May 3 - May 16 | Testing + Hardening |

**Target Completion: May 16, 2025**

---

## Critical Path Dependencies

```
┌─────────────┐
│  Phase 0    │ Architecture must complete before parallel work
└──────┬──────┘
       │
       ▼
┌──────┴──────┐
│   Phase 1   │ Auth must complete before self-service features
│  Core CRUD  │ Member/Event CRUD before registration/payments
└──────┬──────┘
       │
       ├────────────────┬────────────────┐
       ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Phase 2    │ │   Phase 3    │ │   Phase 5    │
│   Payments   │ │    Email     │ │ WA Migration │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        ▼
              ┌─────────────────┐
              │    Phase 4      │
              │ Self-Service +  │
              │   Reporting     │
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │    Phase 6      │
              │   Greenfield    │
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │    Phase 7      │
              │    Hardening    │
              └─────────────────┘
```

---

## Risk Factors

| Risk | Mitigation |
|------|------------|
| Email deliverability | Use established provider (SendGrid), warm up domain gradually |
| Stripe complexity | Start with simple flows, add complexity incrementally |
| WA API limitations | Document known issues, build workarounds |
| Scope creep | Strict adherence to WA parity, not "better than WA" |
| Worker coordination | Daily integration, clear interface contracts |
| Data migration quality | Extensive validation, parallel run period |

---

## Success Criteria

1. **Greenfield club** can go from signup to first event in under 1 hour
2. **WA migrating club** can import all data and run parallel for validation
3. **Feature parity** with WA for: members, events, payments, email
4. **Email forwarding** works for role-based addresses
5. **Zero WA dependency** for day-to-day operations post-migration
6. **Demo ready** at any phase milestone

---

## Next Steps

1. Review and approve this plan
2. Set up Phase 0 task assignments in harness
3. Begin architecture refactoring
4. Establish weekly milestone reviews
