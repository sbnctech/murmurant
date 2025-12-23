import { describe, it, expect } from "vitest";
import { clampPageSize, validateTemplateParams } from "../../src/lib/query/paramValidation";

describe("validateTemplateParams", () => {
  it("denies unknown keys", () => {
    const spec = { allowedKeys: ["q"], maxPageSize: 10 };
    const res = validateTemplateParams(spec, { nope: 1 });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toContain("Unknown param key");
    }
  });

  it("allows known keys", () => {
    const spec = { allowedKeys: ["q"], maxPageSize: 10 };
    const res = validateTemplateParams(spec, { q: "hi" });
    expect(res.ok).toBe(true);
  });

  it("allows empty params", () => {
    const spec = { allowedKeys: ["q", "limit"], maxPageSize: 10 };
    const res = validateTemplateParams(spec, {});
    expect(res.ok).toBe(true);
  });
});

describe("clampPageSize", () => {
  it("clamps above max", () => {
    const spec = { allowedKeys: [], maxPageSize: 10 };
    expect(clampPageSize(spec, 999)).toBe(10);
  });

  it("clamps below minimum to 1", () => {
    const spec = { allowedKeys: [], maxPageSize: 10 };
    expect(clampPageSize(spec, 0)).toBe(1);
    expect(clampPageSize(spec, -5)).toBe(1);
  });

  it("uses maxPageSize when undefined", () => {
    const spec = { allowedKeys: [], maxPageSize: 25 };
    expect(clampPageSize(spec, undefined)).toBe(25);
  });

  it("uses maxPageSize when null", () => {
    const spec = { allowedKeys: [], maxPageSize: 25 };
    expect(clampPageSize(spec, null)).toBe(25);
  });

  it("floors decimal values", () => {
    const spec = { allowedKeys: [], maxPageSize: 100 };
    expect(clampPageSize(spec, 5.9)).toBe(5);
  });
});
