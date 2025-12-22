# Multi-Tenant Release Readiness Checklist

Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

Status: Operational Checklist
Applies to: Multi-tenancy launch and new tenant onboarding
Last updated: 2025-12-21

---

## Purpose

This checklist ensures that ClubOS multi-tenancy is safe to ship and that
each new tenant is onboarded with full isolation and operational readiness.

Use this checklist:
- Before enabling multi-tenancy in production
- Before onboarding each new tenant
- As part of Go/No-Go decision for tenant launches

All items must be checked or have explicit risk acceptance before proceeding.

---

## Hard Stops (Non-Negotiable)

The following conditions CANNOT be accepted as risks. If any are true,
the release or onboarding MUST NOT proceed.

- [ ] Unknown ownership of authoritative tenant data
- [ ] Unknown restore path for tenant data
- [ ] Silent writes when tenant isolation may be violated
- [ ] Unauthorized cross-tenant access without containment plan
- [ ] Inability to stop writes or publishing for a specific tenant
- [ ] No audit trail for privileged actions
- [ ] No mechanism to identify which tenant an action belongs to

If any hard stop is unresolved, STOP HERE.

---

## 1. Tenant Isolation and Access Control

### Application Layer

- [ ] All database queries include tenant context (middleware verified)
- [ ] Prisma middleware auto-injects tenant_id on reads
- [ ] Prisma middleware auto-sets tenant_id on creates
- [ ] Cross-tenant queries are blocked at application level
- [ ] API routes extract and validate tenant from session
- [ ] Background jobs propagate tenant context correctly

### Database Layer

- [ ] Row-Level Security (RLS) is enabled on all tenant-scoped tables
- [ ] RLS policies verified to block cross-tenant access
- [ ] Session variable (app.current_tenant) set on every connection
- [ ] Platform bypass mechanism exists and is audited
- [ ] RLS cannot be circumvented without explicit bypass flag

### Authentication

- [ ] Session tokens include tenant claim
- [ ] Login flow correctly identifies tenant (subdomain/path/custom domain)
- [ ] Users cannot switch tenants without re-authentication
- [ ] Passkey credentials are tenant-scoped

### Authorization

- [ ] Tenant Admin role exists and is scoped to single tenant
- [ ] Platform Admin role exists with cross-tenant access (audited)
- [ ] All existing RBAC rules apply within tenant scope
- [ ] No role grants access beyond tenant boundary without platform role

---

## 2. Data Ownership and Authoritative Sources

- [ ] Each table is classified as tenant-scoped or global
- [ ] TENANT_SCOPED_TABLES.md reference document exists
- [ ] tenant_id column exists on all tenant-scoped tables
- [ ] tenant_id column is NOT NULL (after migration)
- [ ] Foreign keys respect tenant boundaries (no cross-tenant references)
- [ ] Tenant entity owns all tenant-scoped data (Prisma relations)

### Data Classification

- [ ] Member data is tenant-scoped
- [ ] Event data is tenant-scoped
- [ ] Financial records are tenant-scoped
- [ ] Audit logs include tenant attribution
- [ ] User accounts may span tenants (documented behavior)

---

## 3. Backup and Restore

### Backup Procedures

- [ ] Backup procedure documents tenant-aware restore
- [ ] Point-in-time recovery is available per-tenant
- [ ] Backup retention policy documented
- [ ] Backup verification runs regularly

### Restore Testing

- [ ] Single-tenant restore has been tested (not just documented)
- [ ] Restore does not affect other tenants
- [ ] Restore procedure is documented in runbook
- [ ] Restore verification checks data integrity
- [ ] Restore verification checks tenant isolation post-restore

### Disaster Recovery

- [ ] DR plan includes tenant-specific scenarios
- [ ] Cross-region restore path exists (if applicable)
- [ ] RTO/RPO targets defined per tenant tier

---

## 4. Migration Safety

### Expand/Contract Pattern

