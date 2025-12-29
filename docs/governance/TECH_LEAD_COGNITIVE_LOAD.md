# Technical Leader's Perspective on Sustainability

An engineering assessment of SBNC's current technology stack and the operational risks it creates.

**Audience**: Board members with technical background.

**Purpose**: Explain why the current setup is fragile, hard to hand off, and operationally risky.

---

## The Problem Statement

SBNC's technology infrastructure has grown organically to work around limitations in Wild Apricot. The result is a system that:

1. Depends on a single volunteer for critical operations
2. Has no documented runbooks or succession plan
3. Contains hidden complexity that makes handoff difficult
4. Creates ongoing cognitive load for whoever maintains it

This is not sustainable. This document explains why.

---

## Current Architecture: A System of Workarounds

### What Wild Apricot Provides

Wild Apricot is a membership management SaaS that includes:

- Member database
- Payment processing (Personify)
- Basic website builder
- Event registration
- Email campaigns (limited)

### What Wild Apricot Does Not Provide

To meet SBNC's actual needs, we maintain external infrastructure:

| Need | WA Capability | SBNC Workaround |
|------|---------------|-----------------|
| Custom domain email | No | External mail server on VPS |
| SMTP relay | No | Postfix on VPS |
| Mail deliverability control | No | SPF/DKIM/DMARC on VPS |
| Custom application logic | No | Manual processes + scripts |
| Reliable backups | Limited | Manual exports |
| API integrations | Basic | Custom scripts |

### The Hidden System

The actual SBNC technology stack:

```
┌─────────────────────────────────────────────────────────┐
│                    Visible to Board                      │
│                                                          │
│    Wild Apricot (membership, payments, website)          │
│                                                          │
└─────────────────────────────────────────────────────────┘
                           │
                           │ depends on
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Hidden Infrastructure                       │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Hosting.com  │  │   Postfix    │  │   Custom     │   │
│  │     VPS      │  │ Mail Server  │  │   Scripts    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                          │
│       ▲                  ▲                  ▲            │
│       │                  │                  │            │
│       └──────────────────┴──────────────────┘            │
│                          │                               │
│               Single Volunteer Maintainer                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Risk Assessment

### Single Point of Failure: The Volunteer Maintainer

**Current State**: One person has:

- Root access to the VPS
- Knowledge of the mail server configuration
- Understanding of the custom scripts
- Credentials for Hosting.com account

**No Backup**: There is no documented handoff procedure, no second administrator, and no runbook for common operations.

### Failure Mode Analysis

| Scenario | Impact | Recovery |
|----------|--------|----------|
| **Maintainer takes vacation** | Minor delays acceptable | Self-resolving |
| **Maintainer has health issue** | Email service at risk | Weeks of disruption |
| **Maintainer leaves SBNC** | Critical | Months; may require rebuild |
| **VPS has security incident** | Critical | Unknown; no incident response plan |
| **Maintainer loses credentials** | Critical | Hosting.com account recovery |

### Probability Assessment

Over a 3-year horizon:

| Event | Probability | Expected Impact |
|-------|-------------|-----------------|
| Extended maintainer absence | High (50%+) | Service degradation |
| Maintainer departure | Medium (25-50%) | Major disruption |
| Security incident | Low (5-10%) | Potential data exposure |
| Credential loss | Low (5-10%) | Extended recovery |

**Conclusion**: There is a significant probability of service disruption within the next 3 years.

---

## Cognitive Load: The Invisible Tax

### What "Cognitive Load" Means

Cognitive load is the mental effort required to understand and operate a system. High cognitive load means:

- Longer onboarding time for new maintainers
- Higher error rate during operations
- More stress during incidents
- Resistance to making changes (fear of breaking things)

### Where Cognitive Load Accumulates

#### 1. Wild Apricot's Hidden Rules

WA has undocumented behaviors that affect member data:

- Membership levels have hidden status transitions
- Payment failures can change member status unexpectedly
- Renewal logic is not configurable or transparent
- Email bounce handling silently disables contacts

**Result**: The maintainer must remember these quirks or rediscover them during incidents.

#### 2. Mail Server Configuration

A properly configured mail server requires understanding:

- Postfix main.cf and master.cf
- TLS certificate management (Let's Encrypt renewal)
- SPF, DKIM, and DMARC DNS records
- Spam filtering and relay policies
- Dovecot IMAP configuration (if applicable)

**Result**: Mail servers are notoriously finicky. Small misconfigurations cause deliverability issues that are hard to diagnose.

#### 3. Integration Scripts

Custom scripts bridge WA and external systems:

- API authentication and token refresh
- Data transformation and mapping
- Error handling and retry logic
- Scheduling and monitoring

**Result**: These scripts are typically undocumented, untested, and fragile. They break silently when WA makes API changes.

#### 4. Backup and Recovery

Current backup approach:

- Manual WA exports (when remembered)
- VPS snapshots (if enabled)
- No tested restore procedure

**Result**: In a data loss scenario, recovery time is unknown. There may be gaps in backup coverage.

---

## The Handoff Problem

### What a Handoff Requires

To transfer responsibility to a new maintainer, you need:

1. **Credentials**: All accounts, passwords, SSH keys
2. **Documentation**: How the system works, why decisions were made
3. **Runbooks**: Step-by-step procedures for common tasks
4. **Context**: The history of problems and their solutions
5. **Availability**: Overlap period for questions

### What Currently Exists

| Requirement | Current State |
|-------------|---------------|
| Credentials | In one person's possession |
| Documentation | Minimal or none |
| Runbooks | None |
| Context | In one person's head |
| Availability | Volunteer schedule |

### Estimated Handoff Effort

| Task | Hours | Notes |
|------|-------|-------|
| Document current architecture | 8-16 | If done retroactively |
| Write runbooks | 8-16 | For common operations |
| Knowledge transfer sessions | 4-8 | With overlap |
| Credential handoff | 2-4 | Account access, key rotation |
| Supervised operations | 8-16 | New maintainer with backup |
| **Total** | 30-60 hours | Conservative estimate |

This is 30-60 hours of skilled volunteer time that does not exist in the current plan.

---

## Why This Matters to the Board

### Operational Risk

The board is responsible for organizational continuity. The current technology setup creates:

- **Service risk**: Email and website could fail with no one to fix them
- **Data risk**: No verified backup/restore capability
- **Reputation risk**: Professional communication depends on working email
- **Knowledge risk**: Critical knowledge is not documented

### Volunteer Sustainability

Asking one volunteer to maintain complex infrastructure indefinitely is not fair or sustainable:

- Creates burnout risk
- Discourages participation (too much responsibility)
- Makes role unattractive to potential successors

### Cost of Delay

Every month without addressing these risks:

- Increases probability of incident
- Makes documentation harder (more to remember)
- Reduces chance of finding successor (current maintainer may disengage)

---

## How Murmurant Addresses These Risks

### Architecture Simplification

Murmurant eliminates the external infrastructure layer:

```
┌─────────────────────────────────────────────────────────┐
│                      Murmurant                              │
│                                                          │
│  Database (Neon)     Hosting (Vercel)    Email (Resend) │
│      │                    │                    │         │
│      └────────────────────┴────────────────────┘         │
│                                                          │
│             All managed services with SLAs               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

