"use client";

/**
 * CommitteeDashboard - Committee Chair management dashboard
 *
 * Provides committee chairs with tools to manage their committee:
 * - View committee members with photos
 * - Track upcoming committee events
 * - Monitor member participation stats
 * - Quick actions for adding members
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import React, { useState } from "react";

interface CommitteeMember {
  id: string;
  name: string;
  role: "chair" | "co-chair" | "member";
  photoUrl: string | null;
  email: string;
  joinedCommittee: string;
  eventsAttended: number;
  lastActive: string;
}

interface CommitteeEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  rsvpCount: number;
  capacity: number | null;
}

interface ParticipationStat {
  label: string;
  value: number;
  change: number;
  trend: "up" | "down" | "stable";
}

const SAMPLE_MEMBERS: CommitteeMember[] = [
  {
    id: "m1",
    name: "Sarah Johnson",
    role: "chair",
    photoUrl: null,
    email: "sarah.johnson@example.com",
    joinedCommittee: "Jan 2022",
    eventsAttended: 24,
    lastActive: "Today",
  },
  {
    id: "m2",
    name: "Michael Chen",
    role: "co-chair",
    photoUrl: null,
    email: "michael.chen@example.com",
    joinedCommittee: "Mar 2022",
    eventsAttended: 18,
    lastActive: "Yesterday",
  },
  {
    id: "m3",
    name: "Emily Rodriguez",
    role: "member",
    photoUrl: null,
    email: "emily.r@example.com",
    joinedCommittee: "Sep 2023",
    eventsAttended: 8,
    lastActive: "3 days ago",
  },
  {
    id: "m4",
    name: "David Kim",
    role: "member",
    photoUrl: null,
    email: "david.kim@example.com",
    joinedCommittee: "Jan 2024",
    eventsAttended: 4,
    lastActive: "1 week ago",
  },
  {
    id: "m5",
    name: "Lisa Thompson",
    role: "member",
    photoUrl: null,
    email: "lisa.t@example.com",
    joinedCommittee: "Jun 2024",
    eventsAttended: 2,
    lastActive: "2 days ago",
  },
];

const SAMPLE_EVENTS: CommitteeEvent[] = [
  {
    id: "e1",
    title: "Monthly Planning Meeting",
    date: "Jan 8, 2025",
    time: "10:00 AM",
    location: "Community Room A",
    rsvpCount: 4,
    capacity: null,
  },
  {
    id: "e2",
    title: "Wine & Dine: Italian Night",
    date: "Jan 15, 2025",
    time: "6:00 PM",
    location: "Bella Vista Restaurant",
    rsvpCount: 18,
    capacity: 24,
  },
  {
    id: "e3",
    title: "New Member Welcome",
    date: "Jan 22, 2025",
    time: "2:00 PM",
    location: "Member Lounge",
    rsvpCount: 12,
    capacity: 20,
  },
];

const PARTICIPATION_STATS: ParticipationStat[] = [
  { label: "Active Members", value: 5, change: 1, trend: "up" },
  { label: "Events This Month", value: 3, change: 0, trend: "stable" },
  { label: "Avg Attendance", value: 85, change: 5, trend: "up" },
  { label: "New Joiners (90d)", value: 2, change: -1, trend: "down" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getRoleBadgeColor(role: CommitteeMember["role"]): string {
  switch (role) {
    case "chair":
      return "#7c3aed";
    case "co-chair":
      return "#2563eb";
    case "member":
      return "#64748b";
  }
}

function getTrendIcon(trend: ParticipationStat["trend"]): string {
  switch (trend) {
    case "up":
      return "↑";
    case "down":
      return "↓";
    case "stable":
      return "→";
  }
}

function getTrendColor(trend: ParticipationStat["trend"]): string {
  switch (trend) {
    case "up":
      return "#22c55e";
    case "down":
      return "#ef4444";
    case "stable":
      return "#64748b";
  }
}

function StatCard({ stat }: { stat: ParticipationStat }) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "16px",
      }}
    >
      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
        {stat.label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
        <span style={{ fontSize: "28px", fontWeight: "600", color: "#1e293b" }}>
          {stat.value}
          {stat.label === "Avg Attendance" ? "%" : ""}
        </span>
        <span
          style={{
            fontSize: "12px",
            color: getTrendColor(stat.trend),
            fontWeight: "500",
          }}
        >
          {getTrendIcon(stat.trend)} {Math.abs(stat.change)}
        </span>
      </div>
    </div>
  );
}

function MemberRow({ member }: { member: CommitteeMember }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "12px 16px",
        borderBottom: "1px solid #e2e8f0",
        gap: "12px",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          backgroundColor: "#e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "14px",
          fontWeight: "600",
          color: "#64748b",
          flexShrink: 0,
        }}
      >
        {member.photoUrl ? (
          <img
            src={member.photoUrl}
            alt={member.name}
            style={{ width: "100%", height: "100%", borderRadius: "50%" }}
          />
        ) : (
          getInitials(member.name)
        )}
      </div>

      {/* Name and Role */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "2px",
          }}
        >
          <span
            style={{
              fontWeight: "500",
              color: "#1e293b",
              fontSize: "14px",
            }}
          >
            {member.name}
          </span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: "600",
              color: "#ffffff",
              backgroundColor: getRoleBadgeColor(member.role),
              padding: "2px 6px",
              borderRadius: "4px",
              textTransform: "uppercase",
            }}
          >
            {member.role}
          </span>
        </div>
        <div style={{ fontSize: "12px", color: "#64748b" }}>
          Joined {member.joinedCommittee}
        </div>
      </div>

      {/* Stats */}
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: "14px", fontWeight: "500", color: "#1e293b" }}>
          {member.eventsAttended} events
        </div>
        <div style={{ fontSize: "12px", color: "#64748b" }}>
          Active {member.lastActive}
        </div>
      </div>
    </div>
  );
}

