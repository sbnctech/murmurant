# Event Derivation Model

Murmurant reduces human error and admin burden by automatically calculating event properties from minimal required inputs. This document defines what humans must enter vs. what Murmurant derives.

## Field Classification

### Required Fields (Human Must Enter)

These fields must be provided by the event creator:

| Field | Type | Why Required |
|-------|------|--------------|
| `title` | string | Identifies the event to members |
| `startTime` | DateTime | Core scheduling data; drives all time-based derivations |

### Optional Fields (Human Can Enter)

These fields enhance the event but have sensible defaults:

| Field | Type | Default Behavior |
|-------|------|------------------|
| `description` | string | Empty (no description shown) |
| `category` | string | Murmurant infers from title patterns (see Category Inference) |
| `location` | string | Empty (no location shown) |
| `endTime` | DateTime | Derived as `startTime + 2 hours` |
| `capacity` | integer | `null` = unlimited capacity |
| `isPublished` | boolean | `false` = draft (admin only) |
| `eventChairId` | UUID | `null` = no assigned chair |

### Calculated Fields (Derived Automatically)

These fields are **never stored** - they are computed at query time:

| Field | Derivation Logic | Purpose |
|-------|------------------|---------|
| `status` | Based on `isPublished`, `startTime`, `endTime`, current time | Lifecycle indicator |
| `registeredCount` | Count of `EventRegistration` records | Capacity tracking |
| `spotsRemaining` | `capacity - registeredCount` (or `null` if unlimited) | Availability indicator |
| `isFull` | `spotsRemaining === 0` | Registration gate |
| `isWaitlistOpen` | `isFull && hasWaitlistFeature` | Waitlist gate |
| `urgency` | Based on `daysUntil` and `spotsRemaining` | UI urgency badges |
| `effectiveEndTime` | `endTime ?? (startTime + 2 hours)` | Display consistency |

## Status Derivation

Event status is derived, not stored:

```
if (endTime < now) → "past"
if (!isPublished) → "draft"
if (startTime ≤ now < endTime) → "ongoing"
if (startTime > now) → "upcoming"
```

### Status Labels

| Status | Label | Description |
|--------|-------|-------------|
| `draft` | Draft | Not visible to members |
| `upcoming` | Upcoming | Published, in the future |
| `ongoing` | In Progress | Happening now |
| `past` | Past | Already ended |

## Urgency Derivation

Urgency drives UI indicators (badges, colors) to help members make decisions:

```
if (daysUntil < 0) → "none" (past)
if (spotsRemaining ≤ 2) → "urgent"
if (spotsRemaining ≤ 5) → "high"
if (daysUntil === 0) → "urgent" (today)
if (daysUntil === 1) → "high" (tomorrow)
if (daysUntil ≤ 3) → "medium"
if (daysUntil ≤ 7) → "low"
otherwise → "none"
```

## Category Inference

When no category is provided, Murmurant suggests one based on title patterns:

| Title Pattern | Inferred Category |
|---------------|-------------------|
| Contains "luncheon" or "lunch" | Luncheon |
| Contains "book club" or "book group" | Book Club |
| Contains "wine" | Wine |
| Contains "hike", "hiking", or "walk" | Outdoor |
| Contains "golf" | Golf |
| Contains "bridge" | Bridge |
| Contains "orientation" or "new member" | Orientation |
| Contains "board meeting" | Board |

Category inference is a **suggestion only** - admins can override.

## Time Helper Functions

All time calculations use pure functions for determinism and testability:

```typescript
// Check if event is in the past
isPastEvent(startTime: Date, now?: Date): boolean

// Check if event is today
isToday(startTime: Date, now?: Date): boolean

// Check if event is tomorrow
isTomorrow(startTime: Date, now?: Date): boolean

// Get days until event (negative if past)
daysUntil(startTime: Date, now?: Date): number

// Derive effective end time
deriveEndTime(startTime: Date, endTime: Date | null): Date
```

## Availability Functions

```typescript
// Compute spots remaining and status
computeAvailability(capacity: number | null, registeredCount: number): {
  spotsRemaining: number | null;
  isFull: boolean;
  isWaitlistOpen: boolean;
}

// Human-readable spots label
spotsRemainingLabel(capacity: number | null, registeredCount: number): string
// Examples: "Open registration", "5 spots remaining", "Full - Waitlist open"
```

## Design Principles

1. **Compute, Don't Store**: Derived fields are calculated at query time, ensuring consistency

2. **Pure Functions**: All derivations are pure and deterministic - same inputs always produce same outputs

3. **Optional `now` Parameter**: Time-based functions accept an optional reference date for testing

4. **Fail Gracefully**: Invalid inputs produce sensible defaults, not errors

5. **Admin Override**: Admins can always override inferred values (e.g., category)

## Admin UI Integration

The event form clearly shows:

- **Required** fields with red badge
- **Optional** fields with green badge
- **Calculated** fields in a preview panel with blue badge and tooltips explaining "why automatic"

This transparency helps admins understand:
- What they must provide
- What they can provide
- What Murmurant handles automatically

## Implementation

Core derivation logic: `src/lib/events/defaults.ts`

Key exports:
- `deriveEndTime()`
- `isPastEvent()`, `isToday()`, `isTomorrow()`, `daysUntil()`
- `computeAvailability()`, `spotsRemainingLabel()`
- `computeStatus()`, `statusLabel()`
- `computeUrgency()`, `urgencyLabel()`
- `inferCategory()`
- `validateEventFields()`
- `generateDerivedPreview()`

---

Copyright (c) Santa Barbara Newcomers Club
