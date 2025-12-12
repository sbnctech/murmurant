# Activities Leadership Roles

## Structure
- Two VPs of Activities
- Each Event Chair reports to exactly one VP of Activities
- Each Event is owned by one Event Chair

## Intent
This structure supports:
- Clear accountability
- Delegated event management
- Scalable permissions without over-complication

## Planned Roles
- ADMIN: Full system access
- VP_ACTIVITIES: Oversees Event Chairs who report to them
- EVENT_CHAIR: Manages events they own

## Authorization Model (Future)
RBAC determines *who you are*.
Data relationships determine *which records you can access*.

Examples:
- Event Chair can edit their own events
- VP Activities can edit events owned by their chairs
- Admin can edit all events

These rules will be enforced at the API layer when implemented.
