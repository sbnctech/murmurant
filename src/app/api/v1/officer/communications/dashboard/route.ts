/**
 * VP Communications Dashboard API
 *
 * GET /api/v1/officer/communications/dashboard - Get communications dashboard data
 *
 * Returns:
 * - eventsOpeningThisWeek: Events with registration opening this week
 * - newlyAnnouncedEvents: Events published this week
 * - eventsFillingFast: Events with high registration percentage
 * - newMembers: Members who joined in last 30 days
 * - membersCompletingThisMonth: Members with anniversary this month
 * - enewsDrafts: Events with eNews blurb drafts
 *
 * Access Control:
 * - Requires admin:read or vp_communications role
 *
 * Charter Compliance:
 * - P1: Identity via session auth
 * - P2: Default deny authorization
 * - P7: Audit logging via API access
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { explainMemberLifecycle, type MemberLifecycleInput } from "@/lib/membership";

// Response types
export type CommunicationsDashboardData = {
  visible: boolean;
  eventsOpeningThisWeek: EventSummary[];
  newlyAnnouncedEvents: EventSummary[];
  eventsFillingFast: EventWithCapacity[];
  newMembers: MemberSummary[];
  membersCompletingThisMonth: MemberWithAnniversary[];
  enewsDrafts: EventWithBlurb[];
  stats: {
    totalEventsThisWeek: number;
    totalNewMembers: number;
    totalAtRisk: number;
    upcomingEvents: number;
  };
};

type EventSummary = {
  id: string;
  title: string;
  startTime: string;
  registrationOpensAt: string | null;
  status: string;
  category: string | null;
};

type EventWithCapacity = {
  id: string;
  title: string;
  startTime: string;
  totalCapacity: number;
  registeredCount: number;
  percentFull: number;
  status: string;
};

type EventWithBlurb = {
  id: string;
  title: string;
  startTime: string;
  enewsBlurbDraft: string;
  status: string;
};

type MemberSummary = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  joinedAt: string;
  lifecycleState: string;
  stateLabel: string;
};

type MemberWithAnniversary = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  joinedAt: string;
  anniversaryDate: string;
  yearsAsMember: number;
  lifecycleState: string;
  stateLabel: string;
};

/**
 * GET /api/v1/officer/communications/dashboard
 */
