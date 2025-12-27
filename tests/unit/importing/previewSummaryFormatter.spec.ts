/**
 * Preview Summary Formatter Unit Tests
 *
 * Tests the pure formatting functions for dry-run preview summaries.
 */

import { describe, it, expect } from "vitest";
import {
  formatEntityLine,
  calculateTotals,
  formatPreviewSummary,
  formatCompactSummary,
  type EntityCounts,
  type PreviewSummaryCounts,
  type PreviewSummaryInput,
} from "@/lib/importing/previewSummaryFormatter";

// =============================================================================
// formatEntityLine Tests
// =============================================================================

describe("formatEntityLine", () => {
  it("formats all non-zero counts", () => {
    const counts: EntityCounts = {
      created: 10,
      updated: 5,
      skipped: 3,
      errors: 2,
    };
    expect(formatEntityLine("Members", counts)).toBe(
      "Members: 10 created, 5 updated, 3 skipped, 2 errors"
    );
  });

  it("omits zero counts", () => {
    const counts: EntityCounts = {
      created: 10,
      updated: 0,
      skipped: 0,
      errors: 0,
    };
    expect(formatEntityLine("Members", counts)).toBe("Members: 10 created");
  });

  it("shows only errors when everything else is zero", () => {
    const counts: EntityCounts = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 5,
    };
    expect(formatEntityLine("Events", counts)).toBe("Events: 5 errors");
  });

  it("shows 'no changes' when all counts are zero", () => {
    const counts: EntityCounts = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    };
    expect(formatEntityLine("Registrations", counts)).toBe(
      "Registrations: no changes"
    );
  });

  it("formats created and skipped only", () => {
    const counts: EntityCounts = {
      created: 50,
      updated: 0,
      skipped: 25,
      errors: 0,
    };
    expect(formatEntityLine("Members", counts)).toBe(
      "Members: 50 created, 25 skipped"
    );
  });
});

// =============================================================================
// calculateTotals Tests
// =============================================================================

describe("calculateTotals", () => {
  it("sums counts across all entities", () => {
    const counts: PreviewSummaryCounts = {
      members: { created: 10, updated: 5, skipped: 2, errors: 1 },
      events: { created: 20, updated: 3, skipped: 7, errors: 0 },
      registrations: { created: 100, updated: 0, skipped: 50, errors: 2 },
    };

    const totals = calculateTotals(counts);

    expect(totals.created).toBe(130);
    expect(totals.updated).toBe(8);
    expect(totals.skipped).toBe(59);
    expect(totals.errors).toBe(3);
  });

  it("handles empty counts", () => {
    const counts: PreviewSummaryCounts = {};
    const totals = calculateTotals(counts);

    expect(totals.created).toBe(0);
    expect(totals.updated).toBe(0);
    expect(totals.skipped).toBe(0);
    expect(totals.errors).toBe(0);
  });

  it("handles single entity", () => {
    const counts: PreviewSummaryCounts = {
      members: { created: 42, updated: 0, skipped: 0, errors: 0 },
    };
    const totals = calculateTotals(counts);

    expect(totals.created).toBe(42);
    expect(totals.updated).toBe(0);
  });

  it("handles undefined entities in counts object", () => {
    const counts: PreviewSummaryCounts = {
      members: { created: 10, updated: 0, skipped: 0, errors: 0 },
      events: undefined,
    };
    const totals = calculateTotals(counts);

    expect(totals.created).toBe(10);
  });
});

// =============================================================================
// formatPreviewSummary Tests
// =============================================================================

describe("formatPreviewSummary", () => {
  it("formats a complete dry-run summary", () => {
    const input: PreviewSummaryInput = {
      mode: "dry-run",
      counts: {
        members: { created: 10, updated: 5, skipped: 2, errors: 1 },
        events: { created: 20, updated: 0, skipped: 5, errors: 0 },
        registrations: { created: 100, updated: 0, skipped: 50, errors: 2 },
      },
      durationMs: 1234,
    };

    const result = formatPreviewSummary(input);

    expect(result).toContain("PREVIEW SUMMARY (DRY-RUN)");
    expect(result).toContain("Members: 10 created, 5 updated, 2 skipped, 1 errors");
    expect(result).toContain("Events: 20 created, 5 skipped");
    expect(result).toContain("Registrations: 100 created, 50 skipped, 2 errors");
    expect(result).toContain("Total: 195 records");
    expect(result).toContain("130 created");
    expect(result).toContain("5 updated");
    expect(result).toContain("57 skipped");
    expect(result).toContain("3 errors");
    expect(result).toContain("Duration: 1234ms");
  });

  it("formats a live mode summary", () => {
    const input: PreviewSummaryInput = {
      mode: "live",
      counts: {
        members: { created: 5, updated: 0, skipped: 0, errors: 0 },
      },
    };

    const result = formatPreviewSummary(input);

    expect(result).toContain("PREVIEW SUMMARY (LIVE)");
    expect(result).toContain("Members: 5 created");
  });

  it("includes warnings when present", () => {
    const input: PreviewSummaryInput = {
      mode: "dry-run",
      counts: {
        members: { created: 10, updated: 0, skipped: 0, errors: 0 },
      },
      warnings: [
        "Missing tier mapping for 'Gold Member'",
        "3 records had invalid dates",
      ],
    };

    const result = formatPreviewSummary(input);

    expect(result).toContain("Warnings:");
    expect(result).toContain("- Missing tier mapping for 'Gold Member'");
    expect(result).toContain("- 3 records had invalid dates");
  });

  it("omits warnings section when no warnings", () => {
    const input: PreviewSummaryInput = {
      mode: "dry-run",
      counts: {
        members: { created: 10, updated: 0, skipped: 0, errors: 0 },
      },
      warnings: [],
    };

    const result = formatPreviewSummary(input);

    expect(result).not.toContain("Warnings:");
  });

  it("omits duration when not provided", () => {
    const input: PreviewSummaryInput = {
      mode: "dry-run",
      counts: {
        members: { created: 10, updated: 0, skipped: 0, errors: 0 },
      },
    };

    const result = formatPreviewSummary(input);

    expect(result).not.toContain("Duration:");
  });

  it("outputs entities in consistent order", () => {
    const input: PreviewSummaryInput = {
      mode: "dry-run",
      counts: {
        registrations: { created: 1, updated: 0, skipped: 0, errors: 0 },
        members: { created: 2, updated: 0, skipped: 0, errors: 0 },
        events: { created: 3, updated: 0, skipped: 0, errors: 0 },
      },
    };

    const result = formatPreviewSummary(input);
    const membersIndex = result.indexOf("Members:");
    const eventsIndex = result.indexOf("Events:");
    const registrationsIndex = result.indexOf("Registrations:");

    // Should be in order: members, events, registrations
    expect(membersIndex).toBeLessThan(eventsIndex);
    expect(eventsIndex).toBeLessThan(registrationsIndex);
  });

  it("handles custom entity types", () => {
    const input: PreviewSummaryInput = {
      mode: "dry-run",
      counts: {
        members: { created: 5, updated: 0, skipped: 0, errors: 0 },
        payments: { created: 10, updated: 0, skipped: 2, errors: 0 },
      },
    };

    const result = formatPreviewSummary(input);

    expect(result).toContain("Members: 5 created");
    expect(result).toContain("Payments: 10 created, 2 skipped");
  });
});

