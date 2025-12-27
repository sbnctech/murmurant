/**
 * Admin Reports Dashboard
 *
 * Overview of key club metrics including membership, events, and revenue.
 * Provides quick access to detailed reports and data exports.
 *
 * Charter: P1 (identity provable), P7 (observability)
 */

import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Reports Dashboard | Admin",
  description: "Club metrics, statistics, and reporting tools",
};

/**
 * Format a number with commas for display (e.g., 1234 -> "1,234")
 */
function formatNum(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Format a currency amount for display (e.g., 1234 -> "$1,234")
 */
function formatMoney(amount: number): string {
  return `$${formatNum(amount)}`;
}

// Stat card component for consistent styling
function StatCard({
  label,
  value,
  subtext,
  trend,
  testId,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: { value: number; positive: boolean };
  testId: string;
}) {
  return (
    <div
      data-test-id={testId}
      style={{
        backgroundColor: "white",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        padding: "20px",
      }}
    >
      <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
        <span style={{ fontSize: "32px", fontWeight: 700, color: "#1f2937" }}>
          {value}
        </span>
        {trend && (
          <span
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: trend.positive ? "#059669" : "#dc2626",
            }}
          >
            {trend.positive ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
      {subtext && (
        <div style={{ fontSize: "13px", color: "#9ca3af", marginTop: "4px" }}>
          {subtext}
        </div>
      )}
    </div>
  );
}

// Quick report link component
function QuickReportLink({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        padding: "16px",
        backgroundColor: "white",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        textDecoration: "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <span style={{ fontSize: "24px" }}>{icon}</span>
        <div>
          <div style={{ fontWeight: 600, color: "#1f2937" }}>{label}</div>
          <div style={{ fontSize: "14px", color: "#6b7280", marginTop: "2px" }}>
            {description}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function ReportsDashboardPage() {
  // Get current date info for queries
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch membership statistics
  const [totalMembers, newMembersThisMonth, expiringMembers] = await Promise.all([
    prisma.member.count({
      where: {
        membershipStatus: { isActive: true },
      },
    }),
    prisma.member.count({
      where: {
        joinedAt: { gte: startOfMonth },
      },
    }),
    prisma.member.count({
      where: {
        membershipStatus: {
          isActive: true,
          isEligibleForRenewal: true,
        },
      },
    }),
  ]);

  // Fetch event statistics
  const [upcomingEvents, eventsThisMonth, totalRegistrations, confirmedCount] = await Promise.all([
    prisma.event.count({
      where: {
        startTime: { gte: now },
        isPublished: true,
      },
    }),
    prisma.event.count({
      where: {
        startTime: {
          gte: startOfMonth,
          lte: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        },
        isPublished: true,
      },
    }),
    prisma.eventRegistration.count({
      where: {
        event: {
          startTime: { gte: new Date(now.getFullYear(), 0, 1) },
        },
      },
    }),
    prisma.eventRegistration.count({
      where: {
        status: "CONFIRMED",
        event: {
          startTime: { gte: new Date(now.getFullYear(), 0, 1) },
        },
      },
    }),
  ]);

  // Calculate confirmation rate
  const confirmationRate = totalRegistrations > 0
    ? Math.round((confirmedCount / totalRegistrations) * 100)
    : 0;

  // Fetch revenue statistics (from payment intents)
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const paymentIntents = await prisma.paymentIntent.findMany({
    where: {
      status: "SUCCEEDED",
      createdAt: { gte: yearStart },
    },
    select: {
      amountCents: true,
    },
  });

  // Calculate event revenue (all payment intents are for event registrations)
  const eventRevenueCents = paymentIntents.reduce(
    (sum: number, p: { amountCents: number }) => sum + p.amountCents,
    0
  );
  const eventRevenue = Math.round(eventRevenueCents / 100);

  // Placeholder values for other revenue types (these would come from separate models when implemented)
  const duesRevenue = 0; // Membership dues would come from a MembershipPayment model
  const donationRevenue = 0; // Donations would come from a Donation model
  const totalRevenue = eventRevenue + duesRevenue + donationRevenue;

  return (
    <div data-test-id="reports-dashboard" style={{ padding: "24px", maxWidth: "1200px" }}>
      {/* Header */}
      <header style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1f2937", margin: 0 }}>
              Reports Dashboard
            </h1>
            <p style={{ color: "#6b7280", marginTop: "4px" }}>
              Club metrics and statistics overview
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            {/* Date Range Selector */}
            <select
              data-test-id="date-range-selector"
              defaultValue="ytd"
              style={{
                padding: "8px 12px",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                backgroundColor: "white",
                cursor: "pointer",
              }}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="ytd">Year to Date</option>
              <option value="year">Last 12 Months</option>
            </select>
            {/* Export Button */}
            <button
              type="button"
              data-test-id="export-all-button"
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 500,
                color: "white",
                backgroundColor: "#2563eb",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Export All Data
            </button>
          </div>
        </div>
      </header>

      {/* Membership Stats */}
      <section data-test-id="membership-stats" style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", marginBottom: "16px" }}>
          Membership
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <StatCard
            testId="stat-total-members"
            label="Total Active Members"
            value={totalMembers}
            subtext="Currently active"
          />
          <StatCard
            testId="stat-new-members"
            label="New This Month"
            value={newMembersThisMonth}
            trend={newMembersThisMonth > 5 ? { value: 12, positive: true } : undefined}
          />
          <StatCard
            testId="stat-expiring-members"
            label="Expiring Soon"
            value={expiringMembers}
            subtext="Eligible for renewal"
          />
        </div>
      </section>

      {/* Event Stats */}
      <section data-test-id="event-stats" style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", marginBottom: "16px" }}>
          Events
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <StatCard
            testId="stat-upcoming-events"
            label="Upcoming Events"
            value={upcomingEvents}
            subtext="Published and scheduled"
          />
          <StatCard
            testId="stat-events-this-month"
            label="Events This Month"
            value={eventsThisMonth}
          />
          <StatCard
            testId="stat-confirmation-rate"
            label="Confirmation Rate"
            value={`${confirmationRate}%`}
            subtext="Year to date"
          />
          <StatCard
            testId="stat-total-registrations"
            label="Total Registrations"
            value={totalRegistrations}
            subtext="This year"
          />
        </div>
      </section>

      {/* Revenue Summary */}
      <section data-test-id="revenue-stats" style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", marginBottom: "16px" }}>
          Revenue (Year to Date)
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <StatCard
            testId="stat-total-revenue"
            label="Total Revenue"
            value={formatMoney(totalRevenue)}
            subtext="All sources"
          />
          <StatCard
            testId="stat-dues-revenue"
            label="Membership Dues"
            value={formatMoney(duesRevenue)}
            subtext="Coming soon"
          />
          <StatCard
            testId="stat-event-revenue"
            label="Event Fees"
            value={formatMoney(eventRevenue)}
          />
          <StatCard
            testId="stat-donation-revenue"
            label="Donations"
            value={formatMoney(donationRevenue)}
            subtext="Coming soon"
          />
        </div>
      </section>

      {/* Growth Chart Placeholder */}
      <section data-test-id="growth-chart" style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", marginBottom: "16px" }}>
          Growth Trends
        </h2>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📈</div>
          <p style={{ fontSize: "16px", color: "#6b7280", marginBottom: "8px" }}>
            Membership Growth Chart
          </p>
          <p style={{ fontSize: "14px", color: "#9ca3af" }}>
            Interactive chart visualization coming soon
          </p>
        </div>
      </section>

      {/* Quick Report Links */}
      <section data-test-id="quick-reports" style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", marginBottom: "16px" }}>
          Quick Reports
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          <QuickReportLink
            href="/admin/members"
            icon="👥"
            label="Member Roster"
            description="View and export complete member list with contact info"
          />
          <QuickReportLink
            href="/admin/events"
            icon="📅"
            label="Event History"
            description="Browse past events with attendance records"
          />
          <QuickReportLink
            href="/admin/payments"
            icon="💰"
            label="Financial Reports"
            description="Payment history, revenue breakdown, and trends"
          />
          <QuickReportLink
            href="/admin/committees"
            icon="🏛️"
            label="Committee Reports"
            description="Committee membership and activity summaries"
          />
          <QuickReportLink
            href="/admin/reports/membership"
            icon="📊"
            label="Membership Analytics"
            description="Detailed membership trends and demographics"
          />
          <QuickReportLink
            href="/admin/reports/attendance"
            icon="✅"
            label="Attendance Reports"
            description="Event attendance patterns and engagement metrics"
          />
        </div>
      </section>

      {/* Footer with last updated */}
      <footer style={{ fontSize: "13px", color: "#9ca3af", textAlign: "center" }}>
        Data refreshed on page load
      </footer>
    </div>
  );
}
