/**
 * Business Rules Enforcement
 *
 * Translates documented business model rules into enforceable code constraints.
 * This module ensures that the business model drives code behavior, not the other way around.
 *
 * Source Documents:
 * - docs/BIZ/DUAL_BUSINESS_MODEL.md
 * - docs/BIZ/EXHIBIT_B_FIRST_PRINCIPLES.md
 * - docs/ORG/SBNC_Business_Model_and_Sustainability.md
 * - docs/BIZ/COMMERCIALIZATION_AND_GOVERNANCE.md
 *
 * @module businessRules
 */

// ============================================================================
// Client Zero Constants (SBNC-specific, documented in DUAL_BUSINESS_MODEL.md)
// ============================================================================

/**
 * SBNC is "Client Zero" - the founding customer.
 * Referenced in: docs/BIZ/DUAL_BUSINESS_MODEL.md Section 3.1
 */
export const CLIENT_ZERO_ORG_ID = "sbnc";

/**
 * Client Zero receives no licensing fees during evaluation period.
 * Referenced in: docs/BIZ/DUAL_BUSINESS_MODEL.md Section 1.2 - "No cost to SBNC"
 * Referenced in: docs/BIZ/BOARD_EMAIL_EVALUATION_REQUEST.md - "All infrastructure costs are mine"
 */
export const CLIENT_ZERO_LICENSING_FEE_WAIVED = true;

// ============================================================================
// Engaged User Rules (docs/BIZ/DUAL_BUSINESS_MODEL.md Section 2.2)
// ============================================================================

/**
 * Definition: "Engaged user" = member who has logged in OR participated in billing period.
 *
 * From DUAL_BUSINESS_MODEL.md:
 * > "Engaged user" is defined as members who have logged in or participated
 * > in the billing period. This aligns cost with value received—organizations
 * > with dormant members do not pay for unused capacity.
 *
 * From EXHIBIT_B_FIRST_PRINCIPLES.md:
 * > A 700-member organization where 50 members actively use the system pays
 * > based on those 50 active users, not on the 700 names in the database.
 */
export interface EngagedUserCriteria {
  /** Member logged in during billing period */
  hasLoggedIn: boolean;
  /** Member participated (registered for event, RSVP'd, etc.) during billing period */
  hasParticipated: boolean;
  /** Billing period start date */
  periodStart: Date;
  /** Billing period end date */
  periodEnd: Date;
}

/**
 * Determines if a member counts as an "engaged user" for billing purposes.
 *
 * Business Rule: Billing is based on engaged users, not total member count.
 * This aligns ClubOS revenue with customer outcomes.
 */
export function isEngagedUser(criteria: EngagedUserCriteria): boolean {
  return criteria.hasLoggedIn || criteria.hasParticipated;
}

/**
 * Calculates engaged user count from member activity data.
 *
 * @param members - Array of member activity records
 * @returns Count of engaged users
 */
export function countEngagedUsers(
  members: Array<{ hasLoggedIn: boolean; hasParticipated: boolean }>,
): number {
  return members.filter((m) => m.hasLoggedIn || m.hasParticipated).length;
}

// ============================================================================
// Transaction Fee Rules (docs/BIZ/DUAL_BUSINESS_MODEL.md Section 2.2)
// ============================================================================

/**
 * Transaction fee structure from DUAL_BUSINESS_MODEL.md:
 *
 * | Transaction Type | Fee Structure |
 * |------------------|---------------|
 * | Paid registration | Percentage + fixed |
 * | Free registration | Minimal or zero |
 * | Donations | Percentage |
 */
export type TransactionType =
  | "paid_registration"
  | "free_registration"
  | "donation"
  | "membership_payment";

/**
 * Guard: Transaction fees should only apply when money moves.
 *
 * From EXHIBIT_B_FIRST_PRINCIPLES.md:
 * > Transaction fees on event registrations align the company with event success.
 * > When events are well-attended and financially healthy, ClubOS shares in
 * > that success proportionally.
 *
 * @param transactionType - Type of transaction
 * @param amount - Transaction amount in cents
 * @returns Whether a transaction fee should be charged
 */
export function shouldChargeTransactionFee(
  transactionType: TransactionType,
  amount: number,
): boolean {
  // Rule: No fee when no money moves
  if (amount <= 0) {
    return false;
  }

  // Rule: Free registrations have minimal or zero fees
  if (transactionType === "free_registration") {
    return false;
  }

  // Rule: Paid transactions incur fees (aligned with revenue)
  return true;
}

/**
 * TODO: Transaction fee percentage calculation.
 *
 * This will need configuration once commercialization begins.
 * For now, emit a warning if called in production.
 */
export function calculateTransactionFee(
  _transactionType: TransactionType,
  _amountCents: number,
): number {
  // TODO: Implement when commercialization begins
  // See: docs/BIZ/DUAL_BUSINESS_MODEL.md Section 2.2
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[BusinessRules] calculateTransactionFee called but not yet implemented. " +
        "See docs/BIZ/DUAL_BUSINESS_MODEL.md for fee structure.",
    );
  }
  return 0;
}

