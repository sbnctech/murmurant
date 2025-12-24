/**
 * Lifecycle Thresholds Policy Integration Tests
 *
 * Proves that membership lifecycle thresholds come from the policy layer.
 * This is a key invariant for platform vs policy separation.
 *
 * See: Issue #235 (Membership Lifecycle Thresholds Migration)
 * See: Issue #263 (Policy Configuration Layer)
 */

import { describe, it, expect } from "vitest";
import { getPolicyDefault, POLICY_DEFAULTS } from "@/lib/policy";
import {
  inferLifecycleState,
  explainMemberLifecycle,
} from "@/lib/membership/lifecycle";

describe("lifecycle thresholds from policy layer", () => {
  describe("policy values", () => {
    it("membership.newbieDays returns 90 (SBNC default)", () => {
      const value = getPolicyDefault("membership.newbieDays");
      expect(value).toBe(90);
    });

    it("membership.extendedDays returns 730 (SBNC default)", () => {
      const value = getPolicyDefault("membership.extendedDays");
      expect(value).toBe(730);
    });

    it("policy defaults include lifecycle thresholds", () => {
      expect(POLICY_DEFAULTS).toHaveProperty("membership.newbieDays", 90);
      expect(POLICY_DEFAULTS).toHaveProperty("membership.extendedDays", 730);
    });
  });

  describe("lifecycle uses policy values", () => {
    const baseInput = {
      membershipStatusCode: "active",
      membershipTierCode: "newbie_member",
      waMembershipLevelRaw: null,
    };

    it("newbie period uses policy threshold (90 days)", () => {
      const newbieDays = getPolicyDefault("membership.newbieDays");

      // Day 89: still a newbie
      const day89 = new Date();
      day89.setDate(day89.getDate() - (newbieDays - 1));
      const stateAt89 = inferLifecycleState({
        ...baseInput,
        joinedAt: day89,
      });
      expect(stateAt89).toBe("active_newbie");

      // Day 90: no longer a newbie (transitions to active_member)
      const day90 = new Date();
      day90.setDate(day90.getDate() - newbieDays);
      const stateAt90 = inferLifecycleState({
        ...baseInput,
        joinedAt: day90,
      });
      expect(stateAt90).toBe("active_member");
    });

    it("extended period uses policy threshold (730 days)", () => {
      const extendedDays = getPolicyDefault("membership.extendedDays");

      // Day 729: still a regular member
      const day729 = new Date();
      day729.setDate(day729.getDate() - (extendedDays - 1));
      const stateAt729 = inferLifecycleState({
        ...baseInput,
        membershipTierCode: "member",
        joinedAt: day729,
      });
      expect(stateAt729).toBe("active_member");

      // Day 730: extended offer pending
      const day730 = new Date();
      day730.setDate(day730.getDate() - extendedDays);
      const stateAt730 = inferLifecycleState({
        ...baseInput,
        membershipTierCode: "member",
        joinedAt: day730,
      });
      expect(stateAt730).toBe("offer_extended");
    });

    it("explainMemberLifecycle milestones use policy values", () => {
      const newbieDays = getPolicyDefault("membership.newbieDays");
      const extendedDays = getPolicyDefault("membership.extendedDays");

      const today = new Date();
      const explanation = explainMemberLifecycle({
        ...baseInput,
        joinedAt: today,
      });

      // Verify milestones are calculated from today + policy threshold
      const expectedNewbieEnd = new Date(today);
      expectedNewbieEnd.setDate(expectedNewbieEnd.getDate() + newbieDays);

      const expectedTwoYear = new Date(today);
      expectedTwoYear.setDate(expectedTwoYear.getDate() + extendedDays);

      // Compare dates (ignoring time component)
      expect(explanation.milestones.newbieEndDate.toDateString()).toBe(
        expectedNewbieEnd.toDateString()
      );
      expect(explanation.milestones.twoYearMark.toDateString()).toBe(
        expectedTwoYear.toDateString()
      );
    });
  });

  describe("future policy customization", () => {
    it("documents that thresholds are configurable per-org in future", () => {
      // This test documents the intended future behavior.
      // When Issue #263 is complete, organizations will be able to
      // configure their own threshold values via getPolicy().
      //
      // For now, getPolicyDefault() returns SBNC defaults.
      // The lifecycle module is already wired to the policy layer,
      // so changing getPolicy() implementation will automatically
      // update lifecycle behavior.

      expect(getPolicyDefault("membership.newbieDays")).toBe(90);
      expect(getPolicyDefault("membership.extendedDays")).toBe(730);
    });
  });
});
