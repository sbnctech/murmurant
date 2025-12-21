/**
 * Unit tests for release classification parser
 */
import { describe, it, expect } from "vitest";
import { parseReleaseClassification } from "../../../scripts/ci/check-release-classification";

describe("parseReleaseClassification", () => {
  describe("valid single selection", () => {
    it("detects experimental classification", () => {
      const prBody = `## Release Classification (Required)

Select ONE classification for this PR:

- [x] **experimental** - Early exploration; may be reverted; not for production
- [ ] **candidate** - Ready for review; may ship after validation
- [ ] **stable** - Production-ready; fully tested and documented`;

      const result = parseReleaseClassification(prBody);
      expect(result.valid).toBe(true);
      expect(result.classification).toBe("experimental");
      expect(result.error).toBeNull();
    });

    it("detects candidate classification", () => {
      const prBody = `## Release Classification (Required)

- [ ] **experimental** - Early exploration
- [x] **candidate** - Ready for review
- [ ] **stable** - Production-ready`;

      const result = parseReleaseClassification(prBody);
      expect(result.valid).toBe(true);
      expect(result.classification).toBe("candidate");
    });

    it("detects stable classification", () => {
      const prBody = `## Release Classification (Required)

- [ ] **experimental** - Early exploration
- [ ] **candidate** - Ready for review
- [x] **stable** - Production-ready`;

      const result = parseReleaseClassification(prBody);
      expect(result.valid).toBe(true);
      expect(result.classification).toBe("stable");
    });

    it("handles uppercase X", () => {
      const prBody = "- [X] **experimental** - test";

      const result = parseReleaseClassification(prBody);
      expect(result.valid).toBe(true);
      expect(result.classification).toBe("experimental");
    });

    it("handles no bold markers", () => {
      const prBody = "- [x] experimental - test";

      const result = parseReleaseClassification(prBody);
      expect(result.valid).toBe(true);
      expect(result.classification).toBe("experimental");
    });

    it("handles extra whitespace", () => {
      const prBody = "-  [ x ]  **experimental** - test";

      const result = parseReleaseClassification(prBody);
      expect(result.valid).toBe(true);
      expect(result.classification).toBe("experimental");
    });
  });

  describe("invalid: no selection", () => {
    it("rejects when no checkbox is checked", () => {
      const prBody = `## Release Classification (Required)

- [ ] **experimental** - Early exploration
- [ ] **candidate** - Ready for review
- [ ] **stable** - Production-ready`;

      const result = parseReleaseClassification(prBody);
      expect(result.valid).toBe(false);
      expect(result.classification).toBeNull();
      expect(result.error).toContain("No release classification selected");
      expect(result.selectedCount).toBe(0);
    });

    it("rejects empty PR body", () => {
      const result = parseReleaseClassification("");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("PR body is empty");
    });

    it("rejects whitespace-only PR body", () => {
      const result = parseReleaseClassification("   \n\n   ");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("PR body is empty");
    });

    it("rejects PR body without classification section", () => {
      const prBody = `## Description

This is a PR that does things.

## Related Issues

Fixes #123`;

      const result = parseReleaseClassification(prBody);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("No release classification selected");
    });
  });

  describe("invalid: multiple selections", () => {
    it("rejects when multiple checkboxes are checked", () => {
      const prBody = `## Release Classification (Required)

- [x] **experimental** - Early exploration
- [x] **candidate** - Ready for review
- [ ] **stable** - Production-ready`;

      const result = parseReleaseClassification(prBody);
      expect(result.valid).toBe(false);
      expect(result.classification).toBeNull();
      expect(result.error).toContain("Multiple classifications selected");
      expect(result.error).toContain("experimental");
      expect(result.error).toContain("candidate");
      expect(result.selectedCount).toBe(2);
    });

    it("rejects when all checkboxes are checked", () => {
      const prBody = `- [x] **experimental**
- [x] **candidate**
- [x] **stable**`;

      const result = parseReleaseClassification(prBody);
      expect(result.valid).toBe(false);
      expect(result.selectedCount).toBe(3);
    });
  });

  describe("edge cases", () => {
    it("ignores checked checkboxes that are not classifications", () => {
      const prBody = `## Release Classification (Required)

- [x] **experimental** - Early exploration
- [ ] **candidate** - Ready for review
- [ ] **stable** - Production-ready

## Change checklist

- [x] Scope is small and focused
- [x] Lint passes
- [x] Typecheck passes`;

      const result = parseReleaseClassification(prBody);
      expect(result.valid).toBe(true);
      expect(result.classification).toBe("experimental");
      expect(result.selectedCount).toBe(1);
    });

    it("handles classification appearing in prose without checkbox", () => {
      const prBody = `## Release Classification (Required)

- [ ] **experimental** - Early exploration
- [x] **candidate** - Ready for review
- [ ] **stable** - Production-ready

## Description

This is an experimental feature that is now a candidate for release.`;

      const result = parseReleaseClassification(prBody);
      expect(result.valid).toBe(true);
      expect(result.classification).toBe("candidate");
    });
  });
});
