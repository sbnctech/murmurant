/**
 * Member Service Interface Types
 */

export interface MemberProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  membershipStatusCode: string;
  membershipStatusLabel: string;
  membershipTierCode: string | null;
  membershipTierLabel: string | null;
  joinedAt: Date;
  expiresAt: Date | null;
  isActive: boolean;
}

export interface MemberSummary {
  id: string;
  fullName: string;
  email: string;
  membershipStatus: string;
  isActive: boolean;
}

export interface UpdateMemberInput {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string;
}

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

export interface LifecycleExplanation {
  currentState: LifecycleState;
  stateLabel: string;
  stateDescription: string;
  inferenceReason: string;
  narrative: string;
}

export interface MemberService {
  getById(memberId: string): Promise<MemberProfile | null>;
  getByEmail(email: string): Promise<MemberProfile | null>;
  search(query: string, limit?: number): Promise<MemberSummary[]>;
  update(memberId: string, data: UpdateMemberInput): Promise<MemberProfile>;
  getLifecycleExplanation(memberId: string): Promise<LifecycleExplanation | null>;
  isInGoodStanding(memberId: string): Promise<boolean>;
}
