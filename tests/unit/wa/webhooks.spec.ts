// Copyright © 2025 Murmurant, Inc. All rights reserved.
/**
 * Tests for WA webhook handling.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  validateWebhook,
  verifyWebhookSignature,
  generateWebhookSignature,
  generateIdempotencyKey,
  isWebhookProcessed,
  markWebhookProcessed,
  calculateRetryDelay,
  DEFAULT_WEBHOOK_RETRY,
} from "@/lib/wa/webhooks";
import type { WaWebhookPayload } from "@/lib/wa/webhooks";

describe("WA Webhooks - Signature Verification", () => {
  const secret = "test-secret-key";

  it("should generate and verify signatures", () => {
    const payload = JSON.stringify({ test: "data" });
    const signature = generateWebhookSignature(payload, secret);

    expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
  });

  it("should reject invalid signatures", () => {
    const payload = JSON.stringify({ test: "data" });
    const wrongSignature = "invalid-signature";

    expect(verifyWebhookSignature(payload, wrongSignature, secret)).toBe(false);
  });

  it("should reject tampered payloads", () => {
    const originalPayload = JSON.stringify({ test: "data" });
    const signature = generateWebhookSignature(originalPayload, secret);
    const tamperedPayload = JSON.stringify({ test: "tampered" });

    expect(verifyWebhookSignature(tamperedPayload, signature, secret)).toBe(false);
  });

  it("should pass when no secret configured", () => {
    const payload = JSON.stringify({ test: "data" });
    expect(verifyWebhookSignature(payload, "", "")).toBe(true);
  });
});

describe("WA Webhooks - Validation", () => {
  const validPayload: WaWebhookPayload = {
    MessageType: "ContactUpdated",
    Timestamp: new Date().toISOString(),
    AccountId: 12345,
    Parameters: {
      Contact: {
        Id: 67890,
        Url: "https://api.wildapricot.org/...",
        FirstName: "Test",
        LastName: "User",
        Organization: null,
        Email: "test@example.com",
        DisplayName: "Test User",
        ProfileLastUpdated: new Date().toISOString(),
        MembershipLevel: null,
        MembershipEnabled: true,
        Status: "Active",
        FieldValues: [],
        IsAccountAdministrator: false,
        TermsOfUseAccepted: true,
      },
    },
  };

  it("should validate correct payloads", () => {
    const result = validateWebhook(JSON.stringify(validPayload));
    expect(result.valid).toBe(true);
    expect(result.payload).toBeDefined();
    expect(result.idempotencyKey).toBeDefined();
  });

  it("should reject invalid JSON", () => {
    const result = validateWebhook("not valid json");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid JSON");
  });

  it("should reject missing required fields", () => {
    const incomplete = { MessageType: "ContactUpdated" };
    const result = validateWebhook(JSON.stringify(incomplete));
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Missing required");
  });

  it("should reject old timestamps (replay protection)", () => {
    const oldPayload = {
      ...validPayload,
      Timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min ago
    };
    const result = validateWebhook(JSON.stringify(oldPayload));
    expect(result.valid).toBe(false);
    expect(result.error).toContain("timestamp too old");
  });

  it("should reject invalid timestamp format", () => {
    const badTimestamp = { ...validPayload, Timestamp: "not-a-date" };
    const result = validateWebhook(JSON.stringify(badTimestamp));
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid timestamp");
  });
});

describe("WA Webhooks - Idempotency", () => {
  it("should generate consistent idempotency keys", () => {
    const payload: WaWebhookPayload = {
      MessageType: "ContactUpdated",
      Timestamp: "2024-01-01T12:00:00Z",
      AccountId: 12345,
      Parameters: { Contact: { Id: 67890 } as never },
    };

    const key1 = generateIdempotencyKey(payload);
    const key2 = generateIdempotencyKey(payload);
    expect(key1).toBe(key2);
  });

  it("should generate different keys for different events", () => {
    const payload1: WaWebhookPayload = {
      MessageType: "ContactUpdated",
      Timestamp: "2024-01-01T12:00:00Z",
      AccountId: 12345,
    };
    const payload2: WaWebhookPayload = {
      MessageType: "ContactCreated",
      Timestamp: "2024-01-01T12:00:00Z",
      AccountId: 12345,
    };

    expect(generateIdempotencyKey(payload1)).not.toBe(
      generateIdempotencyKey(payload2)
    );
  });

  it("should track processed webhooks", () => {
    const key = "test-idempotency-key-" + Date.now();

    expect(isWebhookProcessed(key)).toBe(false);
    markWebhookProcessed(key);
    expect(isWebhookProcessed(key)).toBe(true);
  });

  it("should reject duplicate webhooks", () => {
    const payload: WaWebhookPayload = {
      MessageType: "ContactUpdated",
      Timestamp: new Date().toISOString(),
      AccountId: 99999,
      Parameters: { Contact: { Id: 88888 } as never },
    };

    // First should succeed
    const first = validateWebhook(JSON.stringify(payload));
    expect(first.valid).toBe(true);

    // Mark as processed
    if (first.idempotencyKey) {
      markWebhookProcessed(first.idempotencyKey);
    }

    // Second should be rejected as duplicate
    const second = validateWebhook(JSON.stringify(payload));
    expect(second.valid).toBe(false);
    expect(second.error).toContain("Duplicate");
  });
});

describe("WA Webhooks - Retry", () => {
  it("should calculate exponential backoff", () => {
    expect(calculateRetryDelay(0)).toBe(1000); // 1s
    expect(calculateRetryDelay(1)).toBe(2000); // 2s
    expect(calculateRetryDelay(2)).toBe(4000); // 4s
    expect(calculateRetryDelay(3)).toBe(8000); // 8s
  });

  it("should cap at maximum delay", () => {
    const delay = calculateRetryDelay(10); // Would be 1024s without cap
    expect(delay).toBe(DEFAULT_WEBHOOK_RETRY.maxDelayMs); // 60s max
  });

  it("should respect custom config", () => {
    const config = {
      maxRetries: 3,
      baseDelayMs: 500,
      maxDelayMs: 5000,
    };

    expect(calculateRetryDelay(0, config)).toBe(500);
    expect(calculateRetryDelay(1, config)).toBe(1000);
    expect(calculateRetryDelay(5, config)).toBe(5000); // capped
  });
});
