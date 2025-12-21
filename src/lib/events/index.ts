/**
 * Events Module
 *
 * Event-related utilities, defaults, and derivations.
 * See docs/events/EVENT_FIELD_INTELLIGENCE.md for documentation.
 * See docs/events/EVENT_DERIVATION_MODEL.md for capacity/ticket tier model.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

export {
  // Time-based derivations
  deriveEndTime,
  isPastEvent,
  isToday,
  isTomorrow,
  daysUntil,
  // Availability derivations (legacy - single capacity)
  computeAvailability,
  spotsRemainingLabel,
  // Status
  computeStatus,
  statusLabel,
  // Urgency
  computeUrgency,
  urgencyLabel,
  // Category inference
  inferCategory,
  // Validation
  validateEventFields,
  // Preview (for admin UI)
  generateDerivedPreview,
  // Types
  type EventStatus,
  type UrgencyLevel,
  type EventValidationError,
} from "./defaults";

// Ticket Tier-based capacity (replaces single capacity field)
export {
  // Tier metrics
  computeTierMetrics,
  computeEventSummaryMetrics,
  // Capacity status
  deriveCapacityStatus,
  capacityStatusLabel,
  // Waitlist timing
  computeWaitlistTiming,
  // Pricing
  computePricingSummary,
  getPriceRange,
  formatPrice,
  // Types
  type TicketTierInput,
  type RegistrationInput,
  type CapacityStatus,
  type TierMetrics,
  type EventSummaryMetrics,
  type PricingSummary,
} from "./ticketTiers";

// Scheduling and status derivation (SBNC Sunday/Tuesday policy)
export {
  // Schedule computation
  computeDefaultSchedule,
  getNextSunday,
  getFollowingTuesday,
  getThisWeekSunday,
  getEndOfWeek,
  getEnewsWeekRange,
  // Status derivation
  getEventVisibilityState,
  getEventRegistrationState,
  getEventOperationalStatus,
  getOperationalStatusLabel,
  getOperationalStatusColor,
  // eNews helpers
  isAnnouncingThisWeek,
  isRegistrationOpeningThisWeek,
  formatRegistrationOpensMessage,
  // Constants
  SBNC_TIMEZONE,
  DEFAULT_REGISTRATION_OPEN_HOUR,
  ARCHIVE_DAYS_AFTER_END,
  // Types
  type EventVisibilityState,
  type EventRegistrationState,
  type EventOperationalStatus,
  type ScheduleDefaultsInput,
  type ScheduleDefaults,
  type EventForStatus,
} from "./scheduling";
