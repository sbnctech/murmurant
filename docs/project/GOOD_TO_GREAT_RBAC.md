# RBAC: Good → Great

## What Is Already Good
- Centralized auth middleware
- Clear ADMIN vs MEMBER separation
- Consistent use of 401 vs 403 (in progress)
- Prisma-backed authorization decisions
- Test coverage for admin APIs

## What “Great” Looks Like
1. Role hierarchy is explicit (ADMIN > VP > CHAIR)
2. Ownership rules enforced at API boundaries
3. Error semantics are predictable and documented
4. Tests describe intent, not just mechanics
5. Non-technical admins understand permissions

## Gaps to Close
- Event Chair ownership enforcement
- VP Activities scope rules
- Row-level authorization patterns
- Clear error contract documentation

## Near-Term Priorities
1. Finalize RBAC error semantics
2. Lock Event Chair permissions
3. Define VP Activities authority
4. Complete test matrix
5. Publish RBAC explainer docs

## Out of Scope (For Now)
- OAuth
- UI permission controls
- Fine-grained field masking

## Success Criteria
RBAC is boring, predictable, and safe.
