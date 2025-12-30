#!/usr/bin/env npx tsx
/**
 * CI Auth Guardrails Check
 *
 * Charter Principles:
 * - P2: Default deny, least privilege
 * - P9: Security must fail closed
 *
 * This script enforces security invariants:
 *
 * 1. IMPERSONATION SAFETY: Routes using dangerous capabilities must use
 *    requireCapabilitySafe() instead of requireCapability().
 *
 * 2. ADMIN AUTH GUARD: All admin API routes must have authentication.
 *
 * 3. BLOCKED CAPABILITIES SYNC: The blocked capabilities list must stay
 *    in sync with tests and documentation.
 *
 * BLOCKED_WHILE_IMPERSONATING capabilities:
 * - finance:manage  (no money movement while impersonating)
 * - comms:send      (no email sending while impersonating)
 * - users:manage    (no role changes while impersonating)
 * - events:delete   (no destructive actions while impersonating)
 * - admin:full      (downgraded to read-only while impersonating)
 *
 * Exit codes:
 *   0 - All checks pass
 *   1 - One or more violations detected
 *
 * Usage:
 *   npx tsx scripts/ci/check-auth-guardrails.ts
 *   npm run test:guardrails
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// ANSI colors
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const NC = "\x1b[0m"; // No Color

// Dangerous capabilities that MUST use requireCapabilitySafe
const DANGEROUS_CAPABILITIES = [
  "finance:manage",
  "comms:send",
  "users:manage",
  "events:delete",
  "admin:full",
] as const;

// Known gaps: Routes that SHOULD use requireCapabilitySafe but currently don't
// These are tracked for remediation. New violations will cause CI to fail.
// Format: "relative/path/to/route.ts:LINE" for specific line tracking
const KNOWN_GAPS: Set<string> = new Set([
  // users:manage endpoints - documented in docs/CI/INVARIANTS.md
  "v1/admin/users/[id]/passkeys/route.ts:48",
  "v1/admin/users/[id]/passkeys/route.ts:98",
  "v1/admin/service-history/route.ts:86",
  "v1/admin/service-history/[id]/close/route.ts:21",
  "v1/admin/transitions/route.ts:72",
  "v1/admin/transitions/[id]/detect-outgoing/route.ts:21",
  "v1/admin/transitions/[id]/cancel/route.ts:21",
  "v1/admin/transitions/[id]/apply/route.ts:24",
  "v1/admin/transitions/[id]/assignments/[aid]/route.ts:18",
  "v1/admin/transitions/[id]/assignments/route.ts:32",
  "v1/admin/transitions/[id]/submit/route.ts:21",
  "v1/admin/transitions/[id]/route.ts:55",
  "v1/admin/transitions/[id]/route.ts:105",
  // admin:full endpoints - read/diagnostic operations, lower priority for safety
  // GAP-014 fixed: v1/admin/import/status/route.ts:37 (Issue #233)
  "v1/support/cases/route.ts:44",
  "v1/support/cases/route.ts:104",
  "v1/support/cases/[id]/notes/route.ts:42",
  "v1/support/cases/[id]/route.ts:53",
  "v1/support/cases/[id]/route.ts:160",
  "v1/support/dashboard/route.ts:49",
  // GAP-021 fixed: v1/officer/governance/minutes/[id]/route.ts:256 (Issue #231)
  // GAP-022 fixed: v1/officer/governance/meetings/[id]/route.ts:99 (Issue #231)
  // Demo endpoints - test/dev only
  "admin/demo/lifecycle-members/route.ts:81",
  "admin/demo/member-list/route.ts:98",
  "admin/demo/status/route.ts:21",
  "admin/demo/work-queue/route.ts:21",
  "admin/demo/scenarios/route.ts:596",
  // OpenAPI endpoint - read-only spec generation
  "openapi/route.ts:57",
  // Committee management - admin operations
  "v1/committees/route.ts:54",
  "v1/committees/[id]/route.ts:34",
  "v1/committees/[id]/route.ts:71",
  "v1/committees/[id]/members/route.ts:32",
  "v1/committees/[id]/members/route.ts:68",
]);

// Routes that are explicitly allowed to use requireCapability (read-only operations)
// Format: "relative/path/to/route.ts" -> "Justification"
const ALLOWLIST: Record<string, string> = {
  // Read-only operations don't need impersonation safety
  // Add routes here with justification if they legitimately need requireCapability
};

interface ViolationInfo {
  file: string;
  line: number;
  capability: string;
  lineContent: string;
}

function findViolations(): ViolationInfo[] {
  const violations: ViolationInfo[] = [];
  const routesDir = path.join(process.cwd(), "src/app/api");

  // Find all route files
  const routeFiles = execSync(
    `find ${routesDir} -name "route.ts" -type f`,
    { encoding: "utf-8" }
  )
    .trim()
    .split("\n")
    .filter(Boolean);

  for (const file of routeFiles) {
    const relativePath = path.relative(routesDir, file);

    // Skip if in allowlist
    if (ALLOWLIST[relativePath]) {
      continue;
    }

    const content = fs.readFileSync(file, "utf-8");
    const lines = content.split("\n");

    // Check each line for dangerous capability usage with requireCapability
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Skip if using requireCapabilitySafe (the safe version)
      if (line.includes("requireCapabilitySafe")) {
        continue;
      }

      // Check for requireCapability with dangerous capabilities
      for (const cap of DANGEROUS_CAPABILITIES) {
        // Pattern: requireCapability(..., "dangerous:cap")
        const pattern = new RegExp(
          `requireCapability\\s*\\([^)]*["']${cap.replace(":", "\\:")}["']`,
          "i"
        );

        if (pattern.test(line)) {
          violations.push({
            file: relativePath,
            line: lineNum,
            capability: cap,
            lineContent: line.trim(),
          });
        }
      }
    }
  }

  return violations;
}

// ============================================================================
// CHECK 2: Admin routes must have auth guards
// ============================================================================

interface AuthGuardViolation {
  file: string;
  reason: string;
}

// Auth patterns that indicate proper authentication
const AUTH_PATTERNS = [
  "requireAuth",
  "requireAdmin",
  "requireCapability",
  "requireCapabilitySafe",
  "requireRole",
  "requireVPOrAdmin",
  "requireEventChairOrVP",
  "requireEventViewAccess",
  "requireEventEditAccess",
  "requireEventDeleteAccess",
  "requireRegistrationAccess",
  "getSession",
  "validateSession",
];

// Admin routes that are allowed to skip auth (with justification)
const AUTH_SKIP_ALLOWLIST: Set<string> = new Set([
  // Public health check endpoints
  "admin/health/route.ts",
  // Stub routes awaiting implementation (TODO: Wire)
  // These return "not implemented" errors and will get auth when wired
  "v1/admin/events/route.ts",
  "v1/admin/events/[id]/route.ts",
  "v1/admin/events/[id]/cancel/route.ts",
  "v1/admin/registrations/route.ts",
  "v1/admin/registrations/[id]/promote/route.ts",
  "v1/admin/registrations/pending/route.ts",
]);

function checkAdminAuthGuards(): AuthGuardViolation[] {
  const violations: AuthGuardViolation[] = [];
  const adminRoutesDir = path.join(process.cwd(), "src/app/api/admin");
  const v1AdminRoutesDir = path.join(process.cwd(), "src/app/api/v1/admin");

  const checkDir = (dir: string) => {
    if (!fs.existsSync(dir)) return;

    const routeFiles = execSync(`find ${dir} -name "route.ts" -type f`, {
      encoding: "utf-8",
    })
      .trim()
      .split("\n")
      .filter(Boolean);

    for (const file of routeFiles) {
      const relativePath = path.relative(
        path.join(process.cwd(), "src/app/api"),
        file
      );

      // Skip allowlisted routes
      if (AUTH_SKIP_ALLOWLIST.has(relativePath)) {
        continue;
      }

      const content = fs.readFileSync(file, "utf-8");

      // Check if file contains any auth pattern
      const hasAuth = AUTH_PATTERNS.some((pattern) => content.includes(pattern));

      if (!hasAuth) {
        violations.push({
          file: relativePath,
          reason: "No authentication guard found (missing requireAuth/requireCapability/etc.)",
        });
      }
    }
  };

  checkDir(adminRoutesDir);
  checkDir(v1AdminRoutesDir);

  return violations;
}

// ============================================================================
// CHECK 3: Blocked capabilities list consistency
// ============================================================================

function checkBlockedCapabilitiesSync(): string[] {
  const errors: string[] = [];

  // The canonical list is defined in src/lib/auth.ts as BLOCKED_WHILE_IMPERSONATING
  const authFile = path.join(process.cwd(), "src/lib/auth.ts");

  if (!fs.existsSync(authFile)) {
    errors.push("Cannot find src/lib/auth.ts to verify blocked capabilities");
    return errors;
  }

  const authContent = fs.readFileSync(authFile, "utf-8");

  // Extract BLOCKED_WHILE_IMPERSONATING array from auth.ts
  // Handle typed arrays like: BLOCKED_WHILE_IMPERSONATING: Capability[] = [...]
  const blockedMatch = authContent.match(
    /BLOCKED_WHILE_IMPERSONATING[^=]*=\s*\[([\s\S]*?)\];/
  );

  if (!blockedMatch) {
    errors.push(
      "Cannot find BLOCKED_WHILE_IMPERSONATING array in src/lib/auth.ts"
    );
    return errors;
  }

  // Parse capabilities from the match - extract quoted strings
  const capabilityMatches = blockedMatch[1].match(/"([^"]+)"/g);
  const capabilitiesInAuth = capabilityMatches
    ? capabilityMatches.map((s) => s.replace(/"/g, ""))
    : [];

  // Verify the script's list matches
  const scriptCaps = [...DANGEROUS_CAPABILITIES].sort();
  const authCaps = capabilitiesInAuth.sort();

  if (scriptCaps.join(",") !== authCaps.join(",")) {
    errors.push(
      `Blocked capabilities mismatch!\n` +
        `  Script (check-auth-guardrails.ts): ${scriptCaps.join(", ")}\n` +
        `  Source (src/lib/auth.ts): ${authCaps.join(", ")}\n` +
        `  → Update DANGEROUS_CAPABILITIES in this script to match`
    );
  }

  return errors;
}

function main() {
  console.log("=".repeat(60));
  console.log("CI Auth Guardrails Check");
  console.log("=".repeat(60));
  console.log("");

  let hasFailures = false;

  // =========================================================================
  // CHECK 1: Impersonation safety (requireCapabilitySafe)
  // =========================================================================
  console.log(`${CYAN}[1/3] Checking impersonation safety...${NC}`);
  console.log("");

  const violations = findViolations();

  // Separate known gaps from new violations
  const knownGaps: ViolationInfo[] = [];
  const newViolations: ViolationInfo[] = [];

  for (const v of violations) {
    const key = `${v.file}:${v.line}`;
    if (KNOWN_GAPS.has(key)) {
      knownGaps.push(v);
    } else {
      newViolations.push(v);
    }
  }

  // Report known gaps (informational)
  if (knownGaps.length > 0) {
    console.log(`${YELLOW}Known gaps (tracked for remediation): ${knownGaps.length}${NC}`);
    console.log("  See KNOWN_GAPS in this script for details.");
    console.log("");
  }

  if (newViolations.length === 0) {
    console.log(`${GREEN}✓ No NEW unsafe auth helper usage detected${NC}`);
    console.log("");
  } else {
    hasFailures = true;
    console.log(`${RED}✗ Found ${newViolations.length} NEW unsafe auth helper usage(s)${NC}`);
    console.log("");

    const byFile = new Map<string, ViolationInfo[]>();
    for (const v of newViolations) {
      const list = byFile.get(v.file) || [];
      list.push(v);
      byFile.set(v.file, list);
    }

    for (const [file, fileViolations] of byFile) {
      console.log(`${YELLOW}${file}${NC}`);
      for (const v of fileViolations) {
        console.log(`  Line ${v.line}: ${RED}${v.capability}${NC}`);
        console.log(`    ${v.lineContent}`);
      }
    }
    console.log("");
  }

  // =========================================================================
  // CHECK 2: Admin routes have auth guards
  // =========================================================================
  console.log(`${CYAN}[2/3] Checking admin routes have auth guards...${NC}`);
  console.log("");

  const authGuardViolations = checkAdminAuthGuards();

  if (authGuardViolations.length === 0) {
    console.log(`${GREEN}✓ All admin routes have authentication${NC}`);
    console.log("");
  } else {
    hasFailures = true;
    console.log(`${RED}✗ Found ${authGuardViolations.length} admin route(s) without auth${NC}`);
    console.log("");

    for (const v of authGuardViolations) {
      console.log(`${YELLOW}${v.file}${NC}`);
      console.log(`  ${v.reason}`);
    }
    console.log("");
  }

  // =========================================================================
  // CHECK 3: Blocked capabilities sync
  // =========================================================================
  console.log(`${CYAN}[3/3] Checking blocked capabilities consistency...${NC}`);
  console.log("");

  const syncErrors = checkBlockedCapabilitiesSync();

  if (syncErrors.length === 0) {
    console.log(`${GREEN}✓ Blocked capabilities list is in sync${NC}`);
    console.log("");
  } else {
    hasFailures = true;
    for (const error of syncErrors) {
      console.log(`${RED}✗ ${error}${NC}`);
    }
    console.log("");
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log("=".repeat(60));

  if (hasFailures) {
    console.log(`${RED}GUARDRAILS FAILED${NC}`);
    console.log("=".repeat(60));
    console.log("");
    console.log("Fix the issues above before merging.");
    console.log("");
    console.log("For impersonation safety violations:");
    console.log(`  Use ${GREEN}requireCapabilitySafe(req, "capability")${NC}`);
    console.log(`  Instead of ${RED}requireCapability(req, "capability")${NC}`);
    console.log("");
    console.log("For missing auth guards:");
    console.log("  Add requireAuth(), requireCapability(), or requireAdmin()");
    console.log("");
    console.log("Reference: docs/CI/INVARIANTS.md");
    console.log("");
    process.exit(1);
  } else {
    console.log(`${GREEN}ALL GUARDRAILS PASSED${NC}`);
    console.log("=".repeat(60));
    console.log("");
    if (knownGaps.length > 0) {
      console.log(`${YELLOW}Note: ${knownGaps.length} known gap(s) tracked for remediation.${NC}`);
      console.log("See docs/CI/INVARIANTS.md for the remediation plan.");
      console.log("");
    }
    process.exit(0);
  }
}

main();
