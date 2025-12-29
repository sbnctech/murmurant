/**
 * Business Rules Tests
 *
 * Tests that documented business model rules are correctly enforced in code.
 * Each test references the source documentation that defines the rule.
 *
 * @see src/lib/businessRules.ts
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  CLIENT_ZERO_ORG_ID,
  CLIENT_ZERO_LICENSING_FEE_WAIVED,
  isEngagedUser,
  countEngagedUsers,
  shouldChargeTransactionFee,
  shouldChargeLicensingFee,
  calculateEventMargin,
  checkEventNeutrality,
  DEFAULT_CASH_TARGET_CENTS,
  calculateSurplus,
  getSurplusAllocationCategories,
  checkThirdYearBalance,
  assertBusinessRule,
  assertEngagedUserBilling,
  assertNoFeeOnZeroAmount,
  type EngagedUserCriteria,
  type EventFinancials,
  type ThirdYearMetrics,
} from "@/lib/businessRules";

describe("Business Rules: Client Zero Constants", () => {
  /**
   * Reference: docs/BIZ/DUAL_BUSINESS_MODEL.md Section 3.1
   *
   * "SBNC is the founding customer of Murmurant."
   * "SBNC is 'Client Zero' - the founding customer."
   */
  it("defines SBNC as Client Zero", () => {
    expect(CLIENT_ZERO_ORG_ID).toBe("sbnc");
  });

  /**
   * Reference: docs/BIZ/DUAL_BUSINESS_MODEL.md Section 1.2
   * Reference: docs/BIZ/BOARD_EMAIL_EVALUATION_REQUEST.md
   *
   * "No cost to SBNC. All infrastructure, development, and support costs
   * during the evaluation period are mine. SBNC pays nothing."
   */
  it("waives licensing fees for Client Zero during evaluation", () => {
    expect(CLIENT_ZERO_LICENSING_FEE_WAIVED).toBe(true);
  });
});

describe("Business Rules: Engaged User Billing", () => {
  const billingPeriod = {
    periodStart: new Date("2025-01-01"),
    periodEnd: new Date("2025-01-31"),
  };

  /**
   * Reference: docs/BIZ/DUAL_BUSINESS_MODEL.md Section 2.2
   *
   * "'Engaged user' is defined as members who have logged in or participated
   * in the billing period."
   */
  describe("isEngagedUser", () => {
    it("returns true if member has logged in", () => {
      const criteria: EngagedUserCriteria = {
        hasLoggedIn: true,
        hasParticipated: false,
        ...billingPeriod,
      };
      expect(isEngagedUser(criteria)).toBe(true);
    });

    it("returns true if member has participated", () => {
      const criteria: EngagedUserCriteria = {
        hasLoggedIn: false,
        hasParticipated: true,
        ...billingPeriod,
      };
      expect(isEngagedUser(criteria)).toBe(true);
    });

    it("returns true if member has both logged in and participated", () => {
      const criteria: EngagedUserCriteria = {
        hasLoggedIn: true,
        hasParticipated: true,
        ...billingPeriod,
      };
      expect(isEngagedUser(criteria)).toBe(true);
    });

    it("returns false if member has neither logged in nor participated", () => {
      const criteria: EngagedUserCriteria = {
        hasLoggedIn: false,
        hasParticipated: false,
        ...billingPeriod,
      };
      expect(isEngagedUser(criteria)).toBe(false);
    });
  });

  /**
   * Reference: docs/BIZ/EXHIBIT_B_FIRST_PRINCIPLES.md
   *
   * "A 700-member organization where 50 members actively use the system pays
   * based on those 50 active users, not on the 700 names in the database."
   */
  describe("countEngagedUsers", () => {
    it("counts only engaged members, not total members", () => {
      const members = [
        { hasLoggedIn: true, hasParticipated: false },
        { hasLoggedIn: false, hasParticipated: true },
        { hasLoggedIn: false, hasParticipated: false },
        { hasLoggedIn: false, hasParticipated: false },
        { hasLoggedIn: true, hasParticipated: true },
      ];
      expect(countEngagedUsers(members)).toBe(3);
    });

    it("returns zero for all dormant members", () => {
      const members = Array(100).fill({ hasLoggedIn: false, hasParticipated: false });
      expect(countEngagedUsers(members)).toBe(0);
    });

    it("handles empty member list", () => {
      expect(countEngagedUsers([])).toBe(0);
    });
  });
});

