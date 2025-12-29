# Murmurant File Storage System Overview

Copyright (c) Santa Barbara Newcomers Club

## Purpose

The file storage system provides a secure, audited mechanism for storing and managing files uploaded by club officers. It supports meeting minutes attachments, governance documents, and other file assets.

## Architecture

```
                    ┌─────────────────────────┐
                    │     API Endpoints       │
                    │  /api/admin/files/*     │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Authorization Layer   │
                    │   canAccessFile()       │
                    │   getAuthorizedFileIds()│
                    └────────────┬────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────▼─────────┐  ┌─────────▼─────────┐  ┌────────▼────────┐
│  File Metadata    │  │  Access Control   │  │  Tag System     │
│  (FileObject)     │  │  (FileAccess)     │  │  (FileTag)      │
│  Prisma/Postgres  │  │  Prisma/Postgres  │  │  Prisma/Postgres│
└───────────────────┘  └───────────────────┘  └─────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Storage Adapter       │
                    │   (Interface)           │
                    └────────────┬────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                                             │
┌─────────▼─────────┐                        ┌─────────▼─────────┐
│  LocalStorage     │                        │  S3Storage        │
│  (Development)    │                        │  (Production)     │
│  .file-storage/   │                        │  AWS S3/Minio     │
└───────────────────┘                        └───────────────────┘
```

## Components

### 1. Database Models

**FileObject** - Stores file metadata:
- `id` - Unique identifier (UUID)
- `name` - Original filename
- `mimeType` - MIME type (e.g., application/pdf)
- `size` - File size in bytes
- `checksum` - SHA-256 hash for integrity verification
- `storageKey` - Path in storage backend
- `description` - Optional description
- `isPublic` - If true, all authenticated users can read
- `uploadedById` - Member who uploaded the file

**FileAccess** - Access control entries:
- `fileId` - Reference to FileObject
- `principalType` - USER, ROLE, or GROUP
- `principalId` - Member ID, role name, or group ID
- `permission` - READ, WRITE, or ADMIN
- `expiresAt` - Optional expiration date

**FileTag** - File categorization:
- `fileId` - Reference to FileObject
- `tag` - Tag string (e.g., "minutes", "financial")

### 2. Storage Adapters

The storage layer uses an adapter pattern to support multiple backends:

- **LocalStorageAdapter** - Stores files in `.file-storage/` directory. Used for development and testing.

- **S3StorageAdapter** - Stores files in S3-compatible storage. Used in production when configured.

Storage key format: `{year}/{month}/{uuid}-{sanitized-filename}`

### 3. Authorization Layer

See [SECURITY_MODEL.md](./SECURITY_MODEL.md) for detailed access control documentation.

### 4. API Endpoints

| Method | Path | Purpose | Capability |
|--------|------|---------|------------|
| POST | `/api/admin/files` | Upload a file | `files:upload` |
| GET | `/api/admin/files/authorized` | List accessible files | Authentication |
| GET | `/api/admin/files/:id` | Get file metadata | READ permission |
| PATCH | `/api/admin/files/:id` | Update metadata | WRITE permission |
| DELETE | `/api/admin/files/:id` | Delete file | ADMIN permission |

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FILE_STORAGE_S3_BUCKET` | S3 bucket name | (none, uses local) |
| `FILE_STORAGE_S3_REGION` | AWS region | (required for S3) |
| `FILE_STORAGE_S3_ACCESS_KEY_ID` | AWS access key | (required for S3) |
| `FILE_STORAGE_S3_SECRET_ACCESS_KEY` | AWS secret key | (required for S3) |
| `FILE_STORAGE_S3_ENDPOINT` | Custom S3 endpoint | (optional, for MinIO) |
| `FILE_STORAGE_LOCAL_DIR` | Local storage path | `.file-storage` |

S3 storage is only enabled when all required S3 environment variables are set.

## Usage Examples

### Uploading a File

```typescript
import { createFile } from "@/lib/files";

const fileData = Buffer.from(/* file contents */);
const file = await createFile(
  {
    name: "meeting-minutes.pdf",
    mimeType: "application/pdf",
    description: "January 2025 board meeting minutes",
    isPublic: false,
    tags: ["minutes", "board"],
  },
  fileData,
  memberId
);
```

### Checking Access

```typescript
import { canAccessFile, getAuthorizedFileIds } from "@/lib/files";

// Check specific file access
const hasAccess = await canAccessFile(fileId, memberId, memberRole, "READ");

// Get all accessible files
const fileIds = await getAuthorizedFileIds(memberId, memberRole);
```

### Granting Access

```typescript
import { grantFileAccess } from "@/lib/files";

// Grant READ to a specific user
await grantFileAccess(fileId, "USER", targetMemberId, "READ", grantedById);

// Grant READ to all secretaries
await grantFileAccess(fileId, "ROLE", "secretary", "READ", grantedById);
```

## Related Documentation

- [SECURITY_MODEL.md](./SECURITY_MODEL.md) - Access control and security details
- [ARCHITECTURAL_CHARTER.md](../ARCHITECTURAL_CHARTER.md) - System-wide principles
