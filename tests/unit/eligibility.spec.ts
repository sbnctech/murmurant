/**
 * Eligibility Logic Unit Tests
 *
 * Tests for pure eligibility evaluation functions in src/server/eligibility/eligibilityChecks.ts
 * These tests run without database dependencies.
 */

import { test, expect } from "@playwright/test";
import {
  evaluateEligibilityPure,
  checkMembershipOnDate,
  checkSponsorCommitteeMembership,
  checkWorkingCommitteeMembership,
} from "../../src/server/eligibility/eligibilityChecks";
import {
  EligibilityMemberData,
  EligibilityEventData,
} from "../../src/server/eligibility/types";

// Test fixtures
const baseDate = new Date("2025-03-15T10:00:00Z");

function createMember(
  overrides: Partial<EligibilityMemberData> = {}
): EligibilityMemberData {
  return {
    id: "member-1",
    joinedAt: new Date("2024-01-01"),
    membershipStatus: { code: "EXTENDED", isActive: true },
    committeeMemberships: [],
    ...overrides,
  };
}

function createEvent(
  overrides: Partial<EligibilityEventData> = {}
): EligibilityEventData {
  return {
    id: "event-1",
    startTime: baseDate,
    ticketTypes: [
      {
        id: "tt-member",
        code: "MEMBER_STANDARD",
        name: "Member Ticket",
        constraints: null,
        isActive: true,
      },
    ],
    sponsorships: [],
    eligibilityOverrides: [],
    ...overrides,
  };
}

test.describe("evaluateEligibilityPure", () => {
  test("returns MEMBER_NOT_FOUND when member is null", () => {
    const event = createEvent();
    const result = evaluateEligibilityPure(null, event, "MEMBER_STANDARD");

    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("MEMBER_NOT_FOUND");
  });

  test("returns EVENT_NOT_FOUND when event is null", () => {
    const member = createMember();
    const result = evaluateEligibilityPure(member, null, "MEMBER_STANDARD");

    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("EVENT_NOT_FOUND");
  });

  test("returns TICKET_TYPE_NOT_FOUND when ticket code does not exist", () => {
    const member = createMember();
    const event = createEvent();
    const result = evaluateEligibilityPure(member, event, "NONEXISTENT");

    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("TICKET_TYPE_NOT_FOUND");
  });

  test("allows active member for MEMBER_STANDARD ticket", () => {
    const member = createMember();
    const event = createEvent();
    const result = evaluateEligibilityPure(member, event, "MEMBER_STANDARD");

    expect(result.allowed).toBe(true);
    expect(result.reasonCode).toBe("ALLOWED");
  });

  test("denies inactive member for MEMBER_STANDARD ticket", () => {
    const member = createMember({
      membershipStatus: { code: "LAPSED", isActive: false },
    });
    const event = createEvent();
    const result = evaluateEligibilityPure(member, event, "MEMBER_STANDARD");

    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("NOT_MEMBER_ON_EVENT_DATE");
  });

  test("OVERRIDE_ALLOWED takes precedence over membership check", () => {
    const member = createMember({
      membershipStatus: { code: "LAPSED", isActive: false },
    });
    const event = createEvent({
      ticketTypes: [
        {
          id: "tt-member",
          code: "MEMBER_STANDARD",
          name: "Member Ticket",
          constraints: null,
          isActive: true,
        },
      ],
      eligibilityOverrides: [
        {
          ticketTypeId: "tt-member",
          memberId: "member-1",
          allow: true,
          reason: "VP approval",
        },
      ],
    });
    const result = evaluateEligibilityPure(member, event, "MEMBER_STANDARD");

    expect(result.allowed).toBe(true);
    expect(result.reasonCode).toBe("OVERRIDE_ALLOWED");
    expect(result.reasonDetail).toBe("VP approval");
  });

  test("OVERRIDE_DENIED blocks otherwise eligible member", () => {
    const member = createMember();
    const event = createEvent({
      ticketTypes: [
        {
          id: "tt-member",
          code: "MEMBER_STANDARD",
          name: "Member Ticket",
          constraints: null,
          isActive: true,
        },
      ],
      eligibilityOverrides: [
        {
          ticketTypeId: "tt-member",
          memberId: "member-1",
          allow: false,
          reason: "Behavior issue",
        },
      ],
    });
    const result = evaluateEligibilityPure(member, event, "MEMBER_STANDARD");

    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("OVERRIDE_DENIED");
    expect(result.reasonDetail).toBe("Behavior issue");
  });
});