- No VPS to maintain
- No mail server to configure
- No custom scripts to break

### Reduced Cognitive Load

| WA + Infrastructure | Murmurant |
|---------------------|--------|
| Remember WA quirks | Explicit, documented rules |
| Manage mail server | Managed email service |
| Maintain custom scripts | Built-in functionality |
| Manual backups | Automatic snapshots |

### Handoff Simplicity

With Murmurant:

- Standard technology stack (Next.js, PostgreSQL)
- Code is the documentation
- No hidden infrastructure
- Any competent developer can contribute

---

## Recommendations

### Immediate (0-3 months)

1. **Document current state**: Record credentials, configurations, and procedures
2. **Identify backup administrator**: Find a second person to learn the systems
3. **Verify backups**: Test that current backups can actually be restored

### Medium-term (3-12 months)

4. **Evaluate Murmurant**: Complete development and migration planning
5. **Reduce infrastructure**: Migrate to managed services where possible
6. **Create runbooks**: Document common operations

### Long-term (12+ months)

7. **Complete migration**: Move off Wild Apricot to Murmurant
8. **Decommission VPS**: Eliminate external infrastructure
9. **Establish succession plan**: Multiple people can maintain the system

---

## Summary

The current technology setup works, but only because a specific volunteer makes it work. This is not sustainable:

- **Single point of failure**: One person holds all critical knowledge
- **High cognitive load**: Complex, undocumented systems
- **No handoff plan**: Succession would be painful and slow
- **Operational risk**: Board is exposed to service disruption

Murmurant addresses these issues by:

- Using managed services instead of self-hosted infrastructure
- Making behavior explicit and documented
- Using standard technology that others can maintain
- Eliminating the hidden complexity layer

The question is not whether to address these risks, but when.
