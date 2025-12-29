// Copyright (c) Murmurant, Inc.
// Unit tests for Backpressure Facade
// R3: Verify no-op behavior (always allow)

import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import {
  TrafficClass,
  enforceBackpressure,
  requireBackpressure,
  canEnqueue,
  getQueueStatus,
  getAllQueueStatuses,
  getLoadMetrics,
  getLoadMetricsByClass,
} from "@/lib/reliability/backpressure";

describe("Backpressure Facade", () => {
  describe("enforceBackpressure", () => {
    test("returns allowed: true for PUBLIC traffic", () => {
      const result = enforceBackpressure(TrafficClass.PUBLIC);
      expect(result.allowed).toBe(true);
    });

    test("returns allowed: true for MEMBER traffic", () => {
      const result = enforceBackpressure(TrafficClass.MEMBER);
      expect(result.allowed).toBe(true);
    });

    test("returns allowed: true for ADMIN traffic", () => {
      const result = enforceBackpressure(TrafficClass.ADMIN);
      expect(result.allowed).toBe(true);
    });

    test("returns allowed: true for BACKGROUND traffic", () => {
      const result = enforceBackpressure(TrafficClass.BACKGROUND);
      expect(result.allowed).toBe(true);
    });

    test("returns allowed: true for WEBHOOK traffic", () => {
      const result = enforceBackpressure(TrafficClass.WEBHOOK);
      expect(result.allowed).toBe(true);
    });

    test("returns allowed: true for SYSTEM traffic", () => {
      const result = enforceBackpressure(TrafficClass.SYSTEM);
      expect(result.allowed).toBe(true);
    });

    test("returns allowed: true with identifier option", () => {
      const result = enforceBackpressure(TrafficClass.PUBLIC, {
        identifier: "192.168.1.1",
      });
      expect(result.allowed).toBe(true);
    });

    test("returns no retryAfterMs when allowed", () => {
      const result = enforceBackpressure(TrafficClass.MEMBER);
      expect(result.retryAfterMs).toBeUndefined();
    });

    test("all traffic classes return allowed", () => {
      for (const classification of Object.values(TrafficClass)) {
        const result = enforceBackpressure(classification);
        expect(result.allowed).toBe(true);
      }
    });
  });

  describe("requireBackpressure", () => {
    test("does not throw for PUBLIC traffic", () => {
      expect(() => requireBackpressure(TrafficClass.PUBLIC)).not.toThrow();
    });

    test("does not throw for ADMIN traffic", () => {
      expect(() => requireBackpressure(TrafficClass.ADMIN)).not.toThrow();
    });

    test("does not throw for any traffic class", () => {
      for (const classification of Object.values(TrafficClass)) {
        expect(() => requireBackpressure(classification)).not.toThrow();
      }
    });
  });

  describe("canEnqueue", () => {
    test("returns true for any queue name", () => {
      expect(canEnqueue("email-queue")).toBe(true);
      expect(canEnqueue("notification-queue")).toBe(true);
      expect(canEnqueue("background-jobs")).toBe(true);
    });
  });

  describe("getQueueStatus", () => {
    test("returns healthy status", () => {
      const status = getQueueStatus("test-queue");

      expect(status.name).toBe("test-queue");
      expect(status.pending).toBe(0);
      expect(status.processing).toBe(0);
      expect(status.acceptingNew).toBe(true);
    });

    test("returns maxSize value", () => {
      const status = getQueueStatus("my-queue");
      expect(status.maxSize).toBeGreaterThan(0);
    });
  });

  describe("getAllQueueStatuses", () => {
    test("returns empty array (no queues defined in R3)", () => {
      const statuses = getAllQueueStatuses();
      expect(statuses).toEqual([]);
    });
  });

  describe("getLoadMetrics", () => {
    test("returns zero metrics", () => {
      const metrics = getLoadMetrics();

      expect(metrics.requestsPerSecond).toBe(0);
      expect(metrics.avgResponseTimeMs).toBe(0);
      expect(metrics.errorRate).toBe(0);
      expect(metrics.queueDepth).toBe(0);
      expect(metrics.activeConnections).toBe(0);
    });
  });

  describe("getLoadMetricsByClass", () => {
    test("returns zero metrics for any class", () => {
      for (const classification of Object.values(TrafficClass)) {
        const metrics = getLoadMetricsByClass(classification);
        expect(metrics.requestsPerSecond).toBe(0);
      }
    });
  });

  describe("debug logging", () => {
    const originalEnv = process.env.DEBUG_BACKPRESSURE;

    beforeEach(() => {
      vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      process.env.DEBUG_BACKPRESSURE = originalEnv;
      vi.restoreAllMocks();
    });

    test("logs when DEBUG_BACKPRESSURE=1", () => {
      process.env.DEBUG_BACKPRESSURE = "1";

      enforceBackpressure(TrafficClass.PUBLIC, { identifier: "test-ip" });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("[BACKPRESSURE]"),
        expect.anything()
      );
    });
  });
});
