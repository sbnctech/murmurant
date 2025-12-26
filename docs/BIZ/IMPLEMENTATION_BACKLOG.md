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
- Safe embed allowlist
