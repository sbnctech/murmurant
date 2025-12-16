# Mentor Signal System

Makes mentor activity visible without surveillance.

## Purpose

The mentor signal system enables leadership to answer: **"Is mentorship actually working?"**

It tracks engagement signals between mentors and new members (newbies) without:

- Surveillance of individual behavior
- Sensitive personal information in logs
- Judgments about quality of interactions

## Signal Types

| Signal | Trigger | What It Tells Us |
|--------|---------|------------------|
| `MENTOR_ASSIGNED` | Admin assigns mentor to newbie | A mentorship relationship started |
| `REGISTERED_SAME_EVENT` | Both register for same event | They're coordinating schedules |
| `ATTENDED_SAME_EVENT` | Both attended same event | They showed up together |
| `FIRST_CONTACT` | Mentor confirms initial contact | Communication has begun |
| `MENTOR_UNASSIGNED` | Assignment ends (graduation, etc.) | Mentorship cycle completed |

## Data Model

### MentorAssignment

Tracks the mentor-newbie relationship:

- One mentor can have multiple newbies
- One newbie has one active mentor at a time
- Assignment records are preserved after ending (for history)

### MentorSignal

Records engagement events:

- Links to the assignment
- Contains human-readable summary (no jargon)
- Includes week/year for aggregation
- Prevents duplicate signals per event

## Human-Readable Summaries

All signals have plain-language summaries suitable for dashboards:

- "Jane Smith assigned as mentor to Bob Wilson"
- "Jane Smith and Bob Wilson both registered for Coffee Chat"
- "Jane Smith and Bob Wilson both attended Coffee Chat"
- "Jane Smith made first contact with Bob Wilson"
- "Jane Smith completed mentorship of Bob Wilson"

Summaries intentionally avoid:

- Email addresses
- Phone numbers
- Sensitive conversation content
- Judgmental language

## Dashboard Metrics

The `getMentorDashboardMetrics()` function provides:

| Metric | Purpose |
|--------|---------|
| `totalActiveAssignments` | How many mentorships are active |
| `signalsByType` | Distribution of engagement types |
| `weeklySignals` | Trend over time |
| `assignmentsWithoutRecentSignals` | Pairings that may need attention |

## Integration Points

### When to Record Signals

1. **Co-Registration** (`recordCoRegistration`):
   - Call when processing event registrations
   - Automatically finds mentor-newbie pairs registered for the same event

2. **Co-Attendance** (`recordCoAttendance`):
   - Call when marking attendance or processing no-shows
   - Detects confirmed attendees who are mentor-newbie pairs

3. **First Contact** (`recordFirstContact`):
   - Call when mentor confirms they've reached out
   - Only records once per assignment

### Example Integration

```typescript
// In event registration handler
import { recordCoRegistration } from "@/lib/mentor";

async function handleRegistration(eventId: string, memberId: string) {
  // ... registration logic ...

  // Check for mentor-newbie co-registrations
  const event = await getEvent(eventId);
  await recordCoRegistration(eventId, event.title);
}
```

## Privacy by Design

The system is designed to:

1. **Track engagement, not behavior**: Signals show "they were at the same event," not "what they did or said"

2. **Aggregate, don't surveil**: Leadership sees patterns across all mentorships, not detailed tracking of individuals

3. **Empower, not judge**: Low signal count prompts "do they need support?" not "they're failing"

4. **Support the flywheel**: Data helps answer "is mentorship converting newbies to participants?"

## References

- [Canonical Business Model](../CANONICAL_BUSINESS_MODEL.md) - Member lifecycle and conversion
- [Mentor Role Definition](./MENTOR_ROLE.md) - What mentors do
- [What Is Normal](../WHAT_IS_NORMAL.md) - New member expectations
