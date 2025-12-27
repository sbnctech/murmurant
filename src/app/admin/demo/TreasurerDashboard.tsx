"use client";

import { useState } from "react";

/**
 * Mock data types for Treasurer Dashboard
 */
type RevenueSummary = {
  eventTickets: number;
  membershipDues: number;
  donations: number;
  other: number;
  total: number;
};

type RefundRequest = {
  id: string;
  memberName: string;
  eventTitle: string;
  amount: number;
  requestedAt: string;
  reason: string;
};

type OutstandingInvoice = {
  id: string;
  memberName: string;
  description: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
};

type MonthlyComparison = {
  month: string;
  revenue: number;
  expenses: number;
  net: number;
};

/**
 * Treasurer Dashboard Demo
 *
 * Financial overview for the club treasurer:
 * - Revenue summary by category
 * - Pending refund requests
 * - Outstanding invoices
 * - Month-over-month comparison
 * - Export functionality placeholder
 *
 * Uses mock data for demonstration (Charter P7 - observability).
 */
export default function TreasurerDashboard() {
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  // Mock data for demonstration
  const revenueSummary: RevenueSummary = {
    eventTickets: 4250.0,
    membershipDues: 12800.0,
    donations: 1500.0,
    other: 350.0,
    total: 18900.0,
  };

  const pendingRefunds: RefundRequest[] = [
    {
      id: "ref-001",
      memberName: "Jane Smith",
      eventTitle: "Wine Tasting Tour",
      amount: 45.0,
      requestedAt: "Dec 20, 2024",
      reason: "Schedule conflict",
    },
    {
      id: "ref-002",
      memberName: "Robert Chen",
      eventTitle: "Holiday Dinner",
      amount: 85.0,
      requestedAt: "Dec 22, 2024",
      reason: "Medical emergency",
    },
  ];

  const outstandingInvoices: OutstandingInvoice[] = [
    {
      id: "inv-001",
      memberName: "Michael Brown",
      description: "Annual Dues 2025",
      amount: 125.0,
      dueDate: "Dec 1, 2024",
      daysOverdue: 26,
    },
    {
      id: "inv-002",
      memberName: "Susan Lee",
      description: "Annual Dues 2025",
      amount: 125.0,
      dueDate: "Dec 15, 2024",
      daysOverdue: 12,
    },
    {
      id: "inv-003",
      memberName: "David Wilson",
      description: "Event Balance - Gala",
      amount: 50.0,
      dueDate: "Dec 10, 2024",
      daysOverdue: 17,
    },
  ];

  const monthlyComparison: MonthlyComparison[] = [
    { month: "Oct 2024", revenue: 15200, expenses: 8400, net: 6800 },
    { month: "Nov 2024", revenue: 17500, expenses: 9200, net: 8300 },
    { month: "Dec 2024", revenue: 18900, expenses: 11500, net: 7400 },
  ];

  const handleExport = () => {
    setExportStatus("Preparing export...");
    setTimeout(() => {
      setExportStatus("Export ready! (Demo - QuickBooks integration pending)");
      setTimeout(() => setExportStatus(null), 3000);
    }, 1500);
  };

  const handleApproveRefund = (id: string) => {
    alert(`Demo: Refund ${id} approved`);
  };

  const handleDenyRefund = (id: string) => {
    alert(`Demo: Refund ${id} denied`);
  };

  const handleSendReminder = (id: string) => {
    alert(`Demo: Reminder sent for invoice ${id}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div data-test-id="treasurer-dashboard" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.icon}>&#128176;</span>
        <div>
          <div data-test-id="treasurer-dashboard-title" style={styles.title}>
            Treasurer Dashboard
          </div>
          <div style={styles.subtitle}>Financial Overview</div>
        </div>
        <button
          style={styles.exportButton}
          onClick={handleExport}
          disabled={!!exportStatus}
        >
          {exportStatus || "Export to QuickBooks"}
        </button>
      </div>

      {/* Revenue Summary */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionIcon}>&#128200;</span>
          Revenue Summary (This Month)
        </div>
        <div style={styles.revenueGrid}>
          <div style={styles.revenueCard}>
            <div style={styles.revenueLabel}>Event Tickets</div>
            <div style={styles.revenueAmount}>
              {formatCurrency(revenueSummary.eventTickets)}
            </div>
          </div>
          <div style={styles.revenueCard}>
            <div style={styles.revenueLabel}>Membership Dues</div>
            <div style={styles.revenueAmount}>
              {formatCurrency(revenueSummary.membershipDues)}
            </div>
          </div>
          <div style={styles.revenueCard}>
            <div style={styles.revenueLabel}>Donations</div>
            <div style={styles.revenueAmount}>
              {formatCurrency(revenueSummary.donations)}
            </div>
          </div>
          <div style={styles.revenueCard}>
            <div style={styles.revenueLabel}>Other</div>
            <div style={styles.revenueAmount}>
              {formatCurrency(revenueSummary.other)}
            </div>
          </div>
          <div style={{ ...styles.revenueCard, ...styles.totalCard }}>
            <div style={styles.revenueLabel}>Total Revenue</div>
            <div style={{ ...styles.revenueAmount, ...styles.totalAmount }}>
              {formatCurrency(revenueSummary.total)}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Refund Requests */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionIcon}>&#128260;</span>
          Pending Refund Requests ({pendingRefunds.length})
        </div>
        {pendingRefunds.length === 0 ? (
          <div style={styles.emptyState}>No pending refund requests</div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Member</th>
                  <th style={styles.th}>Event</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Requested</th>
                  <th style={styles.th}>Reason</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRefunds.map((refund) => (
                  <tr key={refund.id}>
                    <td style={styles.td}>{refund.memberName}</td>
                    <td style={styles.td}>{refund.eventTitle}</td>
                    <td style={styles.td}>{formatCurrency(refund.amount)}</td>
                    <td style={styles.td}>{refund.requestedAt}</td>
                    <td style={styles.td}>{refund.reason}</td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <button
                          style={styles.approveButton}
                          onClick={() => handleApproveRefund(refund.id)}
                        >
                          Approve
                        </button>
                        <button
                          style={styles.denyButton}
                          onClick={() => handleDenyRefund(refund.id)}
                        >
                          Deny
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Outstanding Invoices */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionIcon}>&#128196;</span>
          Outstanding Invoices ({outstandingInvoices.length})
        </div>
        {outstandingInvoices.length === 0 ? (
          <div style={styles.emptyState}>No outstanding invoices</div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Member</th>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Due Date</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {outstandingInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td style={styles.td}>{invoice.memberName}</td>
                    <td style={styles.td}>{invoice.description}</td>
                    <td style={styles.td}>{formatCurrency(invoice.amount)}</td>
                    <td style={styles.td}>{invoice.dueDate}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.overdueBadge,
                          backgroundColor:
                            invoice.daysOverdue > 20 ? "#fecaca" : "#fef3c7",
                          color:
                            invoice.daysOverdue > 20 ? "#b91c1c" : "#92400e",
                        }}
                      >
                        {invoice.daysOverdue} days overdue
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        style={styles.reminderButton}
                        onClick={() => handleSendReminder(invoice.id)}
                      >
                        Send Reminder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Month-over-Month Comparison */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionIcon}>&#128202;</span>
          Month-over-Month Comparison
        </div>
        <div style={styles.comparisonGrid}>
          {monthlyComparison.map((month) => (
            <div key={month.month} style={styles.comparisonCard}>
              <div style={styles.comparisonMonth}>{month.month}</div>
              <div style={styles.comparisonRow}>
                <span style={styles.comparisonLabel}>Revenue:</span>
                <span style={styles.comparisonValue}>
                  {formatCurrency(month.revenue)}
                </span>
              </div>
              <div style={styles.comparisonRow}>
                <span style={styles.comparisonLabel}>Expenses:</span>
                <span style={styles.comparisonValue}>
                  {formatCurrency(month.expenses)}
                </span>
              </div>
              <div
                style={{
                  ...styles.comparisonRow,
                  ...styles.comparisonNetRow,
                }}
              >
                <span style={styles.comparisonLabel}>Net:</span>
                <span
                  style={{
                    ...styles.comparisonValue,
                    color: month.net >= 0 ? "#059669" : "#dc2626",
                    fontWeight: 600,
                  }}
                >
                  {formatCurrency(month.net)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <div style={styles.footer}>
        <span style={styles.footerIcon}>&#9432;</span>
        Demo dashboard with mock data. Real financial data will be connected to
        payment processing and accounting systems.
      </div>
    </div>
  );
}

/**
 * Inline styles
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "20px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  icon: {
    fontSize: "32px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
  },
  exportButton: {
    marginLeft: "auto",
    backgroundColor: "#1f2937",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  section: {
    marginBottom: "28px",
  },
  sectionHeader: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  sectionIcon: {
    fontSize: "18px",
  },
  revenueGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "16px",
  },
  revenueCard: {
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "16px",
    textAlign: "center" as const,
  },
  totalCard: {
    backgroundColor: "#ecfdf5",
    border: "2px solid #10b981",
  },
  revenueLabel: {
    fontSize: "13px",
    color: "#6b7280",
    marginBottom: "4px",
  },
  revenueAmount: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1f2937",
  },
  totalAmount: {
    color: "#059669",
  },
  tableContainer: {
    overflowX: "auto" as const,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "14px",
  },
  th: {
    textAlign: "left" as const,
    padding: "12px 8px",
    borderBottom: "2px solid #e5e7eb",
    color: "#374151",
    fontWeight: "600",
    whiteSpace: "nowrap" as const,
  },
  td: {
    padding: "12px 8px",
    borderBottom: "1px solid #e5e7eb",
    color: "#4b5563",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
  },
  approveButton: {
    backgroundColor: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
  },
  denyButton: {
    backgroundColor: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
  },
  reminderButton: {
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },
  overdueBadge: {
    fontSize: "12px",
    fontWeight: "500",
    padding: "4px 8px",
    borderRadius: "12px",
    whiteSpace: "nowrap" as const,
  },
  comparisonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "16px",
  },
  comparisonCard: {
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "16px",
  },
  comparisonMonth: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "12px",
    paddingBottom: "8px",
    borderBottom: "1px solid #e5e7eb",
  },
  comparisonRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
    fontSize: "14px",
  },
  comparisonNetRow: {
    marginTop: "8px",
    paddingTop: "8px",
    borderTop: "1px solid #e5e7eb",
  },
  comparisonLabel: {
    color: "#6b7280",
  },
  comparisonValue: {
    color: "#1f2937",
  },
  emptyState: {
    textAlign: "center" as const,
    padding: "24px",
    color: "#6b7280",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
  },
  footer: {
    marginTop: "24px",
    padding: "12px 16px",
    backgroundColor: "#f0f9ff",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#0369a1",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  footerIcon: {
    fontSize: "16px",
  },
};
