export type DecisionState = "approved" | "pending";

export interface PolicyRuntime {
  bylawsVersion: string | "pending";

  policyVisibility: Record<string, "public" | "members" | "admins" | "pending">;

  guestAccessMode: "members_only" | "guests_allowed" | "pending";

  membershipTermMode: "fixed" | "rolling" | "pending";

  registrationEligibilityMode:
    | "strict_enforcement"
    | "permissive_with_logging"
    | "pending";
}

export const defaultPolicyRuntime: PolicyRuntime = {
  bylawsVersion: "pending",
  policyVisibility: {},
  guestAccessMode: "pending",
  membershipTermMode: "pending",
  registrationEligibilityMode: "pending",
};