describe("Business Rules: Transaction Fees", () => {
  /**
   * Reference: docs/BIZ/DUAL_BUSINESS_MODEL.md Section 2.2
   *
   * "| Transaction Type | Fee Structure |
   *  |------------------|---------------|
   *  | Paid registration | Percentage + fixed |
   *  | Free registration | Minimal or zero |
   *  | Donations | Percentage |"
   */
  describe("shouldChargeTransactionFee", () => {
    it("charges fee for paid registration with positive amount", () => {
      expect(shouldChargeTransactionFee("paid_registration", 5000)).toBe(true);
    });

    it("charges fee for donation with positive amount", () => {
      expect(shouldChargeTransactionFee("donation", 10000)).toBe(true);
    });

    it("charges fee for membership payment with positive amount", () => {
      expect(shouldChargeTransactionFee("membership_payment", 7500)).toBe(true);
    });

    /**
     * Reference: docs/BIZ/DUAL_BUSINESS_MODEL.md
     * "Free registration | Minimal or zero"
     */
    it("does NOT charge fee for free registration", () => {
      expect(shouldChargeTransactionFee("free_registration", 0)).toBe(false);
    });

    /**
     * Business Rule: No fee when no money moves
     * This is a fundamental constraint - fees align with value exchange.
     */
    it("does NOT charge fee when amount is zero", () => {
      expect(shouldChargeTransactionFee("paid_registration", 0)).toBe(false);
      expect(shouldChargeTransactionFee("donation", 0)).toBe(false);
      expect(shouldChargeTransactionFee("membership_payment", 0)).toBe(false);
    });

    it("does NOT charge fee when amount is negative", () => {
      expect(shouldChargeTransactionFee("paid_registration", -100)).toBe(false);
    });
  });
});

describe("Business Rules: Client Zero Licensing Exemption", () => {
  /**
   * Reference: docs/BIZ/DUAL_BUSINESS_MODEL.md Section 3
   *
   * "No cost to SBNC. All infrastructure, development, and support costs
   * during the evaluation period are mine. SBNC pays nothing."
   */
  describe("shouldChargeLicensingFee", () => {
    it("does NOT charge licensing fee for Client Zero (SBNC)", () => {
      expect(shouldChargeLicensingFee("sbnc")).toBe(false);
    });

    /**
     * During pre-commercialization, no orgs pay licensing fees.
     * This will change when commercialization begins.
     */
    it("currently returns false for other orgs (pre-commercialization)", () => {
      expect(shouldChargeLicensingFee("other-org")).toBe(false);
    });
  });
});

