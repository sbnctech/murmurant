// Copyright © 2025 Murmurant, Inc. All rights reserved.
/**
 * Wild Apricot Webhook Handling
 *
 * Secure webhook reception with:
 * - Signature verification (when WA supports it)
 * - Idempotency (deduplication)
 * - Replay protection
 * - Event validation
 *
 * Charter: P1 (provable identity), P9 (fail closed)
 */

import crypto from "crypto";
import { WaContact, WaEvent, WaEventRegistration } from "./types";

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

/**
 * WA webhook event types.
 */
export type WaWebhookEventType =
  | "ContactCreated"
  | "ContactUpdated"
  | "ContactDeleted"
  | "MembershipLevelChanged"
  | "EventCreated"
  | "EventUpdated"
  | "EventDeleted"
  | "RegistrationCreated"
  | "RegistrationUpdated"
  | "RegistrationCancelled"
  | "PaymentReceived";

/**
 * WA webhook payload structure.
 */
export type WaWebhookPayload = {
  /** Event type */
  MessageType: WaWebhookEventType;

  /** Timestamp */
  Timestamp: string;

  /** Account ID */
  AccountId: number;

  /** Event-specific data */
  Parameters?: {
    Contact?: WaContact;
    Event?: WaEvent;
    EventRegistration?: WaEventRegistration;
    [key: string]: unknown;
  };
};

/**
 * Validated webhook event.
 */
export type ValidatedWebhookEvent = {
  /** Whether the webhook is valid */
  valid: boolean;

  /** Error message if invalid */
  error?: string;

  /** Parsed payload (if valid) */
  payload?: WaWebhookPayload;

  /** Idempotency key for deduplication */
  idempotencyKey?: string;

  /** Timestamp for replay protection */
  timestamp?: Date;
};

// ============================================================================
// IDEMPOTENCY TRACKING
// ============================================================================

/**
 * In-memory idempotency cache.
 * In production, this would be Redis with TTL.
 */
const processedWebhooks = new Map<string, Date>();

/**
 * TTL for idempotency keys (24 hours).
 */
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Maximum age for webhook timestamps (5 minutes).
 * Prevents replay attacks with old webhooks.
 */
const MAX_WEBHOOK_AGE_MS = 5 * 60 * 1000;

/**
 * Check if a webhook has already been processed.
 */
export function isWebhookProcessed(idempotencyKey: string): boolean {
  const processed = processedWebhooks.get(idempotencyKey);
  if (!processed) return false;

  // Check if entry has expired
  if (Date.now() - processed.getTime() > IDEMPOTENCY_TTL_MS) {
    processedWebhooks.delete(idempotencyKey);
    return false;
  }

  return true;
}

/**
 * Mark a webhook as processed.
 */
export function markWebhookProcessed(idempotencyKey: string): void {
  processedWebhooks.set(idempotencyKey, new Date());

  // Cleanup old entries periodically
  if (processedWebhooks.size > 10000) {
    const cutoff = Date.now() - IDEMPOTENCY_TTL_MS;
    for (const [key, date] of processedWebhooks.entries()) {
      if (date.getTime() < cutoff) {
        processedWebhooks.delete(key);
      }
    }
  }
}

/**
 * Generate idempotency key for a webhook.
 */
export function generateIdempotencyKey(payload: WaWebhookPayload): string {
  const components = [
    payload.AccountId,
    payload.MessageType,
    payload.Timestamp,
    // Include entity ID if available
    payload.Parameters?.Contact?.Id,
    payload.Parameters?.Event?.Id,
    payload.Parameters?.EventRegistration?.Id,
  ].filter(Boolean);

  return crypto
    .createHash("sha256")
    .update(components.join(":"))
    .digest("hex")
    .slice(0, 32);
}

// ============================================================================
// SIGNATURE VERIFICATION
// ============================================================================

