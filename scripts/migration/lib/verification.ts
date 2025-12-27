/**
 * Post-Migration Verification Library
 *
 * Pure functions for verifying migration results against bundle expectations.
 * Read-only operations only - no database writes.
 *
 * Related: Issue #202 (WA Migration), Epic #277 (Rollback & Recovery)
 */

import * as fs from "fs";
import * as path from "path";
import type { MigrationReport } from "./types";
import type { PolicyBundle, CapturedPolicy } from "./policy-capture";

// =============================================================================
// Types
// =============================================================================

/**
 * Individual verification check result
 */
export interface VerificationCheck {
  name: string;
  category: "counts" | "tiers" | "policies" | "integrity";
  passed: boolean;
  expected: string | number;
  actual: string | number;
  message: string;
  severity: "error" | "warning" | "info";
}

/**
 * Database counts for comparison
 */
export interface DatabaseCounts {
  members: number;
  events: number;
  registrations: number;
  membershipTiers: number;
  membershipStatuses: number;
}

/**
 * Tier distribution in database
 */
export interface TierDistribution {
  tierCode: string;
  tierName: string;
  count: number;
  percentage: number;
}

/**
 * Policy verification entry
 */
export interface PolicyVerification {
  key: string;
  expected: unknown;
  actual: unknown;
  matches: boolean;
  source: string;
}

/**
 * Complete verification result
 */
