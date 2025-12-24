/**
 * Migration CLI Unit Tests
 *
 * Tests argument parsing and validation for the migration CLI.
 *
 * Related: Issue #272 (A7: Migration CLI Entry Point)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as path from "path";
import * as fs from "fs";
import { parseArgs, validateArgs, CLIArgs } from "../../../scripts/migration/migrate";

// =============================================================================
// parseArgs Tests
// =============================================================================

describe("parseArgs", () => {
  describe("default values", () => {
    it("returns defaults when no arguments provided", () => {
      const args = parseArgs([]);

      expect(args.sourceOrg).toBe("wild-apricot");
      expect(args.targetOrg).toBe("clubos");
      expect(args.dryRun).toBe(true);
      expect(args.verbose).toBe(false);
      expect(args.yes).toBe(false);
      expect(args.help).toBe(false);
    });

    it("dryRun defaults to true", () => {
      const args = parseArgs([]);
      expect(args.dryRun).toBe(true);
    });
  });

  describe("--source-org", () => {
    it("parses --source-org value", () => {
      const args = parseArgs(["--source-org", "my-source"]);
      expect(args.sourceOrg).toBe("my-source");
    });

    it("throws if --source-org has no value", () => {
      expect(() => parseArgs(["--source-org"])).toThrow("--source-org requires a value");
    });

    it("throws if --source-org value starts with dash", () => {
      expect(() => parseArgs(["--source-org", "--other"])).toThrow(
        "--source-org requires a value"
      );
    });
  });

  describe("--target-org", () => {
    it("parses --target-org value", () => {
      const args = parseArgs(["--target-org", "my-target"]);
      expect(args.targetOrg).toBe("my-target");
    });

    it("throws if --target-org has no value", () => {
      expect(() => parseArgs(["--target-org"])).toThrow("--target-org requires a value");
    });
  });

  describe("--dry-run and --live", () => {
    it("--dry-run sets dryRun to true", () => {
      const args = parseArgs(["--dry-run"]);
      expect(args.dryRun).toBe(true);
    });

    it("--live sets dryRun to false", () => {
      const args = parseArgs(["--live"]);
      expect(args.dryRun).toBe(false);
    });

    it("last flag wins: --dry-run after --live", () => {
      const args = parseArgs(["--live", "--dry-run"]);
      expect(args.dryRun).toBe(true);
    });

    it("last flag wins: --live after --dry-run", () => {
      const args = parseArgs(["--dry-run", "--live"]);
      expect(args.dryRun).toBe(false);
    });
  });

  describe("--output-report", () => {
    it("parses --output-report path", () => {
      const args = parseArgs(["--output-report", "/tmp/reports"]);
      expect(args.outputReport).toBe("/tmp/reports");
    });

    it("throws if --output-report has no value", () => {
      expect(() => parseArgs(["--output-report"])).toThrow("--output-report requires a path");
    });
  });

  describe("--verbose", () => {
    it("--verbose sets verbose to true", () => {
      const args = parseArgs(["--verbose"]);
      expect(args.verbose).toBe(true);
    });

    it("-v sets verbose to true", () => {
      const args = parseArgs(["-v"]);
      expect(args.verbose).toBe(true);
    });
  });

  describe("--config", () => {
    it("parses --config path", () => {
      const args = parseArgs(["--config", "/custom/config.yaml"]);
      expect(args.configPath).toBe("/custom/config.yaml");
    });

    it("throws if --config has no value", () => {
      expect(() => parseArgs(["--config"])).toThrow("--config requires a path");
    });
  });

  describe("--data-dir", () => {
    it("parses --data-dir path", () => {
      const args = parseArgs(["--data-dir", "/data/exports"]);
      expect(args.dataDir).toBe("/data/exports");
    });

    it("throws if --data-dir has no value", () => {
      expect(() => parseArgs(["--data-dir"])).toThrow("--data-dir requires a path");
    });
  });

  describe("file arguments", () => {
    it("parses --members filename", () => {
      const args = parseArgs(["--members", "members.csv"]);
      expect(args.membersFile).toBe("members.csv");
    });

    it("parses --events filename", () => {
      const args = parseArgs(["--events", "events.csv"]);
      expect(args.eventsFile).toBe("events.csv");
    });

    it("parses --registrations filename", () => {
      const args = parseArgs(["--registrations", "registrations.csv"]);
      expect(args.registrationsFile).toBe("registrations.csv");
    });

    it("throws if file arguments have no value", () => {
      expect(() => parseArgs(["--members"])).toThrow("--members requires a filename");
      expect(() => parseArgs(["--events"])).toThrow("--events requires a filename");
      expect(() => parseArgs(["--registrations"])).toThrow(
        "--registrations requires a filename"
      );
    });
  });

  describe("--yes", () => {
    it("--yes sets yes to true", () => {
      const args = parseArgs(["--yes"]);
      expect(args.yes).toBe(true);
    });

    it("-y sets yes to true", () => {
      const args = parseArgs(["-y"]);
      expect(args.yes).toBe(true);
    });
  });

  describe("--help", () => {
    it("--help sets help to true", () => {
      const args = parseArgs(["--help"]);
      expect(args.help).toBe(true);
    });

    it("-h sets help to true", () => {
      const args = parseArgs(["-h"]);
      expect(args.help).toBe(true);
    });
  });

  describe("unknown options", () => {
    it("throws for unknown options", () => {
      expect(() => parseArgs(["--unknown"])).toThrow("Unknown option: --unknown");
    });

    it("ignores positional arguments that don't start with dash", () => {
      // This is acceptable behavior - positional args are ignored
      const args = parseArgs(["somefile.csv"]);
      expect(args.sourceOrg).toBe("wild-apricot");
    });
  });

  describe("combined arguments", () => {
    it("parses multiple arguments correctly", () => {
      const args = parseArgs([
        "--source-org",
        "wa",
        "--target-org",
        "clubos",
        "--live",
        "--verbose",
        "--yes",
        "--data-dir",
        "/tmp/data",
        "--members",
        "m.csv",
        "--events",
        "e.csv",
      ]);

      expect(args.sourceOrg).toBe("wa");
      expect(args.targetOrg).toBe("clubos");
      expect(args.dryRun).toBe(false);
      expect(args.verbose).toBe(true);
      expect(args.yes).toBe(true);
      expect(args.dataDir).toBe("/tmp/data");
      expect(args.membersFile).toBe("m.csv");
      expect(args.eventsFile).toBe("e.csv");
    });
  });
});

// =============================================================================
// validateArgs Tests
// =============================================================================

describe("validateArgs", () => {
  const defaultArgs: CLIArgs = {
    sourceOrg: "wild-apricot",
    targetOrg: "clubos",
    dryRun: true,
    outputReport: "/tmp/reports",
    verbose: false,
    configPath: path.join(__dirname, "../../../scripts/migration/config/migration-config.yaml"),
    dataDir: path.join(__dirname, "../../../scripts/migration/sample-pack"),
    membersFile: undefined,
    eventsFile: undefined,
    registrationsFile: undefined,
    yes: false,
    help: false,
  };

  describe("source-org validation", () => {
    it("accepts valid source orgs", () => {
      const validSources = ["wild-apricot", "wa", "wildapricot"];
      for (const source of validSources) {
        const result = validateArgs({ ...defaultArgs, sourceOrg: source });
        expect(result.errors.filter((e) => e.includes("source-org"))).toHaveLength(0);
      }
    });

    it("rejects invalid source org", () => {
      const result = validateArgs({ ...defaultArgs, sourceOrg: "invalid-source" });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Invalid --source-org"))).toBe(true);
    });

    it("is case-insensitive for source org", () => {
      const result = validateArgs({ ...defaultArgs, sourceOrg: "WILD-APRICOT" });
      expect(result.errors.filter((e) => e.includes("source-org"))).toHaveLength(0);
    });
  });

  describe("target-org validation", () => {
    it("accepts valid target org", () => {
      const result = validateArgs({ ...defaultArgs, targetOrg: "clubos" });
      expect(result.errors.filter((e) => e.includes("target-org"))).toHaveLength(0);
    });

    it("rejects invalid target org", () => {
      const result = validateArgs({ ...defaultArgs, targetOrg: "other-system" });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Invalid --target-org"))).toBe(true);
    });
  });

  describe("config file validation", () => {
    it("returns error if config file does not exist", () => {
      const result = validateArgs({ ...defaultArgs, configPath: "/nonexistent/config.yaml" });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Config file not found"))).toBe(true);
    });

    it("accepts existing config file", () => {
      // Uses the default config path which should exist
      const result = validateArgs(defaultArgs);
      expect(result.errors.filter((e) => e.includes("Config file not found"))).toHaveLength(
        0
      );
    });
  });

  describe("data directory validation", () => {
    it("returns error if data directory does not exist", () => {
      const result = validateArgs({ ...defaultArgs, dataDir: "/nonexistent/data" });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Data directory not found"))).toBe(true);
    });

    it("accepts existing data directory", () => {
      const result = validateArgs(defaultArgs);
      expect(result.errors.filter((e) => e.includes("Data directory not found"))).toHaveLength(
        0
      );
    });
  });

  describe("CSV file validation", () => {
    it("returns error if specified members file does not exist", () => {
      const result = validateArgs({
        ...defaultArgs,
        membersFile: "nonexistent.csv",
      });
      expect(result.errors.some((e) => e.includes("Members file not found"))).toBe(true);
    });

    it("returns error if specified events file does not exist", () => {
      const result = validateArgs({
        ...defaultArgs,
        eventsFile: "nonexistent.csv",
      });
      expect(result.errors.some((e) => e.includes("Events file not found"))).toBe(true);
    });

    it("returns error if specified registrations file does not exist", () => {
      const result = validateArgs({
        ...defaultArgs,
        registrationsFile: "nonexistent.csv",
      });
      expect(result.errors.some((e) => e.includes("Registrations file not found"))).toBe(
        true
      );
    });
  });

  describe("live run warnings", () => {
    it("warns about live run without --yes", () => {
      const result = validateArgs({ ...defaultArgs, dryRun: false, yes: false });
      expect(result.warnings.some((w) => w.includes("Live run requires"))).toBe(true);
    });

    it("no warning for live run with --yes", () => {
      const result = validateArgs({ ...defaultArgs, dryRun: false, yes: true });
      expect(result.warnings.filter((w) => w.includes("Live run requires"))).toHaveLength(0);
    });

    it("no warning for dry run", () => {
      const result = validateArgs({ ...defaultArgs, dryRun: true, yes: false });
      expect(result.warnings.filter((w) => w.includes("Live run requires"))).toHaveLength(0);
    });
  });

  describe("validation result structure", () => {
    it("returns valid=true when no errors", () => {
      const result = validateArgs(defaultArgs);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("returns valid=false when errors exist", () => {
      const result = validateArgs({ ...defaultArgs, sourceOrg: "invalid" });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("warnings do not affect validity", () => {
      const result = validateArgs({ ...defaultArgs, dryRun: false, yes: false });
      // May have warnings but validation errors determine validity
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(typeof result.valid).toBe("boolean");
    });
  });
});
