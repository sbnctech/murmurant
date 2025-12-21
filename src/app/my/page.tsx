/**
 * My SBNC - Member Home Page
 *
 * URL: /my
 *
 * Two-column layout for authenticated members:
 * - Left column: Utility-first (My Next Things, Membership, My Roles)
 * - Right column: Curated content (Photos, News, Highlights)
 *
 * Role-aware gadgets appear based on viewer context.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import Link from "next/link";
import { Stripe } from "@/components/sections";
import { ViewAsControl } from "@/components/view-as";
import { getViewContext } from "@/lib/view-context";
import { getCurrentSession } from "@/lib/passkey";
import { prisma } from "@/lib/prisma";
import { getClubHour } from "@/lib/timezone";
import type { GlobalRole } from "@/lib/auth";
import { MySBNCContent } from "./MySBNCContent";

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get a time-of-day appropriate greeting.
 * Uses club timezone (Santa Barbara / Pacific).
 */
function getGreeting(): string {
  const hour = getClubHour();

  if (hour >= 5 && hour < 12) {
    return "Good morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good afternoon";
  } else {
    return "Good evening";
  }
}

// ============================================================================
// My SBNC Page (Server Component)
// ============================================================================

export default async function MySBNCPage() {
  const viewContext = await getViewContext();

  // Determine the effective role for rendering
  // In simulated mode, use the simulated role; otherwise would use actual user role
  const effectiveRole: GlobalRole = viewContext.simulatedRole || "member";

  // If viewing as public, redirect or show limited content
  if (viewContext.mode === "public") {
    return <PublicViewMessage />;
  }

  // Get member's first name for personalized greeting
  let firstName: string | null = null;
  const session = await getCurrentSession();
  if (session) {
    const member = await prisma.member.findUnique({
      where: { id: session.memberId },
      select: { firstName: true },
    });
    firstName = member?.firstName || null;
  }

  const greeting = getGreeting();

  return (
    <div data-test-id="my-sbnc-page">
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: viewContext.isSimulated ? "32px" : 0,
          zIndex: 100,
          backgroundColor: "var(--token-color-surface)",
          borderBottom: "1px solid var(--token-color-border)",
          padding: "var(--token-space-sm) var(--token-space-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: "var(--token-text-lg)",
            fontWeight: 700,
            color: "var(--token-color-text)",
            textDecoration: "none",
          }}
        >
          SBNC
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: "var(--token-space-md)" }}>
          <Link
            href="/my"
            style={{
              fontSize: "var(--token-text-sm)",
              color: "var(--token-color-primary)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            My SBNC
          </Link>
          <Link
            href="/events"
            style={{
              fontSize: "var(--token-text-sm)",
              color: "var(--token-color-text-muted)",
              textDecoration: "none",
            }}
          >
            Events
          </Link>
          <Link
            href="/member/directory"
            style={{
              fontSize: "var(--token-text-sm)",
              color: "var(--token-color-text-muted)",
              textDecoration: "none",
            }}
          >
            Directory
          </Link>
          <ViewAsControl />
        </nav>
      </header>

      {/* Page Title with Personalized Greeting */}
      <Stripe padding="md" testId="my-sbnc-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1
              data-test-id="my-sbnc-greeting"
              style={{
                fontSize: "var(--token-text-2xl)",
                fontWeight: "var(--token-weight-bold)",
                color: "var(--token-color-text)",
                margin: 0,
              }}
            >
              {firstName ? `${greeting}, ${firstName}` : greeting}
            </h1>
            <p
              style={{
                fontSize: "var(--token-text-sm)",
                color: "var(--token-color-text-muted)",
                margin: "var(--token-space-xs) 0 0 0",
              }}
            >
              Welcome to your member dashboard
            </p>
          </div>
          {/* Quick action for officers */}
          {effectiveRole !== "member" && (
            <Link
              href="/admin"
              data-test-id="admin-quick-link"
              style={{
                padding: "var(--token-space-xs) var(--token-space-md)",
                backgroundColor: "var(--token-color-surface-2)",
                border: "1px solid var(--token-color-border)",
                borderRadius: "var(--token-radius-lg)",
                fontSize: "var(--token-text-sm)",
                color: "var(--token-color-text)",
                textDecoration: "none",
              }}
            >
              Admin Dashboard
            </Link>
          )}
        </div>
      </Stripe>

      {/* Main Content - Two Column Layout */}
      <MySBNCContent effectiveRole={effectiveRole} />
    </div>
  );
}

// ============================================================================
// Public View Message
// ============================================================================

function PublicViewMessage() {
  return (
    <div
      data-test-id="public-view-message"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--token-color-surface-2)",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--token-color-surface)",
          padding: "var(--token-space-lg)",
          borderRadius: "var(--token-radius-lg)",
          border: "1px solid var(--token-color-border)",
          textAlign: "center",
          maxWidth: "400px",
        }}
      >
        <h2
          style={{
            fontSize: "var(--token-text-xl)",
            fontWeight: 600,
            color: "var(--token-color-text)",
            marginTop: 0,
          }}
        >
          Members Only
        </h2>
        <p
          style={{
            color: "var(--token-color-text-muted)",
            marginBottom: "var(--token-space-md)",
          }}
        >
          This page is only available to SBNC members. Switch your view or sign in to continue.
        </p>
        <div style={{ display: "flex", gap: "var(--token-space-sm)", justifyContent: "center" }}>
          <Link
            href="/login"
            style={{
              padding: "var(--token-space-sm) var(--token-space-md)",
              backgroundColor: "var(--token-color-primary)",
              color: "#fff",
              borderRadius: "var(--token-radius-lg)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Sign In
          </Link>
          <Link
            href="/"
            style={{
              padding: "var(--token-space-sm) var(--token-space-md)",
              backgroundColor: "var(--token-color-surface-2)",
              color: "var(--token-color-text)",
              border: "1px solid var(--token-color-border)",
              borderRadius: "var(--token-radius-lg)",
              textDecoration: "none",
            }}
          >
            Back to Home
          </Link>
        </div>
        <div style={{ marginTop: "var(--token-space-md)" }}>
          <ViewAsControl />
        </div>
      </div>
    </div>
  );
}
