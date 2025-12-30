/**
 * Gadget Registry Unit Tests
 *
 * Tests for the gadget registry, metadata, and helper functions.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { describe, it, expect } from "vitest";
import {
  GADGET_IDS,
  GADGET_METADATA,
  getGadgetTitle,
  isGadgetImplemented,
  isGadgetKnown,
  getImplementedGadgets,
  getAllGadgetIds,
  STATUS_STYLES,
  getStatusStyle,
  getAvailabilityText,
  getAvailabilityColor,
  AVAILABILITY_COLORS,
  // New RBAC exports
  GADGET_ROLES,
  canViewGadget,
  isRoleRestrictedGadget,
  getGadgetRoles,
  getOfficerGadgetIds,
  getGadgetsForRole,
} from "@/components/gadgets/gadget-registry";

describe("Gadget Registry", () => {
  describe("GADGET_IDS", () => {
    it("contains all expected member gadget IDs", () => {
      expect(GADGET_IDS.UPCOMING_EVENTS).toBe("upcoming-events");
      expect(GADGET_IDS.MY_REGISTRATIONS).toBe("my-registrations");
      expect(GADGET_IDS.ANNOUNCEMENTS).toBe("announcements");
      expect(GADGET_IDS.PRESIDENTS_MESSAGE).toBe("presidents-message");
      expect(GADGET_IDS.RECENT_PHOTOS).toBe("recent-photos");
      expect(GADGET_IDS.TASKS).toBe("tasks");
      expect(GADGET_IDS.QUICK_ACTIONS).toBe("quick-actions");
    });

    it("contains all expected officer gadget IDs", () => {
      expect(GADGET_IDS.VP_MEMBERSHIP).toBe("vp-membership");
      expect(GADGET_IDS.EVENT_CHAIR).toBe("event-chair");
      expect(GADGET_IDS.PRESIDENT).toBe("president");
      expect(GADGET_IDS.TECH_LEAD).toBe("tech-lead");
    });

    it("has 11 defined gadget IDs (7 member + 4 officer)", () => {
      expect(Object.keys(GADGET_IDS)).toHaveLength(11);
    });
  });

  describe("GADGET_METADATA", () => {
    it("has metadata for all gadget IDs", () => {
      Object.values(GADGET_IDS).forEach((id) => {
        expect(GADGET_METADATA[id]).toBeDefined();
        expect(GADGET_METADATA[id].title).toBeTruthy();
        expect(typeof GADGET_METADATA[id].implemented).toBe("boolean");
      });
    });

    it("marks upcoming-events as implemented", () => {
      expect(GADGET_METADATA["upcoming-events"].implemented).toBe(true);
      expect(GADGET_METADATA["upcoming-events"].title).toBe("Upcoming Events");
    });

    it("marks my-registrations as implemented", () => {
      expect(GADGET_METADATA["my-registrations"].implemented).toBe(true);
      expect(GADGET_METADATA["my-registrations"].title).toBe("My Registrations");
    });

    it("marks future gadgets as not implemented", () => {
      expect(GADGET_METADATA["announcements"].implemented).toBe(false);
      expect(GADGET_METADATA["presidents-message"].implemented).toBe(false);
      expect(GADGET_METADATA["recent-photos"].implemented).toBe(false);
      expect(GADGET_METADATA["tasks"].implemented).toBe(false);
      expect(GADGET_METADATA["quick-actions"].implemented).toBe(false);
    });
  });

  describe("getGadgetTitle", () => {
    it("returns correct title for known gadgets", () => {
      expect(getGadgetTitle("upcoming-events")).toBe("Upcoming Events");
      expect(getGadgetTitle("my-registrations")).toBe("My Registrations");
      expect(getGadgetTitle("announcements")).toBe("Announcements");
      expect(getGadgetTitle("presidents-message")).toBe("President's Message");
    });

    it("returns 'Unknown Gadget' for unknown IDs", () => {
      expect(getGadgetTitle("non-existent")).toBe("Unknown Gadget");
      expect(getGadgetTitle("")).toBe("Unknown Gadget");
      expect(getGadgetTitle("random-id")).toBe("Unknown Gadget");
    });
  });

  describe("isGadgetImplemented", () => {
    it("returns true for implemented gadgets", () => {
      expect(isGadgetImplemented("upcoming-events")).toBe(true);
      expect(isGadgetImplemented("my-registrations")).toBe(true);
    });

    it("returns false for unimplemented gadgets", () => {
      expect(isGadgetImplemented("announcements")).toBe(false);
      expect(isGadgetImplemented("presidents-message")).toBe(false);
    });

    it("returns false for unknown gadgets", () => {
      expect(isGadgetImplemented("non-existent")).toBe(false);
      expect(isGadgetImplemented("random-id")).toBe(false);
    });
  });

  describe("isGadgetKnown", () => {
    it("returns true for registered gadgets", () => {
      expect(isGadgetKnown("upcoming-events")).toBe(true);
      expect(isGadgetKnown("my-registrations")).toBe(true);
      expect(isGadgetKnown("announcements")).toBe(true);
    });

    it("returns false for unregistered gadgets", () => {
      expect(isGadgetKnown("non-existent")).toBe(false);
      expect(isGadgetKnown("")).toBe(false);
      expect(isGadgetKnown("random-id")).toBe(false);
    });
  });

  describe("getImplementedGadgets", () => {
    it("returns only implemented gadgets", () => {
      const implemented = getImplementedGadgets();
      expect(implemented).toContain("upcoming-events");
      expect(implemented).toContain("my-registrations");
      expect(implemented).not.toContain("announcements");
      expect(implemented).not.toContain("presidents-message");
    });

    it("returns 6 implemented gadgets (2 member + 4 officer)", () => {
      // Member gadgets: upcoming-events, my-registrations
      // Officer gadgets: vp-membership, event-chair, president, tech-lead
      expect(getImplementedGadgets()).toHaveLength(6);
    });
  });

  describe("getAllGadgetIds", () => {
    it("returns all registered gadget IDs", () => {
      const all = getAllGadgetIds();
      expect(all).toHaveLength(11);
      // Member gadgets
      expect(all).toContain("upcoming-events");
      expect(all).toContain("my-registrations");
      expect(all).toContain("announcements");
      expect(all).toContain("presidents-message");
      expect(all).toContain("recent-photos");
      expect(all).toContain("tasks");
      expect(all).toContain("quick-actions");
      // Officer gadgets
      expect(all).toContain("vp-membership");
      expect(all).toContain("event-chair");
      expect(all).toContain("president");
      expect(all).toContain("tech-lead");
    });
  });
});

describe("Gadget RBAC (Role-Gating)", () => {
  describe("GADGET_ROLES", () => {
    it("has role restrictions for officer gadgets", () => {
      expect(GADGET_ROLES["vp-membership"]).toBeDefined();
      expect(GADGET_ROLES["event-chair"]).toBeDefined();
      expect(GADGET_ROLES["president"]).toBeDefined();
      expect(GADGET_ROLES["tech-lead"]).toBeDefined();
    });

    it("vp-membership requires vp-activities or admin role", () => {
      expect(GADGET_ROLES["vp-membership"]).toContain("vp-activities");
      expect(GADGET_ROLES["vp-membership"]).toContain("admin");
    });

    it("event-chair requires event-chair or admin role", () => {
      expect(GADGET_ROLES["event-chair"]).toContain("event-chair");
      expect(GADGET_ROLES["event-chair"]).toContain("admin");
    });

    it("president requires president, secretary, parliamentarian, or admin", () => {
      expect(GADGET_ROLES["president"]).toContain("president");
      expect(GADGET_ROLES["president"]).toContain("secretary");
      expect(GADGET_ROLES["president"]).toContain("parliamentarian");
      expect(GADGET_ROLES["president"]).toContain("admin");
    });

    it("tech-lead requires admin only", () => {
      expect(GADGET_ROLES["tech-lead"]).toEqual(["admin"]);
    });

    it("member gadgets have no role restrictions", () => {
      expect(GADGET_ROLES["upcoming-events"]).toBeUndefined();
      expect(GADGET_ROLES["my-registrations"]).toBeUndefined();
    });
  });

  describe("isRoleRestrictedGadget", () => {
    it("returns true for officer gadgets", () => {
      expect(isRoleRestrictedGadget("vp-membership")).toBe(true);
      expect(isRoleRestrictedGadget("event-chair")).toBe(true);
      expect(isRoleRestrictedGadget("president")).toBe(true);
      expect(isRoleRestrictedGadget("tech-lead")).toBe(true);
    });

    it("returns false for member gadgets", () => {
      expect(isRoleRestrictedGadget("upcoming-events")).toBe(false);
      expect(isRoleRestrictedGadget("my-registrations")).toBe(false);
      expect(isRoleRestrictedGadget("announcements")).toBe(false);
    });

    it("returns false for unknown gadgets", () => {
      expect(isRoleRestrictedGadget("unknown-gadget")).toBe(false);
    });
  });

  describe("getGadgetRoles", () => {
    it("returns allowed roles for officer gadgets", () => {
      expect(getGadgetRoles("vp-membership")).toEqual(["vp-activities", "admin"]);
      expect(getGadgetRoles("tech-lead")).toEqual(["admin"]);
    });

    it("returns null for member gadgets", () => {
      expect(getGadgetRoles("upcoming-events")).toBeNull();
      expect(getGadgetRoles("my-registrations")).toBeNull();
    });

    it("returns null for unknown gadgets", () => {
      expect(getGadgetRoles("unknown-gadget")).toBeNull();
    });
  });

  describe("getOfficerGadgetIds", () => {
    it("returns all officer gadget IDs", () => {
      const officerGadgets = getOfficerGadgetIds();
      expect(officerGadgets).toHaveLength(4);
      expect(officerGadgets).toContain("vp-membership");
      expect(officerGadgets).toContain("event-chair");
      expect(officerGadgets).toContain("president");
      expect(officerGadgets).toContain("tech-lead");
    });

    it("does not include member gadgets", () => {
      const officerGadgets = getOfficerGadgetIds();
      expect(officerGadgets).not.toContain("upcoming-events");
      expect(officerGadgets).not.toContain("my-registrations");
    });
  });

  describe("getGadgetsForRole", () => {
    it("returns gadgets for admin role", () => {
      const adminGadgets = getGadgetsForRole("admin");
      expect(adminGadgets).toContain("vp-membership");
      expect(adminGadgets).toContain("event-chair");
      expect(adminGadgets).toContain("president");
      expect(adminGadgets).toContain("tech-lead");
    });

    it("returns gadgets for vp-activities role", () => {
      const vpGadgets = getGadgetsForRole("vp-activities");
      expect(vpGadgets).toContain("vp-membership");
      expect(vpGadgets).not.toContain("tech-lead");
    });

    it("returns gadgets for president role", () => {
      const presGadgets = getGadgetsForRole("president");
      expect(presGadgets).toContain("president");
      expect(presGadgets).not.toContain("tech-lead");
    });

    it("returns empty array for member role", () => {
      expect(getGadgetsForRole("member")).toEqual([]);
    });
  });

  describe("canViewGadget", () => {
    describe("member gadgets (no restrictions)", () => {
      it("allows anyone to view upcoming-events", () => {
        expect(canViewGadget("upcoming-events", null)).toBe(true);
        expect(canViewGadget("upcoming-events", "member")).toBe(true);
        expect(canViewGadget("upcoming-events", "admin")).toBe(true);
      });

      it("allows anyone to view my-registrations", () => {
        expect(canViewGadget("my-registrations", null)).toBe(true);
        expect(canViewGadget("my-registrations", "member")).toBe(true);
      });
    });

    describe("officer gadgets (role-restricted)", () => {
      it("denies unauthenticated users", () => {
        expect(canViewGadget("vp-membership", null)).toBe(false);
        expect(canViewGadget("tech-lead", null)).toBe(false);
        expect(canViewGadget("president", null)).toBe(false);
      });

      it("denies members without matching role", () => {
        expect(canViewGadget("vp-membership", "member")).toBe(false);
        expect(canViewGadget("tech-lead", "member")).toBe(false);
        expect(canViewGadget("president", "member")).toBe(false);
      });

      it("allows vp-activities to view vp-membership gadget", () => {
        expect(canViewGadget("vp-membership", "vp-activities")).toBe(true);
      });

      it("allows event-chair to view event-chair gadget", () => {
        expect(canViewGadget("event-chair", "event-chair")).toBe(true);
      });

      it("allows president to view president gadget", () => {
        expect(canViewGadget("president", "president")).toBe(true);
      });

      it("allows secretary to view president gadget", () => {
        expect(canViewGadget("president", "secretary")).toBe(true);
      });

      it("allows admin to view all officer gadgets", () => {
        expect(canViewGadget("vp-membership", "admin")).toBe(true);
        expect(canViewGadget("event-chair", "admin")).toBe(true);
        expect(canViewGadget("president", "admin")).toBe(true);
        expect(canViewGadget("tech-lead", "admin")).toBe(true);
      });

      it("denies non-admin to view tech-lead gadget", () => {
        expect(canViewGadget("tech-lead", "president")).toBe(false);
        expect(canViewGadget("tech-lead", "event-chair")).toBe(false);
      });
    });

    describe("visibility settings", () => {
      it("allows public visibility for anyone", () => {
        expect(canViewGadget("upcoming-events", null, "public")).toBe(true);
        expect(canViewGadget("upcoming-events", "member", "public")).toBe(true);
      });

      it("requires authentication for members visibility", () => {
        expect(canViewGadget("upcoming-events", null, "members")).toBe(false);
        expect(canViewGadget("upcoming-events", "member", "members")).toBe(true);
        expect(canViewGadget("upcoming-events", "admin", "members")).toBe(true);
      });

      it("requires non-member role for officers visibility", () => {
        expect(canViewGadget("upcoming-events", null, "officers")).toBe(false);
        expect(canViewGadget("upcoming-events", "member", "officers")).toBe(false);
        expect(canViewGadget("upcoming-events", "president", "officers")).toBe(true);
        expect(canViewGadget("upcoming-events", "admin", "officers")).toBe(true);
      });

      it("requires specific roles for roles visibility", () => {
        expect(canViewGadget("upcoming-events", null, "roles", ["admin"])).toBe(false);
        expect(canViewGadget("upcoming-events", "member", "roles", ["admin"])).toBe(false);
        expect(canViewGadget("upcoming-events", "admin", "roles", ["admin"])).toBe(true);
        expect(canViewGadget("upcoming-events", "admin", "roles", ["president"])).toBe(false);
      });

      it("handles empty allowedRoles array", () => {
        expect(canViewGadget("upcoming-events", "admin", "roles", [])).toBe(false);
      });
    });
  });
});

describe("Status Styles", () => {
  describe("STATUS_STYLES", () => {
    it("has styles for all registration statuses", () => {
      expect(STATUS_STYLES.CONFIRMED).toBeDefined();
      expect(STATUS_STYLES.PENDING).toBeDefined();
      expect(STATUS_STYLES.PENDING_PAYMENT).toBeDefined();
      expect(STATUS_STYLES.WAITLISTED).toBeDefined();
      expect(STATUS_STYLES.CANCELLED).toBeDefined();
    });

    it("each status has bg, text, and label", () => {
      Object.values(STATUS_STYLES).forEach((style) => {
        expect(style.bg).toBeTruthy();
        expect(style.text).toBeTruthy();
        expect(style.label).toBeTruthy();
      });
    });

    it("CONFIRMED has green styling", () => {
      expect(STATUS_STYLES.CONFIRMED.bg).toBe("#d1fae5");
      expect(STATUS_STYLES.CONFIRMED.text).toBe("#065f46");
      expect(STATUS_STYLES.CONFIRMED.label).toBe("Confirmed");
    });

    it("CANCELLED has red styling", () => {
      expect(STATUS_STYLES.CANCELLED.bg).toBe("#fee2e2");
      expect(STATUS_STYLES.CANCELLED.text).toBe("#991b1b");
      expect(STATUS_STYLES.CANCELLED.label).toBe("Cancelled");
    });

    it("WAITLISTED has warning styling", () => {
      expect(STATUS_STYLES.WAITLISTED.bg).toBe("#fef3c7");
      expect(STATUS_STYLES.WAITLISTED.text).toBe("#92400e");
      expect(STATUS_STYLES.WAITLISTED.label).toBe("Waitlisted");
    });
  });

  describe("getStatusStyle", () => {
    it("returns correct style for known statuses", () => {
      expect(getStatusStyle("CONFIRMED").label).toBe("Confirmed");
      expect(getStatusStyle("WAITLISTED").label).toBe("Waitlisted");
      expect(getStatusStyle("CANCELLED").label).toBe("Cancelled");
    });

    it("returns fallback style for unknown statuses", () => {
      const style = getStatusStyle("UNKNOWN_STATUS");
      expect(style.bg).toBe("#f3f4f6");
      expect(style.text).toBe("#374151");
      expect(style.label).toBe("UNKNOWN_STATUS"); // Uses status as label
    });
  });
});

describe("Availability Helpers", () => {
  describe("getAvailabilityText", () => {
    it("returns 'Waitlist open' when waitlist is open", () => {
      expect(
        getAvailabilityText({ spotsRemaining: 0, isWaitlistOpen: true })
      ).toBe("Waitlist open");
      expect(
        getAvailabilityText({ spotsRemaining: 5, isWaitlistOpen: true })
      ).toBe("Waitlist open");
    });

    it("returns 'Open' when spots are unlimited", () => {
      expect(
        getAvailabilityText({ spotsRemaining: null, isWaitlistOpen: false })
      ).toBe("Open");
    });

    it("returns 'Full' when no spots remain", () => {
      expect(
        getAvailabilityText({ spotsRemaining: 0, isWaitlistOpen: false })
      ).toBe("Full");
    });

    it("returns spot count when spots are available", () => {
      expect(
        getAvailabilityText({ spotsRemaining: 5, isWaitlistOpen: false })
      ).toBe("5 spots");
      expect(
        getAvailabilityText({ spotsRemaining: 1, isWaitlistOpen: false })
      ).toBe("1 spots");
      expect(
        getAvailabilityText({ spotsRemaining: 100, isWaitlistOpen: false })
      ).toBe("100 spots");
    });
  });

  describe("getAvailabilityColor", () => {
    it("returns FULL color when waitlist is open", () => {
      expect(
        getAvailabilityColor({ spotsRemaining: 5, isWaitlistOpen: true })
      ).toBe(AVAILABILITY_COLORS.FULL);
    });

    it("returns FULL color when no spots remain", () => {
      expect(
        getAvailabilityColor({ spotsRemaining: 0, isWaitlistOpen: false })
      ).toBe(AVAILABILITY_COLORS.FULL);
    });

    it("returns LOW color when spots are 3 or fewer", () => {
      expect(
        getAvailabilityColor({ spotsRemaining: 3, isWaitlistOpen: false })
      ).toBe(AVAILABILITY_COLORS.LOW);
      expect(
        getAvailabilityColor({ spotsRemaining: 1, isWaitlistOpen: false })
      ).toBe(AVAILABILITY_COLORS.LOW);
      expect(
        getAvailabilityColor({ spotsRemaining: 2, isWaitlistOpen: false })
      ).toBe(AVAILABILITY_COLORS.LOW);
    });

    it("returns AVAILABLE color when more than 3 spots", () => {
      expect(
        getAvailabilityColor({ spotsRemaining: 4, isWaitlistOpen: false })
      ).toBe(AVAILABILITY_COLORS.AVAILABLE);
      expect(
        getAvailabilityColor({ spotsRemaining: 10, isWaitlistOpen: false })
      ).toBe(AVAILABILITY_COLORS.AVAILABLE);
    });

    it("returns AVAILABLE color when unlimited spots", () => {
      expect(
        getAvailabilityColor({ spotsRemaining: null, isWaitlistOpen: false })
      ).toBe(AVAILABILITY_COLORS.AVAILABLE);
    });
  });

  describe("AVAILABILITY_COLORS", () => {
    it("has correct color values", () => {
      expect(AVAILABILITY_COLORS.FULL).toBe("#dc2626"); // Red
      expect(AVAILABILITY_COLORS.LOW).toBe("#ea580c"); // Orange
      expect(AVAILABILITY_COLORS.AVAILABLE).toBe("#16a34a"); // Green
    });
  });
});
