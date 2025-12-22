# Tabletop: External Dependency Outage

Failure domain: Dependency Isolation / Capacity

Trigger:
- External service latency spikes or times out.

Key decisions:
- Degrade feature?
- Preserve core writes?
- Communicate impact?

Expected behavior:
- Core writes unaffected
- Feature degraded or denied safely

Failure if:
- Core writes blocked by dependency

