// Copyright (c) Santa Barbara Newcomers Club
// Unit tests for auth capability system

import { describe, it, expect } from "vitest";
import {
  hasCapability,
  hasAnyCapability,
  isFullAdmin,
  GlobalRole,
  Capability,
} from "@/lib/auth";

describe("Auth Capabilities", () => {
  describe("hasCapability", () => {
    describe("admin role", () => {
      const role: GlobalRole = "admin";

      it("has admin:full capability", () => {
        expect(hasCapability(role, "admin:full")).toBe(true);
      });

      it("has publishing:manage capability", () => {
        expect(hasCapability(role, "publishing:manage")).toBe(true);
      });

      it("has comms:manage capability", () => {
        expect(hasCapability(role, "comms:manage")).toBe(true);
      });

      it("has members:view capability", () => {
        expect(hasCapability(role, "members:view")).toBe(true);
      });

      it("has registrations:view capability", () => {
        expect(hasCapability(role, "registrations:view")).toBe(true);
      });

      it("has exports:access capability", () => {
        expect(hasCapability(role, "exports:access")).toBe(true);
      });

      it("has finance:view capability", () => {
        expect(hasCapability(role, "finance:view")).toBe(true);
      });

      it("has finance:manage capability", () => {
        expect(hasCapability(role, "finance:manage")).toBe(true);
      });

      it("has users:manage capability", () => {
        expect(hasCapability(role, "users:manage")).toBe(true);
      });
    });

    describe("webmaster role", () => {
      const role: GlobalRole = "webmaster";

      it("does NOT have admin:full capability", () => {
        expect(hasCapability(role, "admin:full")).toBe(false);
      });

      it("has publishing:manage capability", () => {
        expect(hasCapability(role, "publishing:manage")).toBe(true);
      });

      it("has comms:manage capability", () => {
        expect(hasCapability(role, "comms:manage")).toBe(true);
      });

      it("has members:view capability (read-only support)", () => {
        expect(hasCapability(role, "members:view")).toBe(true);
      });

      it("has registrations:view capability (read-only support)", () => {
        expect(hasCapability(role, "registrations:view")).toBe(true);
      });

      it("does NOT have exports:access capability", () => {
        // Webmaster cannot export data
        expect(hasCapability(role, "exports:access")).toBe(false);
      });

      it("does NOT have finance:view capability", () => {
        // Webmaster cannot see finance data
        expect(hasCapability(role, "finance:view")).toBe(false);
      });

      it("does NOT have finance:manage capability", () => {
        expect(hasCapability(role, "finance:manage")).toBe(false);
      });

      it("does NOT have users:manage capability", () => {
        // Webmaster cannot change entitlements
        expect(hasCapability(role, "users:manage")).toBe(false);
      });
    });

    describe("vp-activities role", () => {
      const role: GlobalRole = "vp-activities";

      it("does NOT have admin:full capability", () => {
        expect(hasCapability(role, "admin:full")).toBe(false);
      });

      it("does NOT have publishing:manage capability", () => {
        expect(hasCapability(role, "publishing:manage")).toBe(false);
      });

      it("has members:view capability", () => {
        expect(hasCapability(role, "members:view")).toBe(true);
      });

      it("has registrations:view capability", () => {
        expect(hasCapability(role, "registrations:view")).toBe(true);
      });
    });

    describe("event-chair role", () => {
      const role: GlobalRole = "event-chair";

      it("has members:view capability", () => {
        expect(hasCapability(role, "members:view")).toBe(true);
      });

      it("has registrations:view capability", () => {
        expect(hasCapability(role, "registrations:view")).toBe(true);
      });

      it("does NOT have publishing:manage capability", () => {
        expect(hasCapability(role, "publishing:manage")).toBe(false);
      });
    });

    describe("member role", () => {
      const role: GlobalRole = "member";

      it("does NOT have any admin capabilities", () => {
        const capabilities: Capability[] = [
          "publishing:manage",
          "comms:manage",
          "members:view",
          "registrations:view",
          "exports:access",
          "finance:view",
          "finance:manage",
          "users:manage",
          "admin:full",
        ];

        capabilities.forEach((cap) => {
          expect(hasCapability(role, cap)).toBe(false);
        });
      });
    });
  });

  describe("hasAnyCapability", () => {
    it("returns true if role has any of the specified capabilities", () => {
      expect(
        hasAnyCapability("webmaster", ["finance:view", "publishing:manage"])
      ).toBe(true);
    });

    it("returns false if role has none of the specified capabilities", () => {
      expect(
        hasAnyCapability("webmaster", ["finance:view", "users:manage"])
      ).toBe(false);
    });

    it("returns true for admin with any capability check", () => {
      // admin:full implies all capabilities
      expect(
        hasAnyCapability("admin", ["finance:view", "users:manage"])
      ).toBe(true);
    });
  });

  describe("isFullAdmin", () => {
    it("returns true for admin role", () => {
      expect(isFullAdmin("admin")).toBe(true);
    });

    it("returns false for webmaster role", () => {
      // Critical: webmaster is NOT a full admin
      expect(isFullAdmin("webmaster")).toBe(false);
    });

    it("returns false for vp-activities role", () => {
      expect(isFullAdmin("vp-activities")).toBe(false);
    });

    it("returns false for event-chair role", () => {
      expect(isFullAdmin("event-chair")).toBe(false);
    });

    it("returns false for member role", () => {
      expect(isFullAdmin("member")).toBe(false);
    });
  });
});
