#!/usr/bin/env npx tsx
/**
 * PR Policy Guard
 *
 * Validates PRs against merge policy rules:
 * - Size limits (files and lines)
 * - Hotspot declarations
 * - Risk level classification
 * - Required sections based on risk level
 *
 * Copyright (c) Santa Barbara Newcomers Club. All rights reserved.
 */

import { execSync } from "child_process";

// Thresholds
const MAX_FILES_S = 5;
const MAX_LINES_S = 100;
const MAX_FILES_M = 15;
const MAX_LINES_M = 300;

// Hotspot patterns
const HOTSPOT_PATTERNS = [
  /^prisma\/schema\.prisma$/,
  /^prisma\/migrations\//,
  /^package\.json$/,
  /^package-lock\.json$/,
  /^\.github\/workflows\//,
  /^src\/app\/admin\/.*layout\.tsx$/,
  /^src\/app\/admin\/.*nav.*\.tsx$/,
  /^src\/app\/admin\/.*search.*\.tsx$/,
  /^src\/app\/admin\/AdminSectionNav\.tsx$/,
  /^src\/app\/admin\/AdminSearchPanel\.tsx$/,
  /^src\/components\/editor\//,
  /^src\/app\/admin\/content\/pages\//,
  /^src\/lib\/publishing\//,
  /^src\/lib\/auth/,
  /^src\/lib\/rbac/,
  /^src\/lib\/permissions/,
];

interface DiffStat {
  files: string[];
  additions: number;
  deletions: number;
}

interface PRBody {
  riskLevel: "low" | "medium" | "high" | null;
  hasInvariantsSection: boolean;
  hasProofSection: boolean;
  hasProofCheckbox: boolean;
  hasSummary: boolean;
}

function getDiffStat(): DiffStat {
  try {
    // Get list of changed files
    const filesOutput = execSync("git diff --name-only origin/main...HEAD", {
      encoding: "utf-8",
    }).trim();

    const files = filesOutput ? filesOutput.split("\n").filter(Boolean) : [];

    // Get line counts
    const statOutput = execSync("git diff --shortstat origin/main...HEAD", {
      encoding: "utf-8",
    }).trim();

    let additions = 0;
    let deletions = 0;

    const addMatch = statOutput.match(/(\d+) insertion/);
    const delMatch = statOutput.match(/(\d+) deletion/);

    if (addMatch) additions = parseInt(addMatch[1], 10);
    if (delMatch) deletions = parseInt(delMatch[1], 10);

    return { files, additions, deletions };
  } catch {
    console.error("Warning: Could not get diff stats, using empty defaults");
    return { files: [], additions: 0, deletions: 0 };
  }
}

function findHotspots(files: string[]): string[] {
  const hotspots: string[] = [];

  for (const file of files) {
    for (const pattern of HOTSPOT_PATTERNS) {
      if (pattern.test(file)) {
        hotspots.push(file);
        break;
      }
    }
  }

  return hotspots;
}

