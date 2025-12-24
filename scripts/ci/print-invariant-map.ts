#!/usr/bin/env npx tsx
/**
 * Print Invariant-to-Test Traceability Map
 *
 * Usage:
 *   npx tsx scripts/ci/print-invariant-map.ts          # Print all
 *   npx tsx scripts/ci/print-invariant-map.ts --json   # Output as JSON
 *   npx tsx scripts/ci/print-invariant-map.ts RBAC     # Filter by category
 *   npx tsx scripts/ci/print-invariant-map.ts INV-IMP  # Filter by invariant prefix
 *
 * Related: Issue #258 (Invariant-to-test traceability)
 */

import * as fs from "fs";
import * as path from "path";

// ANSI colors
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const NC = "\x1b[0m";

interface Test {
  file: string;
  pattern: string;
}

interface Invariant {
  id: string;
  name: string;
  charter: string[];
  tests?: Test[];
  ciScript?: string;
  command: string;
  blockedCapabilities?: string[];
  auditEvents?: string[];
  boundaries?: Record<string, number>;
  defaults?: Record<string, number | string>;
}

interface Category {
  description: string;
  invariants: Invariant[];
}

interface InvariantMap {
  version: string;
  description: string;
  lastUpdated: string;
  relatedIssues: string[];
  categories: Record<string, Category>;
}

function loadMap(): InvariantMap {
  const mapPath = path.join(__dirname, "invariant-map.json");
  const content = fs.readFileSync(mapPath, "utf-8");
  return JSON.parse(content) as InvariantMap;
}

function printTable(rows: string[][], headers: string[]): void {
  // Calculate column widths
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] || "").length))
  );

  // Print header
  const headerLine = headers.map((h, i) => h.padEnd(widths[i])).join(" | ");
  console.log(headerLine);
  console.log(widths.map((w) => "-".repeat(w)).join("-+-"));

  // Print rows
  for (const row of rows) {
    console.log(row.map((c, i) => (c || "").padEnd(widths[i])).join(" | "));
  }
}

function printInvariant(inv: Invariant): void {
  console.log(`\n${CYAN}${inv.id}${NC}: ${inv.name}`);
  console.log(`  Charter: ${inv.charter.map((c) => `P${c.replace("P", "")}`).join(", ")}`);
  console.log(`  Command: ${GREEN}${inv.command}${NC}`);

  if (inv.tests && inv.tests.length > 0) {
    console.log("  Tests:");
    for (const test of inv.tests) {
      console.log(`    - ${test.file}`);
      console.log(`      ${YELLOW}${test.pattern}${NC}`);
    }
  }

  if (inv.ciScript) {
    console.log(`  CI Script: ${inv.ciScript}`);
  }

  if (inv.blockedCapabilities) {
    console.log(`  Blocked Capabilities: ${inv.blockedCapabilities.join(", ")}`);
  }

  if (inv.auditEvents) {
    console.log(`  Audit Events: ${inv.auditEvents.join(", ")}`);
  }

  if (inv.boundaries) {
    console.log("  Boundaries:");
    for (const [key, val] of Object.entries(inv.boundaries)) {
      console.log(`    - ${key}: ${val} days`);
    }
  }

  if (inv.defaults) {
    console.log("  Defaults:");
    for (const [key, val] of Object.entries(inv.defaults)) {
      console.log(`    - ${key}: ${val}`);
    }
  }
}

function main(): void {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes("--json");
  const filter = args.find((a) => !a.startsWith("--"));

  const map = loadMap();

  if (jsonOutput) {
    console.log(JSON.stringify(map, null, 2));
    return;
  }

  console.log("=".repeat(60));
  console.log("Invariant-to-Test Traceability Map");
  console.log(`Version: ${map.version} | Updated: ${map.lastUpdated}`);
  console.log(`Issues: ${map.relatedIssues.join(", ")}`);
  console.log("=".repeat(60));

  // Summary table
  const summaryRows: string[][] = [];
  let totalInvariants = 0;
  let totalTests = 0;

  for (const [catName, cat] of Object.entries(map.categories)) {
    const catTests = cat.invariants.reduce(
      (sum, inv) => sum + (inv.tests?.length || 0),
      0
    );
    summaryRows.push([catName, cat.invariants.length.toString(), catTests.toString()]);
    totalInvariants += cat.invariants.length;
    totalTests += catTests;
  }

  console.log("\n## Summary\n");
  printTable(summaryRows, ["Category", "Invariants", "Tests"]);
  console.log(`\nTotal: ${totalInvariants} invariants, ${totalTests} tests`);

  // Detailed view (filtered if requested)
  for (const [catName, cat] of Object.entries(map.categories)) {
    // Filter by category name
    if (filter && !catName.toLowerCase().includes(filter.toLowerCase())) {
      // Check if any invariant matches the filter
      const hasMatch = cat.invariants.some((inv) =>
        inv.id.toLowerCase().includes(filter.toLowerCase())
      );
      if (!hasMatch) continue;
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`${catName}: ${cat.description}`);
    console.log("=".repeat(60));

    for (const inv of cat.invariants) {
      // Filter by invariant ID
      if (filter && !catName.toLowerCase().includes(filter.toLowerCase())) {
        if (!inv.id.toLowerCase().includes(filter.toLowerCase())) {
          continue;
        }
      }
      printInvariant(inv);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Run `npm run green` to verify all invariants");
  console.log("=".repeat(60) + "\n");
}

main();
