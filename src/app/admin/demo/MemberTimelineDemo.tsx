"use client";

/**
 * MemberTimelineDemo - Visual member journey timeline
 *
 * Shows the lifecycle of a sample SBNC member from joining
 * through their various milestones and current status.
 *
 * Copyright © 2025 Murmurant, Inc.
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
    description: "Attended Wine Tasting at Local Vineyard",
    icon: "event",
  },
  {
    date: "Mar 2023",
    title: "Upgraded Membership",
    description: "Changed to Household membership tier",
    icon: "upgrade",
    highlight: true,
  },
  {
    date: "Apr 2023",
    title: "Monthly Luncheon",
    description: "Attended general meeting at Fess Parker",
    icon: "event",
  },
  {
    date: "May 2023",
    title: "Hiking Group",
    description: "Joined Rattlesnake Canyon hike",
    icon: "event",
  },
  {
    date: "Jun 2023",
    title: "Joined Committee",
    description: "Became Hospitality Committee member",
    icon: "committee",
    highlight: true,
  },
  {
    date: "Sep 2023",
    title: "5 Events Milestone",
    description: "Attended 5th club event",
    icon: "milestone",
  },
  {
    date: "Dec 2023",
    title: "Holiday Party",
    description: "Volunteered at annual holiday celebration",
    icon: "event",
  },
  {
    date: "Jan 2024",
    title: "Membership Renewed",
    description: "Second year membership confirmed",
    icon: "join",
    highlight: true,
  },
  {
    date: "Jun 2024",
    title: "10 Events Milestone",
    description: "Active participant with 10+ events",
    icon: "milestone",
  },
  {
    date: "Dec 2024",
    title: "12 Events Total",
    description: "Current activity level maintained",
    icon: "event",
  },
];

function getIconForType(type: TimelineEvent["icon"]): string {
  switch (type) {
    case "join":
      return "\u2713"; // checkmark
    case "event":
      return "\u2605"; // star
    case "upgrade":
      return "\u2191"; // up arrow
    case "committee":
      return "\u2302"; // house/home
    case "milestone":
      return "\u2606"; // outlined star
    default:
      return "\u2022"; // bullet
  }
}

function getColorForType(type: TimelineEvent["icon"]): string {
  switch (type) {
    case "join":
      return "#22c55e"; // green
    case "event":
      return "#3b82f6"; // blue
    case "upgrade":
      return "#a855f7"; // purple
    case "committee":
      return "#f59e0b"; // amber
    case "milestone":
      return "#ec4899"; // pink
    default:
      return "#6b7280"; // gray
  }
}

export function MemberTimelineDemo() {
  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#fff",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
      }}
    >
      <h3
        style={{
          fontSize: "18px",
          fontWeight: 600,
          marginBottom: "8px",
          color: "#111827",
        }}
      >
        Member Lifecycle Timeline
      </h3>
      <p
        style={{
          fontSize: "14px",
          color: "#6b7280",
          marginBottom: "24px",
        }}
      >
        Sample journey: Jane Doe (Active Member)
      </p>

      {/* Stats summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <StatCard label="Member Since" value="Jan 2023" />
        <StatCard label="Events Attended" value="12" />
        <StatCard label="Current Tier" value="Household" />
        <StatCard label="Status" value="Active" highlight />
      </div>

      {/* Timeline */}
      <div style={{ position: "relative", paddingLeft: "32px" }}>
        {/* Vertical line */}
        <div
          style={{
            position: "absolute",
            left: "11px",
            top: "8px",
            bottom: "8px",
            width: "2px",
            backgroundColor: "#e5e7eb",
          }}
        />

        {SAMPLE_TIMELINE.map((event, index) => (
          <div
            key={index}
            style={{
              position: "relative",
              paddingBottom: index === SAMPLE_TIMELINE.length - 1 ? 0 : "24px",
            }}
          >
            {/* Icon circle */}
            <div
              style={{
                position: "absolute",
                left: "-32px",
                top: "0",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: event.highlight
                  ? getColorForType(event.icon)
                  : "#fff",
                border: `2px solid ${getColorForType(event.icon)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                color: event.highlight ? "#fff" : getColorForType(event.icon),
                fontWeight: "bold",
              }}
            >
              {getIconForType(event.icon)}
            </div>

            {/* Content */}
            <div
              style={{
                backgroundColor: event.highlight ? "#f9fafb" : "transparent",
                padding: event.highlight ? "12px" : "0",
                borderRadius: "6px",
                border: event.highlight ? "1px solid #e5e7eb" : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "#9ca3af",
                    fontFamily: "monospace",
                    minWidth: "70px",
                  }}
                >
                  {event.date}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: event.highlight ? 600 : 500,
                    color: "#111827",
                  }}
                >
                  {event.title}
                </span>
              </div>
              <p
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  marginLeft: "82px",
                  margin: 0,
                  paddingLeft: "82px",
                }}
              >
                {event.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: "32px",
          paddingTop: "16px",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <LegendItem icon="join" label="Membership" />
        <LegendItem icon="event" label="Event" />
        <LegendItem icon="upgrade" label="Upgrade" />
        <LegendItem icon="committee" label="Committee" />
        <LegendItem icon="milestone" label="Milestone" />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: highlight ? "#ecfdf5" : "#f9fafb",
        borderRadius: "8px",
        border: `1px solid ${highlight ? "#a7f3d0" : "#e5e7eb"}`,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: "#6b7280",
          marginBottom: "4px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "20px",
          fontWeight: 600,
          color: highlight ? "#059669" : "#111827",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function LegendItem({
  icon,
  label,
}: {
  icon: TimelineEvent["icon"];
  label: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div
        style={{
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          backgroundColor: getColorForType(icon),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "10px",
          color: "#fff",
        }}
      >
        {getIconForType(icon)}
      </div>
      <span style={{ fontSize: "12px", color: "#6b7280" }}>{label}</span>
    </div>
  );
}

export default MemberTimelineDemo;
