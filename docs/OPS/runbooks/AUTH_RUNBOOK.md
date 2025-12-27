# Authentication Runbook

Operational procedures for ClubOS authentication system.

**Charter Principles:**

- **P1**: Identity and authorization must be provable
- **P2**: Default deny, least privilege, object scope
- **P9**: Security must fail closed

---

## Overview

ClubOS uses passkey-based authentication (WebAuthn). Key components:

- **Auth Provider**: NextAuth.js with WebAuthn adapter
- **Session Storage**: Database-backed sessions (PostgreSQL)
- **Health Endpoint**: `/api/health/auth`

---

## Health Check

### Quick Status

```bash
# Basic health check (no auth required)
curl -s https://your-site.com/api/health/auth | jq .

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2024-01-15T10:30:00Z",
#   "checks": {
#     "authSecretConfigured": { "status": "ok" },
#     "databaseConnectivity": { "status": "ok", "latencyMs": 42 }
#   }
# }
```

### Automated Health Check

```bash
scripts/ops/health-checks/auth-health.sh
```

---

## Common Issues

### Issue: Users Cannot Log In

**Symptoms:**

- Login page loads but passkey prompt fails
- Error message about authentication failure
- `/api/health/auth` returns status: "error"

**Diagnosis:**

1. Check health endpoint:
   ```bash
   curl -s https://your-site.com/api/health/auth
   ```

2. Check for specific failures:
   - `authSecretConfigured: error` - AUTH_SECRET missing or invalid
   - `databaseConnectivity: error` - Cannot reach database

**Resolution:**

| Cause | Action |
|-------|--------|
| AUTH_SECRET not set | Set AUTH_SECRET in environment (32+ characters) |
| AUTH_SECRET too short | Regenerate with: `openssl rand -base64 32` |
| Database unreachable | Check DATABASE_URL and database status |
| Session table missing | Run: `npx prisma db push` |

### Issue: Sessions Expire Unexpectedly

**Symptoms:**

- Users logged out after short periods
- "Session expired" errors

**Diagnosis:**

1. Check session configuration in auth config
2. Verify database session cleanup isn't too aggressive
3. Check for clock skew between servers

**Resolution:**

| Cause | Action |
|-------|--------|
| Short session maxAge | Review auth configuration |
| Clock skew | Sync server time with NTP |
| Database cleanup | Check session cleanup job timing |

### Issue: Passkey Registration Fails

**Symptoms:**

- New users cannot create passkeys
- "Registration failed" errors

**Diagnosis:**

1. Check browser console for WebAuthn errors
2. Verify HTTPS is properly configured (WebAuthn requires secure context)
3. Check relying party ID matches domain

**Resolution:**

| Cause | Action |
|-------|--------|
| HTTP instead of HTTPS | Ensure SSL certificate is valid |
| Wrong RP ID | Check NEXTAUTH_URL matches domain |
| Browser not supported | Verify browser supports WebAuthn |

---

## Escalation Procedures

### Level 1: Self-Service (Operator)

1. Run health check script
2. Check environment variables
3. Verify database connectivity
4. Review recent deployments

### Level 2: Technical Support

Escalate if:

- Health checks pass but auth still fails
- Multiple users affected simultaneously
- Error patterns not matching known issues

**Information to gather:**

- Health check output
- Recent deployment timestamps
- Affected user count
- Error messages from browser console

### Level 3: Emergency

Escalate immediately if:

- All users locked out
- Suspected security breach
- Data integrity concerns

**Immediate actions:**

1. Document the incident start time
2. Capture all relevant logs
3. Contact merge captain

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `AUTH_SECRET` | Yes | Session encryption key (32+ chars) |
| `NEXTAUTH_URL` | Yes | Canonical URL for auth callbacks |
| `DATABASE_URL` | Yes | PostgreSQL connection string |

### Generating AUTH_SECRET

```bash
# Generate a secure secret
openssl rand -base64 32
```

---

## Audit Requirements

Per P1, all auth events must be logged:

- Login success/failure
- Session creation/expiration
- Passkey registration/removal
- Permission checks

### Viewing Auth Audit Logs

```sql
SELECT * FROM audit_log
WHERE action LIKE 'auth:%'
ORDER BY created_at DESC
LIMIT 50;
```

---

## Recovery Procedures

### Procedure: Reset AUTH_SECRET

**When:** Secret compromised or needs rotation

**Steps:**

1. Generate new secret:
   ```bash
   openssl rand -base64 32
   ```

2. Update in hosting platform (Netlify):
   - Go to Site Settings > Environment Variables
   - Update AUTH_SECRET value
   - Trigger redeploy

3. **Note:** All existing sessions will be invalidated

### Procedure: Emergency Session Clear

**When:** Suspected session compromise

**Steps:**

1. Connect to database
2. Clear all sessions:
   ```sql
   -- WARNING: Logs out all users
   DELETE FROM sessions;
   ```
3. Monitor for re-authentication

---

## Related Documents

- [monitoring.md](../monitoring.md) - Health check details
- [ARCHITECTURAL_CHARTER.md](../../ARCHITECTURAL_CHARTER.md) - Security principles
