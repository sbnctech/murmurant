# Open Source vs Private Distribution — Decision Framework

This document records how SBNC will evaluate whether portions of ClubOS remain private or are released as open source in the future.

## Current Status

ClubOS is currently a private, SBNC-owned system intended for internal operational use.

No open-source license is implied by the presence of this repository.

## Decision Criteria (Future)

A decision to open source part or all of ClubOS should consider:

### Favor Open Source When:
- The component is infrastructure-level and not SBNC-specific
- Open sourcing improves security, reliability, or trust
- There is low risk of exposing sensitive governance logic
- Community contribution would reduce SBNC maintenance burden

### Favor Remaining Private When:
- Logic encodes governance, policy, or enforcement rules specific to SBNC
- The code relates directly to member data, permissions, or audit controls
- The component could be misused or misinterpreted outside SBNC context
- Operational or reputational risk outweighs collaboration benefits

## Process

Any open-source decision should:
1. Be documented in writing
2. Identify the exact scope to be released
3. Include a license selection rationale
4. Be approved by SBNC leadership

This document exists to ensure such decisions are deliberate, not accidental.
