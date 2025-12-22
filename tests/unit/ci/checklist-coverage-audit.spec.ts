/**
 * Unit tests for Checklist Coverage Audit Script
 */

import { describe, it, expect } from "vitest";

type EnforcementStatus = "enforced" | "partial" | "manual";

interface ChecklistItem {
  id: string;
  section: string;
  description: string;
  enforcement: EnforcementStatus;
  mustHave: boolean;
  notes: string;
  enforcedBy?: string;
}

interface ChecklistRegistry {
  version: string;
  lastUpdated: string;
  sourceDocument: string;
  items: ChecklistItem[];
}

interface AuditResult {
  counts: {
    enforced: number;
    partial: number;
    manual: number;
    total: number;
  };
  mustHaveItems: {
    item: ChecklistItem;
    pass: boolean;
  }[];
  overallPass: boolean;
}

function auditChecklist(registry: ChecklistRegistry): AuditResult {
  const counts = {
    enforced: 0,
    partial: 0,
    manual: 0,
    total: registry.items.length,
  };

  const mustHaveItems: AuditResult["mustHaveItems"] = [];

  for (const item of registry.items) {
    switch (item.enforcement) {
      case "enforced":
        counts.enforced++;
        break;
      case "partial":
        counts.partial++;
        break;
      case "manual":
        counts.manual++;
        break;
    }

    if (item.mustHave) {
      const pass = item.enforcement === "enforced";
      mustHaveItems.push({ item, pass });
    }
  }

  const overallPass = mustHaveItems.every((m) => m.pass);

  return { counts, mustHaveItems, overallPass };
}

describe("auditChecklist", () => {
  it("should count enforcement statuses correctly", () => {
    const registry: ChecklistRegistry = {
      version: "1.0.0",
      lastUpdated: "2025-12-21",
      sourceDocument: "test.md",
      items: [
        { id: "T-001", section: "Test", description: "Enforced", enforcement: "enforced", mustHave: false, notes: "" },
        { id: "T-002", section: "Test", description: "Partial", enforcement: "partial", mustHave: false, notes: "" },
        { id: "T-003", section: "Test", description: "Manual", enforcement: "manual", mustHave: false, notes: "" },
      ],
    };

    const result = auditChecklist(registry);

    expect(result.counts.enforced).toBe(1);
    expect(result.counts.partial).toBe(1);
    expect(result.counts.manual).toBe(1);
    expect(result.counts.total).toBe(3);
  });

  it("should pass when all must-have items are enforced", () => {
    const registry: ChecklistRegistry = {
      version: "1.0.0",
      lastUpdated: "2025-12-21",
      sourceDocument: "test.md",
      items: [
        { id: "M-001", section: "Test", description: "Must-have enforced", enforcement: "enforced", mustHave: true, notes: "" },
        { id: "O-001", section: "Test", description: "Optional manual", enforcement: "manual", mustHave: false, notes: "" },
      ],
    };

    const result = auditChecklist(registry);

    expect(result.overallPass).toBe(true);
  });

  it("should fail when must-have item is manual", () => {
    const registry: ChecklistRegistry = {
      version: "1.0.0",
      lastUpdated: "2025-12-21",
      sourceDocument: "test.md",
      items: [
        { id: "M-001", section: "Test", description: "Must-have manual", enforcement: "manual", mustHave: true, notes: "" },
      ],
    };

    const result = auditChecklist(registry);

    expect(result.overallPass).toBe(false);
    expect(result.mustHaveItems[0].pass).toBe(false);
  });

  it("should fail when must-have item is partial", () => {
    const registry: ChecklistRegistry = {
      version: "1.0.0",
      lastUpdated: "2025-12-21",
      sourceDocument: "test.md",
      items: [
        { id: "M-001", section: "Test", description: "Must-have partial", enforcement: "partial", mustHave: true, notes: "" },
      ],
    };

    const result = auditChecklist(registry);

    expect(result.overallPass).toBe(false);
  });

  it("should pass when no must-have items exist", () => {
    const registry: ChecklistRegistry = {
      version: "1.0.0",
      lastUpdated: "2025-12-21",
      sourceDocument: "test.md",
      items: [
        { id: "O-001", section: "Test", description: "Optional", enforcement: "manual", mustHave: false, notes: "" },
      ],
    };

    const result = auditChecklist(registry);

    expect(result.overallPass).toBe(true);
    expect(result.mustHaveItems).toHaveLength(0);
  });
});
