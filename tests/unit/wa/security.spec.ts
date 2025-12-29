// Copyright © 2025 Murmurant, Inc. All rights reserved.
/**
 * Tests for WA API security controls.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  resetRateLimit,
  validateEmail,
  validateWaId,
  validateStringLength,
  validatePayloadSize,
  validateArrayLength,
  sanitizeForLog,
  redactSensitiveData,
  sanitizeHtml,
  sanitizeWaError,
  isOperationAllowed,
  WaValidationError,
} from "@/lib/wa/security";

describe("WA Security - Rate Limiting", () => {
  beforeEach(() => {
    // Reset rate limits between tests
    resetRateLimit("test-org");
  });

  it("should allow requests under the limit", () => {
    const result = checkRateLimit("test-org", "read");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99); // 100 - 1
  });

  it("should track remaining quota", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("test-org", "read");
    }
    const result = checkRateLimit("test-org", "read");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(94); // 100 - 6
  });

  it("should block requests over the limit", () => {
    // Exhaust the quota
    for (let i = 0; i < 100; i++) {
      checkRateLimit("test-org", "read");
    }

    const result = checkRateLimit("test-org", "read");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("should have different limits for different operations", () => {
    // Write has lower limit (30/min vs 100/min)
    for (let i = 0; i < 30; i++) {
      checkRateLimit("test-org-2", "write");
    }

    const result = checkRateLimit("test-org-2", "write");
    expect(result.allowed).toBe(false);
  });

  it("should track different orgs separately", () => {
    for (let i = 0; i < 100; i++) {
      checkRateLimit("org-a", "read");
    }

    // org-b should still have quota
    const result = checkRateLimit("org-b", "read");
    expect(result.allowed).toBe(true);
  });
});

describe("WA Security - Input Validation", () => {
  describe("validateEmail", () => {
    it("should accept valid emails", () => {
      expect(validateEmail("user@example.com")).toBe(true);
      expect(validateEmail("user.name@example.org")).toBe(true);
      expect(validateEmail("user+tag@sub.domain.com")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(validateEmail("")).toBe(false);
      expect(validateEmail("not-an-email")).toBe(false);
      expect(validateEmail("@nodomain")).toBe(false);
      expect(validateEmail("spaces in@email.com")).toBe(false);
    });
  });

  describe("validateWaId", () => {
    it("should accept valid WA IDs", () => {
      expect(validateWaId(12345, "testId")).toBe(12345);
      expect(validateWaId("67890", "testId")).toBe(67890);
    });

    it("should reject invalid WA IDs", () => {
      expect(() => validateWaId(0, "testId")).toThrow(WaValidationError);
      expect(() => validateWaId(-1, "testId")).toThrow(WaValidationError);
      expect(() => validateWaId("abc", "testId")).toThrow(WaValidationError);
      expect(() => validateWaId(null, "testId")).toThrow(WaValidationError);
    });
  });

  describe("validateStringLength", () => {
    it("should accept strings within bounds", () => {
      expect(validateStringLength("hello", "field", 1, 10)).toBe("hello");
    });

    it("should reject strings too short", () => {
      expect(() => validateStringLength("", "field", 1, 10)).toThrow(WaValidationError);
    });

    it("should reject strings too long", () => {
      expect(() => validateStringLength("toolongstring", "field", 1, 5)).toThrow(
        WaValidationError
      );
    });
  });

  describe("validatePayloadSize", () => {
    it("should accept small payloads", () => {
      expect(() => validatePayloadSize({ name: "test" })).not.toThrow();
    });

    it("should reject large payloads", () => {
      const largePayload = { data: "x".repeat(10 * 1024 * 1024) }; // 10MB
      expect(() => validatePayloadSize(largePayload)).toThrow(WaValidationError);
    });
  });

  describe("validateArrayLength", () => {
    it("should accept arrays within limit", () => {
      expect(validateArrayLength([1, 2, 3], "items", 10)).toEqual([1, 2, 3]);
    });

    it("should reject arrays over limit", () => {
      const longArray = Array(100).fill(1);
      expect(() => validateArrayLength(longArray, "items", 50)).toThrow(
        WaValidationError
      );
    });
  });
});

describe("WA Security - Sanitization", () => {
  describe("sanitizeForLog", () => {
    it("should remove newlines", () => {
      expect(sanitizeForLog("line1\nline2")).toBe("line1 line2");
    });

    it("should truncate long strings", () => {
      const longString = "x".repeat(300);
      const result = sanitizeForLog(longString);
      expect(result.length).toBeLessThanOrEqual(203); // 200 + "..."
    });

    it("should remove ANSI codes", () => {
      expect(sanitizeForLog("\x1b[31mred text\x1b[0m")).toBe("red text");
    });
  });

  describe("redactSensitiveData", () => {
    it("should redact password fields", () => {
      const input = { username: "test", password: "secret123" };
      const result = redactSensitiveData(input) as Record<string, unknown>;
      expect(result.username).toBe("test");
      expect(result.password).toBe("[REDACTED]");
    });

    it("should redact nested sensitive fields", () => {
      const input = { user: { name: "test", apiKey: "key123" } };
      const result = redactSensitiveData(input) as Record<string, unknown>;
      expect((result.user as Record<string, unknown>).name).toBe("test");
      expect((result.user as Record<string, unknown>).apiKey).toBe("[REDACTED]");
    });

    it("should handle arrays", () => {
      const input = [{ password: "secret" }, { name: "test" }];
      const result = redactSensitiveData(input) as Array<Record<string, unknown>>;
      expect(result[0].password).toBe("[REDACTED]");
      expect(result[1].name).toBe("test");
    });
  });

  describe("sanitizeHtml", () => {
    it("should escape HTML entities", () => {
      expect(sanitizeHtml("<script>alert('xss')</script>")).toBe(
        "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;"
      );
    });

    it("should handle empty strings", () => {
      expect(sanitizeHtml("")).toBe("");
    });
  });

  describe("sanitizeWaError", () => {
    it("should sanitize auth errors", () => {
      const result = sanitizeWaError(new Error("Unauthorized access"));
      expect(result.code).toBe("WA_AUTH_ERROR");
      expect(result.message).not.toContain("Unauthorized");
    });

    it("should sanitize rate limit errors", () => {
      const result = sanitizeWaError(new Error("429 Too Many Requests"));
      expect(result.code).toBe("WA_RATE_LIMITED");
    });

    it("should sanitize connection errors", () => {
      const result = sanitizeWaError(new Error("ECONNREFUSED"));
      expect(result.code).toBe("WA_CONNECTION_ERROR");
    });

    it("should return generic error for unknown errors", () => {
      const result = sanitizeWaError(new Error("Something weird happened"));
      expect(result.code).toBe("WA_ERROR");
    });
  });
});

describe("WA Security - Authorization", () => {
  it("should allow read operations with read permission", () => {
    expect(isOperationAllowed("read", ["wa:read"])).toBe(true);
  });

  it("should deny read operations without permission", () => {
    expect(isOperationAllowed("read", [])).toBe(false);
    expect(isOperationAllowed("read", ["other:permission"])).toBe(false);
  });

  it("should allow write operations with write permission", () => {
    expect(isOperationAllowed("write", ["wa:write"])).toBe(true);
  });

  it("should deny write with only read permission", () => {
    expect(isOperationAllowed("write", ["wa:read"])).toBe(false);
  });
});