export interface VerificationResult {
  runId: string;
  bundlePath: string;
  verifiedAt: Date;
  durationMs: number;
  passed: boolean;
  checks: VerificationCheck[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  counts: {
    bundle: Partial<DatabaseCounts>;
    database: DatabaseCounts;
  };
  tierDistribution: TierDistribution[];
  policyVerification: PolicyVerification[];
}

/**
 * Migration bundle structure (what we expect in the bundle directory)
 */
export interface MigrationBundle {
  report: MigrationReport;
  policies?: PolicyBundle;
  config?: Record<string, unknown>;
}

// =============================================================================
// Bundle Loading
// =============================================================================

/**
 * Load migration bundle from directory
 */
export function loadMigrationBundle(bundlePath: string): MigrationBundle {
  const reportPath = path.join(bundlePath, "migration-report.json");
  const policyPath = path.join(bundlePath, "policy-bundle.json");
  const configPath = path.join(bundlePath, "migration-config.json");

  if (!fs.existsSync(reportPath)) {
    throw new Error(`Migration report not found: ${reportPath}`);
  }

  const report = JSON.parse(
    fs.readFileSync(reportPath, "utf-8")
  ) as MigrationReport;

  let policies: PolicyBundle | undefined;
  if (fs.existsSync(policyPath)) {
    policies = JSON.parse(fs.readFileSync(policyPath, "utf-8")) as PolicyBundle;
  }

  let config: Record<string, unknown> | undefined;
  if (fs.existsSync(configPath)) {
    config = JSON.parse(
      fs.readFileSync(configPath, "utf-8")
    ) as Record<string, unknown>;
  }

  return { report, policies, config };
}

// =============================================================================
// Count Verification
// =============================================================================

/**
 * Extract expected counts from migration report
 */
export function extractBundleCounts(
  report: MigrationReport
): Partial<DatabaseCounts> {
  return {
    members: report.members.created + report.members.updated,
    events: report.events.created + report.events.updated,
    registrations: report.registrations.created + report.registrations.updated,
  };
}

/**
 * Verify member counts
 */
export function verifyMemberCount(
  bundleCount: number,
  dbCount: number
): VerificationCheck {
  const diff = Math.abs(bundleCount - dbCount);
  const passed = diff === 0;

  return {
    name: "Member Count",
    category: "counts",
    passed,
    expected: bundleCount,
    actual: dbCount,
    message: passed
      ? `Member count matches: ${dbCount}`
      : `Member count mismatch: expected ${bundleCount}, got ${dbCount} (diff: ${diff})`,
    severity: passed ? "info" : "error",
  };
}

/**
 * Verify event counts
 */
export function verifyEventCount(
  bundleCount: number,
  dbCount: number
): VerificationCheck {
  const diff = Math.abs(bundleCount - dbCount);
  const passed = diff === 0;

  return {
    name: "Event Count",
    category: "counts",
    passed,
    expected: bundleCount,
    actual: dbCount,
    message: passed
      ? `Event count matches: ${dbCount}`
      : `Event count mismatch: expected ${bundleCount}, got ${dbCount} (diff: ${diff})`,
    severity: passed ? "info" : "error",
  };
}

/**
 * Verify registration counts
 */
export function verifyRegistrationCount(
  bundleCount: number,
  dbCount: number
): VerificationCheck {
  const diff = Math.abs(bundleCount - dbCount);
  const passed = diff === 0;

  return {
    name: "Registration Count",
    category: "counts",
    passed,
    expected: bundleCount,
    actual: dbCount,
    message: passed
      ? `Registration count matches: ${dbCount}`
      : `Registration count mismatch: expected ${bundleCount}, got ${dbCount} (diff: ${diff})`,
    severity: passed ? "info" : "error",
  };
}

// =============================================================================
// Tier Verification
// =============================================================================

/**
 * Verify tier distribution is reasonable
 */
export function verifyTierDistribution(
  distribution: TierDistribution[]
): VerificationCheck {
  // Check that we have at least one tier with members
  const hasMembers = distribution.some((t) => t.count > 0);

  // Check for any tier with 100% (suspicious - might be default fallback)
  const suspiciousTier = distribution.find(
    (t) => t.percentage === 100 && distribution.length > 1
  );

  if (!hasMembers && distribution.length > 0) {
    return {
      name: "Tier Distribution",
      category: "tiers",
      passed: false,
      expected: "Members assigned to tiers",
      actual: "No members assigned",
      message: "No members have tier assignments",
      severity: "error",
    };
  }

  if (suspiciousTier) {
    return {
      name: "Tier Distribution",
      category: "tiers",
      passed: true,
      expected: "Distributed across tiers",
      actual: `100% in ${suspiciousTier.tierCode}`,
      message: `Warning: All members in tier '${suspiciousTier.tierCode}' - verify mapping`,
      severity: "warning",
    };
  }

  const summary = distribution
    .filter((t) => t.count > 0)
    .map((t) => `${t.tierCode}: ${t.count}`)
    .join(", ");

  return {
    name: "Tier Distribution",
    category: "tiers",
    passed: true,
    expected: "Members distributed",
    actual: summary || "No tiers",
    message: `Tier distribution: ${summary || "none"}`,
    severity: "info",
  };
}

/**
 * Verify minimum tier coverage
 */
export function verifyTierCoverage(
  totalMembers: number,
  membersWithTier: number
): VerificationCheck {
  const coverage = totalMembers > 0 ? (membersWithTier / totalMembers) * 100 : 0;
  const passed = coverage >= 95; // 95% threshold

  return {
    name: "Tier Coverage",
    category: "tiers",
    passed,
    expected: ">=95%",
    actual: `${coverage.toFixed(1)}%`,
    message: passed
      ? `Tier coverage: ${coverage.toFixed(1)}% (${membersWithTier}/${totalMembers})`
      : `Low tier coverage: ${coverage.toFixed(1)}% - ${totalMembers - membersWithTier} members without tier`,
    severity: passed ? "info" : "warning",
  };
}

// =============================================================================
// Policy Verification
// =============================================================================

/**
 * Verify a single policy value
 */
export function verifyPolicy(
  key: string,
  expected: unknown,
  actual: unknown,
  source: string
): PolicyVerification {
  const matches = JSON.stringify(expected) === JSON.stringify(actual);
  return { key, expected, actual, matches, source };
}

/**
 * Verify all policies from bundle
 */
export function verifyPolicies(
  bundlePolicies: CapturedPolicy[],
  actualPolicies: Map<string, unknown>
): VerificationCheck {
  const verifications: PolicyVerification[] = [];
  let mismatches = 0;

  for (const policy of bundlePolicies) {
    if (policy.source === "template") {
      // Skip template placeholders
      continue;
    }

    const actual = actualPolicies.get(policy.key);
    const verification = verifyPolicy(
      policy.key,
      policy.value,
      actual,
      policy.source
    );
    verifications.push(verification);

    if (!verification.matches) {
      mismatches++;
    }
  }

  const total = verifications.length;
  const passed = mismatches === 0;

  return {
    name: "Policy Snapshot",
    category: "policies",
    passed,
    expected: `${total} policies`,
    actual: `${total - mismatches} match, ${mismatches} mismatch`,
    message: passed
      ? `All ${total} policies match expected values`
      : `${mismatches} policy mismatches detected`,
    severity: passed ? "info" : "error",
  };
}

// =============================================================================
// Integrity Verification
// =============================================================================

/**
 * Verify no orphaned registrations
 */
export function verifyNoOrphanedRegistrations(
  orphanedCount: number
): VerificationCheck {
  const passed = orphanedCount === 0;

  return {
    name: "Orphaned Registrations",
    category: "integrity",
    passed,
    expected: 0,
    actual: orphanedCount,
    message: passed
      ? "No orphaned registrations found"
      : `${orphanedCount} registrations reference non-existent members or events`,
    severity: passed ? "info" : "error",
  };
}

/**
 * Verify no duplicate ID mappings
 */
export function verifyNoDuplicateMappings(
  duplicateCount: number
): VerificationCheck {
  const passed = duplicateCount === 0;

  return {
    name: "Duplicate ID Mappings",
    category: "integrity",
    passed,
    expected: 0,
    actual: duplicateCount,
    message: passed
      ? "No duplicate ID mappings found"
      : `${duplicateCount} duplicate WA ID mappings detected`,
    severity: passed ? "info" : "error",
  };
}

/**
 * Verify run ID matches
 */
export function verifyRunId(
  bundleRunId: string,
  latestDbRunId: string | null
): VerificationCheck {
  const passed = bundleRunId === latestDbRunId;

  return {
    name: "Run ID Match",
    category: "integrity",
    passed,
    expected: bundleRunId,
    actual: latestDbRunId || "(none)",
    message: passed
      ? `Run ID matches: ${bundleRunId}`
      : `Run ID mismatch: bundle=${bundleRunId}, database=${latestDbRunId || "none"}`,
    severity: passed ? "info" : "warning",
  };
}

// =============================================================================
// Result Aggregation
// =============================================================================

/**
 * Aggregate all checks into final result
 */
export function aggregateResults(
  runId: string,
  bundlePath: string,
  startTime: Date,
  checks: VerificationCheck[],
  counts: { bundle: Partial<DatabaseCounts>; database: DatabaseCounts },
  tierDistribution: TierDistribution[],
  policyVerification: PolicyVerification[]
): VerificationResult {
  const endTime = new Date();
  const durationMs = endTime.getTime() - startTime.getTime();

  const passed = checks.filter((c) => c.passed).length;
  const failed = checks.filter((c) => !c.passed && c.severity === "error")
    .length;
  const warnings = checks.filter(
    (c) => !c.passed && c.severity === "warning"
  ).length;

  return {
    runId,
    bundlePath,
    verifiedAt: endTime,
    durationMs,
    passed: failed === 0,
    checks,
    summary: {
      total: checks.length,
      passed,
      failed,
      warnings,
    },
    counts,
    tierDistribution,
    policyVerification,
  };
}

// =============================================================================
// Report Generation
// =============================================================================

/**
 * Generate markdown verification report
 */
export function generateMarkdownReport(result: VerificationResult): string {
  const statusEmoji = result.passed ? "PASS" : "FAIL";
  const statusBadge = result.passed
    ? "![Status](https://img.shields.io/badge/status-PASS-green)"
    : "![Status](https://img.shields.io/badge/status-FAIL-red)";

  const lines: string[] = [
    `# Migration Verification Report`,
    ``,
    `**Status**: ${statusEmoji} ${statusBadge}`,
    ``,
    `| Field | Value |`,
    `|-------|-------|`,
    `| Run ID | \`${result.runId}\` |`,
    `| Bundle Path | \`${result.bundlePath}\` |`,
    `| Verified At | ${result.verifiedAt.toISOString()} |`,
    `| Duration | ${result.durationMs}ms |`,
    ``,
    `## Summary`,
    ``,
    `| Metric | Count |`,
    `|--------|-------|`,
    `| Total Checks | ${result.summary.total} |`,
    `| Passed | ${result.summary.passed} |`,
    `| Failed | ${result.summary.failed} |`,
    `| Warnings | ${result.summary.warnings} |`,
    ``,
    `## Count Comparison`,
    ``,
    `| Entity | Bundle | Database | Match |`,
    `|--------|--------|----------|-------|`,
    `| Members | ${result.counts.bundle.members ?? "-"} | ${result.counts.database.members} | ${result.counts.bundle.members === result.counts.database.members ? "Yes" : "**NO**"} |`,
    `| Events | ${result.counts.bundle.events ?? "-"} | ${result.counts.database.events} | ${result.counts.bundle.events === result.counts.database.events ? "Yes" : "**NO**"} |`,
    `| Registrations | ${result.counts.bundle.registrations ?? "-"} | ${result.counts.database.registrations} | ${result.counts.bundle.registrations === result.counts.database.registrations ? "Yes" : "**NO**"} |`,
    ``,
    `## Tier Distribution`,
    ``,
  ];

  if (result.tierDistribution.length > 0) {
    lines.push(`| Tier | Name | Count | % |`);
    lines.push(`|------|------|-------|---|`);
    for (const tier of result.tierDistribution) {
      lines.push(
        `| ${tier.tierCode} | ${tier.tierName} | ${tier.count} | ${tier.percentage.toFixed(1)}% |`
      );
    }
  } else {
    lines.push(`_No tier data available_`);
  }

  lines.push(``);
  lines.push(`## Verification Checks`);
  lines.push(``);
  lines.push(`| Check | Category | Status | Message |`);
  lines.push(`|-------|----------|--------|---------|`);

  for (const check of result.checks) {
    const status = check.passed
      ? "PASS"
      : check.severity === "warning"
        ? "WARN"
        : "FAIL";
    lines.push(
      `| ${check.name} | ${check.category} | ${status} | ${check.message} |`
    );
  }

  if (result.policyVerification.length > 0) {
    lines.push(``);
    lines.push(`## Policy Verification`);
    lines.push(``);
    lines.push(`| Policy Key | Source | Match |`);
    lines.push(`|------------|--------|-------|`);

    for (const pv of result.policyVerification) {
      lines.push(`| ${pv.key} | ${pv.source} | ${pv.matches ? "Yes" : "**NO**"} |`);
    }
  }

  lines.push(``);
  lines.push(`---`);
  lines.push(``);
  lines.push(
    `_Generated by ClubOS Migration Verification Tool at ${result.verifiedAt.toISOString()}_`
  );

  return lines.join("\n");
}

/**
 * Generate JSON report (for programmatic consumption)
 */
export function generateJsonReport(result: VerificationResult): string {
  return JSON.stringify(result, null, 2);
}
