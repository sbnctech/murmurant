# Checklist Coverage Audit

Copyright (c) Santa Barbara Newcomers Club

Status: Operational
Last updated: 2025-12-21

---

## Purpose

The Checklist Coverage Audit provides visibility into how much of the
multi-tenant release checklist is enforced by CI automation versus
requiring manual verification.

---

## Quick Start

Run the audit locally:

```bash
npx tsx scripts/ci/checklist-coverage-audit.ts
```

---

## CI Integration

The audit runs as part of the charter workflow. It **fails CI only** when
must-have items are not enforced. Other items are reported but do not block.

---

## Registry File

The registry is located at: `scripts/ci/checklist-registry.json`

### Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (e.g., "DATA-001") |
| `section` | string | Yes | Section from source document |
| `description` | string | Yes | What the item requires |
| `enforcement` | enum | Yes | "enforced", "partial", or "manual" |
| `mustHave` | boolean | Yes | If true, blocks CI when not enforced |
| `notes` | string | Yes | Current status or gap explanation |
| `enforcedBy` | string | No | Path to enforcement mechanism |

---

## Updating the Registry

1. Edit `scripts/ci/checklist-registry.json`
2. Run the audit locally to verify
3. Update `lastUpdated` field

---

## Must-Have Items

Current must-have items (5):

- BUILD-001: Charter files exist
- BUILD-002: Destructive migrations require approval
- BUILD-003: Prisma schema validates
- BUILD-004: TypeScript compiles
- BUILD-005: Build succeeds

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All must-have items are enforced |
| 1 | One or more must-have items are not enforced |
| 2 | Script error |

---

*This document is operational guidance for the checklist coverage audit system.*
