/**
 * Membership Lifecycle Contract Tests
 *
 * Charter Principles:
 * - P3: State machines over ad-hoc booleans (explicit workflow states)
 * - P4: No hidden rules (behavior explainable in plain English)
 * - P6: Human-first UI language (consistent labeling)
 *
 * Tests the membership lifecycle state machine contracts:
 * 1. Valid transitions: only allowed state transitions succeed
 * 2. Invalid transitions: disallowed transitions fail consistently
 * 3. State labels: derived labels are consistent
 * 4. Boundary conditions: 90-day newbie, 730-day two-year mark
 *
 * These tests are deterministic and test pure functions.
 */

import { describe, it, expect } from "vitest";
import {
  inferLifecycleState,
  explainMemberLifecycle,
  type MemberLifecycleInput,
  type LifecycleState,
  type LifecycleEvent,
} from "../../src/lib/membership/lifecycle";

// ============================================================================
// Helpers
// ============================================================================

/**
 * Create a date N days ago.
 */
function daysAgo(days: number): Date {
  const now = new Date();
  const result = new Date(now);
  result.setDate(result.getDate() - days);
  return result;
}

/**
 * Create standard test input with overrides.
 */
function createInput(overrides: Partial<MemberLifecycleInput> = {}): MemberLifecycleInput {
  return {
    membershipStatusCode: "active",
    membershipTierCode: "member",
    joinedAt: daysAgo(180), // Default: 180 days ago (active_member)
    waMembershipLevelRaw: null,
    ...overrides,
  };
}

// ============================================================================
// A) STATE MACHINE TRANSITION TABLE
// ============================================================================

describe("Lifecycle Contract: Transition Table", () => {
  /**
   * The canonical transition table for membership lifecycle.
   * Each row defines: fromState -> event -> toState
   *
   * This is the source of truth for allowed transitions.
   */
  const TRANSITION_TABLE: Array<{
    from: LifecycleState;
    event: LifecycleEvent;
    to: LifecycleState;
    automatic: boolean;
  }> = [
    // From pending_new
    { from: "pending_new", event: "join_approved", to: "active_newbie", automatic: false },

    // From active_newbie
    { from: "active_newbie", event: "newbie_90_days_elapsed", to: "active_member", automatic: true },
    { from: "active_newbie", event: "suspension_applied", to: "suspended", automatic: false },

    // From active_member
    { from: "active_member", event: "two_year_mark_reached", to: "offer_extended", automatic: true },
    { from: "active_member", event: "suspension_applied", to: "suspended", automatic: false },

    // From offer_extended
    { from: "offer_extended", event: "extended_paid", to: "active_extended", automatic: false },
    { from: "offer_extended", event: "extended_declined", to: "lapsed", automatic: false },
    { from: "offer_extended", event: "payment_failed", to: "lapsed", automatic: true },

    // From active_extended
    { from: "active_extended", event: "membership_end_reached", to: "lapsed", automatic: true },
    { from: "active_extended", event: "suspension_applied", to: "suspended", automatic: false },

    // From suspended
    { from: "suspended", event: "suspension_lifted", to: "active_member", automatic: false },

    // From not_a_member
    { from: "not_a_member", event: "join_approved", to: "active_newbie", automatic: false },
  ];

  it("transition table has all expected entries", () => {
    expect(TRANSITION_TABLE.length).toBeGreaterThan(10);
  });

  it("all transitions from pending_new are defined", () => {
    const transitions = TRANSITION_TABLE.filter((t) => t.from === "pending_new");
    expect(transitions.some((t) => t.event === "join_approved")).toBe(true);
    expect(transitions.some((t) => t.to === "active_newbie")).toBe(true);
  });

  it("all transitions from active_newbie are defined", () => {
    const transitions = TRANSITION_TABLE.filter((t) => t.from === "active_newbie");
    expect(transitions.some((t) => t.event === "newbie_90_days_elapsed")).toBe(true);
    expect(transitions.some((t) => t.event === "suspension_applied")).toBe(true);
  });

  it("all transitions from active_member are defined", () => {
    const transitions = TRANSITION_TABLE.filter((t) => t.from === "active_member");
    expect(transitions.some((t) => t.event === "two_year_mark_reached")).toBe(true);
    expect(transitions.some((t) => t.event === "suspension_applied")).toBe(true);
  });

  it("all transitions from offer_extended are defined", () => {
    const transitions = TRANSITION_TABLE.filter((t) => t.from === "offer_extended");
    expect(transitions.some((t) => t.event === "extended_paid")).toBe(true);
    expect(transitions.some((t) => t.event === "extended_declined")).toBe(true);
    expect(transitions.some((t) => t.event === "payment_failed")).toBe(true);
  });

  it("lapsed has no outgoing transitions (terminal state)", () => {
    const transitions = TRANSITION_TABLE.filter((t) => t.from === "lapsed");
    expect(transitions.length).toBe(0);
  });

  it("unknown has no outgoing transitions (requires manual resolution)", () => {
    const transitions = TRANSITION_TABLE.filter((t) => t.from === "unknown");
    expect(transitions.length).toBe(0);
  });
});

