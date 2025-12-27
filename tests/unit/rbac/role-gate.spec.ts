/**
 * RoleGate Unit Tests
 *
 * Tests security invariant verification functions.
 * These tests ensure the capability system maintains its guarantees.
 *
 * Charter Principles:
 * - P2: Default deny, least privilege
 * - N6: Never ship without tests for permission boundaries
 */

import { describe, it, expect } from "vitest";
import {
  RoleGate,
  verifyAdminOnlyCapabilities,
  verifyFinanceIsolation,
  verifyWebmasterRestrictions,
  verifyAllInvariants,
  ADMIN_ONLY_CAPABILITIES,
  FINANCE_DENIED_ROLES,
  WEBMASTER_DENIED_CAPABILITIES,
} from "@/lib/rbac";
import { hasCapability, GlobalRole, Capability } from "@/lib/auth";

describe("RoleGate", () => {
  describe("Security Invariants", () => {
    describe("SI-1: Admin-Only Capabilities", () => {
      it("verifyAdminOnlyCapabilities does not throw", () => {
        expect(() => verifyAdminOnlyCapabilities()).not.toThrow();
      });

      it("lists all admin-only capabilities", () => {
        expect(ADMIN_ONLY_CAPABILITIES).toContain("admin:full");
        expect(ADMIN_ONLY_CAPABILITIES).toContain("events:delete");
        expect(ADMIN_ONLY_CAPABILITIES).toContain("users:manage");
        expect(ADMIN_ONLY_CAPABILITIES).toContain("files:manage");
        expect(ADMIN_ONLY_CAPABILITIES).toContain("finance:manage");
      });

      it("admin has all admin-only capabilities", () => {
        for (const cap of ADMIN_ONLY_CAPABILITIES) {
          expect(hasCapability("admin", cap)).toBe(true);
        }
      });

      it("president does not have admin-only capabilities", () => {
        for (const cap of ADMIN_ONLY_CAPABILITIES) {
          expect(hasCapability("president", cap)).toBe(false);
        }
      });

      it("vp-activities does not have admin-only capabilities", () => {
        for (const cap of ADMIN_ONLY_CAPABILITIES) {
          expect(hasCapability("vp-activities", cap)).toBe(false);
        }
      });

      it("webmaster does not have admin-only capabilities", () => {
        for (const cap of ADMIN_ONLY_CAPABILITIES) {
          expect(hasCapability("webmaster", cap)).toBe(false);
        }
      });

      it("member does not have admin-only capabilities", () => {
        for (const cap of ADMIN_ONLY_CAPABILITIES) {
          expect(hasCapability("member", cap)).toBe(false);
        }
      });
    });

    describe("SI-2: Finance Isolation", () => {
      it("verifyFinanceIsolation does not throw", () => {
        expect(() => verifyFinanceIsolation()).not.toThrow();
      });

      it("lists all finance-denied roles", () => {
        expect(FINANCE_DENIED_ROLES).toContain("webmaster");
        expect(FINANCE_DENIED_ROLES).toContain("event-chair");
        expect(FINANCE_DENIED_ROLES).toContain("vp-communications");
        expect(FINANCE_DENIED_ROLES).toContain("secretary");
        expect(FINANCE_DENIED_ROLES).toContain("parliamentarian");
        expect(FINANCE_DENIED_ROLES).toContain("member");
      });

      it("finance-denied roles cannot view finance", () => {
        for (const role of FINANCE_DENIED_ROLES) {
          expect(hasCapability(role, "finance:view")).toBe(false);
        }
      });

      it("finance-denied roles cannot manage finance", () => {
        for (const role of FINANCE_DENIED_ROLES) {
          expect(hasCapability(role, "finance:manage")).toBe(false);
        }
      });

      it("admin can view and manage finance", () => {
        expect(hasCapability("admin", "finance:view")).toBe(true);
        expect(hasCapability("admin", "finance:manage")).toBe(true);
      });

      it("president can view but not manage finance", () => {
        expect(hasCapability("president", "finance:view")).toBe(true);
        expect(hasCapability("president", "finance:manage")).toBe(false);
      });
    });

    describe("SI-3: Webmaster Restrictions", () => {
      it("verifyWebmasterRestrictions does not throw", () => {
        expect(() => verifyWebmasterRestrictions()).not.toThrow();
      });

      it("lists all webmaster-denied capabilities", () => {
        expect(WEBMASTER_DENIED_CAPABILITIES).toContain("members:history");
        expect(WEBMASTER_DENIED_CAPABILITIES).toContain("exports:access");
        expect(WEBMASTER_DENIED_CAPABILITIES).toContain("finance:view");
        expect(WEBMASTER_DENIED_CAPABILITIES).toContain("finance:manage");
        expect(WEBMASTER_DENIED_CAPABILITIES).toContain("users:manage");
        expect(WEBMASTER_DENIED_CAPABILITIES).toContain("comms:send");
        expect(WEBMASTER_DENIED_CAPABILITIES).toContain("admin:full");
        expect(WEBMASTER_DENIED_CAPABILITIES).toContain("events:delete");
      });

      it("webmaster does not have any denied capabilities", () => {
        for (const cap of WEBMASTER_DENIED_CAPABILITIES) {
          expect(hasCapability("webmaster", cap)).toBe(false);
        }
      });

      it("webmaster has publishing:manage capability", () => {
        expect(hasCapability("webmaster", "publishing:manage")).toBe(true);
      });

      it("webmaster has comms:manage capability", () => {
        expect(hasCapability("webmaster", "comms:manage")).toBe(true);
      });
    });

    describe("All Invariants", () => {
      it("verifyAllInvariants does not throw", () => {
        expect(() => verifyAllInvariants()).not.toThrow();
      });

      it("can be called via RoleGate namespace", () => {
        expect(() => RoleGate.verifyAllInvariants()).not.toThrow();
      });
    });
  });

  describe("Privilege Escalation Prevention", () => {
    const NON_ADMIN_ROLES: GlobalRole[] = [
      "president",
      "past-president",
      "vp-activities",
      "vp-communications",
      "event-chair",
      "webmaster",
      "secretary",
      "parliamentarian",
      "member",
    ];

    describe("no role can escalate to admin:full", () => {
      for (const role of NON_ADMIN_ROLES) {
        it(`${role} cannot have admin:full`, () => {
          expect(hasCapability(role, "admin:full")).toBe(false);
        });
      }
    });

    describe("no role can gain events:delete", () => {
      for (const role of NON_ADMIN_ROLES) {
        it(`${role} cannot have events:delete`, () => {
          expect(hasCapability(role, "events:delete")).toBe(false);
        });
      }
    });

    describe("no role can gain users:manage", () => {
      for (const role of NON_ADMIN_ROLES) {
        it(`${role} cannot have users:manage`, () => {
          expect(hasCapability(role, "users:manage")).toBe(false);
        });
      }
    });
  });

  describe("Role Capability Boundaries", () => {
    describe("event-chair limitations", () => {
      it("has members:view", () => {
        expect(hasCapability("event-chair", "members:view")).toBe(true);
      });

      it("has registrations:view", () => {
        expect(hasCapability("event-chair", "registrations:view")).toBe(true);
      });

      it("has events:submit", () => {
        expect(hasCapability("event-chair", "events:submit")).toBe(true);
      });

      it("does NOT have events:edit (scoped separately)", () => {
        expect(hasCapability("event-chair", "events:edit")).toBe(false);
      });

      it("does NOT have events:approve", () => {
        expect(hasCapability("event-chair", "events:approve")).toBe(false);
      });

      it("does NOT have members:history", () => {
        expect(hasCapability("event-chair", "members:history")).toBe(false);
      });
    });

    describe("secretary limitations", () => {
      it("has meetings:read", () => {
        expect(hasCapability("secretary", "meetings:read")).toBe(true);
      });

      it("has meetings:minutes:draft:create", () => {
        expect(hasCapability("secretary", "meetings:minutes:draft:create")).toBe(true);
      });

      it("does NOT have meetings:minutes:finalize", () => {
        expect(hasCapability("secretary", "meetings:minutes:finalize")).toBe(false);
      });

      it("does NOT have events:edit", () => {
        expect(hasCapability("secretary", "events:edit")).toBe(false);
      });

      it("does NOT have events:approve", () => {
        expect(hasCapability("secretary", "events:approve")).toBe(false);
      });
    });

    describe("parliamentarian limitations", () => {
      it("has governance:rules:manage", () => {
        expect(hasCapability("parliamentarian", "governance:rules:manage")).toBe(true);
      });

      it("has governance:interpretations:create", () => {
        expect(hasCapability("parliamentarian", "governance:interpretations:create")).toBe(true);
      });

      it("does NOT have meetings:minutes:draft:create", () => {
        expect(hasCapability("parliamentarian", "meetings:minutes:draft:create")).toBe(false);
      });

      it("does NOT have publishing:manage", () => {
        expect(hasCapability("parliamentarian", "publishing:manage")).toBe(false);
      });
    });

    describe("vp-communications limitations", () => {
      it("has events:view", () => {
        expect(hasCapability("vp-communications", "events:view")).toBe(true);
      });

      it("has comms:send", () => {
        expect(hasCapability("vp-communications", "comms:send")).toBe(true);
      });

      it("does NOT have events:edit", () => {
        expect(hasCapability("vp-communications", "events:edit")).toBe(false);
      });

      it("does NOT have events:approve", () => {
        expect(hasCapability("vp-communications", "events:approve")).toBe(false);
      });
    });
  });

  describe("Member Role Has No Elevated Access", () => {
    const ELEVATED_CAPABILITIES: Capability[] = [
      "admin:full",
      "publishing:manage",
      "comms:manage",
      "comms:send",
      "members:view",
      "members:history",
      "registrations:view",
      "events:view",
      "events:edit",
      "events:delete",
      "events:approve",
      "exports:access",
      "finance:view",
      "finance:manage",
      "users:manage",
      "transitions:view",
      "transitions:approve",
      "roles:assign",
    ];

    for (const cap of ELEVATED_CAPABILITIES) {
      it(`member does NOT have ${cap}`, () => {
        expect(hasCapability("member", cap)).toBe(false);
      });
    }
  });

  describe("RoleGate Constants", () => {
    it("exports ADMIN_ONLY_CAPABILITIES", () => {
      expect(RoleGate.ADMIN_ONLY_CAPABILITIES).toBeDefined();
      expect(RoleGate.ADMIN_ONLY_CAPABILITIES).toEqual(ADMIN_ONLY_CAPABILITIES);
    });

    it("exports FINANCE_DENIED_ROLES", () => {
      expect(RoleGate.FINANCE_DENIED_ROLES).toBeDefined();
      expect(RoleGate.FINANCE_DENIED_ROLES).toEqual(FINANCE_DENIED_ROLES);
    });

    it("exports WEBMASTER_DENIED_CAPABILITIES", () => {
      expect(RoleGate.WEBMASTER_DENIED_CAPABILITIES).toBeDefined();
      expect(RoleGate.WEBMASTER_DENIED_CAPABILITIES).toEqual(WEBMASTER_DENIED_CAPABILITIES);
    });
  });
});
