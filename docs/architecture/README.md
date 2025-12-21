# Architecture Documentation

This directory contains ClubOS architectural decisions, design principles,
and structural guarantees that differentiate ClubOS from legacy platforms.

---

## Documents

| Document | Purpose |
|----------|---------|
| [WA_FUTURE_FAILURE_IMMUNITY.md](WA_FUTURE_FAILURE_IMMUNITY.md) | Meta-failure patterns from WA Top-50 and ClubOS architectural defenses |
| [FAILURE_MODES_TO_GUARANTEES_REGISTRY.md](FAILURE_MODES_TO_GUARANTEES_REGISTRY.md) | Registry mapping WA failures to ClubOS guarantees |
| [SAFE_DELEGATION_AND_PERMISSION_MODEL.md](SAFE_DELEGATION_AND_PERMISSION_MODEL.md) | Capability-based permission architecture |
| [COMMITTEE_AND_LEADERSHIP_ENABLEMENT.md](COMMITTEE_AND_LEADERSHIP_ENABLEMENT.md) | First-class committee and role transition modeling |
| [COGNITIVE_LOAD_AND_TALENT_MARKET_ADVANTAGE.md](COGNITIVE_LOAD_AND_TALENT_MARKET_ADVANTAGE.md) | Developer experience as competitive advantage |
| [OPEN_SOURCE_ADOPTION_POLICY.md](OPEN_SOURCE_ADOPTION_POLICY.md) | Policy for evaluating and adopting open source |
| [OPEN_SOURCE_CANDIDATES.md](OPEN_SOURCE_CANDIDATES.md) | Candidate libraries under evaluation |

---

## Cross-References

### Related to Competitive Analysis

- [../competitive/README.md](../competitive/README.md) - Competitive positioning documents
- [../competitive/WA_FAILURE_MODES_TO_CLUBOS_GUARANTEES.md](../competitive/WA_FAILURE_MODES_TO_CLUBOS_GUARANTEES.md) - Detailed WA vs ClubOS comparison

### Related to Operations

- [../ops/FEATURE_RISK_AND_FIELD_TESTING_MODEL.md](../ops/FEATURE_RISK_AND_FIELD_TESTING_MODEL.md) - Release safety gates
- [../reliability/MULTITENANT_RELEASE_READINESS.md](../reliability/MULTITENANT_RELEASE_READINESS.md) - Multitenancy readiness checklist
- [../reliability/WA_IMMUNITY_REVIEW_GATE.md](../reliability/WA_IMMUNITY_REVIEW_GATE.md) - PR review gate for WA immunity

### Foundational Documents

- [../ARCHITECTURAL_CHARTER.md](../ARCHITECTURAL_CHARTER.md) - ClubOS constitution (P1-P10, N1-N8)
- [../reliability/DATA_INVARIANTS.md](../reliability/DATA_INVARIANTS.md) - Data integrity rules
- [../reliability/SYSTEM_GUARANTEES.md](../reliability/SYSTEM_GUARANTEES.md) - System-level guarantees

---

## Reading Order

For new team members or stakeholders:

1. **Start here:** [../ARCHITECTURAL_CHARTER.md](../ARCHITECTURAL_CHARTER.md) - Core principles
2. **Why we exist:** [WA_FUTURE_FAILURE_IMMUNITY.md](WA_FUTURE_FAILURE_IMMUNITY.md) - Problems we solve
3. **How we're different:** [SAFE_DELEGATION_AND_PERMISSION_MODEL.md](SAFE_DELEGATION_AND_PERMISSION_MODEL.md) - Permission architecture
4. **Specific guarantees:** [FAILURE_MODES_TO_GUARANTEES_REGISTRY.md](FAILURE_MODES_TO_GUARANTEES_REGISTRY.md) - Detailed mappings
