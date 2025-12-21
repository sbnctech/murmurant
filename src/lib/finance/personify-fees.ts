/**
 * Personify Payments Fee Calculation
 *
 * Implements the fee structure for Personify Payments (WA's payment processor).
 *
 * Fee Rules (as of 2024):
 * - Standard cards: 2.9% + $0.30 per transaction
 * - American Express: 3.5% + $0.30 per transaction
 * - Fees are withdrawn monthly in arrears
 * - Merchant (SBNC) pays the fees
 * - WA does NOT charge the 20% PSSF when using Personify Payments
 *
 * Note: WA API does not expose card type, so we cannot distinguish AmEx.
 * We use the standard rate for all calculations and note this limitation.
 */

// ============================================================================
// Fee Constants
// ============================================================================

/**
 * Personify standard card fee percentage (2.9%)
 */
export const PERSONIFY_STANDARD_PERCENT = 0.029;

/**
 * Personify American Express fee percentage (3.5%)
 */
export const PERSONIFY_AMEX_PERCENT = 0.035;

/**
 * Personify per-transaction flat fee ($0.30)
 */
export const PERSONIFY_FLAT_FEE = 0.30;

// ============================================================================
// Fee Calculation Types
// ============================================================================

export type CardType = "standard" | "amex" | "unknown";

export interface FeeCalculationInput {
  /** Gross transaction amount in dollars */
  amount: number;
  /** Card type if known (defaults to standard if unknown) */
  cardType?: CardType;
}

export interface FeeCalculationResult {
  /** Original transaction amount */
  grossAmount: number;
  /** Calculated fee amount */
  feeAmount: number;
  /** Net amount after fee */
  netAmount: number;
  /** Fee as percentage of gross (effective rate) */
  effectiveRate: number;
  /** Card type used for calculation */
  cardType: CardType;
  /** Whether card type was assumed (vs known) */
  cardTypeAssumed: boolean;
}

export interface FeeAggregation {
  /** Number of transactions */
  transactionCount: number;
  /** Total gross amount processed */
  totalGrossAmount: number;
  /** Total fees paid */
  totalFees: number;
  /** Total net amount after fees */
  totalNetAmount: number;
  /** Average transaction size */
  averageTransactionSize: number;
  /** Blended effective fee rate */
  effectiveRate: number;
  /** Minimum transaction amount */
  minTransactionAmount: number;
  /** Maximum transaction amount */
  maxTransactionAmount: number;
  /** Standard deviation of transaction amounts */
  standardDeviation: number;
}

// ============================================================================
// Fee Calculation Functions
// ============================================================================

/**
 * Calculate the fee for a single transaction.
 *
 * @param input - Transaction details
 * @returns Detailed fee calculation result
 */
export function calculateFee(input: FeeCalculationInput): FeeCalculationResult {
  const { amount, cardType = "unknown" } = input;

  // Determine rate based on card type
  const effectiveCardType = cardType === "unknown" ? "standard" : cardType;
  const percentRate =
    effectiveCardType === "amex"
      ? PERSONIFY_AMEX_PERCENT
      : PERSONIFY_STANDARD_PERCENT;

  // Calculate fee: percentage + flat fee
  const percentageFee = amount * percentRate;
  const feeAmount = percentageFee + PERSONIFY_FLAT_FEE;

  // Calculate net and effective rate
  const netAmount = amount - feeAmount;
  const effectiveRate = amount > 0 ? feeAmount / amount : 0;

  return {
    grossAmount: amount,
    feeAmount: roundCurrency(feeAmount),
    netAmount: roundCurrency(netAmount),
    effectiveRate,
    cardType: effectiveCardType,
    cardTypeAssumed: cardType === "unknown",
  };
}

/**
 * Calculate the fee assuming standard card rate.
 * Convenience function for the most common case.
 *
 * @param amount - Gross transaction amount
 * @returns Fee amount
 */
export function calculateStandardFee(amount: number): number {
  return roundCurrency(amount * PERSONIFY_STANDARD_PERCENT + PERSONIFY_FLAT_FEE);
}

/**
 * Calculate the fee assuming AmEx rate.
 *
 * @param amount - Gross transaction amount
 * @returns Fee amount
 */
export function calculateAmexFee(amount: number): number {
  return roundCurrency(amount * PERSONIFY_AMEX_PERCENT + PERSONIFY_FLAT_FEE);
}

/**
 * Aggregate fees across multiple transactions.
 *
 * @param amounts - Array of gross transaction amounts
 * @param cardType - Assumed card type for all (defaults to standard)
 * @returns Aggregated fee statistics
 */
export function aggregateFees(
  amounts: number[],
  cardType: CardType = "standard"
): FeeAggregation {
  if (amounts.length === 0) {
    return {
      transactionCount: 0,
      totalGrossAmount: 0,
      totalFees: 0,
      totalNetAmount: 0,
      averageTransactionSize: 0,
      effectiveRate: 0,
      minTransactionAmount: 0,
      maxTransactionAmount: 0,
      standardDeviation: 0,
    };
  }

  // Calculate individual fees
  const results = amounts.map((amount) =>
    calculateFee({ amount, cardType })
  );

  // Aggregate
  const totalGrossAmount = results.reduce((sum, r) => sum + r.grossAmount, 0);
  const totalFees = results.reduce((sum, r) => sum + r.feeAmount, 0);
  const totalNetAmount = results.reduce((sum, r) => sum + r.netAmount, 0);
  const averageTransactionSize = totalGrossAmount / amounts.length;

  // Calculate standard deviation
  const squaredDiffs = amounts.map((a) =>
    Math.pow(a - averageTransactionSize, 2)
  );
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / amounts.length;
  const standardDeviation = Math.sqrt(variance);

  return {
    transactionCount: amounts.length,
    totalGrossAmount: roundCurrency(totalGrossAmount),
    totalFees: roundCurrency(totalFees),
    totalNetAmount: roundCurrency(totalNetAmount),
    averageTransactionSize: roundCurrency(averageTransactionSize),
    effectiveRate: totalGrossAmount > 0 ? totalFees / totalGrossAmount : 0,
    minTransactionAmount: Math.min(...amounts),
    maxTransactionAmount: Math.max(...amounts),
    standardDeviation: roundCurrency(standardDeviation),
  };
}

/**
 * Estimate annual fees from a sample period.
 *
 * @param fees - Total fees from sample period
 * @param daysInSample - Number of days in sample
 * @returns Estimated annual fees
 */
export function annualizeFees(fees: number, daysInSample: number): number {
  if (daysInSample <= 0) return 0;
  return roundCurrency((fees / daysInSample) * 365);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Round to 2 decimal places for currency.
 */
export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Format currency for display.
 * Uses Intl.NumberFormat for consistent formatting.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage for display.
 */
export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}
