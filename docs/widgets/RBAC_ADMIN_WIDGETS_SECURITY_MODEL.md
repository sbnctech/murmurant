# RBAC Admin Widgets Security Model

Scope
- Admin widgets that mutate access control (roles, groups, permissions).
- Includes "View As" simulator and audit viewer.

Threat model highlights
- Privilege escalation via UI tampering
- Data leakage via overly broad list responses
- Confused deputy (widget requests action beyond viewer scope)
- Audit log gaps (no accountability)

Rules
1. Server-side enforcement only
- Every admin action validates ViewerContext role and scope on the server.
- No client-provided "isAdmin" flags are trusted.

2. Explicit confirmation for high-impact actions
- Role grants/revokes require confirmation step and reason entry.
- Show before/after diff.

3. Least privilege defaults
- No bulk grant by default.
- Bulk operations require additional gating (role + agreement gate) and dry-run preview.

4. Audit required for all mutations
- actor_id, target_id, action, before, after, timestamp, reason/ticket
- Append-only audit log, immutable.

5. Deny-path tests mandatory
- Unauthorized (401) and forbidden (403) tests for every admin endpoint.
- Test that sensitive fields are redacted for non-eligible roles.

6. Safe deep links
- Widgets can propose deep links but cannot bypass RBAC.
- Deep links must resolve to RBAC-checked pages.

Out of scope (v1)
- Delegated admin creation flows
- Cross-tenant federation
