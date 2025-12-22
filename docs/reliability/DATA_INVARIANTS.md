# ClubOS — Data Invariants

Status: Canonical Specification  
Applies to: All environments  
Last updated: 2025-12-20

This document defines the non-negotiable data invariants of ClubOS.
Any violation of these invariants constitutes data corruption.

This document is normative.

---

## 1. Core Principle

ClubOS is a system of record.

If data integrity is in doubt:
- Writes MUST stop
- Humans MUST intervene
- Safety overrides availability

---

## 2. Member Invariants

### 2.1 Identity
- Every member MUST have a stable, unique identifier.
- Identifiers MUST NOT be reused.
- Deleted members MUST NOT be silently recreated.

### 2.2 Status
- A member MUST have exactly one status at any time.
- Illegal combinations (e.g., ACTIVE + EXPIRED) are forbidden.
- Status transitions MUST follow defined state paths.

### 2.3 Roles and Permissions
- Roles MUST NOT grant permissions outside their authority class.
- A member MUST NOT escalate privileges without an auditable action.
- Permission evaluation MUST be deterministic.

---

## 3. Content Invariants (Pages, Blocks)

### 3.1 Pages
- A page MUST have exactly one authoritative version.
- Published content MUST be immutable unless explicitly revised.
- A page MUST NOT be visible to an audience it was not approved for.

### 3.2 Blocks
- Blocks MUST belong to exactly one page.
- Block order MUST be explicit and deterministic.
- Blocks MUST NOT render outside their visibility constraints.

---

## 4. Events and Registrations

- An event MUST NOT accept registrations if capacity rules are violated.
- A registration MUST reference a valid member and event.
- Duplicate registrations are forbidden.

---

## 5. Financial and Entitlement Invariants

- Financial records MUST be append-only.
- No operation may retroactively alter financial history.
- Entitlements MUST be traceable to a granting action.

---

## 6. Referential Integrity

- Orphaned records are forbidden.
- Deletions MUST either cascade safely or be blocked.
- Soft deletion MUST preserve auditability.

---

## 7. Time and Ordering

- Timestamps MUST be monotonic per record.
- CreatedAt MUST NOT be after UpdatedAt.
- Historical records MUST NOT be reordered.

---

## 8. Failure Handling

If any invariant cannot be guaranteed:
- The operation MUST fail
- The system MUST log the violation
- The incident MUST be reviewable

---

## 9. Explicit Non-Guarantees

ClubOS does NOT guarantee:
- Automatic repair of corrupted data
- Best-effort recovery that violates invariants
- Silent correction of inconsistent states

---

## 10. Enforcement

- Any code that can violate an invariant MUST NOT merge.
- All migrations MUST preserve invariants.
- Invariant violations are SEV-1 incidents.

This document supersedes informal assumptions.
