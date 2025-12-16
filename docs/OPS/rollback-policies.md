# Rollback Policies

This document describes which actions can be undone and under what conditions.

## Charter Principles

- **P1**: Identity must be provable (who performed the rollback)
- **P2**: Default deny, least privilege (capability-based permissions)
- **P5**: Every important action must be undoable
- **P9**: Security must fail closed (validation before execution)

## Action Classifications

Actions are classified into three categories:

1. **FULLY_REVERSIBLE** - Can be directly undone by restoring the previous state
2. **COMPENSATABLE** - Can be undone through a compensating action
3. **IRREVERSIBLE** - Cannot be undone (e.g., sent emails)

## Rollback Policies by Resource

### Event

| Action | Classification | Time Window | Notes |
|--------|---------------|-------------|-------|
| PUBLISH | COMPENSATABLE | 24 hours | Requires confirmation. Warns if registrations exist. |
| UNPUBLISH | FULLY_REVERSIBLE | Unlimited | Can re-publish at any time. |
| UPDATE | FULLY_REVERSIBLE | 72 hours | Restores previous values from audit log. |

### Member

| Action | Classification | Time Window | Notes |
|--------|---------------|-------------|-------|
| UPDATE | FULLY_REVERSIBLE | 7 days | Restores previous member details. |

### RoleAssignment

| Action | Classification | Time Window | Notes |
|--------|---------------|-------------|-------|
| CREATE | COMPENSATABLE | 24 hours | Ends assignment by setting endDate. |
| DELETE | COMPENSATABLE | 7 days | Restores role assignment. |

### MemberServiceHistory

| Action | Classification | Time Window | Notes |
|--------|---------------|-------------|-------|
| UPDATE | FULLY_REVERSIBLE | 7 days | Restores previous service record state. |

### TransitionPlan

| Action | Classification | Time Window | Notes |
|--------|---------------|-------------|-------|
| UPDATE | FULLY_REVERSIBLE | Unlimited | Blocked if plan has been applied. |

### Page

| Action | Classification | Time Window | Notes |
|--------|---------------|-------------|-------|
| PUBLISH | FULLY_REVERSIBLE | Unlimited | Can unpublish at any time. |
| UNPUBLISH | FULLY_REVERSIBLE | Unlimited | Can re-publish at any time. |
| UPDATE | FULLY_REVERSIBLE | 7 days | Restores previous content. |

### MessageCampaign

| Action | Classification | Time Window | Notes |
|--------|---------------|-------------|-------|
| SEND | IRREVERSIBLE | N/A | Emails cannot be recalled once sent. |

## API Endpoints

### List Rollbackable Actions

```
GET /api/v1/admin/rollback
```

Query parameters:

- `limit` (optional): Number of results (1-100, default 20)
- `resourceType` (optional): Filter by resource type
- `since` (optional): ISO datetime to filter from

### Preview Rollback

```
GET /api/v1/admin/rollback/:auditLogId/preview
```

Returns:

- Whether the action can be rolled back
- Current and target states
- Cascade effects and warnings
- Confirmation token (if required)

### Execute Rollback

```
POST /api/v1/admin/rollback/:auditLogId
```

Request body:

```json
{
  "reason": "Explanation for the rollback (10-500 chars)",
  "confirmationToken": "token from preview (if required)",
  "dryRun": false
}
```

## Confirmation Flow

For COMPENSATABLE actions, a two-step confirmation is required:

1. Call the preview endpoint to get a confirmation token
2. Include the token when executing the rollback

Tokens are valid for 10 minutes.

## Cascade Checks

Before a rollback executes, cascade checks validate safety:

- **checkEventRegistrations**: Warns if event has active registrations
- **checkCapacityChangeImpact**: Warns if event has confirmed registrations
- **checkMemberRoleAssignments**: Warns if member has active roles
- **checkSupersedingServiceRecord**: Blocks if newer record exists
- **checkTransitionNotApplied**: Blocks if transition plan was applied

## Audit Trail

All rollbacks create audit log entries with special metadata:

```json
{
  "isRollback": true,
  "originalAuditLogId": "uuid",
  "originalAction": "PUBLISH",
  "originalTimestamp": "2025-01-15T10:00:00Z"
}
```

## Required Capability

All rollback operations require the `admin:full` capability.