// ============================================================================
// B) DISALLOWED TRANSITIONS
// ============================================================================

describe("Lifecycle Contract: Disallowed Transitions", () => {
  /**
   * These transitions are NOT allowed and should never occur.
   */
  const DISALLOWED_TRANSITIONS: Array<{
    from: LifecycleState;
    to: LifecycleState;
    reason: string;
  }> = [
    // Cannot skip newbie period
    { from: "pending_new", to: "active_member", reason: "Must go through newbie period" },
    { from: "pending_new", to: "active_extended", reason: "Cannot start as extended" },

    // Cannot go backwards in lifecycle
    { from: "active_member", to: "active_newbie", reason: "Cannot revert to newbie" },
    { from: "active_extended", to: "active_member", reason: "Cannot downgrade from extended" },
    { from: "lapsed", to: "active_member", reason: "Lapsed requires new application" },

    // Cannot skip offer_extended
    { from: "active_member", to: "active_extended", reason: "Must go through offer" },
  ];

  it("disallowed transitions are documented", () => {
    expect(DISALLOWED_TRANSITIONS.length).toBeGreaterThan(0);
  });

  for (const transition of DISALLOWED_TRANSITIONS) {
    it(`disallows ${transition.from} -> ${transition.to}: ${transition.reason}`, () => {
      // Verify by checking that no valid event leads to this transition
      const explanation = explainMemberLifecycle(
        createInput({
          membershipStatusCode: transition.from === "active_newbie" ? "active" : transition.from,
          membershipTierCode:
            transition.from === "active_newbie"
              ? "newbie_member"
              : transition.from === "active_member"
                ? "member"
                : transition.from === "active_extended"
                  ? "extended_member"
                  : "member",
          joinedAt: daysAgo(200),
        })
      );

      // The next transitions should not include the disallowed target
      const toStates = explanation.nextTransitions.map((t) => t.toState);
      expect(toStates).not.toContain(transition.to);
    });
  }
});

// ============================================================================
// C) STATE LABEL CONSISTENCY
// ============================================================================

