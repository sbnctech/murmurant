// Copyright © 2025 Murmurant, Inc. All rights reserved.
/**
 * Wild Apricot API Types
 *
 * Typed interfaces for WA API responses.
 * Based on WA API v2.2 documentation.
 *
 * Security: These types are used for validation and sanitization.
 * All data from WA is treated as untrusted external input.
 */

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * OAuth token response from WA.
 */
export type WaTokenResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  Permissions: string[];
};

/**
 * Authenticated session info.
 */
export type WaSession = {
  accessToken: string;
  expiresAt: Date;
  refreshToken: string;
  accountId: number;
};

// ============================================================================
// CONTACTS (MEMBERS)
// ============================================================================

/**
 * WA Contact (Member) record.
 */
export type WaContact = {
  Id: number;
  Url: string;
  FirstName: string;
  LastName: string;
  Organization: string | null;
  Email: string;
  DisplayName: string;
  ProfileLastUpdated: string; // ISO date
  MembershipLevel: WaMembershipLevel | null;
  MembershipEnabled: boolean;
  Status: WaMembershipStatus;
  FieldValues: WaFieldValue[];
  IsAccountAdministrator: boolean;
  TermsOfUseAccepted: boolean;
};

/**
 * Membership level reference.
 */
export type WaMembershipLevel = {
  Id: number;
  Url: string;
  Name: string;
};

/**
 * Membership status values.
 */
export type WaMembershipStatus =
  | "Active"
  | "Lapsed"
  | "PendingNew"
  | "PendingRenewal"
  | "PendingLevel"
  | "Suspended";

/**
 * Custom field value.
 */
export type WaFieldValue = {
  FieldName: string;
  Value: unknown;
  SystemCode: string | null;
};

// ============================================================================
// EVENTS
// ============================================================================

/**
 * WA Event record.
 */
export type WaEvent = {
  Id: number;
  Url: string;
  Name: string;
  StartDate: string; // ISO date
  EndDate: string; // ISO date
  StartTimeSpecified: boolean;
  EndTimeSpecified: boolean;
  Location: string | null;
  RegistrationEnabled: boolean;
  RegistrationsLimit: number | null;
  ConfirmedRegistrationsCount: number;
  CheckedInAttendeesNumber: number;
  PendingRegistrationsCount: number;
  WaitlistRegistrationsCount: number;
  Tags: string[];
  AccessLevel: "Public" | "Restricted" | "AdminOnly";
  Details: string | null;
};

/**
 * Event registration record.
 */
export type WaEventRegistration = {
  Id: number;
  Url: string;
  Event: { Id: number; Name: string };
  Contact: { Id: number; Name: string };
  RegistrationTypeId: number;
  RegistrationDate: string; // ISO date
  IsCheckedIn: boolean;
  IsPaid: boolean;
  RegistrationFee: number;
  PaidSum: number;
  OnWaitlist: boolean;
  Memo: string | null;
};

// ============================================================================
// API RESPONSES
// ============================================================================

/**
 * Paginated list response from WA.
 */
export type WaPaginatedResponse<T> = {
  Count: number;
  Contacts?: T[];
  Events?: T[];
  EventRegistrations?: T[];
};

/**
 * Error response from WA API.
 */
export type WaErrorResponse = {
  code?: string;
  message?: string;
  reason?: string;
};

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Contact creation/update request.
 */
export type WaContactRequest = {
  FirstName?: string;
  LastName?: string;
  Email?: string;
  Organization?: string;
  MembershipLevelId?: number;
  FieldValues?: Array<{
    FieldName: string;
    Value: unknown;
  }>;
};

/**
 * Event registration request.
 */
export type WaRegistrationRequest = {
  Event: { Id: number };
  Contact: { Id: number };
  RegistrationTypeId: number;
  Memo?: string;
};

// ============================================================================
// SYNC TRACKING
// ============================================================================

/**
 * Sync status for an entity.
 */
export type WaSyncStatus = {
  entityType: "contact" | "event" | "registration";
  entityId: string;
  waId: number;
  lastSyncedAt: Date;
  lastModifiedInWa: Date | null;
  syncState: "synced" | "pending" | "conflict" | "error";
  errorMessage?: string;
};

/**
 * Pending write for retry queue.
 */
export type WaPendingWrite = {
  id: string;
  entityType: string;
  operation: "CREATE" | "UPDATE" | "DELETE";
  payload: unknown;
  attempts: number;
  lastError: string | null;
  status: "PENDING" | "RETRYING" | "FAILED" | "SYNCED";
  createdAt: Date;
  updatedAt: Date;
};
