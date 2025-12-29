# Transition Widget Specification

## Overview

This document specifies the Transition Widget feature for Murmurant, which helps
leadership manage the semi-annual transition of committee roles.

## Term Boundaries

Murmurant operates on a semi-annual term cycle:
- Winter term: August 1 through January 31
- Summer term: February 1 through July 31

Transitions occur at midnight Pacific Time on Feb 1 and Aug 1.

## Dashboard Widget

### Purpose
Show a "Transition Countdown" widget on the dashboards of:
- President
- Past President

The widget appears in advance of the end-of-term boundary to prompt leadership to create/verify the Transition Plan and gather sign-offs.

### Visibility Window
- Default lead time: 2 months before the end of the current term
- Configurable: the lead time MUST be configurable (in days)

### Configuration
Introduce a configurable setting:
- key: TRANSITION_WIDGET_LEAD_DAYS
- default: 60

Where it can live (implementation choice, but keep it simple):
Option A (preferred): SystemSetting table (key/value) with admin UI to edit
Option B: environment variable fallback (read-only)

### Business Rule
Compute "next term boundary" as the next occurrence of:
- Feb 1 00:00 America/Los_Angeles
- Aug 1 00:00 America/Los_Angeles
whichever is sooner than now.

Define:
- effectiveAtPT = that boundary instant (PT-local midnight)
- showAtPT = effectiveAtPT - LEAD_DAYS (in PT-local calendar days; convert via timezone helpers)

Widget is visible if:
- nowPT >= showAtPT AND nowPT < effectiveAtPT
AND user has role President OR Past President.

Widget contents:
- Next transition date (formatted in PT)
- Days remaining (integer)
- Status summary: whether a TransitionPlan exists for that effectiveAt (DRAFT/PENDING_SIGNOFF/APPROVED/APPLIED)
- Primary CTA:
  - If no plan: "Create transition plan"
  - If plan exists: "Review transition plan"
- Secondary CTA:
  - "View sign-offs"

### Notes
- This widget is advisory and does not apply changes. Applying is still controlled by sign-offs + scheduler/manual apply permissions.
- Webmaster must not see this widget by default.

## Execution Flow

1. President creates a TransitionPlan for the upcoming effectiveAt date
2. Assignments are added to the plan (role changes, new appointments, departures)
3. Required sign-offs are gathered (President, incoming role holders)
4. Plan status progresses: DRAFT -> PENDING_SIGNOFF -> APPROVED
5. At effectiveAt (or via manual trigger), approved plans are applied
6. Service history records are created/closed as roles change

## Sign-off Requirements

- President must sign off on all transition plans
- Each incoming role holder should acknowledge their new role
- Past President (outgoing) sign-off recommended but not blocking

## Permissions

| Action | President | Past President | VP | Board | Webmaster |
|--------|-----------|----------------|-----|-------|-----------|
| View widget | Yes | Yes | No | No | No |
| Create plan | Yes | No | No | No | No |
| Edit plan | Yes | No | No | No | No |
| Sign off | Yes | Yes | No | No | No |
| Apply plan | Yes | No | No | No | No |

