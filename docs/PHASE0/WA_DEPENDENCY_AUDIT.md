# Wild Apricot Dependency Audit

**Generated:** 2025-12-27
**Purpose:** Document all Wild Apricot (WA) dependencies in Murmurant codebase

---

## Summary

Murmurant has a well-structured Wild Apricot integration layer located primarily in `src/lib/importing/wildapricot/`. The integration is used for data migration/import purposes.

| Category | Count |
|----------|-------|
| Core WA Module Files | 6 |
| WA-Related Scripts | 7 |
| WA Documentation Files | 18+ |
| Environment Variables | 14 |
| WA Types Defined | 15+ |

---

## Core WA Module Files

Located in `src/lib/importing/wildapricot/`:

| File | Size | Purpose |
|------|------|---------|
| `client.ts` | 14KB | WildApricotClient class - API communication |
| `config.ts` | 3.6KB | Configuration loading from env vars |
| `importer.ts` | 49KB | Main import/sync logic |
| `index.ts` | 1.2KB | Module exports |
| `transformers.ts` | 11KB | WA to Murmurant data transformers |
| `types.ts` | 10KB | TypeScript type definitions |

---

## Environment Variables

### Required

| Variable | Purpose |
|----------|---------|
| `WA_API_KEY` | Wild Apricot API key for authentication |
| `WA_ACCOUNT_ID` | Wild Apricot account identifier |

### Optional (with defaults)

| Variable | Default | Purpose |
|----------|---------|---------|
| `WA_API_BASE_URL` | `https://api.wildapricot.org/v2.2` | API base URL |
| `WA_AUTH_URL` | `https://oauth.wildapricot.org/auth/token` | OAuth token URL |
| `WA_PAGE_SIZE` | `100` | Pagination size |
| `WA_ASYNC_POLL_INTERVAL_MS` | `3000` | Async polling interval |
| `WA_ASYNC_MAX_ATTEMPTS` | `40` | Max polling attempts |
| `WA_REQUEST_TIMEOUT_MS` | `30000` | Request timeout |
| `WA_TOKEN_EXPIRY_BUFFER_MS` | `300000` | Token refresh buffer |
| `WA_MAX_RETRIES` | `3` | Max retry attempts |
| `WA_RETRY_BASE_DELAY_MS` | `1000` | Base retry delay |
| `WA_RETRY_MAX_DELAY_MS` | `60000` | Max retry delay |
| `WA_CONTACTS_LOOKBACK_DAYS` | `1` | Contact sync lookback |
| `WA_EVENTS_LOOKBACK_DAYS` | `730` | Event sync lookback (2 years) |
| `WA_DB_BATCH_SIZE` | `100` | Database batch size |

---

## API Endpoints Called

| Endpoint | Purpose |
|----------|---------|
| `https://oauth.wildapricot.org/auth/token` | OAuth authentication |
| `https://api.wildapricot.org/v2.2/accounts/{id}` | Account info |
| `https://api.wildapricot.org/v2.2/accounts/{id}/contacts` | Contacts/Members |
| `https://api.wildapricot.org/v2.2/accounts/{id}/events` | Events |
| `https://api.wildapricot.org/v2.2/accounts/{id}/events/{id}/registrations` | Event registrations |
| `https://api.wildapricot.org/v2.2/accounts/{id}/membershiplevels` | Membership levels |

---

## WA Types Defined

In `src/lib/importing/wildapricot/types.ts`:

- `WAContact` - Member/contact data structure
- `WAContactStatus` - Contact status enum
- `WAContactRef` - Contact reference
- `WAMembershipLevel` - Membership level definition
- `WAMembershipLevelRef` - Membership level reference
- `WAEvent` - Event data structure
- `WAEventAccessLevel` - Event access enum
- `WAEventDetails` - Event detail fields
- `WAEventOrganizer` - Event organizer info
- `WAEventRegistrationType` - Registration type definition
- `WAEventRegistration` - Registration record
- `WAEventRef` - Event reference
- `WAAsyncQueryResponse` - Async query response
- `WAPaginatedResponse` - Paginated API response
- `WAConfig` - Configuration interface

---

## WA-Dependent Scripts

