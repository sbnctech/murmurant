import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RegistrationStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";

// Fixed reference date for deterministic upcoming events calculation
const REFERENCE_DATE = new Date("2025-05-01T00:00:00Z");

type DashboardSummary = {
  totalMembers: number;
  activeMembers: number;
  totalEvents: number;
  upcomingEvents: number;
  totalRegistrations: number;
  waitlistedRegistrations: number;
};

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  // Count all members
  const totalMembers = await prisma.member.count();

  // Count active members (where membership status isActive = true)
  const activeMembers = await prisma.member.count({
    where: {
      membershipStatus: {
        isActive: true,
      },
    },
  });

  // Count all events
  const totalEvents = await prisma.event.count();

  // Count upcoming events (startTime >= reference date)
  const upcomingEvents = await prisma.event.count({
    where: {
      startTime: {
        gte: REFERENCE_DATE,
      },
    },
  });

  // Count all registrations
  const totalRegistrations = await prisma.eventRegistration.count();

  // Count waitlisted registrations
  const waitlistedRegistrations = await prisma.eventRegistration.count({
    where: {
      status: RegistrationStatus.WAITLISTED,
    },
  });

  const summary: DashboardSummary = {
    totalMembers,
    activeMembers,
    totalEvents,
    upcomingEvents,
    totalRegistrations,
    waitlistedRegistrations,
  };

  return NextResponse.json({ summary });
}
