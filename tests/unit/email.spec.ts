/**
 * Unit tests for email module
 *
 * Tests the mock email sender functionality used in development.
 * The module writes emails to a JSON log file instead of sending.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Track mock state manually for isolation
let mockReadFileResult = "[]";

// Use vi.hoisted to define mocks that can be referenced in vi.mock factory
const { mockMkdir, mockAccess, mockWriteFile, mockReadFile } = vi.hoisted(() => ({
  mockMkdir: vi.fn(),
  mockAccess: vi.fn(),
  mockWriteFile: vi.fn(),
  mockReadFile: vi.fn(),
}));

// Mock fs module before importing the email module
vi.mock("node:fs/promises", () => {
  // Create a mocked version that uses our mock functions
  const mocked = {
    mkdir: mockMkdir,
    access: mockAccess,
    writeFile: mockWriteFile,
    readFile: mockReadFile,
  };
  return {
    ...mocked,
    default: mocked, // Default export must use mocked functions
  };
});

import {
  sendEmail,
  listMockEmails,
  type EmailPayload,
  type MockEmailEntry,
} from "@/lib/email";

describe("Email Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to empty array for each test
    mockReadFileResult = "[]";
    // Reset mock implementations
    mockMkdir.mockResolvedValue(undefined);
    mockAccess.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    mockReadFile.mockImplementation(() => Promise.resolve(mockReadFileResult));
  });

  describe("sendEmail", () => {
    it("creates tmp directory if needed", async () => {
      const payload: EmailPayload = {
        to: "user@example.com",
        subject: "Test Subject",
        text: "Test body",
      };

      await sendEmail(payload);

      expect(mockMkdir).toHaveBeenCalledWith(
        expect.stringContaining("tmp"),
        { recursive: true }
      );
    });

    it("returns a message ID starting with mock-", async () => {
      const payload: EmailPayload = {
        to: "user@example.com",
        subject: "Test Subject",
        text: "Test body",
      };

      const result = await sendEmail(payload);

      expect(result.messageId).toMatch(/^mock-/);
    });

    it("writes email entry to log file", async () => {
      const payload: EmailPayload = {
        to: "recipient@example.com",
        subject: "Important Message",
        text: "Plain text content",
        html: "<p>HTML content</p>",
      };

      await sendEmail(payload);

      expect(mockWriteFile).toHaveBeenCalled();

      // Get the last writeFile call which has the actual email entry
      const writeCalls = mockWriteFile.mock.calls;
      const lastCall = writeCalls[writeCalls.length - 1];
      const writtenPath = lastCall[0] as string;
      const writtenContent = JSON.parse(lastCall[1] as string);

      expect(writtenPath).toContain("mock-email-log.json");
      expect(writtenContent).toHaveLength(1);
      expect(writtenContent[0].to).toBe("recipient@example.com");
      expect(writtenContent[0].subject).toBe("Important Message");
      expect(writtenContent[0].text).toBe("Plain text content");
      expect(writtenContent[0].html).toBe("<p>HTML content</p>");
    });

    it("appends to existing log entries", async () => {
      const existingEntries: MockEmailEntry[] = [
        {
          id: "mock-existing",
          to: "old@example.com",
          subject: "Old Email",
          createdAt: "2024-01-01T00:00:00Z",
        },
      ];
      mockReadFileResult = JSON.stringify(existingEntries);

      const payload: EmailPayload = {
        to: "new@example.com",
        subject: "New Email",
      };

      await sendEmail(payload);

      const writeCalls = mockWriteFile.mock.calls;
      const lastCall = writeCalls[writeCalls.length - 1];
      const writtenContent = JSON.parse(lastCall[1] as string);

      expect(writtenContent).toHaveLength(2);
      expect(writtenContent[0].to).toBe("old@example.com");
      expect(writtenContent[1].to).toBe("new@example.com");
    });

    it("handles corrupted log file gracefully", async () => {
      mockReadFileResult = "not valid json";

      const payload: EmailPayload = {
        to: "user@example.com",
        subject: "Test",
      };

      // Should not throw
      const result = await sendEmail(payload);
      expect(result.messageId).toMatch(/^mock-/);
    });

    it("includes createdAt timestamp in ISO format", async () => {
      const payload: EmailPayload = {
        to: "user@example.com",
        subject: "Test",
      };

      await sendEmail(payload);

      const writeCalls = mockWriteFile.mock.calls;
      const lastCall = writeCalls[writeCalls.length - 1];
      const writtenContent = JSON.parse(lastCall[1] as string);

      expect(writtenContent[0].createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      );
    });

    it("generates unique IDs for each email", async () => {
      const payload: EmailPayload = {
        to: "user@example.com",
        subject: "Test",
      };

      const result1 = await sendEmail(payload);
      const result2 = await sendEmail(payload);

      expect(result1.messageId).not.toBe(result2.messageId);
    });
  });

  describe("listMockEmails", () => {
    it("returns empty array when log file is empty", async () => {
      mockReadFileResult = "[]";

      const emails = await listMockEmails();

      expect(emails).toEqual([]);
    });

    it("returns emails in reverse chronological order", async () => {
      const entries: MockEmailEntry[] = [
        { id: "1", to: "a@test.com", subject: "First", createdAt: "2024-01-01" },
        { id: "2", to: "b@test.com", subject: "Second", createdAt: "2024-01-02" },
        { id: "3", to: "c@test.com", subject: "Third", createdAt: "2024-01-03" },
      ];
      mockReadFileResult = JSON.stringify(entries);

      const emails = await listMockEmails();

      expect(emails[0].id).toBe("3"); // Most recent first
      expect(emails[1].id).toBe("2");
      expect(emails[2].id).toBe("1");
    });

    it("respects limit parameter", async () => {
      const entries: MockEmailEntry[] = Array.from({ length: 50 }, (_, i) => ({
        id: `email-${i}`,
        to: `user${i}@test.com`,
        subject: `Subject ${i}`,
        createdAt: `2024-01-${String(i + 1).padStart(2, "0")}`,
      }));
      mockReadFileResult = JSON.stringify(entries);

      const emails = await listMockEmails(10);

      expect(emails).toHaveLength(10);
    });

    it("uses default limit of 20", async () => {
      const entries: MockEmailEntry[] = Array.from({ length: 50 }, (_, i) => ({
        id: `email-${i}`,
        to: `user${i}@test.com`,
        subject: `Subject ${i}`,
        createdAt: `2024-01-${String(i + 1).padStart(2, "0")}`,
      }));
      mockReadFileResult = JSON.stringify(entries);

      const emails = await listMockEmails();

      expect(emails).toHaveLength(20);
    });

    it("handles read errors gracefully", async () => {
      mockReadFile.mockRejectedValueOnce(new Error("File not found"));

      const emails = await listMockEmails();

      expect(emails).toEqual([]);
    });

    it("handles corrupted JSON gracefully", async () => {
      mockReadFileResult = "invalid json {{{";

      const emails = await listMockEmails();

      expect(emails).toEqual([]);
    });

    it("returns all entries when limit exceeds total", async () => {
      const entries: MockEmailEntry[] = [
        { id: "1", to: "a@test.com", subject: "First", createdAt: "2024-01-01" },
        { id: "2", to: "b@test.com", subject: "Second", createdAt: "2024-01-02" },
      ];
      mockReadFileResult = JSON.stringify(entries);

      const emails = await listMockEmails(100);

      expect(emails).toHaveLength(2);
    });
  });

  describe("EmailPayload type", () => {
    it("allows email with only required fields", async () => {
      const payload: EmailPayload = {
        to: "user@example.com",
        subject: "Minimal Email",
      };

      const result = await sendEmail(payload);
      expect(result.messageId).toBeDefined();
    });

    it("allows email with text content", async () => {
      const payload: EmailPayload = {
        to: "user@example.com",
        subject: "Text Email",
        text: "Plain text body",
      };

      const result = await sendEmail(payload);
      expect(result.messageId).toBeDefined();
    });

    it("allows email with HTML content", async () => {
      const payload: EmailPayload = {
        to: "user@example.com",
        subject: "HTML Email",
        html: "<h1>Hello</h1><p>World</p>",
      };

      const result = await sendEmail(payload);
      expect(result.messageId).toBeDefined();
    });

    it("allows email with both text and HTML content", async () => {
      const payload: EmailPayload = {
        to: "user@example.com",
        subject: "Multi-part Email",
        text: "Plain text fallback",
        html: "<p>Rich HTML version</p>",
      };

      const result = await sendEmail(payload);
      expect(result.messageId).toBeDefined();
    });
  });
});
