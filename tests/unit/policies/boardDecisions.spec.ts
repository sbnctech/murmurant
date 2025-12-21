import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { loadBoardDecisionsFile } from "@/lib/policies/boardDecisions";

describe("boardDecisions loader", () => {
  it("loads YAML and produces a runtime with expected keys", () => {
    const { raw, runtime } = loadBoardDecisionsFile();

    expect(raw).toBeTruthy();
    expect(runtime).toBeTruthy();

    expect(runtime).toHaveProperty("bylawsVersion");
    expect(runtime).toHaveProperty("guestAccessMode");
    expect(runtime).toHaveProperty("membershipTermMode");
    expect(runtime).toHaveProperty("registrationEligibilityMode");
    expect(runtime).toHaveProperty("policyVisibility");

    expect(typeof runtime.policyVisibility).toBe("object");
  });

  it("reads from docs/policies/sbnc/BOARD_DECISIONS.yaml", () => {
    const p = "docs/policies/sbnc/BOARD_DECISIONS.yaml";
    const text = fs.readFileSync(p, "utf8");
    expect(text.length).toBeGreaterThan(10);
    expect(text).toMatch(/decisions:/);
  });
});
