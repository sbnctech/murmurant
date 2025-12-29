# ACH Payment Option

## Overview

Murmurant supports ACH (Automated Clearing House) bank transfers as an alternative to credit card payments. This feature is positioned as "Help Save the Club Money" because ACH transactions have significantly lower processing fees than credit cards.

## Business Case

Credit card processing fees are typically 2.9% + $0.30 per transaction. For a $50 event registration, that's $1.75 in fees. ACH transfers typically cost $0.25-0.50 flat per transaction.

For a club processing $10,000/year in event registrations:

- Credit cards: ~$320 in fees
- ACH: ~$50 in fees
- Potential savings: ~$270/year

## Feature Flag

ACH is controlled by the `MURMURANT_ACH_ENABLED` environment variable:

```bash
# Enable ACH
MURMURANT_ACH_ENABLED=1

# Disable ACH (default)
# MURMURANT_ACH_ENABLED is not set or set to anything other than "1" or "true"
```

When disabled:

- ACH option does not appear in member payment methods
- ACH APIs return 403 Forbidden
- Admin dashboard does not show ACH metrics

## Demo Mode

**IMPORTANT**: The current implementation is DEMO MODE ONLY.

- No real bank account information is collected
- No actual ACH providers are integrated
- `last4` is for display purposes only (helps members identify their accounts)
- Provider reference is a random UUID with `demo_ach_` prefix

Before deploying to production, a real ACH provider (e.g., Stripe ACH, Plaid) must be integrated.

## API Endpoints

### GET /api/v1/me/payment-methods

Returns the member's saved payment methods.

```json
{
  "paymentMethods": [
    {
      "id": "uuid",
      "type": "ACH",
      "status": "ACTIVE",
      "displayName": "My Checking (ACH) ending in 5678",
      "isDefault": false,
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "achEnabled": true
}
```

### POST /api/v1/me/payment-methods/ach

Creates a demo ACH authorization.

Request:

```json
{
  "nickname": "My Checking Account",
  "last4": "5678"
}
```

Response:

```json
{
  "paymentMethod": {
    "id": "uuid",
    "type": "ACH",
    "displayName": "My Checking Account (ACH) ending in 5678",
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

### DELETE /api/v1/me/payment-methods/:id

Revokes a payment method (soft delete).

Response:

```json
{
  "success": true
}
```

### GET /api/admin/ach-metrics

Returns ACH adoption metrics (requires `finance:view` capability).

```json
{
  "achEnabled": true,
  "metrics": {
    "totalMembers": 150,
    "membersWithAch": 45,
    "achAdoptionPercent": 30,
    "totalPaymentMethods": 120,
    "achPaymentMethods": 50,
    "cardPaymentMethods": 70,
    "estimatedFeeSavings": {
      "description": "ACH transactions typically cost $0.25-0.50 vs 2.9% + $0.30 for cards",
      "note": "Actual savings depend on transaction volumes and amounts."
    }
  }
}
```

## Database Schema

```prisma
enum PaymentMethodType {
  CARD
  ACH
}

enum PaymentMethodStatus {
  ACTIVE
  REVOKED
}

model PaymentMethod {
  id          String              @id @default(uuid()) @db.Uuid
  memberId    String              @db.Uuid
  type        PaymentMethodType
  status      PaymentMethodStatus @default(ACTIVE)
  displayName String              // e.g., "Bank Account (ACH) ending in 5678"
  provider    String              // e.g., "DEMO_ACH", "stripe_ach"
  providerRef String              // Provider's token/reference
  isDefault   Boolean             @default(false)
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
  revokedAt   DateTime?

  member Member @relation(fields: [memberId], references: [id], onDelete: Cascade)

  @@index([memberId])
  @@index([memberId, status])
  @@index([memberId, type, status])
}
```

## Audit Logging

All payment method actions are audit logged:

- `PAYMENT_METHOD_ADDED`: When a member adds an ACH authorization
- `PAYMENT_METHOD_REVOKED`: When a member removes a payment method

Audit log entries include:

- Member ID
- Resource type and ID
- Before/after state (type, displayName, status)
- Provider information (in metadata)

## UI Components

### Member-Facing

1. **Payment Methods Page** (`/my/payment-methods`)
   - Lists saved payment methods
   - ACH promotion banner ("Help Save the Club Money")
   - Add ACH form with nickname and last4
   - Remove button for each method

2. **Checkout Selector** (`PaymentMethodSelector` component)
   - Radio selection of saved methods
   - "Saves Money" badge on ACH options
   - Promotion banner if ACH not yet added

### Admin-Facing

1. **ACH Metrics Widget** (on admin dashboard)
   - Adoption percentage with progress bar
   - Count of ACH vs card methods
   - Fee savings explanation

## Security Considerations

1. **No Bank Numbers Stored**: The system does NOT store actual bank account numbers, routing numbers, or any sensitive banking information.

2. **Member Scoping**: All payment method operations are scoped to the authenticated member. A member cannot see or modify another member's payment methods.

3. **No Enumeration**: Invalid IDs return 404 rather than revealing whether an ID exists.

4. **Audit Trail**: All actions are logged for compliance.

5. **Feature Flag**: ACH can be disabled instantly via environment variable.

## Future Enhancements

1. **Real ACH Provider Integration**: Integrate with Stripe ACH, Plaid, or similar for real bank verification.

2. **Micro-deposit Verification**: Verify account ownership via micro-deposits.

3. **Default Payment Method**: Allow members to set a default payment method.

4. **Transaction History**: Link payment methods to actual transactions.

5. **ACH Adoption Goals**: Set and track adoption percentage targets in admin.

## Charter Compliance

- **P1 (Identity)**: All operations require authenticated session
- **P2 (Default Deny)**: Endpoints check auth first, feature flag second
- **P7 (Audit Trail)**: All payment method changes are logged
- **P3 (State Machines)**: PaymentMethodStatus enum (ACTIVE/REVOKED)
