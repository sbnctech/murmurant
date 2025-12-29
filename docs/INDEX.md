# Murmurant Documentation Index

This is the main entry point for all Murmurant developer documentation.

## Getting Started
- [Developer Onboarding](ONBOARDING.md)
- [Development Workflow](DEVELOPMENT_WORKFLOW.md)

## Architecture
- [Core Trust Surface](ARCH/CORE_TRUST_SURFACE.md) - Locked guarantees for migration and preview
- [Admin Architecture Map](ADMIN_ARCHITECTURE_MAP.md)
- [API Surface](API_SURFACE.md)
- [Reversibility Contract](ARCH/REVERSIBILITY_CONTRACT.md) - Migration safety guarantees
- [Calendar and Time Model](ARCH/CALENDAR_TIME_MODEL.md) - Timezone handling, iCalendar interop

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

## Migration
- [Migration Customer Journey](IMPORTING/MIGRATION_CUSTOMER_JOURNEY.md) - Customer experience walkthrough
- [Importer Runbook](IMPORTING/IMPORTER_RUNBOOK.md) - Technical migration procedures
- [WA Policy Capture](IMPORTING/WA_POLICY_CAPTURE.md) - Policy capture process

### Wild Apricot Migration
- [Presentation Discovery Stage](MIGRATION/PRESENTATION_DISCOVERY_STAGE.md) - Crawl and inventory WA presentation layer
- [Widgets vs Gadgets](MIGRATION/WILD_APRICOT_WIDGETS_VS_GADGETS.md) - Terminology and discovery guide
- [Gadget Tagging](MIGRATION/WILD_APRICOT_GADGET_TAGGING.md) - Migration classification by gadget type
- [Migration Intake Checklist](MIGRATION/WILD_APRICOT_MIGRATION_INTAKE_CHECKLIST.md) - Discovery questions for operators

### External Resources
- **ClubCalendar** (`clubcalendar_sbnc/`) - Inline calendar widget for WA sites (parallel deliverable, not in this repo)

## Testing and Tooling
- Test scripts under scripts/dev/*
- Make targets documented in README.md
- Playwright test suites in tests/api and tests/admin

## Business Model
- [Business Model Canonical](BIZ/BUSINESS_MODEL_CANONICAL.md) - Core business model rules
- [Pricing and Entitlements](BIZ/PRICING_AND_ENTITLEMENTS.md) - Tiers, entitlements, limits
- [Billing Invariants](BIZ/BILLING_INVARIANTS.md) - Billing safety requirements
- [ChatGPT Working Notes](BIZ/_ARCHIVE/CHATGPT_BUSINESS_MODEL_WORKING_NOTES.md) - Archived design rationale

## Operator Guides
- [Calendar Trust and Reliability](BIZ/CALENDAR_TRUST_AND_RELIABILITY.md) - How Murmurant handles dates and times (non-technical)
- [Core Trust Surface for Operators](BIZ/TRUST_SURFACE_FOR_OPERATORS.md) - The five guarantees that protect your organization

## Reference
- Mock data definitions under lib/mock/*
- Utility helpers under lib/*

