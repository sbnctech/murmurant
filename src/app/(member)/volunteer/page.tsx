"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatClubDate } from "@/lib/timezone";

type VolunteerOpportunity = {
  id: string;
  title: string;
  type: "committee" | "event" | "ongoing";
  description: string;
  timeCommitment: string;
  spotsAvailable: number;
  committee?: string;
  eventName?: string;
  eventDate?: string;
};

type CurrentRole = {
  id: string;
  title: string;
  committee: string;
  since: string;
};

// Mock data - in production would come from API
const MOCK_OPPORTUNITIES: VolunteerOpportunity[] = [
  {
    id: "1",
    title: "Events Committee Member",
    type: "committee",
    description: "Help plan and coordinate monthly social events and special gatherings.",
    timeCommitment: "4-6 hours/month",
    spotsAvailable: 2,
    committee: "Events Committee",
  },
  {
    id: "2",
    title: "Membership Committee Member",
    type: "committee",
    description: "Welcome new members, process applications, and help with retention efforts.",
    timeCommitment: "3-4 hours/month",
    spotsAvailable: 1,
    committee: "Membership Committee",
  },
  {
    id: "3",
    title: "Newsletter Editor",
    type: "committee",
    description: "Compile and edit the monthly club newsletter. Writing experience preferred.",
    timeCommitment: "6-8 hours/month",
    spotsAvailable: 1,
    committee: "Communications Committee",
  },
  {
    id: "4",
    title: "Wine Tasting Event Helper",
    type: "event",
    description: "Help with setup, check-in, and cleanup at our January wine tasting event.",
    timeCommitment: "4 hours (one-time)",
    spotsAvailable: 4,
    eventName: "January Wine Tasting",
    eventDate: "2025-01-18",
  },
  {
    id: "5",
    title: "New Member Luncheon Greeter",
    type: "event",
    description: "Welcome new members at the door and help them find their tables.",
    timeCommitment: "2 hours (one-time)",
    spotsAvailable: 3,
    eventName: "New Member Luncheon",
    eventDate: "2025-01-25",
  },
  {
    id: "6",
    title: "Website Content Contributor",
    type: "ongoing",
    description: "Write event recaps and member spotlights for the club website.",
    timeCommitment: "2-3 hours/month",
    spotsAvailable: 2,
  },
  {
    id: "7",
    title: "Photography Volunteer",
    type: "ongoing",
    description: "Photograph club events for the newsletter and website.",
    timeCommitment: "Varies by event",
    spotsAvailable: 3,
  },
];

const MOCK_CURRENT_ROLES: CurrentRole[] = [
  {
    id: "r1",
    title: "Book Club Coordinator",
    committee: "Interest Groups",
    since: "March 2024",
  },
];

function OpportunityCard({
  opportunity,
  onInterested,
  expressing,
}: {
  opportunity: VolunteerOpportunity;
  onInterested: (id: string) => void;
  expressing: boolean;
}) {
  const typeColors = {
    committee: { bg: "#e0f2fe", text: "#0369a1", label: "Committee" },
    event: { bg: "#fef3c7", text: "#92400e", label: "Event Helper" },
    ongoing: { bg: "#f3e8ff", text: "#7c3aed", label: "Ongoing" },
  };

  const typeStyle = typeColors[opportunity.type];

  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <span
            style={{
              display: "inline-block",
              padding: "4px 10px",
              backgroundColor: typeStyle.bg,
              color: typeStyle.text,
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: 500,
              marginBottom: "8px",
            }}
          >
            {typeStyle.label}
          </span>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#1f2937" }}>
            {opportunity.title}
          </h3>
        </div>
        <div
          style={{
            padding: "6px 12px",
            backgroundColor: opportunity.spotsAvailable > 0 ? "#ecfdf5" : "#fef2f2",
            color: opportunity.spotsAvailable > 0 ? "#065f46" : "#991b1b",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          {opportunity.spotsAvailable > 0
            ? `${opportunity.spotsAvailable} spot${opportunity.spotsAvailable > 1 ? "s" : ""} open`
            : "Filled"}
        </div>
      </div>

      <p style={{ margin: 0, color: "#6b7280", fontSize: "15px", lineHeight: 1.5 }}>
        {opportunity.description}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "14px", color: "#6b7280" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {opportunity.timeCommitment}
        </div>
        {opportunity.committee && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {opportunity.committee}
          </div>
        )}
        {opportunity.eventDate && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {formatClubDate(new Date(opportunity.eventDate))}
          </div>
        )}
      </div>

      <button
        onClick={() => onInterested(opportunity.id)}
        disabled={opportunity.spotsAvailable === 0 || expressing}
        style={{
          marginTop: "8px",
          padding: "12px 20px",
          backgroundColor: opportunity.spotsAvailable === 0 ? "#e5e7eb" : "#2563eb",
          color: opportunity.spotsAvailable === 0 ? "#9ca3af" : "#fff",
          border: "none",
          borderRadius: "8px",
          fontSize: "15px",
          fontWeight: 600,
          cursor: opportunity.spotsAvailable === 0 ? "not-allowed" : "pointer",
          width: "100%",
        }}
      >
        {expressing ? "Submitting..." : opportunity.spotsAvailable === 0 ? "No Openings" : "I'm Interested"}
      </button>
    </div>
  );
}