- [ ] Schema migrations follow expand/contract pattern
- [ ] No migrations require downtime for all tenants
- [ ] Migrations can be applied incrementally
- [ ] Rollback migrations exist for all schema changes

### Migration Rehearsal

- [ ] Migration rehearsed on production-like environment
- [ ] Migration timing documented (expected duration)
- [ ] Migration does not lock tables for extended periods
- [ ] Migration preserves tenant isolation throughout

### Data Migration (New Tenants)

- [ ] Tenant data import procedure documented
- [ ] Import validation checks for data integrity
- [ ] Import cannot overwrite other tenant data
- [ ] Failed import does not leave partial state

---

## 5. Observability

### Audit Logs

- [ ] Audit log includes tenant_id on all entries
- [ ] Audit log is immutable
- [ ] Audit log retention meets compliance requirements
- [ ] Audit log is queryable by tenant (for tenant admins)
- [ ] Platform team can query across tenants (for support)

### Logging

- [ ] Application logs include tenant context
- [ ] Log aggregation supports tenant filtering
- [ ] Log retention policy documented
- [ ] Sensitive data is redacted from logs

### Metrics and Alerting

- [ ] Metrics include tenant dimension
- [ ] Per-tenant dashboards available
- [ ] Alerts can fire per-tenant or platform-wide
- [ ] Tenant health indicators defined
- [ ] Alerting thresholds documented

### Tenant Health Dashboard

- [ ] Active users per tenant visible
- [ ] Error rates per tenant visible
- [ ] API latency per tenant visible
- [ ] Storage usage per tenant visible (if applicable)

---

## 6. Kill Switches and Emergency Controls

### Stop Writes

- [ ] Per-tenant write freeze is possible
- [ ] Write freeze does not affect other tenants
- [ ] Write freeze preserves read access
- [ ] Write freeze is audited
- [ ] Write freeze can be enabled without deployment

### Stop Publishing

- [ ] Per-tenant publishing freeze is possible
- [ ] Publishing freeze does not affect other tenants
- [ ] Publishing freeze preserves draft editing
- [ ] Publishing freeze is audited

### Feature Flags

- [ ] Feature flags support per-tenant targeting
- [ ] New features can be rolled out per-tenant
- [ ] Feature flag changes are audited
- [ ] Feature flags can be changed without deployment

### Emergency Shutdown

- [ ] Single tenant can be fully disabled
- [ ] Disabled tenant sees maintenance message
- [ ] Disabled tenant data remains intact
- [ ] Re-enabling tenant restores full access

---

## 7. Support Readiness

### Runbooks

- [ ] Tenant provisioning runbook exists
- [ ] Tenant data export runbook exists
- [ ] Tenant restore runbook exists
- [ ] Tenant disable/enable runbook exists
- [ ] Cross-tenant debugging runbook exists

### Escalation

- [ ] Tenant-specific escalation path defined
- [ ] Platform-level escalation path defined
- [ ] On-call rotation includes multi-tenant expertise
- [ ] Escalation contacts documented and current

### Incident Communications

- [ ] Per-tenant incident notification possible
- [ ] Platform-wide incident notification possible
- [ ] Status page supports per-tenant status (if applicable)
- [ ] Incident response template includes tenant context

### Support Tooling

- [ ] Support team can view tenant data (audited)
- [ ] Support team cannot modify tenant data without elevation
- [ ] Support queries are logged with reason
- [ ] Tenant admin can see support access log

---

## 8. Field Test Plan

### Pilot Cohort

- [ ] Pilot tenant(s) identified
- [ ] Pilot tenant has agreed to participate
- [ ] Pilot tenant understands risk profile
- [ ] Pilot duration defined (minimum 2 weeks recommended)

### Success Criteria

- [ ] Zero cross-tenant data leaks
- [ ] Zero unauthorized access incidents
- [ ] All tenant operations complete successfully
- [ ] Performance within acceptable bounds
- [ ] No SEV-1 or SEV-2 incidents during pilot

