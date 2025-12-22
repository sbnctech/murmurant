/**
 * Eligibility Service Stub
 *
 * Temporary stub implementation for the eligibility service.
 * Returns mock data until the full eligibility engine is implemented.
 *
 * TODO: Replace with real implementation from PR #78
 */

import {
  EligibilityInput,
  EligibilityResult,
  EventEligibilityResponse,
  TicketEligibilityResponse,
} from "./types";

/**
 * Stub: Evaluate eligibility for a single ticket type.
 *
 * Returns STUB_ALLOWED for authenticated users, NOT_LOGGED_IN otherwise.
 */
export async function evaluateTicketEligibility(
  input: EligibilityInput
): Promise<EligibilityResult> {
  const { memberId } = input;

  if (!memberId) {
    return {
      allowed: false,
      reasonCode: "NOT_LOGGED_IN",
      reasonDetail: "User must be logged in to check ticket eligibility",
    };
  }

  // Stub: always allow for authenticated users
  return {
    allowed: true,
    reasonCode: "STUB_ALLOWED",
    reasonDetail: "Stub implementation - eligibility engine pending PR #78",
  };
}

/**
 * Stub: Evaluate eligibility for all ticket types for an event.
 *
 * Returns mock ticket types with STUB_ALLOWED eligibility.
 */
export async function evaluateEventEligibility(
  memberId: string | null,
  eventId: string
): Promise<EventEligibilityResponse> {
  const baseEligibility = await evaluateTicketEligibility({
    memberId,
    eventId,
  });

  // Return mock ticket types for the stub
  const mockTicketTypes = [
    {
      id: "stub-member-standard",
      code: "MEMBER_STANDARD",
      name: "Member Standard",
      eligibility: baseEligibility,
    },
    {
      id: "stub-sponsor-committee",
      code: "SPONSOR_COMMITTEE",
      name: "Sponsor Committee",
      eligibility: baseEligibility,
    },
    {
      id: "stub-working-committee",
      code: "WORKING_COMMITTEE",
      name: "Working Committee",
      eligibility: baseEligibility,
    },
  ];

  return {
    eventId,
    memberId,
    ticketTypes: mockTicketTypes,
  };
}

/**
 * Stub: Evaluate eligibility for a specific ticket type by ID.
 */
export async function evaluateTicketTypeEligibility(
  memberId: string | null,
  ticketTypeId: string
): Promise<TicketEligibilityResponse> {
  const eligibility = await evaluateTicketEligibility({
    memberId,
    eventId: "stub-event",
    ticketTypeId,
  });

  return {
    ticketTypeId,
    memberId,
    eligibility,
  };
}
