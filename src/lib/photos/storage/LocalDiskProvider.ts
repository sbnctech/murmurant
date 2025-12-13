/**
 * LocalDiskProvider
 *
 * Photo storage provider that stores images on the local filesystem.
 * Intended for development and small-scale deployments.
 *
 * ## Status: STUB
 * This is an interface-only implementation. Methods throw NotImplementedError.
 *
 * ## Future Implementation Notes
 * - Store originals in: /uploads/photos/originals/{photoId}.{ext}
 * - Store thumbnails in: /uploads/photos/thumbnails/{size}/{photoId}.{ext}
 * - Use Sharp or similar for thumbnail generation
 * - Return URLs like: /api/photos/{photoId}/original
 */

import {
  PhotoStorageProvider,
  type ListPhotosOptions,
  type ListPhotosResult,
  type ThumbnailSize,
  NotImplementedError,
} from './PhotoStorageProvider';

/**
 * Configuration for LocalDiskProvider
 */
export interface LocalDiskProviderConfig {
  /** Base directory for photo storage */
  basePath: string;

  /** Base URL for serving photos (e.g., '/api/photos') */
  baseUrl: string;
}

/**
 * Local filesystem photo storage provider
 *
 * Stores photos on the local disk. Suitable for development
 * and small deployments where external storage is not needed.
 */
export class LocalDiskProvider implements PhotoStorageProvider {
  readonly name = 'LocalDiskProvider';

  private config: LocalDiskProviderConfig;

  constructor(config: LocalDiskProviderConfig) {
    this.config = config;
  }

  /**
   * Get the URL for the original photo
   * @throws NotImplementedError - Stub implementation
   */
  async getOriginalUrl(_photoId: string): Promise<string> {
    // Future: return `${this.config.baseUrl}/${_photoId}/original`
    throw new NotImplementedError('getOriginalUrl', this.name);
  }

  /**
   * Get the URL for a thumbnail
   * @throws NotImplementedError - Stub implementation
   */
  async getThumbnailUrl(_photoId: string, _size: ThumbnailSize): Promise<string> {
    // Future: return `${this.config.baseUrl}/${_photoId}/thumbnail/${_size}`
    throw new NotImplementedError('getThumbnailUrl', this.name);
  }

  /**
   * List photos for an event
   * @throws NotImplementedError - Stub implementation
   */
  async listPhotosByEvent(_options: ListPhotosOptions): Promise<ListPhotosResult> {
    // Future: Read from filesystem, filter by eventId from metadata
    throw new NotImplementedError('listPhotosByEvent', this.name);
  }

  /**
   * Delete a photo from disk
   * @throws NotImplementedError - Stub implementation
   */
  async deletePhoto(_photoId: string): Promise<void> {
    // Future: Delete original and all thumbnails from disk
    throw new NotImplementedError('deletePhoto', this.name);
  }

  /**
   * Check if the storage directory is accessible
   * @throws NotImplementedError - Stub implementation
   */
  async healthCheck(): Promise<boolean> {
    // Future: Check if basePath exists and is writable
    throw new NotImplementedError('healthCheck', this.name);
  }
}
