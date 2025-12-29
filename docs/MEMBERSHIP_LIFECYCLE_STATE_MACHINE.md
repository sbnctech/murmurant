# Membership Lifecycle State Machine

**Purpose:** Define valid membership status transitions and their triggers.
**Charter Reference:** P3 (Explicit state machines for workflows)

---

## 1. State Machine Diagram

```
                                  ┌────────────────┐
                                  │                │
                    ┌─────────────│   UNKNOWN      │
                    │             │                │
                    │             └────────────────┘
                    │                    │
                    │                    │ data_cleanup
                    │                    ▼
              ┌─────┴─────┐       ┌────────────────┐
              │           │       │                │
    apply ───▶│ PENDING   │──────▶│   ACTIVE       │◀──────────────┐
              │   NEW     │ pay   │                │               │
              │           │       └───────┬────────┘               │
              └───────────┘               │                        │
                                          │ expiry                 │ renew
                                          ▼                        │
              ┌───────────┐       ┌────────────────┐               │
              │           │       │                │               │
              │ SUSPENDED │◀──────│   PENDING      │───────────────┘
              │           │ admin │   RENEWAL      │ pay
              └─────┬─────┘       └───────┬────────┘
                    │                     │
                    │                     │ expiry (grace period ends)
                    │                     ▼
                    │             ┌────────────────┐
                    │             │                │
                    └────────────▶│   LAPSED       │◀──────┐
                     admin        │                │       │
                                  └───────┬────────┘       │
                                          │                │
                                          │ admin          │
                                          ▼                │
                                  ┌────────────────┐       │
                                  │                │       │
                                  │ NOT_A_MEMBER   │───────┘
                                  │                │ admin (reinstate)
                                  └────────────────┘
```

---

## 2. Status Definitions

| Code | Label | isActive | Description |
|------|-------|----------|-------------|
| `unknown` | Unknown | false | Data quality issue; needs manual review |
| `pending_new` | Pending New | false | Applied but payment not yet received |
| `active` | Active | true | Current member in good standing |
| `pending_renewal` | Pending Renewal | true | Membership expiring; in grace period |
| `lapsed` | Lapsed | false | Failed to renew after grace period |
| `suspended` | Suspended | false | Admin action (conduct, fraud, etc.) |
| `not_a_member` | Not a Member | false | Never was a member or formally removed |

---

## 3. Valid Transitions

### Transition Table

| From | To | Trigger | Actor | Notes |
|------|----|---------|-------|-------|
| `unknown` | `pending_new` | data_cleanup | Admin | Assign status after data review |
| `unknown` | `active` | data_cleanup | Admin | If already paid/confirmed |
| `unknown` | `not_a_member` | data_cleanup | Admin | Not actually a member |
| `pending_new` | `active` | payment_received | System | Payment confirmed via Stripe/WA |
| `pending_new` | `not_a_member` | application_expired | System | Didn't pay within window |
| `active` | `pending_renewal` | membership_expiring | System | 30 days before expiry |
| `active` | `suspended` | admin_suspend | Admin | Policy violation |
| `pending_renewal` | `active` | payment_received | System | Renewed successfully |
| `pending_renewal` | `lapsed` | grace_period_expired | System | Didn't renew in time |
| `lapsed` | `active` | payment_received | System | Late renewal (if allowed) |
| `lapsed` | `not_a_member` | admin_archive | Admin | Cleanup old records |
| `suspended` | `active` | admin_reinstate | Admin | Suspension lifted |
| `suspended` | `lapsed` | admin_release | Admin | Released but not active |
| `suspended` | `not_a_member` | admin_remove | Admin | Permanent removal |
| `not_a_member` | `pending_new` | reapply | System | Former member reapplies |

### Invalid Transitions (Blocked)

These transitions should be **rejected by the system**:

