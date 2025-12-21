#!/usr/bin/env npx tsx
/**
 * Wild Apricot Personify Payments Analysis Script
 *
 * Fetches payment/invoice data from Wild Apricot and calculates
 * estimated Personify Payments processing fees.
 *
 * Run with:
 *   npx tsx scripts/finance/wa_personify_payments_analyze.ts
 *
 * Options:
 *   --from YYYY-MM-DD     Start date (default: 12 months ago)
 *   --to YYYY-MM-DD       End date (default: today)
 *   --dry-run             Preview mode (still fetches data, no side effects)
 *   --json                Output only JSON summary (no console tables)
 *   --help                Show this help message
 *
 * Environment variables:
 *   WA_API_KEY      - Required: Wild Apricot API key
 *   WA_ACCOUNT_ID   - Required: Wild Apricot account ID
 *
 * Output:
 *   - Console-readable summary table
 *   - JSON summary object printed at end
 */

import { config } from "dotenv";
config();

import {
  aggregateFees,
  annualizeFees,
  formatCurrency,
  formatPercent,
  PERSONIFY_STANDARD_PERCENT,
  PERSONIFY_FLAT_FEE,
  type FeeAggregation,
} from "@/lib/finance/personify-fees";

// ============================================================================
// Types
// ============================================================================

interface WAInvoice {
  Id: number;
  DocumentNumber: string;
  DocumentDate: string;
  Contact: { Id: number; Name: string } | null;
  OrderType: string;
  Value: number;
  PaidAmount: number;
  OutstandingBalance: number;
  Status: string;
  CreatedDate: string;
  UpdatedDate: string;
  Memo: string | null;
}

interface WAPayment {
  Id: number;
  Amount: number;
  Type: string;
  Tender: string;
  DocumentDate: string;
  Contact: { Id: number; Name: string } | null;
  CreatedDate: string;
}

interface AnalysisResult {
  dateRange: {
    from: string;
    to: string;
    daysInPeriod: number;
  };
  invoices: {
    totalCount: number;
    paidCount: number;
    unpaidCount: number;
    partialCount: number;
    cancelledCount: number;
  };
  payments: {
    totalCount: number;
    byTender: Record<string, { count: number; amount: number }>;
  };
  financials: {
    totalGrossAmount: number;
    totalEstimatedFees: number;
    totalNetAmount: number;
    averageTransactionSize: number;
    effectiveRate: number;
    minTransactionSize: number;
    maxTransactionSize: number;
  };
  annualized: {
    estimatedAnnualGross: number;
    estimatedAnnualFees: number;
    estimatedAnnualNet: number;
  };
  feeRules: {
    standardPercent: string;
    flatFee: string;
    amexPercent: string;
    note: string;
  };
  limitations: string[];
  generatedAt: string;
}

interface CLIArgs {
  fromDate: Date;
  toDate: Date;
  dryRun: boolean;
  jsonOnly: boolean;
  help: boolean;
}

// ============================================================================
// WA API Client (simplified for this script)
// ============================================================================

class WAFinanceClient {
  private apiBaseUrl: string;
  private authUrl: string;
  private accountId: string;
  private apiKey: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.apiBaseUrl = process.env.WA_API_BASE_URL || "https://api.wildapricot.org/v2.2";
    this.authUrl = process.env.WA_AUTH_URL || "https://oauth.wildapricot.org/auth/token";
    this.accountId = process.env.WA_ACCOUNT_ID || "";
    this.apiKey = process.env.WA_API_KEY || "";

