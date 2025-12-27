# Security Review Checklist

```
Use: PR Review
Audience: All Contributors
Classification: Normative
```

Copy this checklist into PRs that touch auth, data access, or security-sensitive code.

---

## Quick Check (All PRs)

- [ ] No hardcoded secrets, tokens, or credentials
- [ ] No `console.log` of sensitive data (passwords, tokens, PII)
- [ ] Error messages don't expose internal details to public users
- [ ] Tests exist for the change

---

## Authentication (if touching auth code)

- [ ] All protected routes call `requireAuth()` or `requireCapability()`
- [ ] Session validation happens server-side, not just UI
- [ ] Auth failures return 401/403, never 200 with empty data
- [ ] Test tokens only work when `NODE_ENV !== 'production'`
- [ ] Magic links and tokens have expiration enforced

---

## Authorization (if touching capabilities/roles)

- [ ] Capability checks use `hasCapability()`, not role string comparison
- [ ] Time-bounded roles validated at request time, not just grant time
- [ ] Object-scoped resources check scope with `requireCapabilityWithScope()`
- [ ] No "if admin then allow all" patterns
- [ ] No UI-only gating (hiding buttons is not security)

### Impersonation Safety

If the route is accessible during impersonation:

- [ ] Does NOT allow: `finance:manage`
- [ ] Does NOT allow: `comms:send`
- [ ] Does NOT allow: `users:manage`
- [ ] Does NOT allow: `events:delete`
- [ ] Does NOT allow: `admin:full`

---

## Data Protection (if touching queries or exports)

- [ ] Member queries filter by auth context
- [ ] PII fields respect visibility settings (private, members-only, public)
- [ ] Deleted records are soft-deleted with audit trail
- [ ] Export endpoints respect field-level privacy
- [ ] No raw SQL (use Prisma parameterized queries)

---

## Input Validation (if accepting user input)

- [ ] Request bodies validated with Zod schemas
- [ ] File uploads check MIME type and size
- [ ] URLs validated against allowlist (for embeds, external links)
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] Date/time inputs validated and timezone-aware

---

## Audit Logging (if performing mutations)

- [ ] `auditMutation()` called for CREATE, UPDATE, DELETE, PUBLISH, SEND
- [ ] Auth context (actor, role, session) attached to audit log
- [ ] Request ID included for log correlation
- [ ] Failed operations also logged (not just successes)

---

## Error Handling

- [ ] Errors caught and logged (no silent failures)
- [ ] Error responses include requestId for support
- [ ] Admin errors show details; public errors sanitized
- [ ] Error boundaries prevent full-page React crashes
- [ ] Form failures preserve user input

---

## Migration/Embed Security (if touching SafeEmbed or migration)

- [ ] SafeEmbed only renders ACTIVE allowlisted domains
- [ ] Two-person approval workflow enforced for new embed sources
- [ ] Script tags classified as UNSUPPORTED
- [ ] HTTP embeds rejected (HTTPS only)
- [ ] Cutover failures abort without partial data

---

## Quick Copy Template

```markdown
## Security Checklist

- [ ] No hardcoded secrets
- [ ] Auth check on protected routes
- [ ] Capability-based authorization (not role strings)
- [ ] Input validated server-side
- [ ] Audit logging for mutations
- [ ] Error messages sanitized for public
```

---

## When to Escalate

Escalate to security review if:

- Adding new auth mechanisms
- Changing capability definitions
- Modifying audit logging
- Touching impersonation logic
- Adding external integrations
- Handling payment or PII data

---

## Related

- [Failure Modes and Guardrails](../reliability/FAILURE_MODES_AND_GUARDRAILS.md)
- [Security Failure and Containment](../reliability/SECURITY_FAILURE_AND_CONTAINMENT.md)
- [Architectural Charter](../ARCHITECTURAL_CHARTER.md)
