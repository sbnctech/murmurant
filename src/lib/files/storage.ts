/**
 * Storage Adapter Interface
 *
 * Copyright (c) Santa Barbara Newcomers Club
 *
 * Provides an abstraction layer for file storage backends.
 * Supports local filesystem (dev) and S3-compatible storage (production).
 *
 * Charter Principles:
 * - P9: Fail closed (validation before storage operations)
 * - Config-gated: S3 only enabled when credentials provided
 */

import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";

// ============================================================================
// Storage Adapter Interface
// ============================================================================

/**
 * Result of a file upload operation.
 */
export interface UploadResult {
  storageKey: string;
  checksum: string; // SHA-256 hash
  size: number;
}

/**
 * Result of a download operation.
 */
export interface DownloadResult {
  data: Buffer;
  mimeType?: string;
}

/**
 * File metadata for listing operations.
 */
export interface StoredFileInfo {
  storageKey: string;
  size: number;
  lastModified: Date;
}

/**
 * Storage adapter interface.
 * Implementations must be stateless and thread-safe.
 */
export interface StorageAdapter {
  /**
   * Upload a file to storage.
   * @param key - Unique storage key (path-like)
   * @param data - File contents
   * @param mimeType - MIME type for content-type headers
   * @returns Upload result with checksum
   */
  upload(key: string, data: Buffer, mimeType: string): Promise<UploadResult>;

  /**
   * Download a file from storage.
   * @param key - Storage key
   * @returns File data or null if not found
   */
  download(key: string): Promise<DownloadResult | null>;

  /**
   * Delete a file from storage.
   * @param key - Storage key
   * @returns true if deleted, false if not found
   */
  delete(key: string): Promise<boolean>;

  /**
   * Check if a file exists.
   * @param key - Storage key
   */
  exists(key: string): Promise<boolean>;

  /**
   * Generate a signed URL for direct download (if supported).
   * @param key - Storage key
   * @param expiresIn - URL expiration in seconds
   * @returns Signed URL or null if not supported
   */
  getSignedUrl?(key: string, expiresIn: number): Promise<string | null>;
}

// ============================================================================
// Local Filesystem Adapter (Development/Testing)
// ============================================================================

/**
 * Local filesystem storage adapter.
 * Used for development and testing when S3 is not configured.
 *
 * Files are stored in: {baseDir}/{key}
 */
export class LocalStorageAdapter implements StorageAdapter {
  private baseDir: string;

  constructor(baseDir: string = "./.file-storage") {
    this.baseDir = baseDir;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async upload(key: string, data: Buffer, mimeType: string): Promise<UploadResult> {
    const filePath = this.getFilePath(key);

    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Calculate checksum before writing
    const checksum = crypto.createHash("sha256").update(data).digest("hex");

    // Write file
    await fs.writeFile(filePath, data);

    return {
      storageKey: key,
      checksum,
      size: data.length,
    };
  }

  async download(key: string): Promise<DownloadResult | null> {
    const filePath = this.getFilePath(key);

    try {
      const data = await fs.readFile(filePath);
      return { data };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);

    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return false;
      }
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private getFilePath(key: string): string {
    // Sanitize key to prevent directory traversal
    const sanitizedKey = key.replace(/\.\./g, "").replace(/^\//, "");
    return path.join(this.baseDir, sanitizedKey);
  }
}

// ============================================================================
// S3-Compatible Storage Adapter
// ============================================================================

/**
 * S3-compatible storage configuration.
 */
export interface S3StorageConfig {
  bucket: string;
  region: string;
  endpoint?: string; // For S3-compatible services like MinIO
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * S3-compatible storage adapter.
 *
 * IMPORTANT: This adapter requires @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner
 * packages to be installed. These are optional dependencies.
 *
 * Install them with: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 *
 * The adapter uses dynamic imports to avoid bundling issues in dev environments
 * where S3 is not configured.
 */
export class S3StorageAdapter implements StorageAdapter {
  private config: S3StorageConfig;

  constructor(config: S3StorageConfig) {
    this.config = config;
  }

  private async getClient() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { S3Client } = require("@aws-sdk/client-s3");
      return new S3Client({
        region: this.config.region,
        endpoint: this.config.endpoint,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
      });
    } catch {
      throw new Error(
        "S3 storage requires @aws-sdk/client-s3. Install with: npm install @aws-sdk/client-s3"
      );
    }
  }

  async upload(key: string, data: Buffer, mimeType: string): Promise<UploadResult> {
    const checksum = crypto.createHash("sha256").update(data).digest("hex");

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

      const client = new S3Client({
        region: this.config.region,
        endpoint: this.config.endpoint,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
      });

      await client.send(
        new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
          Body: data,
          ContentType: mimeType,
        })
      );