// ============================================================================
// Client Zero Licensing (docs/BIZ/DUAL_BUSINESS_MODEL.md Section 3)
// ============================================================================

/**
 * Guard: Client Zero (SBNC) pays no licensing fees during evaluation.
 *
 * From DUAL_BUSINESS_MODEL.md:
 * > No cost to SBNC. All infrastructure, development, and support costs
 * > during the evaluation period are mine. SBNC pays nothing.
 *
 * @param orgId - Organization identifier
 * @returns Whether licensing fee should be charged
 */
export function shouldChargeLicensingFee(orgId: string): boolean {
  // Rule: Client Zero is exempt during evaluation
  if (orgId === CLIENT_ZERO_ORG_ID && CLIENT_ZERO_LICENSING_FEE_WAIVED) {
    return false;
  }

  // TODO: Implement tiered pricing when commercialization begins
  // See: docs/BIZ/DUAL_BUSINESS_MODEL.md Section 2.2 for tier structure
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[BusinessRules] shouldChargeLicensingFee called for non-Client-Zero org. " +
        "Licensing tier structure not yet implemented. " +
        "See docs/BIZ/DUAL_BUSINESS_MODEL.md Section 2.2.",
    );
  }

  return false; // Default to no charge until commercialization
}

/**
 * TODO: Calculate licensing fee based on engaged user count.
 *
 * From DUAL_BUSINESS_MODEL.md:
 * > | Tier | Monthly Rate | Example (500 members) |
 * > |------|--------------|----------------------|
 * > | Base | $X per engaged user | $150 - $300/month |
 */
export function calculateLicensingFee(
  _orgId: string,
  _engagedUserCount: number,
): number {
  // TODO: Implement when commercialization begins
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[BusinessRules] calculateLicensingFee called but pricing not yet defined. " +
        "See docs/BIZ/DUAL_BUSINESS_MODEL.md Section 2.2.",
    );
  }
  return 0;
}

// ============================================================================
// Event Neutrality (docs/ORG/SBNC_Business_Model_and_Sustainability.md)
// ============================================================================

/**
 * Event neutrality target: events should neither make nor lose money over the term.
 *
 * From SBNC_Business_Model_and_Sustainability.md:
 * > The goal for the term is "event neutrality":
 * > Each committee and the club as a whole should neither make nor lose
 * > money from events over the term.
 */
export interface EventFinancials {
  /** Total revenue from event (registrations, etc.) in cents */
  revenueCents: number;
  /** Total costs (venue, supplies, etc.) in cents */
  costsCents: number;
}

/**
 * Calculates event margin for neutrality tracking.
 *
 * @param financials - Event financial data
 * @returns Margin in cents (positive = profit, negative = loss)
 */
export function calculateEventMargin(financials: EventFinancials): number {
  return financials.revenueCents - financials.costsCents;
}

/**
 * Checks if a set of events achieves neutrality (within tolerance).
 *
 * @param events - Array of event financials
 * @param toleranceCents - Acceptable deviation from zero (default: $50)
 * @returns Whether events are neutral
 */
export function checkEventNeutrality(
  events: EventFinancials[],
  toleranceCents: number = 5000,
): boolean {
  const totalMargin = events.reduce(
    (sum, e) => sum + calculateEventMargin(e),
    0,
  );
  return Math.abs(totalMargin) <= toleranceCents;
}

// ============================================================================
// Cash Target (docs/ORG/SBNC_Business_Model_and_Sustainability.md)
// ============================================================================

/**
 * Default target end-of-term cash balance.
 *
 * From SBNC_Business_Model_and_Sustainability.md:
 * > Target end-of-term cash balance (default historical target: 50000).
 * > This must be configurable.
 */
export const DEFAULT_CASH_TARGET_CENTS = 50_000_00; // $50,000

/**
 * Guard: Surplus should be intentionally spent to reach (not exceed) the target.
 *
 * From SBNC_Business_Model_and_Sustainability.md:
 * > If membership revenue or events produce surpluses beyond the cash target,
 * > surplus should be intentionally spent to reach (not exceed) the target.
 */
export function calculateSurplus(
  currentBalanceCents: number,
  targetCents: number = DEFAULT_CASH_TARGET_CENTS,
): number {
  const surplus = currentBalanceCents - targetCents;
  return surplus > 0 ? surplus : 0;
}

/**
 * Suggests surplus allocation based on documented priorities.
 *
 * From SBNC_Business_Model_and_Sustainability.md:
 * > Typical uses:
 * > - Technology and systems
 * > - Professional services
 * > - Fixed assets
 * > - Event subsidies
 */
export function getSurplusAllocationCategories(): string[] {
  return [
    "Technology and systems",
    "Professional services",
    "Fixed assets",
    "Event subsidies (reduce pricing pressure)",
  ];
}

