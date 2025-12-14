# Query Runtime Guards

## Invariants
- All queries MUST reference a registered template
- All params MUST pass allowlist validation
- ViewerContext is REQUIRED
- No direct execution paths exist

## Deny Conditions
- Missing template_id -> 403
- Unknown params -> 400
- Missing viewerContext -> 401
