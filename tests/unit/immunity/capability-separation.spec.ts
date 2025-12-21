// Copyright (c) Santa Barbara Newcomers Club
// Immunity Tests: Capability Separation
//
// These tests verify that ClubOS cannot reintroduce Wild Apricot's
// coarse permission model (MF-3: Coarse Permissions).
//
// Narrative 3: Granular Capability Prevents Deletion
// - events:edit does NOT grant events:delete
// - events:manage does NOT grant events:delete
// - Only admin role has events:delete capability
//
// These tests are BLOCKING. If they fail, merges are blocked.

import { describe, it, expect } from "vitest";
import {
  hasCapability,
  GlobalRole,
  Capability,
} from "@/lib/auth";

describe("Immunity: Capability Separation (IMM-003)", () => {
  // ============================================================================
  // CORE INVARIANT: events:delete is NOT bundled with events:edit
  // ============================================================================

  describe("events:delete is separated from events:edit", () => {
    // Roles that have events:edit but should NOT have events:delete
    const editOnlyRoles: GlobalRole[] = [
      "president",
      "vp-activities",
    ];

    editOnlyRoles.forEach((role) => {
      it(`${role} has events:edit but NOT events:delete`, () => {
        // This role CAN edit events
        expect(hasCapability(role, "events:edit")).toBe(true);

        // This role CANNOT delete events
        expect(hasCapability(role, "events:delete")).toBe(false);
      });
    });
  });

  // ============================================================================
  // INVARIANT: Only admin can delete events
  // ============================================================================

  describe("only admin has events:delete capability", () => {
    const allRoles: GlobalRole[] = [
      "admin",
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

    allRoles.forEach((role) => {
      if (role === "admin") {
        it("admin HAS events:delete capability", () => {
          expect(hasCapability(role, "events:delete")).toBe(true);
        });
      } else {
        it(`${role} does NOT have events:delete capability`, () => {
          expect(hasCapability(role, "events:delete")).toBe(false);
        });
      }
    });
  });

  // ============================================================================
  // INVARIANT: events:view does not grant edit or delete
  // ============================================================================

  describe("read-only roles cannot modify", () => {
    const readOnlyRoles: GlobalRole[] = [
      "past-president",
      "event-chair",
      "member",
    ];

    readOnlyRoles.forEach((role) => {
      it(`${role} cannot delete events`, () => {
        expect(hasCapability(role, "events:delete")).toBe(false);
      });
    });
  });

  // ============================================================================
  // INVARIANT: finance capabilities are separated from event capabilities
  // ============================================================================

  describe("finance capabilities are isolated", () => {
    // Roles that manage events but should NOT see finance
    const eventRolesWithoutFinance: GlobalRole[] = [
      "vp-activities",
      "event-chair",
    ];

    eventRolesWithoutFinance.forEach((role) => {
      it(`${role} cannot view financial data`, () => {
        expect(hasCapability(role, "finance:view")).toBe(false);
        expect(hasCapability(role, "finance:manage")).toBe(false);
      });
    });

    // Webmaster specifically should never see finance
    it("webmaster cannot view financial data", () => {
      expect(hasCapability("webmaster", "finance:view")).toBe(false);
      expect(hasCapability("webmaster", "finance:manage")).toBe(false);
    });
  });

  // ============================================================================
  // INVARIANT: exports require explicit capability
  // ============================================================================

  describe("export capability is not bundled", () => {
    const rolesWithoutExport: GlobalRole[] = [
      "vp-activities",
      "event-chair",
      "webmaster",
      "secretary",
      "parliamentarian",
      "member",
    ];

    rolesWithoutExport.forEach((role) => {
      it(`${role} cannot export data`, () => {
        expect(hasCapability(role, "exports:access")).toBe(false);
      });
    });
  });
});

describe("Immunity: Delete Capability Exhaustive Check (IMM-003b)", () => {
  // ============================================================================
  // EXHAUSTIVE: Verify the ROLE_CAPABILITIES map for events:delete
  // ============================================================================

  it("events:delete appears in exactly one role (admin)", () => {
    const allRoles: GlobalRole[] = [
      "admin",
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

    const rolesWithDelete = allRoles.filter((role) =>
      hasCapability(role, "events:delete")
    );

    // Exactly one role should have events:delete
    expect(rolesWithDelete).toHaveLength(1);
    expect(rolesWithDelete[0]).toBe("admin");
  });
});