| Script | Purpose |
|--------|---------|
| `scripts/importing/wa_full_sync.ts` | Full data sync from WA |
| `scripts/importing/wa_incremental_sync.ts` | Incremental sync |
| `scripts/importing/wa_health_check.ts` | WA connection health check |
| `scripts/demo/refresh-sbnc-demo.ts` | Demo data refresh |
| `scripts/finance/wa_personify_payments_analyze.ts` | Payment analysis |
| `scripts/migration/capture-wa-policies.ts` | Policy capture |
| `scripts/migration/capture-policies.ts` | General policy capture |

---

## Other WA-Dependent Source Files

| File | Purpose |
|------|---------|
| `src/app/api/v1/admin/import/status/route.ts` | Import status API endpoint |

---

## WA Documentation Files

- `docs/IMPORTING/WA_FIELD_MAPPING.md` - Field mapping spec
- `docs/IMPORTING/WA_MIGRATION_RUNBOOK.md` - Migration runbook
- `docs/IMPORTING/WA_REGISTRATION_PIPELINE_ANALYSIS.md` - Registration pipeline
- `docs/IMPORTING/WA_POLICY_CAPTURE.md` - Policy capture docs
- `docs/IMPORTING/WA_FULL_SYNC_REPORTING.md` - Sync reporting
- `docs/IMPORTING/WA_REGISTRATIONS_DIAGNOSTIC.md` - Registration diagnostics
- `docs/MIGRATION/WA_IMPORT_PIPELINE_*.md` - Import pipeline docs
- `docs/MIGRATION/WA_TO_MURMURANT_EVENTS.md` - Event migration
- `docs/INSTALL/WA_CONFIG_PAGE_GUIDE.md` - WA config page setup
- `docs/INSTALL/WA_CONFIG_PAGE_BLOCK.html` - WA config HTML block
- `docs/FINANCE/WA_VS_MURMURANT_COST_COMPARISON.md` - Cost comparison
- `docs/product/WA_TOP_50_PERSONA_IMPLICATIONS.md` - Product analysis
- `docs/BIZ/WILD_APRICOT_EXTENSION_LANDSCAPE.md` - Extension landscape

---

## Dependency Graph

\`\`\`
src/lib/importing/wildapricot/
├── index.ts (exports)
│   ├── client.ts (WildApricotClient)
│   │   ├── config.ts (getWAConfig)
│   │   └── types.ts (WA* types)
│   ├── importer.ts (sync functions)
│   │   ├── client.ts
│   │   └── transformers.ts
│   └── transformers.ts
│       └── types.ts

scripts/importing/
├── wa_full_sync.ts → lib/importing/wildapricot
├── wa_incremental_sync.ts → lib/importing/wildapricot
└── wa_health_check.ts → lib/importing/wildapricot
\`\`\`

---

## Key Classes and Functions

### WildApricotClient (client.ts)

Main API client class with methods:

- `fetchContacts(filter?)` - Fetch contacts
- `fetchContactsModifiedSince(date)` - Incremental contact fetch
- `fetchEvents(filter?)` - Fetch events
- `fetchEventsFromDate(date)` - Events from date
- `fetchEventDetails(eventId)` - Single event details
- `fetchEventRegistrations(eventId)` - Event registrations
- `fetchMembershipLevels()` - Membership levels

### Factory Functions

- `createWAClient()` - Create client with env config
- `createWAClientWithConfig(config)` - Create with explicit config

### Transformers (transformers.ts)

- `mapContactStatusToCode()` - Status mapping
- `deriveCategory()` - Event category derivation
- `extractDescription()` - Description extraction
- Transform functions for contacts, events, registrations

---

## Migration Considerations

When migrating away from Wild Apricot:

1. **Data Migration Scripts** - Core sync functionality in importer.ts
2. **Environment Variables** - 14 WA-specific env vars to remove
3. **API Client** - WildApricotClient class and all API calls
4. **Type Definitions** - All WA* prefixed types
5. **Documentation** - 18+ docs referencing WA
6. **Scripts** - 7 WA-specific scripts

---

## Recommendations

1. **Isolation**: WA code is well-isolated in `lib/importing/wildapricot/`
2. **No Runtime Dependency**: WA integration is import-only, not used in production app runtime
3. **Clean Removal**: Can be removed by deleting the wildapricot directory and related scripts
4. **Env Cleanup**: Remove WA_* variables from deployment configs
