# Admin Architecture Map

This document provides a high-level view of how the Admin UI, API routes, mock data, and core workflows interact inside Murmurant.

## Overview
The Admin subsystem is built from:
- Next.js server components for data loading
- Client components for interactivity
- API routes under /api/admin/*
- Mock data sources under lib/mock/*
- Playwright test suites for API and UI

## ASCII Architecture Diagram

                       +----------------------+
                       |  Admin Dashboard     |
                       |  /admin              |
                       +----------+-----------+
                                  |
                                  v
        +--------------------------------------------------+
        | Data Fetching (Server Components)                |
        |  - Summary tiles                                 |
        |  - Member search                                 |
        |  - Recent activity                               |
        +----------------------+---------------------------+
                               |
                               v
                     +-------------------+
                     | API Layer         |
                     | /api/admin/*      |
                     +---------+---------+
                               |
        ----------------------------------------------------
        |                     |                           |
        v                     v                           v
 +--------------+     +---------------+       +-----------------------+
 | Members API  |     | Events API    |       | Registrations API     |
 | - summary    |     | - summary     |       | - summary             |
 | - search     |     | - search      |       | - search              |
 | - export CSV |     | - export CSV  |       | - export CSV          |
 +-------+------+     +-------+-------+       +-----------+-----------+
         |                    |                           |
         v                    v                           v
   +-----------+       +-------------+          +-----------------+
   | mock data |       | mock data   |          | mock data       |
   | members   |       | events      |          | registrations   |
   +-----------+       +-------------+          +-----------------+

## UI Explorer Pages

- /admin/members
- /admin/events
- /admin/registrations

Each follows the same structural pattern:
- Server component fetches initial data
- Client component handles filtering, sorting, or export actions
- API routes provide JSON and CSV data

## Export Architecture

CSV endpoints live under:
- /api/admin/export/members
- /api/admin/export/events
- /api/admin/export/registrations
- /api/admin/export/activity

Each endpoint:
- Loads mock data
- Enriches with linked member/event fields
- Outputs text/csv with attachment headers

## Activity Feed Flow

1. Admin page server component calls /api/admin/activity
2. Results sorted by registeredAt descending
3. UI renders first 10 items
4. Links to related explorer pages allow drill-down

## Testing Architecture

- API tests in tests/api/*
- UI tests in tests/admin/*
- smoke.sh runs core API/UI tests
- test-changed.sh runs only updated specs

## Related Documents

- [Developer Onboarding](ONBOARDING.md)
- [Development Workflow](DEVELOPMENT_WORKFLOW.md)
- [API Surface](API_SURFACE.md)
- All Admin UI guides in docs/

