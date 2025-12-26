
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