test.describe("checkMembershipOnDate", () => {
  test("allows active member with no status restriction", () => {
    const member = {
      joinedAt: new Date("2024-01-01"),
      membershipStatus: { code: "EXTENDED", isActive: true },
    };
    const result = checkMembershipOnDate(member, baseDate);

    expect(result.allowed).toBe(true);
    expect(result.reasonCode).toBe("ALLOWED");
  });

  test("denies inactive member", () => {
    const member = {
      joinedAt: new Date("2024-01-01"),
      membershipStatus: { code: "LAPSED", isActive: false },
    };
    const result = checkMembershipOnDate(member, baseDate);

    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("NOT_MEMBER_ON_EVENT_DATE");
  });

  test("allows member with matching allowed status", () => {
    const member = {
      joinedAt: new Date("2024-01-01"),
      membershipStatus: { code: "EXTENDED", isActive: true },
    };
    const result = checkMembershipOnDate(member, baseDate, [
      "EXTENDED",
      "NEWCOMER",
    ]);

    expect(result.allowed).toBe(true);
    expect(result.reasonCode).toBe("ALLOWED");
  });

  test("denies member with non-matching status", () => {
    const member = {
      joinedAt: new Date("2024-01-01"),
      membershipStatus: { code: "EXTENDED", isActive: true },
    };
    const result = checkMembershipOnDate(member, baseDate, ["NEWCOMER"]);

    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("WRONG_MEMBER_LEVEL");
  });

  test("NEWCOMER ticket allows NEWCOMER status", () => {
    const member = {
      joinedAt: new Date("2024-01-01"),
      membershipStatus: { code: "NEWCOMER", isActive: true },
    };
    const result = checkMembershipOnDate(member, baseDate, ["NEWCOMER"]);

    expect(result.allowed).toBe(true);
    expect(result.reasonCode).toBe("NEWBIE_TO_NEWCOMER_ALLOWED");
  });

  test("NEWCOMER-only ticket denies EXTENDED members", () => {
    const member = {
      joinedAt: new Date("2024-01-01"),
      membershipStatus: { code: "EXTENDED", isActive: true },
    };
    const result = checkMembershipOnDate(member, baseDate, ["NEWCOMER"]);

    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("WRONG_MEMBER_LEVEL");
  });
});

test.describe("checkSponsorCommitteeMembership", () => {
  const sponsorships = [
    {
      committeeId: "comm-activities",
      isPrimary: true,
      committee: { id: "comm-activities", name: "Activities" },
    },
    {
      committeeId: "comm-outdoor",
      isPrimary: false,
      committee: { id: "comm-outdoor", name: "Outdoor Adventures" },
    },
  ];

  test("allows member in primary sponsor committee", () => {
    const memberships = [
      {
        committeeId: "comm-activities",
        startDate: new Date("2024-01-01"),
        endDate: null,
        committee: { id: "comm-activities", name: "Activities" },
      },
    ];
    const result = checkSponsorCommitteeMembership(
      memberships,
      sponsorships,
      baseDate
    );

    expect(result.allowed).toBe(true);
    expect(result.reasonCode).toBe("ALLOWED");
  });

  test("allows member in co-sponsor committee", () => {
    const memberships = [
      {
        committeeId: "comm-outdoor",
        startDate: new Date("2024-01-01"),
        endDate: null,
        committee: { id: "comm-outdoor", name: "Outdoor Adventures" },
      },
    ];
    const result = checkSponsorCommitteeMembership(
      memberships,
      sponsorships,
      baseDate
    );

    expect(result.allowed).toBe(true);
    expect(result.reasonCode).toBe("ALLOWED");
  });

  test("denies member not in any sponsor committee", () => {
    const memberships = [
      {
        committeeId: "comm-other",
        startDate: new Date("2024-01-01"),
        endDate: null,
        committee: { id: "comm-other", name: "Other Committee" },
      },
    ];
    const result = checkSponsorCommitteeMembership(
      memberships,
      sponsorships,
      baseDate
    );

    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("NOT_IN_SPONSORING_COMMITTEE");
  });

  test("denies member whose committee membership ended before event", () => {
    const memberships = [
      {
        committeeId: "comm-activities",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2025-02-01"), // Ended before event date
        committee: { id: "comm-activities", name: "Activities" },
      },
    ];
    const result = checkSponsorCommitteeMembership(
      memberships,
      sponsorships,
      baseDate
    );

    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("NOT_IN_SPONSORING_COMMITTEE");
  });

  test("denies when event has no sponsorships configured", () => {
    const memberships = [
      {
        committeeId: "comm-activities",
        startDate: new Date("2024-01-01"),
        endDate: null,
        committee: { id: "comm-activities", name: "Activities" },
      },
    ];
    const result = checkSponsorCommitteeMembership(memberships, [], baseDate);

    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("NOT_IN_SPONSORING_COMMITTEE");
    expect(result.reasonDetail).toBe(
      "Event has no sponsoring committees configured"
    );
  });
});

