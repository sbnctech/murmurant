/**
 * Officer Gadget Configuration Unit Tests
 *
 * Tests for the role-to-gadget mapping and officer gadget logic.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { describe, it, expect } from "vitest";
import {
  OFFICER_GADGET_TYPES,
  OFFICER_GADGET_METADATA,
  ROLE_TO_GADGET,
  getOfficerGadgetType,
  getOfficerGadgetMetadata,
  hasOfficerGadget,
  getRolesWithGadgets,
  getRolesForGadget,
} from "@/components/home/officer-gadget-config";
import type { GlobalRole } from "@/lib/auth";

describe("Officer Gadget Configuration", () => {
  describe("OFFICER_GADGET_TYPES", () => {
    it("contains all expected gadget types", () => {
      expect(OFFICER_GADGET_TYPES.PRESIDENT).toBe("president");
      expect(OFFICER_GADGET_TYPES.VP_MEMBERSHIP).toBe("vp-membership");
      expect(OFFICER_GADGET_TYPES.EVENT_CHAIR).toBe("event-chair");
      expect(OFFICER_GADGET_TYPES.TECH_LEAD).toBe("tech-lead");
    });

    it("has 4 defined gadget types", () => {
      expect(Object.keys(OFFICER_GADGET_TYPES)).toHaveLength(4);
    });
  });

  describe("OFFICER_GADGET_METADATA", () => {
    it("has metadata for all gadget types", () => {
      Object.values(OFFICER_GADGET_TYPES).forEach((type) => {
        expect(OFFICER_GADGET_METADATA[type]).toBeDefined();
        expect(OFFICER_GADGET_METADATA[type].title).toBeTruthy();
        expect(OFFICER_GADGET_METADATA[type].subtitle).toBeTruthy();
        expect(OFFICER_GADGET_METADATA[type].testId).toBeTruthy();
        expect(OFFICER_GADGET_METADATA[type].adminLink).toBeTruthy();
      });
    });

    it("president gadget has correct metadata", () => {
      const meta = OFFICER_GADGET_METADATA.president;
      expect(meta.title).toBe("Governance Summary");
      expect(meta.subtitle).toBe("Board oversight");
      expect(meta.testId).toBe("president-gadget");
      expect(meta.adminLink).toBe("/admin/governance");
    });

    it("vp-membership gadget has correct metadata", () => {
      const meta = OFFICER_GADGET_METADATA["vp-membership"];
      expect(meta.title).toBe("VP Membership");
      expect(meta.testId).toBe("vp-membership-gadget");
      expect(meta.adminLink).toBe("/admin/members");
    });

    it("event-chair gadget has correct metadata", () => {
      const meta = OFFICER_GADGET_METADATA["event-chair"];
      expect(meta.title).toBe("My Events");
      expect(meta.testId).toBe("event-chair-gadget");
      expect(meta.adminLink).toBe("/admin/events");
    });

    it("tech-lead gadget has correct metadata", () => {
      const meta = OFFICER_GADGET_METADATA["tech-lead"];
      expect(meta.title).toBe("System Status");
      expect(meta.testId).toBe("tech-lead-gadget");
      expect(meta.adminLink).toBe("/admin");
    });
  });

  describe("ROLE_TO_GADGET mapping", () => {
    it("maps president to president gadget", () => {
      expect(ROLE_TO_GADGET.president).toBe("president");
    });

    it("maps vp-activities to vp-membership gadget", () => {
      expect(ROLE_TO_GADGET["vp-activities"]).toBe("vp-membership");
    });

    it("maps event-chair to event-chair gadget", () => {
      expect(ROLE_TO_GADGET["event-chair"]).toBe("event-chair");
    });

    it("maps admin to tech-lead gadget", () => {
      expect(ROLE_TO_GADGET.admin).toBe("tech-lead");
    });

    it("maps secretary to president gadget (governance view)", () => {
      expect(ROLE_TO_GADGET.secretary).toBe("president");
    });

    it("maps parliamentarian to president gadget (governance view)", () => {
      expect(ROLE_TO_GADGET.parliamentarian).toBe("president");
    });
  });

  describe("getOfficerGadgetType", () => {
    it("returns correct gadget type for officer roles", () => {
      expect(getOfficerGadgetType("president")).toBe("president");
      expect(getOfficerGadgetType("vp-activities")).toBe("vp-membership");
      expect(getOfficerGadgetType("event-chair")).toBe("event-chair");
      expect(getOfficerGadgetType("admin")).toBe("tech-lead");
    });

    it("returns null for member role", () => {
      expect(getOfficerGadgetType("member")).toBeNull();
    });

    it("returns null for unknown roles", () => {
      // @ts-expect-error Testing invalid input
      expect(getOfficerGadgetType("unknown-role")).toBeNull();
    });
  });

  describe("getOfficerGadgetMetadata", () => {
    it("returns metadata for officer roles", () => {
      const presidentMeta = getOfficerGadgetMetadata("president");
      expect(presidentMeta).not.toBeNull();
      expect(presidentMeta?.title).toBe("Governance Summary");

      const eventChairMeta = getOfficerGadgetMetadata("event-chair");
      expect(eventChairMeta).not.toBeNull();
      expect(eventChairMeta?.title).toBe("My Events");
    });

    it("returns null for member role", () => {
      expect(getOfficerGadgetMetadata("member")).toBeNull();
    });

    it("returns president metadata for secretary (shared view)", () => {
      const secretaryMeta = getOfficerGadgetMetadata("secretary");
      expect(secretaryMeta).not.toBeNull();
      expect(secretaryMeta?.title).toBe("Governance Summary");
      expect(secretaryMeta?.type).toBe("president");
    });
  });

  describe("hasOfficerGadget", () => {
    it("returns true for roles with gadgets", () => {
      expect(hasOfficerGadget("president")).toBe(true);
      expect(hasOfficerGadget("vp-activities")).toBe(true);
      expect(hasOfficerGadget("event-chair")).toBe(true);
      expect(hasOfficerGadget("admin")).toBe(true);
      expect(hasOfficerGadget("secretary")).toBe(true);
      expect(hasOfficerGadget("parliamentarian")).toBe(true);
    });

    it("returns false for member role", () => {
      expect(hasOfficerGadget("member")).toBe(false);
    });
  });

  describe("getRolesWithGadgets", () => {
    it("returns all roles that have officer gadgets", () => {
      const roles = getRolesWithGadgets();

      expect(roles).toContain("president");
      expect(roles).toContain("vp-activities");
      expect(roles).toContain("event-chair");
      expect(roles).toContain("admin");
      expect(roles).toContain("secretary");
      expect(roles).toContain("parliamentarian");
    });

    it("does not include member role", () => {
      const roles = getRolesWithGadgets();
      expect(roles).not.toContain("member");
    });

    it("returns 6 roles with gadgets", () => {
      expect(getRolesWithGadgets()).toHaveLength(6);
    });
  });

  describe("getRolesForGadget", () => {
    it("returns roles that share president gadget", () => {
      const roles = getRolesForGadget("president");
      expect(roles).toContain("president");
      expect(roles).toContain("secretary");
      expect(roles).toContain("parliamentarian");
      expect(roles).toHaveLength(3);
    });

    it("returns only event-chair for event-chair gadget", () => {
      const roles = getRolesForGadget("event-chair");
      expect(roles).toContain("event-chair");
      expect(roles).toHaveLength(1);
    });

    it("returns only vp-activities for vp-membership gadget", () => {
      const roles = getRolesForGadget("vp-membership");
      expect(roles).toContain("vp-activities");
      expect(roles).toHaveLength(1);
    });

    it("returns only admin for tech-lead gadget", () => {
      const roles = getRolesForGadget("tech-lead");
      expect(roles).toContain("admin");
      expect(roles).toHaveLength(1);
    });
  });

  describe("Gadget test IDs", () => {
    it("all test IDs follow the pattern 'role-gadget'", () => {
      Object.values(OFFICER_GADGET_METADATA).forEach((meta) => {
        expect(meta.testId).toMatch(/-gadget$/);
      });
    });

    it("test IDs are unique", () => {
      const testIds = Object.values(OFFICER_GADGET_METADATA).map(
        (m) => m.testId
      );
      const uniqueIds = new Set(testIds);
      expect(uniqueIds.size).toBe(testIds.length);
    });
  });

  describe("Admin links", () => {
    it("all admin links start with /admin", () => {
      Object.values(OFFICER_GADGET_METADATA).forEach((meta) => {
        expect(meta.adminLink).toMatch(/^\/admin/);
      });
    });
  });
});
