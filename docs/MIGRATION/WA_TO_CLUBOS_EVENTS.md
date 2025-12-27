# Wild Apricot to ClubOS Events Migration

This document provides guidance for migrating events from Wild Apricot (WA) to ClubOS.

## Data Model Mapping

### Event Core Fields

| Wild Apricot Field | ClubOS Field | Notes |
|--------------------|--------------|-------|
| `Id` | `id` | WA uses integer IDs; ClubOS uses UUIDs. Store WA ID in migration metadata. |
| `Name` | `title` | Direct mapping |
| `Description` | `description` | WA may include HTML; sanitize before import |
| `Location` | `location` | Direct mapping |
| `StartDate` | `startTime` | WA returns ISO 8601; store as UTC DateTime |
| `EndDate` | `endTime` | Nullable in both systems |
| `EventType` / `Tags` | `category` | Map WA event types to ClubOS categories |
| `RegistrationEnabled` | `requiresRegistration` | Direct boolean mapping |
| `IsEnabled` + `AccessLevel` | `status` | See status mapping below |

### Event Status Mapping

Wild Apricot uses a combination of fields to determine visibility:

| WA State | ClubOS `EventStatus` |
|----------|---------------------|
| `IsEnabled=false` | `DRAFT` |
| `IsEnabled=true, AccessLevel=Public` | `PUBLISHED` |
| `IsEnabled=true, AccessLevel=Restricted` | `PUBLISHED` (ClubOS handles visibility via auth) |
| Past event (`EndDate < now`) | `COMPLETED` (derived, not stored) |

**Important**: ClubOS uses an explicit state machine (P3). Import all WA events as:

- **Future events**: `APPROVED` (requires VP to publish)
- **Past events**: `PUBLISHED` (with `publishedAt` set to `startTime`)

### Registration/Capacity Mapping

| Wild Apricot | ClubOS | Notes |
|--------------|--------|-------|
| `RegistrationTypes[]` | `TicketTier[]` | Each WA registration type becomes a tier |
| `RegistrationType.Name` | `TicketTier.name` | e.g., "Member", "Guest" |
| `RegistrationType.BasePrice` | `TicketTier.priceCents` | Convert dollars to cents |
| `RegistrationType.Availability.AvailableFrom` | `TicketTier.salesStartAt` | |
| `RegistrationType.Availability.AvailableThrough` | `TicketTier.salesEndAt` | |
| `RegistrationType.MaxRegistrantsCount` | `TicketTier.quantity` | |
| `Event.Capacity` (legacy single capacity) | `TicketTier.quantity` | Create single "General" tier |

### Registration Records

| Wild Apricot | ClubOS | Notes |
|--------------|--------|-------|
| `Registration.Id` | Store in metadata | WA uses integer IDs |
| `Registration.Contact.Id` | `memberId` | Must resolve WA contact to ClubOS member |
| `Registration.RegistrationTypeId` | `ticketTierId` | Map via WA-to-ClubOS tier mapping |
| `Registration.Status` | `status` | See status mapping below |
| `Registration.RegistrationDate` | `registeredAt` | |

**Registration Status Mapping**:

| WA Status | ClubOS `RegistrationStatus` |
|-----------|---------------------------|
| `Pending` | `PENDING_PAYMENT` |
| `PendingApproval` | `PENDING_PAYMENT` |
| `Confirmed` | `CONFIRMED` |
| `Cancelled` | `CANCELLED` |
| `WaitList` | `WAITLISTED` |

---

## Key Differences

### 1. State Machine (ClubOS P3)

**Wild Apricot**: Uses boolean flags (`IsEnabled`, `IsVisible`) and implicit states.

**ClubOS**: Uses explicit `EventStatus` enum with defined transitions:

```
DRAFT → PENDING_APPROVAL → APPROVED → PUBLISHED → (COMPLETED)
            ↓
    CHANGES_REQUESTED → PENDING_APPROVAL
```

**Migration Impact**: All imported events need explicit status assignment.

### 2. Timezone Handling

**Wild Apricot**: Returns dates in account timezone (configurable).

**ClubOS**: Stores all dates in UTC; displays in club timezone (`America/Los_Angeles`).

**Migration Steps**:

1. Determine WA account timezone from API settings
2. Parse WA dates with timezone context
3. Convert to UTC before storing in ClubOS

### 3. Capacity Model

**Wild Apricot**: Single `Capacity` field or per-registration-type limits.

**ClubOS**: Per-tier capacity via `TicketTier.quantity`.

**Migration Approach**:

- If WA event has single capacity: Create one "General Admission" tier
- If WA event has multiple registration types: Create matching tiers

### 4. Registration Workflow

**Wild Apricot**: Registration opens when event is enabled.

**ClubOS**: Uses `registrationOpensAt` for scheduled opening (SBNC Sunday/Tuesday policy).

**Migration**: Set `registrationOpensAt = null` for imported events (immediate opening).

### 5. Approval Workflow

**Wild Apricot**: No formal approval workflow.

**ClubOS**: Requires VP Activities approval before publishing.

**Migration**: Import past events as `PUBLISHED`; future events as `APPROVED` pending review.

---

## Migration Script Guidance

### Step 1: Export Events from WA

```python
# Pseudocode for WA API extraction
wa_client = WildApricotClient(api_key=WA_API_KEY, account_id=WA_ACCOUNT_ID)

# Get all events (including past)
events = wa_client.get_events(
    start_date="2020-01-01",  # Adjust as needed
    include_past=True
)

# For each event, also fetch registrations
for event in events:
    event['registrations'] = wa_client.get_event_registrations(event['Id'])
```

### Step 2: Transform to ClubOS Format

