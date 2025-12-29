# ACH Payment Option Guide

This guide covers the ACH (Automated Clearing House) payment option for Murmurant, which reduces transaction fees for the club.

Copyright (c) Santa Barbara Newcomers Club

---

## Overview

ACH payments transfer funds directly from a member's bank account, avoiding credit card processing fees. This saves the club significant money on event registrations and dues payments.

### Fee Comparison

| Payment Method | Typical Fee | Example ($50 event) |
|---------------|-------------|---------------------|
| Credit Card | 2.9% + $0.30 | $1.75 |
| ACH | $0.25 - $0.50 flat | $0.50 |
| **Savings per transaction** | | **~$1.25** |

### Annual Savings Estimate

With 500 event registrations averaging $50 each:
- Card fees: ~$875/year
- ACH fees: ~$250/year
- **Annual savings: ~$625**

---

## Enabling ACH

ACH is controlled by a feature flag and is **OFF by default**.

### Environment Variable

```bash
# Enable ACH payment option
MURMURANT_ACH_ENABLED=true
```

### What Gets Enabled

When `MURMURANT_ACH_ENABLED=true`:

1. **Member Features**
   - "Add Bank Account (ACH)" button in payment methods
   - ACH option appears in checkout payment selector
   - "Saves Money" badge on ACH payment methods

2. **Admin Features**
   - ACH adoption metrics dashboard
   - Fee savings reporting

3. **Checkout Experience**
   - ACH methods shown with promotional messaging
   - "Tip: Pay with ACH to help save the club money!"

---

## Member Experience

### Adding ACH Payment Method

1. Navigate to **My Account → Payment Methods**
2. Click **"Add Bank Account (ACH)"**
3. Enter:
   - **Nickname** (optional): e.g., "My Bank Account"
   - **Last 4 digits**: For display purposes
4. Click **Save**

**Note:** The current implementation is a demo that does not connect to real banks. For production, integrate with a payment processor (Stripe, Plaid, etc.) that supports ACH.

### Using ACH at Checkout

1. Select event and click **Register**
2. In payment selection, choose ACH method
3. ACH methods show a green "Saves Money" badge
4. Complete registration

---

## Admin Dashboard

### ACH Metrics

Access via **Admin → Finance → ACH Metrics** or API:

```
GET /api/admin/ach-metrics
```

**Response:**
```json
{
  "achEnabled": true,
  "metrics": {
    "totalMembers": 500,
    "membersWithAch": 125,
    "achAdoptionPercent": 25,
    "totalPaymentMethods": 650,
    "achPaymentMethods": 150,
    "cardPaymentMethods": 500,
    "estimatedFeeSavings": {
      "description": "ACH transactions typically cost $0.25-0.50 vs 2.9% + $0.30 for cards",
      "note": "Actual savings depend on transaction volumes..."
    }
  }
}
```

### Key Metrics

- **ACH Adoption %**: Percentage of members with ACH method
- **ACH Methods**: Total ACH payment methods on file
- **Card Methods**: Total card payment methods for comparison

---

## API Endpoints

### List Payment Methods

```
GET /api/v1/me/payment-methods
```

Returns member's payment methods with ACH enabled flag.

### Add ACH Payment Method

```
POST /api/v1/me/payment-methods/ach
```

**Request:**
```json
{
  "nickname": "My Bank Account",
  "last4": "1234"
}
```

**Response:**
```json
{
  "paymentMethod": {
    "id": "uuid",
    "type": "ACH",
    "displayName": "My Bank Account (ACH) ending in 1234",
    "isDefault": false,
    "createdAt": "2024-12-01T00:00:00Z"
  }
}
```

### Revoke Payment Method

```
DELETE /api/v1/me/payment-methods/{id}
```

---

## Database Schema

### PaymentMethod Model

```prisma
model PaymentMethod {
  id          String              @id @default(uuid())
  memberId    String
  type        PaymentMethodType   // CARD or ACH
  status      PaymentMethodStatus // ACTIVE or REVOKED
  displayName String              // "ACH ending in 1234"
  provider    String              // "DEMO_ACH", "stripe", etc.
  providerRef String              // Token from provider
  isDefault   Boolean             @default(false)
  createdAt   DateTime
  updatedAt   DateTime
  revokedAt   DateTime?
}

enum PaymentMethodType {
  CARD
  ACH
}
```

---

## Production Integration

### Recommended Providers

For production ACH processing, consider:

1. **Stripe ACH** - Simplest if already using Stripe for cards
2. **Plaid + Stripe** - Bank verification via Plaid
3. **Square ACH** - Alternative if using Square ecosystem

### Integration Steps

1. Choose ACH provider
2. Implement bank verification flow
3. Store provider tokens (not bank details)
4. Handle ACH-specific timing (1-3 business days)
5. Implement failed payment handling

### Security Notes

- **Never store real bank account numbers**
- Store only provider tokens (providerRef)
- Last 4 digits for display only
- All actions audit logged
- Charter P1 (identity) and P7 (audit) compliance

---

## Promoting ACH Adoption

### Member Communications

Suggested messaging for eNews:

> **Save the Club Money with ACH!**
>
> When you pay for events with ACH (bank transfer) instead of credit card, the club saves over $1 per registration in processing fees. That's money that stays in our activity budget!
>
> Add a bank account in My Account → Payment Methods and select it at checkout.

### Checkout Prompts

The checkout flow includes automatic prompts:
- Green "Saves Money" badge on ACH options
- Tip banner when card is selected but ACH available
- Promotion banner when no ACH method exists

---

## Troubleshooting

### ACH Not Showing

1. Check `MURMURANT_ACH_ENABLED=true` in environment
2. Restart server after changing env
3. Clear browser cache

### Payment Failed

ACH failures are typically due to:
- Insufficient funds
- Invalid account
- Account closed

Handle with clear member messaging and fallback to card.

### Metrics Not Loading

1. Verify `finance:view` capability
2. Check database connectivity
3. Review error logs

---

## Future Enhancements

Planned improvements:

- [ ] Real bank integration (Plaid/Stripe)
- [ ] ACH micro-deposit verification
- [ ] ACH payment scheduling
- [ ] Automatic retry for failed ACH
- [ ] ACH-specific refund handling
- [ ] Detailed fee savings reports

---

Last updated: December 2025
