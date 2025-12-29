#!/usr/bin/env npx tsx
/**
 * CI Reliability Guardrails Check
 *
 * Charter Principles:
 * - P7: Observability is a product feature
 * - P9: Security must fail closed
 *
 * This script enforces reliability infrastructure invariants:
 *
 * 1. REQUIRED DOCS: Essential reliability documentation must exist.
 *
 * 2. RELIABILITY MODULE: The reliability module must export expected APIs.
 *
 * 3. GUARD USAGE (informational): Tracks adoption of guards on write paths.
 *    Note: In R3, guards are inert (always allow). This check is informational
 *    to prepare for future enforcement.
 *
 * Exit codes:
 *   0 - All checks pass
 *   1 - One or more violations detected
 *
 * Usage:
 *   npx tsx scripts/ci/check-reliability-guardrails.ts
 *   npm run test:reliability-guardrails
 */

import * as fs from "fs";
import * as path from "path";

// ANSI colors
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const NC = "\x1b[0m"; // No Color

// ============================================================================
// CHECK 1: Required reliability documentation
// ============================================================================

const REQUIRED_DOCS = [
  {
    path: "docs/reliability/MECHANISM_STUBS_AND_OWNERSHIP.md",
    description: "Mechanism stub matrix and ownership",
  },
  {
    path: "docs/reliability/R3_STUB_MECHANISMS_AND_CI_WIRING.md",
    description: "R3 stub implementation spec",
  },
  {
    path: "docs/ARCHITECTURAL_CHARTER.md",
    description: "Architectural charter (P1-P10)",
  },
];

interface DocCheckResult {
  path: string;
  description: string;
  exists: boolean;
}

function checkRequiredDocs(): DocCheckResult[] {
  const results: DocCheckResult[] = [];

  for (const doc of REQUIRED_DOCS) {
    const fullPath = path.join(process.cwd(), doc.path);
    results.push({
      path: doc.path,
      description: doc.description,
      exists: fs.existsSync(fullPath),
    });
  }

  return results;
}

// ============================================================================
// CHECK 2: Reliability module exports
// ============================================================================

const REQUIRED_EXPORTS = [
  // Guards
  "canWrite",
  "requireWrite",
  "canPublish",
  "requirePublish",
  // Kill switches
  "KillSwitch",
  "isKillSwitchEnabled",
  // Isolation
  "withIsolation",
  "ExternalDependency",
  // Backpressure
  "enforceBackpressure",
  "TrafficClass",
  // Backup
  "planBackup",
  "verifyDataIntegrity",
  // Failure injection
  "maybeInjectFailure",
  "InjectionPoint",
];

interface ExportCheckResult {
  name: string;
  exported: boolean;
}

function checkReliabilityExports(): ExportCheckResult[] {
  const results: ExportCheckResult[] = [];
  const indexPath = path.join(process.cwd(), "src/lib/reliability/index.ts");

  if (!fs.existsSync(indexPath)) {
    // All exports missing if index doesn't exist
    return REQUIRED_EXPORTS.map((name) => ({ name, exported: false }));
  }

  const content = fs.readFileSync(indexPath, "utf-8");

  for (const exportName of REQUIRED_EXPORTS) {
    // Check for "export { name" or "export { ... name" patterns
    const pattern = new RegExp(`export\\s*\\{[^}]*\\b${exportName}\\b`, "m");
    results.push({
      name: exportName,
      exported: pattern.test(content),
    });
  }

  return results;
}

// ============================================================================
// CHECK 3: Guard adoption tracking (informational)
// ============================================================================

interface GuardAdoptionStats {
  writeRoutes: number;
  writeRoutesWithGuard: number;
  publishRoutes: number;
  publishRoutesWithGuard: number;
  routesChecked: string[];
}

