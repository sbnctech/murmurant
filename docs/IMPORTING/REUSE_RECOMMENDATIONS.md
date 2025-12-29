# Wild Apricot Integration: Reuse Recommendations

This document evaluates components from the existing WA sync system and recommends an integration strategy for Murmurant.

## 1. Component Reusability Assessment

### 1.1 Reusability Matrix

| Component | File | Reusable As-Is | Reusable With Changes | Not Reusable | Notes |
|-----------|------|----------------|----------------------|--------------|-------|
| OAuth Authentication | wa_full_sync.py:190-257 | - | Yes | - | Needs async/await, TypeScript port |
| Token Caching | wa_full_sync.py:207-253 | - | Yes | - | Good pattern, needs TypeScript port |
| API Request Handler | wa_full_sync.py:259-315 | - | Yes | - | Good error handling, needs TypeScript |
| Async Query Polling | wa_full_sync.py:317-389 | - | Yes | - | Essential for contacts, port to TS |
| Pagination Handler | wa_full_sync.py:391-461 | - | Yes | - | Good pattern, needs TypeScript |
| Contact Fetcher | wa_full_sync.py:463-491 | - | Yes | - | Needs field mapping changes |
| Event Fetcher | wa_full_sync.py:493-498 | - | Yes | - | Simple, port to TypeScript |
| Registration Fetcher | wa_full_sync.py:500-538 | - | Yes | - | Per-event pattern is correct |
| SQLite Save Methods | wa_full_sync.py:572-1114 | - | - | Yes | Murmurant uses PostgreSQL/Prisma |
| Retry Wrapper | cron/run_incremental_sync_with_retry.sh | Yes | - | - | Shell script, use directly |
| Config Schema | wa_config.json | - | Yes | - | Add Murmurant-specific fields |
| Email Change Detection | wa_incremental_sync.py:199-241 | - | Yes | - | Useful for sync validation |
| Committee Derivation | wa_full_sync.py:897-1014 | - | Yes | - | Regex patterns, port to TS |
| Database Indexes | wa_db_optimizer.py | - | - | Yes | Different DB, different schema |
| Views | wa_db_optimizer.py | - | - | Yes | Different DB, use Prisma |

### 1.2 Summary Counts

- **Reusable As-Is:** 1 component (retry shell script)
- **Reusable With Changes:** 11 components (core API logic)
- **Not Reusable:** 3 components (SQLite-specific)

## 2. Gap Analysis: Chatbot Sync vs Murmurant Requirements

### 2.1 What Murmurant Needs (Beyond Chatbot)

| Requirement | Chatbot Sync | Murmurant Needs | Gap |
|-------------|--------------|--------------|-----|
| Target Database | SQLite | PostgreSQL | Major |
| ORM | None (raw SQL) | Prisma | Major |
| ID Strategy | WA integers | UUIDs | Major |
| Relational Integrity | Weak | Strong (FK constraints) | Major |
| Idempotent Upserts | INSERT OR REPLACE | Prisma upsert with external ID | Moderate |
| Audit Logging | None | AuditLog model | Moderate |
| Historical Snapshots | Daily DB backup | Git or versioned tables | Minor |
| Soft Deletes | None | Detect WA deletions | Minor |
| Governance Roles | Not tracked | RoleAssignment, ServiceHistory | N/A (Murmurant-only) |
| Officer Assignments | Parsed from text | Structured data | Moderate |

### 2.2 What Can Be Reused

1. **API Client Logic** - Core authentication, pagination, async polling
2. **Entity Fetcher Structure** - Per-entity fetch functions
3. **Retry/Alerting Pattern** - Shell wrapper for reliability
4. **Incremental Sync Strategy** - Filter-based delta extraction
5. **Committee Derivation Heuristics** - Email prefix and name parsing

### 2.3 What Must Be Rebuilt

1. **Database Layer** - Prisma instead of raw SQLite
2. **ID Mapping System** - WA integer → Murmurant UUID translation
3. **Field Transformers** - TypeScript functions with proper typing
4. **Validation Layer** - Zod schemas for WA API responses
5. **Audit Trail** - Integration with Murmurant AuditLog

