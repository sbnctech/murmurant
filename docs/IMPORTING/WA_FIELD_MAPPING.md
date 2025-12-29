# Wild Apricot to Murmurant Field Mapping

This document maps Wild Apricot (WA) data fields to Murmurant Prisma schema fields, identifying transformations required for data migration.

## 1. Member Mapping

### 1.1 Core Fields

| WA Field | WA Type | Murmurant Field | Murmurant Type | Transformation |
|----------|---------|--------------|-------------|----------------|
| Id | INTEGER | (external ID) | - | Store as metadata or lookup table |
| FirstName | TEXT | firstName | String | Direct |
| LastName | TEXT | lastName | String | Direct |
| Email | TEXT | email | String @unique | Direct, validate format |
| Phone | TEXT | phone | String? | Clean formatting |
| MemberSince | TEXT (ISO8601) | joinedAt | DateTime | Parse ISO8601 |
| Status | TEXT | membershipStatusId | UUID (FK) | Map to MembershipStatus.code |

### 1.2 Status Mapping

| WA Status | Murmurant MembershipStatus.code | Notes |
|-----------|------------------------------|-------|
| Active | active | Default active status |
| Lapsed | lapsed | Membership expired |
| PendingNew | pending_new | Awaiting approval |
| PendingRenewal | pending_renewal | Renewal in progress |
| Suspended | suspended | Administratively suspended |

### 1.3 Fields NOT Mapped (WA-specific)

- `DisplayName` - Computed in Murmurant from firstName + lastName
- `Organization` - Not applicable to club membership
- `MembershipLevelId` / `MembershipLevelName` - Different concept in Murmurant
- `IsSuspended` - Represented via membershipStatusId
- `ProfileLastUpdated` - Murmurant uses `updatedAt`
- `IsAccountAdministrator` - Murmurant uses RoleAssignment
- `FieldValues` (JSON) - Custom fields need individual mapping

### 1.4 Custom Fields Mapping

| WA Custom Field | Murmurant Handling | Notes |
|-----------------|-----------------|-------|
| PreviousResidence | Not mapped | Could add to Member if needed |
| Age | Not mapped | Privacy concern |
| HowDidYouHear | Not mapped | Onboarding survey data |
| DateMovedToSB | Not mapped | Could add to Member if needed |
| City | Not mapped | Could derive from address |
| ZipCode | Not mapped | Could derive from address |
| StreetAddress | Not mapped | Privacy - not needed |
| BoardParticipation | → MemberServiceHistory | Parse into service records |
| ChairParticipation | → MemberServiceHistory | Parse into service records |
| CommitteeMemberParticipation | → MemberServiceHistory | Parse into service records |
| HasSignificantOther | Not mapped | Privacy |
| SpouseFirstName / SpouseLastName | Not mapped | Create separate Member if needed |
| SpecialSkills | Not mapped | Could add as Member field |
| WillingToHostEvents | Not mapped | Could add as Member field |
| SelfIntroduction | Not mapped | Could add as Member field |
| RenewalDue | → MembershipStatus context | Used for renewal workflow |

## 2. Event Mapping

### 2.1 Core Fields

| WA Field | WA Type | Murmurant Field | Murmurant Type | Transformation |
|----------|---------|--------------|-------------|----------------|
| Id | INTEGER | (external ID) | - | Store as metadata |
| Name | TEXT | title | String | Direct |
| Details | JSON | description | String? | Extract text or parse blocks |
| Location | TEXT | location | String? | Direct |
| StartDate | TEXT (ISO8601) | startTime | DateTime | Parse ISO8601 |
| EndDate | TEXT (ISO8601) | endTime | DateTime? | Parse ISO8601 |
| RegistrationsLimit | INTEGER | capacity | Int? | Direct |
| Status | TEXT | isPublished | Boolean | Map: Public→true, Restricted→false |
| Tags | JSON | category | String? | Extract primary tag |
| OrganizerContactId | INTEGER | eventChairId | UUID (FK) | Lookup Member by WA ID |

