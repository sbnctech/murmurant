// Copyright (c) Santa Barbara Newcomers Club
// Event reports page for event chairs

"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";

// Mock event data
const mockEvent = {
  id: "evt-123",
  name: "Wine Tasting at Local Vineyard",
  date: "2024-12-15",
  status: "COMPLETED",
};

// Mock registration data
const mockRegistrations = {
  total: 42,
  byTier: [
    { name: "Member", count: 28, price: 35 },
    { name: "Member + Guest", count: 10, price: 65 },
    { name: "Non-Member", count: 4, price: 45 },
  ],
  checkedIn: 38,
  noShow: 4,
  cancelled: 3,
  waitlist: 5,
  waitlistConverted: 2,
};

// Mock revenue data
const mockRevenue = {
  gross: 1890,
  refunds: 105,
  net: 1785,
  byTier: [
    { name: "Member", revenue: 980 },
    { name: "Member + Guest", revenue: 650 },
    { name: "Non-Member", revenue: 180 },
  ],
};

// Mock feedback data
const mockFeedback = {
  totalResponses: 28,
  averageRating: 4.3,
  ratingBreakdown: [
    { stars: 5, count: 12 },
    { stars: 4, count: 10 },
    { stars: 3, count: 4 },
    { stars: 2, count: 2 },
    { stars: 1, count: 0 },
  ],
  wouldAttendAgain: { yes: 24, no: 4 },
  recentComments: [
    { rating: 5, text: "Wonderful event! Great wine selection and knowledgeable host." },
    { rating: 4, text: "Enjoyed the venue. Would have liked more time for tasting." },
    { rating: 5, text: "Perfect afternoon activity. Met wonderful new friends!" },
  ],
};

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  highlight?: boolean;
}

