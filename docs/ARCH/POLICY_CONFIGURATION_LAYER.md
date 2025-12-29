# Organization Policy Configuration Layer

> **Related Issues:** [#263](https://github.com/sbnctech/murmurant/issues/263) | [#232 - Policy Isolation Epic](https://github.com/sbnctech/murmurant/issues/232) | [#248 - Business Model Epic](https://github.com/sbnctech/murmurant/issues/248)

This document defines the architecture for storing, versioning, and accessing organization-specific policy configuration in Murmurant.

---

## Design Goals

1. **Multi-tenant Ready**: Each organization can have distinct policies
2. **SBNC as Tenant Zero**: SBNC values become defaults, never requirements
3. **No Code Deployments for Policy Changes**: Policy updates are data changes
4. **Type-Safe Access**: Runtime policy access is strongly typed
5. **Auditable**: Policy changes are tracked with version history

---

## Storage Decision: Hybrid (Database + Environment)

### Decision

**Primary storage: Database tables**
**Fallback/override: Environment variables**

### Rationale

| Option | Pros | Cons |
|--------|------|------|
| **JSON files** | Simple, version-controlled | No per-org override, requires deployment |
| **Environment vars only** | Simple, 12-factor | No per-org, no version history, limited structure |
| **Database only** | Per-org, versionable | Cold-start latency, schema migrations |
| **Hybrid (chosen)** | Per-org in DB, platform defaults in env | Slightly more complex |

### Why Hybrid

1. **Organization policies** (membership thresholds, role names) → Database tables
   - Supports true multi-tenancy
   - Versionable per-org
   - Editable via admin UI

2. **Platform defaults** (fallback values) → Environment + code constants
   - Provides reasonable defaults when DB unavailable
   - Simplifies local development
   - Matches 12-factor app principles

3. **Feature flags** → Environment + Database
   - Environment for deploy-time toggles
   - Database for org-specific feature access

---

## Configuration Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│  Resolution Order (highest priority first)              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Environment Override                                │
│     MURMURANT_OVERRIDE_<category>_<key>=value              │
│     (Escape hatch for incidents / testing)              │
│                                                         │
│  2. Organization Config (Database)                      │
│     OrgConfig table, scoped by orgId                    │
│     (Primary source for multi-tenant policies)          │
│                                                         │
│  3. Platform Defaults (Code Constants)                  │
│     DEFAULT_* constants in src/lib/policy/defaults.ts   │
│     (Fallback when org has no override)                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Resolution Example

```typescript
// Simplified resolution logic
async function getPolicy<K extends PolicyKey>(
  orgId: string,
  key: K
): Promise<PolicyValue<K>> {
  // 1. Environment override (emergency use only)
  const envKey = `MURMURANT_OVERRIDE_${key.toUpperCase()}`;
  if (process.env[envKey]) {
    return parseEnvValue(process.env[envKey], key);
  }

  // 2. Organization config from database
  const orgConfig = await getOrgConfig(orgId, key);
  if (orgConfig !== null) {
    return orgConfig;
  }

  // 3. Platform default
  return PLATFORM_DEFAULTS[key];
}
```

---

## Tenant Zero: SBNC

### Principle: Defaults, Never Required

SBNC is the first organization deployed on Murmurant. Its configuration becomes the **default template**, not hard-coded requirements.

### Implementation Strategy

1. **Seed Script**: `prisma/seed.ts` creates SBNC as org ID `org_sbnc`
2. **Default Values**: SBNC's policies are inserted as the first row in OrgConfig
3. **New Org Onboarding**: Clone SBNC config as starting point, or start from platform defaults
4. **No Special-Casing**: Application code never checks `if (orgId === 'org_sbnc')`

### Migration Path

```
Current State:
  const NEWBIE_DAYS = 90;  // Hard-coded in lifecycle.ts

Target State:
  const newbieDays = await getPolicy(orgId, 'membership.newbieDays');
  // Returns 90 for SBNC (from DB), platform default for new orgs
```

---

## Policy Categories

### 1. Membership Policies

| Key | Type | SBNC Default | Description |
|-----|------|--------------|-------------|
| `membership.newbieDays` | number | 90 | Days in newbie period |
| `membership.extendedDays` | number | 730 | Days until extended offer |
| `membership.gracePeriodDays` | number | 30 | Payment grace period |

### 2. Scheduling Policies

| Key | Type | SBNC Default | Description |
|-----|------|--------------|-------------|
| `scheduling.timezone` | string | America/Los_Angeles | Org timezone |
| `scheduling.registrationOpenDay` | number | 2 (Tuesday) | Day of week (0=Sun) |
| `scheduling.registrationOpenHour` | number | 8 | Hour (24h format) |
| `scheduling.eventArchiveDays` | number | 30 | Days after event to archive |

### 3. Governance Policies

| Key | Type | SBNC Default | Description |
|-----|------|--------------|-------------|
| `governance.boardEligibilityDays` | number | 730 | Min membership for board |
| `governance.minutesApprovalRequired` | boolean | true | Require minutes approval |
| `governance.termStartMonth` | number | 7 (July) | Fiscal year start |

### 4. Display/Terminology

| Key | Type | SBNC Default | Description |
|-----|------|--------------|-------------|
| `display.orgName` | string | Santa Barbara Newcomers Club | Full name |
| `display.orgShortName` | string | SBNC | Abbreviation |
| `display.memberNoun` | string | member | Singular noun |
| `display.membersNoun` | string | members | Plural noun |

---

## Runtime Access Pattern

### Safe Policy Access

```typescript
// src/lib/policy/index.ts

import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { PLATFORM_DEFAULTS } from './defaults';
import type { PolicyKey, PolicyValue } from './types';

/**
 * Get organization policy value with fallback to platform default.
 * Cached per-request via React cache().
 */
export const getPolicy = cache(async <K extends PolicyKey>(
  orgId: string,
  key: K
): Promise<PolicyValue<K>> => {
  // Check environment override (escape hatch)
  const envOverride = getEnvOverride(key);
  if (envOverride !== undefined) {
    return envOverride;
  }

  // Fetch from database
  const config = await prisma.orgConfig.findUnique({
    where: { orgId_key: { orgId, key } },
    select: { value: true },
  });

  if (config?.value !== undefined) {
    return config.value as PolicyValue<K>;
  }

  // Platform default
  return PLATFORM_DEFAULTS[key];
});

/**
 * Require policy - throws if not found and no default exists.
 */
export async function requirePolicy<K extends PolicyKey>(
  orgId: string,
  key: K
): Promise<PolicyValue<K>> {
  const value = await getPolicy(orgId, key);
  if (value === undefined) {
    throw new Error(`Required policy ${key} not found for org ${orgId}`);
  }
  return value;
}
```

### Usage in Application Code

```typescript
// BEFORE (hard-coded)
const NEWBIE_PERIOD_DAYS = 90;
if (daysSinceJoin < NEWBIE_PERIOD_DAYS) { ... }

// AFTER (policy-driven)
const newbieDays = await getPolicy(orgId, 'membership.newbieDays');
if (daysSinceJoin < newbieDays) { ... }
```

---

## Guardrails

### G1: No Direct Imports of SBNC Policy Constants

```typescript
// FORBIDDEN - direct SBNC constant in app logic
import { SBNC_NEWBIE_DAYS } from '@/lib/sbnc-defaults';

// ALLOWED - policy accessor with org context
import { getPolicy } from '@/lib/policy';
const days = await getPolicy(orgId, 'membership.newbieDays');
```

**CI Check**: Lint rule to flag imports from `**/sbnc-*` in `src/app/**` or `src/lib/**` (excluding seed scripts).

### G2: Policy Keys Must Be Typed

```typescript
// FORBIDDEN - stringly-typed policy access
await getPolicy(orgId, 'membership.newbieDays' as any);

// ALLOWED - type-safe key
await getPolicy(orgId, 'membership.newbieDays'); // Type-checked
```

**CI Check**: TypeScript strict mode ensures key is valid `PolicyKey`.

### G3: Org Context Required

```typescript
// FORBIDDEN - policy access without org context
await getPolicy('membership.newbieDays'); // Missing orgId

// ALLOWED - explicit org context
await getPolicy(session.orgId, 'membership.newbieDays');
```

**CI Check**: Function signature requires `orgId` as first parameter.

---

## Versioning and Migrations

### Policy Version Tracking

Each policy change is recorded with:

- `version`: Auto-incrementing per (orgId, key)
- `changedAt`: Timestamp
- `changedBy`: User ID (or `system` for migrations)
- `previousValue`: Prior value for rollback

### Schema Migration Strategy

When adding new policy keys:

1. **Add to `PolicyKey` type** in `src/lib/policy/types.ts`
2. **Add platform default** in `src/lib/policy/defaults.ts`
3. **Create database migration** to add key for existing orgs (optional)
4. **No code deployment required** for orgs to start using

### Rollback Capability

```typescript
// Restore previous policy value
await rollbackPolicy(orgId, 'membership.newbieDays', toVersion);
```

---

## Testing Strategy

### 1. Contract Tests

```typescript
describe('Policy Configuration Layer', () => {
  test('returns platform default when org has no override', async () => {
    const days = await getPolicy('org_new', 'membership.newbieDays');
    expect(days).toBe(PLATFORM_DEFAULTS['membership.newbieDays']);
  });

  test('returns org-specific value when configured', async () => {
    await setPolicy('org_test', 'membership.newbieDays', 60);
    const days = await getPolicy('org_test', 'membership.newbieDays');
    expect(days).toBe(60);
  });

  test('environment override takes precedence', async () => {
    process.env.MURMURANT_OVERRIDE_MEMBERSHIP_NEWBIEDAYS = '30';
    const days = await getPolicy('org_test', 'membership.newbieDays');
    expect(days).toBe(30);
  });
});
```

### 2. CI Guardrails

```yaml
# .github/workflows/policy-guardrails.yml
- name: Check SBNC constant imports
  run: |
    if grep -r "from.*sbnc-" src/app src/lib --include="*.ts" | grep -v seed; then
      echo "ERROR: Direct SBNC constant imports found in app code"
      exit 1
    fi
```

### 3. Type Coverage

All policy keys and values are fully typed. TypeScript compiler catches:
- Invalid policy key names
- Wrong value types for policy keys
- Missing org context

---

## Policy Schema Sketch

> **Note**: This is a documentation sketch. Database schema changes require separate PR with merge captain authorization.

### Tables

#### `Organization`

```
┌──────────────────────────────────────────────────────────┐
│ Organization                                             │
├──────────────────────────────────────────────────────────┤
│ id          VARCHAR(26) PK    -- ULID, e.g., org_sbnc    │
│ name        VARCHAR(255)      -- Display name            │
│ shortName   VARCHAR(50)       -- Abbreviation            │
│ timezone    VARCHAR(50)       -- IANA timezone           │
│ createdAt   TIMESTAMP                                    │
│ updatedAt   TIMESTAMP                                    │
└──────────────────────────────────────────────────────────┘
```

#### `OrgConfig`

```
┌──────────────────────────────────────────────────────────┐
│ OrgConfig                                                │
├──────────────────────────────────────────────────────────┤
│ id          VARCHAR(26) PK    -- ULID                    │
│ orgId       VARCHAR(26) FK    -- → Organization.id       │
│ key         VARCHAR(100)      -- e.g., membership.newbie │
│ value       JSONB             -- Typed value             │
│ version     INT               -- Auto-increment per key  │
│ createdAt   TIMESTAMP                                    │
│ updatedAt   TIMESTAMP                                    │
│                                                          │
│ UNIQUE (orgId, key)                                      │
└──────────────────────────────────────────────────────────┘
```

#### `OrgConfigHistory`

```
┌──────────────────────────────────────────────────────────┐
│ OrgConfigHistory                                         │
├──────────────────────────────────────────────────────────┤
│ id            VARCHAR(26) PK  -- ULID                    │
│ orgConfigId   VARCHAR(26) FK  -- → OrgConfig.id          │
│ version       INT             -- Version at change       │
│ previousValue JSONB           -- Value before change     │
│ newValue      JSONB           -- Value after change      │
│ changedBy     VARCHAR(26) FK  -- → User.id or 'system'   │
│ changedAt     TIMESTAMP                                  │
│ reason        VARCHAR(500)    -- Optional change note    │
└──────────────────────────────────────────────────────────┘
```

### Type Definitions

```typescript
// src/lib/policy/types.ts

export type PolicyKey =
  // Membership
  | 'membership.newbieDays'
  | 'membership.extendedDays'
  | 'membership.gracePeriodDays'
  // Scheduling
  | 'scheduling.timezone'
  | 'scheduling.registrationOpenDay'
  | 'scheduling.registrationOpenHour'
  | 'scheduling.eventArchiveDays'
  // Governance
  | 'governance.boardEligibilityDays'
  | 'governance.minutesApprovalRequired'
  | 'governance.termStartMonth'
  // Display
  | 'display.orgName'
  | 'display.orgShortName'
  | 'display.memberNoun'
  | 'display.membersNoun';

export type PolicyValue<K extends PolicyKey> =
  K extends 'membership.newbieDays' | 'membership.extendedDays' | 'membership.gracePeriodDays' ? number :
  K extends 'scheduling.timezone' ? string :
  K extends 'scheduling.registrationOpenDay' | 'scheduling.registrationOpenHour' | 'scheduling.eventArchiveDays' ? number :
  K extends 'governance.boardEligibilityDays' | 'governance.termStartMonth' ? number :
  K extends 'governance.minutesApprovalRequired' ? boolean :
  K extends 'display.orgName' | 'display.orgShortName' | 'display.memberNoun' | 'display.membersNoun' ? string :
  never;
```

---

## Tradeoffs and Decisions

### Decision 1: JSONB vs Typed Columns

**Chosen**: JSONB for `value` field

| Approach | Pro | Con |
|----------|-----|-----|
| Typed columns | Strong DB constraints | Schema change per new policy |
| JSONB (chosen) | Flexible, no migrations | Runtime type checking only |

**Rationale**: Policy keys evolve faster than schema. TypeScript provides type safety at compile time. JSONB avoids migration churn.

### Decision 2: Single Table vs Category Tables

**Chosen**: Single `OrgConfig` table with dotted keys

| Approach | Pro | Con |
|----------|-----|-----|
| Separate tables | Cleaner schema | More migrations, more joins |
| Single table (chosen) | Simple, extensible | Larger table, string keys |

**Rationale**: Policy keys are leaf values, not complex nested objects. Single table with dot-notation keys is simpler and performs well.

### Decision 3: Cache Strategy

**Chosen**: React `cache()` for per-request memoization

| Approach | Pro | Con |
|----------|-----|-----|
| No caching | Always fresh | DB hit per policy access |
| LRU cache | Fast reads | Stale reads, cache invalidation complexity |
| Per-request (chosen) | Fresh per request, no stale reads | Multiple requests hit DB |

**Rationale**: Policy changes are rare. Per-request caching prevents N+1 queries within a request while ensuring each new request sees latest policy.

---

## Implementation Roadmap

This document is **design only**. Implementation in child issues:

1. **Schema PR** (requires merge captain): Add Organization and OrgConfig tables
2. **Seed PR**: Populate SBNC as Tenant Zero
3. **Library PR**: Implement `getPolicy()` and types
4. **Migration PRs**: Convert hard-coded constants per category

See [#232 - Policy Isolation Epic](https://github.com/sbnctech/murmurant/issues/232) for tracking.

---

## Related Documentation

- [PLATFORM_VS_POLICY.md](./PLATFORM_VS_POLICY.md) - What is platform vs policy
- [ARCHITECTURAL_CHARTER.md](../ARCHITECTURAL_CHARTER.md) - Core principles
- [Issue #263](https://github.com/sbnctech/murmurant/issues/263) - This design
- [Issue #232](https://github.com/sbnctech/murmurant/issues/232) - Policy Isolation Epic
- [Issue #248](https://github.com/sbnctech/murmurant/issues/248) - Business Model Epic
