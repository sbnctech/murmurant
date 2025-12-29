// Copyright (c) Murmurant, Inc.
// Unit tests for Kill Switch Registry
// R3: Verify all switches default to OFF

import { describe, expect, test, vi, afterEach } from "vitest";
import {
  KillSwitch,
  isKillSwitchEnabled,
  getKillSwitchState,
  getAllKillSwitchStates,
  setKillSwitch,
  isReadOnlyMode,
  isPublishFrozen,
  isAdminDisabled,
} from "@/lib/reliability/killSwitch";

describe("Kill Switch Registry", () => {
  describe("isKillSwitchEnabled", () => {
    test("WRITE_DISABLED returns false", () => {
      expect(isKillSwitchEnabled(KillSwitch.WRITE_DISABLED)).toBe(false);
    });

    test("PUBLISH_DISABLED returns false", () => {
      expect(isKillSwitchEnabled(KillSwitch.PUBLISH_DISABLED)).toBe(false);
    });

    test("ADMIN_DISABLED returns false", () => {
      expect(isKillSwitchEnabled(KillSwitch.ADMIN_DISABLED)).toBe(false);
    });

    test("PREVIEW_DISABLED returns false", () => {
      expect(isKillSwitchEnabled(KillSwitch.PREVIEW_DISABLED)).toBe(false);
    });

    test("EXTERNAL_APIS_DISABLED returns false", () => {
      expect(isKillSwitchEnabled(KillSwitch.EXTERNAL_APIS_DISABLED)).toBe(false);
    });

    test("EMAIL_DISABLED returns false", () => {
      expect(isKillSwitchEnabled(KillSwitch.EMAIL_DISABLED)).toBe(false);
    });

    test("REGISTRATION_DISABLED returns false", () => {
      expect(isKillSwitchEnabled(KillSwitch.REGISTRATION_DISABLED)).toBe(false);
    });

    test("all defined switches return false", () => {
      for (const switchKey of Object.values(KillSwitch)) {
        expect(isKillSwitchEnabled(switchKey)).toBe(false);
      }
    });
  });

  describe("getKillSwitchState", () => {
    test("returns enabled: false for any switch", () => {
      const state = getKillSwitchState(KillSwitch.WRITE_DISABLED);
      expect(state.enabled).toBe(false);
    });

    test("returns undefined metadata fields", () => {
      const state = getKillSwitchState(KillSwitch.PUBLISH_DISABLED);
      expect(state.enabledAt).toBeUndefined();
      expect(state.enabledBy).toBeUndefined();
      expect(state.reason).toBeUndefined();
    });
  });

  describe("getAllKillSwitchStates", () => {
    test("returns all switches as disabled", () => {
      const states = getAllKillSwitchStates();

      for (const switchKey of Object.values(KillSwitch)) {
        expect(states[switchKey]).toBeDefined();
        expect(states[switchKey].enabled).toBe(false);
      }
    });

    test("includes all defined switches", () => {
      const states = getAllKillSwitchStates();
      const stateKeys = Object.keys(states);

      expect(stateKeys).toContain(KillSwitch.WRITE_DISABLED);
      expect(stateKeys).toContain(KillSwitch.PUBLISH_DISABLED);
      expect(stateKeys).toContain(KillSwitch.ADMIN_DISABLED);
    });
  });

  describe("setKillSwitch", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    test("is a no-op but logs", () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      setKillSwitch(KillSwitch.WRITE_DISABLED, true, "admin-1", "test reason");

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[KILL_SWITCH]"),
        expect.objectContaining({
          switch: KillSwitch.WRITE_DISABLED,
          enabled: true,
        })
      );

      // Verify it's still disabled (stub behavior)
      expect(isKillSwitchEnabled(KillSwitch.WRITE_DISABLED)).toBe(false);
    });
  });

  describe("convenience helpers", () => {
    test("isReadOnlyMode returns false", () => {
      expect(isReadOnlyMode()).toBe(false);
    });

    test("isPublishFrozen returns false", () => {
      expect(isPublishFrozen()).toBe(false);
    });

    test("isAdminDisabled returns false", () => {
      expect(isAdminDisabled()).toBe(false);
    });
  });
});
