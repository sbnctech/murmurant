"use client";

/**
 * MemberTimelineDemo - Visual member journey timeline
 *
 * Shows the lifecycle of a sample SBNC member from joining
 * through their various milestones and current status.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import React from "react";

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  icon: "join" | "event" | "upgrade" | "committee" | "milestone";
  highlight?: boolean;
}

const SAMPLE_TIMELINE: TimelineEvent[] = [
  {
    date: "Jan 2023",
    title: "Joined SBNC",
    description: "Individual membership application approved",
    icon: "join",
    highlight: true,
  },
  {
    date: "Feb 2023",
    title: "First Event",
    description: "Attended New Member Coffee",
    icon: "event",
  },
  {
    date: "Mar 2023",
    title: "Wine & Dine",
    description: "Joined Wine & Dine interest group",
    icon: "event",
  },
  {
    date: "Jun 2023",
    title: "Summer Picnic",
    description: "Attended Annual Summer Picnic",
    icon: "event",
  },
  {
    date: "Sep 2023",
    title: "Upgraded to Household",
    description: "Added spouse to membership",
    icon: "upgrade",
    highlight: true,
  },
  {
    date: "Oct 2023",
    title: "Joined Committee",
    description: "Became member of Hospitality Committee",
    icon: "committee",
  },
  {
    date: "Dec 2023",
    title: "Holiday Party",
    description: "Attended Annual Holiday Celebration",
    icon: "event",
  },
  {
    date: "Jan 2024",
    title: "Membership Renewed",
    description: "Annual renewal completed",
    icon: "milestone",
    highlight: true,
  },
  {
    date: "Apr 2024",
    title: "10 Events Milestone",
    description: "Reached 10 events attended",
    icon: "milestone",
  },
  {
    date: "Jul 2024",
    title: "Committee Chair",
    description: "Elected Hospitality Committee Chair",
    icon: "committee",
    highlight: true,
  },
  {
    date: "Dec 2024",
    title: "Current Status",
    description: "Active household member, Committee Chair",
    icon: "milestone",
    highlight: true,
  },
];

function getIconForType(
  icon: TimelineEvent["icon"]
): React.ReactNode {
  const iconStyle: React.CSSProperties = {
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
  };

  switch (icon) {
    case "join":
      return <span style={iconStyle}>👋</span>;
    case "event":
      return <span style={iconStyle}>📅</span>;
    case "upgrade":
      return <span style={iconStyle}>⬆️</span>;
    case "committee":
      return <span style={iconStyle}>👥</span>;
    case "milestone":
      return <span style={iconStyle}>🎯</span>;
  }
}

function getColorForType(icon: TimelineEvent["icon"]): string {
  switch (icon) {
    case "join":
      return "#22c55e"; // green
    case "event":
      return "#3b82f6"; // blue
    case "upgrade":
      return "#a855f7"; // purple
    case "committee":
      return "#f59e0b"; // amber
    case "milestone":
      return "#ef4444"; // red
  }
}

function StatCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "16px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "24px", fontWeight: "600", color: "#1e293b" }}>
        {value}
      </div>
      {subtext && (
        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
          {subtext}
        </div>
      )}
    </div>
  );
}

function LegendItem({ icon, label }: { icon: TimelineEvent["icon"]; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          backgroundColor: getColorForType(icon),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {getIconForType(icon)}
      </div>
      <span style={{ fontSize: "12px", color: "#64748b" }}>{label}</span>
    </div>
  );
}

export default function MemberTimelineDemo() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
        padding: "24px",
      }}
    >
      <h2
        style={{
          fontSize: "24px",
          fontWeight: "600",
          color: "#1e293b",
          marginBottom: "8px",
        }}
      >
        Member Journey: Jane Doe
      </h2>
      <p style={{ color: "#64748b", marginBottom: "24px" }}>
        Sample member lifecycle from application to active participation
      </p>

      {/* Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <StatCard label="Member Since" value="Jan 2023" subtext="23 months" />
        <StatCard label="Events Attended" value="14" subtext="Avg 0.6/month" />
        <StatCard label="Current Tier" value="Household" subtext="Upgraded Sep 2023" />
        <StatCard label="Status" value="Active" subtext="Committee Chair" />
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <LegendItem icon="join" label="Joined" />
        <LegendItem icon="event" label="Event" />
        <LegendItem icon="upgrade" label="Upgrade" />
        <LegendItem icon="committee" label="Committee" />
        <LegendItem icon="milestone" label="Milestone" />
      </div>

      {/* Timeline */}
      <div style={{ position: "relative", paddingLeft: "40px" }}>
        {/* Vertical Line */}
        <div
          style={{
            position: "absolute",
            left: "12px",
            top: "0",
            bottom: "0",
            width: "2px",
            backgroundColor: "#e2e8f0",
          }}
        />

        {SAMPLE_TIMELINE.map((event, index) => (
          <div
            key={index}
            style={{
              position: "relative",
              marginBottom: "24px",
              paddingBottom: index === SAMPLE_TIMELINE.length - 1 ? "0" : "8px",
            }}
          >
            {/* Icon Circle */}
            <div
              style={{
                position: "absolute",
                left: "-40px",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: getColorForType(event.icon),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: event.highlight ? "3px solid #1e293b" : "none",
                boxSizing: "border-box",
              }}
            >
              {getIconForType(event.icon)}
            </div>

            {/* Content */}
            <div
              style={{
                backgroundColor: event.highlight ? "#f0f9ff" : "#ffffff",
                border: `1px solid ${event.highlight ? "#0ea5e9" : "#e2e8f0"}`,
                borderRadius: "8px",
                padding: "12px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    fontWeight: "600",
                    color: "#1e293b",
                    fontSize: "14px",
                  }}
                >
                  {event.title}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                >
                  {event.date}
                </span>
              </div>
              <p
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  margin: "0",
                }}
              >
                {event.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
