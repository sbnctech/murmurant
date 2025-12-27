/**
 * Scheduling Policy Keys Adapter Tests
 *
 * Proves that policy key accessors return stable strings that match
 * the defined SchedulingPolicyKey type. This is a no-op adapter layer
 * that prepares for future getPolicy() integration.
 *
 * Related:
 * - Issue #263: Policy Configuration Layer
 * - docs/ARCH/PLATFORM_VS_POLICY.md
 *
 * Charter Compliance:
 * - P8: Schema and APIs are stable contracts
 */

import { describe, it, expect } from "vitest";
import {
  getSchedulingTimezonePolicyKey,
  getRegistrationOpenHourPolicyKey,
  getEventArchiveDaysPolicyKey,
  getRegistrationOpenDayPolicyKey,
  getAnnouncementDayPolicyKey,
  getAnnouncementHourPolicyKey,
  SCHEDULING_POLICY_KEYS,
} from "@/lib/scheduling/policyKeys";
import { isValidPolicyKey } from "@/lib/policy/getPolicy";

describe("scheduling policy key accessors", () => {
  describe("key stability", () => {
    it("getSchedulingTimezonePolicyKey returns stable key", () => {
      const key = getSchedulingTimezonePolicyKey();
      expect(key).toBe("scheduling.timezone");
    });

    it("getRegistrationOpenHourPolicyKey returns stable key", () => {
      const key = getRegistrationOpenHourPolicyKey();
      expect(key).toBe("scheduling.registrationOpenHour");
    });

    it("getEventArchiveDaysPolicyKey returns stable key", () => {
      const key = getEventArchiveDaysPolicyKey();
      expect(key).toBe("scheduling.eventArchiveDays");
    });

    it("getRegistrationOpenDayPolicyKey returns stable key", () => {
      const key = getRegistrationOpenDayPolicyKey();
      expect(key).toBe("scheduling.registrationOpenDay");
    });

    it("getAnnouncementDayPolicyKey returns stable key", () => {
      const key = getAnnouncementDayPolicyKey();
      expect(key).toBe("scheduling.announcementDay");
    });

    it("getAnnouncementHourPolicyKey returns stable key", () => {
      const key = getAnnouncementHourPolicyKey();
      expect(key).toBe("scheduling.announcementHour");
    });
  });

  describe("key validity", () => {
    it("all accessors return valid policy keys", () => {
      expect(isValidPolicyKey(getSchedulingTimezonePolicyKey())).toBe(true);
      expect(isValidPolicyKey(getRegistrationOpenHourPolicyKey())).toBe(true);
      expect(isValidPolicyKey(getEventArchiveDaysPolicyKey())).toBe(true);
      expect(isValidPolicyKey(getRegistrationOpenDayPolicyKey())).toBe(true);
      expect(isValidPolicyKey(getAnnouncementDayPolicyKey())).toBe(true);
      expect(isValidPolicyKey(getAnnouncementHourPolicyKey())).toBe(true);
    });
  });

  describe("SCHEDULING_POLICY_KEYS constant", () => {
    it("contains all scheduling policy keys", () => {
      expect(SCHEDULING_POLICY_KEYS).toContain("scheduling.timezone");
      expect(SCHEDULING_POLICY_KEYS).toContain("scheduling.registrationOpenDay");
      expect(SCHEDULING_POLICY_KEYS).toContain("scheduling.registrationOpenHour");
      expect(SCHEDULING_POLICY_KEYS).toContain("scheduling.eventArchiveDays");
      expect(SCHEDULING_POLICY_KEYS).toContain("scheduling.announcementDay");
      expect(SCHEDULING_POLICY_KEYS).toContain("scheduling.announcementHour");
    });

    it("has exactly 6 scheduling keys", () => {
      expect(SCHEDULING_POLICY_KEYS).toHaveLength(6);
    });

    it("all keys in constant are valid policy keys", () => {
      for (const key of SCHEDULING_POLICY_KEYS) {
        expect(isValidPolicyKey(key)).toBe(true);
      }
    });
  });

  describe("future integration points", () => {
    /**
     * This test documents the intended future wiring.
     * When scheduling is fully migrated to the policy layer:
     *
     * - SBNC_TIMEZONE → getPolicy(getSchedulingTimezonePolicyKey(), orgContext)
     * - DEFAULT_REGISTRATION_OPEN_HOUR → getPolicy(getRegistrationOpenHourPolicyKey(), orgContext)
     * - ARCHIVE_DAYS_AFTER_END → getPolicy(getEventArchiveDaysPolicyKey(), orgContext)
     *
     * The key accessors exist to:
     * 1. Provide type-safe key references
     * 2. Document the mapping from constants to policies
     * 3. Enable gradual migration without breaking changes
     */
    it("documents mapping from constants to policy keys", () => {
      // src/lib/events/scheduling.ts constants → policy keys
      const mappings = {
        SBNC_TIMEZONE: getSchedulingTimezonePolicyKey(),
        DEFAULT_REGISTRATION_OPEN_HOUR: getRegistrationOpenHourPolicyKey(),
        ARCHIVE_DAYS_AFTER_END: getEventArchiveDaysPolicyKey(),
      };

      expect(mappings.SBNC_TIMEZONE).toBe("scheduling.timezone");
      expect(mappings.DEFAULT_REGISTRATION_OPEN_HOUR).toBe("scheduling.registrationOpenHour");
      expect(mappings.ARCHIVE_DAYS_AFTER_END).toBe("scheduling.eventArchiveDays");
    });
  });
});
