/**
 * Eligibility Engine Types
 *
 * Shared types for eligibility evaluation.
 * These types define the contract between the eligibility service and API layer.
 */

/**
 * Reason codes returned by the eligibility engine.
 * These are stable strings for API consumers.
 */
export type EligibilityReasonCode =
  | "ALLOWED"
  | "NOT_LOGGED_IN"
  | "MEMBER_NOT_FOUND"
  | "EVENT_NOT_FOUND"
  | "TICKET_TYPE_NOT_FOUND"
  | "NOT_MEMBER_ON_EVENT_DATE"
  | "NEWBIE_TO_NEWCOMER_ALLOWED"
  | "WRONG_MEMBER_LEVEL"
  | "NOT_IN_SPONSORING_COMMITTEE"
  | "NOT_IN_WORKING_COMMITTEE"
  | "OVERRIDE_ALLOWED"
  | "OVERRIDE_DENIED"
  | "STUB_ALLOWED";

/**
 * Result of evaluating ticket eligibility.
 */
export interface EligibilityResult {
  allowed: boolean;
  reasonCode: EligibilityReasonCode;
  reasonDetail?: string;
}

/**
 * Input parameters for eligibility evaluation.
 */
export interface EligibilityInput {
  memberId: string | null;
  eventId: string;
  ticketTypeId?: string;
  ticketTypeCode?: string;
  asOfDate?: Date;
}

/**
 * Ticket type with eligibility information.
 */
export interface TicketTypeEligibility {
  id: string;
  code: string;
  name: string;
  eligibility: EligibilityResult;
}

/**
 * Response for event eligibility endpoint.
 */
export interface EventEligibilityResponse {
  eventId: string;
  memberId: string | null;
  ticketTypes: TicketTypeEligibility[];
}

/**
 * Response for single ticket eligibility endpoint.
 */
export interface TicketEligibilityResponse {
  ticketTypeId: string;
  memberId: string | null;
  eligibility: EligibilityResult;
}
