/**
 * MyProfileCard - Profile summary with edit link
 *
 * Displays a compact profile summary and link to edit profile.
 * Part of the "My SBNC" member home page utility column.
 *
 * Copyright (c) Santa Barbara Newcomers Club
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
  /** Member since year */
  memberSince?: string;
}

export default function MyProfileCard({
  firstName = "Member",
  lastName = "",
  email = "",
  membershipStatus = "Active",
  memberSince = "2023",
}: MyProfileCardProps) {
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;

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
        {/* Name and avatar placeholder */}
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
            {firstName.charAt(0).toUpperCase()}
            {lastName ? lastName.charAt(0).toUpperCase() : ""}
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
            <div
              data-test-id="profile-email"
              style={{
                fontSize: "var(--token-text-sm)",
                color: "var(--token-color-text-muted)",
              }}
            >
              {email}
            </div>
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
          }}
        >
          <span
            style={{
              fontSize: "var(--token-text-sm)",
              color: "var(--token-color-text-muted)",
            }}
          >
            Member since {memberSince}
          </span>
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