describe("Business Rules: Event Neutrality", () => {
  /**
   * Reference: docs/ORG/SBNC_Business_Model_and_Sustainability.md
   *
   * "The goal for the term is 'event neutrality':
   * Each committee and the club as a whole should neither make nor lose
   * money from events over the term."
   */
  describe("calculateEventMargin", () => {
    it("calculates positive margin (profit)", () => {
      const event: EventFinancials = { revenueCents: 10000, costsCents: 8000 };
      expect(calculateEventMargin(event)).toBe(2000);
    });

    it("calculates negative margin (loss)", () => {
      const event: EventFinancials = { revenueCents: 5000, costsCents: 7000 };
      expect(calculateEventMargin(event)).toBe(-2000);
    });

    it("calculates zero margin (neutral)", () => {
      const event: EventFinancials = { revenueCents: 6000, costsCents: 6000 };
      expect(calculateEventMargin(event)).toBe(0);
    });
  });

  describe("checkEventNeutrality", () => {
    it("returns true when events are exactly neutral", () => {
      const events: EventFinancials[] = [
        { revenueCents: 10000, costsCents: 10000 },
        { revenueCents: 5000, costsCents: 5000 },
      ];
      expect(checkEventNeutrality(events)).toBe(true);
    });

    it("returns true when total is within tolerance", () => {
      const events: EventFinancials[] = [
        { revenueCents: 10000, costsCents: 8000 }, // +2000
        { revenueCents: 5000, costsCents: 6000 }, // -1000
        // Net: +1000, within $50 tolerance
      ];
      expect(checkEventNeutrality(events, 5000)).toBe(true);
    });

    it("returns false when profit exceeds tolerance", () => {
      const events: EventFinancials[] = [
        { revenueCents: 100000, costsCents: 50000 }, // +50000
      ];
      expect(checkEventNeutrality(events, 5000)).toBe(false);
    });

    it("returns false when loss exceeds tolerance", () => {
      const events: EventFinancials[] = [
        { revenueCents: 50000, costsCents: 100000 }, // -50000
      ];
      expect(checkEventNeutrality(events, 5000)).toBe(false);
    });

    it("uses default $50 tolerance", () => {
      const events: EventFinancials[] = [
        { revenueCents: 10000, costsCents: 5000 }, // +5000 = exactly $50
      ];
      expect(checkEventNeutrality(events)).toBe(true);

      const eventsOverTolerance: EventFinancials[] = [
        { revenueCents: 10000, costsCents: 4999 }, // +5001 = just over $50
      ];
      expect(checkEventNeutrality(eventsOverTolerance)).toBe(false);
    });
  });
});

describe("Business Rules: Cash Target Balance", () => {
  /**
   * Reference: docs/ORG/SBNC_Business_Model_and_Sustainability.md
   *
   * "Target end-of-term cash balance (default historical target: 50000).
   * This must be configurable."
   */
  it("defines default cash target as $50,000", () => {
    expect(DEFAULT_CASH_TARGET_CENTS).toBe(50_000_00);
  });

  describe("calculateSurplus", () => {
    /**
     * Reference: docs/ORG/SBNC_Business_Model_and_Sustainability.md
     *
     * "If membership revenue or events produce surpluses beyond the cash target,
     * surplus should be intentionally spent to reach (not exceed) the target."
     */
    it("calculates surplus when above target", () => {
      expect(calculateSurplus(60_000_00)).toBe(10_000_00); // $10,000 surplus
    });

    it("returns zero when at target", () => {
      expect(calculateSurplus(50_000_00)).toBe(0);
    });

    it("returns zero when below target", () => {
      expect(calculateSurplus(40_000_00)).toBe(0);
    });

    it("accepts custom target", () => {
      expect(calculateSurplus(30_000_00, 25_000_00)).toBe(5_000_00);
    });
  });

  describe("getSurplusAllocationCategories", () => {
    /**
     * Reference: docs/ORG/SBNC_Business_Model_and_Sustainability.md
     *
     * "Typical uses:
     * - Technology and systems
     * - Professional services
     * - Fixed assets
     * - Event subsidies"
     */
    it("returns documented surplus allocation categories", () => {
      const categories = getSurplusAllocationCategories();
      expect(categories).toContain("Technology and systems");
      expect(categories).toContain("Professional services");
      expect(categories).toContain("Fixed assets");
      expect(categories).toContain("Event subsidies (reduce pricing pressure)");
    });
  });
});

