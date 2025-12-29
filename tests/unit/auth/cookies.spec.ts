// Copyright (c) Santa Barbara Newcomers Club
// Unit tests for auth cookie utilities

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getSessionCookieName,
  getSessionCookieOptions,
  getClearSessionCookieOptions,
  SESSION_MAX_AGE_SECONDS,
  SESSION_IDLE_TIMEOUT_SECONDS,
} from "@/lib/auth/cookies";

describe("Auth Cookie Utilities", () => {
  describe("Constants", () => {
    it("SESSION_MAX_AGE_SECONDS is 30 days", () => {
      expect(SESSION_MAX_AGE_SECONDS).toBe(30 * 24 * 60 * 60);
    });

    it("SESSION_IDLE_TIMEOUT_SECONDS is 24 hours", () => {
      expect(SESSION_IDLE_TIMEOUT_SECONDS).toBe(24 * 60 * 60);
    });
  });

  describe("getSessionCookieName", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("returns __Host- prefixed name in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      const name = getSessionCookieName();
      expect(name).toBe("__Host-murmurant_session");
    });

    it("returns non-prefixed name in development", () => {
      vi.stubEnv("NODE_ENV", "development");
      const name = getSessionCookieName();
      expect(name).toBe("murmurant_session");
    });

    it("returns non-prefixed name in test environment", () => {
      vi.stubEnv("NODE_ENV", "test");
      const name = getSessionCookieName();
      expect(name).toBe("murmurant_session");
    });
  });

  describe("getSessionCookieOptions", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    describe("in production", () => {
      beforeEach(() => {
        vi.stubEnv("NODE_ENV", "production");
      });

      it("sets httpOnly to true", () => {
        const options = getSessionCookieOptions();
        expect(options.httpOnly).toBe(true);
      });

      it("sets secure to true", () => {
        const options = getSessionCookieOptions();
        expect(options.secure).toBe(true);
      });

      it("sets sameSite to lax", () => {
        const options = getSessionCookieOptions();
        expect(options.sameSite).toBe("lax");
      });

      it("sets path to /", () => {
        const options = getSessionCookieOptions();
        expect(options.path).toBe("/");
      });

      it("sets maxAge to SESSION_MAX_AGE_SECONDS", () => {
        const options = getSessionCookieOptions();
        expect(options.maxAge).toBe(SESSION_MAX_AGE_SECONDS);
      });

      it("does not set domain (required for __Host- prefix)", () => {
        const options = getSessionCookieOptions();
        expect(options.domain).toBeUndefined();
      });
    });

    describe("in development", () => {
      beforeEach(() => {
        vi.stubEnv("NODE_ENV", "development");
      });

      it("sets httpOnly to true", () => {
        const options = getSessionCookieOptions();
        expect(options.httpOnly).toBe(true);
      });

      it("sets secure to false", () => {
        const options = getSessionCookieOptions();
        expect(options.secure).toBe(false);
      });

      it("sets sameSite to lax", () => {
        const options = getSessionCookieOptions();
        expect(options.sameSite).toBe("lax");
      });

      it("sets path to /", () => {
        const options = getSessionCookieOptions();
        expect(options.path).toBe("/");
      });

      it("sets maxAge to SESSION_MAX_AGE_SECONDS", () => {
        const options = getSessionCookieOptions();
        expect(options.maxAge).toBe(SESSION_MAX_AGE_SECONDS);
      });
    });
  });

  describe("getClearSessionCookieOptions", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("sets maxAge to 0", () => {
      const options = getClearSessionCookieOptions();
      expect(options.maxAge).toBe(0);
    });

    it("preserves httpOnly", () => {
      const options = getClearSessionCookieOptions();
      expect(options.httpOnly).toBe(true);
    });

    it("sets sameSite to lax", () => {
      const options = getClearSessionCookieOptions();
      expect(options.sameSite).toBe("lax");
    });

    it("sets path to /", () => {
      const options = getClearSessionCookieOptions();
      expect(options.path).toBe("/");
    });

    describe("in production", () => {
      beforeEach(() => {
        vi.stubEnv("NODE_ENV", "production");
      });

      it("sets secure to true", () => {
        const options = getClearSessionCookieOptions();
        expect(options.secure).toBe(true);
      });
    });

    describe("in development", () => {
      beforeEach(() => {
        vi.stubEnv("NODE_ENV", "development");
      });

      it("sets secure to false", () => {
        const options = getClearSessionCookieOptions();
        expect(options.secure).toBe(false);
      });
    });
  });

  describe("Security Properties", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("production cookie name starts with __Host-", () => {
      vi.stubEnv("NODE_ENV", "production");
      const name = getSessionCookieName();
      expect(name.startsWith("__Host-")).toBe(true);
    });

    it("__Host- prefix requirements are met in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      const options = getSessionCookieOptions();

      // __Host- prefix requirements:
      // 1. Secure flag must be set
      expect(options.secure).toBe(true);

      // 2. Path must be /
      expect(options.path).toBe("/");

      // 3. Domain attribute must not be set
      expect(options.domain).toBeUndefined();
    });

    it("httpOnly is always true to prevent XSS token theft", () => {
      vi.stubEnv("NODE_ENV", "production");
      expect(getSessionCookieOptions().httpOnly).toBe(true);

      vi.stubEnv("NODE_ENV", "development");
      expect(getSessionCookieOptions().httpOnly).toBe(true);

      vi.stubEnv("NODE_ENV", "test");
      expect(getSessionCookieOptions().httpOnly).toBe(true);
    });

    it("sameSite is lax to prevent CSRF while allowing navigation", () => {
      const options = getSessionCookieOptions();
      expect(options.sameSite).toBe("lax");
    });

    it("session expiration is reasonable (30 days)", () => {
      const options = getSessionCookieOptions();
      const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
      expect(options.maxAge).toBe(thirtyDaysInSeconds);
    });

    it("idle timeout is reasonable (24 hours)", () => {
      const twentyFourHoursInSeconds = 24 * 60 * 60;
      expect(SESSION_IDLE_TIMEOUT_SECONDS).toBe(twentyFourHoursInSeconds);
    });
  });
});
