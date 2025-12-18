/**
 * File Storage Service
 *
 * Handles local filesystem storage for uploaded files.
 * Files are stored with UUID-based keys to prevent conflicts.
 *
 * Charter Principles:
 * - P7: Observability - log all storage operations
 * - P9: Fail closed - errors must not expose paths
 */

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

/**
 * Base directory for file storage.
 * Configurable via FILE_STORAGE_PATH env var.
 * Defaults to ./storage/files in the project root.
 */
function getStorageBasePath(): string {
  return process.env.FILE_STORAGE_PATH || path.join(process.cwd(), "storage", "files");
}

/**
 * Ensure storage directory exists.
 */
async function ensureStorageDir(): Promise<void> {
  const basePath = getStorageBasePath();
  await fs.mkdir(basePath, { recursive: true });
}

/**
 * Generate a storage key for a new file.
 * Uses UUID v4 with original extension preserved.
 */
export function generateStorageKey(originalFilename: string): string {
  const ext = path.extname(originalFilename).toLowerCase();
  const uuid = crypto.randomUUID();
  // Organize by year/month for easier cleanup
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}/${month}/${uuid}${ext}`;
}

/**
 * Calculate SHA-256 checksum of file data.
 */
export function calculateChecksum(data: Buffer): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Store a file to the filesystem.
 *
 * @param storageKey - The unique storage key (path within storage)
 * @param data - File contents as Buffer
 * @returns Full path to stored file (for internal use only)
 */
export async function storeFile(storageKey: string, data: Buffer): Promise<string> {
  await ensureStorageDir();

  const basePath = getStorageBasePath();
  const filePath = path.join(basePath, storageKey);
  const dirPath = path.dirname(filePath);

  // Ensure subdirectory exists
  await fs.mkdir(dirPath, { recursive: true });

  // Write file atomically (write to temp, then rename)
  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, data);
  await fs.rename(tempPath, filePath);

  console.log(`[FILE_STORAGE] Stored file: ${storageKey} (${data.length} bytes)`);

  return filePath;
}

/**
 * Read a file from storage.
 *
 * @param storageKey - The storage key
 * @returns File contents as Buffer, or null if not found
 */
export async function readFile(storageKey: string): Promise<Buffer | null> {
  const basePath = getStorageBasePath();
  const filePath = path.join(basePath, storageKey);

  try {
    const data = await fs.readFile(filePath);
    console.log(`[FILE_STORAGE] Read file: ${storageKey} (${data.length} bytes)`);
    return data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.warn(`[FILE_STORAGE] File not found: ${storageKey}`);
      return null;
    }
    throw error;
  }
}

/**
 * Delete a file from storage.
 *
 * @param storageKey - The storage key
 * @returns true if deleted, false if not found
 */
export async function deleteFile(storageKey: string): Promise<boolean> {
  const basePath = getStorageBasePath();
  const filePath = path.join(basePath, storageKey);

  try {
    await fs.unlink(filePath);
    console.log(`[FILE_STORAGE] Deleted file: ${storageKey}`);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.warn(`[FILE_STORAGE] File not found for deletion: ${storageKey}`);
      return false;
    }
    throw error;
  }
}

/**
 * Check if a file exists in storage.
 */
export async function fileExists(storageKey: string): Promise<boolean> {
  const basePath = getStorageBasePath();
  const filePath = path.join(basePath, storageKey);

  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file stats (size, modification time).
 */
export async function getFileStats(
  storageKey: string
): Promise<{ size: number; modifiedAt: Date } | null> {
  const basePath = getStorageBasePath();
  const filePath = path.join(basePath, storageKey);

  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      modifiedAt: stats.mtime,
    };
  } catch {
    return null;
  }
}

/**
 * Allowed MIME types for upload.
 * Restricts to common document and image types.
 */
export const ALLOWED_MIME_TYPES = new Set([
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "text/markdown",
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

/**
 * Maximum file size in bytes (default 10MB).
 */
export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_BYTES || "10485760", 10);

/**
 * Validate file for upload.
 *
 * @returns Error message if invalid, null if valid
 */
export function validateFile(
  mimeType: string,
  size: number
): string | null {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return `File type not allowed: ${mimeType}`;
  }

  if (size > MAX_FILE_SIZE) {
    return `File too large: ${size} bytes (max ${MAX_FILE_SIZE})`;
  }

  if (size === 0) {
    return "File is empty";
  }

  return null;
}

/**
 * Sanitize filename for storage.
 * Removes path traversal attempts and special characters.
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  const name = path.basename(filename);

  // Replace special characters with underscore
  const sanitized = name.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Limit length
  if (sanitized.length > 255) {
    const ext = path.extname(sanitized);
    const base = path.basename(sanitized, ext);
    return base.slice(0, 255 - ext.length) + ext;
  }

  return sanitized;
}
