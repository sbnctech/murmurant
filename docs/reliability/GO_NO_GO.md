# GO / NO-GO Approval for Stable Promotion
Copyright (c) Santa Barbara Newcomers Club

## Purpose

This document defines the decision process for promoting a release candidate to stable. It ensures that non-expert operators can make informed go/no-go decisions using objective criteria.

**When to use this document:**
- Before deploying any release candidate to production
- Before promoting from `candidate` channel to `stable` channel
- When evaluating readiness after a migration or significant change

---

## Decision Owner(s)

| Role | Responsibility | Authority |
|------|----------------|-----------|
| **Release Lead** | Runs the checklist, documents findings | GO/NO-GO recommendation |
| **Technical Reviewer** | Validates test results, reviews logs | Veto on technical items |
| **Operations Owner** | Confirms rollback readiness, availability | Veto on operational items |

For single-operator deployments: one person may fill all roles but must explicitly document each checkpoint.

---

## Must-Pass Checklist

All items must be GREEN for a GO decision. Any RED is an automatic NO-GO.

### 1. Full Green Suite Passes

```bash
npm run green
```

**Checks included:**
- TypeScript compilation (`npm run typecheck`)
- Linting (`npm run lint`)
- Unit tests (`npm run test:unit`)
- Database seed (`npm run db:seed`)
- Admin E2E stable tests (`npm run test-admin:stable`)
- API E2E stable tests (`npm run test-api:stable`)

**Evidence required:** Terminal output or CI log showing all steps passed.

| Status | Checked by | Date |
|--------|------------|------|
| [ ] GREEN / [ ] RED | _______________ | __________ |

---

### 2. No Unreviewed Schema Migrations

```bash
npm run prisma:check-migrations
```

**Requirements:**
- All migrations have been reviewed for backward compatibility
- Rollback migration exists (if applicable)
- No pending migrations in `prisma/migrations/` that haven't been applied

**Evidence required:** Migration review notes or "no migrations" confirmation.

| Status | Checked by | Date |
|--------|------------|------|
| [ ] GREEN / [ ] RED / [ ] N/A (no migrations) | _______________ | __________ |

---

### 3. Audit Log Coverage Verified

**Requirements:**
- All privileged actions produce audit entries (per P1 of Architectural Charter)
- Spot-check: perform 3 privileged actions in staging and verify log entries exist

**Spot-check actions:**
1. Create/publish a page
2. Update a member status
3. Modify an event

**Evidence required:** Screenshot or log excerpt showing audit entries.

| Status | Checked by | Date |
|--------|------------|------|
| [ ] GREEN / [ ] RED | _______________ | __________ |

---

### 4. Rollback Procedure Documented and Tested

**Requirements:**
- Rollback steps documented in this decision memo (see Rollback Readiness below)
- Previous known-good version identified
- Rollback has been tested in staging within the last 30 days OR this cycle

**Evidence required:** Link to rollback documentation and test date.

| Status | Checked by | Date |
|--------|------------|------|
| [ ] GREEN / [ ] RED | _______________ | __________ |

---

### 5. No Blocking Issues Open

**Requirements:**
- No open issues tagged `P0` or `blocker` for this release
- All known issues are either resolved or explicitly accepted with documented risk

```bash
gh issue list --label "P0" --state open
gh issue list --label "blocker" --state open
```

**Evidence required:** Issue list output showing no blockers, or explicit acceptance notes.

| Status | Checked by | Date |
|--------|------------|------|
| [ ] GREEN / [ ] RED (accepted: ___________) | _______________ | __________ |

---

## Rollback Readiness

### Previous Known-Good Version

| Field | Value |
|-------|-------|
| Version/Tag | __________________________ |
| Git SHA | __________________________ |
| Deployed Date | __________________________ |
| Verification | [ ] Confirmed working in production |

### Rollback Steps

1. **Identify the issue** - Confirm the symptom requires rollback vs. hotfix
2. **Notify stakeholders** - Alert via established channel (Slack/email)
3. **Execute rollback:**
   ```bash
   # Pull the previous known-good version
   git checkout <known-good-tag>

   # Rebuild and deploy
   npm install
   npm run build
   # Deploy using established process
   ```
4. **Verify rollback** - Confirm core functionality works
5. **Post-mortem** - Document what failed and why

### Database Rollback (if applicable)

| Field | Value |
|-------|-------|
| Rollback migration exists? | [ ] Yes / [ ] No / [ ] N/A |
| Data loss risk? | [ ] None / [ ] Acceptable / [ ] Requires review |
| Rollback tested? | [ ] Yes, on __________ / [ ] No |

---

## Sign-Off Section

### GO Decision

| Role | Name | Decision | Date | Notes |
|------|------|----------|------|-------|
| Release Lead | | [ ] GO / [ ] NO-GO | | |
| Technical Reviewer | | [ ] GO / [ ] NO-GO | | |
| Operations Owner | | [ ] GO / [ ] NO-GO | | |

### Final Decision

| Field | Value |
|-------|-------|
| **Decision** | [ ] **GO** / [ ] **NO-GO** |
| **Decided by** | __________________________ |
| **Decision date** | __________________________ |
| **Release version** | __________________________ |
| **Target deploy date** | __________________________ |

### Links

| Document | Link |
|----------|------|
| This decision memo (filled) | |
| PR for this release | |
| CI run | |
| Staging verification | |
| Rollback test evidence | |

---

## Decision History

| Date | Version | Decision | Notes |
|------|---------|----------|-------|
| | | | |

---

## References

- [Release Checklist](../release/RELEASE_CHECKLIST.md) - Standard release process
- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) - Non-negotiable principles
