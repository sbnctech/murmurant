"use client";

/**
 * MemberWelcomeCard - Personalized greeting card for the member dashboard.
 *
 * Features:
 * - Personalized greeting with member's first name
 * - Time-of-day aware greeting (Good morning/afternoon/evening)
 * - Membership status and tier badges
 * - Member tenure display
 * - Upcoming registrations count
 * - Modern gradient styling
 */

import { useEffect, useState } from "react";

interface MemberProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  joinedAt: string;
  memberSince: string;
  membershipStatus: { code: string; label: string };
  membershipTier: { code: string; name: string } | null;
  upcomingRegistrations: number;
  globalRole: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getStatusColor(code: string): { bg: string; text: string; border: string } {
  switch (code) {
    case "active":
      return { bg: "#dcfce7", text: "#166534", border: "#86efac" };
    case "pending_new":
    case "pending_renewal":
      return { bg: "#fef9c3", text: "#854d0e", border: "#fde047" };
    case "lapsed":
      return { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" };
    default:
      return { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" };
  }
}

function getTierColor(code: string | undefined): { bg: string; text: string } {
  switch (code) {
    case "newbie_member":
      return { bg: "#dbeafe", text: "#1e40af" };
    case "member":
      return { bg: "#e0e7ff", text: "#3730a3" };
    case "extended_member":
      return { bg: "#f3e8ff", text: "#6b21a8" };
    case "admin":
    case "admins":
      return { bg: "#fce7f3", text: "#9d174d" };
    default:
      return { bg: "#f3f4f6", text: "#374151" };
  }
}

export default function MemberWelcomeCard() {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/v1/me");
        if (!res.ok) {
          if (res.status === 401) {
            setError("Please log in to view your dashboard");
          } else {
            setError("Failed to load profile");
          }
          return;
        }
        const data = await res.json();
        setProfile(data);
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div
        data-test-id="member-welcome-loading"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "16px",
          padding: "32px",
          marginBottom: "24px",
          minHeight: "140px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px" }}>
          Loading...
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div
        data-test-id="member-welcome-error"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "16px",
          padding: "32px",
          marginBottom: "24px",
        }}
      >
        <h1 style={{ color: "#fff", fontSize: "28px", margin: 0 }}>
          Welcome to ClubOS
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)", marginTop: "8px" }}>
          {error || "Your personalized dashboard is loading..."}
        </p>
      </div>
    );
  }

  const greeting = getGreeting();
  const statusColors = getStatusColor(profile.membershipStatus.code);
  const tierColors = getTierColor(profile.membershipTier?.code);

  return (
    <div
      data-test-id="member-welcome-card"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "16px",
        padding: "32px",
        marginBottom: "24px",
        boxShadow: "0 10px 40px rgba(102, 126, 234, 0.3)",
      }}
    >
      {/* Greeting Row */}
      <div style={{ marginBottom: "20px" }}>
        <h1
          data-test-id="member-greeting"
          style={{
            color: "#fff",
            fontSize: "32px",
            fontWeight: 700,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {greeting}, {profile.firstName}!
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.85)",
            fontSize: "16px",
            marginTop: "6px",
            marginBottom: 0,
          }}
        >
          Welcome back to your club dashboard
        </p>
      </div>

      {/* Info Row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
        }}
      >
        {/* Status Badge */}
        <div
          data-test-id="member-status-badge"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            borderRadius: "20px",
            backgroundColor: statusColors.bg,
            border: `1px solid ${statusColors.border}`,
            fontSize: "14px",
            fontWeight: 500,
            color: statusColors.text,
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: statusColors.text,
            }}
          />
          {profile.membershipStatus.label}
        </div>

        {/* Tier Badge */}
        {profile.membershipTier && (
          <div
            data-test-id="member-tier-badge"
            style={{
              display: "inline-block",
              padding: "6px 14px",
              borderRadius: "20px",
              backgroundColor: tierColors.bg,
              fontSize: "14px",
              fontWeight: 500,
              color: tierColors.text,
            }}
          >
            {profile.membershipTier.name}
          </div>
        )}

        {/* Tenure */}
        <div
          data-test-id="member-tenure"
          style={{
            display: "inline-block",
            padding: "6px 14px",
            borderRadius: "20px",
            backgroundColor: "rgba(255,255,255,0.2)",
            fontSize: "14px",
            fontWeight: 500,
            color: "#fff",
          }}
        >
          Member for {profile.memberSince}
        </div>
      </div>

      {/* Stats Row */}
      {profile.upcomingRegistrations > 0 && (
        <div
          style={{
            marginTop: "20px",
            padding: "12px 16px",
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: "12px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "24px" }}>📅</span>
          <span style={{ color: "#fff", fontSize: "15px" }}>
            You have{" "}
            <strong>
              {profile.upcomingRegistrations} upcoming event
              {profile.upcomingRegistrations !== 1 ? "s" : ""}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}
