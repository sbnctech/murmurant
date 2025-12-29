// Copyright © 2025 Murmurant, Inc. All rights reserved.
/**
 * Tests for WA configuration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  loadWaConfig,
  isWaEnabled,
  getWaConfigSafe,
  isSensitiveField,
  WaConfigError,
} from "@/lib/wa/config";

describe("WA Config - Loading", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env before each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should load config when all required vars are present", () => {
    process.env.WA_ACCOUNT_ID = "12345";
    process.env.WA_API_KEY = "test-api-key";
    process.env.WA_CLIENT_SECRET = "test-secret";

    const config = loadWaConfig();

    expect(config.accountId).toBe(12345);
    expect(config.apiKey).toBe("test-api-key");
    expect(config.clientSecret).toBe("test-secret");
  });

  it("should use default values for optional config", () => {
    process.env.WA_ACCOUNT_ID = "12345";
    process.env.WA_API_KEY = "test-api-key";
    process.env.WA_CLIENT_SECRET = "test-secret";

    const config = loadWaConfig();

    expect(config.apiUrl).toBe("https://api.wildapricot.org/v2.2");
    expect(config.tokenUrl).toBe("https://oauth.wildapricot.org/auth/token");
    expect(config.timeoutMs).toBe(30000);
    expect(config.maxRetries).toBe(3);
  });

  it("should throw when required vars are missing", () => {
    delete process.env.WA_ACCOUNT_ID;
    delete process.env.WA_API_KEY;
    delete process.env.WA_CLIENT_SECRET;

    expect(() => loadWaConfig()).toThrow(WaConfigError);
  });

  it("should list missing vars in error", () => {
    delete process.env.WA_ACCOUNT_ID;
    delete process.env.WA_API_KEY;
    process.env.WA_CLIENT_SECRET = "present";

    try {
      loadWaConfig();
      expect.fail("Should have thrown");
    } catch (e) {
      const error = e as WaConfigError;
      expect(error.missingVars).toContain("WA_ACCOUNT_ID");
      expect(error.missingVars).toContain("WA_API_KEY");
      expect(error.missingVars).not.toContain("WA_CLIENT_SECRET");
    }
  });

  it("should throw when account ID is not a number", () => {
    process.env.WA_ACCOUNT_ID = "not-a-number";
    process.env.WA_API_KEY = "test-api-key";
    process.env.WA_CLIENT_SECRET = "test-secret";

    expect(() => loadWaConfig()).toThrow("must be a valid number");
  });
});

describe("WA Config - isWaEnabled", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return true when all required vars are present", () => {
    process.env.WA_ACCOUNT_ID = "12345";
    process.env.WA_API_KEY = "test-api-key";
    process.env.WA_CLIENT_SECRET = "test-secret";

    expect(isWaEnabled()).toBe(true);
  });

  it("should return false when vars are missing", () => {
    delete process.env.WA_ACCOUNT_ID;
    delete process.env.WA_API_KEY;
    delete process.env.WA_CLIENT_SECRET;

    expect(isWaEnabled()).toBe(false);
  });
});

describe("WA Config - getWaConfigSafe", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return config when valid", () => {
    process.env.WA_ACCOUNT_ID = "12345";
    process.env.WA_API_KEY = "test-api-key";
    process.env.WA_CLIENT_SECRET = "test-secret";

    const config = getWaConfigSafe();
    expect(config).not.toBeNull();
    expect(config?.accountId).toBe(12345);
  });

  it("should return null when config is invalid", () => {
    delete process.env.WA_ACCOUNT_ID;

    const config = getWaConfigSafe();
    expect(config).toBeNull();
  });
});

describe("WA Config - Sensitive Fields", () => {
  it("should identify common sensitive field names", () => {
    expect(isSensitiveField("password")).toBe(true);
    expect(isSensitiveField("accessToken")).toBe(true);
    expect(isSensitiveField("refreshToken")).toBe(true);
    expect(isSensitiveField("apiKey")).toBe(true);
    expect(isSensitiveField("clientSecret")).toBe(true);
    expect(isSensitiveField("ssn")).toBe(true);
    expect(isSensitiveField("creditCard")).toBe(true);
  });

  it("should handle different casings and formats", () => {
    expect(isSensitiveField("PASSWORD")).toBe(true);
    expect(isSensitiveField("access_token")).toBe(true);
    expect(isSensitiveField("api-key")).toBe(true);
    expect(isSensitiveField("ClientSecret")).toBe(true);
  });

  it("should not flag non-sensitive fields", () => {
    expect(isSensitiveField("firstName")).toBe(false);
    expect(isSensitiveField("email")).toBe(false);
    expect(isSensitiveField("membershipLevel")).toBe(false);
  });
});
