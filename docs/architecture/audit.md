# Audit Logging Architecture

## Charter References

- **P1**: Identity and authorization must be provable
- **P7**: Observability is a product feature
- **P9**: Security must fail closed

## Anti-patterns Avoided

- **N6**: Never allow silent failures
- **N8**: Never use ad-hoc logging

## Overview

ClubOS requires audit logging for all privileged mutations to ensure accountability and traceability. Every action that modifies sensitive data (members, transitions, registrations, governance) must produce an audit trail that answers: **who** did **what** to **which entity** and **when**.

## Canonical Audit API

The canonical audit API is located at `src/lib/audit.ts`. Use this API instead of direct database writes or ad-hoc logging.

### Basic Usage

```typescript
import { audit } from "@/lib/audit";

// Log a mutation
await audit.mutation({
  action: "UPDATE",
  actorId: auth.context.memberId,
  targetType: "member",
  targetId: memberId,
  metadata: { operation: "status_change", newStatus: "INACTIVE" },
});
```

## CI Enforcement

The CI script `scripts/ci/check-audit-coverage.sh` scans privileged mutation routes to ensure audit logging is present.

### Privileged Paths

Routes under these paths require audit logging for mutations (POST/PATCH/PUT/DELETE):

- `v1/admin/*`
- `v1/officer/*`
- `admin/content/*`
- `admin/comms/*`

### Accepted Patterns

The script looks for these patterns to confirm audit logging:

- `audit.log(` - Canonical audit API
- `audit.mutation(` - Mutation helper
- `withAudit(` - Audit wrapper
- `createAuditLog(` - Legacy audit function

### Waiver Annotation

If a route cannot have audit logging (e.g., stub routes), add a waiver comment inside the function body:

```typescript
export async function POST(req: NextRequest, { params }: RouteParams) {
  // AUDIT:WAIVE reason=stub-not-implemented owner=edf@sbnewcomers.org expires=2025-06-16
  // ... rest of implementation
}
```

**Waiver fields:**

- `reason` - Why the waiver is needed
- `owner` - Email of responsible party
- `expires` - Date when waiver expires (YYYY-MM-DD)

Expired waivers are treated as violations.

### Running the Check

```bash
# Run the audit coverage check
./scripts/ci/check-audit-coverage.sh

# Check specific directory
./scripts/ci/check-audit-coverage.sh src/app/api/v1/admin
```

## Entity Types

Use consistent entity type names:

| Entity Type | Description |
|-------------|-------------|
| member | Member records |
| event | Event records |
| registration | Event registrations |
| transition_plan | Service transition plans |
| transition_assignment | Assignments within plans |
| service_record | Service history records |
| page | CMS pages |
| template | Content templates |
| theme | Visual themes |
| campaign | Email campaigns |
| mailing_list | Email lists |

## Best Practices

1. **Always log mutations** - Every privileged mutation should have audit logging.

2. **Include meaningful metadata** - Add context that helps reconstruct what happened (operation type, key field changes).

3. **Use consistent entity types** - Follow the naming conventions above.

4. **Log denials** - When authorization fails, log to track access attempts.

## Database Schema

Audit logs are stored in the `AuditLog` table:

```prisma
model AuditLog {
  id           String      @id @default(uuid()) @db.Uuid
  action       AuditAction
  resourceType String      // Entity type (page, template, member, etc.)
  resourceId   String      @db.Uuid
  memberId     String?     @db.Uuid  // Actor
  before       Json?       // State before change
  after        Json?       // State after change
  metadata     Json?       // Additional context + outcome
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime    @default(now())
}
```