// =============================================================================
// formatCompactSummary Tests
// =============================================================================

describe("formatCompactSummary", () => {
  it("formats a single-line summary", () => {
    const input: PreviewSummaryInput = {
      mode: "dry-run",
      counts: {
        members: { created: 10, updated: 5, skipped: 2, errors: 1 },
      },
      durationMs: 500,
    };

    const result = formatCompactSummary(input);

    expect(result).toBe(
      "[DRY-RUN] 18 total | 10 created | 5 updated | 2 skipped | 1 errors | 500ms"
    );
  });

  it("includes warning count when present", () => {
    const input: PreviewSummaryInput = {
      mode: "live",
      counts: {
        members: { created: 10, updated: 0, skipped: 0, errors: 0 },
      },
      warnings: ["warning 1", "warning 2", "warning 3"],
    };

    const result = formatCompactSummary(input);

    expect(result).toContain("[LIVE]");
    expect(result).toContain("3 warning(s)");
  });

  it("omits duration when not provided", () => {
    const input: PreviewSummaryInput = {
      mode: "dry-run",
      counts: {
        members: { created: 10, updated: 0, skipped: 0, errors: 0 },
      },
    };

    const result = formatCompactSummary(input);

    expect(result).not.toContain("ms");
  });

  it("sums counts across entities", () => {
    const input: PreviewSummaryInput = {
      mode: "dry-run",
      counts: {
        members: { created: 10, updated: 0, skipped: 0, errors: 0 },
        events: { created: 20, updated: 0, skipped: 0, errors: 0 },
      },
    };

    const result = formatCompactSummary(input);

    expect(result).toContain("30 total");
    expect(result).toContain("30 created");
  });
});

// =============================================================================
// Snapshot Tests
// =============================================================================

describe("formatPreviewSummary snapshots", () => {
  it("matches snapshot for typical dry-run output", () => {
    const input: PreviewSummaryInput = {
      mode: "dry-run",
      counts: {
        members: { created: 150, updated: 25, skipped: 10, errors: 3 },
        events: { created: 45, updated: 0, skipped: 5, errors: 0 },
        registrations: { created: 500, updated: 0, skipped: 100, errors: 5 },
      },
      warnings: [
        "Unknown membership level: 'Legacy Member' (5 occurrences)",
        "Event 'Annual Gala 2024' has past end date",
      ],
      durationMs: 2345,
    };

    const result = formatPreviewSummary(input);

    expect(result).toMatchInlineSnapshot(`
      "============================================================
      PREVIEW SUMMARY (DRY-RUN)
      ============================================================

      Members: 150 created, 25 updated, 10 skipped, 3 errors
      Events: 45 created, 5 skipped
      Registrations: 500 created, 100 skipped, 5 errors

      Total: 843 records | 695 created | 25 updated | 115 skipped | 8 errors
      Duration: 2345ms

      Warnings:
        - Unknown membership level: 'Legacy Member' (5 occurrences)
        - Event 'Annual Gala 2024' has past end date

      ============================================================"
    `);
  });

  it("matches snapshot for clean run with no issues", () => {
    const input: PreviewSummaryInput = {
      mode: "live",
      counts: {
        members: { created: 50, updated: 0, skipped: 0, errors: 0 },
        events: { created: 10, updated: 0, skipped: 0, errors: 0 },
      },
      durationMs: 890,
    };

    const result = formatPreviewSummary(input);

    expect(result).toMatchInlineSnapshot(`
      "============================================================
      PREVIEW SUMMARY (LIVE)
      ============================================================

      Members: 50 created
      Events: 10 created

      Total: 60 records | 60 created | 0 updated | 0 skipped | 0 errors
      Duration: 890ms

      ============================================================"
    `);
  });
});
