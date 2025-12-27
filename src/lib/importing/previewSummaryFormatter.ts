/**
 * Preview Summary Formatter
 *
 * Pure utility for formatting dry-run preview summaries consistently.
 * No side effects, no external dependencies.
 */

export interface EntityCounts {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}

export interface PreviewSummaryCounts {
  members?: EntityCounts;
  events?: EntityCounts;
  registrations?: EntityCounts;
  [key: string]: EntityCounts | undefined;
}

export interface PreviewSummaryInput {
  mode: "dry-run" | "live";
  counts: PreviewSummaryCounts;
  warnings?: string[];
  durationMs?: number;
}

/**
 * Formats a single entity's counts into a summary line.
 */
export function formatEntityLine(
  entityName: string,
  counts: EntityCounts
): string {
  const parts: string[] = [];

  if (counts.created > 0) {
    parts.push(`${counts.created} created`);
  }
  if (counts.updated > 0) {
    parts.push(`${counts.updated} updated`);
  }
  if (counts.skipped > 0) {
    parts.push(`${counts.skipped} skipped`);
  }
  if (counts.errors > 0) {
    parts.push(`${counts.errors} errors`);
  }

  if (parts.length === 0) {
    return `${entityName}: no changes`;
  }

  return `${entityName}: ${parts.join(", ")}`;
}

/**
 * Calculates totals across all entities.
 */
export function calculateTotals(counts: PreviewSummaryCounts): EntityCounts {
  const totals: EntityCounts = { created: 0, updated: 0, skipped: 0, errors: 0 };

  for (const entity of Object.values(counts)) {
    if (entity) {
      totals.created += entity.created;
      totals.updated += entity.updated;
      totals.skipped += entity.skipped;
      totals.errors += entity.errors;
    }
  }

  return totals;
}

/**
 * Formats a complete preview summary as a human-readable string.
 *
 * @param input - The preview summary data
 * @returns A formatted, multi-line summary string
 */
export function formatPreviewSummary(input: PreviewSummaryInput): string {
  const lines: string[] = [];
  const divider = "=".repeat(60);

  // Header
  lines.push(divider);
  lines.push(`PREVIEW SUMMARY (${input.mode.toUpperCase()})`);
  lines.push(divider);
  lines.push("");

  // Entity counts
  const entityOrder = ["members", "events", "registrations"];
  const seenEntities = new Set<string>();

  // First, output known entities in order
  for (const entityName of entityOrder) {
    const entityCounts = input.counts[entityName];
    if (entityCounts) {
      lines.push(formatEntityLine(capitalize(entityName), entityCounts));
      seenEntities.add(entityName);
    }
  }

  // Then, output any additional entities
  for (const [entityName, entityCounts] of Object.entries(input.counts)) {
    if (!seenEntities.has(entityName) && entityCounts) {
      lines.push(formatEntityLine(capitalize(entityName), entityCounts));
    }
  }

  lines.push("");

  // Totals
  const totals = calculateTotals(input.counts);
  const totalCount =
    totals.created + totals.updated + totals.skipped + totals.errors;

  lines.push(
    `Total: ${totalCount} records | ` +
      `${totals.created} created | ` +
      `${totals.updated} updated | ` +
      `${totals.skipped} skipped | ` +
      `${totals.errors} errors`
  );

  // Duration
  if (input.durationMs !== undefined) {
    lines.push(`Duration: ${input.durationMs}ms`);
  }

  lines.push("");

  // Warnings
  if (input.warnings && input.warnings.length > 0) {
    lines.push("Warnings:");
    for (const warning of input.warnings) {
      lines.push(`  - ${warning}`);
    }
    lines.push("");
  }

  lines.push(divider);

  return lines.join("\n");
}

/**
 * Formats a compact single-line summary for log output.
 */
export function formatCompactSummary(input: PreviewSummaryInput): string {
  const totals = calculateTotals(input.counts);
  const totalCount =
    totals.created + totals.updated + totals.skipped + totals.errors;

  let summary =
    `[${input.mode.toUpperCase()}] ` +
    `${totalCount} total | ` +
    `${totals.created} created | ` +
    `${totals.updated} updated | ` +
    `${totals.skipped} skipped | ` +
    `${totals.errors} errors`;

  if (input.durationMs !== undefined) {
    summary += ` | ${input.durationMs}ms`;
  }

  if (input.warnings && input.warnings.length > 0) {
    summary += ` | ${input.warnings.length} warning(s)`;
  }

  return summary;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
