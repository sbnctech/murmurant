/**
 * Mentor Signal System
 *
 * Charter P7: Observability is a product feature
 *
 * Records mentor engagement signals for flywheel diagnostics.
 * Enables leadership to answer: "Is mentorship actually working?"
 *
 * Design Principles:
 * - Human-readable summaries (no jargon)
 * - No sensitive content in summaries
 * - Aggregatable for dashboards
 * - No surveillance - tracks engagement, not behavior
 */

import { prisma } from "@/lib/prisma";
import { MentorSignalType } from "@prisma/client";

// =============================================================================
// TYPES
// =============================================================================

export interface MentorAssignmentInput {
  mentorId: string;
  newbieId: string;
  assignedBy?: string;
  notes?: string;
}

export interface SignalSummary {
  signalType: MentorSignalType;
  count: number;
  weekNumber: number;
  yearNumber: number;
}

export interface MentorDashboardMetrics {
  totalActiveAssignments: number;
  signalsByType: Record<MentorSignalType, number>;
  weeklySignals: SignalSummary[];
  assignmentsWithoutRecentSignals: number;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get ISO week number and year for a date.
 */
function getWeekAndYear(date: Date): { weekNumber: number; yearNumber: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { weekNumber, yearNumber: d.getUTCFullYear() };
}

/**
 * Generate human-readable summary for a signal.
 * Intentionally avoids sensitive details.
 */
function generateSummary(
  signalType: MentorSignalType,
  mentorName: string,
  newbieName: string,
  eventTitle?: string
): string {
  switch (signalType) {
    case "MENTOR_ASSIGNED":
      return `${mentorName} assigned as mentor to ${newbieName}`;
    case "REGISTERED_SAME_EVENT":
      return `${mentorName} and ${newbieName} both registered for ${eventTitle ?? "an event"}`;
    case "ATTENDED_SAME_EVENT":
      return `${mentorName} and ${newbieName} both attended ${eventTitle ?? "an event"}`;
    case "FIRST_CONTACT":
      return `${mentorName} made first contact with ${newbieName}`;
    case "MENTOR_UNASSIGNED":
      return `${mentorName} completed mentorship of ${newbieName}`;
    default:
      return `Mentor signal recorded for ${mentorName} and ${newbieName}`;
  }
}

// =============================================================================
// ASSIGNMENT FUNCTIONS
// =============================================================================

/**
 * Assign a mentor to a newbie.
 * Records the initial MENTOR_ASSIGNED signal.
 */
export async function assignMentor(input: MentorAssignmentInput): Promise<string> {
  const { mentorId, newbieId, assignedBy, notes } = input;

  // End any existing active assignment for this newbie
  await prisma.mentorAssignment.updateMany({
    where: {
      newbieId,
      endedAt: null,
    },
    data: {
      endedAt: new Date(),
      endedReason: "Reassigned to new mentor",
    },
  });

  // Create new assignment
  const assignment = await prisma.mentorAssignment.create({
    data: {
      mentorId,
      newbieId,
      assignedBy,
      notes,
    },
    include: {
      mentor: { select: { firstName: true, lastName: true } },
      newbie: { select: { firstName: true, lastName: true } },
    },
  });

  // Record the assignment signal
  const { weekNumber, yearNumber } = getWeekAndYear(new Date());
  const mentorName = `${assignment.mentor.firstName} ${assignment.mentor.lastName}`;
  const newbieName = `${assignment.newbie.firstName} ${assignment.newbie.lastName}`;

  await prisma.mentorSignal.create({
    data: {
      mentorAssignmentId: assignment.id,
      signalType: "MENTOR_ASSIGNED",
      summary: generateSummary("MENTOR_ASSIGNED", mentorName, newbieName),
      weekNumber,
      yearNumber,
    },
  });

  return assignment.id;
}

/**
 * End a mentor assignment (graduation, reassignment, etc.).
 */
export async function endMentorAssignment(
  assignmentId: string,
  reason: string
): Promise<void> {
  const assignment = await prisma.mentorAssignment.update({
    where: { id: assignmentId },
    data: {
      endedAt: new Date(),
      endedReason: reason,
    },
    include: {
      mentor: { select: { firstName: true, lastName: true } },
      newbie: { select: { firstName: true, lastName: true } },
    },
  });

  // Record the end signal
  const { weekNumber, yearNumber } = getWeekAndYear(new Date());
  const mentorName = `${assignment.mentor.firstName} ${assignment.mentor.lastName}`;
  const newbieName = `${assignment.newbie.firstName} ${assignment.newbie.lastName}`;

  await prisma.mentorSignal.create({
    data: {
      mentorAssignmentId: assignment.id,
      signalType: "MENTOR_UNASSIGNED",
      summary: generateSummary("MENTOR_UNASSIGNED", mentorName, newbieName),
      weekNumber,
      yearNumber,
    },
  });
}

// =============================================================================
// SIGNAL RECORDING FUNCTIONS
// =============================================================================

/**
 * Record a co-registration signal when mentor and newbie
 * both register for the same event.
 *
 * Call this when processing event registrations.
 */
export async function recordCoRegistration(
  eventId: string,
  eventTitle: string
): Promise<number> {
  // Find all active mentor assignments where both registered for this event
  const coRegistrations = await prisma.$queryRaw<Array<{
    assignmentId: string;
    mentorName: string;
    newbieName: string;
  }>>`
    SELECT
      ma.id as "assignmentId",
      CONCAT(mentor."firstName", ' ', mentor."lastName") as "mentorName",
      CONCAT(newbie."firstName", ' ', newbie."lastName") as "newbieName"
    FROM "MentorAssignment" ma
    INNER JOIN "Member" mentor ON ma."mentorId" = mentor.id
    INNER JOIN "Member" newbie ON ma."newbieId" = newbie.id
    INNER JOIN "EventRegistration" mentor_reg ON mentor_reg."memberId" = ma."mentorId"
      AND mentor_reg."eventId" = ${eventId}::uuid
      AND mentor_reg.status IN ('PENDING', 'CONFIRMED', 'PENDING_PAYMENT')
    INNER JOIN "EventRegistration" newbie_reg ON newbie_reg."memberId" = ma."newbieId"
      AND newbie_reg."eventId" = ${eventId}::uuid
      AND newbie_reg.status IN ('PENDING', 'CONFIRMED', 'PENDING_PAYMENT')
    WHERE ma."endedAt" IS NULL
  `;

  const { weekNumber, yearNumber } = getWeekAndYear(new Date());
  let signalsCreated = 0;

  for (const row of coRegistrations) {
    // Use upsert to prevent duplicates
    try {
      await prisma.mentorSignal.create({
        data: {
          mentorAssignmentId: row.assignmentId,
          signalType: "REGISTERED_SAME_EVENT",
          eventId,
          summary: generateSummary(
            "REGISTERED_SAME_EVENT",
            row.mentorName,
            row.newbieName,
            eventTitle
          ),
          weekNumber,
          yearNumber,
          metadata: { eventTitle },
        },
      });
      signalsCreated++;
    } catch {
      // Duplicate signal - ignore
    }
  }

  return signalsCreated;
}

/**
 * Record co-attendance signals when mentor and newbie
 * both attended the same event.
 *
 * Call this after event attendance is recorded (e.g., check-in or NO_SHOW processing).
 */
export async function recordCoAttendance(
  eventId: string,
  eventTitle: string
): Promise<number> {
  // Find all active mentor assignments where both attended this event
  // Attended = CONFIRMED status (not NO_SHOW or CANCELLED)
  const coAttendances = await prisma.$queryRaw<Array<{
    assignmentId: string;
    mentorName: string;
    newbieName: string;
  }>>`
    SELECT
      ma.id as "assignmentId",
      CONCAT(mentor."firstName", ' ', mentor."lastName") as "mentorName",
      CONCAT(newbie."firstName", ' ', newbie."lastName") as "newbieName"
    FROM "MentorAssignment" ma
    INNER JOIN "Member" mentor ON ma."mentorId" = mentor.id
    INNER JOIN "Member" newbie ON ma."newbieId" = newbie.id
    INNER JOIN "EventRegistration" mentor_reg ON mentor_reg."memberId" = ma."mentorId"
      AND mentor_reg."eventId" = ${eventId}::uuid
      AND mentor_reg.status = 'CONFIRMED'
    INNER JOIN "EventRegistration" newbie_reg ON newbie_reg."memberId" = ma."newbieId"
      AND newbie_reg."eventId" = ${eventId}::uuid
      AND newbie_reg.status = 'CONFIRMED'
    WHERE ma."endedAt" IS NULL
  `;

  const { weekNumber, yearNumber } = getWeekAndYear(new Date());
  let signalsCreated = 0;

  for (const row of coAttendances) {
    try {
      await prisma.mentorSignal.create({
        data: {
          mentorAssignmentId: row.assignmentId,
          signalType: "ATTENDED_SAME_EVENT",
          eventId,
          summary: generateSummary(
            "ATTENDED_SAME_EVENT",
            row.mentorName,
            row.newbieName,
            eventTitle
          ),
          weekNumber,
          yearNumber,
          metadata: { eventTitle },
        },
      });
      signalsCreated++;
    } catch {
      // Duplicate signal - ignore
    }
  }

  return signalsCreated;
}

/**
 * Record first contact signal.
 * Called when mentor confirms they've made initial contact with newbie.
 */
export async function recordFirstContact(assignmentId: string): Promise<void> {
  const assignment = await prisma.mentorAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      mentor: { select: { firstName: true, lastName: true } },
      newbie: { select: { firstName: true, lastName: true } },
    },
  });

  if (!assignment) {
    throw new Error(`Assignment ${assignmentId} not found`);
  }

  const { weekNumber, yearNumber } = getWeekAndYear(new Date());
  const mentorName = `${assignment.mentor.firstName} ${assignment.mentor.lastName}`;
  const newbieName = `${assignment.newbie.firstName} ${assignment.newbie.lastName}`;

  // Only create if not already recorded
  const existing = await prisma.mentorSignal.findFirst({
    where: {
      mentorAssignmentId: assignmentId,
      signalType: "FIRST_CONTACT",
    },
  });

  if (!existing) {
    await prisma.mentorSignal.create({
      data: {
        mentorAssignmentId: assignmentId,
        signalType: "FIRST_CONTACT",
        summary: generateSummary("FIRST_CONTACT", mentorName, newbieName),
        weekNumber,
        yearNumber,
      },
    });
  }
}

