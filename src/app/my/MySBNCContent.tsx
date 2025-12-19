/**
 * MySBNCContent - Client component for My SBNC page content
 *
 * Renders the two-column layout with role-aware gadgets.
 * This is a client component to handle interactive elements.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

"use client";

import Link from "next/link";
import { TwoColumnStripe } from "@/components/stripes";
import {
  MyNextThingsCard,
  MyRolesCard,
  MembershipStatusCard,
  MyProfileCard,
  PhotoStreamCard,
  ClubNewsCard,
  OfficerGadgetSelector,
} from "@/components/home";
import type { GlobalRole } from "@/lib/auth";

interface MySBNCContentProps {
  effectiveRole: GlobalRole;
}

export function MySBNCContent({ effectiveRole }: MySBNCContentProps) {
  const showOfficerGadgets = effectiveRole !== "member";

  return (
    <TwoColumnStripe
      testId="my-sbnc-content"
      padding="md"
      ratio="equal"
      gap="lg"
      left={
        <>
          {/* Utility Column - Dense, actionable content */}
          <MyProfileCard />
          <MyNextThingsCard />
          <MembershipStatusCard />

          {/* Role card only if user has a role */}
          {showOfficerGadgets && <MyRolesCard role={effectiveRole} />}

          {/* Role-specific officer gadget */}
          {showOfficerGadgets && <OfficerGadgetSelector role={effectiveRole} />}
        </>
      }
      right={
        <>
          {/* Curated Column - Social, engaging content */}
          <PhotoStreamCard />
          <ClubNewsCard />

          {/* Committees section (placeholder) */}
          <CommitteesCard />
        </>
      }
    />
  );
}

// ============================================================================
// Committees Card (placeholder)
// ============================================================================

function CommitteesCard() {
  return (
    <div
      data-test-id="committees-card"
      style={{
        backgroundColor: "var(--token-color-surface)",
        border: "1px solid var(--token-color-border)",
        borderRadius: "var(--token-radius-lg)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "var(--token-space-md)",
          borderBottom: "1px solid var(--token-color-border)",
        }}
      >
        <h2
          style={{
            fontSize: "var(--token-text-lg)",
            fontWeight: "var(--token-weight-semibold)",
            color: "var(--token-color-text)",
            margin: 0,
          }}
        >
          My Committees
        </h2>
      </div>
      <div style={{ padding: "var(--token-space-md)" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--token-space-sm)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--token-space-sm)",
              padding: "var(--token-space-sm)",
              backgroundColor: "var(--token-color-surface-2)",
              borderRadius: "var(--token-radius-lg)",
            }}
          >
            <span style={{ fontSize: "1.2em" }}>&#128218;</span>
            <span style={{ fontWeight: 500 }}>Book Club</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--token-space-sm)",
              padding: "var(--token-space-sm)",
              backgroundColor: "var(--token-color-surface-2)",
              borderRadius: "var(--token-radius-lg)",
            }}
          >
            <span style={{ fontSize: "1.2em" }}>&#127863;</span>
            <span style={{ fontWeight: 500 }}>Wine Enthusiasts</span>
          </div>
        </div>
        <Link
          href="/member/committees"
          style={{
            display: "block",
            textAlign: "center",
            padding: "var(--token-space-xs)",
            marginTop: "var(--token-space-sm)",
            color: "var(--token-color-primary)",
            fontSize: "var(--token-text-sm)",
            textDecoration: "none",
          }}
        >
          View All Committees
        </Link>
      </div>
    </div>
  );
}
