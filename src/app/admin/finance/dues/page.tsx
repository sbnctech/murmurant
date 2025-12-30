// Copyright © 2025 Murmurant, Inc.
// Dues management page - membership fees, collection, and waivers

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatClubDate } from "@/lib/timezone";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type MembershipTier = "individual" | "household" | "honorary" | "lifetime";
type PaymentStatus = "paid" | "pending" | "overdue" | "waived";
type WaiverStatus = "pending" | "approved" | "denied";

interface DuesRate {
  tier: MembershipTier;
  amount: number;
  description: string;
  memberCount: number;
}

interface OutstandingDues {
  id: string;
  memberId: string;
  memberName: string;
  email: string;
  tier: MembershipTier;
  amountDue: number;
  dueDate: string;
  status: PaymentStatus;
  lastReminderSent?: string;
}

interface PaymentRecord {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  paymentDate: string;
  method: "credit_card" | "check" | "cash" | "online";
  tier: MembershipTier;
  periodStart: string;
  periodEnd: string;
}

interface WaiverRequest {
  id: string;
  memberId: string;
  memberName: string;
  tier: MembershipTier;
  requestDate: string;
  reason: string;
  status: WaiverStatus;
  reviewedBy?: string;
  reviewDate?: string;
}

// -----------------------------------------------------------------------------
// Mock Data
// -----------------------------------------------------------------------------

const duesRates: DuesRate[] = [
  { tier: "individual", amount: 50, description: "Single membership with full benefits", memberCount: 145 },
  { tier: "household", amount: 75, description: "Two members at same address", memberCount: 82 },
  { tier: "honorary", amount: 0, description: "Complimentary membership for distinguished service", memberCount: 8 },
  { tier: "lifetime", amount: 500, description: "One-time payment for permanent membership", memberCount: 12 },
];

const outstandingDues: OutstandingDues[] = [
  { id: "1", memberId: "M-2024-005", memberName: "Patricia Anderson", email: "patricia.anderson@email.com", tier: "individual", amountDue: 50, dueDate: "2024-04-12", status: "overdue", lastReminderSent: "2024-05-01" },
  { id: "2", memberId: "M-2024-009", memberName: "Jennifer Martinez", email: "jennifer.martinez@email.com", tier: "individual", amountDue: 50, dueDate: "2024-08-22", status: "overdue", lastReminderSent: "2024-09-15" },
  { id: "3", memberId: "M-2024-015", memberName: "Thomas Wilson", email: "thomas.wilson@email.com", tier: "household", amountDue: 75, dueDate: "2025-01-15", status: "pending" },
  { id: "4", memberId: "M-2024-018", memberName: "Sarah Brown", email: "sarah.brown@email.com", tier: "individual", amountDue: 50, dueDate: "2025-02-01", status: "pending" },
  { id: "5", memberId: "M-2024-022", memberName: "Robert Lee", email: "robert.lee@email.com", tier: "household", amountDue: 75, dueDate: "2025-01-28", status: "pending" },
];

const recentPayments: PaymentRecord[] = [
  { id: "p1", memberId: "M-2024-001", memberName: "Catherine Reynolds", amount: 50, paymentDate: "2024-12-15", method: "credit_card", tier: "individual", periodStart: "2025-01-01", periodEnd: "2025-12-31" },
  { id: "p2", memberId: "M-2024-002", memberName: "James Mitchell", amount: 75, paymentDate: "2024-12-10", method: "online", tier: "household", periodStart: "2025-01-01", periodEnd: "2025-12-31" },
  { id: "p3", memberId: "M-2024-003", memberName: "Elizabeth Chen", amount: 50, paymentDate: "2024-12-08", method: "check", tier: "individual", periodStart: "2025-01-01", periodEnd: "2025-12-31" },
  { id: "p4", memberId: "M-2024-006", memberName: "Michael Thompson", amount: 75, paymentDate: "2024-12-05", method: "credit_card", tier: "household", periodStart: "2025-01-01", periodEnd: "2025-12-31" },
  { id: "p5", memberId: "M-2024-010", memberName: "William Davis", amount: 75, paymentDate: "2024-11-28", method: "online", tier: "household", periodStart: "2025-01-01", periodEnd: "2025-12-31" },
];

const waiverRequests: WaiverRequest[] = [
  { id: "w1", memberId: "M-2024-025", memberName: "Dorothy Clark", tier: "individual", requestDate: "2024-12-20", reason: "Financial hardship due to medical expenses", status: "pending" },
  { id: "w2", memberId: "M-2024-028", memberName: "George White", tier: "household", requestDate: "2024-12-15", reason: "Recently widowed, requesting single member rate", status: "pending" },
  { id: "w3", memberId: "M-2024-012", memberName: "Helen Taylor", tier: "individual", requestDate: "2024-11-30", reason: "Volunteer service contribution in lieu of dues", status: "approved", reviewedBy: "Treasurer", reviewDate: "2024-12-05" },
];

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function getTierLabel(tier: MembershipTier): string {
  return { individual: "Individual", household: "Household", honorary: "Honorary", lifetime: "Lifetime" }[tier];
}

