# Email Infrastructure Guide

This guide covers the DNS, authentication, and deliverability configuration for Murmurant email communications.

Copyright (c) Santa Barbara Newcomers Club

---

## Overview

Murmurant sends transactional and marketing emails on behalf of SBNC. To ensure deliverability and protect the club's reputation, email authentication must be properly configured.

### Email Types

- **Transactional emails**: Registration confirmations, password resets, event reminders
- **Marketing emails**: eNews, event announcements, membership communications
- **System notifications**: Admin alerts, workflow notifications

---

## DNS Configuration

### Required DNS Records

The following records must be configured at your domain registrar or DNS provider.

#### 1. SPF Record (Sender Policy Framework)

SPF authorizes which mail servers can send email on behalf of your domain.

```
Record Type: TXT
Host: @
Value: v=spf1 include:_spf.google.com include:sendgrid.net include:amazonses.com ~all
TTL: 3600
```

**Explanation:**
- `include:_spf.google.com` - Authorizes Google Workspace
- `include:sendgrid.net` - Authorizes SendGrid (if used)
- `include:amazonses.com` - Authorizes Amazon SES (if used)
- `~all` - Soft fail for unauthorized senders (recommended for testing)
- `-all` - Hard fail (use in production after verification)

#### 2. DKIM Record (DomainKeys Identified Mail)

DKIM adds a cryptographic signature to emails proving they haven't been altered.

**For SendGrid:**
```
Record Type: CNAME
Host: s1._domainkey
Value: s1.domainkey.u12345678.wl123.sendgrid.net
TTL: 3600

Record Type: CNAME
Host: s2._domainkey
Value: s2.domainkey.u12345678.wl123.sendgrid.net
TTL: 3600
```

**For Amazon SES:**
```
Record Type: CNAME
Host: [selector]._domainkey
Value: [provided-by-ses].dkim.amazonses.com
TTL: 3600
```

**Note:** Replace placeholder values with those provided by your email service.

#### 3. DMARC Record (Domain-based Message Authentication)

DMARC ties SPF and DKIM together and specifies what to do with failing emails.

**Start with monitoring mode:**
```
Record Type: TXT
Host: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc-reports@sbnewcomers.org; ruf=mailto:dmarc-failures@sbnewcomers.org; pct=100
TTL: 3600
```

**Progress to quarantine:**
```
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@sbnewcomers.org; pct=25
```

**Full enforcement (after verification):**
```
Value: v=DMARC1; p=reject; rua=mailto:dmarc-reports@sbnewcomers.org; pct=100
```

**Parameters:**
- `p=none` - Monitor only, don't take action
- `p=quarantine` - Send failing emails to spam
- `p=reject` - Block failing emails entirely
- `pct=` - Percentage of emails to apply policy to (for gradual rollout)
- `rua=` - Address for aggregate reports (daily summaries)
- `ruf=` - Address for forensic reports (individual failures)

#### 4. Return-Path (Bounce Handling)

Configure a subdomain for bounce handling:

```
Record Type: CNAME
Host: bounce
Value: u12345678.wl.sendgrid.net
TTL: 3600

Record Type: MX
Host: bounce
Value: mx.sendgrid.net
Priority: 10
TTL: 3600
```

---

## Email Service Configuration

### SendGrid Setup

1. **Create SendGrid account** at sendgrid.com
2. **Verify sender domain** in Settings → Sender Authentication
3. **Add DNS records** as provided
4. **Create API key** with Mail Send permissions
5. **Configure environment variables:**

```bash
SENDGRID_API_KEY=SG.xxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@sbnewcomers.org
SENDGRID_FROM_NAME=Santa Barbara Newcomers Club
```

### Amazon SES Setup

1. **Verify domain** in SES console
2. **Add DKIM CNAME records** as provided
3. **Request production access** (starts in sandbox mode)
4. **Create SMTP credentials or API keys**
5. **Configure environment variables:**

```bash
AWS_SES_REGION=us-west-2
AWS_SES_FROM_EMAIL=noreply@sbnewcomers.org
AWS_SES_ACCESS_KEY_ID=AKIAxxxxxxxx
AWS_SES_SECRET_ACCESS_KEY=xxxxxxxxxx
```

---

## Verification Steps

### 1. Check SPF

