// Copyright © 2025 Murmurant, Inc. All rights reserved.
/**
 * Registration Write-Through Service (F4)
 *
 * Implements the write-through pattern for event registrations.
 * MM writes to WA as source of truth, then syncs back confirmation.
 *
 * Features:
 * - Write-through with confirmation
 * - Retry with exponential backoff
 * - Pending write queue for failed operations
 * - Conflict detection (WA wins)
 * - Clear error messages for users
 *
 * Charter: P5 (reversible), P7 (observability), P9 (fail closed)
 */

import { WaEventRegistration, WaRegistrationRequest } from "./types";
import { getWaClient } from "./client";
import { auditWaWrite, auditWaError } from "./audit";
import { invalidateMember } from "./memberSync";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of a write-through operation.
 */
export type WriteResult<T> =
  | {
      success: true;
      data: T;
      source: "wa_confirmed";
    }
  | {
      success: false;
      error: WriteError;
      queued: boolean;
    };

/**
 * Write error types for user-facing messages.
 */
export type WriteErrorType =
  | "VALIDATION" // Bad input, don't retry
  | "CONFLICT" // Data changed in WA
  | "RATE_LIMIT" // Retry later
  | "NETWORK" // Network issue, retry
  | "SERVER_ERROR" // WA server error, retry
  | "NOT_FOUND" // Entity doesn't exist
  | "UNAUTHORIZED" // Auth issue
  | "QUEUED" // Queued for later retry
  | "UNKNOWN"; // Unknown error

/**
 * Write error with user-friendly message.
 */
export type WriteError = {
  type: WriteErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
  waStatus?: number;
  details?: unknown;
};

/**
 * Pending write for retry queue.
 */
export type PendingWrite = {
  id: string;
  entityType: "Registration";
  operation: "CREATE" | "DELETE";
  payload: WaRegistrationRequest | { registrationId: number };
  attempts: number;
  lastError: string | null;
  status: "PENDING" | "RETRYING" | "FAILED" | "SYNCED";
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date | null;
  userId?: string;
};

/**
 * Registration create request.
 */
export type CreateRegistrationRequest = {
  eventId: number;
  contactId: number;
  registrationTypeId: number;
  memo?: string;
  userId?: string;
};

/**
 * Registration cancel request.
 */
export type CancelRegistrationRequest = {
  registrationId: number;
  userId?: string;
};

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Map HTTP status to error type.
 */
function classifyError(status: number, message: string): WriteError {
  switch (status) {
    case 400:
      return {
        type: "VALIDATION",
        message,
        userMessage: "The registration request was invalid. Please check your input.",
        retryable: false,
        waStatus: status,
      };

    case 401:
    case 403:
      return {
        type: "UNAUTHORIZED",
        message,
        userMessage: "You are not authorized to perform this action.",
        retryable: false,
        waStatus: status,
      };

    case 404:
      return {
        type: "NOT_FOUND",
        message,
        userMessage: "The event or registration was not found.",
        retryable: false,
        waStatus: status,
      };

    case 409:
      return {
        type: "CONFLICT",
        message,
        userMessage: "This registration has been modified. Please refresh and try again.",
        retryable: false,
        waStatus: status,
      };

    case 429:
      return {
        type: "RATE_LIMIT",
        message,
        userMessage: "Too many requests. Please wait a moment and try again.",
        retryable: true,
        waStatus: status,
      };

    default:
      if (status >= 500) {
        return {
          type: "SERVER_ERROR",
          message,
          userMessage: "Wild Apricot is temporarily unavailable. Your request has been queued.",
          retryable: true,
          waStatus: status,
        };
      }
      return {
        type: "UNKNOWN",
        message,
        userMessage: "An unexpected error occurred. Please try again.",
        retryable: true,
        waStatus: status,
      };
  }
}

/**
 * Parse error from various sources.
 */
