# ClubOS File Storage Security Model

Copyright (c) Santa Barbara Newcomers Club

## Charter Alignment

This security model implements the following Charter principles:

- **P1: Identity must be provable** - All uploads tracked by `uploadedById`, all grants tracked by `grantedById`
- **P2: Default deny, least privilege** - No access without explicit grant or ownership
- **P7: Full audit trail** - All mutations logged via `auditMutation()`
- **P9: Fail closed** - Missing file or authorization returns denial, not error details

## Permission Hierarchy

The file system uses a three-level permission model:

```
ADMIN
  │
  ├── Can delete the file
  ├── Can manage access grants
  └── Includes WRITE
        │
        ├── Can update file metadata
        └── Includes READ
              │
              └── Can view and download the file
```

Higher permissions implicitly include lower permissions. A user with ADMIN can perform all READ and WRITE operations.

## Access Grant Sources

Access to a file can be granted through multiple sources. The system checks in this order:

### 1. Admin Bypass

Users with the `admin:full` capability bypass all access checks and have ADMIN permission on all files.

### 2. Uploader Implicit Admin

The member who uploaded a file (`uploadedById`) always has implicit ADMIN permission, regardless of explicit grants. This ensures uploaders can always manage their own files.

### 3. Public Flag

Files with `isPublic: true` grant READ permission to all authenticated users. This does not grant WRITE or ADMIN.

### 4. USER Principal Grants

Direct grants to specific users via `FileAccess` entries:

```
principalType: USER
principalId: <member-uuid>
permission: READ | WRITE | ADMIN
```

### 5. ROLE Principal Grants

Grants to all members with a specific role:

```
principalType: ROLE
principalId: admin | secretary | parliamentarian | ...
permission: READ | WRITE | ADMIN
```

### 6. GROUP Principal Grants (Future)

Reserved for committee-based access:

```
principalType: GROUP
principalId: <committee-uuid>
permission: READ | WRITE | ADMIN
```

## Expiring Grants

Access grants can have an optional `expiresAt` timestamp. Expired grants are automatically excluded from authorization checks. A `null` expiration means the grant never expires.

## Capabilities Required

| Operation | Required Capability |
|-----------|---------------------|
| Upload files | `files:upload` |
| Manage all files | `files:manage` |
| View any file | `files:view_all` |

### Role Capability Matrix

| Role | files:upload | files:manage | files:view_all |
|------|--------------|--------------|----------------|
| admin | Yes | Yes | Yes |
| secretary | Yes | No | No |
| parliamentarian | Yes | No | No |
| webmaster | No | No | No |
| member | No | No | No |

## IDOR Prevention

The system prevents Insecure Direct Object Reference (IDOR) attacks through:

1. **Authorization Before Data** - `canAccessFile()` is called before `getFileById()`. The access check uses only the file ID, not file data.

2. **Consistent Error Messages** - Both "file not found" and "access denied" return the same 404 response: `"File not found or access denied"`. This prevents attackers from discovering file existence.

3. **Boolean Returns** - Authorization functions return `true/false`, not file data. Data is fetched separately only after authorization succeeds.

4. **ID-Based Filtering** - `getAuthorizedFileIds()` returns only file IDs the user can access. The file list is then filtered to these IDs.

## Security Functions

### canAccessFile()

```typescript
async function canAccessFile(
  fileId: string,
  memberId: string,
  memberRole: GlobalRole,
  requiredPermission: FilePermission
): Promise<boolean>
```

Checks if a member can access a specific file with the required permission level. Returns `false` for non-existent files (fail closed).

### getAuthorizedFileIds()

```typescript
async function getAuthorizedFileIds(
  memberId: string,
  memberRole: GlobalRole
): Promise<string[]>
```

Returns all file IDs the member is authorized to access with at least READ permission. Used for listing endpoints.

### getEffectivePermission()

```typescript
async function getEffectivePermission(
  fileId: string,
  memberId: string,
  memberRole: GlobalRole
): Promise<FilePermission | null>
```

Returns the highest permission level the member has on a file, or `null` if no access.

## Permission Escalation Prevention

Users cannot grant permissions higher than their own:

1. Only users with ADMIN permission on a file can manage its access grants
2. The `files:manage` capability allows managing any file's access
3. Role-based grants require the granting user to have appropriate file permission

## Audit Trail

All file mutations are logged through the audit system:

- **CREATE** - File uploaded (includes filename, mime type, size)
- **UPDATE** - File metadata changed (includes changed fields)
- **DELETE** - File deleted (includes original filename and metadata)
- **GRANT** - Access granted (includes principal and permission)
- **REVOKE** - Access revoked (includes principal and permission)

## Implementation Checklist

When implementing file-related features, verify:

- [ ] Authorization checked before any data access
- [ ] `canAccessFile()` called with correct permission level
- [ ] Non-existent files return same response as unauthorized
- [ ] All mutations call `auditMutation()`
- [ ] Capability requirements enforced via `requireCapability()`
- [ ] Expiration dates checked for access grants
- [ ] Public flag only grants READ, not WRITE or ADMIN

## Related Documentation

- [FILESYSTEM_OVERVIEW.md](./FILESYSTEM_OVERVIEW.md) - System architecture and usage
- [ARCHITECTURAL_CHARTER.md](../ARCHITECTURAL_CHARTER.md) - System-wide principles
