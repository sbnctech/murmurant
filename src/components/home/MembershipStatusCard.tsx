/**
 * MembershipStatusCard - Shows membership status and alerts
 *
 * Displays renewal status, expiration warnings, and quick actions.
 * Part of the "My SBNC" member home page utility column.
 *
 * Fetches real data from /api/v1/me/profile.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SectionCard from "@/components/layout/SectionCard";

type MembershipStatusType = "active" | "expiring" | "expired" | "pending" | "lapsed";

interface ProfileFromAPI {
  membershipStatus: {
    code: string;
    label: string;
  };
  memberSince: string;
  joinedAt: string;
}

const statusConfig: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  type: MembershipStatusType;
}> = {
  active: {
    label: "Active",
    color: "var(--token-color-success)",
    bgColor: "#dcfce7",
    type: "active",
  },
  active_newbie: {
    label: "Active (Newbie)",
    color: "var(--token-color-success)",
    bgColor: "#dcfce7",
    type: "active",
  },
  active_extended: {
    label: "Active (Extended)",
    color: "var(--token-color-success)",
    bgColor: "#dcfce7",
    type: "active",
  },
  lapsed: {
    label: "Lapsed",
    color: "var(--token-color-danger)",
    bgColor: "#fee2e2",
    type: "lapsed",
  },
  pending_new: {
    label: "Pending Approval",
    color: "var(--token-color-warning)",
    bgColor: "#fef3c7",
    type: "pending",
  },
  suspended: {
    label: "Suspended",
    color: "var(--token-color-danger)",
    bgColor: "#fee2e2",
    type: "expired",
  },
  unknown: {
    label: "Unknown",
    color: "var(--token-color-text-muted)",
    bgColor: "#f3f4f6",
    type: "pending",
  },
};

const defaultConfig = {
  label: "Active",
  color: "var(--token-color-success)",
  bgColor: "#dcfce7",
  type: "active" as MembershipStatusType,
};

export default function MembershipStatusCard() {
  const [profile, setProfile] = useState<ProfileFromAPI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/v1/me/profile");
        if (response.status === 401) {
          setProfile(null);
          return;
        }
        if (!response.ok) throw new Error("Failed to load");
        const data = await response.json();
        setProfile(data.profile);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const statusCode = profile?.membershipStatus?.code || "active";
  const config = statusConfig[statusCode] || defaultConfig;
  const memberSince = profile?.memberSince || "";
  const showRenewButton = config.type === "lapsed" || config.type === "expired";

  return (
    <SectionCard
      title="Membership"
      testId="membership-status-card"
    >
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--token-space-sm)" }}>
          <div
            style={{
              width: "80px",
              height: "24px",
              backgroundColor: "var(--token-color-surface-2)",
              borderRadius: "var(--token-radius-lg)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          <div
            style={{
              width: "120px",
              height: "16px",
              backgroundColor: "var(--token-color-surface-2)",
              borderRadius: "var(--token-radius-lg)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--token-space-sm)" }}>
          {/* Status badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--token-space-sm)", flexWrap: "wrap" }}>
            <span
              data-test-id="membership-status-badge"
              style={{
                display: "inline-block",
                padding: "2px 8px",
                backgroundColor: config.bgColor,
                color: config.color,
                borderRadius: "var(--token-radius-lg)",
                fontSize: "var(--token-text-sm)",
                fontWeight: 600,
              }}
            >
              {config.label}
            </span>
            {memberSince && (
              <span
                style={{
                  fontSize: "var(--token-text-sm)",
                  color: "var(--token-color-text-muted)",
                }}
              >
                Member since {memberSince}
              </span>
            )}
          </div>

          {/* Status-specific messaging */}
          {config.type === "lapsed" && (
            <p
              style={{
                fontSize: "var(--token-text-sm)",
                color: "var(--token-color-text-muted)",
                margin: 0,
              }}
            >
              Your membership has lapsed. Renew to regain access to member benefits.
            </p>
          )}

          {config.type === "pending" && (
            <p
              style={{
                fontSize: "var(--token-text-sm)",
                color: "var(--token-color-text-muted)",
                margin: 0,
              }}
            >
              Your application is being reviewed. We&apos;ll be in touch soon!
            </p>
          )}

          {/* Renew button */}
          {showRenewButton && (
            <Link
              href="/member/renew"
              data-test-id="membership-renew-button"
              style={{
                display: "inline-block",
                padding: "var(--token-space-xs) var(--token-space-md)",
                backgroundColor: "var(--token-color-primary)",
                color: "#fff",
                borderRadius: "var(--token-radius-lg)",
                fontSize: "var(--token-text-sm)",
                textDecoration: "none",
                textAlign: "center",
                marginTop: "var(--token-space-xs)",
              }}
            >
              Renew Membership
            </Link>
          )}
        </div>
      )}
    </SectionCard>
  );
}
