# Money Representation Policy
Copyright (c) Santa Barbara Newcomers Club

## Decision
All money values in Murmurant MUST be represented as integer cents.

Use:
- amountCents: Int

Do NOT use:
- floating point dollars
- decimal strings without strict parsing rules

## Rationale
- Prevents rounding errors
- Simplifies auditing and reporting
- Matches common payment processor patterns

## Rules
- All calculations are performed in cents.
- Formatting to dollars happens only at display time.
- Persisted totals must always be cents.

## Examples
- $12.34 -> 1234
- $0.99  -> 99
