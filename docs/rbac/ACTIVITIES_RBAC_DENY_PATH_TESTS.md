# Activities RBAC Deny-Path Tests

Status: Draft (READY FOR REVIEW)

Goal: Enumerate mandatory deny-path tests for activities delegated admin endpoints and widgets.

## Chair Assignment (VP only)
1. Non-authenticated -> 401
2. Authenticated member (no admin) -> 403
3. Event chair attempting to assign chair -> 403
4. VP attempting to grant non-allowed role_key -> 403/422
5. VP missing reason -> 422
6. VP invalid subject_id -> 422
7. VP grant duplicate chair for same event -> 409
8. VP revoke non-existent assignment -> 404
9. VP revoke missing reason -> 422

## Committee Roster (Chair scoped)
1. Chair modifies roster for event outside scope -> 403
2. Chair attempts to assign EVENT_CHAIR -> 403
3. Chair attempts to assign role_key outside allowlist -> 403/422
4. Member without chair role -> 403

## Data Minimization
1. Roster endpoint returns only role-filtered fields (no sensitive columns)
2. Search endpoint is role-filtered and does not expose private contact data unless explicitly allowed

## Audit
1. Every grant/revoke writes audit record with required fields
2. Audit record is immutable (append-only)
