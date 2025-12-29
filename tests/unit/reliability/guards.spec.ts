// Copyright (c) Murmurant, Inc.
// Unit tests for Write and Publish Guards
// R3: Verify stubs are inert (always allow)

import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import {
  canWrite,
  requireWrite,
  canPublish,
  requirePublish,
  getGuardStatus,
} from "@/lib/reliability/guards";

describe("WRITE_GUARD", () => {
  describe("canWrite", () => {
    test("returns allowed: true by default", () => {
      const result = canWrite();
      expect(result.allowed).toBe(true);
    });

    test("returns allowed: true with context", () => {
      const result = canWrite({
        actorId: "test-actor",
        operation: "create_page",
        resourceType: "page",
        resourceId: "page-123",
      });
      expect(result.allowed).toBe(true);
    });

    test("returns no reason when allowed", () => {
      const result = canWrite();
      expect(result.reason).toBeUndefined();
    });
  });

  describe("requireWrite", () => {
    test("does not throw by default", () => {
      expect(() => requireWrite()).not.toThrow();
    });

    test("does not throw with context", () => {
      expect(() =>
        requireWrite({
          actorId: "test-actor",
          operation: "update_page",
        })
      ).not.toThrow();
    });
  });

  describe("debug logging", () => {
    const originalEnv = process.env.DEBUG_GUARDS;

    beforeEach(() => {
      vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      process.env.DEBUG_GUARDS = originalEnv;
      vi.restoreAllMocks();
    });

    test("logs when DEBUG_GUARDS=1", () => {
      process.env.DEBUG_GUARDS = "1";
      canWrite({ operation: "test" });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("[WRITE_GUARD]"),
        expect.any(Object)
      );
    });

    test("does not log when DEBUG_GUARDS is unset", () => {
      delete process.env.DEBUG_GUARDS;
      canWrite();
      expect(console.log).not.toHaveBeenCalled();
    });
  });
});

describe("PUBLISH_GUARD", () => {
  describe("canPublish", () => {
    test("returns allowed: true by default", () => {
      const result = canPublish();
      expect(result.allowed).toBe(true);
    });

    test("returns allowed: true with context", () => {
      const result = canPublish({
        actorId: "editor-1",
        operation: "publish_page",
        resourceType: "page",
      });
      expect(result.allowed).toBe(true);
    });
  });

  describe("requirePublish", () => {
    test("does not throw by default", () => {
      expect(() => requirePublish()).not.toThrow();
    });
  });
});

describe("getGuardStatus", () => {
  test("returns writesEnabled: true", () => {
    const status = getGuardStatus();
    expect(status.writesEnabled).toBe(true);
  });

  test("returns publishEnabled: true", () => {
    const status = getGuardStatus();
    expect(status.publishEnabled).toBe(true);
  });

  test("returns lastUpdated: null", () => {
    const status = getGuardStatus();
    expect(status.lastUpdated).toBeNull();
  });
});
