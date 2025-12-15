/**
 * Eligibility Checks - Pure Logic Functions
 *
 * These functions contain the core eligibility evaluation logic without
 * any database dependencies. They can be unit tested independently.
 */

import {
  EligibilityResult,
  EligibilityMemberData,
  EligibilityEventData,
  TicketConstraints,
  DEFAULT_CONSTRAINTS,
} from "./types";

/**
 * Evaluate eligibility for a specific ticket type.
 * Pure function - no database calls.
 */
export function evaluateEligibilityPure(
  member: EligibilityMemberData | null,
  event: EligibilityEventData | null,
  ticketTypeCode: string,
  checkDate?: Date
): EligibilityResult {
  // Check if member is provided
  if (!member) {
    return {
      allowed: false,
      reasonCode: "MEMBER_NOT_FOUND",
      reasonDetail: "Member data not available",
    };
  }

  // Check if event is provided
  if (!event) {
    return {
      allowed: false,
      reasonCode: "EVENT_NOT_FOUND",
      reasonDetail: "Event data not available",
    };
  }

  // Find the ticket type
  const ticketType = event.ticketTypes.find((tt) => tt.code === ticketTypeCode);
  if (!ticketType) {
    return {
      allowed: false,
      reasonCode: "TICKET_TYPE_NOT_FOUND",
      reasonDetail: `Ticket type ${ticketTypeCode} not found for event`,
    };
  }

  // Determine the date to check membership as of
  const dateToCheck = checkDate || event.startTime;

  // Check for eligibility override first
  const override = event.eligibilityOverrides.find(
    (o) => o.ticketTypeId === ticketType.id && o.memberId === member.id
  );
  if (override) {
    if (override.allow) {
      return {
        allowed: true,
        reasonCode: "OVERRIDE_ALLOWED",
        reasonDetail: override.reason || "Eligibility override granted",
      };
    } else {
      return {
        allowed: false,
        reasonCode: "OVERRIDE_DENIED",
        reasonDetail: override.reason || "Eligibility override denied",
      };
    }
  }

  // Get constraints for this ticket type
  const storedConstraints = ticketType.constraints || {};
  const defaultConstraints = DEFAULT_CONSTRAINTS[ticketType.code] || {};
  const constraints: TicketConstraints = {
    ...defaultConstraints,
    ...storedConstraints,
  };

  // Check membership requirement
  if (constraints.requiresMembership) {
    const membershipResult = checkMembershipOnDate(
      member,
      dateToCheck,
      constraints.allowedMemberStatuses
    );
    if (!membershipResult.allowed) {
      return membershipResult;
    }
  }

  // Check sponsor committee requirement
  if (constraints.requiresSponsorCommittee) {
    const sponsorResult = checkSponsorCommitteeMembership(
      member.committeeMemberships,
      event.sponsorships,
      dateToCheck
    );
    if (!sponsorResult.allowed) {
      return sponsorResult;
    }
  }

  // Check working committee requirement
  if (constraints.requiresWorkingCommittee) {
    const workingResult = checkWorkingCommitteeMembership(
      member.committeeMemberships,
      dateToCheck
    );
    if (!workingResult.allowed) {
      return workingResult;
    }
  }

  return {
    allowed: true,
    reasonCode: "ALLOWED",
    reasonDetail: "Member is eligible for this ticket type",
  };
}

/**
 * Check if member has active membership on the given date.
 * Handles special case: Newbie (NEWCOMER status) can buy Newcomer tickets,
 * but non-Newcomers cannot buy Newcomer-only tickets.
 */
