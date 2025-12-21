# Guarantee Implementation Briefs

Copyright (c) Santa Barbara Newcomers Club

Status: Implementation Specification
Last Updated: 2025-12-21

---

## Purpose

This document provides implementation briefs for the TOP 6 paper guarantees
identified in GUARANTEE_TO_PRODUCT_SURFACE_MAP.md that have:

- Status = NOT IMPLEMENTED or PARTIAL
- Risk = Security or Financial or Data loss

Each brief specifies the minimum work required to convert a paper guarantee
into an enforced product guarantee.

---

## Selection Criteria

| ID | Guarantee | Status | Risk Category |
|----|-----------|--------|---------------|
| SD-3 | Chairs cannot escalate permissions | NOT IMPLEMENTED | Security |
| TB-1 | Access activates at scheduled time | NOT IMPLEMENTED | Security |
| TB-2 | Access expires at scheduled time | NOT IMPLEMENTED | Security |
| DM-3 | Chairs cannot assign roles | NOT IMPLEMENTED | Security |
| DM-4 | No cross-domain delegation | NOT IMPLEMENTED | Security |
| AU-1 | All assignments logged | PARTIAL | Data loss |

---

## Brief 1: SD-3 - Escalation Prevention

### Guarantee Description

**SD-3**: A user cannot grant capabilities they do not possess.

When creating or modifying a role assignment, the assigner's capabilities must
be a superset of the capabilities being granted. Self-escalation is blocked.

### Failure Mode Prevented

**MF-3 (Coarse Permissions)**: Without escalation prevention, a committee chair
could create an assignment granting `admin:full` to themselves or others,
bypassing the authorization hierarchy.

### Data Model Changes

None required. Existing models are sufficient.

### Required API Changes

**File**: `src/lib/auth.ts`

Add validation function:

```typescript
/**
 * Validate that assigner has all capabilities being granted.
 * Charter P2: Cannot escalate beyond own permissions.
 */
export function canGrantCapabilities(
  assignerRole: GlobalRole,
  targetCapabilities: Capability[]
): { allowed: boolean; denied: Capability[] } {
  const assignerCaps = getEffectiveCapabilities(assignerRole);
  const denied = targetCapabilities.filter(
    (cap) => !assignerCaps.includes(cap) && !assignerCaps.includes("admin:full")
  );
  return {
    allowed: denied.length === 0,
    denied,
  };
}
```

**File**: `src/app/api/v1/admin/transitions/[id]/assignments/route.ts`

Add validation before assignment creation:

```typescript
// Before creating assignment
const targetRole = await prisma.committeeRole.findUnique({
  where: { id: committeeRoleId },
  select: { capabilities: true },
});

const check = canGrantCapabilities(auth.context.globalRole, targetRole.capabilities);
if (!check.allowed) {
  await createAuditLog({
    action: "ESCALATION_BLOCKED",
    resourceType: "RoleAssignment",
    resourceId: "attempted",
    memberId: auth.context.memberId,
    metadata: { deniedCapabilities: check.denied },
  });
  return NextResponse.json(
    { error: "Cannot grant capabilities you do not have", denied: check.denied },
    { status: 403 }
  );
}
```

### Required UI Surfaces

None. Enforcement is server-side only. UI may show error message on rejection.

### Audit Artifacts Required

| Event | Fields |
|-------|--------|
| ESCALATION_BLOCKED | actor, targetCapabilities, deniedCapabilities, timestamp |

### Test Types

| Type | Description |
|------|-------------|
| Unit | `canGrantCapabilities()` returns correct results for capability subsets |
| Unit | `canGrantCapabilities()` blocks escalation attempts |
| Integration | API rejects assignment when assigner lacks capabilities |
| Gate | Escalation attempt is logged with denied capabilities |

---

## Brief 2: TB-1 - Time-Based Access Activation

### Guarantee Description

**TB-1**: A role assignment with a future `startDate` is not effective until
that date arrives. Permission checks must validate against current time.

### Failure Mode Prevented

**MF-2 (Irreversible Actions)**: Without time validation, a future-dated
assignment grants immediate access, defeating the purpose of scheduled
role transitions and creating unauthorized access windows.

### Data Model Changes

None required. RoleAssignment already has `startDate` field.

### Required API Changes

**File**: `src/lib/auth.ts`

Modify capability resolution to include date validation:

```typescript
/**
 * Get member's effective capabilities considering time bounds.
 * Charter P2: Time-bounded authority.
 */
export async function getEffectiveCapabilitiesForMember(
  memberId: string,
  asOfDate: Date = new Date()
): Promise<{ role: GlobalRole; capabilities: Capability[]; assignments: RoleAssignment[] }> {
  const assignments = await prisma.roleAssignment.findMany({
    where: {
      memberId,
      startDate: { lte: asOfDate },  // Must have started
      OR: [
        { endDate: null },
        { endDate: { gt: asOfDate } },  // Must not have ended
      ],
    },
    include: { committeeRole: true },
  });

  // Aggregate capabilities from active assignments
  const capabilities = assignments.flatMap(
    (a) => a.committeeRole.capabilities as Capability[]
  );

  return {
    role: deriveGlobalRole(assignments),
    capabilities: [...new Set(capabilities)],
    assignments,
  };
}
```

**File**: `src/lib/auth.ts`

Update `requireCapability()` to use time-aware check:

```typescript
// In requireCapability(), after getting authResult:
const effectiveCaps = await getEffectiveCapabilitiesForMember(
  authResult.context.memberId
);

if (!effectiveCaps.capabilities.includes(capability) &&
    !effectiveCaps.capabilities.includes("admin:full")) {
  return {
    ok: false,
    response: NextResponse.json(
      { error: "Access denied", message: `Required capability: ${capability}` },
      { status: 403 }
    ),
  };
}
```

### Required UI Surfaces

None for enforcement. Optional: Display "Access begins [date]" on assignments.

### Audit Artifacts Required

| Event | Fields |
|-------|--------|
| ACCESS_DENIED_NOT_YET_ACTIVE | actor, assignmentId, startDate, attemptedAction |

### Test Types

| Type | Description |
|------|-------------|
| Unit | `getEffectiveCapabilitiesForMember()` excludes future-dated assignments |
| Unit | Assignment with startDate tomorrow returns empty capabilities today |
| Integration | API denies action when assignment has future startDate |
| Gate | Future-dated assignment does not grant immediate access |

---

## Brief 3: TB-2 - Time-Based Access Expiration

### Guarantee Description

**TB-2**: A role assignment with a past `endDate` is no longer effective.
Permission checks must validate against current time.

### Failure Mode Prevented

**MF-2 (Irreversible Actions)**: Without expiration validation, a role
assignment remains effective indefinitely even after its term ends, creating
stale access that persists until manual removal.

### Data Model Changes

None required. RoleAssignment already has `endDate` field.

### Required API Changes

Same as TB-1. The `getEffectiveCapabilitiesForMember()` function handles both:

```typescript
where: {
  memberId,
  startDate: { lte: asOfDate },  // TB-1: Must have started
  OR: [
    { endDate: null },
    { endDate: { gt: asOfDate } },  // TB-2: Must not have ended
  ],
},
```

### Required UI Surfaces

None for enforcement. Optional: Display "Access expires [date]" on assignments.

### Audit Artifacts Required

| Event | Fields |
|-------|--------|
| ACCESS_DENIED_EXPIRED | actor, assignmentId, endDate, attemptedAction |

### Test Types

| Type | Description |
|------|-------------|
| Unit | `getEffectiveCapabilitiesForMember()` excludes expired assignments |
| Unit | Assignment with endDate yesterday returns empty capabilities today |
| Integration | API denies action when assignment has past endDate |
| Gate | Expired assignment does not grant access |

---

## Brief 4: DM-3 - Chairs Cannot Assign Roles

### Guarantee Description

**DM-3**: Users with committee chair roles cannot create role assignments.
Only users with `roles:assign` capability can delegate authority.

### Failure Mode Prevented

**MF-3 (Coarse Permissions)**: Without role assignment restrictions, a
committee chair could create unauthorized role assignments, bypassing the
delegation hierarchy and creating shadow authority structures.

### Data Model Changes

None required. Add `roles:assign` to Capability type if not present.

**File**: `src/lib/auth.ts`

Verify capability exists:

```typescript
export type Capability =
  | ...existing...
  | "roles:assign"  // Authority to create role assignments
  | "roles:view";   // Authority to view role assignments
```

### Required API Changes

**File**: `src/app/api/v1/admin/transitions/[id]/assignments/route.ts`

Update POST handler:

```typescript
export async function POST(req: NextRequest, { params }: RouteParams) {
  // Require roles:assign capability
  const auth = await requireCapability(req, "roles:assign");
  if (!auth.ok) return auth.response;

  // ... existing assignment creation logic
}
```