function CurrentRoleCard({ role }: { role: CurrentRole }) {
  return (
    <div
      style={{
        backgroundColor: "#f0fdf4",
        border: "1px solid #bbf7d0",
        borderRadius: "8px",
        padding: "16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      <div>
        <div style={{ fontWeight: 600, color: "#166534", fontSize: "15px" }}>{role.title}</div>
        <div style={{ fontSize: "13px", color: "#4ade80" }}>{role.committee}</div>
      </div>
      <div style={{ fontSize: "13px", color: "#6b7280" }}>Since {role.since}</div>
    </div>
  );
}

export default function VolunteerPage() {
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [currentRoles, setCurrentRoles] = useState<CurrentRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "committee" | "event" | "ongoing">("all");
  const [expressingInterest, setExpressingInterest] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API fetch
    const fetchData = async () => {
      await new Promise((r) => setTimeout(r, 500));
      setOpportunities(MOCK_OPPORTUNITIES);
      setCurrentRoles(MOCK_CURRENT_ROLES);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleInterested = async (opportunityId: string) => {
    setExpressingInterest(opportunityId);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    const opp = opportunities.find((o) => o.id === opportunityId);
    setSuccessMessage(`Your interest in "${opp?.title}" has been submitted! A committee member will contact you soon.`);
    setExpressingInterest(null);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const filteredOpportunities =
    filter === "all" ? opportunities : opportunities.filter((o) => o.type === filter);

  const filterButtons: { value: "all" | "committee" | "event" | "ongoing"; label: string }[] = [
    { value: "all", label: "All Opportunities" },
    { value: "committee", label: "Committee Roles" },
    { value: "event", label: "Event Helpers" },
    { value: "ongoing", label: "Ongoing Roles" },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
      {/* Header */}
      <header style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <Link href="/my-events" style={{ color: "#6b7280", textDecoration: "none", fontSize: "14px" }}>
            ← Back to My Events
          </Link>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#1f2937", margin: "0 0 12px 0" }}>
          Volunteer Opportunities
        </h1>
        <p style={{ fontSize: 17, color: "#6b7280", margin: 0 }}>
          Make a difference in our club community. Find the perfect volunteer role for you.
        </p>
      </header>

      {/* Success Message */}
      {successMessage && (
        <div
          style={{
            padding: "16px 20px",
            backgroundColor: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: "8px",
            marginBottom: "24px",
            color: "#065f46",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Current Volunteer Roles */}
      {currentRoles.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1f2937", marginBottom: 16 }}>
            Your Current Volunteer Roles
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {currentRoles.map((role) => (
              <CurrentRoleCard key={role.id} role={role} />
            ))}
          </div>
        </section>
      )}

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          flexWrap: "wrap",
          borderBottom: "1px solid #e5e7eb",
          paddingBottom: "16px",
        }}
      >
        {filterButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => setFilter(btn.value)}
            style={{
              padding: "10px 18px",
              backgroundColor: filter === btn.value ? "#2563eb" : "#f3f4f6",
              color: filter === btn.value ? "#fff" : "#4b5563",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Opportunities Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b7280" }}>
          Loading opportunities...
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            backgroundColor: "#f9fafb",
            borderRadius: "12px",
            color: "#6b7280",
          }}
        >
          <p style={{ fontSize: "16px", margin: "0 0 8px 0" }}>No opportunities in this category right now.</p>
          <p style={{ fontSize: "14px", margin: 0 }}>Check back soon or try another category.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredOpportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onInterested={handleInterested}
              expressing={expressingInterest === opp.id}
            />
          ))}
        </div>
      )}

      {/* Call to Action */}
      <section
        style={{
          marginTop: 48,
          padding: "32px",
          backgroundColor: "#1e40af",
          borderRadius: "12px",
          textAlign: "center",
          color: "#fff",
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 12px 0" }}>
          Don&apos;t See What You&apos;re Looking For?
        </h2>
        <p style={{ fontSize: 16, margin: "0 0 20px 0", opacity: 0.9 }}>
          We&apos;re always looking for volunteers with unique skills. Let us know how you&apos;d like to help!
        </p>
        <Link
          href="/contact"
          style={{
            display: "inline-block",
            padding: "14px 28px",
            backgroundColor: "#fff",
            color: "#1e40af",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "15px",
          }}
        >
          Contact Us
        </Link>
      </section>

      {/* Footer Info */}
      <footer style={{ marginTop: 40, textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
        <p>
          Questions about volunteering?{" "}
          <Link href="/contact" style={{ color: "#2563eb", textDecoration: "none" }}>
            Contact our Volunteer Coordinator
          </Link>
        </p>
      </footer>
    </div>
  );
}
