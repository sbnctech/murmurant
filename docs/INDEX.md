# ClubOS Documentation Index

This is the main entry point for all ClubOS developer documentation.

## Getting Started
- [Developer Onboarding](ONBOARDING.md)
- [Development Workflow](DEVELOPMENT_WORKFLOW.md)

## Architecture
- [Admin Architecture Map](ADMIN_ARCHITECTURE_MAP.md)
- [API Surface](API_SURFACE.md)
- [Reversibility Contract](ARCH/REVERSIBILITY_CONTRACT.md) - Migration safety guarantees

## Authorization & Access Control
- [Authorization & RBAC Guide](RBAC_OVERVIEW.md) - High-level overview
- [Auth and RBAC Explained](rbac/AUTH_AND_RBAC.md) - Plain-English guide for admins
- [Activities Roles Guide](rbac/ACTIVITIES_ROLES.md) - VP and Event Chair permissions
- [VP Activities Scope](rbac/VP_ACTIVITIES_SCOPE.md) - Technical implementation
- [VP Access Matrix](rbac/VP_ACTIVITIES_ACCESS_MATRIX.md) - Detailed permission tables

## Admin Feature Guides
- [Admin Dashboard Overview](ADMIN_DASHBOARD_OVERVIEW.md)
- [Admin Members UI](ADMIN_MEMBERS_UI.md)
- [Admin Events UI](ADMIN_EVENTS_UI.md)
- [Admin Registrations UI](ADMIN_REGISTRATIONS_UI.md)
- [Admin Activity UI](ADMIN_ACTIVITY_UI.md)

## Testing and Tooling
- Test scripts under scripts/dev/*
- Make targets documented in README.md
- Playwright test suites in tests/api and tests/admin

## Reference
- Mock data definitions under lib/mock/*
- Utility helpers under lib/*