Use [MXToolbox SPF Lookup](https://mxtoolbox.com/spf.aspx):

```bash
# Command line check
dig TXT sbnewcomers.org | grep spf
```

Expected: `v=spf1 include:... ~all` or `-all`

### 2. Check DKIM

Use [MXToolbox DKIM Lookup](https://mxtoolbox.com/dkim.aspx):

```bash
# Command line check
dig CNAME s1._domainkey.sbnewcomers.org
```

Expected: CNAME pointing to email provider

### 3. Check DMARC

Use [MXToolbox DMARC Lookup](https://mxtoolbox.com/dmarc.aspx):

```bash
# Command line check
dig TXT _dmarc.sbnewcomers.org
```

Expected: `v=DMARC1; p=...`

### 4. Send Test Email

Use [mail-tester.com](https://www.mail-tester.com/) to verify:
- SPF passes
- DKIM signature valid
- DMARC alignment
- No spam indicators

---

## Deliverability Best Practices

### Content Guidelines

1. **Use clear subject lines** - Avoid ALL CAPS, excessive punctuation
2. **Include plain text version** - Always include text/plain alternative
3. **Add unsubscribe link** - Required by CAN-SPAM and GDPR
4. **Maintain consistent sender** - Use same From name/address
5. **Avoid spam triggers** - "Free", "Winner", excessive images

### List Hygiene

1. **Honor bounces immediately** - Remove hard bounces
2. **Process complaints** - Remove complainers within 24 hours
3. **Validate on import** - Check email format before adding
4. **Prune inactive** - Remove members who haven't engaged in 12+ months
5. **Use double opt-in** - For new member signups

### Sending Practices

1. **Warm up new IPs** - Start with low volume, increase gradually
2. **Consistent sending** - Avoid spikes; spread large sends
3. **Time zone awareness** - Send during business hours
4. **Monitor metrics** - Track open rates, bounces, complaints
5. **Maintain list quality** - Keep bounce rate under 2%

---

## Murmurant Integration

### Environment Variables

```bash
# Email provider selection
EMAIL_PROVIDER=sendgrid  # or "ses", "smtp"

# From address (must match verified domain)
EMAIL_FROM_ADDRESS=noreply@sbnewcomers.org
EMAIL_FROM_NAME=Santa Barbara Newcomers Club

# Reply-to address (for member replies)
EMAIL_REPLY_TO=info@sbnewcomers.org

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxx

# Amazon SES
AWS_SES_REGION=us-west-2
AWS_SES_ACCESS_KEY_ID=AKIAxxxxxxxxxx
AWS_SES_SECRET_ACCESS_KEY=xxxxxxxxxx

# Bounce/complaint webhook
EMAIL_WEBHOOK_SECRET=your-webhook-secret

# Suppression list
AUTO_SUPPRESS_HARD_BOUNCE=true
AUTO_SUPPRESS_COMPLAINT=true
```

### Database Models

Murmurant uses these models for email tracking:

- `EmailLog` - Individual email send records
- `EmailSuppressionList` - Addresses that should not receive email
- `EmailTrackingConfig` - Global tracking settings
- `DeliveryLog` - Campaign-level delivery tracking

### API Endpoints

- `POST /api/v1/email/send` - Send transactional email
- `POST /api/v1/campaigns/{id}/send` - Send campaign
- `POST /api/v1/webhooks/email` - Receive provider webhooks
- `GET /api/v1/email/suppression` - View suppression list

---

## Monitoring & Reporting

### Key Metrics to Track

| Metric | Healthy Range | Action if Exceeded |
|--------|---------------|-------------------|
| Bounce Rate | < 2% | Clean list, verify addresses |
| Complaint Rate | < 0.1% | Review content, add unsubscribe |
| Open Rate | > 20% | Improve subject lines |
| Click Rate | > 2% | Improve content/CTAs |
| Unsubscribe Rate | < 1% | Review frequency/relevance |

### DMARC Report Analysis

Weekly review of DMARC aggregate reports:

1. Check for unauthorized senders
2. Verify alignment percentages
3. Identify legitimate sources to add to SPF
4. Investigate any failures from expected sources

### Alerts

Configure alerts for:
- Bounce rate > 5% in any send
- Complaint rate > 0.05% in any send
- Authentication failures in DMARC reports
- Daily volume anomalies (±50% from average)

---

## Troubleshooting

### Common Issues

#### "550 SPF fail"
- **Cause:** Sending from unauthorized IP
- **Fix:** Add sending IP/service to SPF record

#### "DKIM signature not valid"
- **Cause:** DKIM record not found or key mismatch
- **Fix:** Verify CNAME records are published, wait for propagation

#### "DMARC policy reject"
- **Cause:** Neither SPF nor DKIM aligned
- **Fix:** Ensure sending service supports alignment

#### High bounce rate
- **Cause:** Invalid addresses on list
- **Fix:** Validate addresses, remove bounced

#### Emails going to spam
- **Cause:** Reputation or content issues
- **Fix:** Check authentication, review content, warm up IP

### DNS Propagation

DNS changes can take 24-48 hours to propagate globally. Use these tools to check:
- [WhatsMyDNS](https://www.whatsmydns.net/) - Global DNS checker
- [MXToolbox](https://mxtoolbox.com/) - Email-specific checks
- [Google Admin Toolbox](https://toolbox.googleapps.com/apps/dig/) - Detailed DNS lookup

---

## Rollout Checklist

### Initial Setup

- [ ] Choose email provider (SendGrid, SES, or SMTP)
- [ ] Verify domain ownership with provider
- [ ] Add SPF include for provider
- [ ] Add DKIM CNAME records
- [ ] Add DMARC record in monitor mode (p=none)
- [ ] Configure webhook endpoints for bounces/complaints
- [ ] Set up suppression list handling
- [ ] Send test emails to verify delivery

### Production Readiness

- [ ] All authentication passing (mail-tester score 10/10)
- [ ] Bounce/complaint webhooks tested
- [ ] Suppression list integrated
- [ ] DMARC moved to quarantine mode
- [ ] Monitoring dashboard configured
- [ ] Alert thresholds set
- [ ] Documentation reviewed by Tech Lead

### Full Enforcement

- [ ] 2+ weeks in quarantine mode with good metrics
- [ ] No legitimate emails blocked
- [ ] DMARC moved to reject mode
- [ ] Aggregate reports show high alignment

---

## Resources

- [DMARC.org](https://dmarc.org/) - Official DMARC documentation
- [Google Postmaster Tools](https://postmaster.google.com/) - Gmail reputation monitoring
- [SendGrid Docs](https://docs.sendgrid.com/) - SendGrid API documentation
- [Amazon SES Docs](https://docs.aws.amazon.com/ses/) - SES documentation
- [Email on Acid](https://www.emailonacid.com/) - Email testing tool

---

## Contact

For email infrastructure issues, contact:
- **Tech Lead:** via #tech-support Slack channel
- **Emergency:** escalate to club President

Last updated: December 2025