describe("Business Rules: Third-Year Member Sustainability", () => {
  /**
   * Reference: docs/ORG/SBNC_Business_Model_and_Sustainability.md
   *
   * "Third-year membership:
   * - Adds non-event revenue (fee paid for third-year membership).
   * - Increases demand pressure on event capacity.
   * - Acts as an incentive for volunteering/leadership.
   *
   * Risk:
   * Too many third-year members (demand pressure) without matching volunteer
   * growth (supply) can reduce newbie availability and break the flywheel."
   */
  describe("checkThirdYearBalance", () => {
    it("returns null when balance is healthy", () => {
      const metrics: ThirdYearMetrics = {
        thirdYearMemberCount: 50,
        volunteerCount: 10, // 10/50 = 20% > 10% threshold
        newbiesAwaitingFirstEvent: 20,
        availableEventCapacity: 40, // 40/20 = 2.0 > 1.5 threshold
      };
      expect(checkThirdYearBalance(metrics)).toBeNull();
    });

    it("warns when volunteer ratio is too low", () => {
      const metrics: ThirdYearMetrics = {
        thirdYearMemberCount: 100,
        volunteerCount: 5, // 5/100 = 5% < 10% threshold
        newbiesAwaitingFirstEvent: 20,
        availableEventCapacity: 40,
      };
      const warning = checkThirdYearBalance(metrics);
      expect(warning).toContain("volunteer ratio");
      expect(warning).toContain("docs/ORG/SBNC_Business_Model_and_Sustainability.md");
    });

    it("warns when newbie event capacity is insufficient", () => {
      const metrics: ThirdYearMetrics = {
        thirdYearMemberCount: 50,
        volunteerCount: 10,
        newbiesAwaitingFirstEvent: 30,
        availableEventCapacity: 40, // 40/30 = 1.33 < 1.5 threshold
      };
      const warning = checkThirdYearBalance(metrics);
      expect(warning).toContain("Event capacity insufficient");
      expect(warning).toContain("Flywheel risk");
    });

    it("returns volunteer warning first if both issues exist", () => {
      const metrics: ThirdYearMetrics = {
        thirdYearMemberCount: 100,
        volunteerCount: 5, // Both ratios are bad
        newbiesAwaitingFirstEvent: 50,
        availableEventCapacity: 40,
      };
      const warning = checkThirdYearBalance(metrics);
      expect(warning).toContain("volunteer ratio"); // This check comes first
    });
  });
});

describe("Business Rules: Runtime Assertions", () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  describe("assertBusinessRule", () => {
    it("does nothing when condition is true", () => {
      assertBusinessRule(true, "Test Rule", "docs/test.md");
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("warns in development when condition is false", () => {
      vi.stubEnv("NODE_ENV", "development");
      assertBusinessRule(false, "Test Rule", "docs/test.md");
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[BusinessRule Violation]"),
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Test Rule"));
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("docs/test.md"));
    });

    it("throws in test mode with STRICT_BUSINESS_RULES", () => {
      vi.stubEnv("NODE_ENV", "test");
      vi.stubEnv("STRICT_BUSINESS_RULES", "true");
      expect(() => {
        assertBusinessRule(false, "Test Rule", "docs/test.md");
      }).toThrow("[BusinessRule Violation]");
    });

    it("does NOT warn in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      assertBusinessRule(false, "Test Rule", "docs/test.md");
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe("assertEngagedUserBilling", () => {
    /**
     * Guard: Engaged user count cannot exceed member count.
     * This would indicate a logic error in the billing calculation.
     */
    it("does nothing when engaged count <= member count", () => {
      vi.stubEnv("NODE_ENV", "development");
      assertEngagedUserBilling(100, 50);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("warns when engaged count exceeds member count", () => {
      vi.stubEnv("NODE_ENV", "development");
      assertEngagedUserBilling(50, 100); // Invalid: 100 engaged > 50 total
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Engaged user count cannot exceed member count"),
      );
    });
  });

  describe("assertNoFeeOnZeroAmount", () => {
    /**
     * Guard: Transaction fees should never be charged on zero-amount transactions.
     * Reference: docs/BIZ/DUAL_BUSINESS_MODEL.md
     */
    it("does nothing when amount > 0 with fee", () => {
      vi.stubEnv("NODE_ENV", "development");
      assertNoFeeOnZeroAmount(100, 5);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("does nothing when amount = 0 with no fee", () => {
      vi.stubEnv("NODE_ENV", "development");
      assertNoFeeOnZeroAmount(0, 0);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("warns when amount = 0 but fee > 0", () => {
      vi.stubEnv("NODE_ENV", "development");
      assertNoFeeOnZeroAmount(0, 5); // Invalid: fee on zero amount
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("fees must not be charged when no money moves"),
      );
    });
  });
});
