/**
 * File Storage Library
 *
 * Copyright © 2025 Murmurant, Inc.
 *
 * Secure file storage with access control.
 */

// Storage adapters
export {
  type StorageAdapter,
  type UploadResult,
  type DownloadResult,
  LocalStorageAdapter,
  S3StorageAdapter,
  getStorageAdapter,
  isProductionStorage,
  generateStorageKey,
  calculateChecksum,
  verifyChecksum,
} from "./storage";

// File CRUD operations
export {
  createFile,
  getFileById,
  getFileByStorageKey,
  listFiles,
  getAuthorizedFiles,
  updateFile,
  deleteFile,
  downloadFile,
  addFileTag,
  removeFileTag,
  listAllTags,
  getFilesByTag,
} from "./files";

// Authorization
export {
  canAccessFile,
  getAuthorizedFileIds,
  getEffectivePermission,
  grantFileAccess,
  revokeFileAccess,
  listFileAccess,
} from "./authorization";

// Schemas and types
export {
  createFileSchema,
  updateFileSchema,
  grantAccessSchema,
  revokeAccessSchema,
  addTagSchema,
  fileFiltersSchema,
  paginationSchema,
  type CreateFileInput,
  type UpdateFileInput,
  type GrantAccessInput,
  type RevokeAccessInput,
  type AddTagInput,
  type FileFilters,
  type PaginationInput,
} from "./schemas";