function parseError(error: unknown): WriteError {
  if (error instanceof Error) {
    const message = error.message;

    // Check for status code in message
    const statusMatch = message.match(/(\d{3})/);
    if (statusMatch) {
      const status = parseInt(statusMatch[1], 10);
      return classifyError(status, message);
    }

    // Network errors
    if (message.includes("timeout") || message.includes("ETIMEDOUT")) {
      return {
        type: "NETWORK",
        message,
        userMessage: "Connection timed out. Your request has been queued.",
        retryable: true,
      };
    }

    if (message.includes("ECONNREFUSED") || message.includes("network")) {
      return {
        type: "NETWORK",
        message,
        userMessage: "Unable to connect. Your request has been queued.",
        retryable: true,
      };
    }
  }

  return {
    type: "UNKNOWN",
    message: String(error),
    userMessage: "An unexpected error occurred. Please try again.",
    retryable: true,
  };
}

// ============================================================================
// PENDING WRITE QUEUE (In-Memory)
// ============================================================================

/**
 * In-memory pending write queue.
 *
 * Note: In production, this should be stored in the database (WaPendingWrite model)
 * for durability across restarts.
 */
const pendingWrites: Map<string, PendingWrite> = new Map();

/**
 * Generate unique ID for pending write.
 */
function generatePendingId(): string {
  return `pw_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Queue a failed write for later retry.
 */
export function queuePendingWrite(
  operation: "CREATE" | "DELETE",
  payload: WaRegistrationRequest | { registrationId: number },
  error: WriteError,
  userId?: string
): PendingWrite {
  const pending: PendingWrite = {
    id: generatePendingId(),
    entityType: "Registration",
    operation,
    payload,
    attempts: 1,
    lastError: error.message,
    status: "PENDING",
    createdAt: new Date(),
    updatedAt: new Date(),
    syncedAt: null,
    userId,
  };

  pendingWrites.set(pending.id, pending);
  return pending;
}

/**
 * Get all pending writes.
 */
export function getPendingWrites(): PendingWrite[] {
  return Array.from(pendingWrites.values());
}

/**
 * Get pending writes by status.
 */
export function getPendingWritesByStatus(
  status: PendingWrite["status"]
): PendingWrite[] {
  return Array.from(pendingWrites.values()).filter((p) => p.status === status);
}

/**
 * Update pending write status.
 */
export function updatePendingWrite(
  id: string,
  updates: Partial<Pick<PendingWrite, "status" | "lastError" | "attempts" | "syncedAt">>
): void {
  const pending = pendingWrites.get(id);
  if (pending) {
    Object.assign(pending, updates, { updatedAt: new Date() });
  }
}

/**
 * Remove a pending write (after successful sync).
 */
export function removePendingWrite(id: string): void {
  pendingWrites.delete(id);
}

/**
 * Clear all pending writes (for testing).
 */
export function clearPendingWrites(): void {
  pendingWrites.clear();
}

// ============================================================================
// WRITE-THROUGH OPERATIONS
// ============================================================================

const MAX_RETRIES = 2;
const RETRY_DELAYS = [1000, 3000]; // 1s, 3s

/**
 * Create an event registration (write-through to WA).
 *
 * Flow:
 * 1. Build WA request
 * 2. Write to WA with retries
 * 3. If successful, invalidate cache and return confirmation
 * 4. If failed after retries, queue for later
 */
export async function createRegistration(
  request: CreateRegistrationRequest
): Promise<WriteResult<WaEventRegistration>> {
  const client = getWaClient();
  const startTime = Date.now();

  if (!client) {
    const error: WriteError = {
      type: "NETWORK",
      message: "WA client not configured",
      userMessage: "Wild Apricot is not configured. Please contact support.",
      retryable: false,
    };
    return { success: false, error, queued: false };
  }

  const waRequest: WaRegistrationRequest = {
    Event: { Id: request.eventId },
    Contact: { Id: request.contactId },
    RegistrationTypeId: request.registrationTypeId,
    Memo: request.memo,
  };

  let lastError: WriteError | null = null;

  // Retry loop
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const registration = await client.createRegistration(waRequest, request.userId);

      const durationMs = Date.now() - startTime;

      // Audit successful write
      auditWaWrite({
        method: "POST",
        endpoint: "/eventregistrations",
        entityType: "registration",
        waEntityId: registration.Id,
        userId: request.userId,
        durationMs,
        responseStatus: 200,
        success: true,
        source: "user_action",
      });

      // Invalidate member cache (their registrations changed)
      invalidateMember(request.contactId);

      return {
        success: true,
        data: registration,
        source: "wa_confirmed",
      };
    } catch (error) {
      lastError = parseError(error);

      // Don't retry non-retryable errors
      if (!lastError.retryable) {
        break;
      }

      // Wait before retry (if not last attempt)
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt]));
      }
    }
  }

  // All retries exhausted - audit and queue
  const durationMs = Date.now() - startTime;

  auditWaError({
    operationType: "WRITE",
    method: "POST",
    endpoint: "/eventregistrations",
    entityType: "registration",
    userId: request.userId,
    durationMs,
    responseStatus: lastError?.waStatus || 0,
    error: lastError?.message || "Unknown error",
    source: "user_action",
  });

  // Queue if retryable
  let queued = false;
  if (lastError?.retryable) {
    queuePendingWrite("CREATE", waRequest, lastError, request.userId);
    queued = true;
    lastError.type = "QUEUED";
    lastError.userMessage = "Your registration is being processed. You'll be notified when complete.";
  }

  return {
    success: false,
    error: lastError!,
    queued,
  };
}

/**
 * Cancel an event registration (write-through to WA).
 */
export async function cancelRegistration(
  request: CancelRegistrationRequest
): Promise<WriteResult<void>> {
  const client = getWaClient();
  const startTime = Date.now();

  if (!client) {
    const error: WriteError = {
      type: "NETWORK",
      message: "WA client not configured",
      userMessage: "Wild Apricot is not configured. Please contact support.",
      retryable: false,
    };
    return { success: false, error, queued: false };
  }

  let lastError: WriteError | null = null;

  // Retry loop
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await client.cancelRegistration(request.registrationId, request.userId);

      const durationMs = Date.now() - startTime;

      // Audit successful write
      auditWaWrite({
        method: "DELETE",
        endpoint: `/eventregistrations/${request.registrationId}`,
        entityType: "registration",
        waEntityId: request.registrationId,
        userId: request.userId,
        durationMs,
        responseStatus: 200,
        success: true,
        source: "user_action",
      });

      return {
        success: true,
        data: undefined,
        source: "wa_confirmed",
      };
    } catch (error) {
      lastError = parseError(error);

      // Don't retry non-retryable errors
      if (!lastError.retryable) {
        break;
      }

      // Wait before retry (if not last attempt)
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt]));
      }
    }
  }

  // All retries exhausted - audit and queue
  const durationMs = Date.now() - startTime;

  auditWaError({
    operationType: "WRITE",
    method: "DELETE",
    endpoint: `/eventregistrations/${request.registrationId}`,
    entityType: "registration",
    waEntityId: request.registrationId,
    userId: request.userId,
    durationMs,
    responseStatus: lastError?.waStatus || 0,
    error: lastError?.message || "Unknown error",
    source: "user_action",
  });

  // Queue if retryable
  let queued = false;
  if (lastError?.retryable) {
    queuePendingWrite(
      "DELETE",
      { registrationId: request.registrationId },
      lastError,
      request.userId
    );
    queued = true;
    lastError.type = "QUEUED";
    lastError.userMessage = "Your cancellation is being processed. You'll be notified when complete.";
  }

  return {
    success: false,
    error: lastError!,
    queued,
  };
}

// ============================================================================
// BACKGROUND RETRY
// ============================================================================

/**
 * Retry state for background processing.
 */
type RetryState = {
  isRunning: boolean;
  lastRunTime: Date | null;
  intervalId: ReturnType<typeof setInterval> | null;
};

const retryState: RetryState = {
  isRunning: false,
  lastRunTime: null,
  intervalId: null,
};

const MAX_PENDING_ATTEMPTS = 10;
const PENDING_RETRY_HOURS = 1; // Alert after 1 hour
const PENDING_FAIL_HOURS = 24; // Mark failed after 24 hours

/**
 * Process pending writes in the queue.
 */
export async function processPendingWrites(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  if (retryState.isRunning) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  const client = getWaClient();
  if (!client) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  retryState.isRunning = true;
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  try {
    const pending = getPendingWritesByStatus("PENDING");

    for (const write of pending) {
      processed++;

      // Check if exceeded max attempts
      if (write.attempts >= MAX_PENDING_ATTEMPTS) {
        updatePendingWrite(write.id, {
          status: "FAILED",
          lastError: "Max retry attempts exceeded",
        });
        failed++;
        continue;
      }

      // Check if exceeded time limits
      const ageHours = (Date.now() - write.createdAt.getTime()) / (1000 * 60 * 60);
      if (ageHours >= PENDING_FAIL_HOURS) {
        updatePendingWrite(write.id, {
          status: "FAILED",
          lastError: "Exceeded 24-hour retry window",
        });
        failed++;
        continue;
      }

      // Mark as retrying
      updatePendingWrite(write.id, { status: "RETRYING" });

      try {
        if (write.operation === "CREATE") {
          const request = write.payload as WaRegistrationRequest;
          await client.createRegistration(request, write.userId);
        } else if (write.operation === "DELETE") {
          const { registrationId } = write.payload as { registrationId: number };
          await client.cancelRegistration(registrationId, write.userId);
        }

        // Success - remove from queue
        updatePendingWrite(write.id, {
          status: "SYNCED",
          syncedAt: new Date(),
        });
        removePendingWrite(write.id);
        succeeded++;
      } catch (error) {
        // Failed - increment attempts
        const parseResult = parseError(error);
        updatePendingWrite(write.id, {
          status: "PENDING",
          attempts: write.attempts + 1,
          lastError: parseResult.message,
        });

        // If not retryable, mark as failed
        if (!parseResult.retryable) {
          updatePendingWrite(write.id, {
            status: "FAILED",
            lastError: parseResult.message,
          });
          failed++;
        }
      }
    }

    retryState.lastRunTime = new Date();
  } finally {
    retryState.isRunning = false;
  }

  return { processed, succeeded, failed };
}

/**
 * Start background retry processing.
 */
export function startPendingWriteProcessor(intervalMs: number = 5 * 60 * 1000): void {
  if (retryState.intervalId) {
    return; // Already running
  }

  // Run immediately
  processPendingWrites().catch(() => {
    // Swallow errors in background processing
  });

  // Then run at interval
  retryState.intervalId = setInterval(() => {
    processPendingWrites().catch(() => {
      // Swallow errors in background processing
    });
  }, intervalMs);
}

/**
 * Stop background retry processing.
 */
export function stopPendingWriteProcessor(): void {
  if (retryState.intervalId) {
    clearInterval(retryState.intervalId);
    retryState.intervalId = null;
  }
}

/**
 * Get pending write queue status.
 */
export function getPendingWriteStatus(): {
  queueDepth: number;
  oldestPendingAge: number | null;
  lastProcessTime: Date | null;
  isProcessing: boolean;
} {
  const pending = getPendingWritesByStatus("PENDING");
  const oldest = pending.length > 0
    ? Math.min(...pending.map((p) => p.createdAt.getTime()))
    : null;

  return {
    queueDepth: pending.length,
    oldestPendingAge: oldest ? Date.now() - oldest : null,
    lastProcessTime: retryState.lastRunTime,
    isProcessing: retryState.isRunning,
  };
}
