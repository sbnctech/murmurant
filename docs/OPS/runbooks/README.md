# Murmurant Operator Runbooks

Standardized incident response procedures for Murmurant operators.

## Runbook Index

| Runbook | Severity | Trigger |
|---------|----------|---------|
| [Health Check Failure](HEALTH_CHECK_FAILURE.md) | P2 | Automated health check fails |
| [Database Connection](DATABASE_CONNECTION.md) | P1 | Database unreachable or connection errors |
| [Deployment Rollback](DEPLOYMENT_ROLLBACK.md) | P1 | Failed deployment requires rollback |
| [Performance Degradation](PERFORMANCE_DEGRADATION.md) | P2 | Slow response times or high latency |

## Severity Levels

| Level | Response Time | Description |
|-------|---------------|-------------|
| P1 | Immediate | Service down, data at risk |
| P2 | 1 hour | Degraded service, workaround available |
| P3 | 4 hours | Minor issue, no immediate impact |

## Runbook Structure

Each runbook follows a standard format:

1. **Symptoms** - How to identify this incident
2. **Impact** - What is affected
3. **Diagnosis** - Steps to confirm root cause
4. **Resolution** - Step-by-step fix instructions
5. **Verification** - How to confirm the fix worked
6. **Escalation** - When and how to escalate

## Related Resources

- [Health Check Scripts](../../../scripts/ops/health-checks/README.md)
- Deployment Guide (TODO: create docs/CI/DEPLOYMENT.md)
- [Database Operations](../../../docs/MIGRATION/)

## Quick Health Check

```bash
# Run full system health check
./scripts/ops/health-checks/full-health.sh

# Database only
./scripts/ops/health-checks/db-health.sh --verbose

# Application only
./scripts/ops/health-checks/app-health.sh --verbose
```
