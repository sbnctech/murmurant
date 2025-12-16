// Copyright (c) Santa Barbara Newcomers Club
// Unit tests for audit logging system
// Charter P7: Observability is a product feature
// Charter N5: Never let automation mutate data without audit logs

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing audit module
vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      create: vi.fn().mockResolvedValue({
        id: "test-audit-id",
        action: "CREATE",
        resourceType: "TestResource",
        resourceId: "test-id",
        memberId: "test-member-id",
        metadata: {},
        createdAt: new Date(),
      }),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/auth";

// Import after mock is set up
const { createAuditEntry, auditMutation, auditCreate, auditUpdate, auditDelete } = await import("@/lib/audit");

describe("Audit Logging", () => {
  const mockAuthContext: AuthContext = {
    memberId: "test-member-id",
    email: "test@example.com",
    globalRole: "admin",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createAuditEntry", () => {
    it("creates an audit log entry with required fields", async () => {
      await createAuditEntry({
        action: "CREATE",
        resourceType: "TestResource",
        resourceId: "test-id",
        actor: mockAuthContext,
      });

      expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "CREATE",
            resourceType: "TestResource",
            resourceId: "test-id",
            memberId: "test-member-id",
          }),
        })
      );
    });

    it("includes metadata when provided", async () => {
      await createAuditEntry({
        action: "UPDATE",
        resourceType: "TestResource",
        resourceId: "test-id",
        actor: mockAuthContext,
        metadata: { key: "value" },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: expect.objectContaining({ key: "value" }),
          }),
        })
      );
    });

    it("handles errors gracefully without throwing (deny-path-safe)", async () => {
      // Make prisma.auditLog.create throw an error
      vi.mocked(prisma.auditLog.create).mockRejectedValueOnce(new Error("DB error"));

      // This should not throw - deny-path-safe behavior
      await expect(
        createAuditEntry({
          action: "CREATE",
          resourceType: "TestResource",
          resourceId: "test-id",
          actor: mockAuthContext,
        })
      ).resolves.toBeUndefined();
    });
  });

  describe("auditMutation", () => {
    it("creates audit entry with capability metadata", async () => {
      // Create a mock NextRequest
      const mockReq = {
        headers: new Headers({
          "x-forwarded-for": "127.0.0.1",
          "user-agent": "test-agent",
        }),
      } as unknown as Request;

      await auditMutation(mockReq as never, mockAuthContext, {
        action: "CREATE",
        capability: "users:manage",
        objectType: "TransitionPlan",
        objectId: "plan-123",
        metadata: { name: "Test Plan" },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "CREATE",
            resourceType: "TransitionPlan",
            resourceId: "plan-123",
            memberId: "test-member-id",
            metadata: expect.objectContaining({
              name: "Test Plan",
              capability: "users:manage",
              actorRole: "admin",
            }),
          }),
        })
      );
    });
  });

  describe("Convenience functions", () => {
    it("auditCreate logs CREATE action", async () => {
      await auditCreate("Meeting", "meeting-123", mockAuthContext);

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "CREATE",
            resourceType: "Meeting",
            resourceId: "meeting-123",
          }),
        })
      );
    });

    it("auditUpdate logs UPDATE action", async () => {
      await auditUpdate("Meeting", "meeting-123", mockAuthContext);

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "UPDATE",
            resourceType: "Meeting",
            resourceId: "meeting-123",
          }),
        })
      );
    });

    it("auditDelete logs DELETE action", async () => {
      await auditDelete("Meeting", "meeting-123", mockAuthContext);

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "DELETE",
            resourceType: "Meeting",
            resourceId: "meeting-123",
          }),
        })
      );
    });
  });

  describe("AuditMutationParams type", () => {
    it("accepts all valid audit actions", async () => {
      const actions = ["CREATE", "UPDATE", "DELETE", "PUBLISH", "UNPUBLISH", "SEND", "ARCHIVE"] as const;
      const mockReq = {
        headers: new Headers(),
      } as unknown as Request;

      for (const action of actions) {
        vi.clearAllMocks();
        await auditMutation(mockReq as never, mockAuthContext, {
          action,
          capability: "test:cap",
          objectType: "Test",
          objectId: "test-id",
        });

        expect(prisma.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ action }),
          })
        );
      }
    });
  });
});
