/**
 * Wild Apricot to Murmurant Field Transformers
 *
 * Transform WA API responses into Murmurant Prisma create/update inputs.
 * Based on WA_FIELD_MAPPING.md specification.
 */

import { Prisma, RegistrationStatus } from "@prisma/client";
import {
  WAContact,
  WAContactStatus,
  WAEvent,
  WAEventRegistration,
  WARegistrationStatus,
  WAFieldValue,
} from "./types";

// ============================================================================
// Status Mappings
// ============================================================================

/**
 * Map WA contact status to Murmurant MembershipStatus code.
 */
export function mapContactStatusToCode(waStatus: WAContactStatus): string {
  switch (waStatus) {
    case "Active":
      return "active";
    case "Lapsed":
      return "lapsed";
    case "PendingNew":
      return "pending_new";
    case "PendingRenewal":
      return "pending_renewal";
    case "Suspended":
      return "suspended";
    case "NotAMember":
      return "not_a_member";
    default:
      return "unknown";
  }
}

/**
 * Map WA registration status to Murmurant RegistrationStatus enum.
 */
export function mapRegistrationStatus(
  waStatus: WARegistrationStatus,
  onWaitlist: boolean
): RegistrationStatus {
  if (onWaitlist) {
    return "WAITLISTED";
  }

  switch (waStatus) {
    case "Confirmed":
      return "CONFIRMED";
    case "Cancelled":
      return "CANCELLED";
    case "PendingPayment":
      return "PENDING_PAYMENT";
    case "WaitList":
      return "WAITLISTED";
    case "NoShow":
      return "NO_SHOW";
    case "Declined":
      return "CANCELLED";
    default:
      return "PENDING";
  }
}

// ============================================================================
// Field Utilities
// ============================================================================

/**
 * Extract a custom field value from WA FieldValues array.
 */
export function extractFieldValue(
  fieldValues: WAFieldValue[],
  fieldName: string
): unknown {
  const field = fieldValues.find(
    (f) => f.FieldName === fieldName || f.SystemCode === fieldName
  );
  return field?.Value ?? null;
}

/**
 * Extract phone number from WA contact custom fields.
 */
export function extractPhone(fieldValues: WAFieldValue[]): string | null {
  const phone = extractFieldValue(fieldValues, "Phone") as string | null;
  if (!phone) return null;

  // Clean phone number - remove non-digits except +
  return phone.replace(/[^\d+]/g, "") || null;
}

/**
 * Normalize email address.
 */
export function normalizeEmail(email: string | null): string | null {
  if (!email) return null;

  const normalized = email.trim().toLowerCase();

  // Basic email validation
  if (!normalized.includes("@") || !normalized.includes(".")) {
    return null;
  }

  return normalized;
}

/**
 * Parse ISO8601 date string to Date object.
 * Returns null if parsing fails.
 */
export function parseDate(isoString: string | null): Date | null {
  if (!isoString) return null;

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch {
    return null;
  }
}

/**
 * Derive event category from WA event tags or committee.
 */
export function deriveCategory(event: WAEvent): string | null {
  // First try to get committee from organizer email prefix
  if (event.Details?.Organizer?.Email) {
    const emailPrefix = event.Details.Organizer.Email.split("@")[0];
    // Common committee email patterns
    const committeePatterns: Record<string, string> = {
      games: "Games",
      wine: "Wine Appreciation",
      hiking: "Happy Hikers",
      books: "Book Club",
      golf: "Golf",
      dining: "Dining Out",
      travel: "Travel",
      garden: "Garden Club",
    };

    for (const [pattern, committee] of Object.entries(committeePatterns)) {
      if (emailPrefix.toLowerCase().includes(pattern)) {
        return committee;
      }
    }
  }

  // Fall back to first tag
  if (event.Tags && event.Tags.length > 0) {
    return event.Tags[0];
  }

  return null;
}

/**
 * Extract description text from WA event details.
 */
export function extractDescription(details: WAEvent["Details"]): string | null {
  if (!details?.DescriptionHtml) return null;

  // Strip HTML tags for plain text description
  const text = details.DescriptionHtml
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

  return text || null;
}

