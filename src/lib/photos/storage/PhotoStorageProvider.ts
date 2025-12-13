/**
 * PhotoStorageProvider Interface
 *
 * Abstraction layer for photo binary storage. Allows ClubOS to store photos
 * locally or externally (e.g., SmugMug) without changing core logic.
 *
 * ## Design Principles
 *
 * 1. **No authentication logic** - Providers handle storage only, not access control
 * 2. **RBAC lives outside** - Privacy and permission checks are NOT in providers
 * 3. **URL-based retrieval** - Providers return URLs, not binary streams
 * 4. **Event-scoped listing** - Photos are organized by event
 *
 * @example
 * ```typescript
 * const provider = getPhotoStorageProvider();
 * const url = await provider.getOriginalUrl('photo-123');
 * ```
 */

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Metadata for a photo asset
 */
export interface PhotoAsset {
  /** Unique identifier for the photo */
  id: string;

  /** Event this photo belongs to (nullable for non-event photos) */
  eventId: string | null;

  /** Original filename as uploaded */
  filename: string;

  /** MIME type (e.g., 'image/jpeg', 'image/png') */
  mimeType: string;

  /** File size in bytes */
  sizeBytes: number;

  /** When the photo was uploaded */
  uploadedAt: Date;

  /** Width in pixels (if known) */
  width?: number;

  /** Height in pixels (if known) */
  height?: number;
}

/**
 * Options for listing photos
 */
export interface ListPhotosOptions {
  /** Filter by event ID */
  eventId: string;

  /** Maximum number of results */
  limit?: number;

  /** Pagination cursor */
  cursor?: string;
}

/**
 * Paginated result for photo listings
 */
export interface ListPhotosResult {
  /** Photos in this page */
  photos: PhotoAsset[];

  /** Cursor for next page (null if no more) */
  nextCursor: string | null;

  /** Total count (if available) */
  totalCount?: number;
}

/**
 * Thumbnail size presets
 */
export type ThumbnailSize = 'small' | 'medium' | 'large';

/**
 * Thumbnail dimensions by size
 */
export const THUMBNAIL_DIMENSIONS: Record<ThumbnailSize, { width: number; height: number }> = {
  small: { width: 150, height: 150 },
  medium: { width: 400, height: 400 },
  large: { width: 800, height: 800 },
};

// -----------------------------------------------------------------------------
// Errors
// -----------------------------------------------------------------------------

/**
 * Base error for photo storage operations
 */
export class PhotoStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PhotoStorageError';
  }
}

/**
 * Thrown when a photo asset is not found
 */
export class PhotoNotFoundError extends PhotoStorageError {
  constructor(photoId: string) {
    super(`Photo not found: ${photoId}`);
    this.name = 'PhotoNotFoundError';
  }
}

/**
 * Thrown when a method is not implemented by a provider
 */
export class NotImplementedError extends PhotoStorageError {
  constructor(method: string, provider: string) {
    super(`${method} is not implemented by ${provider}`);
    this.name = 'NotImplementedError';
  }
}

// -----------------------------------------------------------------------------
// Interface
// -----------------------------------------------------------------------------

/**
 * Photo storage provider interface
 *
 * Implementations handle the physical storage of photo binaries.
 * All access control and privacy checks happen OUTSIDE this interface.
 *
 * ## IMPORTANT
 * - Providers do NOT check permissions
 * - Providers do NOT handle authentication
 * - RBAC is enforced at the service layer, not here
 */
export interface PhotoStorageProvider {
  /**
   * Provider name for logging and debugging
   */
  readonly name: string;

  /**
   * Get the URL for the original (full-size) photo
   *
   * @param photoId - Unique identifier for the photo
   * @returns URL to the original image
   * @throws PhotoNotFoundError if photo doesn't exist
   */
  getOriginalUrl(photoId: string): Promise<string>;

  /**
   * Get the URL for a thumbnail version of the photo
   *
   * @param photoId - Unique identifier for the photo
   * @param size - Thumbnail size preset
   * @returns URL to the thumbnail image
   * @throws PhotoNotFoundError if photo doesn't exist
   */
  getThumbnailUrl(photoId: string, size: ThumbnailSize): Promise<string>;

  /**
   * List photos for a specific event
   *
   * @param options - Filtering and pagination options
   * @returns Paginated list of photo assets
   */
  listPhotosByEvent(options: ListPhotosOptions): Promise<ListPhotosResult>;

  /**
   * Delete a photo asset
   *
   * **Note**: This is a storage-level delete only. RBAC checks (admin-only)
   * must be enforced at the service layer before calling this method.
   *
   * @param photoId - Unique identifier for the photo
   * @throws PhotoNotFoundError if photo doesn't exist
   */
  deletePhoto(photoId: string): Promise<void>;

  /**
   * Check if provider is properly configured and accessible
   *
   * @returns true if provider is ready, false otherwise
   */
  healthCheck(): Promise<boolean>;
}
