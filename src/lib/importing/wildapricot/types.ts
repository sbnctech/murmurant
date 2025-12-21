/**
 * Wild Apricot API Response Types
 *
 * These types represent the structure of responses from the WA API v2.2.
 * Based on observed payloads from the existing Python sync system.
 */

// ============================================================================
// Authentication
// ============================================================================

export interface WATokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // seconds until expiration
  refresh_token?: string;
  Permissions: WAPermission[];
}

export interface WAPermission {
  AccountId: number;
  SecurityProfileId: number;
  AvailableScopes: string[];
}

// ============================================================================
// Contacts (Members)
// ============================================================================

export interface WAContact {
  Id: number;
  FirstName: string | null;
  LastName: string | null;
  Email: string | null;
  DisplayName: string | null;
  Organization: string | null;
  MembershipLevel: WAMembershipLevelRef | null;
  Status: WAContactStatus;
  MemberSince: string | null; // ISO8601
  IsSuspendedMember: boolean;
  ProfileLastUpdated: string | null; // ISO8601
  IsAccountAdministrator: boolean;
  FieldValues: WAFieldValue[];
  // Additional fields that may be present
  Balance?: number;
  CreationDate?: string;
  LastUpdated?: string;
  RenewalDue?: string;
}

export type WAContactStatus =
  | "Active"
  | "Lapsed"
  | "PendingNew"
  | "PendingRenewal"
  | "Suspended"
  | "NotAMember";

export interface WAMembershipLevelRef {
  Id: number;
  Name: string;
  Url: string;
}

export interface WAFieldValue {
  FieldName: string;
  SystemCode: string;
  Value: unknown; // Can be string, number, boolean, or complex object
}

// ============================================================================
// Membership Levels
// ============================================================================

export interface WAMembershipLevel {
  Id: number;
  Name: string;
  MembershipFee: number;
  Description: string | null;
  RenewalEnabled: boolean;
  RenewalPeriod: string | null;
  NewMembersEnabled: boolean;
  Url: string;
}

// ============================================================================
// Events
// ============================================================================

export interface WAEvent {
  Id: number;
  Name: string;
  StartDate: string; // ISO8601
  EndDate: string | null; // ISO8601
  Location: string | null;
  RegistrationEnabled: boolean;
  RegistrationsLimit: number | null;
  ConfirmedRegistrationsCount: number;
  PendingRegistrationsCount: number;
  CheckedInAttendeesCount: number;
  AccessLevel: WAEventAccessLevel;
  Tags: string[];
  Details: WAEventDetails | null;
  Url: string;
}

export type WAEventAccessLevel = "Public" | "Restricted" | "AdminOnly";

export interface WAEventDetails {
  DescriptionHtml: string | null;
  Organizer: WAEventOrganizer | null;
  RegistrationTypes: WAEventRegistrationType[];
  // Additional detail fields
  AccessControl?: unknown;
  GuestRegistrationSettings?: unknown;
}

export interface WAEventOrganizer {
  Id: number;
  Name: string;
  Email: string | null;
}

export interface WAEventRegistrationType {
  Id: number;
  Name: string;
  BasePrice: number;
  GuestPrice: number | null;
  Availability: string;
  AvailableFrom: string | null; // ISO8601
  AvailableThrough: string | null; // ISO8601
  IsEnabled: boolean;
  MaximumRegistrantsCount: number | null;
  CurrentRegistrantsCount: number;
}

// ============================================================================
// Event Registrations
// ============================================================================

export interface WAEventRegistration {
  Id: number;
  Event: WAEventRef;
  Contact: WAContactRef;
  RegistrationType: WARegistrationTypeRef | null;
  Status: WARegistrationStatus;
  RegistrationDate: string; // ISO8601
  IsCheckedIn: boolean;
  OnWaitlist: boolean;
  RegistrationFee: number;
  PaidSum: number;
  Memo: string | null;
  // Guest info if applicable
  GuestRegistrationsSummary?: WAGuestSummary;
}

export type WARegistrationStatus =
  | "Confirmed"
  | "Cancelled"
  | "PendingPayment"
  | "WaitList"
  | "Declined"
  | "NoShow";

export interface WAEventRef {
  Id: number;
  Name: string;
  StartDate: string;
}

export interface WAContactRef {
  Id: number;
  Name: string;
  Email: string | null;
}

export interface WARegistrationTypeRef {
  Id: number;
  Name: string;
}

export interface WAGuestSummary {
  NumberOfGuests: number;
  TotalPaid: number;
}

