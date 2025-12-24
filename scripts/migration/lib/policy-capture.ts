/**
 * Policy Capture Module
 *
 * Extracts organization policies from Wild Apricot and produces
 * a migration bundle with captured policies and operator-defined mappings.
 */

import * as fs from "fs";
import * as path from "path";
import {
  MigrationBundle,
  SourceOrgInfo,
  CapturedPolicies,
  CapturedMembershipLevel,
  PolicyMappings,
  MembershipLevelMappingFile,
  MembershipLevelMapping,
  MappingValidationResult,
  MappingValidationError,
  MappingValidationWarning,
  PolicyCaptureReport,
  MembershipLevelReportEntry,
  VALID_TIER_CODES,
  ClubOSTierCode,
} from "./policy-capture-types";
import { WildApricotClient, WAMembershipLevel } from "../../../src/lib/importing/wildapricot";

// ============================================================================
// Membership Level Extraction
// ============================================================================

/**
 * Fetch membership levels from the WA API.
 *
 * @param client - Configured WA API client
 * @returns Array of captured membership levels, or empty array on failure
 */
export async function fetchMembershipLevels(
  client: WildApricotClient
): Promise<{ levels: CapturedMembershipLevel[]; error?: string }> {
  try {
    const waLevels = await client.fetchMembershipLevels();

    const levels = waLevels.map(
      (level: WAMembershipLevel): CapturedMembershipLevel => ({
        waId: level.Id,
        name: level.Name,
        fee: level.MembershipFee,
        description: level.Description,
        renewalEnabled: level.RenewalEnabled,
        renewalPeriod: level.RenewalPeriod,
        newMembersEnabled: level.NewMembersEnabled,
      })
    );

    return { levels };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { levels: [], error: message };
  }
}

// ============================================================================
// Mapping File Operations
// ============================================================================

/**
 * Generate a template mapping file from discovered levels.
 * Operator must fill in clubosTier for each level.
 */
export function generateMappingTemplate(
  levels: CapturedMembershipLevel[]
): MembershipLevelMappingFile {
  const mappings: MembershipLevelMapping[] = levels.map((level) => ({
    waId: level.waId,
    waName: level.name,
    // clubosTier intentionally omitted - operator must fill in
    notes: `Fee: $${level.fee}, Renewal: ${level.renewalEnabled ? "Yes" : "No"}`,
  }));

  // Add example entries if no levels discovered
  if (mappings.length === 0) {
    mappings.push(
      {
        waId: 0,
        waName: "Example Active Member",
        clubosTier: "active",
        notes: "Replace with actual WA level",
      },
      {
        waId: 0,
        waName: "Example Lapsed Member",
        clubosTier: "lapsed",
        notes: "Replace with actual WA level",
      }
    );
  }

  return {
    version: "1.0",
    createdAt: new Date().toISOString(),
    source: "template",
    levels: mappings,
  };
}

/**
 * Parse a mapping file from JSON.
 */