// =============================================================================
// DASHBOARD QUERY FUNCTIONS
// =============================================================================

/**
 * Get mentor dashboard metrics for leadership.
 * Answers: "Is mentorship actually working?"
 */
export async function getMentorDashboardMetrics(
  weeksBack: number = 8
): Promise<MentorDashboardMetrics> {
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - weeksBack * 7 * 24 * 60 * 60 * 1000);

  // Active assignments count
  const totalActiveAssignments = await prisma.mentorAssignment.count({
    where: { endedAt: null },
  });

  // Signals by type (all time for active assignments)
  const signalCounts = await prisma.mentorSignal.groupBy({
    by: ["signalType"],
    _count: true,
    where: {
      mentorAssignment: { endedAt: null },
    },
  });

  const signalsByType = Object.fromEntries(
    Object.values(MentorSignalType).map((type) => [type, 0])
  ) as Record<MentorSignalType, number>;

  for (const row of signalCounts) {
    signalsByType[row.signalType] = row._count;
  }

  // Weekly signals for trending
  const weeklySignals = await prisma.mentorSignal.groupBy({
    by: ["signalType", "weekNumber", "yearNumber"],
    _count: true,
    where: {
      createdAt: { gte: cutoffDate },
    },
    orderBy: [{ yearNumber: "desc" }, { weekNumber: "desc" }],
  });

  // Assignments without recent signals (potential concern)
  const recentSignalAssignments = await prisma.mentorSignal.findMany({
    where: {
      createdAt: { gte: cutoffDate },
      mentorAssignment: { endedAt: null },
    },
    select: { mentorAssignmentId: true },
    distinct: ["mentorAssignmentId"],
  });

  const activeAssignmentsWithSignals = new Set(
    recentSignalAssignments.map((s) => s.mentorAssignmentId)
  );

  const allActiveAssignments = await prisma.mentorAssignment.findMany({
    where: { endedAt: null },
    select: { id: true },
  });

  const assignmentsWithoutRecentSignals = allActiveAssignments.filter(
    (a) => !activeAssignmentsWithSignals.has(a.id)
  ).length;

  return {
    totalActiveAssignments,
    signalsByType,
    weeklySignals: weeklySignals.map((row) => ({
      signalType: row.signalType,
      count: row._count,
      weekNumber: row.weekNumber,
      yearNumber: row.yearNumber,
    })),
    assignmentsWithoutRecentSignals,
  };
}

