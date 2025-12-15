/**
 * Service History Scheduler
 *
 * Handles scheduled operations:
 * 1. Apply approved transitions that are due
 * 2. Close completed event host service records
 *
 * Designed to be called by a daily cron job at 8:00 UTC
 * (midnight Pacific during PST, 1am during PDT).
 */

import { getDueTransitions, applyTransition } from "./transitions";
import { closeCompletedEventHostServices } from "./eventHostService";
import type { SchedulerResult } from "./types";
import { clubYmdString } from "@/lib/timezone";

/**
 * Process all scheduled operations
 *
 * This is the main entry point for the cron job.
 * It is designed to be idempotent - running it multiple times
 * will not cause duplicate operations.
 */
export async function processScheduledOperations(
  systemUserId: string
): Promise<SchedulerResult> {
  const result: SchedulerResult = {
    transitionsApplied: [],
    transitionErrors: [],
    eventHostsClosed: 0,
  };

  // 1. Process due transitions
  const dueTransitions = await getDueTransitions();

  for (const transition of dueTransitions) {
    try {
      const applyResult = await applyTransition(transition.id, systemUserId);
      if (applyResult.success) {
        result.transitionsApplied.push(transition.id);
      }
    } catch (error) {
      result.transitionErrors.push({
        planId: transition.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // 2. Close completed event host services
  try {
    result.eventHostsClosed = await closeCompletedEventHostServices();
  } catch (error) {
    // Log but don't fail the whole operation
    console.error("Error closing event host services:", error);
  }

  return result;
}

/**
 * Get the next scheduled transition dates
 *
 * Returns Feb 1 and Aug 1 of the current and next year
 * that are still in the future.
 */
export function getUpcomingTransitionDates(): Date[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const dates: Date[] = [];

  // Generate dates for current year and next year
  for (const year of [currentYear, currentYear + 1]) {
    // Feb 1 at midnight Pacific Time
    // During PST (standard time), midnight Pacific = 8:00 UTC
    dates.push(new Date(Date.UTC(year, 1, 1, 8, 0, 0))); // Feb 1

    // Aug 1 at midnight Pacific Time
    // During PDT (daylight time), midnight Pacific = 7:00 UTC
    dates.push(new Date(Date.UTC(year, 7, 1, 7, 0, 0))); // Aug 1
  }

  // Filter to only future dates
  return dates.filter((date) => date > now).sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Check if a date is a transition date (Feb 1 or Aug 1)
 */
export function isTransitionDate(date: Date): boolean {
  // Get the date in Pacific Time as YYYY-MM-DD string
  const ymdStr = clubYmdString(date);
  // Extract month and day (format: YYYY-MM-DD)
  const month = parseInt(ymdStr.slice(5, 7));
  const day = parseInt(ymdStr.slice(8, 10));

  return (month === 2 && day === 1) || (month === 8 && day === 1);
}

/**
 * Get the next transition date from a given date
 */
export function getNextTransitionDate(from: Date = new Date()): Date {
  const year = from.getFullYear();

  // Check Feb 1 of current year
  const feb1 = new Date(Date.UTC(year, 1, 1, 8, 0, 0));
  if (feb1 > from) return feb1;

  // Check Aug 1 of current year
  const aug1 = new Date(Date.UTC(year, 7, 1, 7, 0, 0));
  if (aug1 > from) return aug1;

  // Return Feb 1 of next year
  return new Date(Date.UTC(year + 1, 1, 1, 8, 0, 0));
}

/**
 * Validate that a proposed transition effectiveAt is on a valid transition date
 */
export function validateTransitionDate(effectiveAt: Date): {
  valid: boolean;
  message?: string;
} {
  if (!isTransitionDate(effectiveAt)) {
    const next = getNextTransitionDate(new Date());
    return {
      valid: false,
      message: `Transition effective dates must be Feb 1 or Aug 1 at midnight Pacific Time. Next valid date: ${next.toISOString()}`,
    };
  }

  return { valid: true };
}
