/**
 * Event Host Service Management
 *
 * Handles automatic creation and closure of EVENT_HOST service records.
 * Event host records:
 * - startAt: event start date/time
 * - endAt: midnight (00:00) of the calendar day after the event ends
 */

import { prisma } from "@/lib/prisma";
import { ServiceType } from "@prisma/client";
import type { ServiceHistoryRecord } from "./types";
import { startOfClubDayUtc } from "@/lib/timezone";

/**
 * Get midnight Pacific Time of the day after the given date
 *
 * For an event ending on Dec 15, this returns midnight (00:00) on Dec 16 Pacific Time.
 */
function getMidnightNextDay(eventEndAt: Date): Date {
  // Get midnight of the event's end day in Pacific Time
  const midnightEventDay = startOfClubDayUtc(eventEndAt);
  // Add 24 hours to get midnight of the next day
  return new Date(midnightEventDay.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Create an EVENT_HOST service record for an event chair
 *
 * Called when a member is assigned as event chair.
 */
export async function createEventHostService(
  eventId: string,
  memberId: string,
  createdById: string
): Promise<ServiceHistoryRecord> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, title: true, category: true, startTime: true, endTime: true },
  });

  if (!event) {
    throw new Error(`Event not found: ${eventId}`);
  }

  // Check if there's already an active EVENT_HOST record for this member and event
  const existing = await prisma.memberServiceHistory.findFirst({
    where: {
      memberId,
      eventId,
      serviceType: ServiceType.EVENT_HOST,
      endAt: null,
    },
  });

  if (existing) {
    throw new Error(
      `Member ${memberId} already has an active EVENT_HOST record for event ${eventId}`
    );
  }

  const record = await prisma.memberServiceHistory.create({
    data: {
      memberId,
      serviceType: ServiceType.EVENT_HOST,
      roleTitle: "Event Host",
      eventId: event.id,
      eventTitle: event.title,
      committeeName: event.category ?? null,
      startAt: event.startTime,
      createdById,
    },
    include: {
      member: { select: { firstName: true, lastName: true } },
    },
  });

  return {
    id: record.id,
    memberId: record.memberId,
    memberName: `${record.member.firstName} ${record.member.lastName}`,
    serviceType: record.serviceType,
    roleTitle: record.roleTitle,
    committeeId: record.committeeId,
    committeeName: record.committeeName,
    eventId: record.eventId,
    eventTitle: record.eventTitle,
    termId: record.termId,
    termName: record.termName,
    startAt: record.startAt.toISOString(),
    endAt: record.endAt?.toISOString() ?? null,
    notes: record.notes,
    isActive: record.endAt === null,
    createdAt: record.createdAt.toISOString(),
  };
}

/**
 * Close completed event host services
 *
 * Finds all EVENT_HOST records where the event has ended and closes them
 * with endAt set to midnight of the day after the event ended.
 *
 * Returns the number of records closed.
 */
export async function closeCompletedEventHostServices(): Promise<number> {
  const now = new Date();

  // Find all active EVENT_HOST records where the event has ended
  const activeEventHostRecords = await prisma.memberServiceHistory.findMany({
    where: {
      serviceType: ServiceType.EVENT_HOST,
      endAt: null,
      eventId: { not: null },
    },
    include: {
      event: {
        select: { endTime: true },
      },
    },
  });

  let closedCount = 0;

  for (const record of activeEventHostRecords) {
    if (!record.event || !record.event.endTime) {
      continue;
    }

    // Check if the event has ended
    if (record.event.endTime <= now) {
      const closeAt = getMidnightNextDay(record.event.endTime);

      // Only close if the close time has passed
      if (closeAt <= now) {
        await prisma.memberServiceHistory.update({
          where: { id: record.id },
          data: { endAt: closeAt },
        });
        closedCount++;
      }
    }
  }

  return closedCount;
}

/**
 * Get all active event host services
 */
export async function getActiveEventHostServices(): Promise<
  Array<{
    id: string;
    memberId: string;
    memberName: string;
    eventId: string;
    eventTitle: string;
    eventEndAt: string;
    scheduledCloseAt: string;
  }>
> {
  const records = await prisma.memberServiceHistory.findMany({
    where: {
      serviceType: ServiceType.EVENT_HOST,
      endAt: null,
      eventId: { not: null },
    },
    include: {
      member: { select: { firstName: true, lastName: true } },
      event: { select: { title: true, endTime: true } },
    },
    orderBy: { startAt: "desc" },
  });

  return records
    .filter((r) => r.event && r.event.endTime)
    .map((record) => ({
      id: record.id,
      memberId: record.memberId,
      memberName: `${record.member.firstName} ${record.member.lastName}`,
      eventId: record.eventId!,
      eventTitle: record.event!.title,
      eventEndAt: record.event!.endTime!.toISOString(),
      scheduledCloseAt: getMidnightNextDay(record.event!.endTime!).toISOString(),
    }));
}

/**
 * Close a specific event host service record
 *
 * Used when manually removing someone as event chair.
 */
export async function closeEventHostService(
  serviceId: string,
  endAt?: Date
): Promise<void> {
  const record = await prisma.memberServiceHistory.findUnique({
    where: { id: serviceId },
    include: {
      event: { select: { endTime: true } },
    },
  });

  if (!record) {
    throw new Error(`Service record not found: ${serviceId}`);
  }

  if (record.serviceType !== ServiceType.EVENT_HOST) {
    throw new Error(`Record ${serviceId} is not an EVENT_HOST record`);
  }

  if (record.endAt !== null) {
    throw new Error(`Service record already closed: ${serviceId}`);
  }

  // If no endAt provided, use midnight next day after event end (or now if event has no end)
  let closeAt = endAt;
  if (!closeAt) {
    if (record.event?.endTime) {
      closeAt = getMidnightNextDay(record.event.endTime);
    } else {
      closeAt = new Date();
    }
  }

  await prisma.memberServiceHistory.update({
    where: { id: serviceId },
    data: { endAt: closeAt },
  });
}
