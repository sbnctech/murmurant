Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

# Permission Change Notifications (v1)

When a user's effective access changes, ClubOS should notify them.
This applies both to:
1) Subject changes: the user's roles/groups/assignments change
2) Policy changes: the permission mapping behind a role/group changes

Goal:
- Keep members and volunteers informed when access changes, reducing confusion and support load.
- Provide an auditable record of changes and notifications.

Non-goals (v1):
- Multi-party approvals
- Complex user-configurable routing
- Deep personalization of content

## Definitions

Effective access:
- The computed set of permissions and scopes for an actor at runtime, after applying:
  - membership status
  - role assignments
  - group assignments
  - delegated admin scopes
  - any deny rules
  - any site/org scoping

## Triggers (Minimum)

A notification MUST be considered when any of these occur:

Subject-side changes:
- role.assignment.created
- role.assignment.removed
- group.membership.added
- group.membership.removed
- delegated.scope.granted
- delegated.scope.revoked

Policy-side changes:
- role.permissionMapping.changed (e.g., VP Activities role now includes/excludes permission X)
- group.permissionMapping.changed
- scopeRule.changed (if it affects effective access)

Note:
- "Policy-side changes" can affect many users. v1 should support batched notifications (see below).

## Notification Policy (v1)

Minimum:
- Send a notification to the affected user when their effective access changes.

Recommended:
- Batch multiple changes into one notification if they occur within a short window (e.g., 5 minutes).
- Provide a "what changed" summary that is understandable to non-technical users.

Spam avoidance:
- If many policy-side changes happen at once, send:
  - 1 summary notification per user (digest) rather than many.
- For large blasts (hundreds/thousands), support throttling and background processing.

## Channels (TBD in v1, but modeled)

We will support multiple channels later.
For v1 we treat the channel as a configuration decision:

Possible channels:
- email (most likely v1 default)
- in-app notification center
- SMS (later; potentially expensive and high-risk)

Model requirement:
- Notifications are created as records regardless of delivery channel so we can audit.

## Persistence Model (Minimum)

PermissionChangeEvent
- id
- actorId (the user whose access changed)
- causedByActorId nullable (who made the change; null/system for policy changes)
- changeType (subject|policy)
- occurredAt
- summary (human-readable)
- details (json: before/after roles/groups/scopes, optional)
- correlationId (for batching)

UserNotification
- id
- actorId
- type = "access.changed"
- createdAt
- deliverAfter (for batching)
- channel (enum or string; nullable if undecided)
- status (queued|sent|failed|suppressed)
- payload (json)
- relatedEventIds (array)

## Content (v1)

Minimum content:
- Subject line: "Your ClubOS access changed"
- Body:
  - what changed (high-level): "You were granted access to X" / "Your access to X was removed"
  - effective time: immediate
  - who/what caused it: "by Tech Chair" or "due to a system policy update"
  - where to go: link to "My Access" page (future) or help page

Recommended:
- Include 3-5 examples of new capabilities in plain language, not raw permission strings.
- If access was reduced, include a "If this seems wrong, contact ..." line.

Do NOT include:
- Secret/privileged data
- Internal permission codes unless in an "advanced details" section for admins only

## Enforcement & Safety

- Notifications MUST NOT be used as the enforcement mechanism.
- RBAC enforcement remains server-side at runtime; notifications are informational.

## Audit Log Events (Minimum)

- permission.changed (already in system)
- accessChangeEvent.created
- notification.queued
- notification.sent
- notification.failed
- notification.suppressed

Each audit record includes:
- actorId (the affected user)
- causedByActorId
- timestamp
- entity + id
- metadata (changeType, correlationId, channel)

## Open Questions

- Do we add a "My Access" page in v1 to show role/group and a plain-language access summary?
- Do we allow users to opt out of access change notifications? (Default should be no for admins/volunteers.)
- Should certain sensitive roles require two-person review (later)?
