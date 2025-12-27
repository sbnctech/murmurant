# Deployment Rollback Runbook

**Severity**: P1
**Category**: Deployment
**Last Updated**: 2024-12-26

## Symptoms

- Application errors immediately after deployment
- Health checks failing post-deployment
- User reports of broken functionality
- Console errors or 500 responses

## Impact

- User-facing functionality broken
- Service degradation or complete outage
- Potential data integrity issues

## Diagnosis

### Step 1: Confirm Deployment Issue

```bash
# Run health check
./scripts/ops/health-checks/full-health.sh --verbose

# Check recent Vercel deployments
vercel ls --prod
```

### Step 2: Identify Bad Deployment

```bash
# List recent deployments
vercel ls

# Inspect current production
vercel inspect $(vercel ls --prod | head -1)
```

### Step 3: Check Deployment Logs

```bash
# View production logs
vercel logs --prod

# Look for errors around deployment time
```

### Step 4: Compare with Previous Working Version

```bash
# Check git log for recent changes
git log --oneline -10

# Check what changed in last deployment
git diff HEAD~1
```

## Resolution

### Vercel Rollback (Preferred)

1. **Identify last known good deployment**:
   ```bash
   vercel ls
   # Note the URL of the last working deployment
   ```

2. **Promote previous deployment to production**:
   ```bash
   # Option 1: Via Vercel CLI
   vercel promote <deployment-url> --prod

   # Option 2: Via Vercel Dashboard
   # Go to Vercel Dashboard > Deployments
   # Find last good deployment
   # Click "..." > "Promote to Production"
   ```

3. **Verify rollback succeeded**:
   ```bash
   ./scripts/ops/health-checks/full-health.sh
   ```

### Git Revert (If Code Change Caused Issue)

1. **Identify problematic commit**:
   ```bash
   git log --oneline -10
   ```

2. **Create revert commit**:
   ```bash
   git revert <commit-hash> --no-edit
   ```

3. **Push and deploy**:
   ```bash
   git push origin main
   # Wait for Vercel auto-deploy
   ```

### Database Migration Rollback

**WARNING**: Database rollbacks are dangerous. Proceed with caution.

1. **Check if migration was applied**:
   ```bash
   npx prisma migrate status
   ```

2. **If rollback needed, contact merge captain**:
   - Do NOT run migration rollback without approval
   - Document the issue in GitHub
   - Create backup before any action

### Environment Variable Rollback

If environment variable change caused issue:

1. **Check current env vars**:
   ```bash
   vercel env pull
   ```

2. **Restore previous value**:
   ```bash
   vercel env add <VAR_NAME> production
   # Enter previous value
   ```

3. **Redeploy**:
   ```bash
   vercel --prod
   ```

## Verification

After rollback:

```bash
# Full health check
./scripts/ops/health-checks/full-health.sh --verbose

# Check application responds
curl -s https://your-app.vercel.app/api/health

# Verify key functionality
curl -s https://your-app.vercel.app/api/events
```

## Post-Incident

1. **Document the incident**:
   - What failed
   - How it was detected
   - Timeline of events
   - Resolution steps taken

2. **Create GitHub issue**:
   - Tag as "incident"
   - Include root cause analysis
   - Propose prevention measures

3. **Review deployment process**:
   - Was `npm run green` run before merge?
   - Did CI pass?
   - Were there warning signs ignored?

## Escalation

Escalate if:

- Rollback does not resolve issue
- Data integrity concerns
- Multiple systems affected
- Root cause unclear

Escalation path:

1. Review deployment logs in detail
2. Check for infrastructure issues
3. Contact system administrator
4. Consider maintenance mode if ongoing

## Prevention

- Always run `npm run green` before merging
- Use preview deployments to test changes
- Implement gradual rollout when possible
- Maintain small, incremental PRs
- Test database migrations in staging first
