/**
 * Entitlements Service Tests
 *
 * Tests for plan-based feature gating.
 */

import { describe, it, expect } from "vitest";
import {
  isFeatureEnabled,
  getLimit,
  getLimits,
  getFeatures,
  getPlanInfo,
  isWithinLimit,
  PLANS,
  PLAN_ENTITLEMENTS,
  DEFAULT_PLAN,
} from "@/lib/entitlements";
import type { PlanCode, EntitlementContext } from "@/lib/entitlements";

// Helper to create context
function ctx(planCode?: PlanCode): EntitlementContext {
  return { orgId: "test-org", planCode };
}

describe("Entitlements Service", () => {
  describe("Constants", () => {
    it("has expected plan codes", () => {
      expect(Object.keys(PLANS)).toEqual([
        "DEMO",
        "STARTER",
        "STANDARD",
        "PROFESSIONAL",
      ]);
    });

    it("DEFAULT_PLAN is DEMO", () => {
      expect(DEFAULT_PLAN).toBe("DEMO");
    });

    it("PLAN_ENTITLEMENTS matches PLANS", () => {
      expect(PLAN_ENTITLEMENTS.DEMO).toBe(PLANS.DEMO.entitlements);
      expect(PLAN_ENTITLEMENTS.STARTER).toBe(PLANS.STARTER.entitlements);
    });
  });

  describe("isFeatureEnabled", () => {
    it("returns true for enabled features on DEMO plan", () => {
      expect(isFeatureEnabled("events.createAllowed", ctx("DEMO"))).toBe(true);
      expect(isFeatureEnabled("comms.campaignsAllowed", ctx("DEMO"))).toBe(true);
      expect(isFeatureEnabled("api.exportAllowed", ctx("DEMO"))).toBe(true);
      expect(isFeatureEnabled("publishing.advancedBlocks", ctx("DEMO"))).toBe(true);
    });

    it("returns false for disabled features on STARTER plan", () => {
      expect(isFeatureEnabled("events.createAllowed", ctx("STARTER"))).toBe(true);
      expect(isFeatureEnabled("comms.campaignsAllowed", ctx("STARTER"))).toBe(false);
      expect(isFeatureEnabled("api.exportAllowed", ctx("STARTER"))).toBe(false);
      expect(isFeatureEnabled("publishing.advancedBlocks", ctx("STARTER"))).toBe(false);
    });

    it("uses DEFAULT_PLAN when planCode not specified", () => {
      // DEFAULT_PLAN is DEMO which has all features enabled
      expect(isFeatureEnabled("events.createAllowed", ctx())).toBe(true);
      expect(isFeatureEnabled("api.exportAllowed", ctx())).toBe(true);
    });

    it("throws error when orgId is missing", () => {
      expect(() => isFeatureEnabled("events.createAllowed", { orgId: "" })).toThrow(
        "orgId is required"
      );
    });
  });

  describe("getLimit", () => {
    it("returns Infinity for DEMO plan limits", () => {
      expect(getLimit("pages.maxPublished", ctx("DEMO"))).toBe(Infinity);
      expect(getLimit("admin.maxUsers", ctx("DEMO"))).toBe(Infinity);
      expect(getLimit("events.maxPerMonth", ctx("DEMO"))).toBe(Infinity);
    });

    it("returns finite limits for STARTER plan", () => {
      expect(getLimit("pages.maxPublished", ctx("STARTER"))).toBe(5);
      expect(getLimit("admin.maxUsers", ctx("STARTER"))).toBe(2);
      expect(getLimit("events.maxPerMonth", ctx("STARTER"))).toBe(10);
    });

    it("returns higher limits for PROFESSIONAL plan", () => {
      expect(getLimit("pages.maxPublished", ctx("PROFESSIONAL"))).toBe(100);
      expect(getLimit("admin.maxUsers", ctx("PROFESSIONAL"))).toBe(20);
      expect(getLimit("events.maxPerMonth", ctx("PROFESSIONAL"))).toBe(200);
    });

    it("throws error when orgId is missing", () => {
      expect(() => getLimit("pages.maxPublished", { orgId: "" })).toThrow(
        "orgId is required"
      );
    });
  });

  describe("getLimits", () => {
    it("returns all limits for a plan", () => {
      const limits = getLimits(ctx("STARTER"));
      expect(limits).toEqual({
        "pages.maxPublished": 5,
        "admin.maxUsers": 2,
        "events.maxPerMonth": 10,
      });
    });

    it("throws error when orgId is missing", () => {
      expect(() => getLimits({ orgId: "" })).toThrow("orgId is required");
    });
  });

  describe("getFeatures", () => {
    it("returns all features for a plan", () => {
      const features = getFeatures(ctx("STANDARD"));
      expect(features).toEqual({
        "events.createAllowed": true,
        "comms.campaignsAllowed": true,
        "api.exportAllowed": false,
        "publishing.advancedBlocks": true,
      });
    });

    it("throws error when orgId is missing", () => {
      expect(() => getFeatures({ orgId: "" })).toThrow("orgId is required");
    });
  });

  describe("getPlanInfo", () => {
    it("returns plan name and description", () => {
      const info = getPlanInfo(ctx("PROFESSIONAL"));
      expect(info.code).toBe("PROFESSIONAL");
      expect(info.name).toBe("Professional");
      expect(info.description).toBe("Full features for large organizations");
    });

    it("does not include entitlements in response", () => {
      const info = getPlanInfo(ctx("DEMO"));
      expect(info).not.toHaveProperty("entitlements");
    });

    it("throws error when orgId is missing", () => {
      expect(() => getPlanInfo({ orgId: "" })).toThrow("orgId is required");
    });
  });

  describe("isWithinLimit", () => {
    it("returns true when under limit", () => {
      expect(isWithinLimit("pages.maxPublished", 3, ctx("STARTER"))).toBe(true);
      expect(isWithinLimit("admin.maxUsers", 1, ctx("STARTER"))).toBe(true);
    });

    it("returns false when at limit", () => {
      expect(isWithinLimit("pages.maxPublished", 5, ctx("STARTER"))).toBe(false);
      expect(isWithinLimit("admin.maxUsers", 2, ctx("STARTER"))).toBe(false);
    });

    it("returns false when over limit", () => {
      expect(isWithinLimit("pages.maxPublished", 10, ctx("STARTER"))).toBe(false);
    });

    it("returns true for any value on DEMO plan (Infinity)", () => {
      expect(isWithinLimit("pages.maxPublished", 1000, ctx("DEMO"))).toBe(true);
      expect(isWithinLimit("admin.maxUsers", 999, ctx("DEMO"))).toBe(true);
    });

    it("throws error when orgId is missing", () => {
      expect(() => isWithinLimit("pages.maxPublished", 1, { orgId: "" })).toThrow(
        "orgId is required"
      );
    });
  });

  describe("Plan progression", () => {
    it("STARTER has fewer features than STANDARD", () => {
      const starter = getFeatures(ctx("STARTER"));
      const standard = getFeatures(ctx("STANDARD"));

      const starterEnabled = Object.values(starter).filter(Boolean).length;
      const standardEnabled = Object.values(standard).filter(Boolean).length;

      expect(standardEnabled).toBeGreaterThan(starterEnabled);
    });

    it("PROFESSIONAL has more limits than STANDARD", () => {
      const standard = getLimits(ctx("STANDARD"));
      const professional = getLimits(ctx("PROFESSIONAL"));

      expect(professional["pages.maxPublished"]).toBeGreaterThan(
        standard["pages.maxPublished"]
      );
      expect(professional["admin.maxUsers"]).toBeGreaterThan(
        standard["admin.maxUsers"]
      );
    });
  });
});
