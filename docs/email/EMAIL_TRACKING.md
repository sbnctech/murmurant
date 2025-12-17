# Email Tracking System

Copyright (c) Santa Barbara Newcomers Club

## Overview

ClubOS tracks email delivery events to maintain sender reputation and ensure members receive communications. This system is **privacy-first**: open and click tracking are disabled by default.

## What Is Tracked

| Event | Default | Description |
|-------|---------|-------------|
| Sent | Yes | Email accepted by mail server |
| Delivered | Yes | Email delivered to recipient's inbox |
| Bounced | Yes | Email could not be delivered |
| Complained | Yes | Recipient marked email as spam |
| Unsubscribed | Yes | Recipient unsubscribed |
| Opened | **No** | Recipient opened email (requires tracking pixel) |
| Clicked | **No** | Recipient clicked a link (requires link rewriting) |

## What Is NOT Tracked by Default

- **Open tracking** - Disabled for privacy. Does not inject tracking pixels.
- **Click tracking** - Disabled for privacy. Does not rewrite links.

To enable these features, update the tracking configuration via the admin API.

## Configuration Flags

| Flag | Default | Description |
|------|---------|-------------|
| `trackOpens` | `false` | Track email opens via pixel |
| `trackClicks` | `false` | Track link clicks via redirect |
| `trackBounces` | `true` | Track bounce events |
| `trackComplaints` | `true` | Track spam complaints |
| `autoSuppressHardBounce` | `true` | Auto-add hard bounces to suppression list |
| `autoSuppressComplaint` | `true` | Auto-add complaints to suppression list |
| `retentionDays` | `90` | Days to retain delivery logs |

## Validation with Test Sends

To validate the tracking system:

1. **Send a test email** via the campaigns API
2. **Check the delivery log** for the email's status
3. **Simulate webhook events** using the webhook endpoint

Example test sequence:

```bash
# 1. Get email health dashboard (requires VP Tech auth)
curl -H "Authorization: Bearer $TOKEN" \
  https://clubos.example.com/api/v1/admin/email-health

# 2. Send test campaign (creates DeliveryLog entries)
# ... via campaigns API ...

# 3. Simulate bounce webhook
curl -X POST https://clubos.example.com/api/webhooks/email \
  -H "Content-Type: application/json" \
  -d '{
    "event": "bounce",
    "providerMsgId": "test-msg-123",
    "email": "test@example.com",
    "bounceType": "hard",
    "bounceReason": "User unknown"
  }'

# 4. Verify suppression list was updated
curl -H "Authorization: Bearer $TOKEN" \
  https://clubos.example.com/api/v1/admin/email-health
```

## API Endpoints

### GET /api/v1/admin/email-health

Returns email health dashboard data for VP Tech.

**Requires:** `comms:manage` capability

**Query params:**

- `days` - Number of days to analyze (1-90, default: 7)

**Response:**

```json
{
  "stats": {
    "period": { "start": "...", "end": "..." },
    "sent": 150,
    "delivered": 145,
    "bounced": 3,
    "complained": 1,
    "unsubscribed": 1,
    "opened": 0,
    "clicked": 0,
    "deliveryRate": 0.9667,
    "bounceRate": 0.02,
    "complaintRate": 0.0067
  },
  "alerts": [
    {
      "level": "warning",
      "type": "bounce_rate",
      "message": "Warning: Bounce rate is 2.0%",
      "value": 0.02,
      "threshold": 0.02
    }
  ],
  "suppression": {
    "total": 4,
    "byReason": { "hard_bounce": 3, "complaint": 1 }
  },
  "recentCampaigns": [...],
  "config": {
    "trackOpens": false,
    "trackClicks": false,
    "trackBounces": true,
    "trackComplaints": true,
    "retentionDays": 90
  }
}
```

### GET/PATCH /api/v1/admin/email-health/config

View or update tracking configuration.

**Requires:** `admin:full` capability

**PATCH body:**

```json
{
  "trackOpens": true,
  "retentionDays": 180
}
```

### POST /api/webhooks/email

Receives email delivery events from providers.

**Supported formats:**

- AWS SES
- SendGrid
- Postmark
- Generic (see schema below)

**Generic format:**

```json
{
  "event": "bounced",
  "providerMsgId": "abc123",
  "email": "recipient@example.com",
  "timestamp": "2024-01-15T10:30:00Z",
  "bounceType": "hard",
  "bounceReason": "User unknown"
}
```

## Suppression List

Emails that cannot receive messages are added to the suppression list:

| Reason | Auto-added | Description |
|--------|-----------|-------------|
| `hard_bounce` | Yes (configurable) | Permanent delivery failure |
| `complaint` | Yes (configurable) | Spam complaint |
| `manual` | No | Manually added by admin |

Suppressed emails are blocked from receiving campaigns. The suppression can expire (optional) or be permanent.

## Audit Trail

All email events create audit log entries:

| Action | When |
|--------|------|
| `EMAIL_SENT` | Email sent to provider |
| `EMAIL_DELIVERED` | Delivery confirmed |
| `EMAIL_BOUNCED` | Bounce received |
| `EMAIL_COMPLAINED` | Spam complaint received |
| `EMAIL_UNSUBSCRIBED` | Unsubscribe processed |

## Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Bounce rate | 2% | 5% |
| Complaint rate | 0.1% | 0.5% |

When thresholds are exceeded, alerts appear in the VP Tech dashboard.

## Data Retention

Delivery logs are automatically purged after `retentionDays` (default: 90 days). This is handled by a scheduled cleanup job.

## Privacy Considerations

This system is designed with privacy in mind:

1. **Open/click tracking OFF by default** - No tracking pixels or link rewriting unless explicitly enabled
2. **Minimal data retention** - Logs purged after 90 days by default
3. **No content storage** - Only metadata (status, timestamps) is stored
4. **Audit trail** - All tracking config changes are logged

## Charter Compliance

- **P1 (Identity):** All API endpoints require proper authorization
- **P7 (Observability):** Email health visible to VP Tech; all events logged
- **P10 (Privacy):** Tracking pixels/link rewriting OFF by default
