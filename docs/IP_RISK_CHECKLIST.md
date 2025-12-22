# IP & License Risk Checklist (Pre-Production)

This checklist should be reviewed before major releases, commercialization, or external distribution.

## Architecture & Code

- [ ] No third-party proprietary code copied or adapted
- [ ] No schemas or field names lifted from closed systems
- [ ] No reliance on undocumented third-party behavior
- [ ] Permission logic derived from first principles, not parity goals

## Documentation & Language

- [ ] Avoid “drop-in replacement” or “WA-compatible” claims
- [ ] Use problem-driven, not competitor-driven, descriptions
- [ ] Reference guarantees and failure modes, not competitor features
- [ ] Avoid screenshots or UI mimicry of proprietary systems

## Data & Migration

- [ ] Data imports use customer-owned exports only
- [ ] No scraping or automation of third-party UIs
- [ ] Migration tools treat source systems as opaque inputs

## Branding & Positioning

- [ ] No use of Wild Apricot trademarks or logos
- [ ] No implication of endorsement or affiliation
- [ ] Clear differentiation in messaging and architecture

## Process Safeguards

- [ ] Clean-room declaration remains accurate
- [ ] New contributors briefed on IP hygiene
- [ ] Architectural decisions documented with rationale
- [ ] Audit trail preserved for governance-related changes

## Escalation

If uncertainty exists:
- Pause implementation
- Document the concern
- Seek independent legal review if commercial distribution is planned
