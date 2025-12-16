# Payments State Machine

**Version**: 1.0
**Last Updated**: 2025-12-16
**Charter References**: P3 (State Machines), N5 (Idempotency), P9 (Fail Closed)

## Overview

ClubOS implements a payment abstraction layer that supports multiple payment providers while ensuring correctness through:

- **Explicit state machines** for both registration and payment lifecycles
- **Server-side idempotency** to prevent duplicate charges
- **Fail-closed security** to prevent production accidents

---

## Registration State Machine

Registration status follows this state machine:

```
                    ┌─────────────┐
                    │    DRAFT    │ ← User started registration
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
   ┌───────────────┐ ┌──────────────┐ ┌───────────┐
   │PENDING_PAYMENT│ │   PENDING    │ │ WAITLISTED│
   │ (paid events) │ │(free events) │ │           │
   └───────┬───────┘ └──────┬───────┘ └─────┬─────┘
           │               │               │
           │               │               │ (spot opens)
           │               │               ▼
           │               │        ┌───────────────┐
           │               │        │PENDING_PAYMENT│
           │               │        └───────┬───────┘
           │               │               │
           ▼               ▼               ▼
   ┌─────────────────────────────────────────────┐
   │                  CONFIRMED                  │
   └──────────┬────────────────────┬─────────────┘
              │                    │
              ▼                    ▼
      ┌───────────────┐    ┌───────────┐
      │REFUND_PENDING │    │ CANCELLED │
      └───────┬───────┘    └───────────┘
              │
              ▼
      ┌───────────────┐
      │   REFUNDED    │
      └───────────────┘
```

### Status Definitions

| Status | Description |
|--------|-------------|
| `DRAFT` | User started registration, no payment attempted |
| `PENDING_PAYMENT` | Payment intent created, awaiting completion |
| `PENDING` | Legacy: confirmed without payment (free events) |
| `CONFIRMED` | Payment completed or free event confirmed |
| `WAITLISTED` | On waitlist, may transition when spot opens |
| `CANCELLED` | User or admin cancelled |
| `REFUND_PENDING` | Refund requested, awaiting processing |
| `REFUNDED` | Refund completed |
| `NO_SHOW` | Did not attend |

---

## Payment Intent State Machine

Payment intents track the payment attempt lifecycle:

```
   ┌─────────────┐
   │   CREATED   │ ← Intent created, awaiting user action
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐      ┌─────────────┐
   │ PROCESSING  │─────►│REQUIRES_ACTION│
   └──────┬──────┘      └──────┬──────┘
          │                    │
    ┌─────┴─────┐             │
    │           │             │
    ▼           ▼             ▼
┌─────────┐ ┌────────┐  ┌───────────┐
│SUCCEEDED│ │ FAILED │  │ CANCELLED │
└────┬────┘ └────────┘  └───────────┘
     │
     ▼
┌─────────────┐
│REFUND_PENDING│
└──────┬──────┘
       │
   ┌───┴────┐
   │        │
   ▼        ▼
┌────────┐ ┌──────────────────┐
│REFUNDED│ │PARTIALLY_REFUNDED│
└────────┘ └──────────────────┘
```

---

## Idempotency

### Payment Intent Creation

The `idempotencyKey` field ensures that the same payment intent is not created twice:

```typescript
// First request creates the intent
const result1 = await provider.createPaymentIntent({
  registrationId: "reg-123",
  amountCents: 5000,
  idempotencyKey: "client-generated-key-abc123",
});
// result1.isDuplicate === false

// Second request with same key returns existing intent
const result2 = await provider.createPaymentIntent({
  registrationId: "reg-123",
  amountCents: 5000,
  idempotencyKey: "client-generated-key-abc123",
});
// result2.isDuplicate === true
// result2.intentId === result1.intentId
```

### Webhook Processing

Webhooks are idempotent by tracking `webhookReceivedAt`:

```typescript
// First webhook processes normally
const result1 = await provider.handleWebhook(event);
// result1.isDuplicate === false

// Duplicate webhook is ignored
const result2 = await provider.handleWebhook(event);
// result2.isDuplicate === true
// No state changes occur
```

---

## Payment Providers

