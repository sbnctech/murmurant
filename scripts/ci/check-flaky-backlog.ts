#!/usr/bin/env npx tsx
/**
 * CI Flaky Test Backlog Validator
 *
 * This script ensures that tests marked with @flaky have corresponding
 * GitHub issue links for tracking. Flaky tests without issue links are
 * not allowed - we track flakiness, we don't hide it.
 *
 * Rules:
 * 1. Every @flaky tag must have an issue link in the same test block
 * 2. Issue links must be valid GitHub issue URLs for this repo
 * 3. Flaky tests should be fixed or removed, not accumulated
 *
 * Exit codes:
 *   0 - All @flaky tests have valid issue links
 *   1 - One or more @flaky tests missing issue links
 *
 * Usage:
 *   npx tsx scripts/ci/check-flaky-backlog.ts
 *   npm run test:flaky-backlog
 */

import * as fs from "fs";
import { execSync } from "child_process";

// ANSI colors
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const NC = "\x1b[0m"; // No Color

// GitHub issue URL pattern for this repo
const ISSUE_PATTERN = /https:\/\/github\.com\/sbnctech\/clubos\/issues\/\d+/;
const FLAKY_TAG_PATTERN = /@flaky/gi;

interface FlakyTest {
  file: string;
  line: number;
  testName: string;
  hasIssueLink: boolean;
  issueUrl?: string;
}

function findTestFiles(): string[] {
  try {
    const result = execSync(
      'find tests -name "*.spec.ts" -o -name "*.test.ts" 2>/dev/null',
      { encoding: "utf-8" }
    );
    return result.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

function findFlakyTests(filePath: string): FlakyTest[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const flakyTests: FlakyTest[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (FLAKY_TAG_PATTERN.test(line)) {
      // Look for issue link in surrounding context (5 lines before/after)
      const contextStart = Math.max(0, i - 5);
      const contextEnd = Math.min(lines.length, i + 10);
      const context = lines.slice(contextStart, contextEnd).join("\n");

      const issueMatch = context.match(ISSUE_PATTERN);

      // Extract test name from the test declaration
      let testName = "unknown";
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        const testMatch = lines[j].match(/test\s*\(\s*['"`]([^'"`]+)['"`]/);
        const itMatch = lines[j].match(/it\s*\(\s*['"`]([^'"`]+)['"`]/);
        if (testMatch) {
          testName = testMatch[1];
          break;
        }
        if (itMatch) {
          testName = itMatch[1];
          break;
        }
      }

      flakyTests.push({
        file: filePath,
        line: i + 1,
        testName,
        hasIssueLink: !!issueMatch,
        issueUrl: issueMatch?.[0],
      });
    }
  }

  return flakyTests;
}

function main(): void {
  console.log(`${CYAN}=== Flaky Test Backlog Validator ===${NC}\n`);

  const testFiles = findTestFiles();
  console.log(`Scanning ${testFiles.length} test files...\n`);

  const allFlakyTests: FlakyTest[] = [];

  for (const file of testFiles) {
    const flakyTests = findFlakyTests(file);
    allFlakyTests.push(...flakyTests);
  }

  if (allFlakyTests.length === 0) {
    console.log(`${GREEN}No @flaky tests found. Nice work keeping tests stable!${NC}\n`);
    process.exit(0);
  }

  // Separate tests with and without issue links
  const withIssues = allFlakyTests.filter((t) => t.hasIssueLink);
  const withoutIssues = allFlakyTests.filter((t) => !t.hasIssueLink);

  // Report tests with issues (informational)
  if (withIssues.length > 0) {
    console.log(`${YELLOW}Tracked flaky tests (${withIssues.length}):${NC}\n`);
    for (const test of withIssues) {
      console.log(`  ${test.file}:${test.line}`);
      console.log(`    Test: ${test.testName}`);
      console.log(`    Issue: ${test.issueUrl}`);
      console.log();
    }
  }

  // Report tests without issues (violations)
  if (withoutIssues.length > 0) {
    console.log(`${RED}VIOLATION: @flaky tests without issue links (${withoutIssues.length}):${NC}\n`);
    for (const test of withoutIssues) {
      console.log(`  ${RED}${test.file}:${test.line}${NC}`);
      console.log(`    Test: ${test.testName}`);
      console.log(`    ${RED}Missing GitHub issue link!${NC}`);
      console.log();
    }

    console.log(`${RED}=== FAILED ===${NC}\n`);
    console.log(`Every @flaky test must have a GitHub issue link for tracking.`);
    console.log(`Add a comment with the issue URL near the @flaky tag:\n`);
    console.log(`  // Flaky: https://github.com/sbnctech/clubos/issues/XXX`);
    console.log(`  test('@flaky: description', async () => { ... });\n`);
    process.exit(1);
  }

  // Summary
  console.log(`${GREEN}=== PASSED ===${NC}\n`);
  console.log(`All ${allFlakyTests.length} @flaky tests have issue links.`);
  console.log(`Remember: flaky tests should be fixed, not accumulated!\n`);
  process.exit(0);
}

main();
