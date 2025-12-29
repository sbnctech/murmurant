// Copyright (c) Murmurant, Inc.
// Unit tests for Starling RBAC and tone system

import { describe, it, expect } from "vitest";
import {
  getVisibilityForRole,
  canSeeVisibility,
  getToneForRole,
  TONE_PROMPTS,
  buildStarlingUserContext,
  type KnowledgeVisibility,
  type ResponseTone,
} from "@/lib/starling/types";
import type { GlobalRole } from "@/lib/auth";

describe("RBAC Visibility", () => {
  describe("getVisibilityForRole", () => {
    it("should return 'public' for unauthenticated users (null role)", () => {
      expect(getVisibilityForRole(null)).toBe("public");
    });

    it("should return 'member' for regular members", () => {
      expect(getVisibilityForRole("member")).toBe("member");
    });

    it("should return 'staff' for admin", () => {
      expect(getVisibilityForRole("admin")).toBe("staff");
    });

    it("should return 'staff' for president", () => {
      expect(getVisibilityForRole("president")).toBe("staff");
    });

    it("should return 'staff' for all officer roles", () => {
      const officerRoles: GlobalRole[] = [
        "president",
        "past-president",
        "vp-activities",
        "vp-communications",
        "event-chair",
        "webmaster",
        "secretary",
        "parliamentarian",
      ];

      officerRoles.forEach((role) => {
        expect(getVisibilityForRole(role), `Role ${role} should have staff visibility`).toBe("staff");
      });
    });
  });

  describe("canSeeVisibility", () => {
    it("staff can see all visibility levels", () => {
      expect(canSeeVisibility("staff", "staff")).toBe(true);
      expect(canSeeVisibility("staff", "member")).toBe(true);
      expect(canSeeVisibility("staff", "public")).toBe(true);
    });

    it("member can see member and public, but not staff", () => {
      expect(canSeeVisibility("member", "staff")).toBe(false);
      expect(canSeeVisibility("member", "member")).toBe(true);
      expect(canSeeVisibility("member", "public")).toBe(true);
    });

    it("public can only see public", () => {
      expect(canSeeVisibility("public", "staff")).toBe(false);
      expect(canSeeVisibility("public", "member")).toBe(false);
      expect(canSeeVisibility("public", "public")).toBe(true);
    });
  });

  describe("visibility hierarchy is strictly enforced", () => {
    const testCases: Array<{
      userLevel: KnowledgeVisibility;
      contentLevel: KnowledgeVisibility;
      expected: boolean;
      description: string;
    }> = [
      // Staff accessing content
      { userLevel: "staff", contentLevel: "staff", expected: true, description: "staff sees staff docs" },
      { userLevel: "staff", contentLevel: "member", expected: true, description: "staff sees member docs" },
      { userLevel: "staff", contentLevel: "public", expected: true, description: "staff sees public docs" },

      // Member accessing content
      { userLevel: "member", contentLevel: "staff", expected: false, description: "member CANNOT see staff docs" },
      { userLevel: "member", contentLevel: "member", expected: true, description: "member sees member docs" },
      { userLevel: "member", contentLevel: "public", expected: true, description: "member sees public docs" },

      // Public accessing content
      { userLevel: "public", contentLevel: "staff", expected: false, description: "public CANNOT see staff docs" },
      { userLevel: "public", contentLevel: "member", expected: false, description: "public CANNOT see member docs" },
      { userLevel: "public", contentLevel: "public", expected: true, description: "public sees public docs" },
    ];

    testCases.forEach(({ userLevel, contentLevel, expected, description }) => {
      it(description, () => {
        expect(canSeeVisibility(userLevel, contentLevel)).toBe(expected);
      });
    });
  });
});