// ============================================================================
// Third-Year Member Tension (docs/ORG/SBNC_Business_Model_and_Sustainability.md)
// ============================================================================

/**
 * Third-year membership business rule.
 *
 * From SBNC_Business_Model_and_Sustainability.md:
 * > Third-year membership:
 * > - Adds non-event revenue (fee paid for third-year membership).
 * > - Increases demand pressure on event capacity.
 * > - Acts as an incentive for volunteering/leadership.
 * >
 * > Risk:
 * > Too many third-year members (demand pressure) without matching volunteer
 * > growth (supply) can reduce newbie availability and break the flywheel.
 */
export interface ThirdYearMetrics {
  /** Count of third-year members */
  thirdYearMemberCount: number;
  /** Count of active volunteers */
  volunteerCount: number;
  /** Count of newbies awaiting first event */
  newbiesAwaitingFirstEvent: number;
  /** Available event capacity (slots) */
  availableEventCapacity: number;
}

/**
 * Checks if third-year member growth is sustainable.
 *
 * Business Rule: Third-year member growth should not outpace volunteer growth
 * or reduce newbie event availability.
 *
 * @param metrics - Third-year sustainability metrics
 * @returns Warning message if imbalanced, null if healthy
 */
export function checkThirdYearBalance(
  metrics: ThirdYearMetrics,
): string | null {
  // Rule: Volunteer count should grow with third-year membership
  const volunteerRatio = metrics.volunteerCount / metrics.thirdYearMemberCount;
  if (volunteerRatio < 0.1) {
    return (
      "Third-year member count exceeds sustainable volunteer ratio. " +
      "Consider increasing volunteer recruitment. " +
      "See: docs/ORG/SBNC_Business_Model_and_Sustainability.md"
    );
  }

  // Rule: Newbies should have event availability
  const newbieCapacityRatio =
    metrics.availableEventCapacity / metrics.newbiesAwaitingFirstEvent;
  if (newbieCapacityRatio < 1.5) {
    return (
      "Event capacity insufficient for newbie first-event attendance. " +
      "Flywheel risk: newbies may not complete first event. " +
      "See: docs/ORG/SBNC_Business_Model_and_Sustainability.md"
    );
  }

  return null;
}

// ============================================================================
// Business Rule Assertions (Runtime Guards)
// ============================================================================

/**
 * Assertion: Validate that a business rule is being followed.
 * Logs warning in development, throws in test mode with strict flag.
 */
export function assertBusinessRule(
  condition: boolean,
  ruleName: string,
  documentReference: string,
): void {
  if (!condition) {
    const message =
      `[BusinessRule Violation] ${ruleName}. ` +
      `Reference: ${documentReference}`;

    if (process.env.NODE_ENV === "test" && process.env.STRICT_BUSINESS_RULES) {
      throw new Error(message);
    } else if (process.env.NODE_ENV !== "production") {
      console.warn(message);
    }
  }
}

/**
 * Guard: Ensures engaged-user billing is used instead of member count.
 *
 * @param memberCount - Total member count
 * @param engagedCount - Engaged user count
 */
export function assertEngagedUserBilling(
  memberCount: number,
  engagedCount: number,
): void {
  assertBusinessRule(
    engagedCount <= memberCount,
    "Engaged user count cannot exceed member count",
    "docs/BIZ/DUAL_BUSINESS_MODEL.md Section 2.2",
  );
}

/**
 * Guard: Ensures transaction fees are not charged on zero-amount transactions.
 *
 * @param amount - Transaction amount
 * @param fee - Proposed fee
 */
export function assertNoFeeOnZeroAmount(amount: number, fee: number): void {
  assertBusinessRule(
    amount > 0 || fee === 0,
    "Transaction fees must not be charged when no money moves",
    "docs/BIZ/DUAL_BUSINESS_MODEL.md Section 2.2",
  );
}

// ============================================================================
// Exports Summary
// ============================================================================

/**
 * Summary of all business rules enforced by this module:
 *
 * 1. ENGAGED_USER_BILLING: Billing based on active users, not total members
 *    - isEngagedUser()
 *    - countEngagedUsers()
 *    - assertEngagedUserBilling()
 *
 * 2. CLIENT_ZERO_EXEMPTION: SBNC pays no licensing during evaluation
 *    - shouldChargeLicensingFee()
 *    - CLIENT_ZERO_LICENSING_FEE_WAIVED
 *
 * 3. TRANSACTION_FEE_ALIGNMENT: Fees only when money moves
 *    - shouldChargeTransactionFee()
 *    - assertNoFeeOnZeroAmount()
 *
 * 4. EVENT_NEUTRALITY: Events should break even over term
 *    - calculateEventMargin()
 *    - checkEventNeutrality()
 *
 * 5. CASH_TARGET: Surplus allocation guidance
 *    - calculateSurplus()
 *    - getSurplusAllocationCategories()
 *
 * 6. THIRD_YEAR_SUSTAINABILITY: Monitor volunteer/capacity balance
 *    - checkThirdYearBalance()
 */
