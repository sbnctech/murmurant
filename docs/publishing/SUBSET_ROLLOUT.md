# Subset Rollout Specification

Copyright (c) Santa Barbara Newcomers Club

Status: Draft
Created: 2025-12-28
Charter References: P2 (default deny), P4 (no hidden rules), P5 (reversible actions), P7 (observability)

---

## Purpose

Subset rollout enables controlled, incremental exposure of published content to targeted audience segments before full launch. This reduces risk by validating content with a limited audience and allows quick rollback if issues are discovered.

---

## Use Cases

1. **Staged content launch**: Publish a new page to board members first, then expand to all active members, then public

2. **A/B testing (manual)**: Show content variant A to segment X, monitor feedback before deciding to expand

3. **Sensitive content preview**: Allow specific roles to review published content before broader audience access

4. **Gradual feature rollout**: Enable new page features for a percentage of visitors to monitor for issues

---

## Design Principles

1. **Builds on existing infrastructure**: Uses AudienceRule for targeting, not a parallel system
2. **Explicit, not magic**: Rollout state is visible in admin UI and auditable
3. **Reversible**: Rollout can be paused, narrowed, or rolled back at any time
4. **Observable**: Metrics on rollout reach and issues are accessible
5. **Default deny**: Unauthenticated users only see content if rollout explicitly includes public

---

## Rollout Model

### Rollout Stages

A page in PUBLISHED status can have a `rolloutStage` that controls visibility:

| Stage       | Description                                    | Default Audience |
|-------------|------------------------------------------------|------------------|
| `INTERNAL`  | Restricted to content admins and reviewers     | `isContentAdmin` |
| `PREVIEW`   | Limited audience via audience rule             | Specified rule   |
| `GENERAL`   | Full audience per page visibility settings     | Per `visibility` |

### State Transitions

```
PUBLISHED + INTERNAL
     │
     ▼ (expand rollout)
PUBLISHED + PREVIEW
     │
     ▼ (expand rollout)
PUBLISHED + GENERAL
```

All transitions are reversible:
- GENERAL → PREVIEW (narrow rollout)
- PREVIEW → INTERNAL (pause rollout)
- Any → DRAFT (unpublish entirely)

### Data Model Extension

```prisma
// Addition to Page model
model Page {
  // ... existing fields ...

  rolloutStage         RolloutStage  @default(GENERAL)
  rolloutAudienceRuleId String?      @db.Uuid
  rolloutStartedAt     DateTime?     // When rollout began
  rolloutExpandedAt    DateTime?     // When last expanded

  rolloutAudienceRule  AudienceRule? @relation("PageRolloutAudience",
                                               fields: [rolloutAudienceRuleId],
                                               references: [id])
}

enum RolloutStage {
  INTERNAL  // Content admins only
  PREVIEW   // Limited audience
  GENERAL   // Full audience
}
```

---

## Audience Targeting

Rollout audience uses the existing `AudienceRules` type from `src/lib/publishing/audience.ts`:

```typescript
type AudienceRules = {
  isPublic?: boolean;
  roles?: string[];              // Committee role slugs
  membershipStatuses?: string[]; // e.g., ["active", "board"]
  memberIds?: string[];          // Specific member UUIDs
  committeeIds?: string[];       // Committee UUIDs
  joinedAfterDays?: number;      // Recent members
  excludeMemberIds?: string[];   // Explicit exclusions
};
```

### Percentage-Based Rollout

Percentage rollout is implemented as a **deterministic hash** based on member ID:

```typescript
function isInPercentageRollout(
  memberId: string,
  pageId: string,
  percentageThreshold: number
): boolean {
  // Hash member+page to get stable assignment
  const hash = hashCode(`${memberId}:${pageId}`);
  const bucket = Math.abs(hash) % 100;
  return bucket < percentageThreshold;
}
```

Extended audience rule for percentage:

```typescript
type RolloutAudienceRules = AudienceRules & {
  percentageRollout?: number;  // 0-100
};
```

### Combining Rules

When `rolloutStage = PREVIEW`, visibility is determined by:

1. User must match `rolloutAudienceRule` (if set)
2. If `percentageRollout` is set, user must be in the percentage bucket
3. Content admins always have access (for debugging)

---

## Visibility Resolution

Update `evaluatePageVisibility` to incorporate rollout:

```typescript
function evaluatePageVisibility(
  page: PageWithRollout,
  user: VisibilityUserContext | null
): { visible: boolean; reason: string } {

  // Unpublished pages not visible to public
  if (page.status !== 'PUBLISHED') {
    return { visible: false, reason: 'page_not_published' };
  }

  // Content admins always see published content
  if (user && isContentAdmin(user)) {
    return { visible: true, reason: 'content_admin' };
  }

  // Check rollout stage
  switch (page.rolloutStage) {
    case 'INTERNAL':
      return { visible: false, reason: 'rollout_internal' };

    case 'PREVIEW':
      if (!page.rolloutAudienceRule) {
        return { visible: false, reason: 'rollout_no_rule' };
      }
      const inRollout = evaluateRolloutAudience(user, page.rolloutAudienceRule);
      return {
        visible: inRollout,
        reason: inRollout ? 'rollout_preview_match' : 'rollout_preview_excluded'
      };

    case 'GENERAL':
      // Fall through to standard visibility check
      break;
  }

  // Standard visibility evaluation
  return evaluateStandardVisibility(page, user);
}
```