export function parseMappingFile(
  content: string
): MembershipLevelMappingFile | { error: string } {
  try {
    const data = JSON.parse(content);

    // Basic structure validation
    if (!data.version || !data.levels || !Array.isArray(data.levels)) {
      return { error: "Invalid mapping file structure: missing version or levels array" };
    }

    return data as MembershipLevelMappingFile;
  } catch (error) {
    return { error: `Failed to parse mapping file: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Load a mapping file from disk.
 */
export function loadMappingFile(
  filePath: string
): MembershipLevelMappingFile | { error: string } {
  try {
    if (!fs.existsSync(filePath)) {
      return { error: `Mapping file not found: ${filePath}` };
    }

    const content = fs.readFileSync(filePath, "utf-8");
    return parseMappingFile(content);
  } catch (error) {
    return { error: `Failed to load mapping file: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Save a mapping file to disk.
 */
export function saveMappingFile(
  filePath: string,
  mapping: MembershipLevelMappingFile
): { success: boolean; error?: string } {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(mapping, null, 2), "utf-8");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to save mapping file: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate a membership level mapping file.
 *
 * Rules:
 * 1. Every level must be either mapped (has clubosTier) or ignored (has ignore: true with reason)
 * 2. clubosTier must be a valid ClubOS tier code
 * 3. No duplicate waId entries
 */
export function validateMappingFile(
  mapping: MembershipLevelMappingFile,
  capturedLevels?: CapturedMembershipLevel[]
): MappingValidationResult {
  const errors: MappingValidationError[] = [];
  const warnings: MappingValidationWarning[] = [];
  const seenIds = new Set<number>();

  let mappedCount = 0;
  let ignoredCount = 0;
  let unmappedCount = 0;

  for (const level of mapping.levels) {
    // Check for duplicate IDs
    if (seenIds.has(level.waId)) {
      errors.push({
        level: level.waName,
        waId: level.waId,
        message: `Duplicate waId: ${level.waId}`,
      });
      continue;
    }
    seenIds.add(level.waId);

    // Check mapping status
    if (level.ignore === true) {
      // Ignored levels must have a reason
      if (!level.reason || level.reason.trim() === "") {
        errors.push({
          level: level.waName,
          waId: level.waId,
          message: "Ignored levels must have a reason",
        });
      } else {
        ignoredCount++;
      }
    } else if (level.clubosTier) {
      // Mapped levels must have valid tier code
      if (!VALID_TIER_CODES.includes(level.clubosTier as ClubOSTierCode)) {
        errors.push({
          level: level.waName,
          waId: level.waId,
          message: `Invalid clubosTier: "${level.clubosTier}". Valid values: ${VALID_TIER_CODES.join(", ")}`,
        });
      } else {
        mappedCount++;
      }
    } else {
      // Neither mapped nor ignored
      errors.push({
        level: level.waName,
        waId: level.waId,
        message: "Level must have either clubosTier or ignore: true with reason",
      });
      unmappedCount++;
    }
  }

  // Check for missing levels (if capturedLevels provided)
  if (capturedLevels) {
    const mappedIds = new Set(mapping.levels.map((l) => l.waId));
    for (const captured of capturedLevels) {
      if (!mappedIds.has(captured.waId)) {
        warnings.push({
          level: captured.name,
          waId: captured.waId,
          message: "WA level exists but is not in mapping file",
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalLevels: mapping.levels.length,
      mappedLevels: mappedCount,
      ignoredLevels: ignoredCount,
      unmappedLevels: unmappedCount,
    },
  };
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate a policy capture report.
 */
export function generatePolicyCaptureReport(
  sourceAccountId: string,
  capturedLevels: CapturedMembershipLevel[],
  mapping: MembershipLevelMappingFile,
  validationResult: MappingValidationResult
): PolicyCaptureReport {
  const levelEntries: MembershipLevelReportEntry[] = [];

  // Map captured levels with their mapping status
  for (const captured of capturedLevels) {
    const mappingEntry = mapping.levels.find((m) => m.waId === captured.waId);

    if (!mappingEntry) {
      levelEntries.push({
        waId: captured.waId,
        waName: captured.name,
        status: "unmapped",
      });
    } else if (mappingEntry.ignore) {
      levelEntries.push({
        waId: captured.waId,
        waName: captured.name,
        status: "ignored",
        reason: mappingEntry.reason,
      });
    } else {
      levelEntries.push({
        waId: captured.waId,
        waName: captured.name,
        status: "mapped",
        clubosTier: mappingEntry.clubosTier,
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    sourceAccountId,
    membershipLevels: levelEntries,
    summary: {
      totalWaLevels: capturedLevels.length,
      mappedToClubos: validationResult.summary.mappedLevels,
      ignoredWithReason: validationResult.summary.ignoredLevels,
      unmappedBlocking: validationResult.summary.unmappedLevels,
    },
    validationStatus: validationResult.valid ? "passed" : "failed",
    validationErrors: validationResult.errors.map(
      (e) => `${e.level} (${e.waId}): ${e.message}`
    ),
  };
}

/**
 * Render report as Markdown.
 */
export function renderReportAsMarkdown(report: PolicyCaptureReport): string {
  const lines: string[] = [
    "# Policy Capture Report",
    "",
    `Generated: ${report.generatedAt}`,
    `Source: Wild Apricot Account ${report.sourceAccountId}`,
    "",
    "## Membership Levels",
    "",
    "| WA ID | WA Name | ClubOS Tier | Status |",
    "|-------|---------|-------------|--------|",
  ];

  for (const entry of report.membershipLevels) {
    const tier = entry.clubosTier || "-";
    const status =
      entry.status === "mapped"
        ? "Mapped"
        : entry.status === "ignored"
        ? `Ignored (${entry.reason || "no reason"})`
        : "Unmapped";

    lines.push(`| ${entry.waId} | ${entry.waName} | ${tier} | ${status} |`);
  }

  lines.push(
    "",
    "## Summary",
    "",
    `- Total WA levels: ${report.summary.totalWaLevels}`,
    `- Mapped to ClubOS: ${report.summary.mappedToClubos}`,
    `- Ignored with reason: ${report.summary.ignoredWithReason}`,
    `- Unmapped (blocking): ${report.summary.unmappedBlocking}`,
    "",
    "## Validation",
    ""
  );

  if (report.validationStatus === "passed") {
    lines.push("All levels accounted for.");
  } else {
    lines.push("**Validation failed:**");
    lines.push("");
    for (const error of report.validationErrors) {
      lines.push(`- ${error}`);
    }
  }

  return lines.join("\n");
}

// ============================================================================
// Bundle Operations
// ============================================================================

/**
 * Write the complete migration bundle to disk.
 */
export function writeMigrationBundle(
  outputDir: string,
  bundle: {
    sourceOrg: SourceOrgInfo;
    capturedLevels: CapturedMembershipLevel[];
    mapping: MembershipLevelMappingFile;
    report: PolicyCaptureReport;
  }
): { success: boolean; error?: string } {
  try {
    // Create directory structure
    const policiesDir = path.join(outputDir, "policies");
    const mappingsDir = path.join(outputDir, "mappings");
    const reportsDir = path.join(outputDir, "reports");

    for (const dir of [outputDir, policiesDir, mappingsDir, reportsDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    // Write source org info
    fs.writeFileSync(
      path.join(outputDir, "source_org.json"),
      JSON.stringify(bundle.sourceOrg, null, 2),
      "utf-8"
    );

    // Write captured policies
    fs.writeFileSync(
      path.join(policiesDir, "membership_levels.json"),
      JSON.stringify(bundle.capturedLevels, null, 2),
      "utf-8"
    );

    // Write mapping
    fs.writeFileSync(
      path.join(mappingsDir, "membership_levels_mapping.json"),
      JSON.stringify(bundle.mapping, null, 2),
      "utf-8"
    );

    // Write report (JSON and Markdown)
    fs.writeFileSync(
      path.join(reportsDir, "policy_capture_report.json"),
      JSON.stringify(bundle.report, null, 2),
      "utf-8"
    );

    fs.writeFileSync(
      path.join(reportsDir, "policy_capture_report.md"),
      renderReportAsMarkdown(bundle.report),
      "utf-8"
    );

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to write migration bundle: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