/**
 * Verify webhook signature (HMAC-SHA256).
 *
 * Note: WA may not provide signatures. This is for future use
 * or for our own webhook delivery to customers.
 *
 * @param payload - Raw request body
 * @param signature - Signature from header
 * @param secret - Webhook secret
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    // If no signature expected, skip verification
    // In production, you might want to require signatures
    return true;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // Check length first to avoid timing attacks on length comparison
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Generate a webhook signature for outgoing webhooks.
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

// ============================================================================
// WEBHOOK VALIDATION
// ============================================================================

/**
 * Validate an incoming webhook.
 *
 * Performs:
 * 1. Signature verification (if configured)
 * 2. Timestamp validation (replay protection)
 * 3. Payload parsing and validation
 * 4. Idempotency check
 */
export function validateWebhook(
  rawBody: string,
  signature?: string,
  secret?: string
): ValidatedWebhookEvent {
  // 1. Verify signature (if provided)
  if (secret && signature) {
    const validSignature = verifyWebhookSignature(rawBody, signature, secret);
    if (!validSignature) {
      return {
        valid: false,
        error: "Invalid webhook signature",
      };
    }
  }

  // 2. Parse payload
  let payload: WaWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return {
      valid: false,
      error: "Invalid JSON payload",
    };
  }

  // 3. Validate required fields
  if (!payload.MessageType || !payload.Timestamp || !payload.AccountId) {
    return {
      valid: false,
      error: "Missing required webhook fields",
    };
  }

  // 4. Check timestamp for replay protection
  const timestamp = new Date(payload.Timestamp);
  if (isNaN(timestamp.getTime())) {
    return {
      valid: false,
      error: "Invalid timestamp format",
    };
  }

  const age = Date.now() - timestamp.getTime();
  if (age > MAX_WEBHOOK_AGE_MS) {
    return {
      valid: false,
      error: "Webhook timestamp too old (possible replay attack)",
    };
  }

  // 5. Generate idempotency key and check for duplicates
  const idempotencyKey = generateIdempotencyKey(payload);
  if (isWebhookProcessed(idempotencyKey)) {
    return {
      valid: false,
      error: "Duplicate webhook (already processed)",
    };
  }

  return {
    valid: true,
    payload,
    idempotencyKey,
    timestamp,
  };
}

// ============================================================================
// WEBHOOK HANDLERS
// ============================================================================

/**
 * Webhook handler function type.
 */
export type WebhookHandler = (payload: WaWebhookPayload) => Promise<void>;

/**
 * Registry of webhook handlers by event type.
 */
const webhookHandlers = new Map<WaWebhookEventType, WebhookHandler[]>();

/**
 * Register a webhook handler for an event type.
 */
export function onWebhook(
  eventType: WaWebhookEventType,
  handler: WebhookHandler
): void {
  const handlers = webhookHandlers.get(eventType) || [];
  handlers.push(handler);
  webhookHandlers.set(eventType, handlers);
}

/**
 * Process a validated webhook by calling registered handlers.
 */
export async function processWebhook(
  validated: ValidatedWebhookEvent
): Promise<void> {
  if (!validated.valid || !validated.payload) {
    throw new Error(validated.error || "Invalid webhook");
  }

  const handlers = webhookHandlers.get(validated.payload.MessageType) || [];

  // Process all handlers
  for (const handler of handlers) {
    await handler(validated.payload);
  }

  // Mark as processed for idempotency
  if (validated.idempotencyKey) {
    markWebhookProcessed(validated.idempotencyKey);
  }
}

// ============================================================================
// WEBHOOK RETRY (for outgoing webhooks to customers)
// ============================================================================

/**
 * Retry configuration for outgoing webhooks.
 */
export type WebhookRetryConfig = {
  /** Maximum retry attempts */
  maxRetries: number;

  /** Base delay in ms (exponential backoff) */
  baseDelayMs: number;

  /** Maximum delay in ms */
  maxDelayMs: number;
};

/**
 * Default retry configuration.
 */
export const DEFAULT_WEBHOOK_RETRY: WebhookRetryConfig = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 60000,
};

/**
 * Calculate retry delay with exponential backoff.
 */
export function calculateRetryDelay(
  attempt: number,
  config: WebhookRetryConfig = DEFAULT_WEBHOOK_RETRY
): number {
  const delay = config.baseDelayMs * Math.pow(2, attempt);
  return Math.min(delay, config.maxDelayMs);
}
