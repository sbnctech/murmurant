/**
 * Admin summary aggregation for dashboard stats.
 * Uses Prisma to query actual database counts.
 */

import { prisma } from "./prisma";

export type AdminSummary = {
  totalActiveMembers: number;
  totalEvents: number;
  totalRegistrations: number;
  totalWaitlistedRegistrations: number;
};

export async function getAdminSummary(): Promise<AdminSummary> {
  const [
    totalActiveMembers,
    totalEvents,
    totalRegistrations,
    totalWaitlistedRegistrations,
  ] = await Promise.all([
    // Count members with active membership status
    prisma.member.count({
      where: {
        membershipStatus: {
          isActive: true,
        },
      },
    }),
    // Count only published events
    prisma.event.count({
      where: {
        isPublished: true,
      },
    }),
    // Count all registrations
    prisma.eventRegistration.count(),
    // Count waitlisted registrations
    prisma.eventRegistration.count({
      where: {
        status: "WAITLISTED",
      },
    }),
  ]);

  return {
    totalActiveMembers,
    totalEvents,
    totalRegistrations,
    totalWaitlistedRegistrations,
  };
}
