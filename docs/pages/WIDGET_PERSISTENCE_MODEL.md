Copyright (c) Santa Barbara Newcomers Club. All rights reserved.

# Widget Persistence Model
Last updated: 2025-12-14

## Purpose
Define where widget state lives, and how to keep it auditable and maintainable.

## The Three Kinds of Widget State
A) Presentation config (per page placement)
- Stored in the Page Document under widget.props.config
- Examples:
  - "limit": 5
  - "mode": "upcoming"
  - "showThumbnails": true

B) Domain data (system-of-record)
- Stored in first-class tables
- Examples:
  - events, registrations, members, payments, albums, photos
- Widgets query this via RBAC-safe server APIs.

C) Widget-owned persistent state (rare)
- Stored in a WidgetInstance record referenced by widget.props.instanceId
- Examples:
  - curated lists
  - saved filters (from a whitelist)
  - per-widget editorial content like announcements

## WidgetInstance Table (Proposed)
- WidgetInstance
  - id (uuid)
  - widgetType (string)
  - ownerScope (string, e.g., "global" or "committee:activities")
  - configJson (jsonb)
  - dataJson (jsonb)
  - createdAt, createdBy
  - updatedAt, updatedBy

Rules:
- widgetType must be allowlisted.
- configJson and dataJson must be schema-validated per widgetType.
- ownerScope restricts who can edit the instance.

## Audit and Versioning
Widget-owned persistent state must be auditable.

Recommended:
- WidgetInstanceVersion
  - id (uuid)
  - widgetInstanceId (uuid)
  - versionNumber (int)
  - configJson (jsonb)
  - dataJson (jsonb)
  - createdAt, createdBy
  - changeSummary (string, optional)

At minimum:
- write to a general audit log on update.

## RBAC Requirements
- Reading widget instances must be RBAC-checked.
- Updating widget instances must be RBAC-checked and logged.
- Widgets must not embed sensitive data in the Page Document.
- Widgets must fetch sensitive data at render time, server-side, for the current actor.

## Safety Constraints
- No arbitrary queries stored in widget state.
- Filters and sorts must be whitelisted and interpreted server-side.
- Deny-by-default: if a widgetType has not explicitly allowed a capability, it cannot use it.

## Examples
1) Small homepage list widget
- Page Document stores config (limit, sort)
- Widget queries domain tables for items allowed by RBAC
- No widget-owned persistent data

2) Photo gallery widget
- Domain data stores albums/photos and access rules
- Page Document stores config (albumId, layout)
- Optional WidgetInstance if the gallery is curated beyond a simple album selection

3) Editorial announcements
- Announcements are often widget-owned data
- Use WidgetInstance with auditable versions
- Page Document references instanceId and presentation config

## Open Questions
- Should we always use domain tables for editorial items to avoid WidgetInstance complexity?
- Do we need per-committee ownership scopes in v1, or can we start with global and evolve?
