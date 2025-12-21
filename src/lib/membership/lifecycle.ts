/**
 * Membership Lifecycle State Machine
 *
 * Deterministic inference of lifecycle state from member data.
 * Based on docs/MEMBERSHIP/MEMBERSHIP_LIFECYCLE_STATE_MACHINE.md
 *
 * This module is READ-ONLY - it infers state but never writes.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Lifecycle states as defined in the state machine document.
 */
export type LifecycleState =
  | "not_a_member"
  | "pending_new"
  | "active_newbie"
  | "active_member"
  | "offer_extended"
  | "active_extended"
  | "lapsed"
  | "suspended"
  | "unknown";

/**
 * Events that can trigger state transitions.
 */
export type LifecycleEvent =
  | "join_approved"
  | "newbie_90_days_elapsed"
  | "two_year_mark_reached"
  | "extended_offer_sent"
  | "extended_accepted"
  | "extended_paid"
  | "extended_declined"
  | "payment_failed"
  | "membership_end_reached"
  | "suspension_applied"
  | "suspension_lifted";

/**
 * Input data for lifecycle inference.
 */
export interface MemberLifecycleInput {
  membershipStatusCode: string; // e.g., "active", "lapsed", "pending_new", "suspended"
  membershipTierCode: string | null; // e.g., "newbie_member", "member", "extended_member", "unknown"
  joinedAt: Date;
  waMembershipLevelRaw: string | null; // For additional context
}

/**
 * Result of lifecycle state inference.
 */
export interface LifecycleExplanation {
  currentState: LifecycleState;
  stateLabel: string;
  stateDescription: string;

  // How they got here
  inferenceReason: string;
  relevantData: {
    membershipStatus: string;
    membershipTier: string | null;
    joinedAt: string;
    daysSinceJoin: number;
    waMembershipLevel: string | null;
  };

  // Timeline milestones
  milestones: {
    newbieEndDate: Date;
    twoYearMark: Date;
    isNewbiePeriod: boolean;
    isPastTwoYears: boolean;
  };

  // What happens next
  nextTransitions: Array<{
    event: LifecycleEvent;
    toState: LifecycleState;
    condition: string;
    isAutomatic: boolean;
    estimatedDate?: Date;
  }>;

  // Demo-friendly narrative
  narrative: string;
}

// ============================================================================
// Constants
// ============================================================================

const NEWBIE_PERIOD_DAYS = 90;
const TWO_YEAR_DAYS = 730;

const STATE_LABELS: Record<LifecycleState, string> = {
  not_a_member: "Not a Member",
  pending_new: "Pending New Member",
  active_newbie: "Active Newbie",
  active_member: "Active Member",
  offer_extended: "Extended Offer Pending",
  active_extended: "Active Extended Member",
  lapsed: "Lapsed",
  suspended: "Suspended",
  unknown: "Unknown / Needs Review",
};

const STATE_DESCRIPTIONS: Record<LifecycleState, string> = {
  not_a_member: "Contact record exists but has no membership privileges.",
  pending_new: "Membership application submitted; awaiting approval.",
  active_newbie: "Approved member in their first 90 days. Welcome period with special onboarding.",
  active_member: "Standard active member, past 90-day newbie period but before 2-year mark.",
  offer_extended: "Reached 2-year mark. Extended membership offer sent, awaiting response.",
  active_extended: "Extended membership accepted and paid. Full privileges continue.",
  lapsed: "Membership has ended. Historical record preserved but no active privileges.",
  suspended: "Membership temporarily suspended due to policy. No privileges until lifted.",
  unknown: "Data is incomplete or inconsistent. Requires admin review to resolve.",
};

// ============================================================================
// Utility Functions
// ============================================================================

function daysBetween(start: Date, end: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / msPerDay);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ============================================================================
// State Inference Logic
// ============================================================================

/**
 * Infer the lifecycle state from member data.
 * This is deterministic and read-only.
 */