function EventCard({ event }: { event: CommitteeEvent }) {
  const capacityText = event.capacity
    ? `${event.rsvpCount}/${event.capacity}`
    : `${event.rsvpCount} RSVPs`;

  const capacityPercent = event.capacity
    ? (event.rsvpCount / event.capacity) * 100
    : null;

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "8px",
        }}
      >
        <div>
          <div
            style={{ fontWeight: "600", color: "#1e293b", fontSize: "14px" }}
          >
            {event.title}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            {event.date} at {event.time}
          </div>
        </div>
        <div
          style={{
            fontSize: "12px",
            fontWeight: "500",
            color: capacityPercent && capacityPercent > 80 ? "#f59e0b" : "#22c55e",
          }}
        >
          {capacityText}
        </div>
      </div>
      <div style={{ fontSize: "12px", color: "#64748b" }}>
        📍 {event.location}
      </div>
      {capacityPercent !== null && (
        <div
          style={{
            marginTop: "8px",
            height: "4px",
            backgroundColor: "#e2e8f0",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min(capacityPercent, 100)}%`,
              backgroundColor:
                capacityPercent > 80 ? "#f59e0b" : "#22c55e",
              borderRadius: "2px",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function CommitteeDashboard() {
  const [showAddMember, setShowAddMember] = useState(false);

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "24px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#1e293b",
              margin: "0 0 4px 0",
            }}
          >
            Hospitality Committee
          </h2>
          <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>
            Welcome back, Sarah. Here&apos;s your committee overview.
          </p>
        </div>
        <button
          onClick={() => setShowAddMember(!showAddMember)}
          style={{
            backgroundColor: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            padding: "10px 16px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span style={{ fontSize: "16px" }}>+</span>
          Add Member
        </button>
      </div>

      {/* Add Member Form (toggled) */}
      {showAddMember && (
        <div
          style={{
            backgroundColor: "#f0f9ff",
            border: "1px solid #0ea5e9",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
          }}
        >
          <div style={{ fontWeight: "600", marginBottom: "12px", color: "#0369a1" }}>
            Add Committee Member
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search member name..."
              style={{
                flex: "1",
                minWidth: "200px",
                padding: "8px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
            <select
              style={{
                padding: "8px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "#ffffff",
              }}
            >
              <option value="member">Member</option>
              <option value="co-chair">Co-Chair</option>
            </select>
            <button
              style={{
                backgroundColor: "#22c55e",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              Add
            </button>
            <button
              onClick={() => setShowAddMember(false)}
              style={{
                backgroundColor: "#f1f5f9",
                color: "#64748b",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {PARTICIPATION_STATS.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
        }}
      >
        {/* Members List */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#1e293b",
                margin: 0,
              }}
            >
              Committee Members
            </h3>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              {SAMPLE_MEMBERS.length} members
            </span>
          </div>
          <div>
            {SAMPLE_MEMBERS.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#1e293b",
                margin: 0,
              }}
            >
              Upcoming Events
            </h3>
            <button
              style={{
                backgroundColor: "transparent",
                color: "#2563eb",
                border: "none",
                fontSize: "12px",
                fontWeight: "500",
                cursor: "pointer",
                padding: 0,
              }}
            >
              View All →
            </button>
          </div>
          {SAMPLE_EVENTS.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
}