### Monitoring During Pilot

- [ ] Daily review of audit logs scheduled
- [ ] Daily review of error rates scheduled
- [ ] Tenant feedback collection mechanism in place
- [ ] Escalation path for pilot issues defined

### Rollback Triggers

Pilot is considered failed and rollback required if:

- [ ] Any cross-tenant data exposure detected
- [ ] Any unauthorized access to tenant data
- [ ] SEV-1 incident related to multi-tenancy
- [ ] Tenant requests withdrawal from pilot
- [ ] Platform stability degraded below baseline

### Rollback Plan

- [ ] Rollback procedure documented
- [ ] Rollback tested in staging
- [ ] Rollback preserves all tenant data
- [ ] Rollback notification plan defined

---

## 9. Risk Acceptance Entries

All known gaps must be documented in READINESS_GAPS_AND_RISK_ACCEPTANCE.md.

### Required Documentation

For each accepted risk:
- [ ] Gap / Missing Capability documented
- [ ] Impacted Guarantees documented
- [ ] Risk Introduced documented
- [ ] Rationale for acceptance documented
- [ ] Accepting Authority named
- [ ] Review Date / Exit Condition defined

### Multi-Tenancy Specific Risks

Document any of the following if applicable:

- [ ] Backup isolation limitations accepted
- [ ] Performance isolation limitations accepted
- [ ] Per-tenant restore limitations accepted
- [ ] Feature flag granularity limitations accepted
- [ ] Observability gaps accepted

### Link to Risk Register

- [ ] Risk acceptance entries added to READINESS_GAPS_AND_RISK_ACCEPTANCE.md
- [ ] Risk entries reviewed by appropriate authority
- [ ] No expired risk acceptances in scope

---

## Required Sign-Offs

### For Multi-Tenancy Launch

| Role | Name | Date | Signature |
|------|------|------|-----------|
| System Owner | _________________ | __________ | __________ |
| Security Owner | _________________ | __________ | __________ |
| Backup/Recovery Owner | _________________ | __________ | __________ |

### For New Tenant Onboarding

| Role | Name | Date | Signature |
|------|------|------|-----------|
| System Owner | _________________ | __________ | __________ |
| Tenant Admin (new tenant) | _________________ | __________ | __________ |

---

## Go/No-Go Decision

### Pre-Decision Verification

- [ ] All Hard Stops verified clear
- [ ] All Section 1-8 checkboxes completed or risk-accepted
- [ ] All required sign-offs obtained
- [ ] Risk acceptance entries current and valid

### Decision

| Decision | Recorded By | Date |
|----------|-------------|------|
| [ ] GO - Proceed with release/onboarding | _________________ | __________ |
| [ ] NO-GO - Blocked pending resolution | _________________ | __________ |

### If NO-GO

Blocking issues:

1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________

Next review date: __________________

---

## Post-Launch Verification

Complete within 24 hours of launch/onboarding:

- [ ] Tenant can log in successfully
- [ ] Tenant data is isolated (spot check)
- [ ] Audit logs capture tenant actions
- [ ] No cross-tenant data visible
- [ ] Monitoring dashboards show tenant activity
- [ ] Backup job includes new tenant data

---

## See Also

- [Multi-Tenant Release Readiness](./MULTITENANT_RELEASE_READINESS.md) - Release channels and classification
- [Readiness Gaps and Risk Acceptance](./READINESS_GAPS_AND_RISK_ACCEPTANCE.md) - Risk register
- [Deployment Readiness Checklist](./DEPLOYMENT_READINESS_CHECKLIST.md) - General deployment gates
- [Architecture: Multi-Tenancy](../ARCHITECTURE_MULTITENANCY.md) - Technical design
- [Recovery and Restoration](./RECOVERY_AND_RESTORATION.md) - Restore procedures
