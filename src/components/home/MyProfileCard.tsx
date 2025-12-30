/**
 * MyProfileCard - Profile summary with edit link
 *
 * Displays a compact profile summary and link to edit profile.
 * Part of the "My SBNC" member home page utility column.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

"use client";

import Link from "next/link";
import SectionCard from "@/components/layout/SectionCard";

interface MyProfileCardProps {
  /** Member's first name */
  firstName?: string;
  /** Member's last name */
  lastName?: string;
  /** Member's email */
  email?: string;
  /** Membership status label */
  membershipStatus?: string;
  /** Membership tier name (e.g., "Newbie Member", "Extended Member") */
  membershipTier?: string;
  /** Member since year */
  memberSince?: string;
}

export default function MyProfileCard({
  firstName,
  lastName,
  email,
  membershipStatus,
  membershipTier,
  memberSince,
}: MyProfileCardProps) {
  // Show loading skeleton when no data is available
  const isLoading = !firstName && !email;
  const displayName = firstName || "Member";
  const displayLastName = lastName || "";
  const fullName = displayLastName ? `${displayName} ${displayLastName}` : displayName;

  if (isLoading) {
    return (
      <SectionCard title="My Profile" testId="my-profile-card">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--token-space-sm)" }}>
          {/* Avatar and name skeleton */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--token-space-md)" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "var(--token-color-surface-2)",
                animation: "pulse 1.5s ease-in-out infinite",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  width: "120px",
                  height: "20px",
                  backgroundColor: "var(--token-color-surface-2)",
                  borderRadius: "var(--token-radius-lg)",
                  marginBottom: "var(--token-space-xs)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  width: "160px",
                  height: "14px",
                  backgroundColor: "var(--token-color-surface-2)",
                  borderRadius: "var(--token-radius-lg)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            </div>
          </div>
          {/* Status row skeleton */}
          <div
            style={{
              height: "40px",
              backgroundColor: "var(--token-color-surface-2)",
              borderRadius: "var(--token-radius-lg)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="My Profile"
      testId="my-profile-card"
      headerActions={
        <Link
          href="/my/profile"
          style={{
            fontSize: "var(--token-text-sm)",
            color: "var(--token-color-primary)",
            textDecoration: "none",
          }}
        >
          Edit
        </Link>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--token-space-sm)" }}>
        {/* Name and avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--token-space-md)" }}>
          {/* Avatar circle with initials */}
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "var(--token-color-primary)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--token-text-lg)",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {displayName.charAt(0).toUpperCase()}
            {displayLastName ? displayLastName.charAt(0).toUpperCase() : ""}
          </div>
          <div>
            <div
              data-test-id="profile-name"
              style={{
                fontSize: "var(--token-text-lg)",
                fontWeight: 600,
                color: "var(--token-color-text)",
              }}
            >
              {fullName}
            </div>
            {email && (
              <div
                data-test-id="profile-email"
                style={{
                  fontSize: "var(--token-text-sm)",
                  color: "var(--token-color-text-muted)",
                }}
              >
                {email}
              </div>
            )}
          </div>
        </div>

        {/* Status row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "var(--token-space-sm)",
            backgroundColor: "var(--token-color-surface-2)",
            borderRadius: "var(--token-radius-lg)",
            flexWrap: "wrap",
            gap: "var(--token-space-xs)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--token-space-sm)", flexWrap: "wrap" }}>
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
            {membershipTier && (
              <span
                data-test-id="profile-tier"
                style={{
                  fontSize: "var(--token-text-xs)",
                  color: "var(--token-color-text-muted)",
                  backgroundColor: "var(--token-color-surface)",
                  padding: "2px 6px",
                  borderRadius: "var(--token-radius-lg)",
                  border: "1px solid var(--token-color-border)",
                }}
              >
                {membershipTier}
              </span>
            )}
          </div>
          {membershipStatus && (
            <span
              data-test-id="profile-status"
              style={{
                display: "inline-block",
                padding: "2px 8px",
                backgroundColor: "#dcfce7",
                color: "var(--token-color-success)",
                borderRadius: "var(--token-radius-lg)",
                fontSize: "var(--token-text-sm)",
                fontWeight: 600,
              }}
            >
              {membershipStatus}
            </span>
          )}
        </div>

        {/* Edit profile link */}
        <Link
          href="/my/profile"
          data-test-id="edit-profile-link"
          style={{
            display: "block",
            textAlign: "center",
            padding: "var(--token-space-sm)",
            backgroundColor: "var(--token-color-surface-2)",
            border: "1px solid var(--token-color-border)",
            borderRadius: "var(--token-radius-lg)",
            color: "var(--token-color-text)",
            textDecoration: "none",
            fontSize: "var(--token-text-sm)",
            fontWeight: 500,
          }}
        >
          View & Edit Profile
        </Link>
      </div>
    </SectionCard>
  );
}