```typescript
interface WAEvent {
  Id: number;
  Name: string;
  Description: string;
  Location: string;
  StartDate: string;
  EndDate: string;
  EventType: string;
  RegistrationEnabled: boolean;
  IsEnabled: boolean;
  RegistrationTypes: WARegistrationType[];
}

interface ClubOSEvent {
  id: string; // Generated UUID
  title: string;
  description: string | null;
  category: string | null;
  location: string | null;
  startTime: Date;
  endTime: Date | null;
  status: EventStatus;
  requiresRegistration: boolean;
  // ... other fields
  _waId: number; // Migration metadata
}

function transformEvent(waEvent: WAEvent): ClubOSEvent {
  const startTime = parseWADate(waEvent.StartDate);
  const isPast = startTime < new Date();

  return {
    id: generateUUID(),
    title: waEvent.Name,
    description: sanitizeHtml(waEvent.Description),
    category: mapCategory(waEvent.EventType),
    location: waEvent.Location || null,
    startTime: startTime,
    endTime: waEvent.EndDate ? parseWADate(waEvent.EndDate) : null,
    status: isPast ? 'PUBLISHED' : 'APPROVED',
    requiresRegistration: waEvent.RegistrationEnabled,
    publishedAt: isPast ? startTime : null,
    _waId: waEvent.Id,
  };
}
```

### Step 3: Create Ticket Tiers

```typescript
function createTicketTiers(waEvent: WAEvent, clubosEventId: string): TicketTier[] {
  if (!waEvent.RegistrationTypes?.length) {
    // No registration types = single general tier
    return [{
      id: generateUUID(),
      eventId: clubosEventId,
      name: 'General Admission',
      priceCents: 0,
      quantity: waEvent.Capacity || 999,
      sortOrder: 0,
      isActive: true,
    }];
  }

  return waEvent.RegistrationTypes.map((rt, index) => ({
    id: generateUUID(),
    eventId: clubosEventId,
    name: rt.Name,
    priceCents: Math.round((rt.BasePrice || 0) * 100),
    quantity: rt.MaxRegistrantsCount || 999,
    sortOrder: index,
    isActive: rt.IsEnabled,
    salesStartAt: rt.Availability?.AvailableFrom ? parseWADate(rt.Availability.AvailableFrom) : null,
    salesEndAt: rt.Availability?.AvailableThrough ? parseWADate(rt.Availability.AvailableThrough) : null,
  }));
}
```

### Step 4: Handle Edge Cases

**Recurring Events**:

- WA stores recurring events as separate instances
- Import each instance as a separate ClubOS event
- Consider using `clonedFromId` to link related events

**Past Events**:

- Import with `status: PUBLISHED` and `publishedAt` set
- Skip registration records for very old events (configurable cutoff)

**HTML in Descriptions**:

- WA allows rich HTML in descriptions
- Sanitize to remove scripts, styles, and unsafe elements
- Convert to ClubOS-compatible markdown if possible

**Member ID Resolution**:

- WA contacts must be matched to ClubOS members
- Match by email (primary), then by name (fallback)
- Log unmatched contacts for manual review

### Step 5: Validation Checklist

Before committing migration:

- [ ] All events have valid UUIDs
- [ ] All dates are in UTC
- [ ] Status values are valid enum members
- [ ] Ticket tier quantities are positive integers
- [ ] Price cents are non-negative integers
- [ ] Member references resolve to existing ClubOS members
- [ ] No duplicate event imports (check by WA ID in metadata)

---

## Feature Parity Matrix

### Currently Supported

| Feature | WA | ClubOS | Notes |
|---------|----|---------| ------|
| Event creation | Yes | Yes | |
| Event listing | Yes | Yes | |
| Event detail page | Yes | Yes | |
| Calendar view | Yes | Yes | Month grid with day click |
| Category filtering | Yes | Yes | |
| Text search | Yes | Yes | |
| Registration tracking | Yes | Yes | Via EventRegistration |
| Capacity limits | Yes | Yes | Via TicketTier |
| Waitlist | Yes | Yes | Via RegistrationStatus.WAITLISTED |
| Event chair assignment | Yes | Yes | Via eventChairId |
| Approval workflow | No | Yes | ClubOS adds VP approval |
| Postmortem/notes | No | Yes | ClubOS adds Chair Notebook |

### Not Yet Supported

| Feature | WA | ClubOS | Timeline |
|---------|----|---------| ---------|
| Payment processing | Yes | No | Future |
| ICS export | Yes | No | Future |
| Recurring events | Yes | Partial | Clone support exists |
| Guest registration | Yes | Partial | Via ticket tiers |
| Email confirmations | Yes | Partial | Via comms system |
| Widgets/embeds | Yes | No | See SafeEmbed spec |
| Public event pages | Yes | Yes | Available now |

---

## Post-Migration Verification

After import, verify:

1. **Event Counts**: Total events in WA matches ClubOS
2. **Registration Counts**: Per-event registration counts match
3. **Date Accuracy**: Spot-check 10 events for correct times
4. **Category Distribution**: Category counts are reasonable
5. **Status Distribution**: No events stuck in unexpected states

---

## Rollback Strategy

If migration issues are discovered:

1. **Before Go-Live**: Delete imported events and re-run migration
2. **After Go-Live**:
   - Mark problematic events as `CANCELED`
   - Re-import corrected data with new UUIDs
   - Update any references (registrations, postmortems)

---

## Related Documentation

- `docs/events/EVENT_STATUS_LIFECYCLE.md` - ClubOS event state machine
- `docs/events/EVENT_LIFECYCLE_DESIGN.md` - Full architecture
- `docs/ARCH/CLUBOS_PAGE_BUILDER_PRIMITIVES.md` - SafeEmbed for WA widgets
- `docs/MIGRATION/WA_MEMBER_SYNC.md` - Member migration (prerequisite)
