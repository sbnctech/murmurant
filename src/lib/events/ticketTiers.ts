/**
 * Ticket Tier Derivations
 *
 * Event capacity is derived from ticket tiers, not a single field.
 * This module provides pure functions to calculate:
 * - Total capacity across all tiers
 * - Tickets sold per tier and total
 * - Capacity status (WAITLISTED, FULL, UNDERSUBSCRIBED, UNKNOWN)
 * - Waitlist timing metrics
 * - Pricing summary for display
 *
 * Charter: P3 (explicit state machines), P4 (no hidden rules)
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Minimal ticket tier data needed for derivations
 */
export interface TicketTierInput {
  id: string;
  name: string;
  priceCents: number;
  quantity: number;
  isActive: boolean;
}

/**
 * Minimal registration data needed for derivations
 */
export interface RegistrationInput {
  id: string;
  ticketTierId: string | null;
  status: "DRAFT" | "PENDING_PAYMENT" | "PENDING" | "CONFIRMED" | "WAITLISTED" | "CANCELLED" | "REFUND_PENDING" | "REFUNDED" | "NO_SHOW";
  registeredAt: Date;
}

/**
 * Capacity status derived from tier availability
 */
export type CapacityStatus = "WAITLISTED" | "FULL" | "UNDERSUBSCRIBED" | "UNKNOWN";

/**
 * Per-tier metrics
 */
export interface TierMetrics {
  tierId: string;
  tierName: string;
  priceCents: number;
  quantity: number;
  sold: number;
  remaining: number;
  waitlisted: number;
  isFull: boolean;
  hasWaitlist: boolean;
}

/**
 * Event-level summary metrics derived from tiers
 */
export interface EventSummaryMetrics {
  // Totals
  totalTicketsAvailable: number;
  totalTicketsSold: number;
  totalWaitlisted: number;
  totalRemaining: number;

  // Capacity status
  capacityStatus: CapacityStatus;

  // Waitlist timing (null if no waitlist)
  waitlistStartedAt: Date | null;
  waitlistEndedAt: Date | null;
  waitlistDurationSeconds: number | null;

  // Per-tier breakdown
  tierMetrics: TierMetrics[];
}

/**
 * Pricing summary for display
 */
export interface PricingSummary {
  isFree: boolean;
  isMultipleTiers: boolean;
  displayText: string;
  tiers: Array<{
    name: string;
    priceCents: number;
    priceFormatted: string;
  }>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a registration counts toward capacity (confirmed or similar)
 */
function isConfirmedRegistration(status: RegistrationInput["status"]): boolean {
  return status === "CONFIRMED" || status === "PENDING" || status === "PENDING_PAYMENT";
}

/**
 * Check if a registration is waitlisted
 */
function isWaitlistedRegistration(status: RegistrationInput["status"]): boolean {
  return status === "WAITLISTED";
}

/**
 * Format cents as currency string
 */
export function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  const dollars = cents / 100;
  return `$${dollars.toFixed(dollars % 1 === 0 ? 0 : 2)}`;
}

// ============================================================================
// TIER METRICS
// ============================================================================

/**
 * Calculate metrics for a single tier
 */
export function computeTierMetrics(
  tier: TicketTierInput,
  registrations: RegistrationInput[]
): TierMetrics {
  // Filter registrations for this tier
  const tierRegs = registrations.filter((r) => r.ticketTierId === tier.id);

  const sold = tierRegs.filter((r) => isConfirmedRegistration(r.status)).length;
  const waitlisted = tierRegs.filter((r) => isWaitlistedRegistration(r.status)).length;
  const remaining = Math.max(0, tier.quantity - sold);

  return {
    tierId: tier.id,
    tierName: tier.name,
    priceCents: tier.priceCents,
    quantity: tier.quantity,
    sold,
    remaining,
    waitlisted,
    isFull: remaining === 0,
    hasWaitlist: waitlisted > 0,
  };
}

// ============================================================================
// EVENT SUMMARY METRICS
// ============================================================================

/**
 * Compute full event summary metrics from tiers and registrations
 */
export function computeEventSummaryMetrics(
  tiers: TicketTierInput[],
  registrations: RegistrationInput[]
): EventSummaryMetrics {
  // Filter to active tiers only
  const activeTiers = tiers.filter((t) => t.isActive);

  // No tiers = unknown capacity
  if (activeTiers.length === 0) {
    return {
      totalTicketsAvailable: 0,
      totalTicketsSold: 0,
      totalWaitlisted: 0,
      totalRemaining: 0,
      capacityStatus: "UNKNOWN",
      waitlistStartedAt: null,
      waitlistEndedAt: null,
      waitlistDurationSeconds: null,
      tierMetrics: [],
    };
  }

  // Calculate per-tier metrics
  const tierMetrics = activeTiers.map((tier) => computeTierMetrics(tier, registrations));

  // Aggregate totals
  const totalTicketsAvailable = tierMetrics.reduce((sum, t) => sum + t.quantity, 0);
  const totalTicketsSold = tierMetrics.reduce((sum, t) => sum + t.sold, 0);
  const totalWaitlisted = tierMetrics.reduce((sum, t) => sum + t.waitlisted, 0);
  const totalRemaining = tierMetrics.reduce((sum, t) => sum + t.remaining, 0);

  // Derive capacity status
  const capacityStatus = deriveCapacityStatus(tierMetrics, totalWaitlisted, totalRemaining);

  // Calculate waitlist timing
  const waitlistTiming = computeWaitlistTiming(registrations);

  return {
    totalTicketsAvailable,
    totalTicketsSold,
    totalWaitlisted,
    totalRemaining,
    capacityStatus,
    ...waitlistTiming,
    tierMetrics,
  };
}