async function getPRBody(): Promise<string | null> {
  // Try to get PR body from GitHub API
  const prNumber = process.env.GITHUB_PR_NUMBER;
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;

  if (!prNumber || !repo || !token) {
    // Not in CI context or missing env vars
    return null;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repo}/pulls/${prNumber}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      console.error(`Warning: Could not fetch PR body: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as { body?: string };
    return data.body || "";
  } catch (error) {
    console.error("Warning: Could not fetch PR body:", error);
    return null;
  }
}

function parsePRBody(body: string): PRBody {
  const result: PRBody = {
    riskLevel: null,
    hasInvariantsSection: false,
    hasProofSection: false,
    hasProofCheckbox: false,
    hasSummary: false,
  };

  // Check risk level - look for checked checkbox
  if (/- \[x\] Low/i.test(body)) {
    result.riskLevel = "low";
  } else if (/- \[x\] Medium/i.test(body)) {
    result.riskLevel = "medium";
  } else if (/- \[x\] High/i.test(body)) {
    result.riskLevel = "high";
  }

  // Check for invariants section with at least one checkbox checked
  const invariantsMatch = body.match(
    /## Invariants touched[\s\S]*?(?=##|$)/i
  );
  if (invariantsMatch) {
    result.hasInvariantsSection = /- \[x\]/i.test(invariantsMatch[0]);
  }

  // Check for proof section with at least one checkbox checked
  const proofMatch = body.match(
    /## Proof of safety[\s\S]*?(?=##|$)/i
  );
  if (proofMatch) {
    result.hasProofSection = true;
    result.hasProofCheckbox = /- \[x\]/i.test(proofMatch[0]);
  }

  // Check for non-template summary
  const summaryMatch = body.match(/## Summary[\s\S]*?(?=##|$)/i);
  if (summaryMatch) {
    const summaryContent = summaryMatch[0]
      .replace(/## Summary/i, "")
      .replace(/What changed and why\./i, "")
      .trim();
    result.hasSummary = summaryContent.length > 10;
  }

  return result;
}

function validatePRBody(parsed: PRBody): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Risk level is always required
  if (!parsed.riskLevel) {
    errors.push("Risk level not selected. Check one of: Low, Medium, or High.");
  }

  // Summary is always required
  if (!parsed.hasSummary) {
    warnings.push("Summary section appears empty. Please describe what changed and why.");
  }

  // For Medium/High risk, additional sections are required
  if (parsed.riskLevel === "medium" || parsed.riskLevel === "high") {
    if (!parsed.hasInvariantsSection) {
      errors.push(
        `Risk level is ${parsed.riskLevel.toUpperCase()}: Invariants section required. ` +
        "Check which invariants are touched (or 'None of the above')."
      );
    }

    if (!parsed.hasProofCheckbox) {
      errors.push(
        `Risk level is ${parsed.riskLevel.toUpperCase()}: Proof of safety required. ` +
        "Check which verification commands were run."
      );
    }
  }

  return { errors, warnings };
}

async function main(): Promise<void> {
  console.log("=== PR Policy Guard ===\n");

  const { files, additions, deletions } = getDiffStat();
  const totalLines = additions + deletions;
  const fileCount = files.length;

  console.log(`Files changed: ${fileCount}`);
  console.log(`Lines changed: ${totalLines} (+${additions} -${deletions})`);

  // Check size
  let size = "S";
  if (fileCount > MAX_FILES_M || totalLines > MAX_LINES_M) {
    size = "L";
  } else if (fileCount > MAX_FILES_S || totalLines > MAX_LINES_S) {
    size = "M";
  }

  console.log(`Size category: ${size}\n`);

  // Check hotspots
  const hotspots = findHotspots(files);

  if (hotspots.length > 0) {
    console.log("Hotspots detected:");
    for (const h of hotspots) {
      console.log(`  - ${h}`);
    }
    console.log("");
  } else {
    console.log("No hotspots detected.\n");
  }

  // Validation from diff
  const errors: string[] = [];
  const warnings: string[] = [];

  if (size === "L") {
    errors.push(
      `PR exceeds size limits (${fileCount} files, ${totalLines} lines). ` +
        `Maximum for self-merge: ${MAX_FILES_M} files, ${MAX_LINES_M} lines. ` +
        `Please split into micro-PRs.`
    );
  }

  if (size === "M") {
    warnings.push(
      `PR is medium-sized (${fileCount} files, ${totalLines} lines). ` +
        `Merge captain review required.`
    );
  }

  if (hotspots.length > 0) {
    warnings.push(
      `PR touches ${hotspots.length} hotspot file(s). ` +
        `Ensure HOTSPOT PLAN section is included in PR body. ` +
        `Merge captain approval required.`
    );
  }

  // Check PR body content (only in CI context)
  const prBody = await getPRBody();
  if (prBody !== null) {
    console.log("--- PR Body Validation ---\n");
    const parsed = parsePRBody(prBody);

    console.log(`Risk level: ${parsed.riskLevel || "NOT SELECTED"}`);
    console.log(`Invariants checked: ${parsed.hasInvariantsSection ? "Yes" : "No"}`);
    console.log(`Proof checked: ${parsed.hasProofCheckbox ? "Yes" : "No"}`);
    console.log(`Has summary: ${parsed.hasSummary ? "Yes" : "No"}`);
    console.log("");

    const bodyValidation = validatePRBody(parsed);
    errors.push(...bodyValidation.errors);
    warnings.push(...bodyValidation.warnings);
  } else {
    console.log("(PR body validation skipped - not in CI context)\n");
  }

  // Output
  if (warnings.length > 0) {
    console.log("WARNINGS:");
    for (const w of warnings) {
      console.log(`  ⚠️  ${w}`);
    }
    console.log("");
  }

  if (errors.length > 0) {
    console.log("ERRORS:");
    for (const e of errors) {
      console.log(`  ❌ ${e}`);
    }
    console.log("");
    process.exit(1);
  }

  console.log("✅ PR policy check passed.");
}

main();
