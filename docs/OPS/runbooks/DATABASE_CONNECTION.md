# Database Connection Runbook

**Severity**: P1
**Category**: Infrastructure
**Last Updated**: 2024-12-26

## Symptoms

- Database health check fails with connection error
- Application returns 500 errors on data operations
- Prisma client throws connection timeout errors
- Error messages containing "connection refused" or "timeout"

## Impact

- **Critical**: All data operations fail
- Users cannot log in, view events, or access member data
- Application is effectively down

## Diagnosis

### Step 1: Run Database Health Check

```bash
./scripts/ops/health-checks/db-health.sh --verbose
```

### Step 2: Verify DATABASE_URL

```bash
# Check if environment variable is set
echo $DATABASE_URL | head -c 50

# Verify format (should be postgres://...)
# Should NOT show the password in full
```

### Step 3: Test Direct Connection

```bash
# Test with Prisma
npx prisma db execute --stdin <<< "SELECT 1;"

# If Prisma fails, check raw connectivity
# Extract host from DATABASE_URL and test
```

### Step 4: Check Neon Dashboard

1. Go to https://console.neon.tech
2. Check project status
3. Review connection pooler status
4. Check for maintenance notifications

### Step 5: Check for IP/Firewall Issues

```bash
# Get your current IP
curl -s ifconfig.me

# Verify Neon allows this IP (if IP restrictions enabled)
```

## Resolution

### If Neon Service Outage

1. Check https://status.neon.tech
2. If outage confirmed, wait for Neon to resolve
3. Consider enabling read replica if available
4. Communicate outage to stakeholders

### If Connection Pool Exhausted

1. Check active connections in Neon dashboard
2. Restart application to release connections:
   ```bash
   # Vercel deployment
   vercel redeploy --prod
   ```
3. Review connection pool settings

### If Credentials Invalid

1. Verify DATABASE_URL in Vercel environment:
   ```bash
   vercel env pull
   cat .env.local | grep DATABASE_URL
   ```
2. Regenerate credentials in Neon dashboard if needed
3. Update Vercel environment variables:
   ```bash
   vercel env add DATABASE_URL production
   ```
4. Redeploy:
   ```bash
   vercel --prod
   ```

### If Branch/Database Deleted

1. Check Neon console for available branches
2. Restore from backup if available
3. If using branch, verify branch exists:
   ```bash
   # Via Neon CLI if installed
   neon branches list
   ```

### If DNS Resolution Failure

1. Verify Neon hostname resolves:
   ```bash
   dig <neon-hostname>
   ```
2. Check for DNS provider issues
3. Try alternative DNS (8.8.8.8)

## Verification

After resolution:

```bash
# Database health check
./scripts/ops/health-checks/db-health.sh --verbose

# Full system check
./scripts/ops/health-checks/full-health.sh

# Verify application works
curl -s https://your-app.vercel.app/api/health
```

## Escalation

**Immediate escalation required if:**

- Data loss suspected
- Credentials compromised
- Unable to restore connection within 15 minutes

Escalation path:

1. Check Neon status page and support
2. Review Neon console for errors
3. Contact Neon support if infrastructure issue
4. Contact system administrator for credential/config issues

## Prevention

- Monitor connection pool usage
- Set up alerts for connection failures
- Regularly test backup restoration
- Keep Neon credentials secure and rotated
