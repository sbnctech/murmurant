#!/usr/bin/env npx tsx
/**
 * Checklist Coverage Audit Script
 *
 * This script audits the multi-tenant release checklist against the
 * enforcement registry and produces a report showing:
 * - Counts of enforced/partial/manual items
 * - Pass/fail status for must-have items
 *
 * Exit codes:
 * - 0: All must-have items are enforced
 * - 1: One or more must-have items are not enforced (fail-closed)
 * - 2: Script error (registry not found, parse error, etc.)
 *
 * Charter Principles:
 * - P7: Observability - clear output about enforcement status
 * - P9: Fail closed - must-have items without enforcement block CI
 */

import * as fs from "fs";
import * as path from "path";

// Types
type EnforcementStatus = "enforced" | "partial" | "manual";

interface ChecklistItem {
  id: string;
  section: string;
  description: string;
  enforcement: EnforcementStatus;
  mustHave: boolean;
  notes: string;
  enforcedBy?: string;
}

interface ChecklistRegistry {
  version: string;
  lastUpdated: string;
  sourceDocument: string;
  items: ChecklistItem[];
}

interface AuditResult {
  counts: {
    enforced: number;
    partial: number;
    manual: number;
    total: number;
  };
  mustHaveItems: {
    item: ChecklistItem;
    pass: boolean;
  }[];
  overallPass: boolean;
}

// ANSI colors for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

// Check if colors should be used
const useColors = process.stdout.isTTY ?? false;

function color(text: string, colorCode: string): string {
  if (!useColors) return text;
  return `${colorCode}${text}${colors.reset}`;
}

/**
 * Load and parse the registry file
 */
function loadRegistry(registryPath: string): ChecklistRegistry {
  if (!fs.existsSync(registryPath)) {
    throw new Error(`Registry file not found: ${registryPath}`);
  }

  const content = fs.readFileSync(registryPath, "utf-8");
  const registry = JSON.parse(content) as ChecklistRegistry;

  if (!registry.items || !Array.isArray(registry.items)) {
    throw new Error("Invalid registry: missing or invalid 'items' array");
  }

  return registry;
}

/**
 * Perform the audit and return results
 */
export function auditChecklist(registry: ChecklistRegistry): AuditResult {
  const counts = {
    enforced: 0,
    partial: 0,
    manual: 0,
    total: registry.items.length,
  };

  const mustHaveItems: AuditResult["mustHaveItems"] = [];

  for (const item of registry.items) {
    switch (item.enforcement) {
      case "enforced":
        counts.enforced++;
        break;
      case "partial":
        counts.partial++;
        break;
      case "manual":
        counts.manual++;
        break;
    }

    if (item.mustHave) {
      const pass = item.enforcement === "enforced";
      mustHaveItems.push({ item, pass });
    }
  }

  const overallPass = mustHaveItems.every((m) => m.pass);

  return { counts, mustHaveItems, overallPass };
}

/**
 * Format the audit report for console output
 */