- `active` → `pending_new` (can't go backwards in lifecycle)
- `lapsed` → `pending_renewal` (must go through payment flow)
- `not_a_member` → `active` (must reapply through `pending_new`)
- `suspended` → `pending_renewal` (suspension must be lifted first)

---

## 4. Transition Rules

### Automatic (System) Transitions

```typescript
// Pseudo-code for membership lifecycle cron job

async function processMembershipLifecycle() {
  const today = new Date();

  // 1. Active -> Pending Renewal (30 days before expiry)
  await prisma.member.updateMany({
    where: {
      membershipStatus: { code: "active" },
      membershipExpiresAt: { lte: addDays(today, 30) },
    },
    data: { membershipStatusId: await getStatusId("pending_renewal") },
  });

  // 2. Pending Renewal -> Lapsed (after grace period)
  await prisma.member.updateMany({
    where: {
      membershipStatus: { code: "pending_renewal" },
      membershipExpiresAt: { lte: subDays(today, 30) }, // 30-day grace
    },
    data: { membershipStatusId: await getStatusId("lapsed") },
  });

  // 3. Pending New -> Not a Member (application expired)
  await prisma.member.updateMany({
    where: {
      membershipStatus: { code: "pending_new" },
      createdAt: { lte: subDays(today, 90) }, // 90-day window
    },
    data: { membershipStatusId: await getStatusId("not_a_member") },
  });
}
```

### Admin Transitions

Admin transitions require:

1. **Capability check:** `membership:status:admin`
2. **Reason required:** Free-text explanation stored in audit log
3. **Audit entry:** All admin transitions logged with actor + reason

```typescript
async function adminTransition(
  memberId: string,
  newStatus: string,
  reason: string,
  adminId: string
): Promise<void> {
  // Validate transition is allowed
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { membershipStatus: true },
  });

  if (!isValidTransition(member.membershipStatus.code, newStatus)) {
    throw new Error(`Invalid transition: ${member.membershipStatus.code} -> ${newStatus}`);
  }

  // Perform transition
  await prisma.member.update({
    where: { id: memberId },
    data: { membershipStatusId: await getStatusId(newStatus) },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: "MEMBERSHIP_STATUS_CHANGE",
      resourceType: "Member",
      resourceId: memberId,
      memberId: adminId,
      metadata: {
        fromStatus: member.membershipStatus.code,
        toStatus: newStatus,
        reason,
      },
    },
  });
}
```

---

## 5. Payment Flow Integration

### New Member Payment

```
apply_online --> pending_new --> [payment] --> active
                     |
                     v (no payment)
                not_a_member
```

### Renewal Payment

```
active --> [30 days before expiry] --> pending_renewal
                                            |
                     +----------------------+----------------------+
                     |                                             |
                     v (payment)                                   v (no payment)
                  active                                        lapsed
             (membershipExpiresAt                                  |
              extended +1 year)                                    v
                                                             not_a_member
                                                             (after cleanup)
```

---

## 6. WA Sync Considerations

### Status Mapping from WA

The WA importer maps WA Contact.Status to Murmurant status codes. This is a **one-way sync** - Murmurant accepts WA as the source of truth for status.

| WA Status | Murmurant Status | Notes |
|-----------|---------------|-------|
| Active | active | Direct mapping |
| Lapsed | lapsed | Direct mapping |
| PendingNew | pending_new | Direct mapping |
| PendingRenewal | pending_renewal | Direct mapping |
| Suspended | suspended | Direct mapping |
| (other) | not_a_member | Fallback |

### Future: Bidirectional Sync

If Murmurant becomes the system of record, we would need:

1. **Murmurant -> WA webhook:** Push status changes to WA
2. **Conflict resolution:** Handle concurrent updates
3. **Audit trail:** Track which system initiated the change

---

## 7. UI Implications

### Member Dashboard

| Status | Can Access | Message |
|--------|------------|---------|
| active | Full access | Welcome! |
| pending_renewal | Full access | Your membership expires soon. [Renew Now] |
| pending_new | Limited | Your application is pending. [Complete Payment] |
| lapsed | Read-only | Your membership has lapsed. [Renew] |
| suspended | None | Your account is suspended. Contact admin. |
| not_a_member | None | [Join / Login] |

### Admin Actions by Status

| Status | Available Admin Actions |
|--------|------------------------|
| unknown | Assign status, Delete |
| pending_new | Mark active, Cancel |
| active | Suspend |
| pending_renewal | Force lapse, Extend |
| lapsed | Reinstate, Archive |
| suspended | Reinstate, Remove |
| not_a_member | Delete record |

---

## 8. Implementation Checklist

### Required Schema Fields

```prisma
model Member {
  // ... existing fields ...

  // Add these for lifecycle management:
  membershipExpiresAt   DateTime?  // When current membership ends
  suspendedAt           DateTime?  // When suspension started
  suspensionReason      String?    // Why suspended
  lastRenewalAt         DateTime?  // Last successful renewal
}
```

### Required Cron Jobs

1. **Daily:** Process expiring memberships (active -> pending_renewal)
2. **Daily:** Process grace period expiry (pending_renewal -> lapsed)
3. **Weekly:** Cleanup stale pending_new applications

### Required Audit Events

- `MEMBERSHIP_STATUS_CHANGE` - All status transitions
- `MEMBERSHIP_RENEWAL` - Successful renewals
- `MEMBERSHIP_SUSPENSION` - Admin suspensions
- `MEMBERSHIP_REINSTATEMENT` - Admin reinstatements

---

## 9. Testing Requirements

### Unit Tests

- Valid transition matrix (all allowed transitions succeed)
- Invalid transition matrix (all blocked transitions fail)
- Status code to isActive/isBoardEligible mapping

### Integration Tests

- New member application flow (pending_new -> active)
- Renewal flow (pending_renewal -> active)
- Lapse flow (pending_renewal -> lapsed)
- Admin suspension/reinstatement flow

---

*Document maintained by Murmurant development team. Charter P3 compliance: Explicit state machines for workflows.*
