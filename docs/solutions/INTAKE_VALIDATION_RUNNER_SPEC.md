Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

# ClubOS Solutions - Intake Validation Runner Spec

Status: Specification
Audience: Operators, Solutions Team
Last updated: 2025-12-21

This document specifies a lightweight, repeatable method for validating
client intake documents against INTAKE_SCHEMA.json before processing.

---

## 1. Goal

Provide operators with a local command-line tool to validate
client-submitted intake.json files. Validation runs offline with
no network calls and produces deterministic, actionable output.

---

## 2. Validation Scope

The runner performs three checks:

1. **Schema Validation** - Structural conformance to INTAKE_SCHEMA.json
2. **Required Field Check** - All required fields present and non-empty
3. **Red-Flag Scan** - Business-critical conditions that require attention

---

## 3. Command Interface

### 3.1 Minimal Script (No External Dependencies)

Location: `scripts/solutions/validate_intake_schema.mjs`

```bash
# Basic usage
node scripts/solutions/validate_intake_schema.mjs path/to/intake.json

# With explicit schema path (optional)
node scripts/solutions/validate_intake_schema.mjs path/to/intake.json --schema docs/solutions/INTAKE_SCHEMA.json
```

### 3.2 Full Validation with AJV (Optional Enhancement)

If deeper schema validation is needed, install ajv:

```bash
npm install --save-dev ajv ajv-formats
```

Then run:

```bash
node --experimental-json-modules -e "
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import schema from './docs/solutions/INTAKE_SCHEMA.json' assert {type: 'json'};
import intake from './path/to/intake.json' assert {type: 'json'};
const ajv = new Ajv({allErrors: true});
addFormats(ajv);
const validate = ajv.compile(schema);
if (validate(intake)) { console.log('PASS'); process.exit(0); }
else { console.error('FAIL:', validate.errors); process.exit(1); }
"
```

---

## 4. Output Requirements

### 4.1 Exit Codes

| Code | Meaning |
|------|---------|
| 0 | PASS - All validations succeeded |
| 1 | FAIL - Schema or required field validation failed |
| 2 | WARN - Passed but red flags detected |

### 4.2 Output Format

```
INTAKE VALIDATION REPORT
========================
File: path/to/intake.json
Date: 2025-12-21T10:30:00Z

SCHEMA VALIDATION: PASS | FAIL
  [If FAIL: list of validation errors]

REQUIRED FIELDS: PASS | FAIL
  [If FAIL: list of missing required fields]

RED-FLAG SCAN: CLEAR | FLAGS DETECTED
  [If FLAGS: list of conditions detected]

RESULT: PASS | FAIL | WARN
```

### 4.3 Red-Flag Conditions

The runner scans for these business-critical conditions:

| Flag ID | Condition | Severity |
|---------|-----------|----------|
| RF-001 | No systemOwner contact defined | CRITICAL |
| RF-002 | No dataOwner contact defined | HIGH |
| RF-003 | memberExport.exportCapable is false or missing | CRITICAL |
| RF-004 | No membershipLevels defined | MEDIUM |
| RF-005 | goLiveDefinition is empty or too short | HIGH |
| RF-006 | No mustHave success criteria defined | MEDIUM |
| RF-007 | currentSystems.membershipPlatform missing | MEDIUM |
| RF-008 | identifiedRisks array is empty | LOW |

Red flags do not cause validation failure but are reported separately.
CRITICAL flags cause exit code 2 (WARN).

---

## 5. File Naming Conventions

### 5.1 Client Intake Files

Pattern: `intake-{client-slug}-{date}.json`

Examples:
- `intake-sbnc-2025-01-15.json`
- `intake-acme-club-2025-02-20.json`

### 5.2 Validation Reports

Pattern: `validation-{client-slug}-{date}.txt`

Examples:
- `validation-sbnc-2025-01-15.txt`
- `validation-acme-club-2025-02-20.txt`

---

## 6. Storage Locations

### 6.1 In-Repo (Documentation Only)

Client intake bundles are NOT stored in the main repo.
Only the schema and examples are stored:

```
docs/solutions/
  INTAKE_SCHEMA.json          # Canonical schema
  INTAKE_SCHEMA_GUIDE.md      # Field documentation
  examples/
    intake-example.json       # Minimal valid example
    intake-full-example.json  # Complete example with all fields
```

### 6.2 Per-Client Archives (External)

Client intake bundles are stored externally:

```
{archive-root}/
  clients/
    {client-slug}/
      intake/
        intake-{client-slug}-{date}.json
        validation-{client-slug}-{date}.txt
      exports/
        members-{date}.csv
        events-{date}.csv
      deliverables/
        bundle-{date}.zip
```

Archive location is operator-defined and must be:
- Access-controlled
- Backed up
- Retained per data retention policy

---

## 7. Usage Examples

### 7.1 Validate New Intake

```bash
# Run validation
node scripts/solutions/validate_intake_schema.mjs \
  ~/clients/acme-club/intake/intake-acme-club-2025-01-15.json

# Expected output on success:
# INTAKE VALIDATION REPORT
# ========================
# File: intake-acme-club-2025-01-15.json
# Date: 2025-01-15T14:30:00Z
#
# SCHEMA VALIDATION: PASS
# REQUIRED FIELDS: PASS
# RED-FLAG SCAN: CLEAR
#
# RESULT: PASS
```

### 7.2 Handle Validation Failure

```bash
# Run validation on incomplete file
node scripts/solutions/validate_intake_schema.mjs \
  ~/clients/acme-club/intake/intake-acme-club-draft.json

# Expected output on failure:
# INTAKE VALIDATION REPORT
# ========================
# File: intake-acme-club-draft.json
# Date: 2025-01-15T14:30:00Z
#
# SCHEMA VALIDATION: FAIL
#   - Missing required field: contacts.systemOwner
#   - Missing required field: dataSources.memberExport
#
# REQUIRED FIELDS: FAIL
#   - org.name: missing
#   - successCriteria.goLiveDefinition: missing
#
# RED-FLAG SCAN: FLAGS DETECTED
#   - RF-001 [CRITICAL]: No systemOwner contact defined
#   - RF-003 [CRITICAL]: memberExport not defined
#
# RESULT: FAIL
```

### 7.3 Save Report to File

```bash
node scripts/solutions/validate_intake_schema.mjs \
  ~/clients/acme-club/intake/intake-acme-club-2025-01-15.json \
  > ~/clients/acme-club/intake/validation-acme-club-2025-01-15.txt
```

---

## 8. Integration with Intake Bundle

Validation is a prerequisite for bundle compilation:

1. Operator receives client intake.json
2. Operator runs validation script
3. If FAIL: Return to client with error list
4. If WARN: Document red flags in bundle
5. If PASS: Proceed to bundle compilation

See [INTAKE_DELIVERABLE_BUNDLE.md](./INTAKE_DELIVERABLE_BUNDLE.md) for bundle process.

---

## 9. Constraints

- ASCII-only output
- No network calls
- No secrets or credentials required
- Deterministic output (same input = same output)
- Minimal dependencies (Node.js standard library preferred)

---

## See Also

- [Intake Schema](./INTAKE_SCHEMA.json) - Validation schema
- [Intake Schema Guide](./INTAKE_SCHEMA_GUIDE.md) - Field documentation
- [Intake Deliverable Bundle](./INTAKE_DELIVERABLE_BUNDLE.md) - Bundle process
- [Readiness Assessment](./READINESS_ASSESSMENT.md) - Pre-intake checklist
