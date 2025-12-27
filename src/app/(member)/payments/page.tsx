"use client";

import { useState, useMemo } from "react";
import { formatDateLocale } from "@/lib/timezone";

/**
 * Payment History Page
 *
 * Member-facing page showing all payment history including:
 * - Membership dues
 * - Event tickets
 * - Donations
 *
 * Charter: P7 (Observability is a product feature)
 */

type PaymentType = "dues" | "event" | "donation";
type PaymentStatus = "completed" | "pending" | "failed" | "refunded";

type Payment = {
  id: string;
  date: string;
  amount: number;
  type: PaymentType;
  description: string;
  status: PaymentStatus;
  paymentMethod: string;
  receiptUrl?: string;
};

const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  dues: "Membership Dues",
  event: "Event Ticket",
  donation: "Donation",
};

const STATUS_STYLES: Record<PaymentStatus, { bg: string; text: string; label: string }> = {
  completed: { bg: "bg-green-100", text: "text-green-800", label: "Completed" },
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
  failed: { bg: "bg-red-100", text: "text-red-800", label: "Failed" },
  refunded: { bg: "bg-gray-100", text: "text-gray-800", label: "Refunded" },
};

// Demo payment data
const DEMO_PAYMENTS: Payment[] = [
  {
    id: "pay-001",
    date: "2025-01-15",
    amount: 60.00,
    type: "dues",
    description: "Annual Membership Renewal - Full Member",
    status: "completed",
    paymentMethod: "Visa ending in 4242",
    receiptUrl: "#",
  },
  {
    id: "pay-002",
    date: "2025-01-10",
    amount: 35.00,
    type: "event",
    description: "Wine Tasting at Grassini Vineyards",
    status: "completed",
    paymentMethod: "Visa ending in 4242",
    receiptUrl: "#",
  },
  {
    id: "pay-003",
    date: "2024-12-05",
    amount: 25.00,
    type: "event",
    description: "Holiday Party 2024",
    status: "completed",
    paymentMethod: "Visa ending in 4242",
    receiptUrl: "#",
  },
  {
    id: "pay-004",
    date: "2024-11-20",
    amount: 50.00,
    type: "donation",
    description: "Scholarship Fund Contribution",
    status: "completed",
    paymentMethod: "Visa ending in 4242",
    receiptUrl: "#",
  },
  {
    id: "pay-005",
    date: "2024-10-15",
    amount: 28.00,
    type: "event",
    description: "Fall Hiking Adventure",
    status: "completed",
    paymentMethod: "Visa ending in 4242",
    receiptUrl: "#",
  },
  {
    id: "pay-006",
    date: "2024-09-08",
    amount: 45.00,
    type: "event",
    description: "Dinner at Opal Restaurant",
    status: "refunded",
    paymentMethod: "Visa ending in 4242",
  },
  {
    id: "pay-007",
    date: "2024-08-22",
    amount: 30.00,
    type: "event",
    description: "Beach BBQ Picnic",
    status: "completed",
    paymentMethod: "Mastercard ending in 5555",
    receiptUrl: "#",
  },
  {
    id: "pay-008",
    date: "2024-01-18",
    amount: 60.00,
    type: "dues",
    description: "Annual Membership Renewal - Full Member",
    status: "completed",
    paymentMethod: "Mastercard ending in 5555",
    receiptUrl: "#",
  },
  {
    id: "pay-009",
    date: "2023-06-10",
    amount: 45.00,
    type: "dues",
    description: "Annual Membership - Newbie Rate",
    status: "completed",
    paymentMethod: "Mastercard ending in 5555",
    receiptUrl: "#",
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateString: string): string {
  return formatDateLocale(dateString, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

function PaymentMethodDisplay({ method }: { method: string }) {
  // Extract card type and last 4 digits
  const isVisa = method.toLowerCase().includes("visa");
  const isMastercard = method.toLowerCase().includes("mastercard");
  const isAmex = method.toLowerCase().includes("amex") || method.toLowerCase().includes("american express");

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
      {isVisa && (
        <svg className="w-6 h-4" viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" rx="2" fill="#1A1F71"/>
          <path d="M9.5 10.5L10.5 5.5H12L11 10.5H9.5Z" fill="white"/>
          <path d="M16 5.5L14.5 10.5H13L14.5 5.5H16Z" fill="white"/>
          <path d="M6 5.5L4 10.5H5.5L5.8 9.5H7.7L8 10.5H9.5L7.5 5.5H6ZM6.2 8.5L6.75 6.5L7.3 8.5H6.2Z" fill="white"/>
        </svg>
      )}
      {isMastercard && (
        <svg className="w-6 h-4" viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" rx="2" fill="#F0F0F0"/>
          <circle cx="9" cy="8" r="5" fill="#EB001B"/>
          <circle cx="15" cy="8" r="5" fill="#F79E1B"/>
          <path d="M12 4.5C13.1 5.3 13.8 6.6 13.8 8C13.8 9.4 13.1 10.7 12 11.5C10.9 10.7 10.2 9.4 10.2 8C10.2 6.6 10.9 5.3 12 4.5Z" fill="#FF5F00"/>
        </svg>
      )}
      {isAmex && (
        <svg className="w-6 h-4" viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" rx="2" fill="#006FCF"/>
          <path d="M4 8H20" stroke="white" strokeWidth="2"/>
        </svg>
      )}
      {!isVisa && !isMastercard && !isAmex && (
        <svg className="w-5 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )}
      <span>{method}</span>
    </span>
  );
}

function DownloadReceiptButton({ receiptUrl }: { receiptUrl?: string }) {
  if (!receiptUrl) {
    return (
      <span className="text-gray-400 text-sm">No receipt</span>
    );
  }

  return (
    <button
      onClick={() => {
        // In production, this would download the actual receipt
        alert("Demo mode: Receipt download would start here");
      }}
      className="inline-flex items-center gap-1 text-sm text-[var(--token-color-primary)] hover:underline"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Receipt
    </button>
  );
}

export default function PaymentHistoryPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");

  // Get unique years from payments
  const availableYears = useMemo(() => {
    const years = new Set(DEMO_PAYMENTS.map((p) => new Date(p.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, []);

  // Filter payments by year
  const filteredPayments = useMemo(() => {
    if (selectedYear === "all") {
      return DEMO_PAYMENTS;
    }
    return DEMO_PAYMENTS.filter((p) => new Date(p.date).getFullYear() === selectedYear);
  }, [selectedYear]);

  // Calculate totals
  const yearlyTotal = useMemo(() => {
    const thisYearPayments = DEMO_PAYMENTS.filter(
      (p) => new Date(p.date).getFullYear() === currentYear && p.status === "completed"
    );
    return thisYearPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [currentYear]);

  const filteredTotal = useMemo(() => {
    return filteredPayments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);
  }, [filteredPayments]);

  // Payment method on file (demo)
  const paymentMethodOnFile = "Visa ending in 4242";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--token-color-text)] mb-2">
          Payment History
        </h1>
        <p className="text-[var(--token-color-text-muted)]">
          View your payment history for membership dues, event tickets, and donations.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Total This Year */}
        <div className="bg-[var(--token-color-surface)] rounded-xl border border-[var(--token-color-border)] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--token-color-text-muted)]">Total Paid ({currentYear})</p>
              <p className="text-xl font-bold text-[var(--token-color-text)]">{formatCurrency(yearlyTotal)}</p>
            </div>
          </div>
        </div>

        {/* Payment Method on File */}
        <div className="bg-[var(--token-color-surface)] rounded-xl border border-[var(--token-color-border)] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--token-color-text-muted)]">Payment Method</p>
              <p className="text-base font-medium text-[var(--token-color-text)]">{paymentMethodOnFile}</p>
            </div>
          </div>
          <button className="text-sm text-[var(--token-color-primary)] hover:underline mt-2">
            Update payment method
          </button>
        </div>

        {/* Transaction Count */}
        <div className="bg-[var(--token-color-surface)] rounded-xl border border-[var(--token-color-border)] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--token-color-text-muted)]">Total Transactions</p>
              <p className="text-xl font-bold text-[var(--token-color-text)]">{DEMO_PAYMENTS.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label htmlFor="year-filter" className="text-sm text-[var(--token-color-text-muted)]">
            Filter by year:
          </label>
          <select
            id="year-filter"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="px-3 py-1.5 rounded-lg border border-[var(--token-color-border)] bg-[var(--token-color-surface)] text-[var(--token-color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--token-color-primary)]"
          >
            <option value="all">All Years</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {selectedYear !== "all" && (
          <p className="text-sm text-[var(--token-color-text-muted)]">
            {filteredPayments.length} transaction{filteredPayments.length !== 1 ? "s" : ""} totaling{" "}
            <span className="font-medium text-[var(--token-color-text)]">{formatCurrency(filteredTotal)}</span>
          </p>
        )}
      </div>

      {/* Payments Table */}
      <div className="bg-[var(--token-color-surface)] rounded-xl border border-[var(--token-color-border)] overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--token-color-surface-2)]">
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--token-color-text-muted)]">Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--token-color-text-muted)]">Description</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--token-color-text-muted)]">Type</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--token-color-text-muted)]">Payment Method</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[var(--token-color-text-muted)]">Amount</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-[var(--token-color-text-muted)]">Status</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-[var(--token-color-text-muted)]">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--token-color-border)]">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-[var(--token-color-surface-2)] transition-colors">
                  <td className="px-4 py-4 text-sm text-[var(--token-color-text)]">
                    {formatDate(payment.date)}
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-[var(--token-color-text)]">{payment.description}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--token-color-text-muted)]">
                    {PAYMENT_TYPE_LABELS[payment.type]}
                  </td>
                  <td className="px-4 py-4">
                    <PaymentMethodDisplay method={payment.paymentMethod} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={`text-sm font-medium ${payment.status === "refunded" ? "text-gray-500 line-through" : "text-[var(--token-color-text)]"}`}>
                      {formatCurrency(payment.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <StatusBadge status={payment.status} />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <DownloadReceiptButton receiptUrl={payment.receiptUrl} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-[var(--token-color-border)]">
          {filteredPayments.map((payment) => (
            <div key={payment.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-[var(--token-color-text)]">{payment.description}</p>
                  <p className="text-sm text-[var(--token-color-text-muted)]">{formatDate(payment.date)}</p>
                </div>
                <span className={`text-lg font-semibold ${payment.status === "refunded" ? "text-gray-500 line-through" : "text-[var(--token-color-text)]"}`}>
                  {formatCurrency(payment.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusBadge status={payment.status} />
                  <span className="text-xs text-[var(--token-color-text-muted)]">
                    {PAYMENT_TYPE_LABELS[payment.type]}
                  </span>
                </div>
                <DownloadReceiptButton receiptUrl={payment.receiptUrl} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredPayments.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-[var(--token-color-text-muted)]">No payments found for this period.</p>
        </div>
      )}

      {/* Demo Notice */}
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-amber-800">
            <strong>Demo Mode:</strong> This page displays sample payment data. In production, this will show your actual payment history from our payment processor.
          </div>
        </div>
      </div>

      {/* Footer Help */}
      <div className="mt-8 text-center text-sm text-[var(--token-color-text-muted)]">
        <p>
          Questions about a payment?{" "}
          <a href="mailto:treasurer@sbnewcomers.org" className="text-[var(--token-color-primary)] hover:underline">
            Contact our Treasurer
          </a>
        </p>
      </div>
    </div>
  );
}
