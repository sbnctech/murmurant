// Copyright (c) Murmurant, Inc.
// Unit tests for Failure Injection Harness
// R3: Verify disabled by default

import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import {
  InjectionPoint,
  FailureMode,
  registerInjection,
  clearInjection,
  clearAllInjections,
  getActiveInjections,
  maybeInjectFailure,
  maybeInjectFailureSync,
  getInjectionStatus,
} from "@/lib/reliability/failureInjection";

describe("Failure Injection Harness", () => {
  const originalEnv = process.env.FAIL_INJECT;

  beforeEach(() => {
    // Ensure disabled by default
    delete process.env.FAIL_INJECT;
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.FAIL_INJECT = originalEnv;
    vi.restoreAllMocks();
    clearAllInjections();
  });

  describe("when FAIL_INJECT is not set (default)", () => {
    describe("getInjectionStatus", () => {
      test("returns enabled: false", () => {
        const status = getInjectionStatus();
        expect(status.enabled).toBe(false);
      });

      test("returns activeCount: 0", () => {
        const status = getInjectionStatus();
        expect(status.activeCount).toBe(0);
      });

      test("returns empty points array", () => {
        const status = getInjectionStatus();
        expect(status.points).toEqual([]);
      });
    });

    describe("registerInjection", () => {
      test("is a no-op", () => {
        registerInjection({
          point: InjectionPoint.DB_WRITE,
          mode: FailureMode.ERROR,
        });

        const active = getActiveInjections();
        expect(active).toEqual([]);
      });
    });

    describe("maybeInjectFailure", () => {
      test("does not throw", async () => {
        await expect(
          maybeInjectFailure(InjectionPoint.DB_WRITE)
        ).resolves.toBeUndefined();
      });

      test("completes immediately", async () => {
        const start = Date.now();
        await maybeInjectFailure(InjectionPoint.EXTERNAL_API);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(10);
      });
    });

    describe("maybeInjectFailureSync", () => {
      test("does not throw", () => {
        expect(() =>
          maybeInjectFailureSync(InjectionPoint.AUTH_CHECK)
        ).not.toThrow();
      });
    });

    describe("clearInjection", () => {
      test("is a no-op", () => {
        clearInjection(InjectionPoint.DB_READ);
        // No error, just a no-op
        expect(getActiveInjections()).toEqual([]);
      });
    });

    describe("clearAllInjections", () => {
      test("is a no-op", () => {
        clearAllInjections();
        // No error, just a no-op
        expect(getActiveInjections()).toEqual([]);
      });
    });
  });

  describe("when FAIL_INJECT=1 (test mode)", () => {
    beforeEach(() => {
      process.env.FAIL_INJECT = "1";
      clearAllInjections();
    });

    describe("getInjectionStatus", () => {
      test("returns enabled: true", () => {
        const status = getInjectionStatus();
        expect(status.enabled).toBe(true);
      });
    });

    describe("registerInjection", () => {
      test("registers an injection", () => {
        registerInjection({
          point: InjectionPoint.DB_WRITE,
          mode: FailureMode.ERROR,
        });

        const active = getActiveInjections();
        expect(active.length).toBe(1);
        expect(active[0].point).toBe(InjectionPoint.DB_WRITE);
      });

      test("overwrites previous injection for same point", () => {
        registerInjection({
          point: InjectionPoint.DB_WRITE,
          mode: FailureMode.ERROR,
          errorMessage: "First",
        });

        registerInjection({
          point: InjectionPoint.DB_WRITE,
          mode: FailureMode.DELAY,
          delayMs: 100,
        });

        const active = getActiveInjections();
        expect(active.length).toBe(1);
        expect(active[0].mode).toBe(FailureMode.DELAY);
      });
    });

    describe("maybeInjectFailure", () => {
      test("throws on ERROR mode", async () => {
        registerInjection({
          point: InjectionPoint.DB_WRITE,
          mode: FailureMode.ERROR,
          errorMessage: "Injected DB failure",
        });

        await expect(
          maybeInjectFailure(InjectionPoint.DB_WRITE)
        ).rejects.toThrow("Injected DB failure");
      });

      test("delays on DELAY mode", async () => {
        registerInjection({
          point: InjectionPoint.EXTERNAL_API,
          mode: FailureMode.DELAY,
          delayMs: 100,
        });

        const start = Date.now();
        await maybeInjectFailure(InjectionPoint.EXTERNAL_API);
        const duration = Date.now() - start;

        expect(duration).toBeGreaterThanOrEqual(90);
      });

      test("delays then throws on TIMEOUT mode", async () => {
        registerInjection({
          point: InjectionPoint.PAYMENT,
          mode: FailureMode.TIMEOUT,
          delayMs: 50,
          errorMessage: "Payment timeout",
        });

        await expect(
          maybeInjectFailure(InjectionPoint.PAYMENT)
        ).rejects.toThrow("Payment timeout");
      });

      test("respects probability", async () => {
        registerInjection({
          point: InjectionPoint.EMAIL_SEND,
          mode: FailureMode.ERROR,
          probability: 0, // Never trigger
        });

        // Should not throw since probability is 0
        await expect(
          maybeInjectFailure(InjectionPoint.EMAIL_SEND)
        ).resolves.toBeUndefined();
      });

      test("does nothing for unregistered points", async () => {
        registerInjection({
          point: InjectionPoint.DB_WRITE,
          mode: FailureMode.ERROR,
        });

        // Different point should not be affected
        await expect(
          maybeInjectFailure(InjectionPoint.DB_READ)
        ).resolves.toBeUndefined();
      });
    });

    describe("maybeInjectFailureSync", () => {
      test("throws on ERROR mode", () => {
        registerInjection({
          point: InjectionPoint.AUTH_CHECK,
          mode: FailureMode.ERROR,
          errorMessage: "Auth failure",
        });

        expect(() =>
          maybeInjectFailureSync(InjectionPoint.AUTH_CHECK)
        ).toThrow("Auth failure");
      });

      test("does not throw for non-ERROR modes", () => {
        registerInjection({
          point: InjectionPoint.FILE_STORAGE,
          mode: FailureMode.NULL,
        });

        expect(() =>
          maybeInjectFailureSync(InjectionPoint.FILE_STORAGE)
        ).not.toThrow();
      });
    });

    describe("clearInjection", () => {
      test("removes specific injection", () => {
        registerInjection({
          point: InjectionPoint.DB_READ,
          mode: FailureMode.ERROR,
        });
        registerInjection({
          point: InjectionPoint.DB_WRITE,
          mode: FailureMode.DELAY,
        });

        clearInjection(InjectionPoint.DB_READ);

        const active = getActiveInjections();
        expect(active.length).toBe(1);
        expect(active[0].point).toBe(InjectionPoint.DB_WRITE);
      });
    });

    describe("clearAllInjections", () => {
      test("removes all injections", () => {
        registerInjection({
          point: InjectionPoint.DB_READ,
          mode: FailureMode.ERROR,
        });
        registerInjection({
          point: InjectionPoint.DB_WRITE,
          mode: FailureMode.DELAY,
        });

        clearAllInjections();

        expect(getActiveInjections()).toEqual([]);
      });
    });
  });

  describe("InjectionPoint enum", () => {
    test("includes all expected points", () => {
      expect(InjectionPoint.DB_READ).toBe("db_read");
      expect(InjectionPoint.DB_WRITE).toBe("db_write");
      expect(InjectionPoint.EXTERNAL_API).toBe("external_api");
      expect(InjectionPoint.EMAIL_SEND).toBe("email_send");
      expect(InjectionPoint.FILE_STORAGE).toBe("file_storage");
      expect(InjectionPoint.AUTH_CHECK).toBe("auth_check");
      expect(InjectionPoint.PAYMENT).toBe("payment");
    });
  });

  describe("FailureMode enum", () => {
    test("includes all expected modes", () => {
      expect(FailureMode.ERROR).toBe("error");
      expect(FailureMode.NULL).toBe("null");
      expect(FailureMode.DELAY).toBe("delay");
      expect(FailureMode.TIMEOUT).toBe("timeout");
      expect(FailureMode.CORRUPT).toBe("corrupt");
    });
  });
});