function checkGuardAdoption(): GuardAdoptionStats {
  const stats: GuardAdoptionStats = {
    writeRoutes: 0,
    writeRoutesWithGuard: 0,
    publishRoutes: 0,
    publishRoutesWithGuard: 0,
    routesChecked: [],
  };

  const apiDir = path.join(process.cwd(), "src/app/api");

  if (!fs.existsSync(apiDir)) {
    return stats;
  }

  // Find all route files
  const findRoutes = (dir: string): string[] => {
    const routes: string[] = [];
    if (!fs.existsSync(dir)) return routes;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        routes.push(...findRoutes(fullPath));
      } else if (entry.name === "route.ts") {
        routes.push(fullPath);
      }
    }
    return routes;
  };

  const routeFiles = findRoutes(apiDir);

  for (const file of routeFiles) {
    const content = fs.readFileSync(file, "utf-8");
    const relativePath = path.relative(apiDir, file);

    // Check for write operations (POST, PUT, PATCH, DELETE exports)
    const hasWriteMethod =
      /export\s+(async\s+)?function\s+(POST|PUT|PATCH|DELETE)\s*\(/m.test(content);

    // Check for publish-related routes
    const isPublishRoute =
      relativePath.includes("publish") ||
      content.includes("status: 'PUBLISHED'") ||
      content.includes('status: "PUBLISHED"') ||
      content.includes("publishedContent");

    // Check for guard usage
    const hasWriteGuard =
      content.includes("canWrite") || content.includes("requireWrite");
    const hasPublishGuard =
      content.includes("canPublish") || content.includes("requirePublish");

    if (hasWriteMethod) {
      stats.writeRoutes++;
      if (hasWriteGuard) {
        stats.writeRoutesWithGuard++;
      }
      stats.routesChecked.push(relativePath);
    }

    if (isPublishRoute && hasWriteMethod) {
      stats.publishRoutes++;
      if (hasPublishGuard) {
        stats.publishRoutesWithGuard++;
      }
    }
  }

  return stats;
}

// ============================================================================
// CHECK 4: Mechanism matrix freshness
// ============================================================================

interface MatrixCheckResult {
  hasStubbed: boolean;
  stubbedCount: number;
  lastUpdated: string | null;
}

