/**
 * Events Discovery Page
 *
 * URL: /events
 *
 * Public page for browsing club events.
 * Shows upcoming events with filtering and search.
 * Works for both logged-in members and public visitors.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import Link from "next/link";
import { HeroStripe } from "@/components/stripes";
import { getCurrentSession } from "@/lib/passkey";
import EventsDiscovery from "./EventsDiscovery";

export const metadata = {
  title: "Events | Santa Barbara Newcomers Club",
  description: "Discover upcoming events and activities at Santa Barbara Newcomers Club.",
};

export default async function EventsPage() {
  const session = await getCurrentSession();
  const isLoggedIn = !!session;

  return (
    <div data-test-id="events-page">
      {/* Header */}
      <header
        style={{
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
        <nav style={{ display: "flex", gap: "var(--token-space-md)" }}>
          {isLoggedIn && (
            <Link
              href="/my"
              style={{
                fontSize: "var(--token-text-sm)",
                color: "var(--token-color-text-muted)",
                textDecoration: "none",
              }}
            >
              My SBNC
            </Link>
          )}
          <Link
            href="/events"
            style={{
              fontSize: "var(--token-text-sm)",
              color: "var(--token-color-primary)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Events
          </Link>
          {!isLoggedIn && (
            <Link
              href="/login"
              style={{
                fontSize: "var(--token-text-sm)",
                color: "var(--token-color-text-muted)",
                textDecoration: "none",
              }}
            >
              Sign In
            </Link>
          )}
        </nav>
      </header>

      {/* Hero */}
      <HeroStripe
        testId="events-hero"
        title="Club Events"
        description="Join us for social gatherings, outdoor adventures, cultural experiences, and more. There is something for everyone at SBNC."
        background="primary-gradient"
      />

      {/* Events Discovery Section */}
      <EventsDiscovery />

      {/* Footer */}
      <footer
        style={{
          backgroundColor: "#111827",
          color: "#9ca3af",
          padding: "var(--token-space-lg) var(--token-space-md)",
          textAlign: "center",
          fontSize: "var(--token-text-sm)",
        }}
      >
        <p style={{ margin: 0 }}>Santa Barbara Newcomers Club</p>
      </footer>
    </div>
  );
}