describe("Lifecycle Contract: State Labels", () => {
  /**
   * Every state must have a human-readable label (P6).
   */
  const EXPECTED_LABELS: Record<LifecycleState, string> = {
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

  for (const [state, expectedLabel] of Object.entries(EXPECTED_LABELS)) {
    it(`state ${state} has label "${expectedLabel}"`, () => {
      // Find an input that produces this state
      let input: MemberLifecycleInput;

      switch (state) {
        case "not_a_member":
          input = createInput({ membershipStatusCode: "not_a_member" });
          break;
        case "pending_new":
          input = createInput({ membershipStatusCode: "pending_new" });
          break;
        case "active_newbie":
          input = createInput({
            membershipTierCode: "newbie_member",
            joinedAt: daysAgo(30),
          });
          break;
        case "active_member":
          input = createInput({
            membershipTierCode: "member",
            joinedAt: daysAgo(200),
          });
          break;
        case "offer_extended":
          input = createInput({
            membershipTierCode: "member",
            joinedAt: daysAgo(800),
          });
          break;
        case "active_extended":
          input = createInput({ membershipTierCode: "extended_member" });
          break;
        case "lapsed":
          input = createInput({ membershipStatusCode: "lapsed" });
          break;
        case "suspended":
          input = createInput({ membershipStatusCode: "suspended" });
          break;
        case "unknown":
          input = createInput({ membershipTierCode: null });
          break;
        default:
          throw new Error(`Unknown state: ${state}`);
      }

      const explanation = explainMemberLifecycle(input);
      expect(explanation.currentState).toBe(state);
      expect(explanation.stateLabel).toBe(expectedLabel);
    });
  }

  it("all labels are non-empty strings", () => {
    for (const label of Object.values(EXPECTED_LABELS)) {
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// D) BOUNDARY CONDITIONS
// ============================================================================

describe("Lifecycle Contract: Boundary Conditions", () => {
  const NEWBIE_PERIOD_DAYS = 90;
  const TWO_YEAR_DAYS = 730;

  describe("90-day newbie boundary", () => {
    it("day 89 is active_newbie", () => {
      const input = createInput({
        membershipTierCode: "newbie_member",
        joinedAt: daysAgo(NEWBIE_PERIOD_DAYS - 1),
      });
      expect(inferLifecycleState(input)).toBe("active_newbie");
    });

    it("day 90 is active_member", () => {
      const input = createInput({
        membershipTierCode: "newbie_member",
        joinedAt: daysAgo(NEWBIE_PERIOD_DAYS),
      });
      expect(inferLifecycleState(input)).toBe("active_member");
    });

    it("day 91 is active_member", () => {
      const input = createInput({
        membershipTierCode: "newbie_member",
        joinedAt: daysAgo(NEWBIE_PERIOD_DAYS + 1),
      });
      expect(inferLifecycleState(input)).toBe("active_member");
    });
  });

  describe("730-day two-year boundary", () => {
    it("day 729 is active_member", () => {
      const input = createInput({
        membershipTierCode: "member",
        joinedAt: daysAgo(TWO_YEAR_DAYS - 1),
      });
      expect(inferLifecycleState(input)).toBe("active_member");
    });

    it("day 730 is offer_extended", () => {
      const input = createInput({
        membershipTierCode: "member",
        joinedAt: daysAgo(TWO_YEAR_DAYS),
      });
      expect(inferLifecycleState(input)).toBe("offer_extended");
    });

    it("day 731 is offer_extended", () => {
      const input = createInput({
        membershipTierCode: "member",
        joinedAt: daysAgo(TWO_YEAR_DAYS + 1),
      });
      expect(inferLifecycleState(input)).toBe("offer_extended");
    });
  });
});

// ============================================================================
// E) STATUS CODE PRECEDENCE
// ============================================================================

describe("Lifecycle Contract: Status Code Precedence", () => {
  /**
   * Non-active status codes take precedence over tier-based inference.
   */

  it("lapsed status takes precedence", () => {
    const input = createInput({
      membershipStatusCode: "lapsed",
      membershipTierCode: "extended_member", // Would be active_extended if active
    });
    expect(inferLifecycleState(input)).toBe("lapsed");
  });

  it("suspended status takes precedence", () => {
    const input = createInput({
      membershipStatusCode: "suspended",
      membershipTierCode: "member",
    });
    expect(inferLifecycleState(input)).toBe("suspended");
  });

  it("pending_new status takes precedence", () => {
    const input = createInput({
      membershipStatusCode: "pending_new",
      membershipTierCode: "newbie_member",
    });
    expect(inferLifecycleState(input)).toBe("pending_new");
  });

  it("not_a_member status takes precedence", () => {
    const input = createInput({
      membershipStatusCode: "not_a_member",
      membershipTierCode: "member",
    });
    expect(inferLifecycleState(input)).toBe("not_a_member");
  });
});

// ============================================================================
// F) NARRATIVE CONSISTENCY
// ============================================================================

describe("Lifecycle Contract: Narrative Generation", () => {
  it("narratives are non-empty for all states", () => {
    const testCases: MemberLifecycleInput[] = [
      createInput({ membershipStatusCode: "lapsed" }),
      createInput({ membershipStatusCode: "suspended" }),
      createInput({ membershipStatusCode: "pending_new" }),
      createInput({ membershipStatusCode: "not_a_member" }),
      createInput({ membershipTierCode: "newbie_member", joinedAt: daysAgo(30) }),
      createInput({ membershipTierCode: "member", joinedAt: daysAgo(200) }),
      createInput({ membershipTierCode: "member", joinedAt: daysAgo(800) }),
      createInput({ membershipTierCode: "extended_member" }),
      createInput({ membershipTierCode: null }),
    ];

    for (const input of testCases) {
      const explanation = explainMemberLifecycle(input);
      expect(explanation.narrative).toBeTruthy();
      expect(explanation.narrative.length).toBeGreaterThan(20);
    }
  });

  it("narratives use human-friendly language (P6)", () => {
    const newbieInput = createInput({
      membershipTierCode: "newbie_member",
      joinedAt: daysAgo(30),
    });
    const explanation = explainMemberLifecycle(newbieInput);

    // Should use human-friendly terms, not technical codes
    expect(explanation.narrative).toContain("member");
    expect(explanation.narrative.toLowerCase()).not.toContain("newbie_member");
  });
});

// ============================================================================
// G) MILESTONE CALCULATION
// ============================================================================

describe("Lifecycle Contract: Milestone Calculation", () => {
  it("calculates newbie end date correctly", () => {
    const joinDate = daysAgo(30);
    const input = createInput({
      membershipTierCode: "newbie_member",
      joinedAt: joinDate,
    });

    const explanation = explainMemberLifecycle(input);

    // Newbie end date should be 90 days after join
    const expectedEnd = new Date(joinDate);
    expectedEnd.setDate(expectedEnd.getDate() + 90);

    expect(explanation.milestones.newbieEndDate.toDateString()).toBe(
      expectedEnd.toDateString()
    );
  });

  it("calculates two-year mark correctly", () => {
    const joinDate = daysAgo(100);
    const input = createInput({
      membershipTierCode: "member",
      joinedAt: joinDate,
    });

    const explanation = explainMemberLifecycle(input);

    // Two-year mark should be 730 days after join
    const expectedMark = new Date(joinDate);
    expectedMark.setDate(expectedMark.getDate() + 730);

    expect(explanation.milestones.twoYearMark.toDateString()).toBe(
      expectedMark.toDateString()
    );
  });

  it("isNewbiePeriod is accurate", () => {
    // Day 30 - should be in newbie period
    const newbieInput = createInput({
      membershipTierCode: "newbie_member",
      joinedAt: daysAgo(30),
    });
    expect(explainMemberLifecycle(newbieInput).milestones.isNewbiePeriod).toBe(true);

    // Day 100 - should be past newbie period
    const memberInput = createInput({
      membershipTierCode: "member",
      joinedAt: daysAgo(100),
    });
    expect(explainMemberLifecycle(memberInput).milestones.isNewbiePeriod).toBe(false);
  });

  it("isPastTwoYears is accurate", () => {
    // Day 200 - should NOT be past two years
    const earlyInput = createInput({
      membershipTierCode: "member",
      joinedAt: daysAgo(200),
    });
    expect(explainMemberLifecycle(earlyInput).milestones.isPastTwoYears).toBe(false);

    // Day 800 - should be past two years
    const lateInput = createInput({
      membershipTierCode: "member",
      joinedAt: daysAgo(800),
    });
    expect(explainMemberLifecycle(lateInput).milestones.isPastTwoYears).toBe(true);
  });
});
