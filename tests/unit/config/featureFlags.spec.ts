/**
 * Unit Tests: Feature Flags
 *
 * Tests for feature flag helpers in src/lib/config/featureFlags.ts
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";
import { isAchEnabled, FEATURE_FLAGS } from "@/lib/config/featureFlags";

describe("isAchEnabled", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test("returns false when CLUBOS_ACH_ENABLED is not set", () => {
    delete process.env.CLUBOS_ACH_ENABLED;
    expect(isAchEnabled()).toBe(false);
  });

  test("returns false when CLUBOS_ACH_ENABLED is empty", () => {
    process.env.CLUBOS_ACH_ENABLED = "";
    expect(isAchEnabled()).toBe(false);
  });

  test("returns false when CLUBOS_ACH_ENABLED is '0'", () => {
    process.env.CLUBOS_ACH_ENABLED = "0";
    expect(isAchEnabled()).toBe(false);
  });

  test("returns false when CLUBOS_ACH_ENABLED is 'false'", () => {
    process.env.CLUBOS_ACH_ENABLED = "false";
    expect(isAchEnabled()).toBe(false);
  });

  test("returns true when CLUBOS_ACH_ENABLED is '1'", () => {
    process.env.CLUBOS_ACH_ENABLED = "1";
    expect(isAchEnabled()).toBe(true);
  });

  test("returns true when CLUBOS_ACH_ENABLED is 'true'", () => {
    process.env.CLUBOS_ACH_ENABLED = "true";
    expect(isAchEnabled()).toBe(true);
  });

  test("returns false for case-sensitive 'TRUE'", () => {
    process.env.CLUBOS_ACH_ENABLED = "TRUE";
    expect(isAchEnabled()).toBe(false);
  });
});

describe("FEATURE_FLAGS", () => {
  test("exports ACH_ENABLED constant", () => {
    expect(FEATURE_FLAGS.ACH_ENABLED).toBe("CLUBOS_ACH_ENABLED");
  });
});
