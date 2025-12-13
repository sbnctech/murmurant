# Worker 2 (W2) — Photo Metadata, Privacy, and Audit Model

**Audience**: Tech Chair, Board, System Administrators, Legal Review
**Purpose**: Define canonical data model for photo metadata, privacy controls, and auditability
**Status**: Specification (authoritative)
**Last Updated**: December 2024

---

## Document Scope

This document defines the **authoritative data model** for the ClubOS Photo Gallery subsystem. It governs:

- How photo assets and their metadata are stored
- How members are labeled in photos (face labeling)
- How members control their privacy preferences
- How visibility overrides are applied
- How all changes are audited

**This document defines truth. Implementation must conform to these definitions.**

---

## Table Definitions

### 1. photo_asset

Stores metadata for each photo in the gallery. Does not store the binary image data (that resides in object storage).

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | Primary key |
| storage_key | string | NO | Reference to object storage location |
| original_filename | string | YES | Filename as uploaded |
| mime_type | string | NO | MIME type (image/jpeg, image/png, etc.) |
| file_size_bytes | integer | NO | Size of original file |
| width_px | integer | YES | Image width in pixels |
| height_px | integer | YES | Image height in pixels |
| captured_at | timestamp | YES | When photo was taken (from EXIF or manual) |
| uploaded_at | timestamp | NO | When photo was uploaded to system |
| uploaded_by_member_id | uuid | NO | Member who uploaded the photo |
| event_id | uuid | YES | Associated event (if any) |
| album_id | uuid | YES | Album containing this photo |
| visibility | enum | NO | Default: 'members_only'. Values: 'public', 'members_only', 'private' |
| is_deleted | boolean | NO | Soft delete flag. Default: false |
| deleted_at | timestamp | YES | When soft delete occurred |
| deleted_by_member_id | uuid | YES | Who performed soft delete |

#### Keys

- **Primary Key**: id
- **Foreign Keys**:
  - uploaded_by_member_id REFERENCES member(id)
  - event_id REFERENCES event(id)
  - album_id REFERENCES album(id)
  - deleted_by_member_id REFERENCES member(id)

#### Permissions

| Role | Read | Write | Delete |
|------|:----:|:-----:|:------:|
| Admin | All photos | All photos | All photos (soft) |
| Photo Editor | All photos | All photos | All photos (soft) |
| VP Activities | Event-scoped | Event-scoped | No |
| Event Chair | Own event photos | Own event photos | No |
| Member | Published + own uploads | Own uploads only | Own uploads only |
| Guest | Public only | No | No |

#### Audit Requirements

- Log upload (who, when, file metadata)
- Log visibility changes (who, when, before/after)
- Log soft delete (who, when, reason if provided)
- Log restore from soft delete (who, when)

---

### 2. face_label

Associates a member identity with a region in a photo. Enables "photos of me" queries.

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | Primary key |
| photo_asset_id | uuid | NO | Photo containing this face |
| member_id | uuid | NO | Member identified in photo |
| label_source | enum | NO | How label was created. Values: 'manual', 'suggested', 'confirmed' |
| bounding_box | json | YES | Coordinates of face region {x, y, width, height} as percentages |
| confidence_score | decimal | YES | ML confidence if auto-suggested (0.0-1.0) |
| created_at | timestamp | NO | When label was created |
| created_by_member_id | uuid | NO | Who created the label |
| verified_at | timestamp | YES | When label was verified/confirmed |
| verified_by_member_id | uuid | YES | Who verified the label |
| is_rejected | boolean | NO | Whether labeled member rejected this label. Default: false |
| rejected_at | timestamp | YES | When rejection occurred |

#### Keys

- **Primary Key**: id
- **Foreign Keys**:
  - photo_asset_id REFERENCES photo_asset(id)
  - member_id REFERENCES member(id)
  - created_by_member_id REFERENCES member(id)
  - verified_by_member_id REFERENCES member(id)
- **Unique Constraint**: (photo_asset_id, member_id) — one label per member per photo

#### Permissions

| Role | Read | Write | Delete |
|------|:----:|:-----:|:------:|
| Admin | All labels | All labels | All labels |
| Photo Editor | All labels | All labels | All labels |
| VP Activities | Event-scoped | No | No |
| Event Chair | Own event photos | No | No |
| Member | Photos they appear in | Self-rejection only | No |
| Guest | No | No | No |

