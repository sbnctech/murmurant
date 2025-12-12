# Worker 3 — Event Chair Access Rules

## Objective
Define and validate authorization rules for Event Chairs.

## Known Facts
- Each Event has exactly one Event Chair
- Chairs manage only their own events
- Chairs are NOT admins

## Questions to Answer
1. What actions should Event Chairs be allowed to perform?
2. What should they explicitly NOT be allowed to do?
3. Which API routes need protection?
4. What future row-level checks will be required?

## Tasks
- Review existing RBAC middleware
- Identify required ownership checks
- Propose enforcement points
- Suggest test coverage

## Output
Written recommendations + examples
