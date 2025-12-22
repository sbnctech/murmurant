# Page Audience Rollout (Pilot / Subset Testing)

Status: Backlog (spec only)
Owner: TBD
Scope: Page publishing + editor metadata + server-side enforcement

## Goal

Enable safe testing of new pages and copy with a subset of users before launching to everyone, with explicit opt-in semantics and no implicit behavior.

This supports:
- Staff-only review
- Pilot groups (beta testers)
- Gradual rollout (expand audience over time)
- Optional A/B copy tests (two pages, two audiences)

## Non-negotiable invariants

1. Explicit configuration only
   - If an audience restriction exists, it must be visible in the editor UI.
   - No automatic inference from slug, folder, or path.

2. Fail closed for sensitive content
   - If an audience rule cannot be evaluated, treat as NOT allowed.

3. No data leakage for non-members
   - For public routes, prefer 404 for disallowed viewers.

4. Server-only enforcement
   - Audience filtering must be enforced on the server, not client-only.

5. Preview parity
   - "Preview as" must reflect the same audience filtering rules as publish.

## Concepts and vocabulary

- Page audience gating: Restrict an entire page to a subset of viewers.
- Block audience gating (optional): Restrict individual blocks within a page.
- AudienceRule: A reusable rule that evaluates to ALLOW or DENY for a viewer context.

## Data model

### Page
- Page.audienceRuleId: string | null
  - null means "no extra gating" beyond normal visibility (PUBLIC/MEMBER/etc)
  - non-null means "viewer must pass this rule"

### Block (optional, v1.1+ or v1.2)
- Block.audienceRuleId: string | null
  - null means "inherits page audience"
  - non-null means "viewer must pass block rule" (in addition to page rule)

## Rule types (v1)

Audience rules are declarative data. They must not contain code.

Supported rule shapes:
1. isPublic
2. requiresAuth
3. rolesAny: [roleCode]
4. membershipStatusAny: [statusCode]
5. committeeIdsAny: [committeeId]
6. memberIdsAny: [memberId]
7. allOf: [ruleId or inline rule]
8. anyOf: [ruleId or inline rule]
9. not: [ruleId or inline rule]

NOTE: Avoid nested complexity in UI. Advanced composition can exist in data but should be surfaced carefully.

## Evaluation behavior

Inputs:
- UserContext (auth state, memberId, roles, membershipStatusCode, committeeIds)

Output:
- allowed: boolean
- reasonCode: string (for logs and admin debugging)

Failure mode:
- If rule is missing, invalid, or cannot be evaluated: allowed=false

## Route behavior (no leakage)

### Public page route (/(public)/[slug])
If viewer is disallowed:
- Return 404 (preferred)

If viewer is allowed:
- Render page

### Member page route (/(member)/member/[slug])
If viewer is disallowed:
- Default: 404
- Optional: 403 for authenticated viewers (future decision). For now prefer 404 for simplicity.

### Admin preview route (/admin/content/pages/[id]/preview)
- Must require publishing:manage capability
- Must send robots noindex,nofollow
- Preview uses the same audience filtering as publish, with explicit "Preview as" support (view context)

## Editor UI requirements

Page settings panel must show:
- Audience restriction: [Everyone] / [Staff only] / [Pilot group] / [Custom rule]
- If restricted, show a short, plain-English summary:
  - Example: "Visible to: Beta Testers committee"
  - Example: "Visible to: roles webmaster OR communications-chair"

Block editor (optional):
- Per-block audience dropdown:
  - Inherit (default)
  - Staff only
  - Pilot group
  - Custom rule

Badges:
- In editor and preview, display a badge if page is restricted:
  - "AUDIENCE: Everyone" or "AUDIENCE: Pilot"

## Operational workflow

1. Create page as DRAFT
2. Set audience to Pilot group (or Staff only)
3. Share URL to pilot users
4. Iterate copy and blocks
5. Expand audience to Everyone
6. Publish

A/B copy test (simple):
- Create Page A and Page B (two slugs)
- Gate each page to a different audience rule
- Compare feedback

## Acceptance tests (prose)

AUD-001 Staff-only page is not visible to regular members
- Given page visibility=PUBLIC and audienceRuleId=staffOnly
- When viewer roles=["member"]
- Then GET /(public)/slug returns 404

AUD-002 Staff-only page is visible to webmaster
- Given page audienceRuleId=staffOnly
- When viewer roles=["webmaster"]
- Then page renders

AUD-003 Pilot group page is visible to committee member
- Given page audienceRuleId=pilotCommittee
- When viewer committeeIds includes pilotCommitteeId
- Then page renders

AUD-004 Pilot group page is hidden from public
- Given page audienceRuleId=pilotCommittee and route is public
- When viewer is unauthenticated
- Then 404

AUD-005 Rule evaluation failure fails closed
- Given page audienceRuleId references missing rule
- Then 404 (public) or 404 (member) and logs a reasonCode

AUD-006 Block-level gating hides block content (optional)
- Given page is visible to viewer but one block has audienceRuleId=staffOnly
- When viewer is regular member
- Then block does not render and no placeholder reveals content

AUD-007 Preview parity
- Given admin preview "view as member"
- When page audience is staffOnly
- Then preview renders as 404-equivalent state (or explicit "not visible in this view" banner for admins)

## Security and abuse considerations

Threats:
1. URL sharing: pilot users share a link publicly
   - Mitigation: member-only pilot testing for sensitive content; use 404 for public route

2. Enumeration: attacker guesses slugs
   - Mitigation: 404 for disallowed viewers; no "this exists but forbidden" on public route

3. Misconfiguration: rule removed or broken
   - Mitigation: fail closed; surface admin warning banners and logs

## Out of scope (this spec)

- Automated traffic splitting (true A/B at runtime)
- Analytics instrumentation
- Email-based invite gating
- Time-based rollout rules
- UI for building complex boolean logic (beyond simple selectors)