// ============================================================================
// CAPACITY STATUS DERIVATION
// ============================================================================

/**
 * Derive capacity status from tier metrics
 *
 * - WAITLISTED: Any tier has waitlist entries
 * - FULL: All tiers sold out, no waitlist
 * - UNDERSUBSCRIBED: Tickets remain available
 * - UNKNOWN: No ticket tiers defined (handled upstream)
 */
export function deriveCapacityStatus(
  tierMetrics: TierMetrics[],
  totalWaitlisted: number,
  totalRemaining: number
): CapacityStatus {
  // Any waitlisted = WAITLISTED status
  if (totalWaitlisted > 0) {
    return "WAITLISTED";
  }

  // No remaining spots = FULL
  if (totalRemaining === 0) {
    return "FULL";
  }

  // Spots available = UNDERSUBSCRIBED
  return "UNDERSUBSCRIBED";
}

/**
 * Get human-readable capacity status label
 */
export function capacityStatusLabel(status: CapacityStatus): string {
  const labels: Record<CapacityStatus, string> = {
    WAITLISTED: "Waitlist Active",
    FULL: "Sold Out",
    UNDERSUBSCRIBED: "Spots Available",
    UNKNOWN: "Capacity Unknown",
  };
  return labels[status];
}

// ============================================================================
// WAITLIST TIMING DERIVATION
// ============================================================================

/**
 * Compute waitlist timing metrics
 */
export function computeWaitlistTiming(registrations: RegistrationInput[]): {
  waitlistStartedAt: Date | null;
  waitlistEndedAt: Date | null;
  waitlistDurationSeconds: number | null;
} {
  // Find all waitlisted registrations
  const waitlistRegs = registrations
    .filter((r) => isWaitlistedRegistration(r.status))
    .sort((a, b) => a.registeredAt.getTime() - b.registeredAt.getTime());

  if (waitlistRegs.length === 0) {
    return {
      waitlistStartedAt: null,
      waitlistEndedAt: null,
      waitlistDurationSeconds: null,
    };
  }

  const waitlistStartedAt = waitlistRegs[0].registeredAt;
  const waitlistEndedAt = waitlistRegs[waitlistRegs.length - 1].registeredAt;
  const waitlistDurationSeconds = Math.floor(
    (waitlistEndedAt.getTime() - waitlistStartedAt.getTime()) / 1000
  );

  return {
    waitlistStartedAt,
    waitlistEndedAt,
    waitlistDurationSeconds,
  };
}

// ============================================================================
// PRICING SUMMARY DERIVATION
// ============================================================================

/**
 * Generate pricing summary for display
 *
 * Rules:
 * - If one tier: show exact price
 * - If multiple tiers: show breakdown (e.g., "Members $10 | Guests $15")
 * - If all free tiers: show "Free"
 */
export function computePricingSummary(tiers: TicketTierInput[]): PricingSummary {
  const activeTiers = tiers.filter((t) => t.isActive);

  // No tiers
  if (activeTiers.length === 0) {
    return {
      isFree: true,
      isMultipleTiers: false,
      displayText: "Free",
      tiers: [],
    };
  }

  // Sort by price for consistent display
  const sortedTiers = [...activeTiers].sort((a, b) => a.priceCents - b.priceCents);

  // Build tier info
  const tierInfo = sortedTiers.map((t) => ({
    name: t.name,
    priceCents: t.priceCents,
    priceFormatted: formatPrice(t.priceCents),
  }));

  // Check if all free
  const isFree = sortedTiers.every((t) => t.priceCents === 0);

  if (isFree) {
    return {
      isFree: true,
      isMultipleTiers: sortedTiers.length > 1,
      displayText: "Free",
      tiers: tierInfo,
    };
  }

  // Single tier
  if (sortedTiers.length === 1) {
    return {
      isFree: false,
      isMultipleTiers: false,
      displayText: formatPrice(sortedTiers[0].priceCents),
      tiers: tierInfo,
    };
  }

  // Multiple tiers - show breakdown
  const breakdown = tierInfo.map((t) => `${t.name} ${t.priceFormatted}`).join(" | ");

  return {
    isFree: false,
    isMultipleTiers: true,
    displayText: breakdown,
    tiers: tierInfo,
  };
}

/**
 * Get price range for display (e.g., "$10 - $25" or "Free" or "$15")
 */
export function getPriceRange(tiers: TicketTierInput[]): string {
  const activeTiers = tiers.filter((t) => t.isActive);

  if (activeTiers.length === 0) {
    return "Free";
  }

  const prices = activeTiers.map((t) => t.priceCents).sort((a, b) => a - b);
  const minPrice = prices[0];
  const maxPrice = prices[prices.length - 1];

  // All free
  if (maxPrice === 0) {
    return "Free";
  }

  // Single price or all same
  if (minPrice === maxPrice) {
    return formatPrice(minPrice);
  }

  // Free to paid range
  if (minPrice === 0) {
    return `Free - ${formatPrice(maxPrice)}`;
  }

  // Price range
  return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
}
