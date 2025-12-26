/**
 * Documentation Contract Tests
 *
 * Charter Principles:
 * - P4: No hidden rules (behavior explainable in plain English)
 * - P5: Every important action must be undoable or reversible
 *
 * Tests that core trust documentation contains required sections:
 * 1. Contract docs must have standard structure
 * 2. Required headings must be present
 * 3. Versioning must be documented
 *
 * These tests are deterministic and test file structure only.
 * They run fast (file I/O only) and catch structural regressions.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// ============================================================================
// Configuration
// ============================================================================

const DOCS_ROOT = join(process.cwd(), "docs");

/**
 * Contract documents and their required sections.
 * Each document type has specific structural requirements.
 */
const CONTRACT_DOCS = {
  "ARCH/PREVIEW_SURFACE_CONTRACT.md": {
    description: "Preview Surface Contract",
    requiredHeadings: [
      "Purpose",
      "Guarantees",
      "Non-Guarantees",
      "Versioning",
    ],
    requiredPatterns: [
      /\bguarantee/i,
      /\bnot guaranteed\b/i,
    ],
  },
  "ARCH/INTENT_MANIFEST_SCHEMA.md": {
    description: "Intent Manifest Schema",
    requiredHeadings: [
      "Purpose",
      "Schema",
    ],
    requiredPatterns: [],
  },
  "ARCH/SUGGESTION_REVIEW_WORKFLOW.md": {
    description: "Suggestion Review Workflow",
    requiredHeadings: [
      "Overview",
      "Workflow",
    ],
    requiredPatterns: [
      /\bhuman\b/i,
      /\bapproval\b|\baccept/i,
    ],
  },
} as const;

/**
 * Optional contract documents that are validated if present.
 * These may be in PRs but not yet merged.
 */
const OPTIONAL_CONTRACT_DOCS = {
  "ARCH/REVERSIBILITY_CONTRACT.md": {
    description: "Reversibility Contract",
    requiredHeadings: [
      "Purpose",
      "Guarantees",
      "Non-Guarantees",
    ],
    requiredPatterns: [
      /\breversib/i,
      /\babort\b/i,
    ],
  },
  "ARCH/CORE_TRUST_SURFACE.md": {
    description: "Core Trust Surface",
    requiredHeadings: [
      "Purpose",
    ],
    requiredPatterns: [
      /\btrust\b/i,
    ],
  },
} as const;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extract all markdown headings from content.
 * Returns array of { level, text } objects.
 */
function extractHeadings(content: string): Array<{ level: number; text: string }> {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: Array<{ level: number; text: string }> = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2].trim(),
    });
  }

  return headings;
}

/**
 * Check if content contains a heading matching the search term.
 * Matches partial text (e.g., "Guarantees" matches "## 2. Guarantees" or "### 2.1 Fidelity Guarantees").
 */
function hasHeadingContaining(content: string, searchTerm: string): boolean {
  const headings = extractHeadings(content);
  const searchLower = searchTerm.toLowerCase();
  return headings.some((h) => h.text.toLowerCase().includes(searchLower));
}

/**
 * Read a doc file and return its content, or null if not found.
 */
function readDoc(relativePath: string): string | null {
  const fullPath = join(DOCS_ROOT, relativePath);
  if (!existsSync(fullPath)) {
    return null;
  }
  return readFileSync(fullPath, "utf-8");
}

// ============================================================================
// A) REQUIRED CONTRACT DOCUMENTS
// ============================================================================

describe("Docs Contract: Required Contract Documents", () => {
  for (const [docPath, config] of Object.entries(CONTRACT_DOCS)) {
    describe(config.description, () => {
      it(`${docPath} exists`, () => {
        const content = readDoc(docPath);
        expect(content, `Expected ${docPath} to exist`).not.toBeNull();
      });

      for (const heading of config.requiredHeadings) {
        it(`has "${heading}" section`, () => {
          const content = readDoc(docPath);
          if (content === null) {
            // Skip if doc doesn't exist (caught by existence test)
            return;
          }
          expect(
            hasHeadingContaining(content, heading),
            `Expected ${docPath} to have a heading containing "${heading}"`
          ).toBe(true);
        });
      }

      for (const pattern of config.requiredPatterns) {
        it(`contains pattern: ${pattern.source}`, () => {
          const content = readDoc(docPath);
          if (content === null) {
            return;
          }
          expect(
            pattern.test(content),
            `Expected ${docPath} to match pattern ${pattern}`
          ).toBe(true);
        });
      }
    });
  }
});

