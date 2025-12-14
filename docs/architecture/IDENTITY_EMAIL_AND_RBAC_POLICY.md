# Identity, Email, and RBAC Policy

Goal
- Ensure RBAC attaches to stable identities, not mutable emails.
- Support role-based mailboxes (president@, treasurer@, etc.) safely without using them as identities.

Identity model (required)
- member_id: stable primary key for a human
- primary_email: changeable attribute
- email_aliases: optional
- roles: attached to member_id
- groups: attached to member_id
- audit_log: actor_id and target_id are member_id

Email as an attribute
- Email MUST NOT be the authorization key.
- Email changes must not orphan roles or create "ghost admins".

Role mailboxes
- Role mailboxes are routing, not identities.
- Recommended: map role -> current member_id holder, and send notifications to the role mailbox.
- If shared logins are ever supported, require:
  - MFA
  - explicit shared-account label
  - separate audit flag acting_as_shared_account=true
  - time-bound access and periodic review

Admin access rules
- Admin roles are granted to member_id only.
- Every admin grant/revoke requires:
  - actor_id
  - target_id
  - before/after
  - timestamp
  - reason / ticket reference
- Deny-path tests mandatory for every admin endpoint.

Migration note
- When importing from legacy systems, reconcile on a stable external_id if available.
- If only email exists, create member_id and store legacy_email_at_import for traceability.

Open questions (to resolve)
- How to handle couples sharing an email
- How to handle volunteers who change emails mid-term
- How to map committee distribution lists to groups
