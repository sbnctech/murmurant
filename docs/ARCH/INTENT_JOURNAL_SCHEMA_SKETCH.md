# Intent Journal Schema Sketch

**Status:** Design Document (not yet implemented)
**Related Issues:** #277 (Cutover Rehearsal Mode), #202 (WA Migration Epic), #232 (Production Runbook)

---

## Overview

This document sketches the schema design for the Intent Journal, a core component of Cutover Rehearsal Mode. The Intent Journal provides an append-only, tamper-evident log of all changes made during cutover rehearsal, enabling deterministic replay on commit and zero-loss abort.

**This is a design sketch only.** Prisma schema changes will be implemented in a separate issue after design review.

---

## Design Principles

The Intent Journal design adheres to these principles from the Architectural Charter:

| Principle | Application |
|-----------|-------------|
| **P1: Auditability** | Every intent includes actor, timestamp, and full payload |
| **P3: State Machines** | Rehearsal session has explicit states (ACTIVE, COMMITTED, ABORTED) |
| **P5: Reversibility** | Abort discards all intents; commit replays deterministically |
| **P7: Observability** | Journal provides real-time visibility into rehearsal activity |
| **P8: Stable Contracts** | Intent payload schema is versioned for forward compatibility |

---

## Schema Sketch

### RehearsalSession

Represents a single cutover rehearsal attempt.

```
RehearsalSession
├── id: UUID (primary key)
├── organizationId: String (FK to Organization)
├── status: Enum (ACTIVE | COMMITTED | ABORTED)
├── startedAt: DateTime
├── startedBy: String (actor identifier)
├── endedAt: DateTime? (null while ACTIVE)
├── endedBy: String? (actor who committed/aborted)
├── commitSha: String? (git SHA at start, for reproducibility)
├── metadata: JSON (additional context)
├── createdAt: DateTime
├── updatedAt: DateTime
└── intents: IntentJournalEntry[] (relation)
```

**Constraints:**

- Only one ACTIVE session per organization at a time
- Status transitions: ACTIVE → COMMITTED | ABORTED (terminal)
- Cannot transition from COMMITTED or ABORTED

### IntentJournalEntry

Represents a single intended change recorded during rehearsal.

```
IntentJournalEntry
├── id: UUID (primary key)
├── sessionId: UUID (FK to RehearsalSession)
├── sequence: BigInt (monotonic, session-scoped)
├── intentType: String (e.g., "MEMBER_UPDATE", "EVENT_CREATE")
├── entityType: String (e.g., "Member", "Event", "Registration")
├── entityId: String? (existing entity ID, null for creates)
├── actor: String (user identifier or "system")
├── payload: JSON (full intent data, version-tagged)
├── payloadVersion: Int (schema version for forward compatibility)
├── checksum: String (SHA-256 of payload for integrity)
├── parentIntentId: UUID? (for dependent intents, null if independent)
├── createdAt: DateTime (immutable)
├── replayedAt: DateTime? (set when committed and replayed)
├── replayResult: Enum? (SUCCESS | FAILED | SKIPPED)
└── replayError: String? (error message if FAILED)
```

**Constraints:**

- sequence is unique within sessionId (ensures ordering)
- createdAt is immutable (append-only)
- replayedAt, replayResult, replayError only set during commit phase

### IntentType Enumeration

```
IntentType:
  # Member operations
  MEMBER_CREATE
  MEMBER_UPDATE
  MEMBER_TIER_CHANGE
  MEMBER_STATUS_CHANGE

  # Event operations
  EVENT_CREATE
  EVENT_UPDATE
  EVENT_PUBLISH
  EVENT_CANCEL
  EVENT_ARCHIVE

  # Registration operations
  REGISTRATION_CREATE
  REGISTRATION_UPDATE
  REGISTRATION_CANCEL
  REGISTRATION_CHECKIN

  # Governance operations
  MINUTES_CREATE
  MINUTES_APPROVE
  MOTION_CREATE
  MOTION_VOTE

  # System operations
  SYNC_BATCH      # Incremental WA sync
  POLICY_UPDATE   # Policy configuration change
  SEED_DATA       # Initial data seeding
```

---

## Payload Schema (Versioned)

Each intent type has a versioned payload schema. Version is stored in `payloadVersion`.

### Example: MEMBER_UPDATE (v1)

```json
{
  "version": 1,
  "entityId": "member_abc123",
  "changes": {
    "phone": { "from": "805-555-0100", "to": "805-555-0199" },
    "email": { "from": "old@example.com", "to": "new@example.com" }
  },
  "reason": "Member requested update"
}
```

### Example: EVENT_CREATE (v1)

```json
{
  "version": 1,
  "event": {
    "title": "January Social",
    "description": "Monthly social event",
    "startsAt": "2025-01-20T18:00:00-08:00",
    "endsAt": "2025-01-20T21:00:00-08:00",
    "capacity": 50,
    "categoryId": "cat_social"
  }
}
```

### Example: SYNC_BATCH (v1)

```json
{
  "version": 1,
  "source": "wildapricot",
  "syncType": "incremental",
  "recordCount": 15,
  "entityTypes": ["Member", "Registration"],
  "waTimestampRange": {
    "from": "2025-01-15T00:00:00Z",
    "to": "2025-01-15T23:59:59Z"
  }
}
```

---

## Replay Mechanics

### Commit Process

When a rehearsal session is committed:

1. **Lock session** — Set status to transitioning (prevents new intents)
2. **Validate all intents** — Pre-flight check for replayability
3. **Begin transaction** — Wrap replay in database transaction
4. **Replay in sequence order** — Process each intent monotonically
5. **Record replay results** — Update replayedAt, replayResult per entry
6. **Commit transaction** — Atomically apply all changes
7. **Finalize session** — Set status to COMMITTED, record endedAt

### Replay Ordering

Intents are replayed strictly by `sequence` within a session. The sequence counter is:

- Assigned atomically at intent creation time
- Monotonically increasing (never reused)
- Gap-tolerant (gaps from failed validations are allowed)

### Dependent Intents

Some intents depend on others (e.g., registration depends on event existing):

```
Intent 1: EVENT_CREATE (event_xyz)
Intent 2: REGISTRATION_CREATE (parentIntentId: Intent 1)
```

During replay, dependent intents are processed after their parents. The `parentIntentId` field tracks these dependencies.

### Replay Failures

If replay fails for an intent:

1. **Rollback transaction** — No partial commits
2. **Record error** — Set replayResult = FAILED, capture replayError
3. **Halt replay** — Do not continue with remaining intents
4. **Session remains ACTIVE** — Operator must resolve and retry

---

## Abort Process

When a rehearsal session is aborted:

1. **Lock session** — Prevent new intents
2. **Verify no active transactions** — Ensure clean state
3. **Set status to ABORTED** — Mark session as terminated
4. **Record endedAt, endedBy** — Audit trail
5. **No data deletion** — Intent journal is preserved for audit (not replayed)

The intent journal entries remain in the database for audit purposes but are never replayed.

---

## Integrity Guarantees

### Append-Only

Once created, an IntentJournalEntry is immutable except for replay fields:

- id, sessionId, sequence, intentType, entityType, entityId: immutable
- actor, payload, payloadVersion, checksum, createdAt: immutable
- replayedAt, replayResult, replayError: set once during commit

### Checksum Verification

Each intent includes a SHA-256 checksum of the payload:

```
checksum = SHA256(canonicalize(payload))
```

Where `canonicalize` produces deterministic JSON (sorted keys, no whitespace).

During replay, checksums are verified to detect tampering.

### Sequence Integrity

The sequence counter ensures:

- Total ordering within a session
- No intent can be inserted between existing intents
- Replay order is deterministic

---

## Verification Gates

Before recording an intent, verification gates validate:

| Gate | Description |
|------|-------------|
| **Schema Validation** | Payload matches expected schema for intentType |
| **Reference Integrity** | Referenced entities exist (or have pending create intents) |
| **Business Rules** | Intent doesn't violate business constraints |
| **Permission Check** | Actor has permission for this operation |
| **Duplicate Detection** | Intent isn't a duplicate of existing entry |

Failed gates return errors to the caller; no intent is recorded.

---

## Observability

### Metrics

- `rehearsal_session_active` — Gauge: 1 if active session, 0 otherwise
- `intent_journal_entries_total` — Counter: total intents by type
- `intent_journal_entry_latency` — Histogram: time to record intent
- `replay_duration_seconds` — Histogram: commit replay duration
- `replay_failures_total` — Counter: failed replay attempts

### Logging

Structured logs for:

- Session lifecycle (start, commit, abort)
- Intent creation (type, actor, entityType)
- Replay progress (sequence, result)
- Verification gate failures

### Dashboard

Real-time view during rehearsal:

- Intent count by type
- Recent intents (last 50)
- Verification gate failures
- Session duration
- Commit readiness indicators

---

## Migration Considerations

### Index Requirements

For production query performance:

```sql
-- Query intents by session for replay
CREATE INDEX idx_intent_session_sequence
  ON IntentJournalEntry(sessionId, sequence);

-- Query intents by entity for debugging
CREATE INDEX idx_intent_entity
  ON IntentJournalEntry(entityType, entityId);

-- Find active sessions
CREATE INDEX idx_session_status
  ON RehearsalSession(organizationId, status);
```

### Storage Estimates

Assuming:

- Average payload size: 2 KB
- Intents per rehearsal: 1,000 (typical 48-hour window)
- Sessions per org per year: 2 (initial + one retry)

Storage: ~4 MB per org per year. Minimal.

### Retention Policy

Intent journal entries are retained indefinitely for audit purposes. Committed sessions provide migration history; aborted sessions document attempted migrations.

---

## Future Considerations

### Multi-Org Support

Current design assumes single-org per rehearsal. For platform-level migrations affecting multiple orgs, consider:

- Session hierarchy (parent session with child sessions per org)
- Cross-org dependency tracking
- Federated commit/abort

### Partial Replay

Not currently supported. All or nothing. Future enhancement could support:

- Replay to specific sequence number
- Skip-and-continue for non-critical failures
- Interactive replay with manual resolution

### Intent Compression

For very large migrations, consider:

- Batch intents (multiple changes per entry)
- Payload compression (gzip)
- External payload storage (S3 references)

---

## Related Documentation

- [Customer Migration Cutover Rehearsal](../IMPORTING/CUSTOMER_MIGRATION_CUTOVER_REHEARSAL.md) — Customer-facing explanation
- [Production Migration Runbook](../IMPORTING/PRODUCTION_MIGRATION_RUNBOOK.md) — Operational procedures
- [Architectural Charter](./ARCHITECTURAL_CHARTER.md) — Governing principles

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-24 | System | Initial schema sketch |