function StatCard({ label, value, subtext, highlight }: StatCardProps) {
  return (
    <div
      style={{
        backgroundColor: highlight ? "#eff6ff" : "white",
        border: `1px solid ${highlight ? "#bfdbfe" : "#e5e7eb"}`,
        borderRadius: "8px",
        padding: "16px",
      }}
    >
      <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: "28px",
          fontWeight: 700,
          color: highlight ? "#2563eb" : "#1f2937",
        }}
      >
        {value}
      </div>
      {subtext && (
        <div style={{ fontSize: "13px", color: "#9ca3af", marginTop: "4px" }}>
          {subtext}
        </div>
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <section
      style={{
        backgroundColor: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "24px",
      }}
    >
      <h3
        style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "#374151",
          marginBottom: "16px",
          paddingBottom: "12px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div
      style={{
        height: "8px",
        backgroundColor: "#e5e7eb",
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${percentage}%`,
          backgroundColor: color,
          borderRadius: "4px",
          transition: "width 0.3s",
        }}
      />
    </div>
  );
}

export default function EventReportsPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [isPrintView, setIsPrintView] = useState(false);

  const attendanceRate = Math.round(
    (mockRegistrations.checkedIn / mockRegistrations.total) * 100
  );

  const handleExportCSV = () => {
    const csvRows = [
      ["Event Report", mockEvent.name],
      ["Date", mockEvent.date],
      [""],
      ["Registration Summary"],
      ["Total Registrations", mockRegistrations.total.toString()],
      ["Checked In", mockRegistrations.checkedIn.toString()],
      ["No Shows", mockRegistrations.noShow.toString()],
      ["Cancelled", mockRegistrations.cancelled.toString()],
      [""],
      ["Registrations by Tier"],
      ["Tier", "Count", "Price"],
      ...mockRegistrations.byTier.map((t) => [t.name, t.count.toString(), `$${t.price}`]),
      [""],
      ["Revenue"],
      ["Gross Revenue", `$${mockRevenue.gross}`],
      ["Refunds", `$${mockRevenue.refunds}`],
      ["Net Revenue", `$${mockRevenue.net}`],
      [""],
      ["Feedback Summary"],
      ["Total Responses", mockFeedback.totalResponses.toString()],
      ["Average Rating", mockFeedback.averageRating.toString()],
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `event-report-${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    setIsPrintView(true);
    setTimeout(() => {
      window.print();
      setIsPrintView(false);
    }, 100);
  };

  return (
    <div
      data-test-id="event-reports-page"
      style={{
        maxWidth: "900px",
        padding: isPrintView ? "0" : undefined,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#1f2937",
              marginBottom: "4px",
            }}
          >
            Event Report
          </h1>
          <p style={{ fontSize: "16px", color: "#6b7280", margin: 0 }}>
            {mockEvent.name}
          </p>
          <p style={{ fontSize: "14px", color: "#9ca3af", margin: "4px 0 0 0" }}>
            {mockEvent.date} • {mockEvent.status}
          </p>
        </div>

        {!isPrintView && (
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={handleExportCSV}
              data-test-id="export-csv-button"
              style={{
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#374151",
                backgroundColor: "white",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>📥</span> Export CSV
            </button>
            <button
              type="button"
              onClick={handlePrint}
              data-test-id="print-button"
              style={{
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#374151",
                backgroundColor: "white",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>🖨️</span> Print
            </button>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <StatCard
          label="Total Registered"
          value={mockRegistrations.total}
          highlight
        />
        <StatCard
          label="Checked In"
          value={mockRegistrations.checkedIn}
          subtext={`${attendanceRate}% attendance`}
        />
        <StatCard
          label="Net Revenue"
          value={`$${mockRevenue.net.toLocaleString()}`}
        />
        <StatCard
          label="Avg Rating"
          value={mockFeedback.averageRating.toFixed(1)}
          subtext={`${mockFeedback.totalResponses} responses`}
        />
      </div>

      {/* Registration Summary */}
      <Section title="Registration Summary">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "24px",
          }}
        >
          <div>
            <h4 style={{ fontSize: "14px", fontWeight: 500, color: "#6b7280", marginBottom: "12px" }}>
              By Ticket Tier
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {mockRegistrations.byTier.map((tier) => (
                <div key={tier.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", color: "#374151" }}>{tier.name}</span>
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "#1f2937" }}>
                      {tier.count} @ ${tier.price}
                    </span>
                  </div>
                  <ProgressBar value={tier.count} max={mockRegistrations.total} color="#3b82f6" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: "14px", fontWeight: 500, color: "#6b7280", marginBottom: "12px" }}>
              Attendance Status
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#059669" }}>✓ Checked In</span>
                <span style={{ fontWeight: 500 }}>{mockRegistrations.checkedIn}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#dc2626" }}>✗ No Show</span>
                <span style={{ fontWeight: 500 }}>{mockRegistrations.noShow}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280" }}>⊘ Cancelled</span>
                <span style={{ fontWeight: 500 }}>{mockRegistrations.cancelled}</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Waitlist Stats */}
      <Section title="Waitlist Statistics">
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#1f2937" }}>
              {mockRegistrations.waitlist}
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>Total on Waitlist</div>
          </div>
          <div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#059669" }}>
              {mockRegistrations.waitlistConverted}
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>Converted to Registered</div>
          </div>
          <div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#9ca3af" }}>
              {mockRegistrations.waitlist - mockRegistrations.waitlistConverted}
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>Remained on Waitlist</div>
          </div>
        </div>
      </Section>

      {/* Revenue Breakdown */}
      <Section title="Revenue Breakdown">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "24px",
          }}
        >
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <span style={{ color: "#374151" }}>Gross Revenue</span>
                <span style={{ fontWeight: 600 }}>${mockRevenue.gross.toLocaleString()}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <span style={{ color: "#dc2626" }}>Refunds</span>
                <span style={{ fontWeight: 600, color: "#dc2626" }}>
                  -${mockRevenue.refunds.toLocaleString()}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  backgroundColor: "#f0fdf4",
                  margin: "0 -12px",
                  padding: "12px",
                  borderRadius: "6px",
                }}
              >
                <span style={{ fontWeight: 600, color: "#059669" }}>Net Revenue</span>
                <span style={{ fontWeight: 700, color: "#059669", fontSize: "18px" }}>
                  ${mockRevenue.net.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: "14px", fontWeight: 500, color: "#6b7280", marginBottom: "12px" }}>
              By Ticket Tier
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {mockRevenue.byTier.map((tier) => (
                <div key={tier.name} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#374151" }}>{tier.name}</span>
                  <span style={{ fontWeight: 500 }}>${tier.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Feedback Summary */}
      <Section title="Feedback Summary">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "24px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "16px" }}>
              <span style={{ fontSize: "36px", fontWeight: 700, color: "#f59e0b" }}>
                {mockFeedback.averageRating.toFixed(1)}
              </span>
              <span style={{ fontSize: "16px", color: "#6b7280" }}>/ 5.0</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {mockFeedback.ratingBreakdown.map((item) => (
                <div key={item.stars} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "60px", fontSize: "14px", color: "#6b7280" }}>
                    {item.stars} star{item.stars !== 1 ? "s" : ""}
                  </span>
                  <div style={{ flex: 1 }}>
                    <ProgressBar value={item.count} max={mockFeedback.totalResponses} color="#f59e0b" />
                  </div>
                  <span style={{ width: "30px", fontSize: "14px", color: "#6b7280", textAlign: "right" }}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#f9fafb", borderRadius: "6px" }}>
              <div style={{ fontSize: "14px", color: "#6b7280" }}>Would attend again?</div>
              <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
                <span style={{ color: "#059669", fontWeight: 500 }}>
                  Yes: {mockFeedback.wouldAttendAgain.yes}
                </span>
                <span style={{ color: "#dc2626", fontWeight: 500 }}>
                  No: {mockFeedback.wouldAttendAgain.no}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: "14px", fontWeight: 500, color: "#6b7280", marginBottom: "12px" }}>
              Recent Comments
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {mockFeedback.recentComments.map((comment, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "6px",
                    borderLeft: "3px solid #f59e0b",
                  }}
                >
                  <div style={{ fontSize: "14px", color: "#f59e0b", marginBottom: "4px" }}>
                    {"★".repeat(comment.rating)}{"☆".repeat(5 - comment.rating)}
                  </div>
                  <p style={{ fontSize: "14px", color: "#374151", margin: 0 }}>
                    &ldquo;{comment.text}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          [data-test-id="event-reports-page"],
          [data-test-id="event-reports-page"] * {
            visibility: visible;
          }
          [data-test-id="event-reports-page"] {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          [data-test-id="export-csv-button"],
          [data-test-id="print-button"] {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
