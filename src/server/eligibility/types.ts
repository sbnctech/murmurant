/**
 * Eligibility Engine Types
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
  | "OVERRIDE_DENIED";

export interface EligibilityResult {
  allowed: boolean;
  reasonCode: EligibilityReasonCode;
  reasonDetail?: string;
}

export interface TicketConstraints {
  requiresMembership?: boolean;
  allowedMemberStatuses?: string[];
  requiresSponsorCommittee?: boolean;
  requiresWorkingCommittee?: boolean;
}

export interface EligibilityMemberData {
  id: string;
  joinedAt: Date;
  membershipStatus: { code: string; isActive: boolean };
  committeeMemberships: Array<{
    committeeId: string;
    startDate: Date;
    endDate: Date | null;
    committee: { id: string; name: string };
  }>;
}

export interface EligibilityEventData {
  id: string;
  startTime: Date;
  ticketTypes: Array<{
    id: string;
    code: string;
    name: string;
    constraints: TicketConstraints | null;
    isActive: boolean;
  }>;
  sponsorships: Array<{
    committeeId: string;
    isPrimary: boolean;
    committee: { id: string; name: string };
  }>;
  eligibilityOverrides: Array<{
    ticketTypeId: string;
    memberId: string;
    allow: boolean;
    reason: string | null;
  }>;
}

export const DEFAULT_CONSTRAINTS: Record<string, TicketConstraints> = {
  MEMBER_STANDARD: { requiresMembership: true },
  SPONSOR_COMMITTEE: { requiresMembership: true, requiresSponsorCommittee: true },
  WORKING_COMMITTEE: { requiresMembership: true, requiresWorkingCommittee: true },
};
