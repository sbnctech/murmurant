# Worker 3 (W3) — Photo Storage Provider Abstraction

**Purpose**: Define a storage abstraction layer for photo binaries
**Audience**: Tech Chair, Development Team
**Status**: Interface-only (stubs, no implementation)

---

## Overview

ClubOS needs to store event photos. Rather than hardcode a specific storage backend, we define an abstraction layer that allows photos to be stored:

- **Locally** (development, small deployments)
- **Externally** (SmugMug, future: S3, etc.)

The core application logic remains unchanged regardless of which storage provider is active.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Photo Service Layer                      │
│                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│   │    RBAC     │    │   Privacy   │    │   Logging   │     │
│   │   Checks    │    │   Filters   │    │   & Audit   │     │
│   └─────────────┘    └─────────────┘    └─────────────┘     │
│                              │                               │
└──────────────────────────────┼───────────────────────────────┘
                               │
                               ▼
              ┌────────────────────────────────┐
              │    PhotoStorageProvider        │
              │         (Interface)            │
              └────────────────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
              ▼                                 ▼
   ┌──────────────────┐              ┌──────────────────┐
   │  LocalDiskProvider│              │  SmugMugProvider │
   │                  │              │                  │
   │  /uploads/photos │              │  SmugMug API     │
   │  (filesystem)    │              │  (external CDN)  │
   └──────────────────┘              └──────────────────┘
```

---

## Design Principles

### 1. RBAC Lives Outside Providers

**Critical Rule**: Permission checks NEVER happen inside storage providers.

The provider's job is to store and retrieve bytes. Access control is enforced at the service layer before calling any provider method.

```typescript
// CORRECT: Check permissions in service, then call provider
async function getPhotoUrl(photoId: string, user: User): Promise<string> {
  const photo = await photoRepository.findById(photoId);

  // RBAC check at service layer
  if (!canViewPhoto(user, photo)) {
    throw new ForbiddenError('You cannot view this photo');
  }

  // Provider just returns the URL
  return provider.getOriginalUrl(photoId);
}
```

### 2. URL-Based Retrieval

Providers return URLs, not binary streams. This allows:

- Direct browser fetching (no proxy overhead)
- CDN caching (for external providers)
- Lazy loading in galleries

### 3. Event-Scoped Organization

Photos are organized by event. The `listPhotosByEvent()` method is the primary listing mechanism.

### 4. No Authentication Logic

Providers do not handle authentication. For external services like SmugMug:

- OAuth tokens are managed at the application level
- Providers receive pre-authenticated clients
- No API keys stored in provider code

---

## Interface Summary

```typescript
interface PhotoStorageProvider {
  readonly name: string;

  // URL retrieval
  getOriginalUrl(photoId: string): Promise<string>;
  getThumbnailUrl(photoId: string, size: ThumbnailSize): Promise<string>;

  // Listing
  listPhotosByEvent(options: ListPhotosOptions): Promise<ListPhotosResult>;

  // Administration
  deletePhoto(photoId: string): Promise<void>;
  healthCheck(): Promise<boolean>;
}
```

### Thumbnail Sizes

| Size | Dimensions | Use Case |
|------|------------|----------|
| `small` | 150×150 | Grid thumbnails, avatars |
| `medium` | 400×400 | Gallery previews |
| `large` | 800×800 | Lightbox, detail view |

---

## Provider Implementations

### LocalDiskProvider

**Status**: Stub (methods throw `NotImplementedError`)

Stores photos on the local filesystem. Suitable for:

- Development environments
- Small-scale deployments
- Self-hosted instances

**File Structure** (planned):

```
/uploads/photos/
├── originals/
│   ├── {photoId}.jpg
│   └── ...
└── thumbnails/
    ├── small/
    │   └── {photoId}.jpg
    ├── medium/
    │   └── {photoId}.jpg
    └── large/
        └── {photoId}.jpg
```

**Configuration**:

```typescript
const provider = new LocalDiskProvider({
  basePath: '/var/clubos/uploads/photos',
  baseUrl: '/api/photos',
});
```

### SmugMugProvider

**Status**: Stub (methods throw `NotImplementedError`)

Integrates with SmugMug for external photo hosting. Benefits:

- Professional-grade photo hosting
- Built-in CDN
- Automatic thumbnail generation
- Existing club SmugMug account

**SmugMug Concepts**:

| ClubOS | SmugMug |
|--------|---------|
| Event | Album |
| Photo | Image |
| Photo ID | ImageKey |

**Configuration**:

```typescript
const provider = new SmugMugProvider({
  nickname: 'sbnewcomers',
  baseFolderUri: '/api/v2/folder/user/sbnewcomers/ClubOS-Events',
});
```

---

## Error Handling

### Error Types

| Error | When Thrown |
|-------|-------------|
| `PhotoNotFoundError` | Photo ID doesn't exist in storage |
| `NotImplementedError` | Method not yet implemented (stubs) |
| `PhotoStorageError` | Base class for storage errors |

### Example

```typescript
try {
  const url = await provider.getOriginalUrl('nonexistent-id');
} catch (error) {
  if (error instanceof PhotoNotFoundError) {
    // Photo doesn't exist
    return res.status(404).json({ error: 'Photo not found' });
  }
  throw error;
}
```

---

## Future Providers

The abstraction supports adding new providers:

- **S3Provider** - AWS S3 or compatible (MinIO, DigitalOcean Spaces)
- **CloudinaryProvider** - Cloudinary image management
- **GooglePhotosProvider** - Google Photos API

Each provider implements the same interface, allowing seamless switching.

---

## Implementation Roadmap

### Phase 1: Interface Definition (Current)

- [x] Define `PhotoStorageProvider` interface
- [x] Create `LocalDiskProvider` stub
- [x] Create `SmugMugProvider` stub
- [x] Document architecture

### Phase 2: Local Development

- [ ] Implement `LocalDiskProvider` fully
- [ ] Add thumbnail generation (Sharp)
- [ ] Wire up to photo upload API
- [ ] Add photo service layer with RBAC

### Phase 3: SmugMug Integration

- [ ] Implement SmugMug OAuth flow
- [ ] Implement `SmugMugProvider` API calls
- [ ] Map events to SmugMug albums
- [ ] Handle SmugMug webhooks (optional)

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/photos/storage/PhotoStorageProvider.ts` | Interface definition |
| `src/lib/photos/storage/LocalDiskProvider.ts` | Local filesystem provider |
| `src/lib/photos/storage/SmugMugProvider.ts` | SmugMug integration |
| `src/lib/photos/storage/index.ts` | Module exports |

---

## Related Documents

- SYSTEM_SPEC.md - Photo gallery requirements
- docs/widgets/PHOTO_GALLERY_WIDGET.md - Gallery widget specification (future)

---

*Document maintained by ClubOS development team. Last updated: December 2024*