export function inferLifecycleState(input: MemberLifecycleInput): LifecycleState {
  const { membershipStatusCode, membershipTierCode, joinedAt } = input;
  const now = new Date();
  const daysSinceJoin = daysBetween(joinedAt, now);

  // Priority 1: Non-active statuses map directly
  if (membershipStatusCode === "lapsed") return "lapsed";
  if (membershipStatusCode === "suspended") return "suspended";
  if (membershipStatusCode === "pending_new") return "pending_new";
  if (membershipStatusCode === "not_a_member") return "not_a_member";

  // Priority 2: Handle unknown/missing tier
  if (!membershipTierCode || membershipTierCode === "unknown") {
    return "unknown";
  }

  // Priority 3: Active status - infer from tier and time
  if (membershipStatusCode === "active") {
    // Extended member
    if (membershipTierCode === "extended_member") {
      return "active_extended";
    }

    // Newbie member - check if still in 90-day window
    if (membershipTierCode === "newbie_member") {
      if (daysSinceJoin < NEWBIE_PERIOD_DAYS) {
        return "active_newbie";
      }
      // Past newbie period but still tagged as newbie - treat as active_member
      return "active_member";
    }

    // Regular member - check 2-year mark
    if (membershipTierCode === "member") {
      if (daysSinceJoin >= TWO_YEAR_DAYS) {
        // Past 2 years but not extended - should be in offer_extended
        // (In practice, this depends on whether offer was sent)
        return "offer_extended";
      }
      return "active_member";
    }
  }

  // Fallback: unknown
  return "unknown";
}

/**
 * Get the next possible transitions from a state.
 */
function getNextTransitions(
  state: LifecycleState,
  milestones: LifecycleExplanation["milestones"]
): LifecycleExplanation["nextTransitions"] {
  const transitions: LifecycleExplanation["nextTransitions"] = [];

  switch (state) {
    case "pending_new":
      transitions.push({
        event: "join_approved",
        toState: "active_newbie",
        condition: "Admin approves membership application",
        isAutomatic: false,
      });
      break;

    case "active_newbie":
      transitions.push({
        event: "newbie_90_days_elapsed",
        toState: "active_member",
        condition: "90 days since join date",
        isAutomatic: true,
        estimatedDate: milestones.newbieEndDate,
      });
      transitions.push({
        event: "suspension_applied",
        toState: "suspended",
        condition: "Admin suspends membership",
        isAutomatic: false,
      });
      break;

    case "active_member":
      transitions.push({
        event: "two_year_mark_reached",
        toState: "offer_extended",
        condition: "2 years since join date",
        isAutomatic: true,
        estimatedDate: milestones.twoYearMark,
      });
      transitions.push({
        event: "suspension_applied",
        toState: "suspended",
        condition: "Admin suspends membership",
        isAutomatic: false,
      });
      break;

    case "offer_extended":
      transitions.push({
        event: "extended_paid",
        toState: "active_extended",
        condition: "Extended membership payment received",
        isAutomatic: false,
      });
      transitions.push({
        event: "extended_declined",
        toState: "lapsed",
        condition: "Member declines extended offer",
        isAutomatic: false,
      });
      transitions.push({
        event: "payment_failed",
        toState: "lapsed",
        condition: "Payment not received within grace period",
        isAutomatic: true,
      });
      break;

    case "active_extended":
      transitions.push({
        event: "membership_end_reached",
        toState: "lapsed",
        condition: "Extended membership term ends",
        isAutomatic: true,
      });
      transitions.push({
        event: "suspension_applied",
        toState: "suspended",
        condition: "Admin suspends membership",
        isAutomatic: false,
      });
      break;

    case "suspended":
      transitions.push({
        event: "suspension_lifted",
        toState: "active_member", // Simplified - would restore to prior state
        condition: "Admin lifts suspension",
        isAutomatic: false,
      });
      break;

    case "lapsed":
      // Lapsed is typically a terminal state; rejoining creates new record
      break;

    case "unknown":
      // Unknown requires manual resolution
      break;

    case "not_a_member":
      transitions.push({
        event: "join_approved",
        toState: "active_newbie",
        condition: "Membership application submitted and approved",
        isAutomatic: false,
      });
      break;
  }

  return transitions;
}

/**
 * Generate a demo-friendly narrative explanation.
 */
