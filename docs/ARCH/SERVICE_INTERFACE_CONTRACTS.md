# Service Interface Contracts

Phase 0 deliverable: Interface contracts for provider-agnostic service abstractions.

## Overview

Murmurant uses service interfaces to abstract external dependencies (auth, payments, email) from the core business logic. This enables:

- **Provider flexibility**: Switch providers without changing business logic
- **Testability**: Mock implementations for unit/integration tests
- **Gradual migration**: Feature flags control which implementation is active

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Business Logic                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Service Interface Layer                       │
│  AuthService │ PaymentService │ EmailService │ RBACService      │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ Native Impl   │     │ Stripe Impl   │     │ Resend Impl   │
│ (Passkey)     │     │               │     │               │
└───────────────┘     └───────────────┘     └───────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ Mock Impl     │     │ Mock Impl     │     │ Mock Impl     │
│ (Testing)     │     │ (Testing)     │     │ (Testing)     │
└───────────────┘     └───────────────┘     └───────────────┘
```

## Service Factory

All services are accessed via the factory (`src/services/factory.ts`):

```typescript
import { getAuthService, getPaymentService, getEmailService } from "@/services";

// Get the appropriate implementation based on feature flags
const auth = await getAuthService();
const payments = await getPaymentService();
const email = await getEmailService();
```

## Auth Service Contract

**Location**: `src/services/auth/AuthService.ts`

### Interface

```typescript
interface AuthService {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  logout(sessionId: string): Promise<void>;
  register(data: RegisterData): Promise<AuthUser>;
  verifySession(token: string): Promise<AuthSession | null>;
  refreshSession(token: string): Promise<AuthSession>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  getUserById(userId: string): Promise<AuthUser | null>;
}
```

### Types

```typescript
interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  memberId?: string;  // Link to Member record
}

interface AuthSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name?: string;
}
```

### Implementations

| Implementation | Feature Flag | Purpose |
|---------------|--------------|---------|
| `NativeAuthService` | `MURMURANT_NATIVE_AUTH` | Passkey-based auth (production) |
| `MockAuthService` | (none) | Testing |

### Notes

- Native auth uses WebAuthn/passkeys as the primary authentication method
- Password-based auth is available as fallback
- Sessions are stored in PostgreSQL with configurable expiry

---

## Payment Service Contract

**Location**: `src/services/payments/PaymentService.ts`

### Interface

```typescript
interface PaymentService {
  // Payment Intents
  createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, string>
  ): Promise<PaymentIntent>;
  confirmPayment(intentId: string): Promise<PaymentResult>;

  // Refunds
  refundPayment(paymentId: string, amount?: number): Promise<RefundResult>;

  // Subscriptions
  createSubscription(customerId: string, priceId: string): Promise<Subscription>;
  cancelSubscription(subscriptionId: string): Promise<void>;

  // Payment History
  getPaymentHistory(customerId: string): Promise<Invoice[]>;

  // Payment Methods (optional)
  listPaymentMethods?(customerId: string): Promise<PaymentMethod[]>;
  addPaymentMethod?(customerId: string, paymentMethodId: string): Promise<PaymentMethod>;
  removePaymentMethod?(paymentMethodId: string): Promise<void>;
}
```

### Types

```typescript
type PaymentStatus = "pending" | "succeeded" | "failed" | "canceled" | "refunded";

