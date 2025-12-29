// Copyright (c) Murmurant, Inc.
// Unit tests for Dependency Isolation
// R3: Verify pass-through behavior

import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import {
  ExternalDependency,
  withIsolation,
  withIsolationSync,
  getCircuitStatus,
  getAllCircuitStatuses,
  resetCircuit,
} from "@/lib/reliability/isolation";

describe("Dependency Isolation", () => {
  describe("withIsolation", () => {
    test("passes through successful async functions", async () => {
      const fn = vi.fn().mockResolvedValue({ data: "test" });

      const result = await withIsolation(ExternalDependency.WILD_APRICOT, fn);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ data: "test" });
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test("returns success: false on error", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("API failure"));

      const result = await withIsolation(ExternalDependency.EMAIL_PROVIDER, fn);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe("API failure");
    });

    test("tracks duration", async () => {
      const fn = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve("done"), 50))
      );

      const result = await withIsolation(ExternalDependency.DATABASE, fn);

      expect(result.durationMs).toBeGreaterThanOrEqual(50);
    });

    test("returns timedOut: false (no timeout enforcement in R3)", async () => {
      const fn = vi.fn().mockResolvedValue("fast");

      const result = await withIsolation(ExternalDependency.PAYMENT_PROVIDER, fn, {
        timeoutMs: 100,
      });

      expect(result.timedOut).toBe(false);
    });

    test("returns circuitOpen: false (no circuit breaker in R3)", async () => {
      const fn = vi.fn().mockResolvedValue("ok");

      const result = await withIsolation(ExternalDependency.FILE_STORAGE, fn);

      expect(result.circuitOpen).toBe(false);
    });

    test("converts non-Error throws to Error", async () => {
      const fn = vi.fn().mockRejectedValue("string error");

      const result = await withIsolation(ExternalDependency.WEBHOOK, fn);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe("string error");
    });
  });

  describe("withIsolationSync", () => {
    test("passes through sync functions", () => {
      const fn = vi.fn().mockReturnValue(42);

      const result = withIsolationSync(ExternalDependency.DATABASE, fn);

      expect(result).toBe(42);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test("allows errors to propagate", () => {
      const fn = vi.fn().mockImplementation(() => {
        throw new Error("sync failure");
      });

      expect(() =>
        withIsolationSync(ExternalDependency.WILD_APRICOT, fn)
      ).toThrow("sync failure");
    });
  });

  describe("getCircuitStatus", () => {
    test("returns CLOSED state for all dependencies", () => {
      for (const dep of Object.values(ExternalDependency)) {
        const status = getCircuitStatus(dep);
        expect(status.state).toBe("CLOSED");
      }
    });

    test("returns zero failures", () => {
      const status = getCircuitStatus(ExternalDependency.EMAIL_PROVIDER);
      expect(status.failures).toBe(0);
    });

    test("returns null lastFailure", () => {
      const status = getCircuitStatus(ExternalDependency.PAYMENT_PROVIDER);
      expect(status.lastFailure).toBeNull();
    });
  });

  describe("getAllCircuitStatuses", () => {
    test("includes all dependencies", () => {
      const statuses = getAllCircuitStatuses();

      for (const dep of Object.values(ExternalDependency)) {
        expect(statuses[dep]).toBeDefined();
        expect(statuses[dep].state).toBe("CLOSED");
      }
    });
  });

  describe("resetCircuit", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    test("logs but is a no-op", () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      resetCircuit(ExternalDependency.WILD_APRICOT);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[ISOLATION]"),
        expect.any(Object)
      );
    });
  });

  describe("debug logging", () => {
    const originalEnv = process.env.DEBUG_ISOLATION;

    beforeEach(() => {
      vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      process.env.DEBUG_ISOLATION = originalEnv;
      vi.restoreAllMocks();
    });

    test("logs when DEBUG_ISOLATION=1", async () => {
      process.env.DEBUG_ISOLATION = "1";

      await withIsolation(ExternalDependency.DATABASE, async () => "test");

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("[ISOLATION]")
      );
    });
  });
});
