#!/usr/bin/env npx tsx
/**
 * Release Classification Parser
 *
 * Parses PR body to extract and validate release classification.
 * Used by CI to enforce classification requirements.
 */

export type ReleaseClassification = "experimental" | "candidate" | "stable";

export interface ClassificationResult {
  valid: boolean;
  classification: ReleaseClassification | null;
  error: string | null;
  selectedCount: number;
}

/**
 * Parse PR body to extract release classification.
 *
 * Looks for checked checkboxes matching classification keywords.
 * Checkbox format: `- [x] **experimental**` or `- [x] experimental`
 */
export function parseReleaseClassification(prBody: string): ClassificationResult {
  if (!prBody || prBody.trim() === "") {
    return {
      valid: false,
      classification: null,
      error: "PR body is empty",
      selectedCount: 0,
    };
  }

  const classifications: ReleaseClassification[] = [
    "experimental",
    "candidate",
    "stable",
  ];
  const selected: ReleaseClassification[] = [];

  for (const classification of classifications) {
    // Match: - [x] **classification** or - [x] classification
    // Allows for whitespace variations and uppercase X
    const pattern = new RegExp(
      `^\\s*-\\s*\\[\\s*[xX]\\s*\\]\\s*\\*{0,2}${classification}\\*{0,2}`,
      "m"
    );
    if (pattern.test(prBody)) {
      selected.push(classification);
    }
  }

  if (selected.length === 0) {
    return {
      valid: false,
      classification: null,
      error:
        "No release classification selected. Select one of: experimental, candidate, stable",
      selectedCount: 0,
    };
  }

  if (selected.length > 1) {
    return {
      valid: false,
      classification: null,
      error: `Multiple classifications selected (${selected.join(", ")}). Select exactly one.`,
      selectedCount: selected.length,
    };
  }

  return {
    valid: true,
    classification: selected[0],
    error: null,
    selectedCount: 1,
  };
}

// CLI entry point
if (process.argv[1]?.includes("check-release-classification")) {
  const prBody = process.argv[2] || "";

  if (!prBody) {
    console.error("Usage: check-release-classification.ts <pr-body>");
    console.error("  or pipe PR body via stdin");
    process.exit(1);
  }

  const result = parseReleaseClassification(prBody);

  if (result.valid) {
    console.log(`✓ Release classification: ${result.classification}`);
    process.exit(0);
  } else {
    console.error(`✗ ${result.error}`);
    process.exit(1);
  }
}