### 2.2 Fields NOT Mapped

- `RegistrationEnabled` - Derived from capacity/dates in Murmurant
- `ConfirmedRegistrationsCount` - Computed from EventRegistration
- `PendingRegistrationsCount` - Computed from EventRegistration
- `MinPrice` / `MaxPrice` / `IsFree` - Different pricing model
- `HasGuestTickets` - Not applicable
- `RegistrationOpenDate` - Could add if needed
- `Committee` (derived) - Not a direct field

### 2.3 Category Derivation

Murmurant uses `category` as a simple string. WA uses Tags (JSON array) and derived Committee name.

**Strategy:** Use Committee name as category, fallback to first Tag:

```
if Committee exists:
    category = Committee
elif Tags not empty:
    category = Tags[0]
else:
    category = null
```

## 3. Event Registration Mapping

### 3.1 Core Fields

| WA Field | WA Type | Murmurant Field | Murmurant Type | Transformation |
|----------|---------|--------------|-------------|----------------|
| Id | INTEGER | (external ID) | - | Store as metadata |
| EventId | INTEGER | eventId | UUID (FK) | Lookup Event by WA ID |
| ContactId | INTEGER | memberId | UUID (FK) | Lookup Member by WA ID |
| Status | TEXT | status | RegistrationStatus | Map statuses |
| RegistrationDate | TEXT (ISO8601) | registeredAt | DateTime | Parse ISO8601 |
| IsCheckedIn | BOOLEAN | (not mapped) | - | Could track via status |
| OnWaitlist | BOOLEAN | waitlistPosition | Int? | Set position if true |

### 3.2 Status Mapping

| WA Status | Murmurant RegistrationStatus | Notes |
|-----------|---------------------------|-------|
| Confirmed | CONFIRMED | Direct |
| Cancelled | CANCELLED | Direct |
| PendingPayment | PENDING_PAYMENT | Direct |
| WaitList | WAITLISTED | Set waitlistPosition |
| NoShow | NO_SHOW | Direct (if tracked) |

### 3.3 Fields NOT Mapped

- `RegistrationTypeId` / `RegistrationType` - Different pricing model
- `IsCheckedIn` - Not tracked in current Murmurant schema

## 4. Membership Level Mapping

WA uses "Membership Levels" as tiers (NewbieNewcomer, NewcomerMember, ExtendedNewcomer, Admins).

Murmurant uses `MembershipStatus` with codes like: active, lapsed, pending_new, etc.

**These are different concepts:**

- WA Membership Level = Tier/pricing (NewbieNewcomer pays $150, ExtendedNewcomer pays $85)
- Murmurant MembershipStatus = State (active, lapsed, suspended)

**Mapping Strategy:**

| WA Level | WA Status | Murmurant MembershipStatus.code |
|----------|-----------|------------------------------|
| NewbieNewcomer | Active | active |
| NewcomerMember | Active | active |
| ExtendedNewcomer | Active | active |
| Any | Lapsed | lapsed |
| Any | PendingNew | pending_new |
| Admins | Active | active (with admin role) |

## 5. Committee / Role Mapping

WA stores committee participation as custom fields (text):

- `BoardParticipation`: "2023-2024 President, 2022-2023 VP Activities"
- `ChairParticipation`: "Games! 2023-2024"
- `CommitteeMemberParticipation`: "Wine Appreciation, Happy Hikers"

Murmurant has structured models:

- `Committee` - The committee entity
- `CommitteeRole` - Roles within a committee (Chair, Member)
- `RoleAssignment` - Member assigned to committee role for a term
- `MemberServiceHistory` - Immutable service records

**Parsing Strategy:**

1. Parse free-text participation fields
2. Match committee names to existing Committee records
3. Create RoleAssignment records for current assignments
4. Create MemberServiceHistory records for historical assignments

## 6. Governance Mapping

WA does not have governance features. Murmurant governance models are:

