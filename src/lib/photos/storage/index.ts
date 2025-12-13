/**
 * Photo Storage Module
 *
 * Provides a provider-agnostic interface for storing and retrieving photos.
 *
 * ## Usage
 *
 * ```typescript
 * import { PhotoStorageProvider, LocalDiskProvider } from '@/lib/photos/storage';
 *
 * const provider: PhotoStorageProvider = new LocalDiskProvider({
 *   basePath: '/uploads/photos',
 *   baseUrl: '/api/photos',
 * });
 *
 * const url = await provider.getOriginalUrl('photo-123');
 * ```
 *
 * ## IMPORTANT: RBAC Enforcement
 *
 * Providers do NOT enforce access control. All permission checks must happen
 * at the service layer BEFORE calling provider methods.
 */

// Interface and types
export type {
  PhotoStorageProvider,
  PhotoAsset,
  ListPhotosOptions,
  ListPhotosResult,
  ThumbnailSize,
} from './PhotoStorageProvider';

export {
  THUMBNAIL_DIMENSIONS,
  PhotoStorageError,
  PhotoNotFoundError,
  NotImplementedError,
} from './PhotoStorageProvider';

// Provider implementations
export { LocalDiskProvider } from './LocalDiskProvider';
export type { LocalDiskProviderConfig } from './LocalDiskProvider';

export { SmugMugProvider } from './SmugMugProvider';
export type { SmugMugProviderConfig } from './SmugMugProvider';
