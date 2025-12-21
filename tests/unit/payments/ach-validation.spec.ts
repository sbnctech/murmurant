/**
 * Unit Tests: ACH Validation
 *
 * Tests for ACH payment method validation logic.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { describe, expect, test } from "vitest";

// Validation regex from the route (extracted for testing)
const LAST4_PATTERN = /^\d{4}$/;

describe("ACH last4 validation", () => {
  test("accepts exactly 4 digits", () => {
    expect(LAST4_PATTERN.test("1234")).toBe(true);
    expect(LAST4_PATTERN.test("0000")).toBe(true);
    expect(LAST4_PATTERN.test("9999")).toBe(true);
  });

  test("rejects less than 4 digits", () => {
    expect(LAST4_PATTERN.test("123")).toBe(false);
    expect(LAST4_PATTERN.test("12")).toBe(false);
    expect(LAST4_PATTERN.test("1")).toBe(false);
    expect(LAST4_PATTERN.test("")).toBe(false);
  });

  test("rejects more than 4 digits", () => {
    expect(LAST4_PATTERN.test("12345")).toBe(false);
    expect(LAST4_PATTERN.test("123456")).toBe(false);
  });

  test("rejects non-numeric characters", () => {
    expect(LAST4_PATTERN.test("abcd")).toBe(false);
    expect(LAST4_PATTERN.test("12ab")).toBe(false);
    expect(LAST4_PATTERN.test("12-4")).toBe(false);
    expect(LAST4_PATTERN.test("12 4")).toBe(false);
  });

  test("rejects leading/trailing whitespace", () => {
    expect(LAST4_PATTERN.test(" 1234")).toBe(false);
    expect(LAST4_PATTERN.test("1234 ")).toBe(false);
    expect(LAST4_PATTERN.test(" 1234 ")).toBe(false);
  });
});

// UUID validation regex from the route
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("Payment method ID validation", () => {
  test("accepts valid UUIDs", () => {
    expect(UUID_PATTERN.test("12345678-1234-1234-1234-123456789012")).toBe(true);
    expect(UUID_PATTERN.test("ABCDEFAB-ABCD-ABCD-ABCD-ABCDEFABCDEF")).toBe(true);
    expect(UUID_PATTERN.test("00000000-0000-0000-0000-000000000000")).toBe(true);
  });

  test("rejects invalid UUIDs", () => {
    expect(UUID_PATTERN.test("not-a-uuid")).toBe(false);
    expect(UUID_PATTERN.test("12345678-1234-1234-1234-12345678901")).toBe(false);
    expect(UUID_PATTERN.test("12345678-1234-1234-1234-1234567890123")).toBe(false);
    expect(UUID_PATTERN.test("12345678123412341234123456789012")).toBe(false);
    expect(UUID_PATTERN.test("")).toBe(false);
  });
});

describe("ACH display name generation", () => {
  function buildDisplayName(nickname: string | undefined, last4: string): string {
    return nickname
      ? `${nickname} (ACH) ending in ${last4}`
      : `Bank Account (ACH) ending in ${last4}`;
  }

  test("uses nickname when provided", () => {
    expect(buildDisplayName("My Checking", "5678")).toBe(
      "My Checking (ACH) ending in 5678"
    );
  });

  test("uses default when no nickname", () => {
    expect(buildDisplayName(undefined, "5678")).toBe(
      "Bank Account (ACH) ending in 5678"
    );
  });

  test("uses default when nickname is empty string", () => {
    expect(buildDisplayName("", "5678")).toBe("Bank Account (ACH) ending in 5678");
  });
});