**Critical Rule**: Only Photo Editor or Admin may create, modify, or delete labels. Members may only reject labels on themselves (sets is_rejected = true).

#### Audit Requirements

- Log every label creation (who, when, source, target member)
- Log every label modification (who, when, before/after for all fields)
- Log every label deletion (who, when, target member, reason)
- Log every rejection (who, when, photo_asset_id)
- Audit entries are IMMUTABLE

---

### 3. member_privacy_preference

Stores member-level privacy settings that govern photo and face labeling behavior.

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | Primary key |
| member_id | uuid | NO | Member these preferences belong to |
| allow_face_labeling | boolean | NO | Whether this member may be labeled in photos. Default: true |
| allow_face_search | boolean | NO | Whether "photos of me" search is enabled. Default: true |
| show_in_public_gallery | boolean | NO | Whether photos of this member may appear in public view. Default: true |
| created_at | timestamp | NO | When preferences were created |
| updated_at | timestamp | NO | When preferences were last modified |
| updated_by_member_id | uuid | NO | Who last modified (self or admin) |

#### Keys

- **Primary Key**: id
- **Foreign Keys**:
  - member_id REFERENCES member(id)
  - updated_by_member_id REFERENCES member(id)
- **Unique Constraint**: member_id — one preference record per member

#### Permissions

| Role | Read | Write | Delete |
|------|:----:|:-----:|:------:|
| Admin | All preferences | All preferences | No (soft delete member) |
| Photo Editor | All preferences (read-only) | No | No |
| VP Activities | No | No | No |
| Event Chair | No | No | No |
| Member | Own preferences only | Own preferences only | No |
| Guest | No | No | No |

**Critical Rule**: Photo Editors may READ privacy preferences to honor them, but may NOT modify them. Only the member themselves or an Admin may change privacy preferences.

#### Audit Requirements

- Log every preference change (who, when, before/after for each field)
- Log Admin overrides with explicit reason field
- Preferences are never hard-deleted; they persist with member record

---

### 4. photo_visibility_override

Allows per-photo visibility adjustments that override the default photo visibility for specific members or the public.

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | Primary key |
| photo_asset_id | uuid | NO | Photo this override applies to |
| override_type | enum | NO | Values: 'hide_from_public', 'hide_from_member', 'show_to_member' |
| target_member_id | uuid | YES | Specific member affected (null for public overrides) |
| reason | string | YES | Why override was applied |
| created_at | timestamp | NO | When override was created |
| created_by_member_id | uuid | NO | Who created the override |
| expires_at | timestamp | YES | When override expires (null = permanent) |
| is_active | boolean | NO | Whether override is currently in effect. Default: true |

#### Keys

- **Primary Key**: id
- **Foreign Keys**:
  - photo_asset_id REFERENCES photo_asset(id)
  - target_member_id REFERENCES member(id)
  - created_by_member_id REFERENCES member(id)

#### Permissions

| Role | Read | Write | Delete |
|------|:----:|:-----:|:------:|
| Admin | All overrides | All overrides | All overrides |
| Photo Editor | All overrides | Create/modify | Deactivate (set is_active=false) |
| VP Activities | No | No | No |
| Event Chair | No | No | No |
| Member | Overrides affecting self | Request only (not direct) | No |
| Guest | No | No | No |

#### Override Type Semantics

| Type | Effect |
|------|--------|
| hide_from_public | Photo is hidden from public gallery even if photo.visibility = 'public' |
| hide_from_member | Photo is hidden from specific member even if they would normally see it |
| show_to_member | Photo is shown to specific member even if photo.visibility = 'private' |

#### Audit Requirements

- Log every override creation (who, when, type, target, reason)
- Log every override modification (who, when, before/after)
- Log every override deactivation (who, when, reason)

---

### 5. photo_audit_log

Immutable, append-only log of all actions affecting photo assets, labels, preferences, and overrides.

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | Primary key |
| timestamp | timestamp | NO | When action occurred (server time) |
| actor_member_id | uuid | YES | Member who performed action (null for system) |
| actor_role | string | NO | Role of actor at time of action |
| action_type | enum | NO | See Action Types below |
| target_table | string | NO | Table affected |
| target_id | uuid | NO | Primary key of affected record |
| before_state | json | YES | State before change (null for creates) |
| after_state | json | YES | State after change (null for deletes) |
| ip_address | string | YES | IP address of requestor |
| user_agent | string | YES | Browser/client user agent |
| request_id | uuid | YES | Correlation ID for request tracing |