### 2.4 What Should NOT Be Reused

1. **SQLite Schema** - Incompatible with PostgreSQL
2. **Raw SQL Queries** - Use Prisma instead
3. **View Definitions** - Different schema structure
4. **Python Runtime** - Murmurant is TypeScript/Node.js

## 3. Integration Strategy Recommendation

### 3.1 Recommended Approach: Hybrid (Option 4)

**Description:** Port WA API client logic to TypeScript as a reusable module, build fresh Prisma-based import layer.

### 3.2 Comparison of Options

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| 1. Direct Reuse | Use chatbot Python code directly | Fast initial setup | Wrong language, no Prisma |
| 2. Fork Modules | Copy chatbot files into Murmurant | Known working code | Maintenance burden, Python in TS codebase |
| 3. Fresh Build | Build importer from scratch | Clean architecture | Reinvent wheel, miss edge cases |
| **4. Hybrid** | Port API client, fresh DB layer | Best of both worlds | Moderate effort |

### 3.3 Hybrid Approach Details

```
┌─────────────────────────────────────────────────────────────┐
│                    Murmurant WA Importer                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │   @murmurant/wa-api-client (TypeScript port)           │   │
│  │   ────────────────────────────────────────────────  │   │
│  │   - WildApricotClient class                         │   │
│  │   - OAuth token management                          │   │
│  │   - Paginated fetching                              │   │
│  │   - Async query polling                             │   │
│  │   - Rate limiting / retries                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   WA Entity Fetchers (TypeScript)                   │   │
│  │   ────────────────────────────────────────────────  │   │
│  │   - fetchContacts() → WAContact[]                   │   │
│  │   - fetchEvents() → WAEvent[]                       │   │
│  │   - fetchRegistrations(eventId) → WARegistration[]  │   │
│  │   - fetchMembershipLevels() → WAMembershipLevel[]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   Transformers (NEW - Murmurant specific)              │   │
│  │   ────────────────────────────────────────────────  │   │
│  │   - transformMember(WAContact) → MemberCreateInput  │   │
│  │   - transformEvent(WAEvent) → EventCreateInput      │   │
│  │   - transformRegistration() → RegistrationInput     │   │
│  │   - mapStatus() → MembershipStatus                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   Prisma Import Layer (NEW)                         │   │
│  │   ────────────────────────────────────────────────  │   │
│  │   - WA ID → UUID mapping table                      │   │
│  │   - Idempotent upserts                              │   │
│  │   - Transaction batching                            │   │
│  │   - Audit log integration                           │   │
│  │   - Error handling / rollback                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Estimated Effort

| Component | Effort | Notes |
|-----------|--------|-------|
| TypeScript WA API Client | 2-3 days | Port from Python, add types |
| Zod Schemas for WA Responses | 1 day | Type safety for API responses |
| Field Transformers | 2 days | Business logic mapping |
| Prisma Import Layer | 3-4 days | Upserts, transactions, ID mapping |
| ID Mapping Table Migration | 0.5 day | Prisma schema + migration |
| Audit Integration | 1 day | Hook into AuditLog |
| Incremental Sync Logic | 2 days | State tracking, delta detection |
| Testing | 2-3 days | Unit + integration tests |
| Documentation | 1 day | Usage guide, runbook |

**Total Estimate:** 15-18 days

### 3.5 Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| WA API changes | Low | High | Pin API version (v2.2), monitor changelog |
| Rate limiting | Medium | Medium | Implement backoff, respect limits |
| Data quality issues | High | Medium | Validation layer, error logging |
| Missing edge cases | Medium | Low | Study chatbot sync logs for patterns |
| Performance at scale | Low | Medium | Batch operations, connection pooling |

## 4. Implementation Phases

### Phase 1: Foundation (Week 1)

1. Create `@murmurant/wa-api-client` module
2. Port OAuth authentication to TypeScript
3. Port pagination and async polling
4. Add Zod schemas for API responses
5. Unit tests for API client

### Phase 2: Entity Fetchers (Week 2)

1. Implement entity fetchers (contacts, events, registrations)
2. Port committee derivation logic
3. Create WA ID mapping Prisma model
4. Integration tests against WA sandbox

### Phase 3: Import Layer (Week 3)

1. Build field transformers
2. Implement Prisma upsert operations
3. Add transaction batching
4. Integrate with AuditLog
5. Handle soft deletes / orphans

### Phase 4: Operational (Week 4)

1. Build incremental sync scheduler
2. Add monitoring / alerting
3. Create admin UI for sync status
4. Write operational documentation
5. Production deployment

## 5. Files to Create in Murmurant

```
src/
├── lib/
│   └── wa/
│       ├── client.ts           # WA API client class
│       ├── auth.ts             # OAuth token management
│       ├── types.ts            # WA API response types
│       ├── schemas.ts          # Zod validation schemas
│       ├── fetchers/
│       │   ├── contacts.ts     # Contact fetcher
│       │   ├── events.ts       # Event fetcher
│       │   └── registrations.ts # Registration fetcher
│       ├── transformers/
│       │   ├── member.ts       # WA Contact → Member
│       │   ├── event.ts        # WA Event → Event
│       │   └── registration.ts # WA Reg → Registration
│       └── import/
│           ├── importer.ts     # Main import orchestrator
│           ├── id-mapper.ts    # WA ID ↔ UUID mapping
│           └── audit.ts        # Audit log hooks
├── scripts/
│   └── wa-sync/
│       ├── full-sync.ts        # Full import script
│       └── incremental-sync.ts # Delta import script
└── app/
    └── api/
        └── admin/
            └── wa-sync/
                └── route.ts    # Admin API for sync status

