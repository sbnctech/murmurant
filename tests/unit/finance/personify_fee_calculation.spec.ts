/**
 * Personify Payments Fee Calculation Tests
 *
 * Verifies fee calculation logic for Personify Payments:
 * - Standard card: 2.9% + $0.30
 * - American Express: 3.5% + $0.30
 *
 * No API calls - pure unit tests.
 */

import { describe, it, expect } from "vitest";
import {
  calculateFee,
  calculateStandardFee,
  calculateAmexFee,
  aggregateFees,
  annualizeFees,
  roundCurrency,
  formatCurrency,
  formatPercent,
  PERSONIFY_STANDARD_PERCENT,
  PERSONIFY_AMEX_PERCENT,
  PERSONIFY_FLAT_FEE,
} from "@/lib/finance/personify-fees";

describe("Personify Fee Constants", () => {
  it("has correct standard rate", () => {
    expect(PERSONIFY_STANDARD_PERCENT).toBe(0.029);
  });

  it("has correct AmEx rate", () => {
    expect(PERSONIFY_AMEX_PERCENT).toBe(0.035);
  });

  it("has correct flat fee", () => {
    expect(PERSONIFY_FLAT_FEE).toBe(0.30);
  });
});

describe("calculateFee", () => {
  describe("standard card rate (2.9% + $0.30)", () => {
    it("calculates fee for $100 transaction", () => {
      const result = calculateFee({ amount: 100, cardType: "standard" });

      // Expected: 100 * 0.029 + 0.30 = 2.90 + 0.30 = 3.20
      expect(result.feeAmount).toBe(3.20);
      expect(result.netAmount).toBe(96.80);
      expect(result.effectiveRate).toBeCloseTo(0.032, 4);
    });

    it("calculates fee for $50 transaction", () => {
      const result = calculateFee({ amount: 50, cardType: "standard" });

      // Expected: 50 * 0.029 + 0.30 = 1.45 + 0.30 = 1.75
      expect(result.feeAmount).toBe(1.75);
      expect(result.netAmount).toBe(48.25);
    });

    it("calculates fee for $1000 transaction", () => {
      const result = calculateFee({ amount: 1000, cardType: "standard" });

      // Expected: 1000 * 0.029 + 0.30 = 29.00 + 0.30 = 29.30
      expect(result.feeAmount).toBe(29.30);
      expect(result.netAmount).toBe(970.70);
    });

    it("calculates fee for $25.50 transaction (cents)", () => {
      const result = calculateFee({ amount: 25.5, cardType: "standard" });

      // Expected: 25.50 * 0.029 + 0.30 = 0.7395 + 0.30 = 1.0395 -> 1.04
      expect(result.feeAmount).toBe(1.04);
      expect(result.netAmount).toBe(24.46);
    });
  });

  describe("AmEx rate (3.5% + $0.30)", () => {
    it("calculates fee for $100 transaction", () => {
      const result = calculateFee({ amount: 100, cardType: "amex" });

      // Expected: 100 * 0.035 + 0.30 = 3.50 + 0.30 = 3.80
      expect(result.feeAmount).toBe(3.80);
      expect(result.netAmount).toBe(96.20);
      expect(result.effectiveRate).toBeCloseTo(0.038, 4);
    });

    it("calculates fee for $500 transaction", () => {
      const result = calculateFee({ amount: 500, cardType: "amex" });

      // Expected: 500 * 0.035 + 0.30 = 17.50 + 0.30 = 17.80
      expect(result.feeAmount).toBe(17.80);
      expect(result.netAmount).toBe(482.20);
    });
  });

  describe("small transactions (flat fee dominates)", () => {
    it("calculates fee for $5 transaction", () => {
      const result = calculateFee({ amount: 5, cardType: "standard" });

      // Expected: 5 * 0.029 + 0.30 = 0.145 + 0.30 = 0.445 -> 0.45
      expect(result.feeAmount).toBe(0.45);
      // Effective rate: 0.45 / 5 = 9%
      expect(result.effectiveRate).toBeCloseTo(0.09, 2);
    });

    it("calculates fee for $1 transaction", () => {
      const result = calculateFee({ amount: 1, cardType: "standard" });

      // Expected: 1 * 0.029 + 0.30 = 0.029 + 0.30 = 0.329 -> 0.33
      expect(result.feeAmount).toBe(0.33);
      // Effective rate: 0.33 / 1 = 33%
      expect(result.effectiveRate).toBeCloseTo(0.33, 2);
    });

    it("calculates fee for $10 transaction (flat fee is 3% alone)", () => {
      const result = calculateFee({ amount: 10, cardType: "standard" });

      // Expected: 10 * 0.029 + 0.30 = 0.29 + 0.30 = 0.59
      expect(result.feeAmount).toBe(0.59);
      // Effective rate: 0.59 / 10 = 5.9%
      expect(result.effectiveRate).toBeCloseTo(0.059, 3);
    });
  });

  describe("unknown card type defaults to standard", () => {
    it("uses standard rate when card type is unknown", () => {
      const result = calculateFee({ amount: 100, cardType: "unknown" });

      expect(result.cardType).toBe("standard");
      expect(result.cardTypeAssumed).toBe(true);
      expect(result.feeAmount).toBe(3.20); // Same as standard
    });

    it("uses standard rate when card type is omitted", () => {
      const result = calculateFee({ amount: 100 });

      expect(result.cardType).toBe("standard");
      expect(result.cardTypeAssumed).toBe(true);
      expect(result.feeAmount).toBe(3.20);
    });
  });

  describe("edge cases", () => {
    it("handles zero amount", () => {
      const result = calculateFee({ amount: 0 });

      expect(result.feeAmount).toBe(0.30); // Flat fee still applies
      expect(result.netAmount).toBe(-0.30);
      expect(result.effectiveRate).toBe(0); // Avoid division by zero
    });

    it("handles very large amounts", () => {
      const result = calculateFee({ amount: 10000 });

      // Expected: 10000 * 0.029 + 0.30 = 290 + 0.30 = 290.30
      expect(result.feeAmount).toBe(290.30);
      expect(result.netAmount).toBe(9709.70);
    });
  });
});

