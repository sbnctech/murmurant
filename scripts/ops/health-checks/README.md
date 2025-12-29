# Murmurant Health Check Scripts

Operational health check scripts for monitoring Murmurant system status.

## Scripts

| Script | Purpose | Exit Codes |
|--------|---------|------------|
| `db-health.sh` | Database connectivity and migration status | 0=OK, 1=Fail, 2=Error |
| `app-health.sh` | Application endpoints and response times | 0=OK, 1=Fail, 2=Error |
| `full-health.sh` | Runs all checks with summary report | 0=OK, 1=Fail, 2=Error |

## Usage

```bash
# Database health check
./db-health.sh
./db-health.sh --verbose

# Application health check (defaults to localhost:3000)
./app-health.sh
./app-health.sh --verbose
./app-health.sh https://murmurant.example.com

# Full system check
./full-health.sh
./full-health.sh --verbose
./full-health.sh --json  # Machine-readable output
```

## Environment

- `DATABASE_URL`: Required for database checks (loaded from .env if not set)

## Integration

These scripts are designed for:

- Manual operator verification
- CI/CD pipeline health gates
- Cron-based monitoring
- Incident response verification

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All checks passed |
| 1 | One or more checks failed |
| 2 | Script error (missing deps, config) |