test.describe("checkWorkingCommitteeMembership", () => {
  test("allows member in any active committee", () => {
    const memberships = [
      {
        committeeId: "comm-any",
        startDate: new Date("2024-01-01"),
        endDate: null,
        committee: { id: "comm-any", name: "Any Committee" },
      },
    ];
    const result = checkWorkingCommitteeMembership(memberships, baseDate);

    expect(result.allowed).toBe(true);
    expect(result.reasonCode).toBe("ALLOWED");
  });

  test("denies member with no committee memberships", () => {
    const result = checkWorkingCommitteeMembership([], baseDate);

    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("NOT_IN_WORKING_COMMITTEE");
  });

  test("denies member whose only committee membership ended", () => {
    const memberships = [
      {
        committeeId: "comm-expired",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2025-02-01"), // Ended before event date
        committee: { id: "comm-expired", name: "Expired Committee" },
      },
    ];
    const result = checkWorkingCommitteeMembership(memberships, baseDate);

    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("NOT_IN_WORKING_COMMITTEE");
  });

  test("allows member with at least one active committee among many", () => {
    const memberships = [
      {
        committeeId: "comm-expired",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2025-02-01"), // Ended
        committee: { id: "comm-expired", name: "Expired Committee" },
      },
      {
        committeeId: "comm-active",
        startDate: new Date("2024-06-01"),
        endDate: null, // Still active
        committee: { id: "comm-active", name: "Active Committee" },
      },
    ];
    const result = checkWorkingCommitteeMembership(memberships, baseDate);

    expect(result.allowed).toBe(true);
    expect(result.reasonCode).toBe("ALLOWED");
  });
});

test.describe("Ticket type constraints", () => {
  test("SPONSOR_COMMITTEE requires sponsor committee membership", () => {
    const member = createMember(); // No committee memberships
    const event = createEvent({
      ticketTypes: [
        {
          id: "tt-sponsor",
          code: "SPONSOR_COMMITTEE",
          name: "Sponsor Committee Ticket",
          constraints: null,
          isActive: true,
        },
      ],
      sponsorships: [
        {
          committeeId: "comm-activities",
          isPrimary: true,
          committee: { id: "comm-activities", name: "Activities" },
        },
      ],
    });
    const result = evaluateEligibilityPure(member, event, "SPONSOR_COMMITTEE");

    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("NOT_IN_SPONSORING_COMMITTEE");
  });

  test("SPONSOR_COMMITTEE allows member in sponsor committee", () => {
    const member = createMember({
      committeeMemberships: [
        {
          committeeId: "comm-activities",
          startDate: new Date("2024-01-01"),
          endDate: null,
          committee: { id: "comm-activities", name: "Activities" },
        },
      ],
    });
    const event = createEvent({
      ticketTypes: [
        {
          id: "tt-sponsor",
          code: "SPONSOR_COMMITTEE",
          name: "Sponsor Committee Ticket",
          constraints: null,
          isActive: true,
        },
      ],
      sponsorships: [
        {
          committeeId: "comm-activities",
          isPrimary: true,
          committee: { id: "comm-activities", name: "Activities" },
        },
      ],
    });
    const result = evaluateEligibilityPure(member, event, "SPONSOR_COMMITTEE");

    expect(result.allowed).toBe(true);
    expect(result.reasonCode).toBe("ALLOWED");
  });

  test("WORKING_COMMITTEE requires any committee membership", () => {
    const member = createMember(); // No committee memberships
    const event = createEvent({
      ticketTypes: [
        {
          id: "tt-working",
          code: "WORKING_COMMITTEE",
          name: "Working Committee Ticket",
          constraints: null,
          isActive: true,
        },
      ],
    });
    const result = evaluateEligibilityPure(member, event, "WORKING_COMMITTEE");

    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("NOT_IN_WORKING_COMMITTEE");
  });

  test("WORKING_COMMITTEE allows member in any committee", () => {
    const member = createMember({
      committeeMemberships: [
        {
          committeeId: "comm-random",
          startDate: new Date("2024-01-01"),
          endDate: null,
          committee: { id: "comm-random", name: "Random Committee" },
        },
      ],
    });
    const event = createEvent({
      ticketTypes: [
        {
          id: "tt-working",
          code: "WORKING_COMMITTEE",
          name: "Working Committee Ticket",
          constraints: null,
          isActive: true,
        },
      ],
    });
    const result = evaluateEligibilityPure(member, event, "WORKING_COMMITTEE");

    expect(result.allowed).toBe(true);
    expect(result.reasonCode).toBe("ALLOWED");
  });

  test("custom constraints override default constraints", () => {
    const member = createMember({
      membershipStatus: { code: "NEWCOMER", isActive: true },
    });
    const event = createEvent({
      ticketTypes: [
        {
          id: "tt-custom",
          code: "MEMBER_STANDARD",
          name: "Custom Ticket",
          constraints: { allowedMemberStatuses: ["EXTENDED"] }, // Overrides default
          isActive: true,
        },
      ],
    });
    const result = evaluateEligibilityPure(member, event, "MEMBER_STANDARD");

    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("WRONG_MEMBER_LEVEL");
  });
});
