# Worker 2 — RBAC Error Semantics

## Objective
Clarify and standardize how RBAC-related authorization errors are handled.

## Why This Matters
Inconsistent use of HTTP status codes causes:
- Confusing frontend behavior
- Hard-to-debug API failures
- Security ambiguity

## Scope
Focus only on **error semantics**, not business logic.

## Questions to Answer
1. When should the API return **401 Unauthorized** vs **403 Forbidden**?
2. Should missing tokens and invalid tokens be treated differently?
3. Should role failures expose role names or stay generic?
4. What should the standard JSON error shape be?

## Tasks
1. Review current auth middleware and error helpers
2. Identify inconsistencies
3. Propose a single standard error contract
4. Provide example error payloads (JSON)
5. Recommend test cases (no coding unless trivial)

## Output Format
- Short written analysis
- Clear recommendations
- Example error responses