/**
 * Get recent signals with human-readable summaries.
 * For activity feed displays.
 */
export async function getRecentSignals(
  limit: number = 20,
  signalTypes?: MentorSignalType[]
): Promise<Array<{
  id: string;
  signalType: MentorSignalType;
  summary: string;
  createdAt: Date;
  mentorName: string;
  newbieName: string;
}>> {
  const signals = await prisma.mentorSignal.findMany({
    where: signalTypes ? { signalType: { in: signalTypes } } : undefined,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      mentorAssignment: {
        include: {
          mentor: { select: { firstName: true, lastName: true } },
          newbie: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  return signals.map((s) => ({
    id: s.id,
    signalType: s.signalType,
    summary: s.summary,
    createdAt: s.createdAt,
    mentorName: `${s.mentorAssignment.mentor.firstName} ${s.mentorAssignment.mentor.lastName}`,
    newbieName: `${s.mentorAssignment.newbie.firstName} ${s.mentorAssignment.newbie.lastName}`,
  }));
}

/**
 * Get assignments that may need attention.
 * (No signals in specified weeks)
 */
export async function getAssignmentsNeedingAttention(
  weeksWithoutSignal: number = 4
): Promise<Array<{
  assignmentId: string;
  mentorName: string;
  newbieName: string;
  assignedAt: Date;
  lastSignalAt: Date | null;
}>> {
  const cutoffDate = new Date(
    Date.now() - weeksWithoutSignal * 7 * 24 * 60 * 60 * 1000
  );

  const assignments = await prisma.mentorAssignment.findMany({
    where: {
      endedAt: null,
    },
    include: {
      mentor: { select: { firstName: true, lastName: true } },
      newbie: { select: { firstName: true, lastName: true } },
      signals: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return assignments
    .filter((a) => {
      const lastSignal = a.signals[0];
      if (!lastSignal) return true; // No signals at all
      return lastSignal.createdAt < cutoffDate;
    })
    .map((a) => ({
      assignmentId: a.id,
      mentorName: `${a.mentor.firstName} ${a.mentor.lastName}`,
      newbieName: `${a.newbie.firstName} ${a.newbie.lastName}`,
      assignedAt: a.assignedAt,
      lastSignalAt: a.signals[0]?.createdAt ?? null,
    }));
}