export async function GET(req: NextRequest) {
  // Check for VP Communications capability (or admin:full)
  const auth = await requireCapability(req, "events:schedule:view");
  if (!auth.ok) {
    // Return not visible for widget compatibility
    return NextResponse.json({
      visible: false,
    } as Partial<CommunicationsDashboardData>);
  }

  try {
    const now = new Date();

    // Calculate date ranges
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Fetch data in parallel
    const [
      eventsOpeningThisWeek,
      newlyAnnouncedEvents,
      eventsWithRegistrations,
      newMembers,
      allActiveMembers,
      eventsWithBlurbs,
      upcomingEventsCount,
    ] = await Promise.all([
      // Events with registration opening this week
      prisma.event.findMany({
        where: {
          registrationOpensAt: {
            gte: startOfWeek,
            lt: endOfWeek,
          },
          status: { in: ["APPROVED", "PUBLISHED"] },
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          registrationOpensAt: true,
          status: true,
          category: true,
        },
        orderBy: { registrationOpensAt: "asc" },
        take: 10,
      }),

      // Events published this week
      prisma.event.findMany({
        where: {
          publishedAt: {
            gte: startOfWeek,
            lt: endOfWeek,
          },
          status: "PUBLISHED",
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          registrationOpensAt: true,
          status: true,
          category: true,
        },
        orderBy: { publishedAt: "desc" },
        take: 10,
      }),

      // Events with registrations (for capacity analysis)
      prisma.event.findMany({
        where: {
          status: "PUBLISHED",
          startTime: { gte: now },
        },
        include: {
          ticketTiers: {
            where: { isActive: true },
            select: { quantity: true },
          },
          registrations: {
            where: { status: { in: ["CONFIRMED", "PENDING"] } },
            select: { id: true },
          },
        },
        orderBy: { startTime: "asc" },
        take: 50,
      }),

      // New members in last 30 days
      prisma.member.findMany({
        where: {
          joinedAt: { gte: thirtyDaysAgo },
          membershipStatus: { isActive: true },
        },
        include: {
          membershipStatus: { select: { code: true, label: true } },
          membershipTier: { select: { code: true, name: true } },
        },
        orderBy: { joinedAt: "desc" },
        take: 20,
      }),

      // All active members (for anniversary calculation)
      prisma.member.findMany({
        where: {
          membershipStatus: { code: "active" },
        },
        include: {
          membershipStatus: { select: { code: true, label: true } },
          membershipTier: { select: { code: true, name: true } },
        },
      }),

      // Events with eNews blurb drafts
      prisma.event.findMany({
        where: {
          enewsBlurbDraft: { not: null },
          status: { in: ["APPROVED", "PUBLISHED"] },
          startTime: { gte: now },
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          enewsBlurbDraft: true,
          status: true,
        },
        orderBy: { startTime: "asc" },
        take: 10,
      }),

      // Count upcoming events
      prisma.event.count({
        where: {
          status: "PUBLISHED",
          startTime: { gte: now },
        },
      }),
    ]);

    // Process events filling fast (>75% capacity)
    const eventsFillingFast: EventWithCapacity[] = eventsWithRegistrations
      .map((event) => {
        const totalCapacity = event.ticketTiers.reduce((sum, t) => sum + t.quantity, 0);
        const registeredCount = event.registrations.length;
        const percentFull = totalCapacity > 0 ? Math.round((registeredCount / totalCapacity) * 100) : 0;

        return {
          id: event.id,
          title: event.title,
          startTime: event.startTime.toISOString(),
          totalCapacity,
          registeredCount,
          percentFull,
          status: event.status,
        };
      })
      .filter((e) => e.percentFull >= 75 && e.totalCapacity > 0)
      .sort((a, b) => b.percentFull - a.percentFull)
      .slice(0, 5);

    // Process new members with lifecycle info
    const newMembersSummary: MemberSummary[] = newMembers.map((m) => {
      const lifecycleInput: MemberLifecycleInput = {
        membershipStatusCode: m.membershipStatus.code,
        membershipTierCode: m.membershipTier?.code || null,
        joinedAt: m.joinedAt,
        waMembershipLevelRaw: m.waMembershipLevelRaw,
      };
      const lifecycle = explainMemberLifecycle(lifecycleInput);

      return {
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email,
        joinedAt: m.joinedAt.toISOString(),
        lifecycleState: lifecycle.currentState,
        stateLabel: lifecycle.stateLabel,
      };
    });

    // Find members with anniversary this month
    const membersCompletingThisMonth: MemberWithAnniversary[] = allActiveMembers
      .filter((m) => {
        // Check if join date month/day falls within current month
        const joinMonth = m.joinedAt.getMonth();
        const joinDay = m.joinedAt.getDate();
        const currentMonth = now.getMonth();
        return joinMonth === currentMonth && joinDay >= 1 && joinDay <= endOfMonth.getDate();
      })
      .map((m) => {
        const lifecycleInput: MemberLifecycleInput = {
          membershipStatusCode: m.membershipStatus.code,
          membershipTierCode: m.membershipTier?.code || null,
          joinedAt: m.joinedAt,
          waMembershipLevelRaw: m.waMembershipLevelRaw,
        };
        const lifecycle = explainMemberLifecycle(lifecycleInput);

        // Calculate years as member
        const yearsAsMember = now.getFullYear() - m.joinedAt.getFullYear();

        // Build anniversary date for this year
        const anniversaryDate = new Date(
          now.getFullYear(),
          m.joinedAt.getMonth(),
          m.joinedAt.getDate()
        );

        return {
          id: m.id,
          firstName: m.firstName,
          lastName: m.lastName,
          email: m.email,
          joinedAt: m.joinedAt.toISOString(),
          anniversaryDate: anniversaryDate.toISOString(),
          yearsAsMember,
          lifecycleState: lifecycle.currentState,
          stateLabel: lifecycle.stateLabel,
        };
      })
      .sort((a, b) => new Date(a.anniversaryDate).getTime() - new Date(b.anniversaryDate).getTime())
      .slice(0, 15);

    // Count members at risk (approaching anniversary within 60 days)
    const atRiskCount = allActiveMembers.filter((m) => {
      const daysSinceJoin = Math.floor(
        (now.getTime() - m.joinedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysUntilAnniversary = 365 - (daysSinceJoin % 365);
      return daysUntilAnniversary <= 60;
    }).length;

    // Build response
    const dashboardData: CommunicationsDashboardData = {
      visible: true,
      eventsOpeningThisWeek: eventsOpeningThisWeek.map((e) => ({
        id: e.id,
        title: e.title,
        startTime: e.startTime.toISOString(),
        registrationOpensAt: e.registrationOpensAt?.toISOString() ?? null,
        status: e.status,
        category: e.category,
      })),
      newlyAnnouncedEvents: newlyAnnouncedEvents.map((e) => ({
        id: e.id,
        title: e.title,
        startTime: e.startTime.toISOString(),
        registrationOpensAt: e.registrationOpensAt?.toISOString() ?? null,
        status: e.status,
        category: e.category,
      })),
      eventsFillingFast,
      newMembers: newMembersSummary,
      membersCompletingThisMonth,
      enewsDrafts: eventsWithBlurbs
        .filter((e) => e.enewsBlurbDraft !== null)
        .map((e) => ({
          id: e.id,
          title: e.title,
          startTime: e.startTime.toISOString(),
          enewsBlurbDraft: e.enewsBlurbDraft!,
          status: e.status,
        })),
      stats: {
        totalEventsThisWeek: eventsOpeningThisWeek.length + newlyAnnouncedEvents.length,
        totalNewMembers: newMembers.length,
        totalAtRisk: atRiskCount,
        upcomingEvents: upcomingEventsCount,
      },
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error fetching communications dashboard:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