// ============================================================================
// B) OPTIONAL CONTRACT DOCUMENTS (validated if present)
// ============================================================================

describe("Docs Contract: Optional Contract Documents", () => {
  for (const [docPath, config] of Object.entries(OPTIONAL_CONTRACT_DOCS)) {
    describe(config.description, () => {
      const content = readDoc(docPath);

      if (content === null) {
        it.skip(`${docPath} not yet present (skipped)`, () => {
          // Document doesn't exist yet - skip validation
        });
      } else {
        it(`${docPath} exists`, () => {
          expect(content).not.toBeNull();
        });

        for (const heading of config.requiredHeadings) {
          it(`has "${heading}" section`, () => {
            expect(
              hasHeadingContaining(content, heading),
              `Expected ${docPath} to have a heading containing "${heading}"`
            ).toBe(true);
          });
        }

        for (const pattern of config.requiredPatterns) {
          it(`contains pattern: ${pattern.source}`, () => {
            expect(
              pattern.test(content),
              `Expected ${docPath} to match pattern ${pattern}`
            ).toBe(true);
          });
        }
      }
    });
  }
});

// ============================================================================
// C) CONTRACT VERSIONING
// ============================================================================

describe("Docs Contract: Versioning Requirements", () => {
  const VERSIONED_DOCS = ["ARCH/PREVIEW_SURFACE_CONTRACT.md"];

  for (const docPath of VERSIONED_DOCS) {
    it(`${docPath} has version information`, () => {
      const content = readDoc(docPath);
      if (content === null) {
        return;
      }

      // Check for version section or version table
      const hasVersionSection = hasHeadingContaining(content, "Version");
      const hasVersionTable = /\|\s*Version\s*\|/i.test(content);
      const hasVersionNumber = /\b\d+\.\d+\b/.test(content);

      expect(
        hasVersionSection || hasVersionTable,
        `Expected ${docPath} to have a Versioning section or version table`
      ).toBe(true);

      expect(
        hasVersionNumber,
        `Expected ${docPath} to contain a version number (e.g., 1.0)`
      ).toBe(true);
    });
  }
});

// ============================================================================
// D) STRUCTURAL CONSISTENCY
// ============================================================================

describe("Docs Contract: Structural Consistency", () => {
  it("all contract docs have consistent status indicator", () => {
    for (const docPath of Object.keys(CONTRACT_DOCS)) {
      const content = readDoc(docPath);
      if (content === null) continue;

      // Contract docs should indicate their status
      // Various formats: **Status**: or **Status:** or Status:
      const hasStatus =
        /\*\*Status\*\*\s*:/i.test(content) ||
        /^Status\s*:/im.test(content) ||
        content.includes("Canonical") ||
        content.includes("Specification");

      expect(
        hasStatus,
        `Expected ${docPath} to have a status indicator`
      ).toBe(true);
    }
  });

  it("contract docs reference related documents", () => {
    for (const docPath of Object.keys(CONTRACT_DOCS)) {
      const content = readDoc(docPath);
      if (content === null) continue;

      // Should have references, related docs section, or internal TOC links
      const hasReferences =
        hasHeadingContaining(content, "Reference") ||
        hasHeadingContaining(content, "Related") ||
        hasHeadingContaining(content, "Table of Contents") ||
        /\[.+\]\(.+\.md\)/.test(content) || // Has markdown links to .md files
        /\[.+\]\(#.+\)/.test(content); // Has internal anchor links (TOC)

      expect(
        hasReferences,
        `Expected ${docPath} to reference related documents`
      ).toBe(true);
    }
  });
});
