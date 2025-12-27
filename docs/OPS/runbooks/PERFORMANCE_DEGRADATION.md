# Performance Degradation Runbook

**Severity**: P2
**Category**: Performance
**Last Updated**: 2024-12-26

## Symptoms

- Health check reports slow response times (>1000ms)
- Users report slow page loads
- API requests timing out
- High latency in monitoring dashboards

## Impact

- Degraded user experience
- Possible timeouts on complex operations
- Users may perceive service as unreachable

## Diagnosis

### Step 1: Confirm Performance Issue

```bash
# Run health check with timing
./scripts/ops/health-checks/app-health.sh --verbose

# Multiple checks to confirm pattern
for i in {1..5}; do
  curl -s -o /dev/null -w "Response: %{time_total}s\n" https://your-app.vercel.app/api/health
  sleep 2
done
```

### Step 2: Identify Slow Component

```bash
# Database response time
time npx prisma db execute --stdin <<< "SELECT 1;"

# API endpoint response times
curl -s -o /dev/null -w "%{time_connect}s connect, %{time_total}s total\n" \
  https://your-app.vercel.app/api/health
```

### Step 3: Check Database Performance

```bash
# Check for long-running queries (via Neon dashboard)
# Or run diagnostic query:
npx prisma db execute --stdin <<< "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 seconds';
"
```

### Step 4: Check Vercel Function Performance

1. Go to Vercel Dashboard > Analytics > Functions
2. Review execution times
3. Identify slow functions
4. Check for cold start patterns

### Step 5: Check External Dependencies

- Neon database latency (check Neon dashboard)
- Any third-party API calls
- CDN performance

## Resolution

### If Database is Slow

1. **Check for missing indexes**:
   ```bash
   # Review slow query log in Neon dashboard
   # Identify queries without index usage
   ```

2. **Check connection pool**:
   - Review connection count in Neon dashboard
   - Consider increasing pool size if maxed out

3. **Optimize queries**:
   - Add indexes for frequently queried columns
   - Review N+1 query patterns
   - Use Prisma query logging to identify issues

### If Cold Starts are Issue

1. **Check function regions**:
   - Ensure functions are in same region as database
   - Review Vercel function configuration

2. **Consider warming strategies**:
   - Implement keep-alive requests
   - Review caching opportunities

### If High Load

1. **Check traffic patterns**:
   - Review Vercel Analytics
   - Look for traffic spikes

2. **Scale resources if needed**:
   - Increase Neon compute size
   - Review Vercel plan limits

3. **Implement caching**:
   - Add API response caching
   - Use Vercel Edge caching where appropriate

### If Memory Issues

1. **Check for memory leaks**:
   - Review function memory usage in Vercel
   - Check for unbounded data structures

2. **Optimize payloads**:
   - Reduce response sizes
   - Implement pagination

## Verification

After optimization:

```bash
# Run timing tests
./scripts/ops/health-checks/app-health.sh --verbose

# Compare before/after
for i in {1..5}; do
  curl -s -o /dev/null -w "%{time_total}s\n" https://your-app.vercel.app/api/health
done
```

Expected: Response times under 500ms for health endpoint.

## Escalation

Escalate if:

- Performance does not improve after optimization
- Root cause cannot be identified
- Scaling requires infrastructure changes
- Costs are a concern

Escalation path:

1. Review Vercel and Neon dashboards in detail
2. Analyze database query patterns
3. Consider architecture review
4. Contact infrastructure support

## Prevention

- Monitor response times continuously
- Set up alerts for latency thresholds
- Regular performance testing
- Review and optimize database queries
- Implement proper caching strategies
- Keep dependencies updated