describe("Response Tone", () => {
  describe("getToneForRole", () => {
    it("should return 'friendly' for unauthenticated users", () => {
      expect(getToneForRole(null)).toBe("friendly");
    });

    it("should return 'friendly' for regular members", () => {
      expect(getToneForRole("member")).toBe("friendly");
    });

    it("should return 'technical' for webmaster", () => {
      expect(getToneForRole("webmaster")).toBe("technical");
    });

    it("should return 'technical' for admin", () => {
      expect(getToneForRole("admin")).toBe("technical");
    });

    it("should return 'operational' for president", () => {
      expect(getToneForRole("president")).toBe("operational");
    });

    it("should return 'operational' for all officer roles except webmaster/admin", () => {
      const operationalRoles: GlobalRole[] = [
        "president",
        "past-president",
        "vp-activities",
        "vp-communications",
        "secretary",
        "parliamentarian",
        "event-chair",
      ];

      operationalRoles.forEach((role) => {
        expect(getToneForRole(role), `Role ${role} should have operational tone`).toBe("operational");
      });
    });
  });

  describe("TONE_PROMPTS", () => {
    it("should have all three tone types defined", () => {
      expect(TONE_PROMPTS.technical).toBeDefined();
      expect(TONE_PROMPTS.operational).toBeDefined();
      expect(TONE_PROMPTS.friendly).toBeDefined();
    });

    it("technical tone should mention being direct", () => {
      expect(TONE_PROMPTS.technical.toLowerCase()).toContain("direct");
    });

    it("operational tone should mention mock respect for officers", () => {
      expect(TONE_PROMPTS.operational.toLowerCase()).toContain("mock respect");
    });

    it("friendly tone should mention being warm and helpful", () => {
      expect(TONE_PROMPTS.friendly.toLowerCase()).toContain("warm");
      expect(TONE_PROMPTS.friendly.toLowerCase()).toContain("helpful");
    });
  });
});

describe("StarlingUserContext", () => {
  describe("buildStarlingUserContext", () => {
    it("should build context for a regular member", () => {
      const session = {
        userAccountId: "user-123",
        memberId: "member-456",
        email: "member@example.com",
        displayName: "Jane Member",
        globalRole: "member" as GlobalRole,
        organizationId: "org-789",
      };

      const context = buildStarlingUserContext(session);

      expect(context.userId).toBe("user-123");
      expect(context.memberId).toBe("member-456");
      expect(context.visibility).toBe("member");
      expect(context.tone).toBe("friendly");
    });

    it("should build context for a webmaster", () => {
      const session = {
        userAccountId: "user-123",
        memberId: "member-456",
        email: "webmaster@example.com",
        displayName: "Tech Lead",
        globalRole: "webmaster" as GlobalRole,
        organizationId: "org-789",
      };

      const context = buildStarlingUserContext(session);

      expect(context.visibility).toBe("staff");
      expect(context.tone).toBe("technical");
    });

    it("should build context for president", () => {
      const session = {
        userAccountId: "user-123",
        memberId: "member-456",
        email: "president@example.com",
        displayName: "Madam President",
        globalRole: "president" as GlobalRole,
        organizationId: "org-789",
      };

      const context = buildStarlingUserContext(session);

      expect(context.visibility).toBe("staff");
      expect(context.tone).toBe("operational");
    });
  });
});

describe("Role-based content filtering", () => {
  it("should demonstrate the security model", () => {
    // This test documents the RBAC security model

    // A member asking about internal procedures
    const memberVisibility = getVisibilityForRole("member");
    const canSeeRunbooks = canSeeVisibility(memberVisibility, "staff");
    expect(canSeeRunbooks).toBe(false); // Members cannot see runbooks

    // An admin asking about internal procedures
    const adminVisibility = getVisibilityForRole("admin");
    const adminCanSeeRunbooks = canSeeVisibility(adminVisibility, "staff");
    expect(adminCanSeeRunbooks).toBe(true); // Admins can see runbooks

    // A public visitor asking about FAQs
    const publicVisibility = getVisibilityForRole(null);
    const canSeeFAQs = canSeeVisibility(publicVisibility, "public");
    expect(canSeeFAQs).toBe(true); // Anyone can see public FAQs

    // A public visitor cannot see member policies
    const canSeePolicies = canSeeVisibility(publicVisibility, "member");
    expect(canSeePolicies).toBe(false); // Visitors cannot see member content
  });
});
