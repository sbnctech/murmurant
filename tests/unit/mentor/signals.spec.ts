/**
 * Unit tests for mentor signal system
 *
 * Charter P7: Observability is a product feature
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
const mockPrisma = {
  mentorAssignment: {
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  mentorSignal: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    groupBy: vi.fn(),
  },
  $queryRaw: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// Import after mock is set up
const {
  assignMentor,
  endMentorAssignment,
  recordFirstContact,
  getMentorDashboardMetrics,
  getRecentSignals,
  getAssignmentsNeedingAttention,
} = await import("@/lib/mentor/signals");

describe("Mentor Signal System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("assignMentor", () => {
    it("should create assignment and record MENTOR_ASSIGNED signal", async () => {
      const assignmentId = "assignment-123";
      mockPrisma.mentorAssignment.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.mentorAssignment.create.mockResolvedValue({
        id: assignmentId,
        mentorId: "mentor-1",
        newbieId: "newbie-1",
        mentor: { firstName: "Jane", lastName: "Smith" },
        newbie: { firstName: "Bob", lastName: "Wilson" },
      });
      mockPrisma.mentorSignal.create.mockResolvedValue({
        id: "signal-1",
        signalType: "MENTOR_ASSIGNED",
      });

      const result = await assignMentor({
        mentorId: "mentor-1",
        newbieId: "newbie-1",
        assignedBy: "admin-1",
      });

      expect(result).toBe(assignmentId);
      expect(mockPrisma.mentorAssignment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            mentorId: "mentor-1",
            newbieId: "newbie-1",
            assignedBy: "admin-1",
          }),
        })
      );
      expect(mockPrisma.mentorSignal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            signalType: "MENTOR_ASSIGNED",
            summary: expect.stringContaining("Jane Smith"),
          }),
        })
      );
    });

    it("should end existing assignment when reassigning newbie", async () => {
      mockPrisma.mentorAssignment.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.mentorAssignment.create.mockResolvedValue({
        id: "new-assignment",
        mentor: { firstName: "New", lastName: "Mentor" },
        newbie: { firstName: "Bob", lastName: "Wilson" },
      });
      mockPrisma.mentorSignal.create.mockResolvedValue({});

      await assignMentor({
        mentorId: "new-mentor",
        newbieId: "newbie-1",
      });

      expect(mockPrisma.mentorAssignment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            newbieId: "newbie-1",
            endedAt: null,
          }),
        })
      );
    });
  });

  describe("endMentorAssignment", () => {
    it("should end assignment and record MENTOR_UNASSIGNED signal", async () => {
      mockPrisma.mentorAssignment.update.mockResolvedValue({
        id: "assignment-123",
        mentor: { firstName: "Jane", lastName: "Smith" },
        newbie: { firstName: "Bob", lastName: "Wilson" },
      });
      mockPrisma.mentorSignal.create.mockResolvedValue({});

      await endMentorAssignment("assignment-123", "Graduation");

      expect(mockPrisma.mentorAssignment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "assignment-123" },
          data: expect.objectContaining({
            endedReason: "Graduation",
          }),
        })
      );
      expect(mockPrisma.mentorSignal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            signalType: "MENTOR_UNASSIGNED",
            summary: expect.stringContaining("completed mentorship"),
          }),
        })
      );
    });
  });

  describe("recordFirstContact", () => {
    it("should record FIRST_CONTACT signal if not already recorded", async () => {
      mockPrisma.mentorAssignment.findUnique.mockResolvedValue({
        id: "assignment-123",
        mentor: { firstName: "Jane", lastName: "Smith" },
        newbie: { firstName: "Bob", lastName: "Wilson" },
      });
      mockPrisma.mentorSignal.findFirst.mockResolvedValue(null);
      mockPrisma.mentorSignal.create.mockResolvedValue({});

      await recordFirstContact("assignment-123");

      expect(mockPrisma.mentorSignal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            signalType: "FIRST_CONTACT",
            summary: expect.stringContaining("first contact"),
          }),
        })
      );
    });

    it("should not duplicate FIRST_CONTACT signal", async () => {
      mockPrisma.mentorAssignment.findUnique.mockResolvedValue({
        id: "assignment-123",
        mentor: { firstName: "Jane", lastName: "Smith" },
        newbie: { firstName: "Bob", lastName: "Wilson" },
      });
      mockPrisma.mentorSignal.findFirst.mockResolvedValue({
        id: "existing-signal",
      });

      await recordFirstContact("assignment-123");

      expect(mockPrisma.mentorSignal.create).not.toHaveBeenCalled();
    });

    it("should throw if assignment not found", async () => {
      mockPrisma.mentorAssignment.findUnique.mockResolvedValue(null);

      await expect(recordFirstContact("nonexistent")).rejects.toThrow(
        "Assignment nonexistent not found"
      );
    });
  });

  describe("getMentorDashboardMetrics", () => {
    it("should return aggregated dashboard metrics", async () => {
      mockPrisma.mentorAssignment.count.mockResolvedValue(10);
      mockPrisma.mentorSignal.groupBy
        .mockResolvedValueOnce([
          { signalType: "MENTOR_ASSIGNED", _count: 10 },
          { signalType: "REGISTERED_SAME_EVENT", _count: 25 },
          { signalType: "ATTENDED_SAME_EVENT", _count: 15 },
        ])
        .mockResolvedValueOnce([
          { signalType: "REGISTERED_SAME_EVENT", weekNumber: 50, yearNumber: 2025, _count: 5 },
        ]);
      mockPrisma.mentorSignal.findMany.mockResolvedValue([
        { mentorAssignmentId: "a1" },
        { mentorAssignmentId: "a2" },
      ]);
      mockPrisma.mentorAssignment.findMany.mockResolvedValue([
        { id: "a1" },
        { id: "a2" },
        { id: "a3" },
      ]);

      const metrics = await getMentorDashboardMetrics();

      expect(metrics.totalActiveAssignments).toBe(10);
      expect(metrics.signalsByType.MENTOR_ASSIGNED).toBe(10);
      expect(metrics.signalsByType.REGISTERED_SAME_EVENT).toBe(25);
      expect(metrics.assignmentsWithoutRecentSignals).toBe(1);
    });
  });

  describe("getRecentSignals", () => {
    it("should return recent signals with human-readable data", async () => {
      mockPrisma.mentorSignal.findMany.mockResolvedValue([
        {
          id: "signal-1",
          signalType: "REGISTERED_SAME_EVENT",
          summary: "Jane and Bob registered for Coffee Chat",
          createdAt: new Date("2025-12-16"),
          mentorAssignment: {
            mentor: { firstName: "Jane", lastName: "Smith" },
            newbie: { firstName: "Bob", lastName: "Wilson" },
          },
        },
      ]);

      const signals = await getRecentSignals(10);

      expect(signals).toHaveLength(1);
      expect(signals[0].mentorName).toBe("Jane Smith");
      expect(signals[0].newbieName).toBe("Bob Wilson");
      expect(signals[0].signalType).toBe("REGISTERED_SAME_EVENT");
    });
  });

  describe("getAssignmentsNeedingAttention", () => {
    it("should return assignments without recent signals", async () => {
      const oldDate = new Date("2025-10-01");
      mockPrisma.mentorAssignment.findMany.mockResolvedValue([
        {
          id: "a1",
          assignedAt: new Date("2025-09-01"),
          mentor: { firstName: "Jane", lastName: "Smith" },
          newbie: { firstName: "Bob", lastName: "Wilson" },
          signals: [{ createdAt: oldDate }],
        },
        {
          id: "a2",
          assignedAt: new Date("2025-11-01"),
          mentor: { firstName: "John", lastName: "Doe" },
          newbie: { firstName: "Alice", lastName: "Brown" },
          signals: [], // No signals at all
        },
      ]);

      const needAttention = await getAssignmentsNeedingAttention(4);

      expect(needAttention).toHaveLength(2);
      expect(needAttention[0].assignmentId).toBe("a1");
      expect(needAttention[1].assignmentId).toBe("a2");
      expect(needAttention[1].lastSignalAt).toBeNull();
    });
  });

  describe("Summary Generation", () => {
    it("should generate readable summaries without sensitive data", async () => {
      mockPrisma.mentorAssignment.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.mentorAssignment.create.mockResolvedValue({
        id: "assignment-123",
        mentor: { firstName: "Jane", lastName: "Smith" },
        newbie: { firstName: "Bob", lastName: "Wilson" },
      });
      mockPrisma.mentorSignal.create.mockResolvedValue({});

      await assignMentor({
        mentorId: "mentor-1",
        newbieId: "newbie-1",
      });

      const createCall = mockPrisma.mentorSignal.create.mock.calls[0][0];
      const summary = createCall.data.summary;

      // Summary should be human-readable
      expect(summary).toContain("Jane Smith");
      expect(summary).toContain("Bob Wilson");
      expect(summary).toContain("mentor");

      // Summary should NOT contain sensitive data
      expect(summary).not.toContain("@");
      expect(summary).not.toContain("mentor-1");
      expect(summary).not.toContain("newbie-1");
    });
  });
});