export function checkMembershipOnDate(
  member: {
    joinedAt: Date;
    membershipStatus: { code: string; isActive: boolean };
  },
  checkDate: Date,
  allowedStatuses?: string[]
): EligibilityResult {
  const status = member.membershipStatus;

  // Check if member status is active
  if (!status.isActive) {
    return {
      allowed: false,
      reasonCode: "NOT_MEMBER_ON_EVENT_DATE",
      reasonDetail: `Member status '${status.code}' is not active`,
    };
  }

  // If specific statuses are required, check them
  if (allowedStatuses && allowedStatuses.length > 0) {
    // Special case: NEWCOMER tickets
    if (
      allowedStatuses.includes("NEWCOMER") &&
      !allowedStatuses.includes("EXTENDED")
    ) {
      // This is a Newcomer-only ticket
      if (status.code === "NEWCOMER") {
        return {
          allowed: true,
          reasonCode: "NEWBIE_TO_NEWCOMER_ALLOWED",
          reasonDetail: "Newcomer member eligible for Newcomer ticket",
        };
      } else {
        return {
          allowed: false,
          reasonCode: "WRONG_MEMBER_LEVEL",
          reasonDetail: `Ticket requires NEWCOMER status, member has ${status.code}`,
        };
      }
    }

    // General status check
    if (!allowedStatuses.includes(status.code)) {
      const statusList = allowedStatuses.join(", ");
      return {
        allowed: false,
        reasonCode: "WRONG_MEMBER_LEVEL",
        reasonDetail: `Ticket requires one of [${statusList}], member has ${status.code}`,
      };
    }
  }

  // Suppress unused variable warning for checkDate
  // In future, this could be used to check historical membership status
  void checkDate;

  return {
    allowed: true,
    reasonCode: "ALLOWED",
  };
}

/**
 * Check if member is in any sponsoring or co-sponsoring committee for the event.
 */
export function checkSponsorCommitteeMembership(
  memberships: Array<{
    committeeId: string;
    startDate: Date;
    endDate: Date | null;
    committee: { id: string; name: string };
  }>,
  sponsorships: Array<{
    committeeId: string;
    isPrimary: boolean;
    committee: { id: string; name: string };
  }>,
  checkDate: Date
): EligibilityResult {
  // Get all sponsor committee IDs (primary and co-sponsors)
  const sponsorCommitteeIds = sponsorships.map((s) => s.committeeId);

  if (sponsorCommitteeIds.length === 0) {
    return {
      allowed: false,
      reasonCode: "NOT_IN_SPONSORING_COMMITTEE",
      reasonDetail: "Event has no sponsoring committees configured",
    };
  }

  // Check if member is in any sponsor committee on the check date
  const activeInSponsor = memberships.some((m) => {
    const isInSponsorCommittee = sponsorCommitteeIds.includes(m.committeeId);
    const isActiveOnDate =
      m.startDate <= checkDate && (m.endDate === null || m.endDate >= checkDate);
    return isInSponsorCommittee && isActiveOnDate;
  });

  if (!activeInSponsor) {
    const sponsorNames = sponsorships.map((s) => s.committee.name).join(", ");
    return {
      allowed: false,
      reasonCode: "NOT_IN_SPONSORING_COMMITTEE",
      reasonDetail: `Member not in sponsoring committee(s): ${sponsorNames}`,
    };
  }

  return {
    allowed: true,
    reasonCode: "ALLOWED",
  };
}

/**
 * Check if member is in any committee (for working committee tickets).
 * By default, any committee membership qualifies.
 */
export function checkWorkingCommitteeMembership(
  memberships: Array<{
    committeeId: string;
    startDate: Date;
    endDate: Date | null;
    committee: { id: string; name: string };
  }>,
  checkDate: Date
): EligibilityResult {
  // Check if member is in any committee on the check date
  const activeInAnyCommittee = memberships.some((m) => {
    const isActiveOnDate =
      m.startDate <= checkDate && (m.endDate === null || m.endDate >= checkDate);
    return isActiveOnDate;
  });

  if (!activeInAnyCommittee) {
    return {
      allowed: false,
      reasonCode: "NOT_IN_WORKING_COMMITTEE",
      reasonDetail: "Member not in any committee",
    };
  }

  return {
    allowed: true,
    reasonCode: "ALLOWED",
  };
}