function getStatusBadge(status: PaymentStatus) {
  const styles: Record<PaymentStatus, { bg: string; text: string }> = {
    paid: { bg: "bg-green-100", text: "text-green-700" },
    pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
    overdue: { bg: "bg-red-100", text: "text-red-700" },
    waived: { bg: "bg-blue-100", text: "text-blue-700" },
  };
  const style = styles[status];
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

function getWaiverStatusBadge(status: WaiverStatus) {
  const styles: Record<WaiverStatus, { bg: string; text: string }> = {
    pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
    approved: { bg: "bg-green-100", text: "text-green-700" },
    denied: { bg: "bg-red-100", text: "text-red-700" },
  };
  const style = styles[status];
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

function getPaymentMethodLabel(method: PaymentRecord["method"]): string {
  return { credit_card: "Credit Card", check: "Check", cash: "Cash", online: "Online" }[method];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function exportDuesReport(payments: PaymentRecord[], outstanding: OutstandingDues[]) {
  const headers = ["Type", "Member ID", "Member Name", "Amount", "Date", "Status", "Tier"];
  const paymentRows = payments.map((p) => ["Payment", p.memberId, p.memberName, p.amount.toString(), p.paymentDate, "Paid", getTierLabel(p.tier)]);
  const outstandingRows = outstanding.map((o) => ["Outstanding", o.memberId, o.memberName, o.amountDue.toString(), o.dueDate, o.status, getTierLabel(o.tier)]);
  const csvContent = [headers.join(","), ...paymentRows.map((row) => row.map((cell) => `"${cell}"`).join(",")), ...outstandingRows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `dues-report-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
}

// -----------------------------------------------------------------------------
// Sections
// -----------------------------------------------------------------------------

function DuesRatesSection({ onEditRate }: { onEditRate: (tier: MembershipTier) => void }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Membership Dues Rates</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {duesRates.map((rate) => (
          <div key={rate.tier} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">{getTierLabel(rate.tier)}</span>
              <button onClick={() => onEditRate(rate.tier)} className="text-sm text-blue-600 hover:text-blue-700">Edit</button>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">{rate.amount === 0 ? "Free" : formatCurrency(rate.amount)}</div>
            <div className="text-xs text-gray-500 mb-2">{rate.description}</div>
            <div className="text-sm text-gray-600">{rate.memberCount} member{rate.memberCount !== 1 ? "s" : ""}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CollectionSummarySection() {
  const totalCollected = recentPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = outstandingDues.reduce((sum, o) => sum + o.amountDue, 0);
  const expectedTotal = duesRates.reduce((sum, r) => sum + r.amount * r.memberCount, 0);
  const collectionRate = expectedTotal > 0 ? ((totalCollected / expectedTotal) * 100).toFixed(1) : "0";

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Collection Summary (2024-2025)</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalCollected)}</div>
          <div className="text-sm text-gray-600">Collected</div>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalOutstanding)}</div>
          <div className="text-sm text-gray-600">Outstanding</div>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{formatCurrency(expectedTotal)}</div>
          <div className="text-sm text-gray-600">Expected Total</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{collectionRate}%</div>
          <div className="text-sm text-gray-600">Collection Rate</div>
        </div>
      </div>
    </div>
  );
}

function OutstandingDuesSection({ onSendReminder }: { onSendReminder: (id: string) => void }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const handleSelectAll = () => setSelectedIds(selectedIds.size === outstandingDues.length ? new Set() : new Set(outstandingDues.map((o) => o.id)));
  const handleSelectOne = (id: string) => { const n = new Set(selectedIds); n.has(id) ? n.delete(id) : n.add(id); setSelectedIds(n); };
  const handleBulkReminder = () => { selectedIds.forEach((id) => onSendReminder(id)); setSelectedIds(new Set()); };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Outstanding Dues</h2>
        {selectedIds.size > 0 && <button onClick={handleBulkReminder} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Send Reminder ({selectedIds.size})</button>}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left"><input type="checkbox" checked={selectedIds.size === outstandingDues.length} onChange={handleSelectAll} className="w-4 h-4 rounded border-gray-300 text-blue-600" /></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Reminder</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {outstandingDues.map((dues) => (
              <tr key={dues.id} className={selectedIds.has(dues.id) ? "bg-blue-50" : "hover:bg-gray-50"}>
                <td className="px-4 py-4"><input type="checkbox" checked={selectedIds.has(dues.id)} onChange={() => handleSelectOne(dues.id)} className="w-4 h-4 rounded border-gray-300 text-blue-600" /></td>
                <td className="px-4 py-4"><div className="font-medium text-gray-900">{dues.memberName}</div><div className="text-sm text-gray-500">{dues.memberId}</div></td>
                <td className="px-4 py-4 text-sm text-gray-600">{getTierLabel(dues.tier)}</td>
                <td className="px-4 py-4 text-sm font-medium text-gray-900">{formatCurrency(dues.amountDue)}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{formatClubDate(new Date(dues.dueDate))}</td>
                <td className="px-4 py-4">{getStatusBadge(dues.status)}</td>
                <td className="px-4 py-4 text-sm text-gray-500">{dues.lastReminderSent ? formatClubDate(new Date(dues.lastReminderSent)) : "Never"}</td>
                <td className="px-4 py-4 text-right"><button onClick={() => onSendReminder(dues.id)} className="text-sm text-blue-600 hover:text-blue-700">Send Reminder</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentHistorySection() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
        <Link href="/admin/finance/payments" className="text-sm text-blue-600 hover:text-blue-700">View All →</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recentPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-4 py-4"><div className="font-medium text-gray-900">{payment.memberName}</div><div className="text-sm text-gray-500">{payment.memberId}</div></td>
                <td className="px-4 py-4 text-sm font-medium text-green-600">{formatCurrency(payment.amount)}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{formatClubDate(new Date(payment.paymentDate))}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{getPaymentMethodLabel(payment.method)}</td>
                <td className="px-4 py-4 text-sm text-gray-500">{new Date(payment.periodStart).getFullYear()} - {new Date(payment.periodEnd).getFullYear()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WaiverRequestsSection({ onApprove, onDeny }: { onApprove: (id: string) => void; onDeny: (id: string) => void }) {
  const pendingWaivers = waiverRequests.filter((w) => w.status === "pending");
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Dues Waiver Requests</h2>
        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">{pendingWaivers.length} Pending</span>
      </div>
      <div className="space-y-4">
        {waiverRequests.map((waiver) => (
          <div key={waiver.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div><div className="font-medium text-gray-900">{waiver.memberName}</div><div className="text-sm text-gray-500">{waiver.memberId} · {getTierLabel(waiver.tier)}</div></div>
              {getWaiverStatusBadge(waiver.status)}
            </div>
            <p className="text-sm text-gray-600 mb-3">{waiver.reason}</p>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">Requested: {formatClubDate(new Date(waiver.requestDate))}{waiver.reviewedBy && <span> · Reviewed by {waiver.reviewedBy} on {formatClubDate(new Date(waiver.reviewDate!))}</span>}</div>
              {waiver.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => onApprove(waiver.id)} className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded hover:bg-green-200">Approve</button>
                  <button onClick={() => onDeny(waiver.id)} className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded hover:bg-red-200">Deny</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditRateModal({ tier, currentAmount, onSave, onClose }: { tier: MembershipTier; currentAmount: number; onSave: (amount: number) => void; onClose: () => void }) {
  const [amount, setAmount] = useState(currentAmount.toString());
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(parseFloat(amount) || 0); };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit {getTierLabel(tier)} Dues Rate</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Annual Dues Amount</label>
            <div className="relative"><span className="absolute left-3 top-2 text-gray-500">$</span><input id="amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default function DuesManagementPage() {
  const [editingTier, setEditingTier] = useState<MembershipTier | null>(null);
  const handleSaveRate = (amount: number) => { alert(`Updated ${editingTier} rate to ${formatCurrency(amount)}`); setEditingTier(null); };
  const handleSendReminder = (id: string) => { const d = outstandingDues.find((x) => x.id === id); if (d) alert(`Reminder sent to ${d.memberName} (${d.email})`); };
  const handleApproveWaiver = (id: string) => { const w = waiverRequests.find((x) => x.id === id); if (w) alert(`Waiver approved for ${w.memberName}`); };
  const handleDenyWaiver = (id: string) => { const w = waiverRequests.find((x) => x.id === id); if (w) alert(`Waiver denied for ${w.memberName}`); };
  const handleExport = () => exportDuesReport(recentPayments, outstandingDues);
  const currentRate = editingTier ? duesRates.find((r) => r.tier === editingTier)?.amount || 0 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div><h1 className="text-2xl font-bold text-gray-900">Dues Management</h1><p className="mt-1 text-gray-600">Manage membership fees, track collections, and process waivers</p></div>
            <div className="flex gap-3">
              <button onClick={handleExport} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Export Report</button>
              <Link href="/admin/finance" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Back to Finance</Link>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <DuesRatesSection onEditRate={setEditingTier} />
        <CollectionSummarySection />
        <OutstandingDuesSection onSendReminder={handleSendReminder} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PaymentHistorySection />
          <WaiverRequestsSection onApprove={handleApproveWaiver} onDeny={handleDenyWaiver} />
        </div>
      </div>
      {editingTier && <EditRateModal tier={editingTier} currentAmount={currentRate} onSave={handleSaveRate} onClose={() => setEditingTier(null)} />}
    </div>
  );
}