**File**: `src/lib/auth.ts`

Update ROLE_CAPABILITIES to exclude `roles:assign` from chair roles:

```typescript
const ROLE_CAPABILITIES: Record<GlobalRole, Capability[]> = {
  admin: [..., "roles:assign", ...],
  president: [..., "roles:assign", ...],
  "vp-activities": [..., "roles:assign", ...],  // Can assign event chairs
  "event-chair": [...],  // NO roles:assign
  webmaster: [...],      // NO roles:assign
  member: [...],         // NO roles:assign
};
```

### Required UI Surfaces

None. Assignment UI should be hidden for users without `roles:assign`.

### Audit Artifacts Required

| Event | Fields |
|-------|--------|
| ASSIGNMENT_DENIED_NO_AUTHORITY | actor, attemptedAssignee, attemptedRole |

### Test Types

| Type | Description |
|------|-------------|
| Unit | Event chair role does not include `roles:assign` capability |
| Integration | API rejects assignment request from event chair |
| Gate | Chair cannot create role assignments |

---

## Brief 5: DM-4 - No Cross-Domain Delegation

### Guarantee Description

**DM-4**: A user can only create role assignments within their scope. VP of
Activities can assign event chairs but not communications roles. Scope
boundaries are enforced server-side.

### Failure Mode Prevented

**MF-3 (Coarse Permissions)**: Without scope enforcement, a VP could create
role assignments outside their domain, bypassing organizational boundaries
and creating unauthorized cross-functional authority.

### Data Model Changes

None required. CommitteeRole already has `committeeId` for scope.

### Required API Changes

**File**: `src/lib/auth.ts`

Add scope validation function:

```typescript
/**
 * Validate that assigner has authority over target committee.
 * Charter P2: Object-scoped authorization.
 */
export async function canAssignToCommittee(
  assignerMemberId: string,
  assignerRole: GlobalRole,
  targetCommitteeId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // admin:full can assign anywhere
  if (hasCapability(assignerRole, "admin:full")) {
    return { allowed: true };
  }

  // Get assigner's committee assignments
  const assignerAssignments = await prisma.roleAssignment.findMany({
    where: {
      memberId: assignerMemberId,
      startDate: { lte: new Date() },
      OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
    },
    select: { committeeId: true, committeeRole: { select: { canDelegate: true } } },
  });

  // Check if assigner has delegating authority in target committee
  const hasAuthority = assignerAssignments.some(
    (a) => a.committeeId === targetCommitteeId && a.committeeRole.canDelegate
  );

  if (!hasAuthority) {
    return {
      allowed: false,
      reason: "Cannot assign roles outside your committee scope",
    };
  }

  return { allowed: true };
}
```

**File**: `src/app/api/v1/admin/transitions/[id]/assignments/route.ts`

Add scope validation:

```typescript
// After capability check, before assignment creation
const scopeCheck = await canAssignToCommittee(
  auth.context.memberId,
  auth.context.globalRole,
  committeeId
);

if (!scopeCheck.allowed) {
  await createAuditLog({
    action: "CROSS_SCOPE_BLOCKED",
    resourceType: "RoleAssignment",
    resourceId: "attempted",
    memberId: auth.context.memberId,
    metadata: { targetCommitteeId: committeeId, reason: scopeCheck.reason },
  });
  return NextResponse.json(
    { error: scopeCheck.reason },
    { status: 403 }
  );
}
```

### Required UI Surfaces

None for enforcement. Optional: Filter committee dropdown to assignable scope.

### Audit Artifacts Required

| Event | Fields |
|-------|--------|
| CROSS_SCOPE_BLOCKED | actor, targetCommitteeId, assignerScope, reason |

### Test Types

| Type | Description |
|------|-------------|
| Unit | `canAssignToCommittee()` allows assignment within scope |
| Unit | `canAssignToCommittee()` blocks assignment outside scope |
| Integration | API rejects cross-committee assignment |
| Gate | VP Activities cannot assign communications roles |

---

## Brief 6: AU-1 - Complete Assignment Audit Logging

### Guarantee Description

**AU-1**: Every role assignment create, update, and end operation produces
an audit log entry with actor, action, before/after state, and timestamp.

### Failure Mode Prevented

**MF-4 (Incomplete Audit Trail)**: Without comprehensive logging, security
investigations cannot determine who granted access, when, or why. Compliance
requirements cannot be met.

### Data Model Changes

**File**: `prisma/schema.prisma`

