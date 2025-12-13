# External Systems and SSO Specification

**Audience**: Tech Chair, Board, System Administrators
**Purpose**: Define integration patterns for external systems and single sign-on

---

## Principles

### ClubOS as Identity System of Record

ClubOS is the authoritative source for:

- Member identity and contact information
- Role and group membership
- Authorization decisions for club systems

External tools integrate with ClubOS for identity and access control where
feasible. ClubOS does not defer to external systems for authorization decisions.

### Integration Philosophy

- **SSO where feasible**: External tools should authenticate via ClubOS SSO
  rather than maintaining separate credentials.
- **Avoid orphan systems**: Do not adopt external tools unless the club can
  staff ongoing administration. Unmaintained integrations become security risks.
- **Role-based ownership**: External system access is tied to roles, not
  individuals. When a volunteer transitions out, access transfers with the role.

---

## SSO Architecture (Requirements Level)

### Protocol Preferences

| Priority | Protocol | Use Case |
|----------|----------|----------|
| 1 | OIDC (OpenID Connect) | Default for new integrations |
| 2 | SAML 2.0 | Only if external system requires it |
| 3 | API key with rotation | Service-to-service only |

### Role and Group Mapping

ClubOS roles and groups map to external system access:

```
ClubOS Role/Group          External System Access
-----------------          ----------------------
Admin                  ->  Full admin in connected tools
VP of Activities       ->  Event management tools (read/write)
Event Chair            ->  Event-specific tool access
Finance Manager        ->  Bill.com approver access
Member                 ->  Member-facing portals only
```

External systems should query ClubOS (or receive claims via OIDC) to determine
access level. External systems must not maintain independent permission lists.

### Session and Logout

- Session lifetime: Align with ClubOS session (default 8 hours, configurable).
- Logout: Best-effort single logout. External systems should honor logout
  requests, but ClubOS cannot guarantee all external sessions terminate.
- Re-authentication: External systems may require re-auth for sensitive actions.

### Audit Requirements

At minimum, ClubOS must log:

- Who accessed an external system (link-out timestamp)
- Which external system was accessed
- Role/group at time of access

Full activity logging within external systems is the responsibility of each
external system. ClubOS audit is for access events, not in-tool actions.

---

## External Integration Patterns

### Pattern 1: Link-Out Only (Short-Term)

Used when SSO is not yet implemented or not supported by the external system.

- ClubOS provides a link to the external tool.
- User authenticates separately in the external tool.
- ClubOS logs the link-out event (who, when, which tool).
- No credential sharing; users manage their own external accounts.

**Limitations**: No single sign-on, no automatic access revocation.

### Pattern 2: OAuth/OIDC SSO (Preferred)

Used when the external system supports OIDC or OAuth.

- User clicks link in ClubOS.
- ClubOS redirects to external system with OIDC flow.
- External system validates token and grants access based on claims.
- Session tied to ClubOS session.
- Access revocation propagates when ClubOS role changes.

**Requirements**: External system must support OIDC/OAuth. ClubOS must expose
an identity provider endpoint.

### Pattern 3: Service Account (Break-Glass Only)

Used for system-to-system integrations or emergency access.

- Service account credentials stored securely (secrets manager, not code).
- Credentials owned by a role, not a person.
- Rotation policy: At minimum, rotate on role transition and annually.
- Usage logged and reviewed.
- Break-glass access requires documented justification.

**Warning**: Service accounts are a last resort. Prefer SSO for human access.

---

## JotForm Integration Plan

JotForm is currently used for event request submissions. The plan is to
transition to native ClubOS UI over time while maintaining JotForm as a
fallback during the transition.

### Phase 1: JotForm as Form UI (Current)

- Event Chairs and members submit requests via JotForm.
- JotForm webhook posts submission data to ClubOS API.
- ClubOS creates EventRequest record from webhook payload.
- ClubOS is the system of record for event requests.
- JotForm is the form UI only; it does not store authoritative data.

