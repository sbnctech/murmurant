/**
 * Event Detail Page
 *
 * URL: /events/:id
 *
 * Public page showing full event details.
 * Includes ICS calendar download and registration stub.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { getCurrentSession } from "@/lib/passkey";
import EventDetailClient from "./EventDetailClient";

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  location: string | null;
  startTime: string;
  endTime: string | null;
  capacity: number | null;
  isPublished: boolean;
  registeredCount: number;
  spotsRemaining: number | null;
  isWaitlistOpen: boolean;
  eventChair: {
    id: string;
    name: string;
  } | null;
  // Registration scheduling (SBNC policy: Sunday announce, Tuesday open)
  requiresRegistration: boolean;
  registrationOpensAt: string | null;
  registrationState: "NOT_REQUIRED" | "SCHEDULED" | "OPEN" | "CLOSED";
  registrationOpensMessage: string | null;
}

async function getEvent(id: string): Promise<EventDetail | null> {
  // Get the host from headers to build the full URL
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  try {
    const response = await fetch(`${protocol}://${host}/api/v1/events/${id}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.event;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    return {
      title: "Event Not Found | SBNC",
    };
  }

  return {
    title: `${event.title} | SBNC Events`,
    description: event.description || `Join us for ${event.title} at Santa Barbara Newcomers Club.`,
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, session] = await Promise.all([getEvent(id), getCurrentSession()]);
  const isLoggedIn = !!session;

  if (!event) {
    notFound();
  }

  return (
    <div data-test-id="event-detail-page">
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
              color: "var(--token-color-text-muted)",
              textDecoration: "none",
            }}
          >
            All Events
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

      {/* Main Content */}
      <EventDetailClient event={event} />

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
