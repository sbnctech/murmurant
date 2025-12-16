/**
 * Unit tests for rollback policies
 */

import { describe, it, expect } from "vitest";
import {
  getRollbackPolicy,
  isRollbackable,
  getPoliciesForResource,
  getIrreversiblePolicies,
  ROLLBACK_POLICIES,
} from "@/lib/governance/rollback/policies";
import { policyKey } from "@/lib/governance/rollback/types";

describe("Rollback Policies", () => {
  describe("getRollbackPolicy", () => {
    it("should return policy for Event PUBLISH", () => {
      const policy = getRollbackPolicy("Event", "PUBLISH");
      expect(policy).toBeDefined();
      expect(policy?.resourceType).toBe("Event");
      expect(policy?.action).toBe("PUBLISH");
      expect(policy?.classification).toBe("COMPENSATABLE");
    });

    it("should return policy for Event UNPUBLISH", () => {
      const policy = getRollbackPolicy("Event", "UNPUBLISH");
      expect(policy).toBeDefined();
      expect(policy?.resourceType).toBe("Event");
      expect(policy?.action).toBe("UNPUBLISH");
      expect(policy?.classification).toBe("FULLY_REVERSIBLE");
    });

    it("should return policy for Member UPDATE", () => {
      const policy = getRollbackPolicy("Member", "UPDATE");
      expect(policy).toBeDefined();
      expect(policy?.resourceType).toBe("Member");
      expect(policy?.action).toBe("UPDATE");
      expect(policy?.classification).toBe("FULLY_REVERSIBLE");
    });

    it("should return null for undefined policy", () => {
      const policy = getRollbackPolicy("UnknownResource", "CREATE");
      expect(policy).toBeNull();
    });
  });

  describe("isRollbackable", () => {
    it("should return true for Event PUBLISH", () => {
      expect(isRollbackable("Event", "PUBLISH")).toBe(true);
    });

    it("should return true for Event UNPUBLISH", () => {
      expect(isRollbackable("Event", "UNPUBLISH")).toBe(true);
    });

    it("should return true for Member UPDATE", () => {
      expect(isRollbackable("Member", "UPDATE")).toBe(true);
    });

    it("should return false for MessageCampaign SEND", () => {
      expect(isRollbackable("MessageCampaign", "SEND")).toBe(false);
    });

    it("should return false for undefined policy", () => {
      expect(isRollbackable("UnknownResource", "CREATE")).toBe(false);
    });
  });

  describe("getPoliciesForResource", () => {
    it("should return all Event policies", () => {
      const policies = getPoliciesForResource("Event");
      expect(policies.length).toBeGreaterThan(0);
      expect(policies.every((p) => p.resourceType === "Event")).toBe(true);
    });

    it("should return all Member policies", () => {
      const policies = getPoliciesForResource("Member");
      expect(policies.length).toBeGreaterThan(0);
      expect(policies.every((p) => p.resourceType === "Member")).toBe(true);
    });

    it("should return empty array for unknown resource", () => {
      const policies = getPoliciesForResource("UnknownResource");
      expect(policies).toEqual([]);
    });
  });

  describe("getIrreversiblePolicies", () => {
    it("should return all irreversible policies", () => {
      const policies = getIrreversiblePolicies();
      expect(policies.length).toBeGreaterThan(0);
      expect(
        policies.every((p) => p.classification === "IRREVERSIBLE")
      ).toBe(true);
    });

    it("should include MessageCampaign SEND", () => {
      const policies = getIrreversiblePolicies();
      const sendPolicy = policies.find(
        (p) => p.resourceType === "MessageCampaign" && p.action === "SEND"
      );
      expect(sendPolicy).toBeDefined();
    });
  });

  describe("policyKey", () => {
    it("should generate correct key format", () => {
      expect(policyKey("Event", "PUBLISH")).toBe("Event:PUBLISH");
      expect(policyKey("Member", "UPDATE")).toBe("Member:UPDATE");
    });
  });

  describe("Policy Coverage", () => {
    it("should have policies for all documented resource types", () => {
      const expectedResources = [
        "Event",
        "Member",
        "RoleAssignment",
        "MemberServiceHistory",
        "TransitionPlan",
        "Page",
        "MessageCampaign",
      ];

      for (const resourceType of expectedResources) {
        const policies = getPoliciesForResource(resourceType);
        expect(policies.length).toBeGreaterThan(0);
      }
    });

    it("should have windows defined for time-sensitive policies", () => {
      const policy = getRollbackPolicy("Event", "PUBLISH");
      expect(policy?.window).toBeDefined();
      expect(policy?.window?.maxAgeMs).toBeGreaterThan(0);
      expect(policy?.window?.description).toBeDefined();
    });

    it("should have cascade checks for Event PUBLISH", () => {
      const policy = getRollbackPolicy("Event", "PUBLISH");
      expect(policy?.cascadeChecks).toBeDefined();
      expect(policy?.cascadeChecks?.length).toBeGreaterThan(0);
    });

    it("should have descriptions for all policies", () => {
      const allPolicies = Array.from(ROLLBACK_POLICIES.values());
      for (const policy of allPolicies) {
        expect(policy.description).toBeDefined();
        expect(policy.description.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Policy Classifications", () => {
    it("should classify Event PUBLISH as COMPENSATABLE", () => {
      const policy = getRollbackPolicy("Event", "PUBLISH");
      expect(policy?.classification).toBe("COMPENSATABLE");
    });

    it("should classify Event UNPUBLISH as FULLY_REVERSIBLE", () => {
      const policy = getRollbackPolicy("Event", "UNPUBLISH");
      expect(policy?.classification).toBe("FULLY_REVERSIBLE");
    });

    it("should classify MessageCampaign SEND as IRREVERSIBLE", () => {
      const policy = getRollbackPolicy("MessageCampaign", "SEND");
      expect(policy?.classification).toBe("IRREVERSIBLE");
    });
  });
});
