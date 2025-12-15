/**
 * Transition Widget Logic
 *
 * Provides visibility and data for the dashboard transition countdown widget.
 * The widget is visible only to President and Past President during the
 * configurable lead time before each semi-annual transition (Feb 1 / Aug 1).
 *
 * Term boundaries:
 * - Winter term: Aug 1 through Jan 31
 * - Summer term: Feb 1 through Jul 31
 *
 * Transitions occur at 00:00 America/Los_Angeles on Feb 1 and Aug 1.
 */

import { prisma } from "@/lib/prisma";
import { ServiceType, TransitionStatus } from "@prisma/client";
import { formatClubDate, startOfClubDayUtc, clubYmdString } from "@/lib/timezone";
import { getTransitionWidgetLeadDays } from "@/lib/config";
import { getNextTransitionDate } from "./scheduler";
import type {
  TransitionWidgetData,
  TransitionWidgetContext,
  TransitionWidgetPlanStatus,
  TransitionWidgetRole,
  TermBoundaries,
} from "./types";

// Re-export config function for backwards compatibility
export { getTransitionWidgetLeadDays as getTransitionLeadDays };

// ============================================================================
// Term Boundary Logic
// ============================================================================

/**
 * Get the UTC instant for midnight Pacific Time on a given date.
 * Feb 1 during PST = 08:00 UTC
 * Aug 1 during PDT = 07:00 UTC
 */
function getMidnightPacificUtc(year: number, month: number, day: number): Date {
  // PST offset is -8, PDT offset is -7
  // Feb 1 is in PST (standard time), Aug 1 is in PDT (daylight time)
  const isPdt = month >= 3 && month <= 10; // Mar through Oct (rough DST)
  const utcOffset = isPdt ? 7 : 8;
  return new Date(Date.UTC(year, month, day, utcOffset, 0, 0));
}

/**
 * Get the term boundaries for a given date.
 *
 * Returns the start and end dates for the current term and next term.
 * All dates are at midnight Pacific Time.
 */
export function getTermBoundaries(now: Date = new Date()): TermBoundaries {
  const ymdStr = clubYmdString(now);
  const year = parseInt(ymdStr.slice(0, 4));
  const month = parseInt(ymdStr.slice(5, 7));

  // Determine which term we're in based on Pacific Time date
  // Winter term: Aug 1 - Jan 31 (months 8-12 and 1)
  // Summer term: Feb 1 - Jul 31 (months 2-7)

  let currentTermStart: Date;
  let currentTermEnd: Date;
  let nextTermStart: Date;
  let nextTermEnd: Date;

  if (month >= 2 && month <= 7) {
    // We're in Summer term (Feb 1 - Jul 31)
    currentTermStart = getMidnightPacificUtc(year, 1, 1); // Feb 1
    currentTermEnd = getMidnightPacificUtc(year, 7, 1);   // Aug 1 (end of summer = start of winter)
    nextTermStart = getMidnightPacificUtc(year, 7, 1);    // Aug 1
    nextTermEnd = getMidnightPacificUtc(year + 1, 1, 1);  // Feb 1 next year
  } else if (month >= 8) {
    // We're in Winter term, second half (Aug - Dec)
    currentTermStart = getMidnightPacificUtc(year, 7, 1);     // Aug 1
    currentTermEnd = getMidnightPacificUtc(year + 1, 1, 1);   // Feb 1 next year
    nextTermStart = getMidnightPacificUtc(year + 1, 1, 1);    // Feb 1 next year
    nextTermEnd = getMidnightPacificUtc(year + 1, 7, 1);      // Aug 1 next year
  } else {
    // We're in Winter term, first half (Jan)
    currentTermStart = getMidnightPacificUtc(year - 1, 7, 1); // Aug 1 previous year
    currentTermEnd = getMidnightPacificUtc(year, 1, 1);       // Feb 1
    nextTermStart = getMidnightPacificUtc(year, 1, 1);        // Feb 1
    nextTermEnd = getMidnightPacificUtc(year, 7, 1);          // Aug 1
  }

  return {
    currentTermStart,
    currentTermEnd,
    nextTermStart,
    nextTermEnd,
  };
}

/**
 * Check if a given date is within the lead window before a term end date.
 *
 * @param now - The current date/time
 * @param termEndDate - The end date of the term (transition date)
 * @param leadDays - Number of days before term end when window opens
 * @returns true if now is within [termEnd - leadDays, termEnd)
 */
export function isWithinLeadWindow(
  now: Date,
  termEndDate: Date,
  leadDays: number
): boolean {
  const showAt = calculateShowAtDate(termEndDate, leadDays);
  return now >= showAt && now < termEndDate;
}

/**
 * Check if a member is currently serving as President.
 */
async function isCurrentPresident(memberId: string): Promise<boolean> {
  const record = await prisma.memberServiceHistory.findFirst({
    where: {
      memberId,
      serviceType: ServiceType.BOARD_OFFICER,
      roleTitle: "President",
      endAt: null,
    },
  });
  return record !== null;
}

/**
 * Check if a member is currently serving as Past President.
 */
async function isCurrentPastPresident(memberId: string): Promise<boolean> {
  const record = await prisma.memberServiceHistory.findFirst({
    where: {
      memberId,
      serviceType: ServiceType.BOARD_OFFICER,
      roleTitle: "Past President",
      endAt: null,
    },
  });
  return record !== null;
}