function generateNarrative(
  state: LifecycleState,
  input: MemberLifecycleInput,
  milestones: LifecycleExplanation["milestones"]
): string {
  const daysSinceJoin = daysBetween(input.joinedAt, new Date());

  switch (state) {
    case "active_newbie":
      const daysRemaining = NEWBIE_PERIOD_DAYS - daysSinceJoin;
      return `This member joined ${daysSinceJoin} days ago and is in their newbie welcome period. ` +
        `They have ${daysRemaining} days remaining before transitioning to regular member status. ` +
        `During this time, they receive special onboarding communications and support.`;

    case "active_member":
      const daysToTwoYear = TWO_YEAR_DAYS - daysSinceJoin;
      return `This member is an active member who completed their 90-day newbie period. ` +
        `They have ${daysToTwoYear} days until they reach the 2-year mark, when they'll be ` +
        `offered the opportunity to become an Extended Member.`;

    case "offer_extended":
      return `This member has reached their 2-year anniversary! An extended membership offer ` +
        `has been sent. They can accept and pay to continue as an Extended Member, or their ` +
        `membership will lapse if no response is received within the grace period.`;

    case "active_extended":
      return `This member accepted their extended membership offer and is now an Extended Member. ` +
        `They have full privileges and have demonstrated long-term commitment to the club.`;

    case "lapsed":
      return `This member's membership has ended. Their historical record is preserved for ` +
        `reference, but they no longer have active membership privileges. They may rejoin ` +
        `by submitting a new application.`;

    case "suspended":
      return `This member's privileges are temporarily suspended. An admin action is required ` +
        `to lift the suspension and restore their membership status.`;

    case "pending_new":
      return `This person has submitted a membership application and is awaiting approval. ` +
        `Once approved, they will become an Active Newbie and begin their 90-day welcome period.`;

    case "unknown":
      return `This member's status could not be determined from the available data. ` +
        `An admin should review their record to resolve any data issues and assign the ` +
        `correct membership tier.`;

    case "not_a_member":
      return `This is a contact record with no membership. They may be a past member, ` +
        `a prospective member, or a non-member contact.`;

    default:
      return `Membership status: ${state}`;
  }
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Generate a complete lifecycle explanation for a member.
 * This is the main entry point for the explainer panel.
 */
export function explainMemberLifecycle(input: MemberLifecycleInput): LifecycleExplanation {
  const now = new Date();
  const daysSinceJoin = daysBetween(input.joinedAt, now);

  // Calculate milestones
  const milestones = {
    newbieEndDate: addDays(input.joinedAt, NEWBIE_PERIOD_DAYS),
    twoYearMark: addDays(input.joinedAt, TWO_YEAR_DAYS),
    isNewbiePeriod: daysSinceJoin < NEWBIE_PERIOD_DAYS,
    isPastTwoYears: daysSinceJoin >= TWO_YEAR_DAYS,
  };

  // Infer current state
  const currentState = inferLifecycleState(input);

  // Build inference reason
  let inferenceReason: string;
  if (input.membershipStatusCode !== "active") {
    inferenceReason = `Membership status is "${input.membershipStatusCode}" which maps directly to this state.`;
  } else if (!input.membershipTierCode || input.membershipTierCode === "unknown") {
    inferenceReason = `Membership status is active but tier is unknown/missing. Needs admin review.`;
  } else if (input.membershipTierCode === "extended_member") {
    inferenceReason = `Active member with Extended Member tier indicates extended membership.`;
  } else if (input.membershipTierCode === "newbie_member" && milestones.isNewbiePeriod) {
    inferenceReason = `Active member with Newbie tier and within 90-day window (${daysSinceJoin} days since join).`;
  } else if (milestones.isPastTwoYears && input.membershipTierCode !== "extended_member") {
    inferenceReason = `Active member past 2-year mark (${daysSinceJoin} days) but not yet extended. Extended offer pending.`;
  } else {
    inferenceReason = `Active member with "${input.membershipTierCode}" tier, ${daysSinceJoin} days since join.`;
  }

  return {
    currentState,
    stateLabel: STATE_LABELS[currentState],
    stateDescription: STATE_DESCRIPTIONS[currentState],
    inferenceReason,
    relevantData: {
      membershipStatus: input.membershipStatusCode,
      membershipTier: input.membershipTierCode,
      joinedAt: input.joinedAt.toISOString().split("T")[0],
      daysSinceJoin,
      waMembershipLevel: input.waMembershipLevelRaw,
    },
    milestones,
    nextTransitions: getNextTransitions(currentState, milestones),
    narrative: generateNarrative(currentState, input, milestones),
  };
}
