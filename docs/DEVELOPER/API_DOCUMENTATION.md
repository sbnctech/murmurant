# Internal API Documentation System

## Overview

Murmurant includes an internal API documentation system that provides a comprehensive, interactive reference for all API endpoints. This documentation is intended for developers, tech leads, reviewers, and future maintainers.

**This is an internal tool - not for external or public use.**

## Accessing the Documentation

### Local Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the API docs page:
   ```
   http://localhost:3000/admin/dev/api-docs
   ```

3. You must be authenticated as an admin to view the documentation.

### Authentication for Viewing Docs

The API documentation is protected and requires `admin:full` capability. To access in development:

**Option 1: Use the dev session**
- Log in via magic link or passkey
- Ensure your user has admin role

**Option 2: Use test token header**
```bash
curl -H "x-admin-test-token: dev-admin-token" http://localhost:3000/api/openapi
```

## Architecture

### Components

| Component | Path | Description |
|-----------|------|-------------|
| OpenAPI Spec | `docs/api/openapi.yaml` | Canonical API specification (YAML) |
| Serving Endpoint | `/api/openapi` | Returns spec as JSON (admin-only) |
| Swagger UI Page | `/admin/dev/api-docs` | Interactive documentation viewer |

### Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   /admin/dev/api-docs                        │
│                  (Swagger UI Page)                           │
└─────────────────────────┬───────────────────────────────────┘
                          │ Fetches
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     /api/openapi                             │
│               (JSON serving endpoint)                        │
│           Requires: admin:full capability                    │
└─────────────────────────┬───────────────────────────────────┘
                          │ Reads & parses
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 docs/api/openapi.yaml                        │
│              (Canonical OpenAPI 3.1 spec)                    │
└─────────────────────────────────────────────────────────────┘
```

## Updating the OpenAPI Specification

### When to Update

Update the OpenAPI spec when:

- Adding a new API endpoint
- Changing request/response schemas
- Modifying authentication requirements
- Adding new error responses
- Deprecating endpoints

### How to Update

1. Edit the canonical spec file:
   ```
   docs/api/openapi.yaml
   ```

2. Follow the existing patterns for:
   - Path definitions
   - Tags (grouping)
   - Request/response schemas
   - Security requirements

3. Verify your changes:
   ```bash
   # Start dev server and check the UI
   npm run dev
   # Navigate to http://localhost:3000/admin/dev/api-docs
   ```

4. Run the tests:
   ```bash
   npx playwright test tests/api/openapi.spec.ts
   ```

### OpenAPI Spec Structure

```yaml
openapi: 3.1.0
info:
  title: Murmurant Internal API Documentation
  version: 1.0.0

tags:
  - name: Health
  - name: Auth
  # ... more tags for grouping

paths:
  /api/v1/health:
    get:
      tags: [Health]
      summary: System health check
      # ... endpoint definition

components:
  securitySchemes:
    cookieAuth:
      type: apiKey
      in: cookie
      name: murmurant_session

  schemas:
    # Reusable schema definitions
```

### Best Practices

1. **Use meaningful tags** - Group related endpoints together

2. **Write clear descriptions** - Each endpoint should have a summary and description

3. **Document all responses** - Include success, error, and edge cases

4. **Use refs for schemas** - Define reusable schemas in `components/schemas`

5. **Include examples** - Use `example` fields for clarity

6. **Document auth requirements** - Specify which capabilities are needed

## Security Considerations

### What to Include

- Endpoint paths and methods
- Request/response structures
- Authentication requirements (capability names)
- Error responses
- Example values using placeholders

### What NOT to Include

- Real API keys or tokens
- Real user emails or PII
- Database connection strings
- Internal implementation details
- Production URLs

### Placeholder Values

Use placeholder values for sensitive data:

```yaml
example:
  email: member@example.com    # Not a real email
  memberId: 550e8400-e29b-41d4-a716-446655440000  # Example UUID
  token: "xxx-placeholder-xxx"  # Never real tokens
```

## Testing

The API documentation system includes tests in:
```
tests/api/openapi.spec.ts
```

Tests verify:

- Unauthenticated access returns 401
- Member role access returns 403
- Admin access returns 200
- Response is valid OpenAPI 3.x structure
- Required paths and tags are present
- No sensitive data is exposed

Run tests:
```bash
npx playwright test tests/api/openapi.spec.ts
```

## Troubleshooting

### Swagger UI Not Loading

1. Check browser console for errors
2. Verify `/api/openapi` returns JSON:
   ```bash
   curl -H "x-admin-test-token: dev-admin-token" http://localhost:3000/api/openapi | head
   ```
3. Check CDN availability (Swagger UI loads from unpkg.com)

### YAML Parse Errors

If the spec fails to load:
1. Validate YAML syntax:
   ```bash
   npx js-yaml docs/api/openapi.yaml > /dev/null && echo "Valid YAML"
   ```
2. Check for indentation issues
3. Ensure quotes around special characters

### 401/403 Errors

- Verify you're logged in with admin role
- Check session cookie is set
- Try using `x-admin-test-token` header in development

## Related Documentation

- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) - Core principles
- [Auth and RBAC](../rbac/AUTH_AND_RBAC.md) - Authentication details
- [API Error Spec](../api/jwt-and-error-spec.md) - Error response format

---

*Last updated: December 2024*
