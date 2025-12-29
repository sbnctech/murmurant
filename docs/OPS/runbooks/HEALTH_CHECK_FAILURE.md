# Health Check Failure Runbook

**Severity**: P2
**Category**: Monitoring
**Last Updated**: 2024-12-26

## Symptoms

- Automated health check script returns non-zero exit code
- Monitoring alert triggered for health endpoint
- `full-health.sh` reports one or more checks failed

## Impact

- May indicate partial or complete service degradation
- Users may experience errors or slow responses
- Dependent services may be affected

## Diagnosis

### Step 1: Run Verbose Health Check

```bash
cd /path/to/murmurant
./scripts/ops/health-checks/full-health.sh --verbose
```

### Step 2: Identify Failing Component

Check the output to identify which check failed:

- **Database check failed** - See [DATABASE_CONNECTION.md](DATABASE_CONNECTION.md)
- **Application check failed** - Continue below
- **Response time slow** - See [PERFORMANCE_DEGRADATION.md](PERFORMANCE_DEGRADATION.md)

### Step 3: Check Application Logs

```bash
# Vercel logs (if deployed to Vercel)
vercel logs --prod

# Local development logs
npm run dev 2>&1 | tail -100
```

### Step 4: Verify External Dependencies

```bash
# Check Neon database status
curl -s https://status.neon.tech/api/v2/status.json | jq '.status'

# Check Vercel status
curl -s https://www.vercel-status.com/api/v2/status.json | jq '.status'
```

## Resolution

### If Application Endpoint Unreachable

1. Check if the application is deployed:
   ```bash
   vercel ls --prod
   ```

2. Check for recent deployments:
   ```bash
   vercel inspect <deployment-url>
   ```

3. If recent deployment caused issue, rollback:
   ```bash
   # See DEPLOYMENT_ROLLBACK.md for full procedure
   vercel rollback
   ```

### If Health Endpoint Returns Error

1. Check application logs for errors
2. Verify environment variables are set correctly
3. Check database connectivity separately:
   ```bash
   ./scripts/ops/health-checks/db-health.sh --verbose
   ```

### If Intermittent Failures

1. Check for rate limiting or capacity issues
2. Review response time trends
3. Consider scaling compute resources

## Verification

After resolution, verify the fix:

```bash
# Run full health check
./scripts/ops/health-checks/full-health.sh

# Check JSON output for automation
./scripts/ops/health-checks/full-health.sh --json
```

Expected output:
```json
{
  "timestamp": "...",
  "status": "healthy",
  "checks": [
    {"name": "database", "status": "pass", "duration_ms": ...},
    {"name": "application", "status": "pass", "duration_ms": ...}
  ]
}
```

## Escalation

Escalate if:

- Issue persists after following this runbook
- Root cause cannot be identified
- Data integrity concerns exist
- Multiple components are failing simultaneously

Escalation path:

1. Check GitHub issues for known problems
2. Review recent commits and deployments
3. Contact system administrator