    if (!this.accountId || !this.apiKey) {
      throw new Error("WA_ACCOUNT_ID and WA_API_KEY environment variables are required");
    }
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && this.tokenExpiry > now + 60000) {
      return this.accessToken;
    }

    const credentials = Buffer.from(`APIKEY:${this.apiKey}`).toString("base64");
    const response = await fetch(this.authUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials&scope=auto",
    });

    if (!response.ok) {
      throw new Error(`Failed to obtain access token: ${response.status}`);
    }

    const data = await response.json();
    const token: string = data.access_token;
    this.accessToken = token;
    this.tokenExpiry = now + data.expires_in * 1000;

    return token;
  }

  private async request<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    const token = await this.getAccessToken();
    const url = new URL(`${this.apiBaseUrl}${endpoint}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API request failed: ${response.status} - ${text}`);
    }

    return response.json();
  }

  /**
   * Fetch invoices with pagination.
   */
  async fetchInvoices(fromDate: Date, toDate: Date): Promise<WAInvoice[]> {
    const allInvoices: WAInvoice[] = [];
    let skip = 0;
    const pageSize = 100;

    // Format dates for WA API filter
    const fromStr = fromDate.toISOString().split("T")[0];
    const toStr = toDate.toISOString().split("T")[0];

    while (true) {
      const response = await this.request<{ Invoices: WAInvoice[] }>(
        `/accounts/${this.accountId}/invoices`,
        {
          $filter: `DocumentDate ge ${fromStr} AND DocumentDate le ${toStr}`,
          $top: pageSize,
          $skip: skip,
        }
      );

      const invoices = response.Invoices || [];
      if (invoices.length === 0) break;

      allInvoices.push(...invoices);

      if (invoices.length < pageSize) break;
      skip += pageSize;
    }

    return allInvoices;
  }

  /**
   * Fetch payments with pagination.
   */
  async fetchPayments(fromDate: Date, toDate: Date): Promise<WAPayment[]> {
    const allPayments: WAPayment[] = [];
    let skip = 0;
    const pageSize = 100;

    const fromStr = fromDate.toISOString().split("T")[0];
    const toStr = toDate.toISOString().split("T")[0];

    while (true) {
      const response = await this.request<{ Payments: WAPayment[] }>(
        `/accounts/${this.accountId}/payments`,
        {
          $filter: `DocumentDate ge ${fromStr} AND DocumentDate le ${toStr}`,
          $top: pageSize,
          $skip: skip,
        }
      );

      const payments = response.Payments || [];
      if (payments.length === 0) break;

      allPayments.push(...payments);

      if (payments.length < pageSize) break;
      skip += pageSize;
    }

    return allPayments;
  }

  /**
   * Test API connectivity.
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Analysis Functions
// ============================================================================

function analyzeInvoices(invoices: WAInvoice[]): {
  paidCount: number;
  unpaidCount: number;
  partialCount: number;
  cancelledCount: number;
  paidAmounts: number[];
} {
  const paidAmounts: number[] = [];
  let paidCount = 0;
  let unpaidCount = 0;
  let partialCount = 0;
  let cancelledCount = 0;

  for (const inv of invoices) {
    switch (inv.Status) {
      case "Paid":
        paidCount++;
        if (inv.PaidAmount > 0) {
          paidAmounts.push(inv.PaidAmount);
        }
        break;
      case "PartiallyPaid":
        partialCount++;
        if (inv.PaidAmount > 0) {
          paidAmounts.push(inv.PaidAmount);
        }
        break;
      case "Unpaid":
        unpaidCount++;
        break;
      case "Cancelled":
      case "Refunded":
        cancelledCount++;
        break;
    }
  }

  return { paidCount, unpaidCount, partialCount, cancelledCount, paidAmounts };
}

function analyzePayments(payments: WAPayment[]): {
  byTender: Record<string, { count: number; amount: number }>;
  creditCardAmounts: number[];
} {
  const byTender: Record<string, { count: number; amount: number }> = {};
  const creditCardAmounts: number[] = [];

  for (const pmt of payments) {
    const tender = pmt.Tender || "Unknown";

    if (!byTender[tender]) {
      byTender[tender] = { count: 0, amount: 0 };
    }
    byTender[tender].count++;
    byTender[tender].amount += pmt.Amount;

    // Credit card payments incur Personify fees
    if (
      tender.toLowerCase().includes("credit") ||
      tender.toLowerCase().includes("card") ||
      tender === "OnlinePayment" ||
      tender === "CreditCard"
    ) {
      creditCardAmounts.push(pmt.Amount);
    }
  }

  return { byTender, creditCardAmounts };
}

// ============================================================================
// CLI Helpers
// ============================================================================

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  let fromDate = oneYearAgo;
  let toDate = now;
  let dryRun = false;
  let jsonOnly = false;
  let help = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--from":
        if (i + 1 < args.length) {
          fromDate = new Date(args[++i]);
        }
        break;
      case "--to":
        if (i + 1 < args.length) {
          toDate = new Date(args[++i]);
        }
        break;
      case "--dry-run":
        dryRun = true;
        break;
      case "--json":
        jsonOnly = true;
        break;
      case "--help":
      case "-h":
        help = true;
        break;
    }
  }

  return { fromDate, toDate, dryRun, jsonOnly, help };
}

function showHelp(): void {
  console.log(`
Wild Apricot Personify Payments Analysis

USAGE:
  npx tsx scripts/finance/wa_personify_payments_analyze.ts [OPTIONS]

OPTIONS:
  --from YYYY-MM-DD     Start date (default: 12 months ago)
  --to YYYY-MM-DD       End date (default: today)
  --dry-run             Preview mode (still fetches data)
  --json                Output only JSON summary
  --help                Show this help message

ENVIRONMENT VARIABLES:
  WA_API_KEY            Required: Wild Apricot API key
  WA_ACCOUNT_ID         Required: Wild Apricot account ID

EXAMPLES:
  # Analyze last 12 months
  npx tsx scripts/finance/wa_personify_payments_analyze.ts

  # Analyze specific date range
  npx tsx scripts/finance/wa_personify_payments_analyze.ts --from 2024-01-01 --to 2024-12-31

  # Output JSON only
  npx tsx scripts/finance/wa_personify_payments_analyze.ts --json

FEE RULES (Personify Payments):
  - Standard cards: 2.9% + $0.30 per transaction
  - American Express: 3.5% + $0.30 per transaction
  - Fees withdrawn monthly in arrears
  - Merchant pays fees
`);
}

function printSummary(result: AnalysisResult): void {
  const { dateRange, invoices, payments, financials, annualized, feeRules, limitations } = result;

  console.log("");
  console.log("=".repeat(70));
  console.log("  WILD APRICOT PERSONIFY PAYMENTS ANALYSIS");
  console.log("=".repeat(70));
  console.log("");

  // Date Range
  console.log("DATE RANGE");
  console.log("-".repeat(70));
  console.log(`  From:          ${dateRange.from}`);
  console.log(`  To:            ${dateRange.to}`);
  console.log(`  Days:          ${dateRange.daysInPeriod}`);
  console.log("");

  // Invoice Summary
  console.log("INVOICE SUMMARY");
  console.log("-".repeat(70));
  console.log(`  Total Invoices:     ${invoices.totalCount}`);
  console.log(`  Paid:               ${invoices.paidCount}`);
  console.log(`  Partially Paid:     ${invoices.partialCount}`);
  console.log(`  Unpaid:             ${invoices.unpaidCount}`);
  console.log(`  Cancelled/Refunded: ${invoices.cancelledCount}`);
  console.log("");

  // Payment Summary by Tender
  console.log("PAYMENTS BY TENDER TYPE");
  console.log("-".repeat(70));
  for (const [tender, data] of Object.entries(payments.byTender)) {
    console.log(`  ${tender.padEnd(20)} ${String(data.count).padStart(6)} txns  ${formatCurrency(data.amount).padStart(12)}`);
  }
  console.log("");

  // Fee Analysis
  console.log("FEE ANALYSIS (Credit Card Transactions Only)");
  console.log("-".repeat(70));
  console.log(`  Transaction Count:    ${financials.totalGrossAmount > 0 ? Math.round(financials.totalGrossAmount / financials.averageTransactionSize) : 0}`);
  console.log(`  Total Gross:          ${formatCurrency(financials.totalGrossAmount)}`);
  console.log(`  Estimated Fees:       ${formatCurrency(financials.totalEstimatedFees)}`);
  console.log(`  Net After Fees:       ${formatCurrency(financials.totalNetAmount)}`);
  console.log(`  Avg Transaction:      ${formatCurrency(financials.averageTransactionSize)}`);
  console.log(`  Min Transaction:      ${formatCurrency(financials.minTransactionSize)}`);
  console.log(`  Max Transaction:      ${formatCurrency(financials.maxTransactionSize)}`);
  console.log(`  Effective Rate:       ${formatPercent(financials.effectiveRate)}`);
  console.log("");

  // Annualized
  console.log("ANNUALIZED ESTIMATES");
  console.log("-".repeat(70));
  console.log(`  Annual Gross:         ${formatCurrency(annualized.estimatedAnnualGross)}`);
  console.log(`  Annual Fees:          ${formatCurrency(annualized.estimatedAnnualFees)}`);
  console.log(`  Annual Net:           ${formatCurrency(annualized.estimatedAnnualNet)}`);
  console.log("");

  // Fee Rules
  console.log("PERSONIFY FEE RULES APPLIED");
  console.log("-".repeat(70));
  console.log(`  Standard Rate:        ${feeRules.standardPercent} + ${feeRules.flatFee}`);
  console.log(`  AmEx Rate:            ${feeRules.amexPercent} + ${feeRules.flatFee}`);
  console.log(`  Note:                 ${feeRules.note}`);
  console.log("");

  // Limitations
  console.log("KNOWN LIMITATIONS");
  console.log("-".repeat(70));
  for (const limitation of limitations) {
    console.log(`  - ${limitation}`);
  }
  console.log("");

  console.log("=".repeat(70));
  console.log(`  Generated: ${result.generatedAt}`);
  console.log("=".repeat(70));
  console.log("");
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  if (!args.jsonOnly) {
    console.log("");
    console.log("Initializing WA API client...");
  }

  // Validate environment
  if (!process.env.WA_API_KEY || !process.env.WA_ACCOUNT_ID) {
    console.error("ERROR: WA_API_KEY and WA_ACCOUNT_ID environment variables are required");
    process.exit(1);
  }

  const client = new WAFinanceClient();

  // Health check
  if (!args.jsonOnly) {
    console.log("Testing API connectivity...");
  }

  const healthy = await client.healthCheck();
  if (!healthy) {
    console.error("ERROR: Failed to connect to Wild Apricot API");
    process.exit(1);
  }

  if (!args.jsonOnly) {
    console.log("[OK] API connection successful");
    console.log("");
    console.log(`Fetching invoices from ${args.fromDate.toISOString().split("T")[0]} to ${args.toDate.toISOString().split("T")[0]}...`);
  }

  // Fetch data
  const invoices = await client.fetchInvoices(args.fromDate, args.toDate);

  if (!args.jsonOnly) {
    console.log(`[OK] Fetched ${invoices.length} invoices`);
    console.log("Fetching payments...");
  }

  const payments = await client.fetchPayments(args.fromDate, args.toDate);

  if (!args.jsonOnly) {
    console.log(`[OK] Fetched ${payments.length} payments`);
    console.log("");
    console.log("Analyzing data...");
  }

  // Analyze
  const invoiceAnalysis = analyzeInvoices(invoices);
  const paymentAnalysis = analyzePayments(payments);

  // Use payment data for fee calculation (more accurate than invoice data)
  // Credit card payments are the ones that incur Personify fees
  const ccAmounts = paymentAnalysis.creditCardAmounts;
  const feeAggregation: FeeAggregation =
    ccAmounts.length > 0
      ? aggregateFees(ccAmounts, "standard")
      : {
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

  // Calculate date range
  const daysInPeriod = Math.ceil(
    (args.toDate.getTime() - args.fromDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Build result
  const result: AnalysisResult = {
    dateRange: {
      from: args.fromDate.toISOString().split("T")[0],
      to: args.toDate.toISOString().split("T")[0],
      daysInPeriod,
    },
    invoices: {
      totalCount: invoices.length,
      paidCount: invoiceAnalysis.paidCount,
      unpaidCount: invoiceAnalysis.unpaidCount,
      partialCount: invoiceAnalysis.partialCount,
      cancelledCount: invoiceAnalysis.cancelledCount,
    },
    payments: {
      totalCount: payments.length,
      byTender: paymentAnalysis.byTender,
    },
    financials: {
      totalGrossAmount: feeAggregation.totalGrossAmount,
      totalEstimatedFees: feeAggregation.totalFees,
      totalNetAmount: feeAggregation.totalNetAmount,
      averageTransactionSize: feeAggregation.averageTransactionSize,
      effectiveRate: feeAggregation.effectiveRate,
      minTransactionSize: feeAggregation.minTransactionAmount,
      maxTransactionSize: feeAggregation.maxTransactionAmount,
    },
    annualized: {
      estimatedAnnualGross: annualizeFees(feeAggregation.totalGrossAmount, daysInPeriod),
      estimatedAnnualFees: annualizeFees(feeAggregation.totalFees, daysInPeriod),
      estimatedAnnualNet: annualizeFees(feeAggregation.totalNetAmount, daysInPeriod),
    },
    feeRules: {
      standardPercent: `${(PERSONIFY_STANDARD_PERCENT * 100).toFixed(1)}%`,
      flatFee: formatCurrency(PERSONIFY_FLAT_FEE),
      amexPercent: "3.5%",
      note: "AmEx rate not applied (card type not available from WA API)",
    },
    limitations: [
      "WA API does not expose card type; all transactions assumed standard rate",
      "Refunds may not be fully accounted for in fee calculations",
      "ACH/check payments excluded from fee calculation (no processing fees)",
      "Fees are estimates based on published Personify rates",
      "Actual fees may vary slightly due to chargebacks, disputes, or rate changes",
    ],
    generatedAt: new Date().toISOString(),
  };

  // Output
  if (args.jsonOnly) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printSummary(result);
    console.log("JSON Summary:");
    console.log(JSON.stringify(result, null, 2));
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("FATAL ERROR:", error);
  process.exit(1);
});
