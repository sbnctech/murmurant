import { test, expect } from "@playwright/test";
import { clampPageSize, validateTemplateParams } from "../../src/lib/query/paramValidation";

test.describe("validateTemplateParams", () => {
  test("denies unknown keys", async () => {
    const spec = { allowedKeys: ["q"], maxPageSize: 10 };
    const res = validateTemplateParams(spec, { nope: 1 });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toContain("Unknown param key");
    }
  });

  test("allows known keys", async () => {
    const spec = { allowedKeys: ["q"], maxPageSize: 10 };
    const res = validateTemplateParams(spec, { q: "hi" });
    expect(res.ok).toBe(true);
  });

  test("allows empty params", async () => {
    const spec = { allowedKeys: ["q", "limit"], maxPageSize: 10 };
    const res = validateTemplateParams(spec, {});
    expect(res.ok).toBe(true);
  });
});

test.describe("clampPageSize", () => {
  test("clamps above max", async () => {
    const spec = { allowedKeys: [], maxPageSize: 10 };
    expect(clampPageSize(spec, 999)).toBe(10);
  });

  test("clamps below minimum to 1", async () => {
    const spec = { allowedKeys: [], maxPageSize: 10 };
    expect(clampPageSize(spec, 0)).toBe(1);
    expect(clampPageSize(spec, -5)).toBe(1);
  });

  test("uses maxPageSize when undefined", async () => {
    const spec = { allowedKeys: [], maxPageSize: 25 };
    expect(clampPageSize(spec, undefined)).toBe(25);
  });

  test("uses maxPageSize when null", async () => {
    const spec = { allowedKeys: [], maxPageSize: 25 };
    expect(clampPageSize(spec, null)).toBe(25);
  });

  test("floors decimal values", async () => {
    const spec = { allowedKeys: [], maxPageSize: 100 };
    expect(clampPageSize(spec, 5.9)).toBe(5);
  });
});
