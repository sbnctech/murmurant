#!/usr/bin/env npx tsx
/**
 * PR Policy Guard
 *
 * Validates PRs against merge policy rules:
 * - Size limits (files and lines)
 * - Hotspot declarations
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

function main(): void {
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

  // Validation
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
