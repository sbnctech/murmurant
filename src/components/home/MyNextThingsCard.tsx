/**
 * MyNextThingsCard - Shows member's upcoming activities and deadlines
 *
 * Displays a prioritized list of what the member needs to do or attend.
 * Part of the "My SBNC" member home page utility column.
 *
 * Fetches real data from /api/v1/me/registrations for upcoming events.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SectionCard from "@/components/layout/SectionCard";
import { formatClubDate } from "@/lib/timezone";

interface NextThing {
  id: string;
  type: "event" | "renewal" | "action";
  title: string;
  date?: string;
  urgency: "normal" | "soon" | "urgent";
  href?: string;
}

interface RegistrationFromAPI {
  id: string;
  status: string;
  event: {
    id: string;
    title: string;
    startTime: string;
    location: string | null;
  };
}

const urgencyColors: Record<string, string> = {
  normal: "var(--token-color-text-muted)",
  soon: "var(--token-color-warning)",
  urgent: "var(--token-color-danger)",
};

const typeIcons: Record<string, string> = {
  event: "\u{1F4C5}", // calendar
  renewal: "\u{1F4B3}", // credit card
  action: "\u{2705}", // check mark
};

function getUrgencyForDate(dateString: string): "normal" | "soon" | "urgent" {
  const eventDate = new Date(dateString);
  const now = new Date();
  const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil <= 2) return "urgent";
  if (daysUntil <= 7) return "soon";
  return "normal";
}

export default function MyNextThingsCard() {
  const [nextThings, setNextThings] = useState<NextThing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNextThings() {
      try {
        // Fetch member's registrations
        const response = await fetch("/api/v1/me/registrations");
        if (response.status === 401) {
          // Not logged in - show empty
          setNextThings([]);
          return;
        }
        if (!response.ok) throw new Error("Failed to load");

        const data = await response.json();
        const registrations: RegistrationFromAPI[] = data.registrations || [];

        // Filter and transform to NextThing format
        // API already filters to upcoming + non-cancelled
        const upcomingEvents: NextThing[] = registrations
          .slice(0, 3)
          .map((r) => ({
            id: r.id,
            type: "event" as const,
            title: r.event.title,
            date: formatClubDate(new Date(r.event.startTime)),
            urgency: getUrgencyForDate(r.event.startTime),
            href: `/events/${r.event.id}`,
          }));

        setNextThings(upcomingEvents);
      } catch {
        // Silent fail - show empty state
        setNextThings([]);
      } finally {
        setLoading(false);
      }
    }
    fetchNextThings();
  }, []);

  return (
    <SectionCard
      title="My Next Things"
      testId="my-next-things-card"
    >
      {loading ? (
        <p style={{ color: "var(--token-color-text-muted)", margin: 0 }}>
          Loading...
        </p>
      ) : nextThings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "var(--token-space-sm) 0" }}>
          <p
            style={{
              color: "var(--token-color-text-muted)",
              fontStyle: "italic",
              margin: 0,
            }}
          >
            Nothing coming up yet
          </p>
          <Link
            href="/events"
            style={{
              display: "inline-block",
              marginTop: "var(--token-space-sm)",
              color: "var(--token-color-primary)",
              fontSize: "var(--token-text-sm)",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Browse events →
          </Link>
        </div>
      ) : (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {nextThings.map((item) => (
            <li
              key={item.id}
              data-test-id={`next-thing-${item.id}`}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--token-space-sm)",
                padding: "var(--token-space-sm) 0",
                borderBottom: "1px solid var(--token-color-border)",
              }}
            >
              <span style={{ fontSize: "1.2em" }}>{typeIcons[item.type]}</span>
              <div style={{ flex: 1 }}>
                {item.href ? (
                  <Link
                    href={item.href}
                    style={{
                      fontWeight: 500,
                      color: "var(--token-color-text)",
                      textDecoration: "none",
                    }}
                  >
                    {item.title}
                  </Link>
                ) : (
                  <div
                    style={{
                      fontWeight: 500,
                      color: "var(--token-color-text)",
                    }}
                  >
                    {item.title}
                  </div>
                )}
                {item.date && (
                  <div
                    style={{
                      fontSize: "var(--token-text-sm)",
                      color: urgencyColors[item.urgency],
                    }}
                  >
                    {item.date}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