// ============================================================================
// Entity Transformers
// ============================================================================

/**
 * Transform result for tracking what happened.
 */
export interface TransformResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings: string[];
}

/**
 * Transform WA Contact to Murmurant Member create input.
 * Requires membershipStatusId lookup to be done separately.
 *
 * Charter P5: Preserves all WA FieldValues in waRawData for reversibility.
 */
export function transformContact(
  contact: WAContact,
  membershipStatusId: string
): TransformResult<Prisma.MemberCreateInput> {
  const warnings: string[] = [];

  // Validate required fields
  const email = normalizeEmail(contact.Email);
  if (!email) {
    return {
      success: false,
      error: `Invalid or missing email for contact ${contact.Id}`,
      warnings,
    };
  }

  const firstName = contact.FirstName?.trim();
  if (!firstName) {
    return {
      success: false,
      error: `Missing first name for contact ${contact.Id}`,
      warnings,
    };
  }

  const lastName = contact.LastName?.trim();
  if (!lastName) {
    return {
      success: false,
      error: `Missing last name for contact ${contact.Id}`,
      warnings,
    };
  }

  // Parse join date
  let joinedAt = parseDate(contact.MemberSince);
  if (!joinedAt) {
    // Fall back to creation date
    joinedAt = parseDate(contact.CreationDate ?? null);
  }
  if (!joinedAt) {
    // Last resort: use current date
    joinedAt = new Date();
    warnings.push(`No join date found for contact ${contact.Id}, using current date`);
  }

  // Extract phone from custom fields
  const phone = extractPhone(contact.FieldValues);

  // Preserve raw WA membership level
  const waMembershipLevelRaw = contact.MembershipLevel?.Name ?? null;

  // Preserve all WA field values for future reference (Charter P5: Reversibility)
  const waRawData = buildWaRawData(contact);

  return {
    success: true,
    data: {
      firstName,
      lastName,
      email,
      phone,
      joinedAt,
      waMembershipLevelRaw,
      waRawData: waRawData as Prisma.InputJsonValue,
      membershipStatus: {
        connect: { id: membershipStatusId },
      },
    },
    warnings,
  };
}

/**
 * Build the waRawData object from a WA contact.
 * Includes all FieldValues and key contact metadata.
 */
export function buildWaRawData(contact: WAContact): Record<string, unknown> {
  const fieldValues: Record<string, unknown> = {};

  for (const field of contact.FieldValues) {
    // Use FieldName as primary key, append SystemCode for disambiguation
    const key = field.SystemCode
      ? `${field.FieldName} (${field.SystemCode})`
      : field.FieldName;
    fieldValues[key] = field.Value;
  }

  return {
    waContactId: contact.Id,
    displayName: contact.DisplayName,
    organization: contact.Organization,
    membershipLevel: contact.MembershipLevel
      ? {
          id: contact.MembershipLevel.Id,
          name: contact.MembershipLevel.Name,
        }
      : null,
    status: contact.Status,
    memberSince: contact.MemberSince,
    profileLastUpdated: contact.ProfileLastUpdated,
    isAccountAdministrator: contact.IsAccountAdministrator,
    isSuspendedMember: contact.IsSuspendedMember,
    balance: contact.Balance,
    renewalDue: contact.RenewalDue,
    fieldValues,
    _importedAt: new Date().toISOString(),
  };
}

/**
 * Transform WA Event to Murmurant Event create input.
 * eventChairId lookup to be done separately if organizer is known.
 */
