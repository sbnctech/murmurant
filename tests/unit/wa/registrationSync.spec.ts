// Copyright © 2025 Murmurant, Inc. All rights reserved.
/**
 * Tests for Registration Write-Through (F4).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  createRegistration,
  cancelRegistration,
  queuePendingWrite,
  getPendingWrites,
  getPendingWritesByStatus,
  updatePendingWrite,
  removePendingWrite,
  clearPendingWrites,
  processPendingWrites,
  startPendingWriteProcessor,
  stopPendingWriteProcessor,
  getPendingWriteStatus,
} from "@/lib/wa/registrationSync";
import type { WriteError } from "@/lib/wa/registrationSync";
import type { WaEventRegistration } from "@/lib/wa/types";

// Mock the WA client
vi.mock("@/lib/wa/client", () => ({
  getWaClient: vi.fn(),
}));

// Mock audit logging
vi.mock("@/lib/wa/audit", () => ({
  auditWaWrite: vi.fn(),
  auditWaError: vi.fn(),
}));

// Mock member sync
vi.mock("@/lib/wa/memberSync", () => ({
  invalidateMember: vi.fn(),
}));

import { getWaClient } from "@/lib/wa/client";
import { invalidateMember } from "@/lib/wa/memberSync";

// Test fixtures
const mockRegistration: WaEventRegistration = {
  Id: 11111,
  Url: "https://api.wildapricot.org/...",
  Event: { Id: 12345, Name: "Test Event" },
  Contact: { Id: 67890, Name: "John Doe" },
  RegistrationTypeId: 1,
  RegistrationDate: new Date().toISOString(),
  IsCheckedIn: false,
  IsPaid: false,
  RegistrationFee: 0,
  PaidSum: 0,
  OnWaitlist: false,
  Memo: null,
};

describe("Registration Write-Through", () => {
  beforeEach(() => {
    clearPendingWrites();
    vi.clearAllMocks();
    // Default: WA not configured
    vi.mocked(getWaClient).mockReturnValue(null);
  });

  afterEach(() => {
    stopPendingWriteProcessor();
  });

  describe("createRegistration", () => {
    it("should return error when WA not configured", async () => {
      const result = await createRegistration({
        eventId: 12345,
        contactId: 67890,
        registrationTypeId: 1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("NETWORK");
        expect(result.queued).toBe(false);
      }
    });

    it("should create registration successfully", async () => {
      const mockClient = {
        createRegistration: vi.fn().mockResolvedValue(mockRegistration),
      };
      vi.mocked(getWaClient).mockReturnValue(mockClient as never);

      const result = await createRegistration({
        eventId: 12345,
        contactId: 67890,
        registrationTypeId: 1,
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.Id).toBe(11111);
        expect(result.source).toBe("wa_confirmed");
      }

      expect(mockClient.createRegistration).toHaveBeenCalledWith(
        {
          Event: { Id: 12345 },
          Contact: { Id: 67890 },
          RegistrationTypeId: 1,
          Memo: undefined,
        },
        "user-123"
      );

      // Should invalidate member cache
      expect(invalidateMember).toHaveBeenCalledWith(67890);
    });

    it("should handle validation errors without retry", async () => {
      const mockClient = {
        createRegistration: vi.fn().mockRejectedValue(new Error("400 Bad Request")),
      };
      vi.mocked(getWaClient).mockReturnValue(mockClient as never);

      const result = await createRegistration({
        eventId: 12345,
        contactId: 67890,
        registrationTypeId: 1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("VALIDATION");
        expect(result.error.retryable).toBe(false);
        expect(result.queued).toBe(false);
      }

      // Should only be called once (no retry for validation errors)
      expect(mockClient.createRegistration).toHaveBeenCalledTimes(1);
    });

    it("should retry on server errors and queue on failure", async () => {
      const mockClient = {
        createRegistration: vi.fn().mockRejectedValue(new Error("500 Internal Server Error")),
      };
      vi.mocked(getWaClient).mockReturnValue(mockClient as never);

      const result = await createRegistration({
        eventId: 12345,
        contactId: 67890,
        registrationTypeId: 1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("QUEUED");
        expect(result.queued).toBe(true);
      }

      // Should retry (1 initial + 2 retries = 3 calls)
      expect(mockClient.createRegistration).toHaveBeenCalledTimes(3);

      // Should be queued
      const pending = getPendingWrites();
      expect(pending.length).toBe(1);
      expect(pending[0].operation).toBe("CREATE");
    });

    it("should succeed after retry", async () => {
      let callCount = 0;
      const mockClient = {
        createRegistration: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount < 2) {
            throw new Error("500 Temporary Error");
          }
          return Promise.resolve(mockRegistration);
        }),
      };
      vi.mocked(getWaClient).mockReturnValue(mockClient as never);

      const result = await createRegistration({
        eventId: 12345,
        contactId: 67890,
        registrationTypeId: 1,
      });

      expect(result.success).toBe(true);
      expect(mockClient.createRegistration).toHaveBeenCalledTimes(2);
    });
  });

  describe("cancelRegistration", () => {
    it("should cancel registration successfully", async () => {
      const mockClient = {
        cancelRegistration: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(getWaClient).mockReturnValue(mockClient as never);

      const result = await cancelRegistration({
        registrationId: 11111,
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      expect(mockClient.cancelRegistration).toHaveBeenCalledWith(11111, "user-123");
    });

    it("should handle not found errors", async () => {
      const mockClient = {
        cancelRegistration: vi.fn().mockRejectedValue(new Error("404 Not Found")),
      };
      vi.mocked(getWaClient).mockReturnValue(mockClient as never);

      const result = await cancelRegistration({
        registrationId: 99999,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("NOT_FOUND");
        expect(result.queued).toBe(false);
      }
    });

    it("should queue on network errors", async () => {
      const mockClient = {
        cancelRegistration: vi.fn().mockRejectedValue(new Error("ETIMEDOUT")),
      };
      vi.mocked(getWaClient).mockReturnValue(mockClient as never);

      const result = await cancelRegistration({
        registrationId: 11111,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.queued).toBe(true);
      }

      const pending = getPendingWrites();
      expect(pending.length).toBe(1);
      expect(pending[0].operation).toBe("DELETE");
    });
  });
});

describe("Pending Write Queue", () => {
  beforeEach(() => {
    clearPendingWrites();
  });

  it("should queue pending writes", () => {
    const error: WriteError = {
      type: "SERVER_ERROR",
      message: "500 error",
      userMessage: "Server error",
      retryable: true,
    };

    const pending = queuePendingWrite(
      "CREATE",
      {
        Event: { Id: 12345 },
        Contact: { Id: 67890 },
        RegistrationTypeId: 1,
      },
      error,
      "user-123"
    );

    expect(pending.id).toBeDefined();
    expect(pending.operation).toBe("CREATE");
    expect(pending.status).toBe("PENDING");
    expect(pending.attempts).toBe(1);
  });

  it("should filter by status", () => {
    const error: WriteError = {
      type: "SERVER_ERROR",
      message: "error",
      userMessage: "Error",
      retryable: true,
    };

    queuePendingWrite("CREATE", { Event: { Id: 1 }, Contact: { Id: 1 }, RegistrationTypeId: 1 }, error);
    const pending2 = queuePendingWrite("CREATE", { Event: { Id: 2 }, Contact: { Id: 2 }, RegistrationTypeId: 1 }, error);

    updatePendingWrite(pending2.id, { status: "RETRYING" });

    expect(getPendingWritesByStatus("PENDING").length).toBe(1);
    expect(getPendingWritesByStatus("RETRYING").length).toBe(1);
  });

  it("should update pending write status", () => {
    const error: WriteError = {
      type: "SERVER_ERROR",
      message: "error",
      userMessage: "Error",
      retryable: true,
    };

    const pending = queuePendingWrite(
      "CREATE",
      { Event: { Id: 1 }, Contact: { Id: 1 }, RegistrationTypeId: 1 },
      error
    );

    updatePendingWrite(pending.id, {
      status: "SYNCED",
      syncedAt: new Date(),
    });

    const updated = getPendingWrites().find((p) => p.id === pending.id);
    expect(updated?.status).toBe("SYNCED");
    expect(updated?.syncedAt).toBeDefined();
  });

  it("should remove pending writes", () => {
    const error: WriteError = {
      type: "SERVER_ERROR",
      message: "error",
      userMessage: "Error",
      retryable: true,
    };

    const pending = queuePendingWrite(
      "CREATE",
      { Event: { Id: 1 }, Contact: { Id: 1 }, RegistrationTypeId: 1 },
      error
    );

    expect(getPendingWrites().length).toBe(1);

    removePendingWrite(pending.id);

    expect(getPendingWrites().length).toBe(0);
  });
});

describe("Pending Write Processor", () => {
  beforeEach(() => {
    clearPendingWrites();
    vi.clearAllMocks();
    stopPendingWriteProcessor();
  });

  afterEach(() => {
    stopPendingWriteProcessor();
  });

  it("should process pending writes successfully", async () => {
    const mockClient = {
      createRegistration: vi.fn().mockResolvedValue(mockRegistration),
    };
    vi.mocked(getWaClient).mockReturnValue(mockClient as never);

    // Queue a pending write
    const error: WriteError = {
      type: "SERVER_ERROR",
      message: "error",
      userMessage: "Error",
      retryable: true,
    };
    queuePendingWrite(
      "CREATE",
      { Event: { Id: 12345 }, Contact: { Id: 67890 }, RegistrationTypeId: 1 },
      error,
      "user-123"
    );

    expect(getPendingWritesByStatus("PENDING").length).toBe(1);

    // Process
    const result = await processPendingWrites();

    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);

    // Queue should be empty
    expect(getPendingWrites().length).toBe(0);
  });

  it("should handle processing failures", async () => {
    const mockClient = {
      createRegistration: vi.fn().mockRejectedValue(new Error("Still failing")),
    };
    vi.mocked(getWaClient).mockReturnValue(mockClient as never);

    const error: WriteError = {
      type: "SERVER_ERROR",
      message: "error",
      userMessage: "Error",
      retryable: true,
    };
    queuePendingWrite(
      "CREATE",
      { Event: { Id: 12345 }, Contact: { Id: 67890 }, RegistrationTypeId: 1 },
      error
    );

    const result = await processPendingWrites();

    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(0);

    // Should still be in queue with incremented attempts
    const pending = getPendingWrites();
    expect(pending.length).toBe(1);
    expect(pending[0].attempts).toBe(2);
  });

  it("should mark as failed after max attempts", async () => {
    const mockClient = {
      createRegistration: vi.fn().mockRejectedValue(new Error("Persistent failure")),
    };
    vi.mocked(getWaClient).mockReturnValue(mockClient as never);

    const error: WriteError = {
      type: "SERVER_ERROR",
      message: "error",
      userMessage: "Error",
      retryable: true,
    };
    const pending = queuePendingWrite(
      "CREATE",
      { Event: { Id: 12345 }, Contact: { Id: 67890 }, RegistrationTypeId: 1 },
      error
    );

    // Simulate many attempts
    updatePendingWrite(pending.id, { attempts: 10 });

    const result = await processPendingWrites();

    expect(result.failed).toBe(1);
    expect(getPendingWritesByStatus("FAILED").length).toBe(1);
  });

  it("should report queue status", () => {
    const error: WriteError = {
      type: "SERVER_ERROR",
      message: "error",
      userMessage: "Error",
      retryable: true,
    };
    queuePendingWrite(
      "CREATE",
      { Event: { Id: 1 }, Contact: { Id: 1 }, RegistrationTypeId: 1 },
      error
    );
    queuePendingWrite(
      "CREATE",
      { Event: { Id: 2 }, Contact: { Id: 2 }, RegistrationTypeId: 1 },
      error
    );

    const status = getPendingWriteStatus();

    expect(status.queueDepth).toBe(2);
    expect(status.oldestPendingAge).toBeGreaterThanOrEqual(0);
    expect(status.isProcessing).toBe(false);
  });
});

describe("Error Classification", () => {
  beforeEach(() => {
    clearPendingWrites();
    vi.clearAllMocks();
  });

  it("should classify 400 as VALIDATION", async () => {
    const mockClient = {
      createRegistration: vi.fn().mockRejectedValue(new Error("400 Bad Request: Invalid data")),
    };
    vi.mocked(getWaClient).mockReturnValue(mockClient as never);

    const result = await createRegistration({
      eventId: 12345,
      contactId: 67890,
      registrationTypeId: 1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("VALIDATION");
      expect(result.error.retryable).toBe(false);
    }
  });

  it("should classify 401 as UNAUTHORIZED", async () => {
    const mockClient = {
      createRegistration: vi.fn().mockRejectedValue(new Error("401 Unauthorized")),
    };
    vi.mocked(getWaClient).mockReturnValue(mockClient as never);

    const result = await createRegistration({
      eventId: 12345,
      contactId: 67890,
      registrationTypeId: 1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("UNAUTHORIZED");
    }
  });

  it("should classify 409 as CONFLICT", async () => {
    const mockClient = {
      createRegistration: vi.fn().mockRejectedValue(new Error("409 Conflict")),
    };
    vi.mocked(getWaClient).mockReturnValue(mockClient as never);

    const result = await createRegistration({
      eventId: 12345,
      contactId: 67890,
      registrationTypeId: 1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("CONFLICT");
      expect(result.error.userMessage).toContain("modified");
    }
  });

  it("should classify 429 as RATE_LIMIT", async () => {
    const mockClient = {
      createRegistration: vi.fn().mockRejectedValue(new Error("429 Too Many Requests")),
    };
    vi.mocked(getWaClient).mockReturnValue(mockClient as never);

    const result = await createRegistration({
      eventId: 12345,
      contactId: 67890,
      registrationTypeId: 1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("QUEUED"); // Gets queued because retryable
      expect(result.queued).toBe(true);
    }
  });

  it("should classify network errors as NETWORK", async () => {
    const mockClient = {
      createRegistration: vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    };
    vi.mocked(getWaClient).mockReturnValue(mockClient as never);

    const result = await createRegistration({
      eventId: 12345,
      contactId: 67890,
      registrationTypeId: 1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.queued).toBe(true);
    }
  });
});
