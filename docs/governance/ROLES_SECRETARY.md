# Secretary Role

Copyright (c) Santa Barbara Newcomers Club

## Responsibilities Summary

The Secretary is the official record keeper for Board meetings. This role documents decisions, maintains meeting minutes, and ensures accurate records of Board proceedings without holding authority to finalize official documents unilaterally.

**Core duties:**

- Draft minutes for Board meetings
- Edit and refine draft minutes based on feedback
- Submit draft minutes for President approval
- Maintain access to meeting records
- Read internal governance documents for reference

## Capabilities

### What the Secretary CAN do

| Capability | Description |
|------------|-------------|
| `meetings:read` | View all Board meeting records |
| `meetings:minutes:draft:create` | Create new draft minutes |
| `meetings:minutes:draft:edit` | Edit draft minutes before submission |
| `meetings:minutes:draft:submit` | Submit drafts for President review |
| `meetings:minutes:read_all` | Read all minutes (draft and final) |
| `governance:docs:read` | Read internal governance documents |

### What the Secretary CANNOT do

| Restricted Area | Rationale |
|-----------------|-----------|
| `meetings:minutes:finalize` | President approves final minutes - two-person integrity |
| `finance:view` / `finance:manage` | No financial oversight authority |
| `members:view` / `members:history` | No need to access member PII or service records |
| `publishing:manage` | Website content is not within scope |
| `users:manage` | Cannot change role assignments |
| `exports:access` | No data export authority |
| `governance:docs:write` | Can read but not author governance docs (Parliamentarian scope) |
| `admin:full` | Not a system administrator |

## Governance Rationale

### Charter Alignment

This role implements several Charter principles:

- **P1 (Identity must be provable):** Minutes record who said/did what. The Secretary's actions are logged and attributable.

- **P2 (Default deny, least privilege):** The Secretary has minimal capabilities needed for record keeping. No access to member data, finances, or publishing.

- **P5 (Undoable actions):** Draft minutes can be edited until finalized. The draft workflow allows corrections.

### Two-Person Integrity for Minutes

The minutes workflow requires two parties:

1. **Secretary** drafts and edits minutes
2. **President** reviews and finalizes minutes

This separation ensures:

- No single person can create official records unilaterally
- Draft minutes can be corrected before becoming official
- Clear audit trail of who drafted vs. who approved

The Secretary explicitly lacks `meetings:minutes:finalize` - this capability belongs to the President (or admin).

### Separation of Concerns

The Secretary role is deliberately separated from:

1. **Parliamentarian:** The Secretary records what happened; the Parliamentarian advises on what should happen procedurally.

2. **President:** The Secretary drafts; the President approves. This maintains checks and balances.

3. **Treasurer:** Financial records are separate from meeting minutes.

## Workflow Integration

### Minutes Workflow

```
Secretary                      President
    |                              |
    |  [draft:create]              |
    |  Creates draft minutes       |
    |                              |
    |  [draft:edit]                |
    |  Refines draft               |
    |                              |
    |  [draft:submit] -----------> |
    |  Submits for review          |
    |                              |
    |                    [minutes:finalize]
    |                    Reviews and approves
    |                              |
    | <--------------------------- |
    |  Final minutes published     |
```

### Status Transitions

Minutes follow a controlled status flow:

- **DRAFT** - Secretary is preparing (editable)
- **SUBMITTED** - Awaiting President review (read-only for Secretary)
- **APPROVED** - President has finalized (official record)
- **RETURNED** - President requested changes (Secretary can edit again)

The Secretary can only modify minutes in DRAFT or RETURNED status.

## Related Documentation

- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) - Core system principles
- [ROLES_PARLIAMENTARIAN.md](./ROLES_PARLIAMENTARIAN.md) - Complementary governance role
