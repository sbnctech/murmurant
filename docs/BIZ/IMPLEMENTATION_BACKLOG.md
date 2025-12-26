# Implementation Backlog

## Presentation Discovery Stage

Planned (docs complete, code later):
- Site crawler for public WA pages (default: public-only scope)
- Widget/gadget inventory with classification tagging
- Navigation structure extraction
- Theme/CSS extraction
- Discovery report generation (JSON schema defined)

Related docs:
- docs/MIGRATION/PRESENTATION_DISCOVERY_STAGE.md
- docs/MIGRATION/PRESENTATION_DISCOVERY_CONTRACT.json

---

## Migration Awareness: WA Gadgets and Extensions

Planned (docs complete, code later):
- Migration intake checklist for gadgets/widgets
- Clear tagging: auto-migrate vs manual rebuild vs unsupported
- Page builder primitives aligned to migration reality

Future code requirements:
- Webhook/event stream (member.created, event.published, registration.paid)
- Signed webhook delivery with retries and replay
- Stable export endpoints (timezone-safe)
- ICS feeds with deterministic TZID behavior

---

## SafeEmbed v1

Status: Docs complete, code not started

### Summary

SafeEmbed is a page builder primitive that renders external content via locked-down iframes. It replaces arbitrary HTML embeds from WA custom blocks with a secure, auditable alternative.

### Specification

See: docs/ARCH/CLUBOS_PAGE_BUILDER_PRIMITIVES.md (SafeEmbed Specification section)

### Implementation Tasks

1. **Allowlist schema and storage**
   - Define Prisma model for SafeEmbedAllowlistEntry
   - Fields: hostname, pathPrefixes, queryParamsAllowed, allowFullscreen, notes, createdBy, createdAt, updatedAt
   - Seed default allowlist (YouTube, Vimeo, Google Maps, Calendly)

2. **URL validation logic**
   - Parse incoming URL
   - Match against allowlist entries (hostname exact match, path prefix match)
   - Reject HTTP (HTTPS only)
   - Return matched provider config or rejection reason

3. **SafeEmbed React component**
   - Inputs: providerType, url, title, height, width, allowFullscreen
   - Render locked-down iframe with sandbox, referrerpolicy, allow attributes
   - Show fallback UI if URL rejected

4. **Admin UI for allowlist management**
   - List current allowlist entries
   - Add/edit/remove entries (admin role required)
   - Audit log on every change (who/when/what)

5. **Migration tooling integration**
   - Detect iframe elements in WA custom HTML blocks
   - Classify as AUTO-MIGRATE (matches default allowlist) or MANUAL REBUILD
   - Generate SafeEmbed config from detected iframes

### Safety Requirements

- Default deny: only allowlisted URLs render
- HTTPS only: HTTP rejected
- Hostname-based entries: no wildcards
- Locked-down iframe: sandbox, referrerpolicy, allow="" (no camera/mic/geo)
- Audit log: all allowlist changes logged with user, timestamp, action

### Dependencies

- Prisma schema change (HOTSPOT - merge captain)
- Admin UI integration

### Related Docs

- docs/ARCH/CLUBOS_PAGE_BUILDER_PRIMITIVES.md
- docs/MIGRATION/WILD_APRICOT_GADGET_TAGGING.md
- docs/api/EMBED_WIDGET_SDK_CONTRACT.md