export function transformEvent(
  event: WAEvent,
  eventChairId?: string | null
): TransformResult<Prisma.EventCreateInput> {
  const warnings: string[] = [];

  // Validate required fields
  const title = event.Name?.trim();
  if (!title) {
    return {
      success: false,
      error: `Missing name for event ${event.Id}`,
      warnings,
    };
  }

  const startTime = parseDate(event.StartDate);
  if (!startTime) {
    return {
      success: false,
      error: `Invalid start date for event ${event.Id}`,
      warnings,
    };
  }

  // Optional fields
  const endTime = parseDate(event.EndDate);
  const description = extractDescription(event.Details);
  const category = deriveCategory(event);
  const isPublished = event.AccessLevel === "Public";

  const data: Prisma.EventCreateInput = {
    title,
    description,
    category,
    location: event.Location || null,
    startTime,
    endTime,
    capacity: event.RegistrationsLimit || null,
    isPublished,
  };

  // Add event chair if provided
  if (eventChairId) {
    data.eventChair = { connect: { id: eventChairId } };
  }

  return {
    success: true,
    data,
    warnings,
  };
}

/**
 * Transform WA Event Registration to Murmurant EventRegistration create input.
 * eventId and memberId lookups to be done separately.
 */
export function transformRegistration(
  registration: WAEventRegistration,
  eventId: string,
  memberId: string
): TransformResult<Prisma.EventRegistrationCreateInput> {
  const warnings: string[] = [];

  // Parse registration date
  const registeredAt = parseDate(registration.RegistrationDate);
  if (!registeredAt) {
    return {
      success: false,
      error: `Invalid registration date for registration ${registration.Id}`,
      warnings,
    };
  }

  // Map status
  const status = mapRegistrationStatus(registration.Status, registration.OnWaitlist);

  // Set waitlist position if on waitlist
  // We don't have the actual position from WA, so we'll set a placeholder
  const waitlistPosition = registration.OnWaitlist ? 999 : null;

  return {
    success: true,
    data: {
      event: { connect: { id: eventId } },
      member: { connect: { id: memberId } },
      status,
      waitlistPosition,
      registeredAt,
    },
    warnings,
  };
}

// ============================================================================
// Comparison Helpers
// ============================================================================

/**
 * Check if two values are different (for update detection).
 */
export function hasChanged(
  oldValue: unknown,
  newValue: unknown
): boolean {
  // Handle null/undefined
  if (oldValue == null && newValue == null) return false;
  if (oldValue == null || newValue == null) return true;

  // Handle dates
  if (oldValue instanceof Date && newValue instanceof Date) {
    return oldValue.getTime() !== newValue.getTime();
  }

  // Handle primitives
  return oldValue !== newValue;
}

/**
 * Compare two members and return changed fields.
 */
export function getMemberChanges(
  existing: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  },
  transformed: Prisma.MemberCreateInput
): Partial<Prisma.MemberUpdateInput> | null {
  const changes: Partial<Prisma.MemberUpdateInput> = {};

  if (hasChanged(existing.firstName, transformed.firstName)) {
    changes.firstName = transformed.firstName;
  }
  if (hasChanged(existing.lastName, transformed.lastName)) {
    changes.lastName = transformed.lastName;
  }
  if (hasChanged(existing.email, transformed.email)) {
    changes.email = transformed.email;
  }
  if (hasChanged(existing.phone, transformed.phone)) {
    changes.phone = transformed.phone;
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

/**
 * Compare two events and return changed fields.
 */
export function getEventChanges(
  existing: {
    title: string;
    description: string | null;
    location: string | null;
    category: string | null;
    capacity: number | null;
    isPublished: boolean;
  },
  transformed: Prisma.EventCreateInput
): Partial<Prisma.EventUpdateInput> | null {
  const changes: Partial<Prisma.EventUpdateInput> = {};

  if (hasChanged(existing.title, transformed.title)) {
    changes.title = transformed.title;
  }
  if (hasChanged(existing.description, transformed.description)) {
    changes.description = transformed.description;
  }
  if (hasChanged(existing.location, transformed.location)) {
    changes.location = transformed.location;
  }
  if (hasChanged(existing.category, transformed.category)) {
    changes.category = transformed.category;
  }
  if (hasChanged(existing.capacity, transformed.capacity)) {
    changes.capacity = transformed.capacity;
  }
  if (hasChanged(existing.isPublished, transformed.isPublished)) {
    changes.isPublished = transformed.isPublished;
  }

  return Object.keys(changes).length > 0 ? changes : null;
}
