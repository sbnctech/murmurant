// Copyright © 2025 Murmurant, Inc. All rights reserved.
/**
 * Wild Apricot Integration Module
 *
 * This module provides a secure, typed interface to the Wild Apricot API
 * for the hybrid migration period where WA remains the source of truth.
 *
 * Features:
 * - Typed API client with automatic pagination
 * - Rate limiting and circuit breaker
 * - Full audit logging
 * - Input validation and sanitization
 * - Webhook handling with signature verification
 *
 * Charter: P7 (observability), P9 (fail closed), N5 (audit mutations)
 *
 * @module lib/wa
 */

// Configuration
export {
  loadWaConfig,
  getWaConfigSafe,
  isWaEnabled,
  WaConfigError,
  WA_MAX_REQUEST_SIZE,
  WA_MAX_RECORDS_PER_REQUEST,
  WA_SENSITIVE_FIELDS,
  isSensitiveField,
} from "./config";
export type { WaConfig } from "./config";

// Types
export type {
  // Auth
  WaTokenResponse,
  WaSession,

  // Contacts
  WaContact,
  WaMembershipLevel,
  WaMembershipStatus,
  WaFieldValue,
  WaContactRequest,

  // Events
  WaEvent,
  WaEventRegistration,
  WaRegistrationRequest,

  // API Responses
  WaPaginatedResponse,
  WaErrorResponse,

  // Sync
  WaSyncStatus,
  WaPendingWrite,
} from "./types";

// Security
export {
  // Rate limiting
  checkRateLimit,
  resetRateLimit,
  DEFAULT_RATE_LIMITS,

  // Validation
  validateEmail,
  validateWaId,
  validateStringLength,
  validatePayloadSize,
  validateArrayLength,
  WaValidationError,

  // Sanitization
  sanitizeForLog,
  redactSensitiveData,
  sanitizeHtml,
  sanitizeWaError,

  // Authorization
  WA_OPERATION_PERMISSIONS,
  isOperationAllowed,
} from "./security";
export type { RateLimitConfig, RateLimitResult } from "./security";

// Audit
export {
  logWaOperation,
  auditWaRead,
  auditWaWrite,
  auditWaAuth,
  auditWaError,
  getWaMetrics,
} from "./audit";
export type { WaOperationType, WaAuditEntry, WaMetricsSummary } from "./audit";

// Client
export { WaClient, getWaClient, resetWaClient } from "./client";
export type {
  PaginationOptions,
  PaginatedResult,
  ContactFilter,
  EventFilter,
} from "./client";

// Webhooks
export {
  // Validation
  validateWebhook,
  verifyWebhookSignature,
  generateWebhookSignature,

  // Idempotency
  isWebhookProcessed,
  markWebhookProcessed,
  generateIdempotencyKey,

  // Handler registration
  onWebhook,
  processWebhook,

  // Retry
  calculateRetryDelay,
  DEFAULT_WEBHOOK_RETRY,
} from "./webhooks";
export type {
  ValidatedWebhookEvent,
  WebhookHandler,
  WebhookRetryConfig,
  WaWebhookEventType,
  WaWebhookPayload,
} from "./webhooks";

// Member Sync (F3 - Read-Through Cache)
export {
  // Core operations
  getMember,
  getMembers,
  searchMembers,
  refreshMember,

  // Cache management
  getMemberCache,
  resetMemberCache,
  invalidateMember,
  invalidateAllMembers,

  // Background sync
  incrementalSync,
  startBackgroundSync,
  stopBackgroundSync,
  getSyncStatus,

  // Staleness helpers
  getStalenessIndicator,
  getStalenessLabel,

  // Config
  DEFAULT_MEMBER_CACHE_CONFIG,
} from "./memberSync";
export type {
  CachedData,
  CacheSource,
  MemberCacheConfig,
} from "./memberSync";

// Registration Sync (F4 - Write-Through)
export {
  // Write operations
  createRegistration,
  cancelRegistration,

  // Pending write queue
  queuePendingWrite,
  getPendingWrites,
  getPendingWritesByStatus,
  updatePendingWrite,
  removePendingWrite,
  clearPendingWrites,

  // Background processing
  processPendingWrites,
  startPendingWriteProcessor,
  stopPendingWriteProcessor,
  getPendingWriteStatus,
} from "./registrationSync";
export type {
  WriteResult,
  WriteError,
  WriteErrorType,
  PendingWrite,
  CreateRegistrationRequest,
  CancelRegistrationRequest,
} from "./registrationSync";