describe("calculateStandardFee", () => {
  it("returns correct fee for common amounts", () => {
    expect(calculateStandardFee(100)).toBe(3.20);
    expect(calculateStandardFee(50)).toBe(1.75);
    expect(calculateStandardFee(200)).toBe(6.10);
  });
});

describe("calculateAmexFee", () => {
  it("returns correct fee for common amounts", () => {
    expect(calculateAmexFee(100)).toBe(3.80);
    expect(calculateAmexFee(50)).toBe(2.05);
    expect(calculateAmexFee(200)).toBe(7.30);
  });
});

describe("aggregateFees", () => {
  it("aggregates multiple transactions", () => {
    const amounts = [100, 50, 200];
    const result = aggregateFees(amounts, "standard");

    expect(result.transactionCount).toBe(3);
    expect(result.totalGrossAmount).toBe(350);
    // Fees: 3.20 + 1.75 + 6.10 = 11.05
    expect(result.totalFees).toBe(11.05);
    expect(result.totalNetAmount).toBe(338.95);
    expect(result.averageTransactionSize).toBeCloseTo(116.67, 2);
  });

  it("calculates min and max", () => {
    const amounts = [10, 100, 50, 500, 25];
    const result = aggregateFees(amounts);

    expect(result.minTransactionAmount).toBe(10);
    expect(result.maxTransactionAmount).toBe(500);
  });

  it("handles empty array", () => {
    const result = aggregateFees([]);

    expect(result.transactionCount).toBe(0);
    expect(result.totalGrossAmount).toBe(0);
    expect(result.totalFees).toBe(0);
    expect(result.effectiveRate).toBe(0);
  });

  it("handles single transaction", () => {
    const result = aggregateFees([100]);

    expect(result.transactionCount).toBe(1);
    expect(result.totalGrossAmount).toBe(100);
    expect(result.totalFees).toBe(3.20);
    expect(result.averageTransactionSize).toBe(100);
    expect(result.standardDeviation).toBe(0);
  });

  it("uses AmEx rate when specified", () => {
    const result = aggregateFees([100], "amex");

    expect(result.totalFees).toBe(3.80);
  });
});

describe("annualizeFees", () => {
  it("annualizes from full year", () => {
    const annualized = annualizeFees(1000, 365);

    expect(annualized).toBe(1000);
  });

  it("annualizes from half year", () => {
    const annualized = annualizeFees(500, 182);

    // 500 / 182 * 365 = 1002.747... -> rounds to 1002.75
    expect(annualized).toBeCloseTo(1002.75, 2);
  });

  it("annualizes from one month", () => {
    const annualized = annualizeFees(100, 30);

    // 100 / 30 * 365 = 1216.67
    expect(annualized).toBeCloseTo(1216.67, 2);
  });

  it("handles zero days", () => {
    expect(annualizeFees(100, 0)).toBe(0);
  });
});

describe("utility functions", () => {
  describe("roundCurrency", () => {
    it("rounds to 2 decimal places", () => {
      expect(roundCurrency(1.234)).toBe(1.23);
      expect(roundCurrency(1.235)).toBe(1.24);
      expect(roundCurrency(1.999)).toBe(2.00);
    });
  });

  describe("formatCurrency", () => {
    it("formats amounts with dollar sign", () => {
      expect(formatCurrency(100)).toBe("$100.00");
      expect(formatCurrency(1000)).toBe("$1,000.00");
      expect(formatCurrency(25.5)).toBe("$25.50");
    });
  });

  describe("formatPercent", () => {
    it("formats rates as percentages", () => {
      expect(formatPercent(0.029)).toBe("2.90%");
      expect(formatPercent(0.035)).toBe("3.50%");
      expect(formatPercent(0.10)).toBe("10.00%");
    });
  });
});

describe("real-world scenarios", () => {
  it("calculates fees for typical membership renewal ($75)", () => {
    const result = calculateFee({ amount: 75 });

    // 75 * 0.029 + 0.30 = 2.175 + 0.30 = 2.475 -> 2.48
    expect(result.feeAmount).toBe(2.48);
    expect(result.effectiveRate).toBeCloseTo(0.033, 2);
  });

  it("calculates fees for typical event registration ($25)", () => {
    const result = calculateFee({ amount: 25 });

    // 25 * 0.029 + 0.30 = 0.725 + 0.30 = 1.025 -> 1.03
    expect(result.feeAmount).toBe(1.03);
    expect(result.effectiveRate).toBeCloseTo(0.041, 2);
  });

  it("calculates annual fees for typical club volume", () => {
    // Simulate: 200 memberships @ $75 + 500 events @ $25
    const membershipAmounts = Array(200).fill(75);
    const eventAmounts = Array(500).fill(25);
    const allAmounts = [...membershipAmounts, ...eventAmounts];

    const result = aggregateFees(allAmounts);

    // 200 * 75 = 15,000 + 500 * 25 = 12,500 = 27,500 gross
    expect(result.totalGrossAmount).toBe(27500);
    // 700 transactions * ~$1.50 avg fee = ~$1,050
    expect(result.totalFees).toBeGreaterThan(1000);
    expect(result.totalFees).toBeLessThan(1200);
  });
});