prisma/
└── schema.prisma               # Add WaIdMapping model
```

## 6. Prisma Schema Addition

```prisma
// Wild Apricot ID Mapping for data import
// Tracks correspondence between WA integer IDs and Murmurant UUIDs
model WaIdMapping {
  id         String   @id @default(uuid()) @db.Uuid
  entityType String   // "member", "event", "registration"
  waId       Int      // Wild Apricot integer ID
  murmurantId   String   @db.Uuid // Murmurant entity UUID
  syncedAt   DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([entityType, waId])
  @@index([entityType, murmurantId])
  @@index([syncedAt])
}
```

## 7. Configuration for Murmurant

```typescript
// src/lib/wa/config.ts
export const WA_CONFIG = {
  apiBaseUrl: 'https://api.wildapricot.org/v2.2',
  authUrl: 'https://oauth.wildapricot.org/auth/token',
  accountId: process.env.WA_ACCOUNT_ID!,
  apiKey: process.env.WA_API_KEY!,

  // Sync settings
  pageSize: 100,
  asyncPollIntervalMs: 3000,
  asyncMaxAttempts: 40,
  requestTimeoutMs: 30000,
  tokenExpiryBufferMs: 300000, // 5 minutes

  // Retry settings
  maxRetries: 3,
  retryDelayMs: 60000, // 1 minute base

  // Incremental sync
  contactsLookbackDays: 1,
  eventsLookbackDays: 730, // 2 years
};
```

## 8. Environment Variables

Add to `.env.example`:

```bash
# Wild Apricot Integration
WA_ACCOUNT_ID=176353
WA_API_KEY=your_api_key_here
WA_SYNC_ENABLED=true
```

## 9. Conclusion

**Recommended Strategy:** Hybrid approach (Option 4)

**Justification:**

1. The chatbot sync has proven patterns for WA API interaction that should not be reinvented
2. The database layer is incompatible and must be rebuilt for Prisma/PostgreSQL
3. TypeScript provides type safety that Python lacks
4. Murmurant architectural requirements (audit logs, UUIDs, relational integrity) require fresh implementation
5. Porting core API logic reduces risk of missing edge cases the chatbot team discovered

**Next Step:** If approved, proceed with Phase 1 implementation of the TypeScript WA API client.
