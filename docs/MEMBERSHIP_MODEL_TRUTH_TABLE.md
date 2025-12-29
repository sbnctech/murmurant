# Membership Model Truth Table

**Purpose:** Define the canonical mapping between Wild Apricot (WA) membership concepts and Murmurant models.

---

## 1. Two Orthogonal Dimensions

Murmurant models membership using **two independent fields** on the Member entity:

| Field | Purpose | Source |
|-------|---------|--------|
| `membershipStatusId` | Lifecycle state (active, lapsed, etc.) | WA Contact.Status |
| `membershipTierId` | Benefit tier (member type) | WA Contact.MembershipLevel |

These are **orthogonal** - any status can combine with any tier:

- An "Active + Extended Member" is a current extended member
- A "Lapsed + Extended Member" was an extended member who didn't renew
- An "Active + Newbie Member" is a new member in their first year

---

## 2. MembershipStatus (Lifecycle State)

### Schema Definition

```prisma
model MembershipStatus {
  id                   String   @id @default(uuid())
  code                 String   @unique  // Stable key for code references
  label                String              // Human-readable display name
  description          String?
  isActive             Boolean  @default(true)   // Can they log in?
  isEligibleForRenewal Boolean  @default(false)  // Show renewal prompts?
  isBoardEligible      Boolean  @default(false)  // Can serve on board?
  sortOrder            Int      @default(0)
}
```

### Truth Table: WA Status to Murmurant Status

| WA Contact.Status | Murmurant code | isActive | isEligibleForRenewal | isBoardEligible |
|-------------------|-------------|----------|----------------------|-----------------|
| Active | `active` | true | true | true |
| Lapsed | `lapsed` | false | true | false |
| PendingNew | `pending_new` | false | false | false |
| PendingRenewal | `pending_renewal` | true | true | false |
| Suspended | `suspended` | false | false | false |
| (Any other) | `not_a_member` | false | false | false |
| (null/unknown) | `unknown` | false | false | false |

### Importer Mapping Code

From `src/lib/importing/wildapricot/transformers.ts`:

```typescript
export function mapContactStatusToCode(waStatus: string | null | undefined): string {
  switch (waStatus) {
    case "Active": return "active";
    case "Lapsed": return "lapsed";
    case "PendingNew": return "pending_new";
    case "PendingRenewal": return "pending_renewal";
    case "Suspended": return "suspended";
    default: return waStatus ? "not_a_member" : "unknown";
  }
}
```

---

## 3. MembershipTier (Benefit Level)

### Schema Definition

```prisma
model MembershipTier {
  id        String   @id @default(uuid())
  code      String   @unique  // Stable key: unknown, extended_member, newbie_member, member
  name      String            // Human-readable: "Unknown", "Extended Member", etc.
  sortOrder Int      @default(0)
}
```

### Truth Table: WA MembershipLevel to Murmurant Tier

| WA MembershipLevel | Murmurant tier code | Murmurant tier name | Confidence |
|--------------------|------------------|------------------|------------|
| ExtendedNewcomer | `extended_member` | Extended Member | exact |
| NewcomerMember | `member` | Member | exact |
| Newbie | `newbie_member` | Newbie Member | exact |
| Admins | `unknown` | Unknown | **unmapped** |
| (null) | `unknown` | Unknown | missing |
| (any other) | `unknown` | Unknown | unmapped |

### Current Distribution (Post-Sync)

| WA Raw Value | Count | Murmurant Tier |
|--------------|-------|-------------|
| ExtendedNewcomer | 61 | extended_member |
| Admins | 26 | unknown (unmapped) |
| (null) | 7 | unknown (missing) |
| NewcomerMember | 2 | member |

### Importer Mapping Code

From `src/lib/importing/wildapricot/transformers.ts`:

```typescript
const TIER_MAP: Record<string, string> = {
  ExtendedNewcomer: "extended_member",
  NewcomerMember: "member",
  Newbie: "newbie_member",
};

export function resolveMembershipTier(contact: WAContact): {
  tierCode: string;
  rawValue: string | null;
  confidence: "exact" | "unmapped" | "missing";
} {
  const rawValue = contact.MembershipLevel?.Name ?? null;

  if (!rawValue) {
    return { tierCode: "unknown", rawValue, confidence: "missing" };
  }

  const mapped = TIER_MAP[rawValue];
  if (mapped) {
    return { tierCode: mapped, rawValue, confidence: "exact" };
  }

  return { tierCode: "unknown", rawValue, confidence: "unmapped" };
}
```

