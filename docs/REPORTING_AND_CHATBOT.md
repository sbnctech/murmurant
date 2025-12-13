# Reporting and Chatbot Queries

**Purpose**: Specify requirements for ClubOS reporting capabilities and chatbot query interface
**Audience**: Tech Chair, Board, Development Team
**Status**: Specification (no implementation)

---

## Problem Statement

Cross-table reporting is essential for club operations. Meaningful questions require
joins across multiple domains: members, events, registrations, payments, committees.

Legacy system pain points:
- Ad hoc data access is difficult
- Meaningful questions require complex joins
- Data security and access rights are not systematically enforced
- No audit trail for who queried what data

ClubOS must provide first-class reporting capabilities that are safe, auditable, and
accessible to authorized users without requiring technical skills.

---

## Architecture Requirements

### Reporting as First-Class Capability

Reporting is not a bolt-on feature. ClubOS must:
- Support cross-domain questions (members, events, registrations, payments, committees)
- Provide a vetted question library (saved queries)
- Support controlled ad hoc queries for authorized roles
- Enforce security at the data layer, not only in UI

### Data Separation

Chatbot queries must NOT run against the operational write path.

Required architecture:
- Reporting views: semantic models that present safe, pre-joined concepts
- Read replicas or materialized views for query workload isolation
- Query interface reads only from reporting layer, never from transactional tables directly

### Reporting Layer Components

```
+------------------+     +-------------------+     +------------------+
| Operational DB   | --> | Reporting Views   | --> | Query Interface  |
| (write path)     |     | (read-only)       |     | (chatbot/UI)     |
+------------------+     +-------------------+     +------------------+
                               |
                               v
                         +-------------------+
                         | Policy Enforcement|
                         | (RLS or Gateway)  |
                         +-------------------+
```

---

## Security Model

### Core Principle

Access rights must be enforced at the data layer, not only in UI. A user who bypasses
the UI (via API or direct DB access) must still be constrained by their roles/scopes.

### Long-Term Target (choose one during implementation)

Option 1: Postgres Row Level Security (RLS)
- Define RLS policies on reporting views
- Policies filter rows based on user context (role, committee, etc.)
- Enforced by database engine

Option 2: Query Policy Gateway
- Application-layer service that intercepts queries
- Enforces row filters and column allow-lists
- Validates query against user capabilities before execution

### Required Controls

**Role/Capability Mapping to Reporting Scopes**
- president: full read access to aggregates and details
- vp_activities: events, registrations, attendance, committee performance
- vp_membership: member lifecycle, engagement, demographics
- finance: financial summaries (aggregates only unless treasurer role)
- tech_audit: full read access including audit logs

**Sensitive Field Classification**
- PII: email, phone, address, emergency contact
- Financial: payment amounts, refund details, invoice balances
- Admin-only: audit logs, role assignments, system configuration

**Default Behavior**
- Ad hoc queries return aggregates/metrics only by default
- Detail-level data (individual records) requires explicit capability
- Aggregate thresholds: if result set < N rows, suppress to prevent inference attacks

**Partnership Delegation**
- On-behalf visibility: only with bilateral consent
- Partner A cannot query Partner B's data unless both have active partnership with
  appropriate delegation mode

**Agreement Gates**
- Agreement gates (waivers, policies) do NOT grant extra data access
- They only gate actions (registration, payment, etc.)
- Do not conflate agreement acceptance with reporting permissions

---

## Audit Logging Requirements

### Every Query Must Log

For each chatbot query (saved or ad hoc):
- user_id: who ran the query
- roles: user's roles at query time
- capabilities: user's capabilities at query time
- scopes_evaluated: which scopes were checked
- question_id: saved question ID or "ad_hoc"
- parameters: query parameters (date range, committee, etc.)
- timestamp: when query was executed
- row_count: number of rows returned
- sensitive_fields_included: boolean (did query touch PII/financial fields?)
- query_hash: hash of the actual query for debugging

### Admin Audit View

Requirement (spec only):
- Tech VP and President must have access to query audit log
- Filter by user, date range, question type, sensitivity level
- Export capability for compliance review
- Alert threshold: notify if user runs > N queries/hour with sensitive data

---

## Saved Query Library

### Concept

Saved queries are pretested, approved questions stored as reusable definitions.

Benefits:
- Known-good queries that have been validated
- Consistent results across users
- Clear documentation of what each query returns
- Explicit security classification

### Saved Query Record Structure

```
saved_query:
  question_id: string (unique identifier)
  natural_language_prompt: string (what user sees)
  category: string (President, VP Activities, etc.)
  parameter_schema:
    - name: date_range
      type: date_range
      required: true
    - name: committee
      type: committee_id
      required: false
  output_shape:
    columns: [member_name, event_count, last_attendance]
    row_type: member_summary
  required_scopes: [vp_activities, president]
  sensitivity: low | medium | high
  pii_included: boolean
  financial_included: boolean
```

### Initial Library

See docs/reporting/CHATBOT_QUERY_LIBRARY.md for the initial library of 65+ saved questions
organized by category and role.

---

## Ad Hoc Query Support

### Who Can Use Ad Hoc Queries

- president: yes, with logging
- vp_activities: yes, limited to activities scope
- vp_membership: yes, limited to membership scope
- finance: no (saved queries only)
- tech_audit: yes, full scope with logging
- member: no

### Constraints

**Prefer Structured Intent**
- Prefer intent-to-query-builder over LLM-to-SQL
- User expresses intent ("show me members who..."), system builds safe query
- This approach is more controllable than raw SQL generation

**If SQL Generation Is Later Allowed**
- Must be constrained to approved reporting views only
- Must pass policy checker before execution
- Must log full query text
- Must enforce column allow-lists (no SELECT *)
- Must enforce row limits

**Rate Limits**
- Max queries per user per hour: configurable (default 100)
- Max queries with sensitive data per user per day: configurable (default 20)
- Exceed limits: query blocked, alert sent to Tech VP

---

## Roadmap and Migration Path

### Phase 1: Foundation

- Saved query library only (no ad hoc)
- Reporting views defined for core domains
- Full audit logging operational
- Basic chatbot UI with saved question selection
- Role-to-scope mapping enforced

### Phase 2: Controlled Ad Hoc

- Constrained ad hoc queries (aggregates only)
- Stronger policy enforcement (RLS or gateway)
- Sensitive field masking for non-privileged users
- Rate limiting active

### Phase 3: Advanced Features

- Richer narrative answers (not just tables)
- Scheduled reports (email delivery)
- Expanded query library based on usage patterns
- Dashboard integration
- Cross-time-period comparisons

---

## Migration from Legacy Chatbot

The legacy system uses WA export to SQLite with ~100 pretested questions.

Migration approach:
1. Map legacy questions to saved query definitions
2. Validate output parity between legacy and ClubOS queries
3. Run parallel during transition period
4. Sunset legacy when ClubOS reporting is stable

---

## Related Documents

- docs/reporting/CHATBOT_QUERY_LIBRARY.md - Initial saved question library
- docs/rbac/AUTH_AND_RBAC.md - Role definitions and capabilities
- SYSTEM_SPEC.md - System requirements including reporting section

---

*Document maintained by ClubOS development team. Last updated: December 2024*