#### Action Types

| Action | Description |
|--------|-------------|
| photo.upload | New photo uploaded |
| photo.visibility_change | Photo visibility changed |
| photo.soft_delete | Photo soft-deleted |
| photo.restore | Photo restored from soft delete |
| photo.hard_delete | Photo permanently deleted (Admin only, rare) |
| label.create | Face label created |
| label.modify | Face label modified |
| label.delete | Face label deleted |
| label.reject | Member rejected label on themselves |
| preference.create | Privacy preference created |
| preference.update | Privacy preference updated |
| override.create | Visibility override created |
| override.modify | Visibility override modified |
| override.deactivate | Visibility override deactivated |

#### Keys

- **Primary Key**: id
- **Foreign Keys**:
  - actor_member_id REFERENCES member(id)
- **Indexes**:
  - (target_table, target_id) for record history lookup
  - (actor_member_id, timestamp) for actor activity lookup
  - (action_type, timestamp) for action type analysis

#### Permissions

| Role | Read | Write | Delete |
|------|:----:|:-----:|:------:|
| Admin | All logs | System only (automatic) | **NEVER** |
| Photo Editor | Logs for photo operations | No | No |
| VP Activities | No | No | No |
| Event Chair | No | No | No |
| Member | Logs affecting self only | No | No |
| Guest | No | No | No |

**Critical Rule**: Audit logs are APPEND-ONLY. No role may modify or delete audit log entries. Write access is system-only (automatic on each audited action).

#### Retention

- Minimum retention: 7 years
- Audit logs are never purged without legal review
- Archived logs remain queryable

---

## Privacy Rules

### Rule 1: Lapsed Members Retain Historical Labels

When a member's status changes to lapsed:

1. **Labels are NOT deleted** — Historical face labels remain intact
2. **Labels are NOT anonymized** — member_id linkage is preserved
3. **Labels remain visible** — Photos showing lapsed members display correctly
4. **New labels MAY be created** — Editors may still label lapsed members in photos
5. **Search works** — "Photos of [lapsed member]" returns results

**Rationale**: Historical accuracy. A photo from 2019 showing a member who lapsed in 2023 should still identify them correctly.

**What changes**: Lapsed members lose the ability to modify their own privacy preferences (they no longer have active login). Preferences frozen at time of lapse.

---

### Rule 2: Opt-Out of Face Labeling

When `member_privacy_preference.allow_face_labeling = false`:

| Action | Behavior |
|--------|----------|
| Create new label | **BLOCKED** — System prevents label creation for this member |
| Existing labels | **HIDDEN** — Labels remain in database but are not displayed |
| "Photos of me" search | Returns empty (respects opt-out) |
| Editor override | **NOT PERMITTED** — Opt-out is absolute |
| Admin override | **NOT PERMITTED** — Opt-out is absolute |

**Operational meaning**:
- The face_label records still exist (for audit trail)
- Queries filter out labels where target member has opted out
- No role can bypass this preference

**What opt-out does NOT do**:
- Does not delete the photo itself
- Does not hide photos where member appears but is not labeled
- Does not prevent others from appearing in the same photo

---

### Rule 3: Opt-Out of Face Search

When `member_privacy_preference.allow_face_search = false`:

| Action | Behavior |
|--------|----------|
| "Photos of me" search by self | **BLOCKED** — Returns empty result |
| "Photos of [member]" search by others | **BLOCKED** — Returns empty result |
| Labels still visible on photos | **YES** — Individual photo view shows labels |
| Browsing albums | **WORKS** — Member sees photos normally |

**Operational meaning**:
- Search index excludes this member
- Direct photo viewing unaffected
- Labels visible when viewing individual photos

---

### Rule 4: Photo Editor Constraints

Photo Editors have significant power but explicit limits:

#### Photo Editors MAY:

- Create face labels for any member (subject to privacy preferences)
- Modify face labels (change bounding box, source, confidence)
- Delete face labels
- Change photo visibility
- Create visibility overrides
- Soft-delete photos

#### Photo Editors MAY NOT:

- Modify member privacy preferences
- Override a member's opt-out of face labeling
- Override a member's opt-out of face search
- Hard-delete photos (Admin only)
- Delete or modify audit log entries
- Access photos marked 'private' without explicit override

---

### Rule 5: Audit Trail Immutability

Every label change must record:

| Field | Required | Description |
|-------|----------|-------------|
| actor_member_id | YES | Who made the change |
| actor_role | YES | Role at time of change |
| timestamp | YES | Server timestamp (not client) |
| before_state | YES* | Full state before change (*null for creates) |
| after_state | YES* | Full state after change (*null for deletes) |
| target_id | YES | Which record was affected |

**Immutability guarantee**:
- Audit records cannot be modified after creation
- Audit records cannot be deleted by any role
- Database constraints enforce append-only behavior
- Backup and archive policies preserve audit trail

---

## Member Status Transitions

### Active to Lapsed

When a member transitions from active to lapsed:

| Aspect | Behavior |
|--------|----------|
| Existing face labels | Retained, visible, searchable |
| Privacy preferences | Frozen (cannot be modified by lapsed member) |
| "Photos of me" access | Revoked (no login) |
| Label creation on them | Still permitted by editors |
| Photo uploads by them | No new uploads (no login) |

### Lapsed to Active (Renewal)

When a lapsed member renews:

| Aspect | Behavior |
|--------|----------|
| Historical labels | Still present, immediately visible |
| Privacy preferences | Editable again |
| "Photos of me" search | Works immediately |
| Past opt-out settings | Honored (if they opted out before lapsing) |

### Member Deletion (Rare)

If a member requests account deletion (GDPR/CCPA):

| Aspect | Behavior |
|--------|----------|
| Face labels | Anonymized (member_id set to system placeholder) |
| Privacy preferences | Deleted |
| Audit logs | Retained with anonymized actor reference |
| Photos they uploaded | Transferred to system account or deleted per policy |

**Note**: Full deletion requires legal review and is not self-service.

---

## Visibility Resolution

When displaying a photo, visibility is resolved in this order:

```
1. Is photo soft-deleted?
   YES → Hidden from all except Admin

2. Does viewer have visibility override (show_to_member)?
   YES → Show photo

3. Is there hide_from_member override for viewer?
   YES → Hide photo

4. Is there hide_from_public override?
   YES and viewer is guest → Hide photo

5. Check photo.visibility:
   - 'public' → Show to all
   - 'members_only' → Show to authenticated members
   - 'private' → Show only to uploader and Admin

6. Check member privacy preference (show_in_public_gallery):
   - If any labeled member has show_in_public_gallery=false
   - AND viewer is guest
   - → Hide photo from public gallery
```

---

## Relationship Diagram

```
member
   │
   ├──< photo_asset (uploaded_by_member_id)
   │        │
   │        ├──< face_label (photo_asset_id)
   │        │        │
   │        │        └──> member (member_id) [who is labeled]
   │        │
   │        └──< photo_visibility_override (photo_asset_id)
   │
   ├──< face_label (created_by_member_id) [who created label]
   │
   ├──< member_privacy_preference (member_id)
   │
   └──< photo_audit_log (actor_member_id)

event
   │
   └──< photo_asset (event_id)

album
   │
   └──< photo_asset (album_id)
```

---

## Implementation Notes

### Indexing Strategy

Priority indexes for query performance:

1. `photo_asset(event_id, visibility)` — Event gallery queries
2. `photo_asset(album_id, visibility)` — Album browsing
3. `face_label(member_id, is_rejected)` — "Photos of me" queries
4. `face_label(photo_asset_id)` — Labels for a photo
5. `member_privacy_preference(member_id)` — Privacy lookups
6. `photo_audit_log(target_table, target_id)` — Record history

### Cascade Behavior

| Parent Delete | Child Behavior |
|---------------|----------------|
| photo_asset soft-delete | face_labels hidden, overrides inactive |
| photo_asset hard-delete | face_labels deleted, overrides deleted, audit retained |
| member soft-delete | labels retained, preferences frozen |
| member hard-delete | labels anonymized, preferences deleted, audit anonymized |

### Consistency Rules

1. Every face_label.member_id must reference valid member (even if lapsed)
2. Every photo_asset.uploaded_by_member_id must reference valid member
3. Privacy preferences created automatically on member creation
4. Audit log entries created synchronously (not async) for consistency

---

## Related Documents

- `docs/rbac/AUTH_AND_RBAC.md` — Role definitions
- `SYSTEM_SPEC.md` — System overview
- `docs/agreements/` — Member agreements and consent

---

*Document maintained by ClubOS development team. Authoritative for photo subsystem data model.*
