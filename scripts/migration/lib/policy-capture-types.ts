/**
 * Policy Capture Types
 *
 * Types for capturing organization policies from Wild Apricot
 * and mapping them to ClubOS configuration.
 */

// ============================================================================
// Migration Bundle Types
// ============================================================================

/**
 * Root structure of a migration bundle.
 */
export interface MigrationBundle {
  version: string;
  createdAt: string;
  sourceOrg: SourceOrgInfo;
  policies: CapturedPolicies;
  mappings: PolicyMappings;
}

/**
 * Source organization metadata.
 */
export interface SourceOrgInfo {
  accountId: string;
  name: string;
  timezone: string | null;
  extractedAt: string;
  apiStatus: "success" | "partial" | "failed";
  errors: string[];
}

/**
 * Policies extracted from WA.
 */
export interface CapturedPolicies {
  membershipLevels: CapturedMembershipLevel[];
}

/**
 * A single captured membership level from WA.
 */
export interface CapturedMembershipLevel {
  waId: number;
  name: string;
  fee: number;
  description: string | null;
  renewalEnabled: boolean;
  renewalPeriod: string | null;
  newMembersEnabled: boolean;
}

// ============================================================================
// Mapping Types
// ============================================================================

/**
 * All policy mappings in the bundle.
 */
export interface PolicyMappings {
  membershipLevels: MembershipLevelMappingFile;
}

/**
 * The membership level mapping file structure.
 */
export interface MembershipLevelMappingFile {
  version: string;
  createdAt: string;
  source: "api" | "manual" | "template";
  levels: MembershipLevelMapping[];
}

/**
 * A single membership level mapping entry.
 */
export interface MembershipLevelMapping {
  waId: number;
  waName: string;
  clubosTier?: ClubOSTierCode;
  ignore?: boolean;
  reason?: string;
  notes?: string;
}

/**
 * Valid ClubOS membership tier codes.
 */
export type ClubOSTierCode =
  | "active"
  | "lapsed"
  | "pending_new"
  | "pending_renewal"
  | "suspended"
  | "not_a_member";

/**
 * All valid tier codes for validation.
 */
export const VALID_TIER_CODES: ClubOSTierCode[] = [
  "active",
  "lapsed",
  "pending_new",
  "pending_renewal",
  "suspended",
  "not_a_member",
];

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Result of validating a mapping file.
 */
export interface MappingValidationResult {
  valid: boolean;
  errors: MappingValidationError[];
  warnings: MappingValidationWarning[];
  summary: {
    totalLevels: number;
    mappedLevels: number;
    ignoredLevels: number;
    unmappedLevels: number;
  };
}

/**
 * A validation error (blocks migration).
 */
export interface MappingValidationError {
  level: string;
  waId: number;
  message: string;
}

/**
 * A validation warning (does not block).
 */
export interface MappingValidationWarning {
  level: string;
  waId: number;
  message: string;
}

// ============================================================================
// Report Types
// ============================================================================

/**
 * Policy capture report structure.
 */
export interface PolicyCaptureReport {
  generatedAt: string;
  sourceAccountId: string;
  membershipLevels: MembershipLevelReportEntry[];
  summary: PolicyCaptureSummary;
  validationStatus: "passed" | "failed" | "pending";
  validationErrors: string[];
}

/**
 * A single entry in the membership level report.
 */
export interface MembershipLevelReportEntry {
  waId: number;
  waName: string;
  status: "mapped" | "ignored" | "unmapped";
  clubosTier?: string;
  reason?: string;
}

/**
 * Summary statistics for the capture.
 */
export interface PolicyCaptureSummary {
  totalWaLevels: number;
  mappedToClubos: number;
  ignoredWithReason: number;
  unmappedBlocking: number;
}