function formatReport(
  registry: ChecklistRegistry,
  result: AuditResult
): string {
  const lines: string[] = [];

  lines.push("");
  lines.push(color("=".repeat(60), colors.cyan));
  lines.push(color("  CHECKLIST COVERAGE AUDIT REPORT", colors.bold));
  lines.push(color("=".repeat(60), colors.cyan));
  lines.push("");

  lines.push(`Registry version: ${registry.version}`);
  lines.push(`Last updated: ${registry.lastUpdated}`);
  lines.push(`Source: ${registry.sourceDocument}`);
  lines.push("");

  lines.push(color("ENFORCEMENT SUMMARY", colors.bold));
  lines.push("-".repeat(40));

  const enforcePercent = (
    (result.counts.enforced / result.counts.total) *
    100
  ).toFixed(1);
  const partialPercent = (
    (result.counts.partial / result.counts.total) *
    100
  ).toFixed(1);
  const manualPercent = (
    (result.counts.manual / result.counts.total) *
    100
  ).toFixed(1);

  lines.push(
    `${color("Enforced:", colors.green)} ${result.counts.enforced}/${result.counts.total} (${enforcePercent}%)`
  );
  lines.push(
    `${color("Partial:", colors.yellow)}  ${result.counts.partial}/${result.counts.total} (${partialPercent}%)`
  );
  lines.push(
    `${color("Manual:", colors.red)}   ${result.counts.manual}/${result.counts.total} (${manualPercent}%)`
  );
  lines.push("");

  lines.push(color("MUST-HAVE ITEMS", colors.bold));
  lines.push("-".repeat(40));

  if (result.mustHaveItems.length === 0) {
    lines.push("No must-have items defined");
  } else {
    for (const { item, pass } of result.mustHaveItems) {
      const status = pass
        ? color("[PASS]", colors.green)
        : color("[FAIL]", colors.red);
      const enforcement = pass
        ? color("enforced", colors.green)
        : color(item.enforcement, colors.red);

      lines.push(`${status} ${item.id}: ${item.description}`);
      lines.push(`        Status: ${enforcement}`);
      if (item.enforcedBy) {
        lines.push(`        Enforced by: ${item.enforcedBy}`);
      }
      if (!pass) {
        lines.push(`        ${color("Note:", colors.yellow)} ${item.notes}`);
      }
      lines.push("");
    }
  }

  lines.push("-".repeat(40));
  if (result.overallPass) {
    lines.push(
      color("RESULT: PASS - All must-have items are enforced", colors.green)
    );
  } else {
    const failCount = result.mustHaveItems.filter((m) => !m.pass).length;
    lines.push(
      color(
        `RESULT: FAIL - ${failCount} must-have item(s) not enforced`,
        colors.red
      )
    );
  }
  lines.push("");

  return lines.join("\n");
}

/**
 * Generate JSON report for artifact storage
 */
function generateJsonReport(
  registry: ChecklistRegistry,
  result: AuditResult
): string {
  return JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      registryVersion: registry.version,
      sourceDocument: registry.sourceDocument,
      summary: {
        total: result.counts.total,
        enforced: result.counts.enforced,
        partial: result.counts.partial,
        manual: result.counts.manual,
        enforcementRate:
          ((result.counts.enforced / result.counts.total) * 100).toFixed(1) +
          "%",
      },
      mustHaveItems: result.mustHaveItems.map(({ item, pass }) => ({
        id: item.id,
        description: item.description,
        enforcement: item.enforcement,
        pass,
        enforcedBy: item.enforcedBy || null,
      })),
      overallPass: result.overallPass,
    },
    null,
    2
  );
}

/**
 * Main entry point
 */
function main(): number {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes("--json");
  const jsonFile = args
    .find((a) => a.startsWith("--json-file="))
    ?.split("=")[1];

  // Find registry file - try multiple locations
  const possiblePaths = [
    path.join(process.cwd(), "scripts/ci/checklist-registry.json"),
    path.join(__dirname, "checklist-registry.json"),
  ];

  let registryPath = "";
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      registryPath = p;
      break;
    }
  }

  if (!registryPath) {
    registryPath = possiblePaths[0];
  }

  try {
    const registry = loadRegistry(registryPath);
    const result = auditChecklist(registry);

    if (!jsonOutput) {
      console.log(formatReport(registry, result));
    }

    if (jsonOutput) {
      console.log(generateJsonReport(registry, result));
    }

    if (jsonFile) {
      fs.writeFileSync(jsonFile, generateJsonReport(registry, result));
      console.log(`JSON report written to: ${jsonFile}`);
    }

    return result.overallPass ? 0 : 1;
  } catch (error) {
    console.error(
      color(
        `ERROR: ${error instanceof Error ? error.message : String(error)}`,
        colors.red
      )
    );
    return 2;
  }
}

// Run if executed directly
const exitCode = main();
process.exit(exitCode);