/**
 * Get the transition widget context for a member.
 * Returns null if the member is neither President nor Past President.
 */
export async function getTransitionWidgetContext(
  memberId: string
): Promise<TransitionWidgetContext | null> {
  const [isPresident, isPastPresident] = await Promise.all([
    isCurrentPresident(memberId),
    isCurrentPastPresident(memberId),
  ]);

  if (!isPresident && !isPastPresident) {
    return null;
  }

  // Prefer president role if member holds both (unlikely but possible)
  const widgetRole: TransitionWidgetRole = isPresident ? "president" : "past-president";

  return {
    memberId,
    widgetRole,
    isPresident,
    isPastPresident,
  };
}

/**
 * Calculate the show-at date: when the widget should become visible.
 * This is leadDays calendar days before the transition date.
 */
export function calculateShowAtDate(transitionDate: Date, leadDays: number): Date {
  // Get midnight Pacific of the transition date
  const transitionMidnight = startOfClubDayUtc(transitionDate);
  // Subtract leadDays worth of milliseconds
  const showAtMs = transitionMidnight.getTime() - leadDays * 24 * 60 * 60 * 1000;
  return new Date(showAtMs);
}

/**
 * Calculate days remaining until transition.
 * Uses Pacific Time calendar days, not exact milliseconds.
 */
export function calculateDaysRemaining(now: Date, transitionDate: Date): number {
  const nowMidnight = startOfClubDayUtc(now);
  const transitionMidnight = startOfClubDayUtc(transitionDate);
  const diffMs = transitionMidnight.getTime() - nowMidnight.getTime();
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Determine the term name for a transition date.
 * Feb 1 transitions start the Summer term.
 * Aug 1 transitions start the Winter term.
 */
export function getTermNameForTransition(transitionDate: Date): string {
  const month = transitionDate.getUTCMonth();
  const year = transitionDate.getUTCFullYear();

  // Feb 1 (month 1) starts Summer term
  // Aug 1 (month 7) starts Winter term
  if (month === 1) {
    return `Summer ${year}`;
  } else {
    // Winter term spans year boundary, named by start year
    return `Winter ${year}/${year + 1}`;
  }
}

/**
 * Check if the widget should be visible at a given time.
 */
export function isWidgetVisible(
  now: Date,
  transitionDate: Date,
  leadDays: number
): boolean {
  const showAt = calculateShowAtDate(transitionDate, leadDays);
  return now >= showAt && now < transitionDate;
}

/**
 * Get the transition plan for the upcoming transition, if one exists.
 */
async function getUpcomingTransitionPlan(
  effectiveAt: Date
): Promise<TransitionWidgetPlanStatus | null> {
  // Find a plan with effectiveAt on the same day
  const startOfDay = startOfClubDayUtc(effectiveAt);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const plan = await prisma.transitionPlan.findFirst({
    where: {
      effectiveAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
      status: {
        not: TransitionStatus.CANCELLED,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!plan) {
    return null;
  }

  return {
    id: plan.id,
    name: plan.name,
    status: plan.status,
    presidentApproved: plan.presidentApprovedAt !== null,
    vpActivitiesApproved: plan.vpActivitiesApprovedAt !== null,
  };
}

/**
 * Get the transition widget data for a member.
 *
 * Returns data with visible=false if:
 * - Member is not President or Past President
 * - Current date is outside the visibility window
 */
export async function getTransitionWidgetData(
  memberId: string,
  now: Date = new Date()
): Promise<TransitionWidgetData> {
  const leadDays = getTransitionWidgetLeadDays();
  const nextTransition = getNextTransitionDate(now);
  const daysRemaining = calculateDaysRemaining(now, nextTransition);
  const termName = getTermNameForTransition(nextTransition);

  // Check if member can see the widget
  const context = await getTransitionWidgetContext(memberId);
  if (!context) {
    return {
      visible: false,
      nextTransitionDate: nextTransition.toISOString(),
      nextTransitionDateFormatted: formatClubDate(nextTransition),
      daysRemaining,
      termName,
      plan: null,
    };
  }

  // Check if within visibility window
  const visible = isWidgetVisible(now, nextTransition, leadDays);
  if (!visible) {
    return {
      visible: false,
      nextTransitionDate: nextTransition.toISOString(),
      nextTransitionDateFormatted: formatClubDate(nextTransition),
      daysRemaining,
      termName,
      plan: null,
    };
  }

  // Widget is visible - get plan status
  const plan = await getUpcomingTransitionPlan(nextTransition);

  return {
    visible: true,
    nextTransitionDate: nextTransition.toISOString(),
    nextTransitionDateFormatted: formatClubDate(nextTransition),
    daysRemaining,
    termName,
    plan,
  };
}

/**
 * Get full widget data including context (for API response).
 */
export async function getTransitionWidgetDataWithContext(
  memberId: string,
  now: Date = new Date()
): Promise<{
  widget: TransitionWidgetData;
  context: TransitionWidgetContext | null;
  config: { leadDays: number };
}> {
  const leadDays = getTransitionWidgetLeadDays();
  const context = await getTransitionWidgetContext(memberId);
  const widget = await getTransitionWidgetData(memberId, now);

  return {
    widget,
    context,
    config: { leadDays },
  };
}
