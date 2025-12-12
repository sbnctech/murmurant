# Authentication and RBAC (Role-Based Access Control)

## Overview
ClubOS uses simple role-based access control enforced at the API layer.

RBAC answers: *what kind of user is making this request?*

Authorization answers: *what data is this user allowed to access?*

## Roles (Current)
- ADMIN
- MEMBER

(Additional roles such as VP_ACTIVITIES and EVENT_CHAIR will be added later.)

## Authentication
APIs expect an Authorization header:

Authorization: Bearer <token>

Invalid or missing tokens return:
- 401 Unauthorized

## Authorization
Routes enforce role checks:
- /api/admin/* requires ADMIN
- Public routes require no role

Insufficient role returns:
- 403 Forbidden

## Example
A protected admin route will:
1. Validate the token
2. Load the user role
3. Enforce role requirements
4. Return data or a 401/403 error

RBAC does not implement row-level permissions by itself.
Row-level rules are enforced separately using data relationships.
