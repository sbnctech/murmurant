# Infrastructure Cost Offsets

Hidden infrastructure costs that exist because Wild Apricot does not provide them.

**Status**: Draft - Requires invoice validation for accurate figures.

---

## Overview

SBNC maintains external infrastructure alongside Wild Apricot to fill capability gaps. These costs are often invisible in WA subscription comparisons but represent real ongoing expenses.

---

## Current External Infrastructure

### 1. VPS Hosting (Hosting.com Launch 4)

| Item | Monthly | Annual | Notes |
|------|---------|--------|-------|
| Launch 4 VPS | $TBD | $TBD | Verify from invoice |
| IP address | Included | Included | Static IP |
| **Subtotal** | $TBD | $TBD | |

**Purpose**: Hosts mail server for outbound email with custom domain.

**Why Required**: Wild Apricot does not provide:

- SMTP relay with custom domain (emails@sbnewcomers.org)
- Control over email deliverability
- SPF/DKIM/DMARC configuration

### 2. Mail Server Stack

| Component | Cost | Notes |
|-----------|------|-------|
| Postfix | $0 | Open source MTA |
| Dovecot | $0 | IMAP server |
| SSL Certificate | $0 | Let's Encrypt |
| DNS hosting | $TBD | May be included elsewhere |

**Labor**: Mail server maintenance is volunteer time (see below).

### 3. Backup Infrastructure

| Item | Cost | Notes |
|------|------|-------|
| VPS snapshots | $TBD | If enabled |
| Manual exports | $0 | Labor only |
| WA data exports | $0 | Manual process |

---

## Why Wild Apricot Creates These Costs

### Email Limitations

Wild Apricot's email system:

- Sends from `@wildapricot.org` domain (or paid custom domain add-on)
- Limited deliverability controls
- No access to mail logs for troubleshooting
- Cannot configure advanced DNS records (DKIM, DMARC)

**Result**: Organizations wanting professional email (`info@sbnewcomers.org`) must maintain their own mail infrastructure.

### No Custom Application Hosting

- WA provides only their built-in website builder
- No ability to host custom applications
- No API for real-time integrations
- Webhooks are limited and unreliable

**Result**: Any custom functionality requires external hosting.

### Limited Data Export

- WA exports are manual, point-in-time snapshots
- No automated backup API
- No incremental backup capability
- Restore requires WA support intervention

**Result**: Organizations concerned about data integrity maintain parallel copies.

---

## Volunteer Labor (Not Monetized)

The following represents unpaid volunteer time:

| Task | Estimated Hours/Year | Notes |
|------|----------------------|-------|
| VPS maintenance | 10-20 | Updates, monitoring, troubleshooting |
| Mail server administration | 5-10 | Deliverability issues, spam filtering |
| Backup verification | 5-10 | Manual exports, storage rotation |
| Integration maintenance | 10-20 | Custom scripts, API changes |
| **Total** | 30-60 hours/year | |

**Key Risk**: This labor depends on volunteer availability. No backup administrator is currently designated.

---

## Single Point of Failure Risk

### Current State

The VPS and mail infrastructure depends on a single volunteer:

- Only one person has root access
- No documented runbook for common operations
- No succession plan if maintainer is unavailable

### Impact of Maintainer Unavailability

| Scenario | Impact | Recovery Time |
|----------|--------|---------------|
| Short absence (vacation) | Email delays tolerable | Days |
| Extended absence (health) | Email service degraded | Weeks |
| Permanent departure | Critical - no root access | Months |

### Failure Modes

1. **VPS goes down**: No outbound email until recovered
2. **Credentials lost**: VPS provider account recovery (slow)
3. **Mail deliverability issue**: Emails rejected/spam-filtered
4. **Security incident**: No incident response capability

---

## Murmurant Eliminates These Costs

With Murmurant, external infrastructure is unnecessary:

| WA External Cost | Murmurant Equivalent |
|------------------|-------------------|
| VPS hosting | Vercel (included in hosting) |
| Mail server | Resend/Postmark (managed service) |
| Backups | Neon automatic snapshots |
| Integration maintenance | Built into platform |

### Quantified Offset

| Item | WA External Cost | Murmurant Cost | Savings |
|------|------------------|-------------|---------|
| VPS hosting | $TBD/year | $0 | $TBD |
| Mail infrastructure labor | (volunteer time) | $0 | N/A |
| Single-point-of-failure risk | (unquantified) | Eliminated | Risk reduction |

---

## Data Collection Checklist

To complete this analysis:

- [ ] Obtain Hosting.com invoice for VPS cost
- [ ] Verify backup storage costs (if any)
- [ ] Document current volunteer hours estimate
- [ ] Confirm DNS hosting arrangement
- [ ] Identify any other external services

---

## References

- WA_VS_MURMURANT_COST_COMPARISON.md - Overall comparison framework
- MURMURANT_HOSTING_COST_MODEL.md - Murmurant infrastructure costs (pending)