// ============================================================================
// Invoices (for reference - not imported)
// ============================================================================

export interface WAInvoice {
  Id: number;
  DocumentNumber: string;
  DocumentDate: string; // ISO8601
  Contact: WAContactRef;
  Event: WAEventRef | null;
  Status: WAInvoiceStatus;
  Value: number;
  OutstandingBalance: number;
  CreatedDate: string;
  UpdatedDate: string;
}

export type WAInvoiceStatus =
  | "Paid"
  | "Unpaid"
  | "PartiallyPaid"
  | "Cancelled"
  | "Refunded";

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface WAPaginatedResponse<T> {
  Items?: T[];
  Contacts?: T[]; // Contacts endpoint uses this key
  Events?: T[]; // Events endpoint uses this key
  Invoices?: T[]; // Invoices endpoint uses this key
}

export interface WAAsyncQueryResponse {
  ResultUrl: string;
}

export interface WAAsyncQueryResult<T> {
  State: "Queued" | "Processing" | "Complete" | "Failed";
  Contacts?: T[];
  Items?: T[];
  ErrorDetails?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface WAApiError {
  status: number;
  code: string;
  message: string;
  details?: string;
}

export class WAApiException extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details?: string
  ) {
    super(message);
    this.name = "WAApiException";
  }
}

export class WAAsyncQueryException extends Error {
  constructor(
    message: string,
    public errorDetails?: string
  ) {
    super(message);
    this.name = "WAAsyncQueryException";
  }
}

export class WATokenException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WATokenException";
  }
}

// ============================================================================
// Sync Types
// ============================================================================

export interface SyncStats {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}

/**
 * Detailed registration diagnostics for debugging "0 registrations" issues.
 */
export interface RegistrationDiagnostics {
  eventsProcessed: number;
  eventsSkippedUnmapped: number;
  registrationFetchCalls: number;
  registrationsFetchedTotal: number;
  registrationsTransformedOk: number;
  registrationsSkippedMissingEvent: number;
  registrationsSkippedMissingMember: number;
  registrationsSkippedTransformError: number;
  registrationsUpserted: number;
  // Top N skip reasons with counts
  skipReasons: Map<string, number>;
}

export interface SyncResult {
  success: boolean;
  mode: "full" | "incremental";
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
  stats: {
    members: SyncStats;
    events: SyncStats;
    registrations: SyncStats;
  };
  errors: SyncError[];
  /** Detailed registration diagnostics for debugging */
  registrationDiagnostics?: RegistrationDiagnostics;
}

export interface SyncError {
  entityType: "Member" | "Event" | "EventRegistration";
  waId: number;
  message: string;
  details?: unknown;
}

// ============================================================================
// Sync Report (JSON file output)
// ============================================================================

/**
 * Full sync report written to JSON file for debugging and auditing.
 * Includes all diagnostics needed to diagnose "0 registrations" issues.
 */
export interface SyncReport {
  /** Report format version for future compatibility */
  version: 1;

  /** Unique identifier for this sync run */
  runId: string;

  /** When the sync started (ISO8601) */
  startedAt: string;

  /** When the sync finished (ISO8601) */
  finishedAt: string;

  /** Duration in milliseconds */
  durationMs: number;

  /** Whether the sync completed without fatal errors */
  success: boolean;

  /** Dry run mode (no writes) */
  dryRun: boolean;

  /** Entity counts from Wild Apricot */
  fetched: {
    contacts: number;
    events: number;
    registrations: number;
  };

  /** Suspicious count warnings */
  warnings: SyncWarning[];

  /** Entity statistics */
  stats: {
    members: SyncStats;
    events: SyncStats;
    registrations: SyncStats;
  };

  /** Detailed registration diagnostics */
  registrationDiagnostics: {
    eventsProcessed: number;
    eventsSkippedUnmapped: number;
    registrationFetchCalls: number;
    registrationsFetchedTotal: number;
    registrationsTransformedOk: number;
    registrationsSkippedMissingEvent: number;
    registrationsSkippedMissingMember: number;
    registrationsSkippedTransformError: number;
    registrationsUpserted: number;
    /** Top skip reasons with counts */
    topSkipReasons: Array<{ reason: string; count: number }>;
  };

  /** First N errors for debugging */
  errors: SyncError[];

  /** Error count (may be more than errors array length) */
  totalErrorCount: number;
}

/**
 * Warning generated during sync for suspicious conditions.
 */
export interface SyncWarning {
  code: string;
  message: string;
  severity: "low" | "medium" | "high";
}
