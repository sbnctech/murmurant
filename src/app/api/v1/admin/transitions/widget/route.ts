import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hasCapability } from "@/lib/auth";
import { errors } from "@/lib/api";
import {
  getTransitionWidgetDataWithContext,
  getTransitionWidgetContext,
} from "@/lib/serviceHistory";

/**
 * GET /api/v1/admin/transitions/widget
 *
 * Returns the transition countdown widget data for the authenticated user.
 *
 * Visibility:
 * - Only visible to President and Past President (via service history check)
 * - Webmaster is explicitly forbidden
 * - Widget data includes visibility flag (may be false if outside lead window)
 *
 * Response:
 * - widget: { visible, nextTransitionDate, daysRemaining, termName, plan }
 * - context: { memberId, widgetRole, isPresident, isPastPresident } | null
 * - config: { leadDays }
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  // Charter N2: Use capability check - require transitions:view capability
  if (!hasCapability(auth.context.globalRole, "transitions:view")) {
    return errors.forbidden("transitions:view", auth.context.globalRole);
  }

  try {
    const memberId = auth.context.memberId;

    // Validate memberId is a valid UUID (test tokens may have invalid memberIds)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const hasValidMemberId = uuidRegex.test(memberId);

    // For admin users with invalid memberIds (test tokens), return widget data without context
    // Charter N2: Use capability check instead of role string
    if (!hasValidMemberId) {
      if (hasCapability(auth.context.globalRole, "admin:full")) {
        // Admin can view widget for oversight - return basic widget data
        const { getTransitionWidgetLeadDays } = await import("@/lib/config");
        const { getNextTransitionDate, calculateDaysRemaining, getTermNameForTransition, isWidgetVisible } = await import("@/lib/serviceHistory");
        const { formatClubDate } = await import("@/lib/timezone");

        const leadDays = getTransitionWidgetLeadDays();
        const now = new Date();
        const nextTransitionDate = getNextTransitionDate(now);
        const daysRemaining = calculateDaysRemaining(now, nextTransitionDate);
        const termName = getTermNameForTransition(nextTransitionDate);
        const visible = isWidgetVisible(now, nextTransitionDate, leadDays);

        return NextResponse.json({
          widget: {
            visible,
            nextTransitionDate: nextTransitionDate.toISOString(),
            nextTransitionDateFormatted: formatClubDate(nextTransitionDate),
            daysRemaining,
            termName,
            plan: null,
          },
          context: null,
          config: { leadDays },
        });
      }
      return errors.forbidden("president or past-president", auth.context.globalRole);
    }

    // Check if user has widget access via board position
    const context = await getTransitionWidgetContext(memberId);

    // If user is not President or Past President, check if they have admin:full capability
    // Charter N2: Use capability check instead of role string
    if (!context && !hasCapability(auth.context.globalRole, "admin:full")) {
      return errors.forbidden("president or past-president", auth.context.globalRole);
    }

    // Get full widget data
    const data = await getTransitionWidgetDataWithContext(memberId);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching transition widget data:", error);
    if (error instanceof Error) {
      return errors.internal(error.message);
    }
    return errors.internal("Failed to fetch transition widget data");
  }
}
