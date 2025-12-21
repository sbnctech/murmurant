/**
 * CommunicationsDashboard - VP Communications Dashboard Widget
 *
 * Displays event scheduling, new members, and lifecycle information.
 * Access is restricted to VP Communications and admin users via API.
 *
 * Sections:
 * 1. Events Opening for Registration This Week
 * 2. Newly Announced Events (This Week)
 * 3. Events Filling Fast
 * 4. New Members (Joined in Last 30 Days)
 * 5. Members Completing Membership This Month
 * 6. eNews Draft Assist (Read-Only)
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {  } from "@/lib/timezone";
import { formatDateLocale } from "@/lib/timezone";

// Dashboard data types (mirrors API response)
type CommunicationsDashboardData = {
  visible: boolean;
  eventsOpeningThisWeek: EventSummary[];
  newlyAnnouncedEvents: EventSummary[];
  eventsFillingFast: EventWithCapacity[];
  newMembers: MemberSummary[];
  membersCompletingThisMonth: MemberWithAnniversary[];
  enewsDrafts: EventWithBlurb[];
  stats: {
    totalEventsThisWeek: number;
    totalNewMembers: number;
    totalAtRisk: number;
    upcomingEvents: number;
  };
};

type EventSummary = {
  id: string;
  title: string;
  startTime: string;
  registrationOpensAt: string | null;
  status: string;
  category: string | null;
};

type EventWithCapacity = {
  id: string;
  title: string;
  startTime: string;
  totalCapacity: number;
  registeredCount: number;
  percentFull: number;
  status: string;
};

type EventWithBlurb = {
  id: string;
  title: string;
  startTime: string;
  enewsBlurbDraft: string;
  status: string;
};

type MemberSummary = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  joinedAt: string;
  lifecycleState: string;
  stateLabel: string;
};

type MemberWithAnniversary = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  joinedAt: string;
  anniversaryDate: string;
  yearsAsMember: number;
  lifecycleState: string;
  stateLabel: string;
};

// Lifecycle state colors
const LIFECYCLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  active_newbie: { bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" },
  active_member: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  active_extended: { bg: "#faf5ff", text: "#9333ea", border: "#e9d5ff" },
  offer_extended: { bg: "#fefce8", text: "#ca8a04", border: "#fef08a" },
  at_risk: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
  lapsed: { bg: "#f9fafb", text: "#6b7280", border: "#e5e7eb" },
  pending_new: { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa" },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return formatDateLocale(date, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return formatDateLocale(date, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function LifecycleBadge({ state, label }: { state: string; label: string }) {
  const colors = LIFECYCLE_COLORS[state] || LIFECYCLE_COLORS.lapsed;
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: 500,
        backgroundColor: colors.bg,
        color: colors.text,
        border: "1px solid " + colors.border,
      }}
    >
      {label}
    </span>
  );
}

function CapacityBar({ percentFull }: { percentFull: number }) {
  const color = percentFull >= 90 ? "#dc2626" : percentFull >= 75 ? "#f59e0b" : "#22c55e";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <div
        style={{
          flex: 1,
          height: "8px",
          backgroundColor: "#e5e7eb",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: percentFull + "%",
            height: "100%",
            backgroundColor: color,
            borderRadius: "4px",
          }}
        />
      </div>
      <span style={{ fontSize: "12px", fontWeight: 600, color }}>{percentFull}%</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div
      style={{
        padding: "12px 16px",
        backgroundColor: "#fff",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: color || "#111827",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "12px", color: "#6b7280" }}>{label}</div>
    </div>
  );
}

function Section({
  title,
  children,
  emptyMessage,
  isEmpty,
}: {
  title: string;
  children: React.ReactNode;
  emptyMessage: string;
  isEmpty: boolean;
}) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h4
        style={{
          margin: "0 0 12px 0",
          fontSize: "14px",
          fontWeight: 600,
          color: "#374151",
        }}
      >
        {title}
      </h4>
      {isEmpty ? (
        <div
          style={{
            padding: "16px",
            textAlign: "center",
            color: "#6b7280",
            fontSize: "13px",
            backgroundColor: "#f9fafb",
            borderRadius: "6px",
          }}
        >
          {emptyMessage}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export default function CommunicationsDashboard() {
  const [data, setData] = useState<CommunicationsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"events" | "members" | "enews">("events");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/officer/communications/dashboard", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok && res.status !== 200) {
        throw new Error("Failed to fetch dashboard data");
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching communications dashboard:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Don't render if loading, error, or not visible
  if (loading) {
    return (
      <div style={{ padding: "20px", color: "#6b7280" }}>
        Loading communications dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", color: "#dc2626" }}>
        Error loading communications dashboard: {error}
      </div>
    );
  }

  if (!data || !data.visible) {
    return null;
  }

  const tabs = [
    { key: "events" as const, label: "Events" },
    { key: "members" as const, label: "Members" },
    { key: "enews" as const, label: "eNews" },
  ];

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          backgroundColor: "#0ea5e9",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
            Communications Dashboard
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", opacity: 0.9 }}>
            VP Communications weekly overview
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          padding: "16px 20px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          backgroundColor: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <StatCard label="Events This Week" value={data.stats.totalEventsThisWeek} color="#0ea5e9" />
        <StatCard label="Upcoming Events" value={data.stats.upcomingEvents} color="#22c55e" />
        <StatCard label="New Members (30d)" value={data.stats.totalNewMembers} color="#8b5cf6" />
        <StatCard label="At Risk" value={data.stats.totalAtRisk} color="#f59e0b" />
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: "12px 16px",
              border: "none",
              backgroundColor: activeTab === tab.key ? "#fff" : "transparent",
              color: activeTab === tab.key ? "#0ea5e9" : "#6b7280",
              fontWeight: activeTab === tab.key ? 600 : 400,
              fontSize: "14px",
              cursor: "pointer",
              borderBottom: activeTab === tab.key ? "2px solid #0ea5e9" : "2px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: "20px" }}>
        {activeTab === "events" && (
          <>
            {/* Events Opening This Week */}
            <Section
              title="Events Opening for Registration This Week"
              isEmpty={data.eventsOpeningThisWeek.length === 0}
              emptyMessage="No events opening for registration this week"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.eventsOpeningThisWeek.map((event) => (
                  <Link
                    key={event.id}
                    href={"/admin/events/" + event.id}
                    style={{
                      display: "block",
                      padding: "10px 12px",
                      backgroundColor: "#f0f9ff",
                      borderRadius: "6px",
                      border: "1px solid #bae6fd",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 500, color: "#0369a1" }}>{event.title}</span>
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>
                        Opens: {event.registrationOpensAt ? formatDate(event.registrationOpensAt) : "TBD"}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                      Event: {formatDateTime(event.startTime)}
                    </div>
                  </Link>
                ))}
              </div>
            </Section>

            {/* Newly Announced Events */}
            <Section
              title="Newly Announced Events (This Week)"
              isEmpty={data.newlyAnnouncedEvents.length === 0}
              emptyMessage="No new events announced this week"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.newlyAnnouncedEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={"/admin/events/" + event.id}
                    style={{
                      display: "block",
                      padding: "10px 12px",
                      backgroundColor: "#f0fdf4",
                      borderRadius: "6px",
                      border: "1px solid #bbf7d0",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 500, color: "#166534" }}>{event.title}</span>
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "2px 6px",
                          backgroundColor: "#dcfce7",
                          borderRadius: "4px",
                          color: "#166534",
                        }}
                      >
                        {event.category || "General"}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                      {formatDateTime(event.startTime)}
                    </div>
                  </Link>
                ))}
              </div>
            </Section>

            {/* Events Filling Fast */}
            <Section
              title="Events Filling Fast"
              isEmpty={data.eventsFillingFast.length === 0}
              emptyMessage="No events at high capacity"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.eventsFillingFast.map((event) => (
                  <Link
                    key={event.id}
                    href={"/admin/events/" + event.id}
                    style={{
                      display: "block",
                      padding: "10px 12px",
                      backgroundColor: "#fef2f2",
                      borderRadius: "6px",
                      border: "1px solid #fecaca",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontWeight: 500, color: "#991b1b" }}>{event.title}</span>
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>
                        {event.registeredCount}/{event.totalCapacity} spots
                      </span>
                    </div>
                    <CapacityBar percentFull={event.percentFull} />
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                      {formatDateTime(event.startTime)}
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          </>
        )}

        {activeTab === "members" && (
          <>
            {/* New Members */}
            <Section
              title="New Members (Last 30 Days)"
              isEmpty={data.newMembers.length === 0}
              emptyMessage="No new members in the last 30 days"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {data.newMembers.map((member) => (
                  <Link
                    key={member.id}
                    href={"/admin/members/" + member.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 12px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "6px",
                      border: "1px solid #e5e7eb",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, color: "#111827" }}>
                        {member.firstName} {member.lastName}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>
                        Joined: {formatDate(member.joinedAt)}
                      </div>
                    </div>
                    <LifecycleBadge state={member.lifecycleState} label={member.stateLabel} />
                  </Link>
                ))}
              </div>
            </Section>

            {/* Members with Anniversary This Month */}
            <Section
              title="Membership Anniversaries This Month"
              isEmpty={data.membersCompletingThisMonth.length === 0}
              emptyMessage="No membership anniversaries this month"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {data.membersCompletingThisMonth.map((member) => (
                  <Link
                    key={member.id}
                    href={"/admin/members/" + member.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 12px",
                      backgroundColor: "#faf5ff",
                      borderRadius: "6px",
                      border: "1px solid #e9d5ff",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, color: "#111827" }}>
                        {member.firstName} {member.lastName}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>
                        {member.yearsAsMember} year{member.yearsAsMember !== 1 ? "s" : ""} on{" "}
                        {formatDate(member.anniversaryDate)}
                      </div>
                    </div>
                    <LifecycleBadge state={member.lifecycleState} label={member.stateLabel} />
                  </Link>
                ))}
              </div>
            </Section>
          </>
        )}

        {activeTab === "enews" && (
          <Section
            title="eNews Blurb Drafts"
            isEmpty={data.enewsDrafts.length === 0}
            emptyMessage="No eNews blurb drafts available"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {data.enewsDrafts.map((event) => (
                <div
                  key={event.id}
                  style={{
                    padding: "12px",
                    backgroundColor: "#fff7ed",
                    borderRadius: "6px",
                    border: "1px solid #fed7aa",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <Link
                      href={"/admin/events/" + event.id}
                      style={{ fontWeight: 500, color: "#c2410c", textDecoration: "none" }}
                    >
                      {event.title}
                    </Link>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      {formatDateTime(event.startTime)}
                    </span>
                  </div>
                  <div
                    style={{
                      padding: "10px",
                      backgroundColor: "#fff",
                      borderRadius: "4px",
                      border: "1px solid #fde68a",
                      fontSize: "13px",
                      color: "#374151",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {event.enewsBlurbDraft}
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "11px", color: "#6b7280", fontStyle: "italic" }}>
                    Copy to eNews editor
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
