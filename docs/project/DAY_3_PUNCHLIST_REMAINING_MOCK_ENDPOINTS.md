# Day 3 Punchlist: Remaining Mock-Backed Endpoints

This file tracks API routes that still import mock data or are otherwise not Prisma-backed.

## Current Scan Command
```bash
rg -n "from \"@/lib/mock|from '@/lib/mock|mockMembers|mockEvents|mockRegistrations" src/app/api
```

## Status
- Converted to Prisma: /api/admin/members, /api/admin/events, /api/admin/registrations, /api/admin/activity, /api/admin/dashboard, /api/admin/search, /api/admin/export/*
- Converted to Prisma: /api/events, /api/members, /api/registrations (if present in main)

## Remaining Items
- /api/sms/test: keep as mock (test endpoint)
- Any additional matches shown by the scan above should be listed here with file path + import line.

## Last Scan Result (no mock imports found)
Scan date: 2025-12-12
Result: **All API routes are now Prisma-backed** (no mock imports detected)
