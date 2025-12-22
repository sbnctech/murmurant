// Copyright (c) Santa Barbara Newcomers Club
// Unit tests for breadcrumb Zod schema validation

import { describe, it, expect } from "vitest";
import {
  breadcrumbItemSchema,
  pageBreadcrumbSchema,
  validateBreadcrumb,
  type BreadcrumbItem,
  type PageBreadcrumb,
} from "@/lib/publishing/schemas";

describe("Breadcrumb Schema Validation", () => {
  describe("breadcrumbItemSchema", () => {
    it("accepts valid item with label only", () => {
      const item = { label: "Home" };
      const result = breadcrumbItemSchema.safeParse(item);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.label).toBe("Home");
        expect(result.data.href).toBeUndefined();
      }
    });

    it("accepts valid item with label and href", () => {
      const item = { label: "Events", href: "/events" };
      const result = breadcrumbItemSchema.safeParse(item);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.label).toBe("Events");
        expect(result.data.href).toBe("/events");
      }
    });

    it("rejects item with empty label", () => {
      const item = { label: "" };
      const result = breadcrumbItemSchema.safeParse(item);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("empty");
      }
    });

    it("rejects item without label", () => {
      const item = { href: "/events" };
      const result = breadcrumbItemSchema.safeParse(item);

      expect(result.success).toBe(false);
    });

    it("rejects non-object input", () => {
      const result = breadcrumbItemSchema.safeParse("invalid");

      expect(result.success).toBe(false);
    });
  });

  describe("pageBreadcrumbSchema", () => {
    it("accepts null (breadcrumbs disabled)", () => {
      const result = pageBreadcrumbSchema.safeParse(null);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it("accepts empty array (breadcrumbs enabled but empty)", () => {
      const result = pageBreadcrumbSchema.safeParse([]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it("accepts valid breadcrumb trail", () => {
      const trail: BreadcrumbItem[] = [
        { label: "Home", href: "/" },
        { label: "Events", href: "/events" },
        { label: "Summer Picnic" },
      ];
      const result = pageBreadcrumbSchema.safeParse(trail);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);
        expect(result.data![0].label).toBe("Home");
        expect(result.data![2].href).toBeUndefined();
      }
    });

    it("accepts single item trail", () => {
      const trail: BreadcrumbItem[] = [{ label: "Dashboard" }];
      const result = pageBreadcrumbSchema.safeParse(trail);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });

    it("rejects array with invalid item", () => {
      const trail = [
        { label: "Home", href: "/" },
        { label: "" }, // Invalid: empty label
      ];
      const result = pageBreadcrumbSchema.safeParse(trail);

      expect(result.success).toBe(false);
    });

    it("rejects array with missing label", () => {
      const trail = [
        { label: "Home", href: "/" },
        { href: "/events" }, // Invalid: missing label
      ];
      const result = pageBreadcrumbSchema.safeParse(trail);

      expect(result.success).toBe(false);
    });

    it("rejects non-array non-null input", () => {
      const result = pageBreadcrumbSchema.safeParse("invalid");

      expect(result.success).toBe(false);
    });

    it("rejects object instead of array", () => {
      const result = pageBreadcrumbSchema.safeParse({ label: "Home" });

      expect(result.success).toBe(false);
    });
  });

  describe("validateBreadcrumb helper", () => {
    it("returns valid=true and data=null for null input", () => {
      const result = validateBreadcrumb(null);

      expect(result.valid).toBe(true);
      expect(result.data).toBeNull();
      expect(result.errors).toHaveLength(0);
    });

    it("returns valid=true for empty array", () => {
      const result = validateBreadcrumb([]);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.errors).toHaveLength(0);
    });

    it("returns valid=true for valid trail", () => {
      const trail = [
        { label: "Home", href: "/" },
        { label: "Events" },
      ];
      const result = validateBreadcrumb(trail);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(trail);
      expect(result.errors).toHaveLength(0);
    });

    it("returns valid=false with errors for invalid input", () => {
      const trail = [{ label: "" }];
      const result = validateBreadcrumb(trail);

      expect(result.valid).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("label");
    });

    it("returns valid=false for string input", () => {
      const result = validateBreadcrumb("invalid");

      expect(result.valid).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("returns valid=false for number input", () => {
      const result = validateBreadcrumb(123);

      expect(result.valid).toBe(false);
      expect(result.data).toBeNull();
    });

    it("returns valid=false for undefined input", () => {
      const result = validateBreadcrumb(undefined);

      expect(result.valid).toBe(false);
      expect(result.data).toBeNull();
    });
  });

  describe("type inference", () => {
    it("infers correct types from schema", () => {
      // This test validates TypeScript type inference at compile time
      const item: BreadcrumbItem = { label: "Test", href: "/test" };
      const trail: PageBreadcrumb = [item];
      const nullTrail: PageBreadcrumb = null;

      expect(item.label).toBe("Test");
      expect(trail).toHaveLength(1);
      expect(nullTrail).toBeNull();
    });
  });
});
