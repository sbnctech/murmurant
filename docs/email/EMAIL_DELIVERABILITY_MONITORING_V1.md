Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

# Email Deliverability Monitoring (v1)

This spec defines how Murmurant monitors deliverability and enforces rules around repeated non-deliverability (bounces, deferrals/blocks, complaints).

Goals:
- Detect deliverability problems quickly.
- Automatically suppress unsafe recipients (hard bounces / complaints).
- Apply repeat-failure rules for soft bounces and deferrals/blocks.
- Enforce suppression server-side (not just in the ESP).
- Keep behavior auditable and reversible.

Non-goals (v1):
- Becoming a full ESP analytics product.
- Replacing the provider’s suppression system.
- Deep inbound email parsing beyond webhook/mailbox fallback.

## Event Sources (Provider-Agnostic)

Preferred:
- Provider webhooks (SES/SNS, SendGrid Event Webhook, Mailgun Webhooks, Postmark Webhooks, etc.)

Optional fallback:
- A dedicated mailbox that receives provider feedback emails.

Security:
- Verify webhook authenticity (signatures/secrets when available).
- Record whether signature verification succeeded.
- Reject unverifiable events.

## Normalized Event Taxonomy

Delivery lifecycle:
- processed
- delivered
- deferred
- bounced.soft
- bounced.hard
- blocked
- dropped

Feedback:
- complaint
- unsubscribe (if provider signals it)

## Persistence Model (Minimum)

OutboundEmailMessage
- id (internalMessageId UUID)
- toEmail
- memberId nullable
- subject
- provider (enum)
- providerMessageId nullable
- createdAt
- tags (json) e.g. committee/event/invoice/template ids

EmailDeliveryEvent
- id
- messageId (internalMessageId)
- provider
- providerMessageId nullable
- eventType (normalized)
- occurredAt
- rawPayload (json)
- signatureVerified (bool)
- ingestSource (webhook|mailbox|poll)
- errorCode nullable
- smtpStatus nullable
- classification (hard|soft|complaint|other)

RecipientDeliverabilityHealth
- email (pk)
- memberId nullable
- status (ok|watch|suppressed)
- suppressedReason (hard_bounce|complaint|manual|repeat_soft_bounce|repeat_deferred)
- suppressedAt nullable
- lastDeliveredAt nullable
- lastFailureAt nullable
- rollingCounters (json) e.g. softBounces14d, softBounces30d, deferred7d, blocked14d
- notes (text)

## Rules Engine (v1)

Hard bounce (required)
- On bounced.hard:
  - status = suppressed
  - suppressedReason = hard_bounce
  - block all future sends server-side

Complaint (required)
- On complaint:
  - status = suppressed
  - suppressedReason = complaint
  - block all future sends server-side

Repeat soft bounces (recommended defaults, configurable)
- If soft bounces >= 3 in 14 days: suppress for 30 days
- If soft bounces >= 5 in 30 days: suppress for 60 days

Repeat deferred/blocked (recommended defaults, configurable)
- If deferred/blocked >= 5 in 7 days: status = watch
- If deferred/blocked >= 10 in 14 days: suppress for 14 days

Manual override (required)
- Authorized operator can suppress/unsuppress with a required reason.
- Unsuppress warns if last event was complaint or hard bounce.

## Enforcement Points (Non-Negotiable)

Before enqueue/send:
- Check RecipientDeliverabilityHealth.status server-side.
- If suppressed: block send and record audit event.
- Do not rely on client-side hiding or provider-only suppression.

## Operator UI (v1)

Minimum:
- Lookup by email
- Show current status + reason + key counters
- Show last N normalized events
- Manual suppress / unsuppress with reason
- “Retry” only when not suppressed and failure is transient

## Audit Log Events (Minimum)

- email.sent (or email.enqueued)
- email.deliveryEvent.ingested
- email.recipient.suppressed
- email.recipient.unsuppressed
- email.recipient.statusChanged
- permission.changed

Each audit record includes:
- actorId (system for automated)
- timestamp
- entity + id
- action
- metadata (recipientEmail, fromStatus, toStatus, reason, thresholds)

## Permissions (Minimum)

- email:deliverability:view
- email:deliverability:manage (manual suppress/unsuppress)
- email:deliverability:admin (configure thresholds/providers; Tech Chair)

Open questions:
- Do we want an automated “member email invalid” flag, and how is it presented?
- Do we want a self-serve re-verify-email workflow (later)?
