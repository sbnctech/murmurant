# Open Source Adoption Policy

Worker 5 — Open Source Adoption Policy — Report

## Goal
Prefer established open-source modules (active community, maintained) when they meet requirements, to improve maintainability and reduce custom code.

## Decision Rule
Adopt an open-source module when:
- It meets functional requirements with minimal customization
- It has active maintenance and a healthy community
- It does not compromise RBAC/privacy/security
- It is compatible with our stack and licensing constraints

## Evaluation Checklist
- Maintenance activity (recent releases, issues triaged)
- Security posture (known CVEs, response pattern)
- Documentation quality
- Extensibility (hooks, plugin architecture)
- License compatibility
- Migration risk and lock-in risk
- Performance characteristics
- Accessibility support (if UI component)

## Adoption Process
1. Shortlist candidates (2-3)
2. Record evaluation using the checklist
3. Choose one and document why
4. Implement behind a feature flag when possible
5. Add tests and a rollback plan
6. Add "How to maintain" notes for humans and agents

## When NOT to Adopt
- Abandoned/low-activity projects
- Unclear licensing
- Requires deep forks to satisfy RBAC or data policy
- Introduces opaque runtime behavior that complicates debugging

## Applied To Gadgets Library
The gadgets/widget library should:
- Define a stable internal contract
- Allow swapping implementations over time
- Prefer modular components rather than monoliths

## Related Work Item
Create a research note: "Nonprofit portal gadgets catalog" and identify common homepage/admin widgets we should support.

## Verdict
READY FOR REVIEW
