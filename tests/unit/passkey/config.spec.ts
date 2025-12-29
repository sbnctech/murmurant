// Copyright (c) Santa Barbara Newcomers Club
// Unit tests for passkey configuration

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("Passkey Configuration", () => {
  // Store original env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to get fresh config
    vi.resetModules();
    // Clone env to avoid test pollution
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  describe("getRelyingPartyId", () => {
    it("returns PASSKEY_RP_ID when set", async () => {
      process.env.PASSKEY_RP_ID = "custom-rp-id.example.com";
      const { getRelyingPartyId } = await import("@/lib/passkey/config");
      expect(getRelyingPartyId()).toBe("custom-rp-id.example.com");
    });

    it("returns localhost in development when not set", async () => {
      delete process.env.PASSKEY_RP_ID;
      // @ts-expect-error - NODE_ENV assignment for test
      process.env.NODE_ENV = "development";
      const { getRelyingPartyId } = await import("@/lib/passkey/config");
      expect(getRelyingPartyId()).toBe("localhost");
    });
  });

  describe("getExpectedOrigin", () => {
    it("returns PASSKEY_ORIGIN when set", async () => {
      process.env.PASSKEY_ORIGIN = "https://custom.example.com";
      const { getExpectedOrigin } = await import("@/lib/passkey/config");
      expect(getExpectedOrigin()).toBe("https://custom.example.com");
    });

    it("returns array with localhost variants in development when not set", async () => {
      delete process.env.PASSKEY_ORIGIN;
      // @ts-expect-error - NODE_ENV assignment for test
      process.env.NODE_ENV = "development";
      process.env.PORT = "3000";
      const { getExpectedOrigin } = await import("@/lib/passkey/config");
      const result = getExpectedOrigin();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain("http://localhost:3000");
      expect(result).toContain("http://127.0.0.1:3000");
    });
  });

  describe("getRelyingPartyName", () => {
    it("returns PASSKEY_RP_NAME when set", async () => {
      process.env.PASSKEY_RP_NAME = "My Custom App";
      const { getRelyingPartyName } = await import("@/lib/passkey/config");
      expect(getRelyingPartyName()).toBe("My Custom App");
    });

    it("returns default name when not set", async () => {
      delete process.env.PASSKEY_RP_NAME;
      const { getRelyingPartyName } = await import("@/lib/passkey/config");
      expect(getRelyingPartyName()).toBe("Murmurant");
    });
  });

  describe("configuration constants", () => {
    it("exports CHALLENGE_EXPIRATION_MS", async () => {
      const { CHALLENGE_EXPIRATION_MS } = await import("@/lib/passkey/config");
      expect(CHALLENGE_EXPIRATION_MS).toBe(5 * 60 * 1000); // 5 minutes
    });

    it("exports SESSION_COOKIE_NAME", async () => {
      const { SESSION_COOKIE_NAME } = await import("@/lib/passkey/config");
      expect(SESSION_COOKIE_NAME).toBe("murmurant_session");
    });

    it("exports SESSION_MAX_AGE_SECONDS", async () => {
      const { SESSION_MAX_AGE_SECONDS } = await import("@/lib/passkey/config");
      expect(SESSION_MAX_AGE_SECONDS).toBe(7 * 24 * 60 * 60); // 7 days
    });

    it("exports SESSION_IDLE_TIMEOUT_SECONDS", async () => {
      const { SESSION_IDLE_TIMEOUT_SECONDS } = await import(
        "@/lib/passkey/config"
      );
      expect(SESSION_IDLE_TIMEOUT_SECONDS).toBe(24 * 60 * 60); // 24 hours
    });

    it("exports MAGIC_LINK_EXPIRATION_MS", async () => {
      const { MAGIC_LINK_EXPIRATION_MS } = await import("@/lib/passkey/config");
      expect(MAGIC_LINK_EXPIRATION_MS).toBe(15 * 60 * 1000); // 15 minutes
    });

    it("exports rate limit constants", async () => {
      const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_ATTEMPTS } = await import(
        "@/lib/passkey/config"
      );
      expect(RATE_LIMIT_WINDOW_MS).toBe(60 * 1000); // 1 minute
      expect(RATE_LIMIT_MAX_ATTEMPTS).toBe(10);
    });
  });
});