Data flow:
```
JotForm Form  -->  Webhook  -->  ClubOS API  -->  EventRequest Table
     ^                                                   |
     |                                                   v
 (User fills form)                              (Stored in ClubOS)
```

### Phase 2: ClubOS Native UI (Planned)

- Build native event request form in ClubOS.
- Support both submission methods during transition:
  - New: Native ClubOS form (preferred)
  - Legacy: JotForm webhook (maintained for backwards compatibility)
- Encourage adoption of native form through training and documentation.

### Phase 3: JotForm Retirement (Future)

- Disable JotForm webhook endpoint after adoption threshold reached.
- Archive JotForm forms (read-only) for historical reference.
- All new event requests through ClubOS native UI only.

**Timeline**: Phases are not date-bound. Transition depends on native UI
readiness and user adoption.

---

## Bill.com Integration Plan

Bill.com is used for reimbursement processing. QuickBooks remains the system
of record for accounting.

### Data Ownership

| Data Type | System of Record | Synced To |
|-----------|------------------|-----------|
| Reimbursement requests | ClubOS | Bill.com (for processing) |
| Approval workflow | ClubOS | Bill.com (status sync) |
| Payment execution | Bill.com | QuickBooks (accounting) |
| Accounting entries | QuickBooks | (authoritative) |

### Integration Flow

```
Member submits reimbursement request in ClubOS
                    |
                    v
         Finance Manager approves in ClubOS
                    |
                    v
         ClubOS pushes approved request to Bill.com
                    |
                    v
         Bill.com processes payment
                    |
                    v
         Bill.com syncs to QuickBooks
                    |
                    v
         QuickBooks records accounting entry
```

### Access Control

- Finance Manager role in ClubOS maps to approver access in Bill.com.
- Bill.com admin access limited to Tech Chair and Treasurer.
- Service account for API integration owned by Finance Manager role.

---

## Term Transition and Ownership

### Access Review

At each board term transition:

1. Review all external system access grants.
2. Revoke access for outgoing role holders.
3. Grant access for incoming role holders.
4. Rotate any shared credentials or service accounts.
5. Update emergency contact lists for each external system.

### Credential Rotation Policy

| Credential Type | Rotation Trigger |
|-----------------|------------------|
| Service accounts | Role transition, annually, or on suspected compromise |
| API keys | Role transition, annually |
| Admin passwords | Role transition (ideally eliminate via SSO) |

### Documentation Requirements

Each external system integration must document:

- Purpose and business justification
- Data flows (what goes where)
- Access control mapping (ClubOS role -> external access)
- Credential storage location (not the credential itself)
- Owner role (not person)
- Backup/recovery procedure
- Offboarding checklist

### Offboarding Checklist Template

When a volunteer leaves a role with external system access:

- [ ] Remove from external system (or transfer ownership)
- [ ] Rotate any credentials they had access to
- [ ] Review recent activity for anomalies
- [ ] Update documentation if procedures changed
- [ ] Confirm successor has necessary access
- [ ] Log the transition in ClubOS audit trail

---

## Security Posture

### Avoid Shared Admin Accounts

- Each administrator should have individual credentials where possible.
- Shared accounts are acceptable only when the external system does not support
  multiple admins (document this limitation).
- Never share credentials via email or chat; use a secrets manager.

### Break-Glass Access

Emergency admin access (break-glass) must:

- Be documented and justified.
- Use time-limited credentials where possible.
- Trigger an alert to the Tech Chair.
- Be reviewed in the next board meeting.

### Vendor Security Assessment

Before adopting a new external system:

- Review vendor security documentation.
- Confirm SSO support (OIDC preferred).
- Understand data residency and backup policies.
- Assess vendor's incident response process.
- Document exit strategy (data export, account closure).

---

## Related Documents

- SYSTEM_SPEC.md (External Systems and SSO section)
- docs/rbac/AUTH_AND_RBAC.md (External Responsibility Roles)
- docs/QUICKBOOKS_INTEGRATION.md (accounting system of record)

---

*Document maintained by ClubOS development team. Last updated: December 2024*
