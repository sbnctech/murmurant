/**
 * Unit tests for rollback validators
 */

import { describe, it, expect } from "vitest";
import {
  validateRollbackRequest,
  validateRollbackListQuery,
} from "@/lib/governance/rollback/validators";

describe("Rollback Validators", () => {
  describe("validateRollbackRequest", () => {
    it("should accept valid rollback request", () => {
      const result = validateRollbackRequest({
        reason: "Accidentally published event before it was ready",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reason).toBe(
          "Accidentally published event before it was ready"
        );
      }
    });

    it("should accept request with confirmation token", () => {
      const result = validateRollbackRequest({
        reason: "Need to rollback capacity change",
        confirmationToken: "token_12345",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.confirmationToken).toBe("token_12345");
      }
    });

    it("should accept request with dryRun flag", () => {
      const result = validateRollbackRequest({
        reason: "Testing rollback preview",
        dryRun: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dryRun).toBe(true);
      }
    });

    it("should reject request with too short reason", () => {
      const result = validateRollbackRequest({
        reason: "Oops",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 10");
      }
    });

    it("should reject request with too long reason", () => {
      const result = validateRollbackRequest({
        reason: "x".repeat(501),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("not exceed 500");
      }
    });

    it("should reject request without reason", () => {
      const result = validateRollbackRequest({});

      expect(result.success).toBe(false);
    });

    it("should reject request with empty reason", () => {
      const result = validateRollbackRequest({
        reason: "",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("validateRollbackListQuery", () => {
    it("should accept empty query (use defaults)", () => {
      const result = validateRollbackListQuery({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20); // default
      }
    });

    it("should accept valid limit", () => {
      const result = validateRollbackListQuery({
        limit: "50",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it("should accept valid resourceType", () => {
      const result = validateRollbackListQuery({
        resourceType: "Event",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.resourceType).toBe("Event");
      }
    });

    it("should accept valid since datetime", () => {
      const result = validateRollbackListQuery({
        since: "2025-01-01T00:00:00Z",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.since).toBeInstanceOf(Date);
      }
    });

    it("should reject limit too high", () => {
      const result = validateRollbackListQuery({
        limit: "101",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("between 1 and 100");
      }
    });

    it("should reject limit too low", () => {
      const result = validateRollbackListQuery({
        limit: "0",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("between 1 and 100");
      }
    });

    it("should reject invalid datetime format", () => {
      const result = validateRollbackListQuery({
        since: "invalid-date",
      });

      expect(result.success).toBe(false);
    });

    it("should handle all parameters together", () => {
      const result = validateRollbackListQuery({
        limit: "10",
        resourceType: "Member",
        since: "2025-12-01T00:00:00Z",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
        expect(result.data.resourceType).toBe("Member");
        expect(result.data.since).toBeInstanceOf(Date);
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle reason with exactly 10 characters", () => {
      const result = validateRollbackRequest({
        reason: "1234567890",
      });

      expect(result.success).toBe(true);
    });

    it("should handle reason with exactly 500 characters", () => {
      const result = validateRollbackRequest({
        reason: "x".repeat(500),
      });

      expect(result.success).toBe(true);
    });

    it("should handle limit as string number", () => {
      const result = validateRollbackListQuery({
        limit: "1",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(1);
      }
    });
  });
});