- GovernanceMeeting
- GovernanceMinutes
- GovernanceMotion
- GovernanceAnnotation
- GovernanceReviewFlag

**No mapping required** - these are Murmurant-only features.

## 7. ID Mapping Strategy

WA uses integer IDs. Murmurant uses UUIDs.

**Recommended Approach:**

Create a mapping table (could be temporary for migration):

```sql
CREATE TABLE wa_id_mapping (
  entity_type TEXT NOT NULL,  -- 'member', 'event', 'registration'
  wa_id INTEGER NOT NULL,
  murmurant_id UUID NOT NULL,
  migrated_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (entity_type, wa_id)
);
```

This allows:

- Looking up Murmurant records from WA IDs
- Detecting duplicates during incremental imports
- Audit trail of migration

## 8. Data Quality Considerations

### 8.1 Email Validation

WA emails may be:

- Invalid format (need validation)
- Duplicates (WA allows, Murmurant @unique)
- Empty strings (treat as null)

### 8.2 Date Parsing

WA dates are ISO8601 strings with timezone:

```
2024-01-15T10:30:00-08:00
```

Parse with timezone awareness and store as UTC.

### 8.3 Missing Required Fields

Murmurant requires:

- `Member.firstName` - Error if missing
- `Member.lastName` - Error if missing
- `Member.email` - Error if missing (and must be unique)
- `Member.joinedAt` - Use CreationDate or MemberSince as fallback
- `Member.membershipStatusId` - Map from WA Status

### 8.4 Foreign Key Validation

Before importing registrations, ensure:

- Referenced Event exists (by WA ID mapping)
- Referenced Member exists (by WA ID mapping)

Import order: MembershipStatus → Members → Events → Registrations

## 9. Transformation Functions

### 9.1 Member Transform

```typescript
function transformMember(waContact: WAContact): Partial<PrismaMember> {
  return {
    firstName: waContact.FirstName || 'Unknown',
    lastName: waContact.LastName || 'Unknown',
    email: normalizeEmail(waContact.Email),
    phone: normalizePhone(waContact.Phone),
    joinedAt: parseISO(waContact.MemberSince || waContact.CreationDate),
    membershipStatusId: mapStatus(waContact.Status),
  };
}
```

### 9.2 Event Transform

```typescript
function transformEvent(waEvent: WAEvent): Partial<PrismaEvent> {
  return {
    title: waEvent.Name,
    description: extractDescription(waEvent.Details),
    location: waEvent.Location,
    startTime: parseISO(waEvent.StartDate),
    endTime: waEvent.EndDate ? parseISO(waEvent.EndDate) : null,
    capacity: waEvent.RegistrationsLimit,
    isPublished: waEvent.Status === 'Public',
    category: deriveCategory(waEvent),
    eventChairId: lookupMemberId(waEvent.OrganizerContactId),
  };
}
```

### 9.3 Registration Transform

```typescript
function transformRegistration(waReg: WARegistration): Partial<PrismaEventRegistration> {
  return {
    eventId: lookupEventId(waReg.EventId),
    memberId: lookupMemberId(waReg.ContactId),
    status: mapRegistrationStatus(waReg.Status, waReg.OnWaitlist),
    waitlistPosition: waReg.OnWaitlist ? calculatePosition(waReg) : null,
    registeredAt: parseISO(waReg.RegistrationDate),
  };
}
```

## 10. Unmapped Data (Potential Loss)

The following WA data has no direct Murmurant equivalent:

| WA Data | Risk Level | Notes |
|---------|------------|-------|
| Invoices | Medium | Financial records - archive separately |
| Payments | Medium | Financial records - archive separately |
| Email logs | Low | Historical email tracking |
| Custom field JSON | Low | Most fields not needed |
| Registration types | Medium | Pricing tiers - different model |
| Tags (beyond first) | Low | Multiple tags not supported |
| Check-in status | Low | Not tracked in Murmurant |

**Recommendation:** Export full WA database snapshot before migration for audit purposes.