      return {
        storageKey: key,
        checksum,
        size: data.length,
      };
    } catch (error) {
      if ((error as Error).message.includes("Cannot find module")) {
        throw new Error(
          "S3 storage requires @aws-sdk/client-s3. Install with: npm install @aws-sdk/client-s3"
        );
      }
      throw error;
    }
  }

  async download(key: string): Promise<DownloadResult | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

      const client = new S3Client({
        region: this.config.region,
        endpoint: this.config.endpoint,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
      });

      const response = await client.send(
        new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        })
      );

      if (!response.Body) {
        return null;
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      const stream = response.Body as AsyncIterable<Uint8Array>;
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      return {
        data: Buffer.concat(chunks),
        mimeType: response.ContentType,
      };
    } catch (error) {
      if ((error as Error).name === "NoSuchKey") {
        return null;
      }
      if ((error as Error).message.includes("Cannot find module")) {
        throw new Error(
          "S3 storage requires @aws-sdk/client-s3. Install with: npm install @aws-sdk/client-s3"
        );
      }
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");

      const client = new S3Client({
        region: this.config.region,
        endpoint: this.config.endpoint,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
      });

      await client.send(
        new DeleteObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");

      const client = new S3Client({
        region: this.config.region,
        endpoint: this.config.endpoint,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
      });

      await client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

      const client = new S3Client({
        region: this.config.region,
        endpoint: this.config.endpoint,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
      });

      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      return getSignedUrl(client, command, { expiresIn });
    } catch (error) {
      if ((error as Error).message.includes("Cannot find module")) {
        console.warn("S3 signed URLs require @aws-sdk/s3-request-presigner");
        return null;
      }
      throw error;
    }
  }
}

// ============================================================================
// Storage Factory
// ============================================================================

/**
 * Get the configured storage adapter.
 *
 * Uses environment variables to determine which adapter to use:
 * - S3 if FILE_STORAGE_S3_BUCKET is set
 * - Local filesystem otherwise
 *
 * Config-gated: S3 only used when all required env vars are present.
 */
export function getStorageAdapter(): StorageAdapter {
  const bucket = process.env.FILE_STORAGE_S3_BUCKET;
  const region = process.env.FILE_STORAGE_S3_REGION;
  const accessKeyId = process.env.FILE_STORAGE_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.FILE_STORAGE_S3_SECRET_ACCESS_KEY;

  // Use S3 if all required config is present
  if (bucket && region && accessKeyId && secretAccessKey) {
    return new S3StorageAdapter({
      bucket,
      region,
      endpoint: process.env.FILE_STORAGE_S3_ENDPOINT,
      accessKeyId,
      secretAccessKey,
    });
  }

  // Fall back to local storage
  const localDir = process.env.FILE_STORAGE_LOCAL_DIR || "./.file-storage";
  return new LocalStorageAdapter(localDir);
}

/**
 * Check if storage is configured for production (S3).
 */
export function isProductionStorage(): boolean {
  return !!process.env.FILE_STORAGE_S3_BUCKET;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique storage key for a file.
 * Format: {year}/{month}/{uuid}-{sanitized-filename}
 */
export function generateStorageKey(originalFilename: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const uuid = crypto.randomUUID();

  // Sanitize filename: remove path separators and limit length
  const sanitized = originalFilename
    .replace(/[/\\]/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100);

  return `${year}/${month}/${uuid}-${sanitized}`;
}

/**
 * Calculate SHA-256 checksum of data.
 */
export function calculateChecksum(data: Buffer): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Validate that a checksum matches the expected value.
 */
export function verifyChecksum(data: Buffer, expectedChecksum: string): boolean {
  const actual = calculateChecksum(data);
  return actual === expectedChecksum;
}