function checkMechanismMatrix(): MatrixCheckResult {
  const matrixPath = path.join(
    process.cwd(),
    "docs/reliability/MECHANISM_STUBS_AND_OWNERSHIP.md"
  );

  const result: MatrixCheckResult = {
    hasStubbed: false,
    stubbedCount: 0,
    lastUpdated: null,
  };

  if (!fs.existsSync(matrixPath)) {
    return result;
  }

  const content = fs.readFileSync(matrixPath, "utf-8");

  // Count "Stubbed" entries in the table
  const stubbedMatches = content.match(/\|\s*Stubbed\s*\|/g);
  result.stubbedCount = stubbedMatches ? stubbedMatches.length : 0;
  result.hasStubbed = result.stubbedCount > 0;

  // Extract last updated date
  const dateMatch = content.match(/Last updated:\s*(\d{4}-\d{2}-\d{2})/);
  result.lastUpdated = dateMatch ? dateMatch[1] : null;

  return result;
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log("=".repeat(60));
  console.log("CI Reliability Guardrails Check");
  console.log("=".repeat(60));
  console.log("");

  let hasFailures = false;

  // =========================================================================
  // CHECK 1: Required docs
  // =========================================================================
  console.log(`${CYAN}[1/4] Checking required reliability docs...${NC}`);
  console.log("");

  const docResults = checkRequiredDocs();
  const missingDocs = docResults.filter((r) => !r.exists);

  if (missingDocs.length === 0) {
    console.log(`${GREEN}✓ All required reliability docs exist${NC}`);
    for (const doc of docResults) {
      console.log(`  ${GREEN}✓${NC} ${doc.path}`);
    }
    console.log("");
  } else {
    hasFailures = true;
    console.log(`${RED}✗ Missing ${missingDocs.length} required doc(s)${NC}`);
    for (const doc of docResults) {
      if (doc.exists) {
        console.log(`  ${GREEN}✓${NC} ${doc.path}`);
      } else {
        console.log(`  ${RED}✗${NC} ${doc.path} - ${doc.description}`);
      }
    }
    console.log("");
  }

  // =========================================================================
  // CHECK 2: Reliability module exports
  // =========================================================================
  console.log(`${CYAN}[2/4] Checking reliability module exports...${NC}`);
  console.log("");

  const exportResults = checkReliabilityExports();
  const missingExports = exportResults.filter((r) => !r.exported);

  if (missingExports.length === 0) {
    console.log(`${GREEN}✓ All required exports present in reliability module${NC}`);
    console.log(`  Exports verified: ${exportResults.length}`);
    console.log("");
  } else {
    hasFailures = true;
    console.log(`${RED}✗ Missing ${missingExports.length} required export(s)${NC}`);
    for (const exp of missingExports) {
      console.log(`  ${RED}✗${NC} ${exp.name}`);
    }
    console.log("");
  }

  // =========================================================================
  // CHECK 3: Guard adoption (informational only in R3)
  // =========================================================================
  console.log(`${CYAN}[3/4] Checking guard adoption (informational)...${NC}`);
  console.log("");

  const adoptionStats = checkGuardAdoption();

  console.log(`${YELLOW}Guard Adoption Stats (R3: informational only)${NC}`);
  console.log(`  Write routes found: ${adoptionStats.writeRoutes}`);
  console.log(`  Write routes with guard: ${adoptionStats.writeRoutesWithGuard}`);
  console.log(`  Publish routes found: ${adoptionStats.publishRoutes}`);
  console.log(`  Publish routes with guard: ${adoptionStats.publishRoutesWithGuard}`);
  console.log("");

  if (adoptionStats.writeRoutes > 0) {
    const writeAdoption = Math.round(
      (adoptionStats.writeRoutesWithGuard / adoptionStats.writeRoutes) * 100
    );
    console.log(`  Write guard adoption: ${writeAdoption}%`);
  }
  if (adoptionStats.publishRoutes > 0) {
    const publishAdoption = Math.round(
      (adoptionStats.publishRoutesWithGuard / adoptionStats.publishRoutes) * 100
    );
    console.log(`  Publish guard adoption: ${publishAdoption}%`);
  }
  console.log("");
  console.log(`  ${YELLOW}Note: Guards are inert in R3. Adoption tracking only.${NC}`);
  console.log("");

  // =========================================================================
  // CHECK 4: Mechanism matrix
  // =========================================================================
  console.log(`${CYAN}[4/4] Checking mechanism matrix status...${NC}`);
  console.log("");

  const matrixResult = checkMechanismMatrix();

  if (matrixResult.hasStubbed) {
    console.log(`${GREEN}✓ Mechanism matrix has stubbed entries${NC}`);
    console.log(`  Stubbed mechanisms: ${matrixResult.stubbedCount}`);
    if (matrixResult.lastUpdated) {
      console.log(`  Last updated: ${matrixResult.lastUpdated}`);
    }
    console.log("");
  } else {
    // Not a failure in R3, just informational
    console.log(`${YELLOW}! No stubbed mechanisms found in matrix${NC}`);
    console.log(`  Expected after B1 completion. Check MECHANISM_STUBS_AND_OWNERSHIP.md`);
    console.log("");
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log("=".repeat(60));

  if (hasFailures) {
    console.log(`${RED}RELIABILITY GUARDRAILS FAILED${NC}`);
    console.log("=".repeat(60));
    console.log("");
    console.log("Fix the issues above before merging.");
    console.log("");
    console.log("Required actions:");
    if (missingDocs.length > 0) {
      console.log("  - Create missing reliability documentation");
    }
    if (missingExports.length > 0) {
      console.log("  - Add missing exports to src/lib/reliability/index.ts");
    }
    console.log("");
    console.log("Reference: docs/reliability/R3_STUB_MECHANISMS_AND_CI_WIRING.md");
    console.log("");
    process.exit(1);
  } else {
    console.log(`${GREEN}RELIABILITY GUARDRAILS PASSED${NC}`);
    console.log("=".repeat(60));
    console.log("");
    console.log(`${YELLOW}R3 Status: Stubs are inert (default allow).${NC}`);
    console.log("Guard enforcement will be enabled in a future phase.");
    console.log("");
    process.exit(0);
  }
}

main();
