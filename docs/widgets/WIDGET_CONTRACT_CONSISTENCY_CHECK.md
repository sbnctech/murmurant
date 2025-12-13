# Widget Contract Consistency Check

Worker 3 — Widget Contract Consistency Check — Report

## Scope
This document verifies that the Events Calendar Widget and Photo Gallery Widget
conform to the same core widget contract principles defined in ClubOS.

## Documents Reviewed
- docs/architecture/WIDGETS_ARE_UNTRUSTED_UI.md
- docs/widgets/PHOTO_GALLERY_WIDGET_CONTRACT.md
- docs/widgets/EVENTS_CALENDAR_WIDGET_CONTRACT.md
- docs/widgets/PHOTO_GALLERY_SYSTEM_SPEC.md

## Shared Contract Principles
- Widgets are untrusted UI
- All authentication handled by ClubOS
- All authorization handled server-side
- Widgets receive ViewerContext only
- Widgets dispatch intent, never decisions
- Widgets do not store secrets
- Widgets do not enforce privacy or RBAC

## Differences (Justified)
- TBD

## Drift Risks
- TBD

## Verdict
READY FOR REVIEW
