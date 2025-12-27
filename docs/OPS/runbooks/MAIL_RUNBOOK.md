# Mail System Runbook

Operational procedures for ClubOS email functionality.

**Charter Principles:**

- **P7**: Observability - clear status indicators, meaningful logs
- **P5**: Every important action must be undoable or reversible
- **N7**: Never store or expose more PII than necessary

---

## Overview

ClubOS email capabilities:

- **Transactional emails**: Membership confirmations, password resets
- **Notification emails**: Event reminders, status changes
- **Digest emails**: Periodic summaries (if configured)

### Mail Architecture

| Component | Purpose |
|-----------|---------|
| Email provider | External service (Resend, SendGrid, etc.) |
| Mail templates | Stored in application code |
| Send queue | Database-backed queue for reliability |
| `/api/health/mail` | Health check endpoint (if implemented) |

---

## Health Check

### Quick Status

```bash
# Check mail configuration
scripts/ops/health-checks/mail-health.sh

# Or manually verify API key is set
echo "Mail provider configured: ${MAIL_API_KEY:+yes}"
```

### Test Email Send

```bash
# Send a test email (development only)
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "template": "test"}' \
  https://your-site.com/api/admin/mail/test
```

---

## Common Issues

### Issue: Emails Not Being Sent

**Symptoms:**

- Users not receiving confirmation emails
- No delivery records in mail provider dashboard
- Email send functions returning errors

**Diagnosis:**

1. Verify API key is configured:
   ```bash
   # Check environment variable exists
   printenv | grep -i mail
   ```

2. Check mail provider dashboard for:
   - API key validity
   - Sending limits
   - Domain verification status

3. Review application logs for send errors

**Resolution:**

| Cause | Action |
|-------|--------|
| API key not set | Add MAIL_API_KEY to environment |
| API key invalid | Regenerate in mail provider dashboard |
| Sending domain not verified | Complete domain verification |
| Rate limit exceeded | Wait or upgrade plan |

### Issue: Emails Going to Spam

**Symptoms:**

- Emails delivered but in spam folder
- Low open rates
- User reports of missing emails

**Diagnosis:**

1. Check email headers for authentication:
   - SPF record configured
   - DKIM signature present
   - DMARC policy set

2. Review email content for spam triggers

3. Check sender reputation in mail provider

**Resolution:**

| Cause | Action |
|-------|--------|
| Missing SPF | Add SPF record to DNS |
| Missing DKIM | Configure DKIM in mail provider |
| No DMARC | Add DMARC record to DNS |
| Content flagged | Review and revise email templates |

### Issue: Email Delivery Delays

**Symptoms:**

- Emails arrive hours after sending
- Queue building up
- Timeouts on send operations

**Diagnosis:**

1. Check mail provider status page
2. Review queue depth in database
3. Check for rate limiting responses

**Resolution:**

| Cause | Action |
|-------|--------|
| Provider outage | Wait for resolution, consider backup |
| Queue backlog | Increase processing capacity |
| Rate limiting | Implement send throttling |

---

## Mail Provider Configuration

### Supported Providers

| Provider | Environment Variable | Notes |
|----------|---------------------|-------|
| Resend | `RESEND_API_KEY` | Recommended |
| SendGrid | `SENDGRID_API_KEY` | Alternative |
| SMTP | `SMTP_*` variables | Generic option |

### Required DNS Records

For proper email delivery, configure:

```
# SPF Record (TXT)
v=spf1 include:_spf.resend.com ~all

# DKIM Record (TXT)
# Provided by mail provider

# DMARC Record (TXT)
_dmarc.yourdomain.com
v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

---

## Manual Operations

### Resend Failed Email

```bash
# Find failed emails in queue
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://your-site.com/api/admin/mail/queue?status=failed

# Retry specific email
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://your-site.com/api/admin/mail/retry/{email-id}
```

### View Email Queue Status

```sql
-- Check email queue status
SELECT
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest
FROM email_queue
GROUP BY status;
```

### Purge Old Emails from Queue

```sql
-- Remove successfully sent emails older than 30 days
DELETE FROM email_queue
WHERE status = 'sent'
AND created_at < NOW() - INTERVAL '30 days';
```

---

## Escalation Procedures

### Level 1: Self-Service (Operator)

1. Run mail health check
2. Verify API keys are set
3. Check mail provider dashboard
4. Review recent send logs

### Level 2: Technical Support

Escalate if:

- Provider credentials valid but sends failing
- DNS configuration issues
- Template rendering errors

**Information to gather:**

- Mail provider name
- Error messages from logs
- Sample failed email IDs
- DNS configuration status

### Level 3: Emergency

Escalate immediately if:

- Credential compromise suspected
- Unauthorized emails sent
- PII exposure in email logs

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `MAIL_API_KEY` | Yes | Mail provider API key |
| `MAIL_FROM_ADDRESS` | Yes | Default sender address |
| `MAIL_FROM_NAME` | No | Default sender name |
| `MAIL_REPLY_TO` | No | Reply-to address |

### Example Configuration

```bash
MAIL_API_KEY=re_xxxxxxxxxxxxx
MAIL_FROM_ADDRESS=noreply@yourclub.org
MAIL_FROM_NAME="Your Club Name"
MAIL_REPLY_TO=info@yourclub.org
```

---

## Email Templates

### Template Locations

Templates are stored in the application code:

```
src/lib/mail/templates/
├── welcome.tsx          # New member welcome
├── confirmation.tsx     # Action confirmations
├── reminder.tsx         # Event reminders
└── notification.tsx     # General notifications
```

### Template Testing

```bash
# Preview template locally
npm run mail:preview

# Send test email with template
npm run mail:test -- --template=welcome --to=test@example.com
```

---

## Monitoring Alerts

Set up alerts for:

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Send failures | > 5% of attempts | Check API key and provider |
| Queue depth | > 100 pending | Check processing capacity |
| Bounce rate | > 2% | Review recipient list quality |
| Spam complaints | > 0.1% | Review email content/frequency |

---

## Recovery Procedures

### Procedure: Rotate API Key

**When:** Key compromised or needs rotation

**Steps:**

1. Generate new key in mail provider dashboard
2. Update environment variable in hosting platform
3. Redeploy application
4. Revoke old key in mail provider

### Procedure: Clear Email Queue

**When:** Queue corrupted or needs reset

**Steps:**

1. Stop email processing (disable cron/worker)
2. Export failed emails for review:
   ```sql
   COPY (SELECT * FROM email_queue WHERE status = 'failed')
   TO '/tmp/failed_emails.csv' WITH CSV HEADER;
   ```
3. Clear queue:
   ```sql
   DELETE FROM email_queue WHERE status IN ('pending', 'failed');
   ```
4. Re-enable email processing
5. Re-queue critical emails if needed

---

## PII Handling

Per N7, email logs must not contain:

- Full email bodies with PII
- Recipient lists in plain text
- Attachment contents

**Acceptable logging:**

- Email ID and status
- Recipient count (not addresses)
- Template name used
- Timestamps

---

## Related Documents

- [monitoring.md](../monitoring.md) - Health check details
- [ARCHITECTURAL_CHARTER.md](../../ARCHITECTURAL_CHARTER.md) - Privacy principles