Add fields to RoleAssignment:

```prisma
model RoleAssignment {
  id              String    @id @default(uuid()) @db.Uuid
  memberId        String    @db.Uuid
  committeeId     String    @db.Uuid
  committeeRoleId String    @db.Uuid
  termId          String    @db.Uuid
  startDate       DateTime
  endDate         DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // AU-1: Attribution fields
  assignedById    String?   @db.Uuid
  endedById       String?   @db.Uuid
  endReason       String?

  member        Member        @relation(fields: [memberId], references: [id])
  committee     Committee     @relation(fields: [committeeId], references: [id])
  committeeRole CommitteeRole @relation(fields: [committeeRoleId], references: [id])
  term          Term          @relation(fields: [termId], references: [id])
  assignedBy    Member?       @relation("AssignedByMember", fields: [assignedById], references: [id])
  endedBy       Member?       @relation("EndedByMember", fields: [endedById], references: [id])

  @@index([memberId])
  @@index([committeeId])
  @@index([assignedById])
}
```

### Required API Changes

**File**: `src/app/api/v1/admin/transitions/[id]/assignments/route.ts`

Ensure audit logging on all operations:

```typescript
// On CREATE
const assignment = await prisma.roleAssignment.create({
  data: {
    ...assignmentData,
    assignedById: auth.context.memberId,
  },
});

await createAuditLog({
  action: "CREATE",
  resourceType: "RoleAssignment",
  resourceId: assignment.id,
  memberId: auth.context.memberId,
  before: null,
  after: assignment,
  metadata: { termId, committeeId, targetMemberId: memberId },
});
```

```typescript
// On UPDATE
const before = await prisma.roleAssignment.findUnique({ where: { id } });
const after = await prisma.roleAssignment.update({ where: { id }, data });

await createAuditLog({
  action: "UPDATE",
  resourceType: "RoleAssignment",
  resourceId: id,
  memberId: auth.context.memberId,
  before,
  after,
});
```

```typescript
// On END (soft termination)
const before = await prisma.roleAssignment.findUnique({ where: { id } });
const after = await prisma.roleAssignment.update({
  where: { id },
  data: {
    endDate: new Date(),
    endedById: auth.context.memberId,
    endReason: reason,
  },
});

await createAuditLog({
  action: "END",
  resourceType: "RoleAssignment",
  resourceId: id,
  memberId: auth.context.memberId,
  before,
  after,
  metadata: { reason },
});
```

### Required UI Surfaces

None for enforcement. Optional: Audit log viewer showing assignment history.

### Audit Artifacts Required

| Event | Fields |
|-------|--------|
| CREATE | actor, assignmentId, targetMember, role, committee, term, startDate |
| UPDATE | actor, assignmentId, before, after, changedFields |
| END | actor, assignmentId, endDate, endReason |

### Test Types

| Type | Description |
|------|-------------|
| Unit | Assignment creation sets assignedById |
| Unit | Assignment termination sets endedById and endReason |
| Integration | AuditLog entry created on assignment create |
| Integration | AuditLog entry includes before/after on update |
| Gate | All assignment operations produce audit entries |

---

## Implementation Priority

| Priority | Guarantee | Rationale |
|----------|-----------|-----------|
| 1 | TB-1 + TB-2 | Combined implementation; blocks stale/premature access |
| 2 | SD-3 | Prevents privilege escalation |
| 3 | DM-3 | Prevents unauthorized delegation |
| 4 | DM-4 | Prevents cross-domain scope violation |
| 5 | AU-1 | Enables investigation of 1-4 |

**Note**: TB-1 and TB-2 share implementation; count as single work unit.

---

## Verification Checklist

Before marking any guarantee IMPLEMENTED:

- [ ] Unit tests pass for all new functions
- [ ] Integration tests cover API rejection paths
- [ ] Audit log entries verified in test database
- [ ] No capability check bypasses `getEffectiveCapabilitiesForMember()`
- [ ] Charter principles (P1, P2, P7) satisfied

---

## See Also

- [Guarantee to Product Surface Map](../architecture/GUARANTEE_TO_PRODUCT_SURFACE_MAP.md) - Source analysis
- [WA Failure Immunity Test Narratives](../architecture/WA_FAILURE_IMMUNITY_TEST_NARRATIVES.md) - Failure mode definitions
- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) - Governing principles
- [RBAC Delegation Matrix](../rbac/RBAC_DELEGATION_MATRIX.md) - Delegation rules