---

## Admin UI

### Rollout Controls

When a page is PUBLISHED, the admin UI shows rollout controls:

```
┌─────────────────────────────────────────────────────────────┐
│ Rollout Status                                              │
├─────────────────────────────────────────────────────────────┤
│ Current Stage: [PREVIEW ▼]                                  │
│                                                             │
│ Preview Audience:                                           │
│ ○ All board members                                         │
│ ○ Specific roles: [president, secretary]                    │
│ ○ Membership levels: [active]                               │
│ ○ Percentage: [25%]                                         │
│                                                             │
│ Estimated reach: 47 members                                 │
│ Started: Dec 15, 2024 at 3:00 PM                           │
│                                                             │
│ [Expand to General ▶] [Narrow to Internal ◀]               │
└─────────────────────────────────────────────────────────────┘
```

### Rollout History

Track rollout changes in audit log:

```typescript
type RolloutAuditEntry = {
  action: 'rollout_started' | 'rollout_expanded' | 'rollout_narrowed' | 'rollout_paused';
  fromStage: RolloutStage;
  toStage: RolloutStage;
  audienceRuleSummary?: string;  // "25% of active members"
  actorId: string;
  timestamp: Date;
};
```

---

## API Endpoints

### Get Rollout Status

```
GET /api/v1/admin/pages/{id}/rollout
```

Response:
```json
{
  "pageId": "uuid",
  "pageTitle": "Spring Newsletter",
  "stage": "PREVIEW",
  "audienceRule": {
    "membershipStatuses": ["board"],
    "percentageRollout": 100
  },
  "estimatedReach": 12,
  "startedAt": "2024-12-15T15:00:00Z",
  "expandedAt": null
}
```

### Update Rollout Stage

```
POST /api/v1/admin/pages/{id}/rollout
Content-Type: application/json

{
  "stage": "PREVIEW",
  "audienceRule": {
    "membershipStatuses": ["active", "board"]
  }
}
```

Response: Same as GET

### Expand Rollout

```
POST /api/v1/admin/pages/{id}/rollout/expand
```

Moves to next stage (INTERNAL → PREVIEW → GENERAL)

### Narrow Rollout

```
POST /api/v1/admin/pages/{id}/rollout/narrow
```

Moves to previous stage (GENERAL → PREVIEW → INTERNAL)

---

## Authorization

| Action                | Required Capability        |
|-----------------------|---------------------------|
| View rollout status   | `page:read`               |
| Change rollout stage  | `page:publish`            |
| Set rollout audience  | `page:publish`            |

---

## Metrics and Observability

### Counters

- `page_rollout_views{page_id, stage, audience_segment}` - Views by rollout segment
- `page_rollout_stage_changes{page_id, from_stage, to_stage}` - Stage transitions

### Alerts

- Page in PREVIEW for more than 7 days without expansion
- Rollout narrowed after expansion (potential issue detected)

---

## Edge Cases

### Public Pages with Rollout

When `visibility = PUBLIC` but `rolloutStage = PREVIEW`:

- Unauthenticated users cannot see the page
- Only authenticated users matching the rollout audience can see it
- Once `rolloutStage = GENERAL`, public visibility is restored

### Cached Content

When rollout stage changes:

1. Clear any edge cache for the page
2. Update `updatedAt` to invalidate client-side caches
3. Log the cache invalidation

### Preview Route

The `/[slug]/preview` route ignores rollout stage (preview is for editors, not rollout testing).

---

## Implementation Plan

### Phase 1: Schema and Core Logic

1. Add `rolloutStage`, `rolloutAudienceRuleId`, timestamps to Page model
2. Add `RolloutStage` enum
3. Create `evaluateRolloutAudience()` function
4. Update public page route to check rollout

### Phase 2: Admin UI

1. Add rollout controls to page editor
2. Show estimated reach based on audience rule
3. Add rollout history to page audit log

### Phase 3: API and Metrics

1. Create rollout management endpoints
2. Add Prometheus counters for rollout views
3. Create dashboard for rollout monitoring

---

## Non-Goals

- **Automated rollout progression**: Rollout expansion is always manual
- **Rollout for non-page content**: Events, emails have their own workflows
- **Complex rollout rules**: If needed, compose via multiple audience rules
- **Rollback content changes**: Rollout is about audience, not content versioning

---

## References

- `src/lib/publishing/audience.ts` - AudienceRules type and evaluation
- `src/lib/publishing/visibility.ts` - VisibilityRule evaluation
- `src/app/(public)/[slug]/page.tsx` - Public page rendering
- `prisma/schema.prisma` - Page model, PageStatus, PageVisibility enums
