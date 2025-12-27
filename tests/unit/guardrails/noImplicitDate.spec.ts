/**
 * Guardrail: No Implicit Date Usage in Time-Critical Modules
 *
 * This test prevents regressions where implicit Date() calls leak into
 * scheduling and timezone modules. These patterns are dangerous because
 * they use the system clock without timezone awareness.
 *
 * Forbidden patterns:
 * - `new Date()` (zero-arg) - uses system clock implicitly
 * - `Date.now()` - uses system clock implicitly
 *
 * Allowed patterns:
 * - `new Date(timestamp)` - explicit value
 * - `new Date(year, month, ...)` - explicit construction
 * - Default parameters like `(now: Date = new Date())` - listed in exceptions
 *
 * If your code legitimately needs current time:
 * 1. Accept a Date parameter with optional default
 * 2. Add the line to KNOWN_EXCEPTIONS with a comment explaining why
 *
 * See: docs/CI/TIME_AND_TIMEZONE_RULES.md
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// Files to scan for forbidden patterns
const TIME_CRITICAL_FILES = [
  "src/lib/timezone.ts",
  "src/lib/events/scheduling.ts",
];

// Glob pattern for any future time modules
const TIME_MODULES_GLOB = "src/lib/time/**/*.ts";

/**
 * Known exceptions - these are intentional uses that have been reviewed.
 * Format: "file:lineNumber:pattern"
 *
 * Each exception should be a default parameter or otherwise intentional.
 * Add new exceptions sparingly and with clear justification.
 */
const KNOWN_EXCEPTIONS: Record<string, string[]> = {
  "src/lib/timezone.ts": [
    // getClubHour has optional Date param for callers who want current time
    "135:new Date()",
  ],
  "src/lib/events/scheduling.ts": [
    // All of these are default parameters allowing callers to inject dates for testing
    "207:new Date()", // getNextSunday default param
    "243:new Date()", // getThisWeekSunday default param
    "288:new Date()", // computeDefaultSchedule input.now fallback
    "331:new Date()", // getEventVisibilityState default param
    "367:new Date()", // getEventRegistrationState default param
    "390:new Date()", // getEventOperationalStatus default param
    "503:new Date()", // getEnewsWeekRange default param
    "512:new Date()", // isAnnouncingThisWeek default param
    "528:new Date()", // isRegistrationOpeningThisWeek default param
  ],
};

/**
 * Patterns that indicate implicit Date usage.
 * These capture zero-arg Date constructor and Date.now().
 */
const FORBIDDEN_PATTERNS = [
  {
    // Matches: new Date() but not new Date(something)
    // Uses negative lookahead to exclude Date with arguments
    regex: /\bnew\s+Date\s*\(\s*\)/g,
    name: "new Date()",
    message: "Use explicit date or accept Date parameter",
  },
  {
    regex: /\bDate\.now\s*\(\s*\)/g,
    name: "Date.now()",
    message: "Use explicit timestamp or accept Date parameter",
  },
];

interface Violation {
  file: string;
  line: number;
  pattern: string;
  content: string;
}

function scanFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const absolutePath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    return violations;
  }

  const content = fs.readFileSync(absolutePath, "utf-8");
  const lines = content.split("\n");
  const exceptions = KNOWN_EXCEPTIONS[filePath] ?? [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    for (const pattern of FORBIDDEN_PATTERNS) {
      const matches = line.match(pattern.regex);
      if (matches) {
        // Check if this line:pattern is in exceptions
        const exceptionKey = `${lineNumber}:${pattern.name}`;
        if (!exceptions.includes(exceptionKey)) {
          violations.push({
            file: filePath,
            line: lineNumber,
            pattern: pattern.name,
            content: line.trim(),
          });
        }
      }
    }
  });

  return violations;
}

function findTimeModules(): string[] {
  const timeDir = path.resolve(process.cwd(), "src/lib/time");
  if (!fs.existsSync(timeDir)) {
    return [];
  }

  const files: string[] = [];
  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith(".ts")) {
        files.push(path.relative(process.cwd(), fullPath));
      }
    }
  }
  walk(timeDir);
  return files;
}

describe("Guardrail: No Implicit Date in Time-Critical Modules", () => {
  it("scans time-critical files for forbidden Date patterns", () => {
    const allViolations: Violation[] = [];

    // Scan known time-critical files
    for (const file of TIME_CRITICAL_FILES) {
      const violations = scanFile(file);
      allViolations.push(...violations);
    }

    // Scan any files in src/lib/time/**
    const timeModules = findTimeModules();
    for (const file of timeModules) {
      const violations = scanFile(file);
      allViolations.push(...violations);
    }

    if (allViolations.length > 0) {
      const report = allViolations
        .map(
          (v) =>
            `  ${v.file}:${v.line} - ${v.pattern}\n    ${v.content}`
        )
        .join("\n\n");

      expect.fail(
        `Found ${allViolations.length} implicit Date usage(s) in time-critical files:\n\n${report}\n\n` +
          "If this is intentional, add an exception to KNOWN_EXCEPTIONS in\n" +
          "tests/unit/guardrails/noImplicitDate.spec.ts with justification.\n\n" +
          "See: docs/CI/TIME_AND_TIMEZONE_RULES.md"
      );
    }

    // Test passes if no violations found
    expect(allViolations).toHaveLength(0);
  });

  it("validates that exception files exist", () => {
    const missingFiles: string[] = [];

    for (const file of Object.keys(KNOWN_EXCEPTIONS)) {
      const absolutePath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(absolutePath)) {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      expect.fail(
        `Exception list references files that don't exist:\n` +
          missingFiles.map((f) => `  - ${f}`).join("\n")
      );
    }
  });

  it("validates that exceptions match actual line content", () => {
    const staleExceptions: string[] = [];

    for (const [file, exceptions] of Object.entries(KNOWN_EXCEPTIONS)) {
      const absolutePath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(absolutePath)) continue;

      const content = fs.readFileSync(absolutePath, "utf-8");
      const lines = content.split("\n");

      for (const exception of exceptions) {
        const [lineStr, pattern] = exception.split(":");
        const lineNumber = parseInt(lineStr, 10);
        const line = lines[lineNumber - 1];

        if (!line) {
          staleExceptions.push(`${file}:${exception} - line doesn't exist`);
          continue;
        }

        // Find the pattern regex
        const patternDef = FORBIDDEN_PATTERNS.find((p) => p.name === pattern);
        if (!patternDef) {
          staleExceptions.push(`${file}:${exception} - unknown pattern`);
          continue;
        }

        if (!patternDef.regex.test(line)) {
          staleExceptions.push(
            `${file}:${exception} - pattern not found on line`
          );
        }

        // Reset regex lastIndex for global patterns
        patternDef.regex.lastIndex = 0;
      }
    }

    if (staleExceptions.length > 0) {
      expect.fail(
        `Found stale exceptions that no longer match source:\n` +
          staleExceptions.map((e) => `  - ${e}`).join("\n") +
          "\n\nUpdate KNOWN_EXCEPTIONS to match current line numbers."
      );
    }
  });
});
