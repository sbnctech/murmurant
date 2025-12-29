/**
 * Unit tests for feature flag evaluation
 *
 * Tests the flag system defined in src/lib/flags/
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  isEnabled,
  evaluateFlag,
  flagKeyToEnvVar,
  getDefinition,
  isKillSwitchActive,
  getAllFlagStatus,
  getKillSwitchStatus,
  resetFlagLogging,
} from "@/lib/flags";
import { FLAG_REGISTRY } from "@/lib/flags/registry";

describe("flags", () => {
  beforeEach(() => {
    // Reset logging state between tests
    resetFlagLogging();
    // Clear any flag-related env vars
    for (const flag of FLAG_REGISTRY) {
      const envVar = flagKeyToEnvVar(flag.key);
      delete process.env[envVar];
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("flagKeyToEnvVar", () => {
    it("converts lowercase key to uppercase with prefix", () => {
      expect(flagKeyToEnvVar("my_feature")).toBe("MURMURANT_FLAG_MY_FEATURE");
    });

    it("handles already uppercase keys", () => {
      expect(flagKeyToEnvVar("MY_FEATURE")).toBe("MURMURANT_FLAG_MY_FEATURE");
    });

    it("handles mixed case keys", () => {
      expect(flagKeyToEnvVar("myFeature")).toBe("MURMURANT_FLAG_MYFEATURE");
    });
  });

  describe("getDefinition", () => {
    it("returns definition for known flag", () => {
      const def = getDefinition("event_postmortem_enabled");
      expect(def).toBeDefined();
      expect(def?.key).toBe("event_postmortem_enabled");
      expect(def?.killSwitchEligible).toBe(true);
    });

    it("returns undefined for unknown flag", () => {
      const def = getDefinition("nonexistent_flag");
      expect(def).toBeUndefined();
    });
  });

  describe("isEnabled", () => {
    it("returns default value when no env var set", () => {
      // event_postmortem_enabled defaults to true (kill switch)
      expect(isEnabled("event_postmortem_enabled")).toBe(true);

      // governance_annotations_ui defaults to false (feature flag)
      expect(isEnabled("governance_annotations_ui")).toBe(false);
    });

    it("returns true when env var is '1'", () => {
      process.env.MURMURANT_FLAG_GOVERNANCE_ANNOTATIONS_UI = "1";
      expect(isEnabled("governance_annotations_ui")).toBe(true);
    });

    it("returns true when env var is 'true'", () => {
      process.env.MURMURANT_FLAG_GOVERNANCE_ANNOTATIONS_UI = "true";
      expect(isEnabled("governance_annotations_ui")).toBe(true);
    });

    it("returns false when env var is '0'", () => {
      process.env.MURMURANT_FLAG_EVENT_POSTMORTEM_ENABLED = "0";
      expect(isEnabled("event_postmortem_enabled")).toBe(false);
    });

    it("returns false when env var is 'false'", () => {
      process.env.MURMURANT_FLAG_EVENT_POSTMORTEM_ENABLED = "false";
      expect(isEnabled("event_postmortem_enabled")).toBe(false);
    });

    it("returns false for unknown flag (fail closed)", () => {
      // Suppress console.warn for this test
      vi.spyOn(console, "warn").mockImplementation(() => {});
      expect(isEnabled("totally_unknown_flag")).toBe(false);
    });

    it("logs warning for unknown flag", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      isEnabled("totally_unknown_flag");
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[flags] Unknown flag key")
      );
    });

    it("respects override context", () => {
      // Default is false
      expect(isEnabled("governance_annotations_ui")).toBe(false);

      // Override to true
      expect(
        isEnabled("governance_annotations_ui", {
          overrides: { governance_annotations_ui: true },
        })
      ).toBe(true);
    });

    it("override takes precedence over env var", () => {
      process.env.MURMURANT_FLAG_GOVERNANCE_ANNOTATIONS_UI = "1";

      // Env says true, but override says false
      expect(
        isEnabled("governance_annotations_ui", {
          overrides: { governance_annotations_ui: false },
        })
      ).toBe(false);
    });
  });

  describe("evaluateFlag", () => {
    it("returns full evaluation result with source 'default'", () => {
      const result = evaluateFlag("governance_annotations_ui");
      expect(result).toEqual({
        key: "governance_annotations_ui",
        enabled: false,
        source: "default",
        envVar: "MURMURANT_FLAG_GOVERNANCE_ANNOTATIONS_UI",
        envValue: undefined,
        defaultValue: false,
      });
    });

    it("returns source 'env' when env var is set", () => {
      process.env.MURMURANT_FLAG_GOVERNANCE_ANNOTATIONS_UI = "1";
      const result = evaluateFlag("governance_annotations_ui");
      expect(result.source).toBe("env");
      expect(result.enabled).toBe(true);
      expect(result.envValue).toBe("1");
    });

    it("returns source 'override' when context override is set", () => {
      const result = evaluateFlag("governance_annotations_ui", {
        overrides: { governance_annotations_ui: true },
      });
      expect(result.source).toBe("override");
      expect(result.enabled).toBe(true);
    });

    it("returns default false for unknown flag", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const result = evaluateFlag("unknown_flag");
      expect(result.enabled).toBe(false);
      expect(result.source).toBe("default");
      expect(result.defaultValue).toBe(false);
    });
  });

  describe("isKillSwitchActive", () => {
    it("is semantic alias for isEnabled", () => {
      // email_sending_enabled is a kill switch, defaults to true
      expect(isKillSwitchActive("email_sending_enabled")).toBe(true);

      // Disable it
      process.env.MURMURANT_FLAG_EMAIL_SENDING_ENABLED = "0";
      expect(isKillSwitchActive("email_sending_enabled")).toBe(false);
    });
  });

  describe("getAllFlagStatus", () => {
    it("returns evaluation results for all registered flags", () => {
      const status = getAllFlagStatus();
      expect(status.length).toBe(FLAG_REGISTRY.length);

      // Check structure
      for (const result of status) {
        expect(result).toHaveProperty("key");
        expect(result).toHaveProperty("enabled");
        expect(result).toHaveProperty("source");
      }
    });
  });

  describe("getKillSwitchStatus", () => {
    it("returns only kill-switch-eligible flags", () => {
      const status = getKillSwitchStatus();

      // All returned flags should be kill switch eligible
      for (const result of status) {
        const def = getDefinition(result.key);
        expect(def?.killSwitchEligible).toBe(true);
      }

      // Should not include non-kill-switch flags
      const keys = status.map((s) => s.key);
      expect(keys).not.toContain("governance_annotations_ui");
      expect(keys).not.toContain("debug_mode_ui");
    });
  });

  describe("registry validation", () => {
    it("all flags have required fields", () => {
      for (const flag of FLAG_REGISTRY) {
        expect(flag.key).toBeTruthy();
        expect(flag.description).toBeTruthy();
        expect(typeof flag.defaultValue).toBe("boolean");
        expect(typeof flag.killSwitchEligible).toBe("boolean");
        expect(flag.surface).toBeTruthy();
        expect(flag.owner).toBeTruthy();
        expect(flag.addedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    it("kill switches default to true (convention)", () => {
      const killSwitches = FLAG_REGISTRY.filter((f) => f.killSwitchEligible);
      // These migration-related flags default to false (opt-in behavior)
      const optInKillSwitches = new Set([
        "migration_mode_enabled",
        "membership_tiers_enabled",
      ]);
      for (const ks of killSwitches) {
        // Kill switches should generally default to true (enabled)
        // Exception: opt-in migration flags default to false
        if (!optInKillSwitches.has(ks.key)) {
          expect(ks.defaultValue).toBe(true);
        }
      }
    });

    it("feature flags default to false (convention)", () => {
      const featureFlags = FLAG_REGISTRY.filter((f) => !f.killSwitchEligible);
      for (const ff of featureFlags) {
        expect(ff.defaultValue).toBe(false);
      }
    });
  });
});