### PaymentProvider Interface

All payment providers implement this interface:

```typescript
interface PaymentProvider {
  readonly name: string;

  createPaymentIntent(options: CreatePaymentIntentOptions): Promise<CreatePaymentIntentResult>;
  getPaymentIntentStatus(intentId: string): Promise<PaymentIntentStatusResult | null>;
  handleWebhook(payload: unknown, signature?: string): Promise<WebhookProcessResult>;
  isAvailable(): boolean;
}
```

### FakePaymentProvider

The `FakePaymentProvider` is used for development and staging:

- Simulates redirect checkout flow
- Generates webhook events for testing
- Supports success, failure, and cancel scenarios
- **DISABLED in production** (Charter P9)

### Production Safety

```typescript
// Fake provider endpoints check environment
if (isProduction()) {
  return NextResponse.json(
    { error: "Fake checkout is disabled in production" },
    { status: 403 }
  );
}
```

---

## API Endpoints

### Create Payment Intent

```
POST /api/payments/intents
Authorization: Bearer <token>

{
  "registrationId": "uuid",
  "amountCents": 5000,
  "idempotencyKey": "client-key-123",
  "currency": "USD",
  "successUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel"
}
```

Response:

```json
{
  "intentId": "uuid",
  "providerRef": "fake_pi_xxx",
  "status": "CREATED",
  "checkoutUrl": "https://example.com/checkout?ref=xxx",
  "isDuplicate": false
}
```

### Fake Checkout (Dev Only)

```
GET /api/payments/fake/checkout?ref=xxx
```

Returns HTML page with buttons to simulate:
- Complete Payment (success)
- Simulate Failure
- Cancel

### Fake Webhook (Dev Only)

```
POST /api/payments/fake/webhook

{
  "type": "payment_intent.succeeded",
  "providerRef": "fake_pi_xxx",
  "timestamp": "2025-12-16T00:00:00Z"
}
```

---

## Testing Guide

### Unit Tests

Tests are located at `tests/unit/payments-idempotency.spec.ts`:

```bash
npm run test:unit -- payments-idempotency
```

### Manual Testing

1. Create a registration in DRAFT status
2. Call `POST /api/payments/intents` to create intent
3. Visit the `checkoutUrl` to see fake checkout page
4. Click "Complete Payment" to simulate success
5. Verify registration is now CONFIRMED

### Idempotency Testing

1. Create intent with idempotencyKey "test-1"
2. Create intent again with same key
3. Verify second request returns `isDuplicate: true`
4. Verify only one PaymentIntent exists in database

---

## Future: Adding Real Providers

When adding Stripe or another provider:

1. Implement `PaymentProvider` interface
2. Add environment check in `getPaymentProvider()`
3. Configure `PAYMENT_PROVIDER` env var
4. Add webhook signature verification
5. Update this documentation

```typescript
// In src/lib/payments/index.ts
export function getPaymentProvider(): PaymentProvider {
  const providerName = process.env.PAYMENT_PROVIDER ?? "fake";

  switch (providerName) {
    case "fake":
      return getFakePaymentProvider();
    case "stripe":
      return getStripeProvider();
    default:
      throw new Error(`Unknown payment provider: ${providerName}`);
  }
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PAYMENTS_PROVIDER` | No | `"fake"` | Payment provider to use (`fake`, `stripe`) |
| `PAYMENTS_FAKE_ENABLED` | No | `undefined` | Set to `"true"` to enable fake provider in production |
| `PAYMENTS_FAKE_WEBHOOK_SECRET` | No | - | Secret for verifying fake webhook signatures (future) |

### Production Safety

The fake payment provider is **disabled in production by default** (Charter P9: Fail Closed).

To enable fake payments in a staging/testing environment that runs in production mode:

```bash
PAYMENTS_FAKE_ENABLED=true
```

**Warning**: Only enable this for testing environments. Never enable fake payments in a real production environment with real users.

### Why 404 Instead of 403?

Fake payment endpoints return 404 (Not Found) instead of 403 (Forbidden) in production when disabled. This reduces information disclosure - attackers scanning for endpoints won't know whether the route exists but is forbidden, or doesn't exist at all.