---

## 4. Member Entity Fields

### Key Membership Fields

```prisma
model Member {
  id                    String   @id @default(uuid())
  firstName             String
  lastName              String
  email                 String   @unique
  phone                 String?
  joinedAt              DateTime

  // Membership dimension 1: Lifecycle state
  membershipStatusId    String   @db.Uuid
  membershipStatus      MembershipStatus @relation(...)

  // Membership dimension 2: Benefit tier
  membershipTierId      String?  @db.Uuid  // Nullable for unknown tier
  membershipTier        MembershipTier? @relation(...)

  // Traceability: raw WA value for debugging
  waMembershipLevelRaw  String?
}
```

### Field Semantics

| Field | Purpose | Nullable | Default |
|-------|---------|----------|---------|
| `membershipStatusId` | FK to MembershipStatus | No | Must be set |
| `membershipTierId` | FK to MembershipTier | Yes | null (maps to "unknown") |
| `waMembershipLevelRaw` | Original WA value | Yes | Preserves WA data |

---

## 5. Required Seed Data

### MembershipStatus (7 codes)

These must exist before WA import:

```sql
INSERT INTO "MembershipStatus" (id, code, label, "isActive", "isEligibleForRenewal", "isBoardEligible", "sortOrder") VALUES
  (gen_random_uuid(), 'active', 'Active', true, true, true, 1),
  (gen_random_uuid(), 'pending_new', 'Pending New', false, false, false, 2),
  (gen_random_uuid(), 'pending_renewal', 'Pending Renewal', true, true, false, 3),
  (gen_random_uuid(), 'lapsed', 'Lapsed', false, true, false, 4),
  (gen_random_uuid(), 'suspended', 'Suspended', false, false, false, 5),
  (gen_random_uuid(), 'not_a_member', 'Not a Member', false, false, false, 6),
  (gen_random_uuid(), 'unknown', 'Unknown', false, false, false, 99);
```

### MembershipTier (4 codes)

```sql
INSERT INTO "MembershipTier" (id, code, name, "sortOrder") VALUES
  (gen_random_uuid(), 'member', 'Member', 1),
  (gen_random_uuid(), 'newbie_member', 'Newbie Member', 2),
  (gen_random_uuid(), 'extended_member', 'Extended Member', 3),
  (gen_random_uuid(), 'unknown', 'Unknown', 99);
```

---

## 6. Common Queries

### Members by Status

```sql
SELECT ms.label, COUNT(m.id)
FROM "Member" m
JOIN "MembershipStatus" ms ON m."membershipStatusId" = ms.id
GROUP BY ms.label
ORDER BY ms."sortOrder";
```

### Active Members by Tier

```sql
SELECT mt.name, COUNT(m.id)
FROM "Member" m
JOIN "MembershipStatus" ms ON m."membershipStatusId" = ms.id
LEFT JOIN "MembershipTier" mt ON m."membershipTierId" = mt.id
WHERE ms.code = 'active'
GROUP BY mt.name;
```

### Members with Unmapped WA Tier

```sql
SELECT m."waMembershipLevelRaw", COUNT(*)
FROM "Member" m
JOIN "MembershipTier" mt ON m."membershipTierId" = mt.id
WHERE mt.code = 'unknown'
GROUP BY m."waMembershipLevelRaw";
```

---

## 7. Design Rationale

### Why Two Separate Dimensions?

1. **Status is transient:** Members move through lifecycle states (pending -> active -> lapsed)
2. **Tier is relatively stable:** Once you're an "Extended Member," that tier persists across renewals
3. **Independent logic:** Renewal eligibility depends on status; event pricing may depend on tier

### Why Store Raw WA Value?

The `waMembershipLevelRaw` field preserves the original WA data for:

1. **Debugging:** Trace mapping issues back to source
2. **Future remapping:** If WA adds new tiers, we can remap without re-syncing
3. **Auditing:** Prove what WA sent us at sync time

### Why is Tier Nullable?

Some members genuinely have no tier (null in WA). Rather than forcing everything to "unknown" in the FK, we:

1. Allow null FK (semantically correct - no tier assigned)
2. Use `membershipTierId IS NULL` in queries for "untiered" members
3. Join with `LEFT JOIN` to include null-tier members in reports

---

*Document maintained by Murmurant development team. Last updated: December 2024*
