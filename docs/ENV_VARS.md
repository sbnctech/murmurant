# Murmurant Environment Variables (Names Only)
Copyright (c) Santa Barbara Newcomers Club

This file lists environment variable names used by Murmurant.
Do not store secrets here.

Required:
- DATABASE_URL
- AUTH_SECRET
- APP_ORIGIN
- NODE_ENV

Optional (if cron/scheduled endpoints exist):
- CRON_SHARED_SECRET

Optional (if rate limiting / bot protection added):
- RATE_LIMIT_REDIS_URL