interface PaymentMethod {
  id: string;
  type: "card" | "bank_account" | "check";
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface PaymentIntent {
  id: string;
  amount: number;        // In cents
  currency: string;      // ISO 4217 (e.g., "usd")
  status: PaymentStatus;
  clientSecret?: string; // For client-side confirmation
  metadata?: Record<string, string>;
  createdAt: Date;
}

interface PaymentResult {
  success: boolean;
  paymentId: string;
  status: PaymentStatus;
  errorMessage?: string;
  errorCode?: string;
}

interface Subscription {
  id: string;
  customerId: string;
  priceId: string;
  status: "active" | "canceled" | "past_due" | "trialing" | "paused";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

interface Invoice {
  id: string;
  customerId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  paidAt?: Date;
  createdAt: Date;
  description?: string;
}

interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  status: "pending" | "succeeded" | "failed";
  errorMessage?: string;
}
```

### Implementations

| Implementation | Feature Flag | Purpose |
|---------------|--------------|---------|
| `StripePaymentService` | `MURMURANT_NATIVE_PAYMENTS` | Stripe integration |
| `MockPaymentService` | (none) | Testing |

### Notes

- Amounts are always in the smallest currency unit (cents for USD)
- Idempotency is handled via metadata when needed
- Webhook handling is separate (`src/services/payments/stripe-webhooks.ts`)

---

## Email Service Contract

**Location**: `src/services/email/EmailService.ts`

### Interface

```typescript
interface EmailService {
  sendEmail(message: EmailMessage): Promise<EmailResult>;
  sendTemplatedEmail(
    templateId: string,
    recipient: EmailRecipient,
    data: EmailTemplateData
  ): Promise<EmailResult>;
  sendBulkEmail(messages: EmailMessage[]): Promise<BulkEmailResult>;
  getEmailStatus(messageId: string): Promise<EmailStatus>;
  createCampaign(campaign: EmailCampaign): Promise<string>;
  getCampaignStats(campaignId: string): Promise<EmailCampaignStats>;
  cancelCampaign(campaignId: string): Promise<boolean>;
}
```

### Types

```typescript
interface EmailRecipient {
  email: string;
  name?: string;
}

interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

interface EmailMessage {
  to: EmailRecipient | EmailRecipient[];
  from?: EmailRecipient;
  replyTo?: EmailRecipient;
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  tags?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

type EmailStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "complained"
  | "failed";

interface EmailResult {
  success: boolean;
  messageId?: string;
  status: EmailStatus;
  error?: string;
  timestamp: Date;
}

interface BulkEmailResult {
  total: number;
  successful: number;
  failed: number;
  results: EmailResult[];
}

interface EmailCampaign {
  id?: string;
  name: string;
  subject: string;
  templateId?: string;
  recipients: EmailRecipient[];
  scheduledAt?: Date;
  status: "draft" | "scheduled" | "sending" | "sent" | "cancelled";
  metadata?: Record<string, unknown>;
}

interface EmailCampaignStats {
  campaignId: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  openRate: number;
  clickRate: number;
}
```

### Implementations

| Implementation | Feature Flag | Purpose |
|---------------|--------------|---------|
| `ResendEmailService` | `MURMURANT_NATIVE_EMAIL` | Resend API |
| `MockEmailService` | (none) | Testing |

### Notes

- HTML is preferred over text for transactional emails
- Templates use Handlebars syntax for variable substitution
- Bounce handling updates member email status

---

## RBAC Service Contract

**Location**: `src/services/rbac/RBACService.ts`

### Interface

```typescript
interface RBACService {
  hasPermission(userId: string, permission: string, resourceId?: string): Promise<boolean>;
  getUserPermissions(userId: string): Promise<Permission[]>;
  grantPermission(userId: string, permission: string, resourceId?: string): Promise<void>;
  revokePermission(userId: string, permission: string, resourceId?: string): Promise<void>;
  getUserRoles(userId: string): Promise<Role[]>;
}
```

### Implementations

| Implementation | Feature Flag | Purpose |
|---------------|--------------|---------|
| `NativeRBACService` | (always) | Native RBAC (no WA equivalent) |

### Notes

- RBAC is always native (no Wild Apricot equivalent)
- Permissions are object-scoped per Charter P2
- See `src/lib/auth.ts` for the GlobalRole type

---

## Data Model Contracts

### Member

**Location**: `prisma/schema.prisma`

Core fields for the Member entity:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `firstName` | String | Given name |
| `lastName` | String | Family name |
| `email` | String | Unique email address |
| `phone` | String? | Optional phone number |
| `joinedAt` | DateTime | When member joined |
| `membershipStatusId` | UUID | FK to MembershipStatus |
| `membershipTierId` | UUID? | FK to MembershipTier |
| `createdAt` | DateTime | Record creation time |
| `updatedAt` | DateTime | Last update time |

**Notes**:
- `waMembershipLevelRaw` is preserved for audit during WA migration
- Member links to UserAccount for authentication
- Membership status uses a state machine (see MEMBERSHIP_LIFECYCLE_STATE_MACHINE.md)

### Event

**Location**: `prisma/schema.prisma`

Core fields for the Event entity:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `title` | String | Event name |
| `description` | String? | Event description |
| `category` | String? | Event category |
| `location` | String? | Event venue |
| `startTime` | DateTime | Event start |
| `endTime` | DateTime? | Event end |
| `status` | EventStatus | Lifecycle state |
| `requiresRegistration` | Boolean | Whether registration is needed |
| `registrationOpensAt` | DateTime? | When registration opens |
| `registrationDeadline` | DateTime? | When registration closes |
| `committeeId` | UUID? | Owning committee |

**Event Status Values**:
- `DRAFT` - Not yet submitted
- `PENDING_REVIEW` - Submitted, awaiting VP approval
- `CHANGES_REQUESTED` - VP returned for revisions
- `APPROVED` - VP approved, ready to publish
- `PUBLISHED` - Visible to members
- `CLOSED` - Registration closed
- `CANCELLED` - Event cancelled
- `COMPLETED` - Event has occurred

**Notes**:
- Capacity is derived from TicketTier quantities
- Approval workflow requires VP Activities authorization
- Events link to committees for RBAC filtering

---

## Feature Flags

Service implementations are controlled by feature flags in environment variables:

| Flag | Service | Default Behavior |
|------|---------|------------------|
| `MURMURANT_NATIVE_AUTH` | Auth | Throws (must be configured) |
| `MURMURANT_NATIVE_PAYMENTS` | Payments | MockPaymentService |
| `MURMURANT_NATIVE_EMAIL` | Email | MockEmailService |

---

## Testing

All service interfaces have mock implementations for testing:

```typescript
// Unit tests can use mock implementations directly
import { MockAuthService } from "@/services/auth/MockAuthService";
import { MockPaymentService } from "@/services/payments/MockPaymentService";
import { MockEmailService } from "@/services/email/MockEmailService";

// Integration tests use the factory with test feature flags
process.env.MURMURANT_NATIVE_AUTH = "false";
const auth = await getAuthService(); // Returns mock
```

---

## Migration from Wild Apricot

The interface abstraction supports gradual migration:

1. **Phase 0 (Current)**: Interfaces defined, native implementations in progress
2. **Phase 1**: Native implementations complete, WA adapter available
3. **Phase 5**: WA migration adapter for data import
4. **Post-migration**: WA adapter removed, only native implementations

Wild Apricot adapter is isolated in `/src/adapters/wild-apricot/` and does not pollute core business logic.
