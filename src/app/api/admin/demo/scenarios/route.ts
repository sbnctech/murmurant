/**
 * GET /api/admin/demo/scenarios
 *
 * Returns comprehensive demo scenarios including:
 * - Lifecycle states (member progression)
 * - Officer roles (President, VP, etc.)
 * - Event states (upcoming, past, full, draft)
 *
 * Each scenario includes deep links to real entities in the database.
 * This is READ-ONLY - no data is created or modified.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/auth";
import { inferLifecycleState, LifecycleState } from "@/lib/membership/lifecycle";

// ============================================================================
// Types
// ============================================================================

type LifecycleScenario = {
  category: "lifecycle";
  id: string;
  state: LifecycleState;
  label: string;
  description: string;
  member: {
    id: string;
    name: string;
    email: string;
    status: string;
    tier: string | null;
    joinedAt: string;
    daysSinceJoin: number;
  } | null;
  deepLink: string | null;
  demoNotes: string;
};

type RoleScenario = {
  category: "role";
  id: string;
  role: string;
  label: string;
  description: string;
  member: {
    id: string;
    name: string;
    email: string;
    committee: string;
    roleTitle: string;
  } | null;
  deepLink: string | null;
  demoNotes: string;
};

type EventScenario = {
  category: "event";
  id: string;
  eventState: string;
  label: string;
  description: string;
  event: {
    id: string;
    title: string;
    category: string | null;
    startTime: string;
    isPublished: boolean;
    capacity: number | null;
    registrationCount: number;
    waitlistCount: number;
  } | null;
  deepLink: string | null;
  demoNotes: string;
};

type Scenario = LifecycleScenario | RoleScenario | EventScenario;

// ============================================================================
// Lifecycle Scenario Definitions
// ============================================================================

const LIFECYCLE_DEFINITIONS: Array<{
  state: LifecycleState;
  label: string;
  description: string;
  demoNotes: string;
  query: {
    statusCode?: string;
    tierCode?: string | null;
    joinedWithinDays?: number;
    joinedMoreThanDays?: number;
  };
}> = [
  {
    state: "active_newbie",
    label: "Active Newbie",
    description: "New member in their 90-day orientation period",
    demoNotes: "Shows the 90-day countdown and newbie-specific transitions",
    query: {
      statusCode: "active",
      tierCode: "newbie_member",
      joinedWithinDays: 90,
    },
  },
  {
    state: "active_member",
    label: "Active Member",
    description: "Past newbie period, before 2-year mark",
    demoNotes: "Shows tenure and upcoming extended offer milestone",
    query: {
      statusCode: "active",
      tierCode: "member",
      joinedMoreThanDays: 90,
    },
  },
  {
    state: "active_extended",
    label: "Extended Member",
    description: "Third-year member with extended privileges",
    demoNotes: "Shows the extended state with no expiration urgency",
    query: {
      statusCode: "active",
      tierCode: "extended_member",
    },
  },
  {
    state: "lapsed",
    label: "Lapsed Member",
    description: "Membership ended, no active privileges",
    demoNotes: "Shows historical state and reactivation path",
    query: {
      statusCode: "lapsed",
    },
  },
  {
    state: "pending_new",
    label: "Pending New",
    description: "Application submitted, awaiting approval",
    demoNotes: "Shows pre-approval state",
    query: {
      statusCode: "pending_new",
    },
  },
  {
    state: "suspended",
    label: "Suspended",
    description: "Temporarily suspended membership",
    demoNotes: "Shows suspension state",
    query: {
      statusCode: "suspended",
    },
  },
  {
    state: "unknown",
    label: "Unknown / Review",
    description: "Incomplete or inconsistent data",
    demoNotes: "Shows data quality flag requiring admin review",
    query: {
      tierCode: "unknown",
    },
  },
];

// ============================================================================
// Role Scenario Definitions
// ============================================================================

const ROLE_DEFINITIONS = [
  {
    role: "president",
    label: "President",
    description: "Club President with full visibility and approval authority",
    demoNotes: "Can approve transitions, view all data, manage governance",
    emailPattern: "demo.president@",
    roleSlug: "president",
  },
  {
    role: "vp-activities",
    label: "VP Activities",
    description: "Manages events and activities committee",
    demoNotes: "Can edit all events, approve transitions",
    emailPattern: "demo.vp-activities@",
    roleSlug: "vp-activities",
  },
  {
    role: "secretary",
    label: "Secretary",
    description: "Drafts and submits meeting minutes",
    demoNotes: "Minutes workflow: draft, edit, submit for review",
    emailPattern: "demo.secretary@",
    roleSlug: "secretary",
  },
  {
    role: "parliamentarian",
    label: "Parliamentarian",
    description: "Manages governance and bylaws interpretations",
    demoNotes: "Can create governance flags, annotations, interpretations",
    emailPattern: "demo.parliamentarian@",
    roleSlug: "parliamentarian",
  },
  {
    role: "event-chair",
    label: "Event Chair",
    description: "Hosts specific club events",
    demoNotes: "Event-scoped permissions for assigned events",
    emailPattern: "demo.eventchair@",
    roleSlug: "event-chair",
  },
  {
    role: "webmaster",
    label: "Webmaster",
    description: "Manages website content and publishing",
    demoNotes: "Publishing permissions without finance or member history access",
    emailPattern: "demo.webmaster@",
    roleSlug: "webmaster",
  },
];

// ============================================================================
// Event Scenario Definitions
// ============================================================================

const EVENT_DEFINITIONS = [
  {
    eventState: "upcoming_open",
    label: "Upcoming (Open)",
    description: "Published event with available registration spots",
    demoNotes: "Shows registration flow for open event",
    query: {
      isPublished: true,
      startTimeAfterNow: true,
      hasCapacity: true,
      notFull: true,
    },
  },
  {
    eventState: "upcoming_full",
    label: "Full (Waitlist)",
    description: "Event at capacity with waitlist",
    demoNotes: "Shows waitlist registration and capacity management",
    query: {
      isPublished: true,
      startTimeAfterNow: true,
      isFull: true,
    },
  },
  {
    eventState: "past_completed",
    label: "Past Event",
    description: "Completed event with attendance records",
    demoNotes: "Shows historical event with registrations",
    query: {
      isPublished: true,
      startTimeBeforeNow: true,
    },
  },
  {
    eventState: "draft_unpublished",
    label: "Draft Event",
    description: "Unpublished event in planning stage",
    demoNotes: "Shows draft state before publishing",
    query: {
      isPublished: false,
    },
  },
  {
    eventState: "unlimited_capacity",
    label: "Unlimited Capacity",
    description: "Event with no registration limit",
    demoNotes: "Shows unlimited registration flow",
    query: {
      isPublished: true,
      startTimeAfterNow: true,
      noCapacity: true,
    },
  },
];

// ============================================================================
// Query Functions
// ============================================================================

async function getLifecycleScenarios(): Promise<LifecycleScenario[]> {
  const scenarios: LifecycleScenario[] = [];

  for (const def of LIFECYCLE_DEFINITIONS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (def.query.statusCode) {
      where.membershipStatus = { code: def.query.statusCode };
    }

    if (def.query.tierCode !== undefined) {
      if (def.query.tierCode === null) {
        where.membershipTier = null;
      } else {
        where.membershipTier = { code: def.query.tierCode };
      }
    }

    if (def.query.joinedWithinDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - def.query.joinedWithinDays);
      where.joinedAt = { gte: cutoffDate };
    }

    if (def.query.joinedMoreThanDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - def.query.joinedMoreThanDays);
      where.joinedAt = { lt: cutoffDate };
    }

    const member = await prisma.member.findFirst({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        joinedAt: true,
        membershipStatus: { select: { code: true, label: true } },
        membershipTier: { select: { code: true, name: true } },
      },
      orderBy: { joinedAt: "desc" },
    });

    if (member) {
      const now = new Date();
      const daysSinceJoin = Math.floor(
        (now.getTime() - member.joinedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      const actualState = inferLifecycleState({
        membershipStatusCode: member.membershipStatus.code,
        membershipTierCode: member.membershipTier?.code ?? null,
        joinedAt: member.joinedAt,
        waMembershipLevelRaw: null,
      });

      scenarios.push({
        category: "lifecycle",
        id: `lifecycle-${def.state}`,
        state: actualState,
        label: def.label,
        description: def.description,
        member: {
          id: member.id,
          name: `${member.firstName} ${member.lastName}`,
          email: member.email,
          status: member.membershipStatus.label,
          tier: member.membershipTier?.name ?? null,
          joinedAt: member.joinedAt.toISOString(),
          daysSinceJoin,
        },
        deepLink: `/admin/members/${member.id}`,
        demoNotes: def.demoNotes,
      });
    } else {
      scenarios.push({
        category: "lifecycle",
        id: `lifecycle-${def.state}`,
        state: def.state,
        label: def.label,
        description: def.description,
        member: null,
        deepLink: null,
        demoNotes: `${def.demoNotes} (No matching member)`,
      });
    }
  }

  return scenarios;
}

async function getRoleScenarios(): Promise<RoleScenario[]> {
  const scenarios: RoleScenario[] = [];

  for (const def of ROLE_DEFINITIONS) {
    // Find member by email pattern (demo members use sbnc.example domain)
    const member = await prisma.member.findFirst({
      where: {
        email: { startsWith: def.emailPattern },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        roleAssignments: {
          where: {
            endDate: null, // Active assignments only
          },
          select: {
            committee: { select: { name: true } },
            committeeRole: { select: { name: true } },
          },
          take: 1,
        },
      },
    });

    if (member) {
      const assignment = member.roleAssignments[0];
      scenarios.push({
        category: "role",
        id: `role-${def.role}`,
        role: def.role,
        label: def.label,
        description: def.description,
        member: {
          id: member.id,
          name: `${member.firstName} ${member.lastName}`,
          email: member.email,
          committee: assignment?.committee.name ?? "Unassigned",
          roleTitle: assignment?.committeeRole.name ?? def.label,
        },
        deepLink: `/admin/members/${member.id}`,
        demoNotes: def.demoNotes,
      });
    } else {
      scenarios.push({
        category: "role",
        id: `role-${def.role}`,
        role: def.role,
        label: def.label,
        description: def.description,
        member: null,
        deepLink: null,
        demoNotes: `${def.demoNotes} (Run seed script to create)`,
      });
    }
  }

  return scenarios;
}

async function getEventScenarios(): Promise<EventScenario[]> {
  const scenarios: EventScenario[] = [];
  const now = new Date();

  for (const def of EVENT_DEFINITIONS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (def.query.isPublished !== undefined) {
      where.isPublished = def.query.isPublished;
    }

    if (def.query.startTimeAfterNow) {
      where.startTime = { gt: now };
    }

    if (def.query.startTimeBeforeNow) {
      where.startTime = { lt: now };
    }

    if (def.query.hasCapacity) {
      where.capacity = { not: null };
    }

    if (def.query.noCapacity) {
      where.capacity = null;
    }

    const event = await prisma.event.findFirst({
      where,
      select: {
        id: true,
        title: true,
        category: true,
        startTime: true,
        isPublished: true,
        capacity: true,
        _count: {
          select: {
            registrations: true,
          },
        },
        registrations: {
          where: { status: "WAITLISTED" },
          select: { id: true },
        },
      },
      orderBy: { startTime: def.query.startTimeBeforeNow ? "desc" : "asc" },
    });

    // Additional filtering for full/not-full
    if (event && def.query.notFull) {
      if (event.capacity && event._count.registrations >= event.capacity) {
        // Skip this event, find another
        const altEvent = await prisma.event.findFirst({
          where: {
            ...where,
            id: { not: event.id },
          },
          select: {
            id: true,
            title: true,
            category: true,
            startTime: true,
            isPublished: true,
            capacity: true,
            _count: { select: { registrations: true } },
            registrations: { where: { status: "WAITLISTED" }, select: { id: true } },
          },
          orderBy: { startTime: "asc" },
        });
        if (altEvent && (!altEvent.capacity || altEvent._count.registrations < altEvent.capacity)) {
          scenarios.push({
            category: "event",
            id: `event-${def.eventState}`,
            eventState: def.eventState,
            label: def.label,
            description: def.description,
            event: {
              id: altEvent.id,
              title: altEvent.title,
              category: altEvent.category,
              startTime: altEvent.startTime.toISOString(),
              isPublished: altEvent.isPublished,
              capacity: altEvent.capacity,
              registrationCount: altEvent._count.registrations,
              waitlistCount: altEvent.registrations.length,
            },
            deepLink: `/admin/events/${altEvent.id}`,
            demoNotes: def.demoNotes,
          });
          continue;
        }
      }
    }

    if (event && def.query.isFull) {
      if (!event.capacity || event._count.registrations < event.capacity) {
        // Not full, skip
        scenarios.push({
          category: "event",
          id: `event-${def.eventState}`,
          eventState: def.eventState,
          label: def.label,
          description: def.description,
          event: null,
          deepLink: null,
          demoNotes: `${def.demoNotes} (No full events found)`,
        });
        continue;
      }
    }

    if (event) {
      scenarios.push({
        category: "event",
        id: `event-${def.eventState}`,
        eventState: def.eventState,
        label: def.label,
        description: def.description,
        event: {
          id: event.id,
          title: event.title,
          category: event.category,
          startTime: event.startTime.toISOString(),
          isPublished: event.isPublished,
          capacity: event.capacity,
          registrationCount: event._count.registrations,
          waitlistCount: event.registrations.length,
        },
        deepLink: `/admin/events/${event.id}`,
        demoNotes: def.demoNotes,
      });
    } else {
      scenarios.push({
        category: "event",
        id: `event-${def.eventState}`,
        eventState: def.eventState,
        label: def.label,
        description: def.description,
        event: null,
        deepLink: null,
        demoNotes: `${def.demoNotes} (No matching event)`,
      });
    }
  }

  return scenarios;
}

// ============================================================================
// Route Handler
// ============================================================================

export async function GET(req: NextRequest) {
  // Require admin capability
  const auth = await requireCapability(req, "admin:full");
  if (!auth.ok) return auth.response;

  // Fetch all scenario types in parallel
  const [lifecycleScenarios, roleScenarios, eventScenarios] = await Promise.all([
    getLifecycleScenarios(),
    getRoleScenarios(),
    getEventScenarios(),
  ]);

  const allScenarios: Scenario[] = [
    ...roleScenarios,
    ...lifecycleScenarios,
    ...eventScenarios,
  ];

  // Calculate summaries per category
  const summary = {
    total: allScenarios.length,
    available: allScenarios.filter((s) => {
      if (s.category === "lifecycle") return s.member !== null;
      if (s.category === "role") return s.member !== null;
      if (s.category === "event") return s.event !== null;
      return false;
    }).length,
    missing: 0,
    byCategory: {
      lifecycle: {
        total: lifecycleScenarios.length,
        available: lifecycleScenarios.filter((s) => s.member !== null).length,
      },
      role: {
        total: roleScenarios.length,
        available: roleScenarios.filter((s) => s.member !== null).length,
      },
      event: {
        total: eventScenarios.length,
        available: eventScenarios.filter((s) => s.event !== null).length,
      },
    },
  };
  summary.missing = summary.total - summary.available;

  return NextResponse.json({
    scenarios: allScenarios,
    summary,
  });
}
