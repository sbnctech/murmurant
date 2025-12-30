/**
 * Wild Apricot Importer Module
 *
 * Main exports for the WA import system.
 */

// Client
export { WildApricotClient, createWAClient, createWAClientWithConfig } from "./client";

// Config
export {
  loadWAConfig,
  isDryRun,
  isProductionImportAllowed,
  validateProductionSafety,
  getSystemActor,
} from "./config";
export type { WAConfig } from "./config";

// Types
export type {
  WAContact,
  WAContactStatus,
  WAContactField,
  WAFieldType,
  WAFieldAccess,
  WAEvent,
  WAEventRegistration,
  WAMembershipLevel,
  SyncResult,
  SyncStats,
  SyncError,
  RegistrationDiagnostics,
  SyncReport,
  SyncWarning,
} from "./types";

// Exceptions
export { WAApiException, WAAsyncQueryException, WATokenException } from "./types";

// Transformers
export {
  transformContact,
  transformEvent,
  transformRegistration,
  mapContactStatusToCode,
  mapRegistrationStatus,
  extractFieldValue,
  extractPhone,
  normalizeEmail,
  parseDate,
  deriveCategory,
} from "./transformers";

// Importer
export {
  fullSync,
  incrementalSync,
  runPreflightChecks,
  detectStaleRecords,
  getStaleRecordCounts,
  cleanupStaleMappings,
  probeEventRegistrations,
  generateSyncReport,
  writeSyncReport,
} from "./importer";
export type { PreflightResult, StaleRecord, StaleDetectionResult, ProbeResult } from "./importer";

// Resources (WA file migration)
export {
  extractWaUrls,
  discoverResources,
  downloadResource,
  downloadPendingResources,
  retryFailedDownloads,
  getResourceStats,
  getPendingResources,
  getFailedResources,
  skipResource,
  getInternalUrl,
  buildUrlMappingTable,
} from "./resources";
export type { DiscoveredResource, ResourceStats, DownloadResult } from "./resources";

// Field Mapper (custom field handling)
export {
  syncWaFieldDefinitions,
  getWaFieldDefinitions,
  setFieldMapping,
  getFieldMappings,
  clearFieldMapping,
  applyDefaultMappings,
  buildFieldMappingLookup,
  storeCustomFieldValue,
  getMemberCustomFields,
  getFieldMappingStats,
  MURMURANT_MEMBER_FIELDS,
} from "./field-mapper";
export type { FieldSyncResult, MappingType, FieldMappingInput, FieldMappingStats } from "./field-mapper";

// Profile Photos
export {
  extractPhotoUrl,
  importMemberPhoto,
  importAllMemberPhotos,
  getPhotoImportStats,
} from "./photos";
export type { PhotoImportResult, PhotoImportStats } from "./photos";

// URL Rewriter
export {
  rewriteContent,
  rewriteEventUrls,
  rewritePageUrls,
  rewriteAllUrls,
  scanForWaUrls,
} from "./url-rewriter";
export type {
  RewriteResult,
  EntityRewriteResult,
  FullRewriteResult,
  ScanResult,
} from "./url-rewriter";
