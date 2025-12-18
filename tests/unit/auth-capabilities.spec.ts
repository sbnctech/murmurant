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

      it("has members:history capability", () => {
        expect(hasCapability(role, "members:history")).toBe(true);
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

      it("does NOT have members:view capability (hardened restriction)", () => {
        // Webmaster is now restricted from viewing member data by default
        // Set WEBMASTER_DEBUG_READONLY=true to enable for debugging
        expect(hasCapability(role, "members:view")).toBe(false);
      });

      it("does NOT have registrations:view capability (hardened restriction)", () => {
        // Webmaster is now restricted from viewing registration data by default
        expect(hasCapability(role, "registrations:view")).toBe(false);
      });

      it("does NOT have members:history capability", () => {
        // Webmaster cannot see member service history narrative
        expect(hasCapability(role, "members:history")).toBe(false);
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

      it("has members:history capability", () => {
        // VP roles can view member service history
        expect(hasCapability(role, "members:history")).toBe(true);
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

      it("does NOT have members:history capability", () => {
        // Event chairs see only event-related member info
        expect(hasCapability(role, "members:history")).toBe(false);
      });

      it("does NOT have publishing:manage capability", () => {
        expect(hasCapability(role, "publishing:manage")).toBe(false);
      });
    });

    describe("president role", () => {
      const role: GlobalRole = "president";

      it("has members:view capability", () => {
        expect(hasCapability(role, "members:view")).toBe(true);
      });

      it("has members:history capability", () => {
        expect(hasCapability(role, "members:history")).toBe(true);
      });

      it("has events:view capability", () => {
        expect(hasCapability(role, "events:view")).toBe(true);
      });

      it("has events:edit capability", () => {
        expect(hasCapability(role, "events:edit")).toBe(true);
      });

      it("has finance:view capability", () => {
        expect(hasCapability(role, "finance:view")).toBe(true);
      });

      it("has transitions:approve capability", () => {
        expect(hasCapability(role, "transitions:approve")).toBe(true);
      });

      it("has exports:access capability", () => {
        expect(hasCapability(role, "exports:access")).toBe(true);
      });

      it("does NOT have admin:full capability", () => {
        expect(hasCapability(role, "admin:full")).toBe(false);
      });

      it("does NOT have finance:manage capability", () => {
        // President views but treasurer manages
        expect(hasCapability(role, "finance:manage")).toBe(false);
      });

      it("does NOT have events:delete capability", () => {
        // Use cancel flow instead
        expect(hasCapability(role, "events:delete")).toBe(false);
      });
    });

    describe("past-president role", () => {
      const role: GlobalRole = "past-president";

      it("has members:view capability", () => {
        expect(hasCapability(role, "members:view")).toBe(true);
      });

      it("has members:history capability", () => {
        expect(hasCapability(role, "members:history")).toBe(true);
      });

      it("has events:view capability", () => {
        expect(hasCapability(role, "events:view")).toBe(true);
      });

      it("has transitions:view capability", () => {
        expect(hasCapability(role, "transitions:view")).toBe(true);
      });

      it("does NOT have events:edit capability", () => {
        // Advisory role - can view but not edit
        expect(hasCapability(role, "events:edit")).toBe(false);
      });

      it("does NOT have transitions:approve capability", () => {
        // Current officers only
        expect(hasCapability(role, "transitions:approve")).toBe(false);
      });

      it("does NOT have finance:view capability", () => {
        // Past role doesn't need current finance access
        expect(hasCapability(role, "finance:view")).toBe(false);
      });
    });

    describe("secretary role", () => {
      const role: GlobalRole = "secretary";

      it("does NOT have admin:full capability", () => {
        expect(hasCapability(role, "admin:full")).toBe(false);
      });

      // Secretary HAS these capabilities
      it("has meetings:read capability", () => {
        expect(hasCapability(role, "meetings:read")).toBe(true);
      });

      it("has meetings:minutes:draft:create capability", () => {
        expect(hasCapability(role, "meetings:minutes:draft:create")).toBe(true);
      });

      it("has meetings:minutes:draft:edit capability", () => {
        expect(hasCapability(role, "meetings:minutes:draft:edit")).toBe(true);
      });

      it("has meetings:minutes:draft:submit capability", () => {
        expect(hasCapability(role, "meetings:minutes:draft:submit")).toBe(true);
      });

      it("has meetings:minutes:read_all capability", () => {
        expect(hasCapability(role, "meetings:minutes:read_all")).toBe(true);
      });

      it("has governance:docs:read capability", () => {
        expect(hasCapability(role, "governance:docs:read")).toBe(true);
      });

      // Secretary does NOT have these capabilities (no escalation)
      it("does NOT have meetings:minutes:finalize capability", () => {
        // President approves final minutes
        expect(hasCapability(role, "meetings:minutes:finalize")).toBe(false);
      });

      it("does NOT have finance:view capability", () => {
        expect(hasCapability(role, "finance:view")).toBe(false);
      });

      it("does NOT have finance:manage capability", () => {
        expect(hasCapability(role, "finance:manage")).toBe(false);
      });

      it("does NOT have members:history capability", () => {
        expect(hasCapability(role, "members:history")).toBe(false);
      });

      it("does NOT have publishing:manage capability", () => {
        expect(hasCapability(role, "publishing:manage")).toBe(false);
      });

      it("does NOT have users:manage capability", () => {
        expect(hasCapability(role, "users:manage")).toBe(false);
      });

      it("does NOT have exports:access capability", () => {
        expect(hasCapability(role, "exports:access")).toBe(false);
      });

      it("does NOT have governance:docs:write capability", () => {
        // Secretary reads but does not write governance docs
        expect(hasCapability(role, "governance:docs:write")).toBe(false);
      });
    });

    describe("parliamentarian role", () => {
      const role: GlobalRole = "parliamentarian";

      it("does NOT have admin:full capability", () => {
        expect(hasCapability(role, "admin:full")).toBe(false);
      });

      // Parliamentarian HAS these capabilities
      it("has meetings:read capability", () => {
        expect(hasCapability(role, "meetings:read")).toBe(true);
      });

      it("has meetings:motions:read capability", () => {
        expect(hasCapability(role, "meetings:motions:read")).toBe(true);
      });

      it("has meetings:motions:annotate capability", () => {
        expect(hasCapability(role, "meetings:motions:annotate")).toBe(true);
      });

      it("has governance:rules:manage capability", () => {
        expect(hasCapability(role, "governance:rules:manage")).toBe(true);
      });

      it("has governance:flags:create capability", () => {
        expect(hasCapability(role, "governance:flags:create")).toBe(true);
      });

      it("has governance:interpretations:create capability", () => {
        expect(hasCapability(role, "governance:interpretations:create")).toBe(true);
      });

      it("has governance:interpretations:edit capability", () => {
        expect(hasCapability(role, "governance:interpretations:edit")).toBe(true);
      });

      it("has governance:interpretations:publish capability", () => {
        expect(hasCapability(role, "governance:interpretations:publish")).toBe(true);
      });

      it("has governance:policies:annotate capability", () => {
        expect(hasCapability(role, "governance:policies:annotate")).toBe(true);
      });

      it("has governance:policies:propose_change capability", () => {
        expect(hasCapability(role, "governance:policies:propose_change")).toBe(true);
      });

      it("has governance:docs:read capability", () => {
        expect(hasCapability(role, "governance:docs:read")).toBe(true);
      });

      it("has governance:docs:write capability", () => {
        expect(hasCapability(role, "governance:docs:write")).toBe(true);
      });

      // Parliamentarian does NOT have these capabilities (no escalation)
      it("does NOT have content:board:publish capability", () => {
        // Cannot publish member-facing content
        expect(hasCapability(role, "content:board:publish")).toBe(false);
      });

      it("does NOT have finance:view capability", () => {
        expect(hasCapability(role, "finance:view")).toBe(false);
      });

      it("does NOT have finance:manage capability", () => {
        expect(hasCapability(role, "finance:manage")).toBe(false);
      });

      it("does NOT have members:history capability", () => {
        expect(hasCapability(role, "members:history")).toBe(false);
      });

      it("does NOT have publishing:manage capability", () => {
        expect(hasCapability(role, "publishing:manage")).toBe(false);
      });

      it("does NOT have users:manage capability", () => {
        expect(hasCapability(role, "users:manage")).toBe(false);
      });

      it("does NOT have exports:access capability", () => {
        expect(hasCapability(role, "exports:access")).toBe(false);
      });

      it("does NOT have meetings:minutes:draft:create capability", () => {
        // Secretary creates minutes, not parliamentarian
        expect(hasCapability(role, "meetings:minutes:draft:create")).toBe(false);
      });
    });

    describe("member role", () => {
      const role: GlobalRole = "member";

      it("does NOT have any admin capabilities", () => {
        const capabilities: Capability[] = [
          "publishing:manage",
          "comms:manage",
          "members:view",
          "members:history",
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

    it("returns false for president role", () => {
      // President has extensive access but is NOT admin:full
      expect(isFullAdmin("president")).toBe(false);
    });

    it("returns false for past-president role", () => {
      expect(isFullAdmin("past-president")).toBe(false);
    });

    it("returns false for member role", () => {
      expect(isFullAdmin("member")).toBe(false);
    });
  });
});
