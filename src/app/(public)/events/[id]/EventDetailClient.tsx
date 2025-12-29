"use client";

/**
 * EventDetailClient - Interactive event detail display
 *
 * Client component for event detail page.
 * Includes ICS download and registration stub.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { useState } from "react";
import Link from "next/link";
import { formatClubDateLong, formatClubTime } from "@/lib/timezone";

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
  // Registration scheduling
  requiresRegistration?: boolean;
  registrationOpensAt?: string | null;
  registrationState?: "NOT_REQUIRED" | "SCHEDULED" | "OPEN" | "CLOSED";
  registrationOpensMessage?: string | null;
}

interface EventDetailClientProps {
  event: EventDetail;
}

export default function EventDetailClient({ event }: EventDetailClientProps) {
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatClubDateLong(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return formatClubTime(date);
  };

  const isPast = new Date(event.startTime) < new Date();

  const getStatusBadge = () => {
    if (isPast) {
      return { text: "Past Event", color: "var(--token-color-text-muted)", bg: "var(--token-color-surface-2)" };
    }
    // Handle registration scheduling states
    if (event.registrationState === "SCHEDULED") {
      return { text: "Coming Soon", color: "var(--token-color-primary)", bg: "var(--token-color-primary-bg)" };
    }
    if (event.registrationState === "CLOSED") {
      return { text: "Registration Closed", color: "var(--token-color-text-muted)", bg: "var(--token-color-surface-2)" };
    }
    if (event.registrationState === "NOT_REQUIRED") {
      return { text: "No Registration Required", color: "var(--token-color-info)", bg: "var(--token-color-info-bg)" };
    }
    // Registration is OPEN - show availability status
    if (event.isWaitlistOpen) {
      return { text: "Waitlist Open", color: "var(--token-color-warning)", bg: "var(--token-color-warning-bg)" };
    }
    if (event.spotsRemaining !== null && event.spotsRemaining <= 5) {
      return { text: `Only ${event.spotsRemaining} spots left!`, color: "var(--token-color-danger)", bg: "var(--token-color-danger-bg)" };
    }
    return { text: "Registration Open", color: "var(--token-color-success)", bg: "var(--token-color-success-bg)" };
  };

  const generateICS = () => {
    const start = new Date(event.startTime);
    const end = event.endTime ? new Date(event.endTime) : new Date(start.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Santa Barbara Newcomers Club//Murmurant//EN",
      "BEGIN:VEVENT",
      `UID:${event.id}@sbnc.murmurant`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(start)}`,
      `DTEND:${formatICSDate(end)}`,
      `SUMMARY:${event.title.replace(/,/g, "\\,")}`,
      event.description ? `DESCRIPTION:${event.description.replace(/\n/g, "\\n").replace(/,/g, "\\,")}` : "",
      event.location ? `LOCATION:${event.location.replace(/,/g, "\\,")}` : "",
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, "_")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const status = getStatusBadge();

  return (
    <>
      <main
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "var(--token-space-lg) var(--token-space-md)",
        }}
      >
        {/* Breadcrumb */}
        <nav
          style={{
            marginBottom: "var(--token-space-md)",
            fontSize: "var(--token-text-sm)",
          }}
        >
          <Link
            href="/events"
            style={{
              color: "var(--token-color-text-muted)",
              textDecoration: "none",
            }}
          >
            Events
          </Link>
          <span style={{ color: "var(--token-color-text-muted)", margin: "0 8px" }}>/</span>
          <span style={{ color: "var(--token-color-text)" }}>{event.title}</span>
        </nav>

        {/* Category Badge */}
        <div style={{ marginBottom: "var(--token-space-sm)" }}>
          {event.category && (
            <span
              style={{
                fontSize: "var(--token-text-xs)",
                color: "var(--token-color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              {event.category}
            </span>
          )}
        </div>

        {/* Title */}
        <h1
          data-test-id="event-title"
          style={{
            fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
            fontWeight: 700,
            marginTop: 0,
            marginBottom: "var(--token-space-md)",
            color: "var(--token-color-text)",
          }}
        >
          {event.title}
        </h1>

        {/* Status Badge */}
        <div style={{ marginBottom: "var(--token-space-lg)" }}>
          <span
            data-test-id="event-status"
            style={{
              display: "inline-block",
              fontSize: "var(--token-text-sm)",
              fontWeight: 600,
              color: status.color,
              backgroundColor: status.bg,
              padding: "6px 16px",
              borderRadius: "20px",
            }}
          >
            {status.text}
          </span>
        </div>

        {/* Event Info Card */}
        <div
          style={{
            backgroundColor: "var(--token-color-surface)",
            border: "1px solid var(--token-color-border)",
            borderRadius: "var(--token-radius-lg)",
            padding: "var(--token-space-lg)",
            marginBottom: "var(--token-space-lg)",
          }}
        >
          {/* Date and Time */}
          <div style={{ marginBottom: "var(--token-space-md)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--token-space-sm)",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--token-color-primary)"
                strokeWidth="2"
                style={{ flexShrink: 0, marginTop: "2px" }}
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <div>
                <p
                  data-test-id="event-date"
                  style={{
                    fontSize: "var(--token-text-base)",
                    fontWeight: 600,
                    color: "var(--token-color-text)",
                    margin: 0,
                  }}
                >
                  {formatDate(event.startTime)}
                </p>
                <p
                  data-test-id="event-time"
                  style={{
                    fontSize: "var(--token-text-sm)",
                    color: "var(--token-color-text-muted)",
                    margin: 0,
                  }}
                >
                  {formatTime(event.startTime)}
                  {event.endTime && ` - ${formatTime(event.endTime)}`}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div style={{ marginBottom: "var(--token-space-md)" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--token-space-sm)",
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--token-color-primary)"
                  strokeWidth="2"
                  style={{ flexShrink: 0, marginTop: "2px" }}
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <p
                  data-test-id="event-location"
                  style={{
                    fontSize: "var(--token-text-base)",
                    color: "var(--token-color-text)",
                    margin: 0,
                  }}
                >
                  {event.location}
                </p>
              </div>
            </div>
          )}

          {/* Capacity */}
          {event.capacity !== null && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--token-space-sm)",
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--token-color-primary)"
                  strokeWidth="2"
                  style={{ flexShrink: 0, marginTop: "2px" }}
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <div>
                  <p
                    data-test-id="event-capacity"
                    style={{
                      fontSize: "var(--token-text-base)",
                      color: "var(--token-color-text)",
                      margin: 0,
                    }}
                  >
                    {event.registeredCount} / {event.capacity} registered
                  </p>
                  {event.spotsRemaining !== null && event.spotsRemaining > 0 && (
                    <p
                      style={{
                        fontSize: "var(--token-text-sm)",
                        color: "var(--token-color-text-muted)",
                        margin: 0,
                      }}
                    >
                      {event.spotsRemaining} spots remaining
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <div style={{ marginBottom: "var(--token-space-lg)" }}>
            <h2
              style={{
                fontSize: "var(--token-text-lg)",
                fontWeight: 600,
                marginTop: 0,
                marginBottom: "var(--token-space-sm)",
                color: "var(--token-color-text)",
              }}
            >
              About this event
            </h2>
            <div
              data-test-id="event-description"
              style={{
                fontSize: "var(--token-text-base)",
                color: "var(--token-color-text)",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {event.description}
            </div>
          </div>
        )}

        {/* Event Chair */}
        {event.eventChair && (
          <div style={{ marginBottom: "var(--token-space-lg)" }}>
            <h2
              style={{
                fontSize: "var(--token-text-lg)",
                fontWeight: 600,
                marginTop: 0,
                marginBottom: "var(--token-space-sm)",
                color: "var(--token-color-text)",
              }}
            >
              Event Chair
            </h2>
            <p
              data-test-id="event-chair"
              style={{
                fontSize: "var(--token-text-base)",
                color: "var(--token-color-text)",
                margin: 0,
              }}
            >
              {event.eventChair.name}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--token-space-sm)",
            marginTop: "var(--token-space-lg)",
          }}
        >
          {/* Registration Opens Message - shown when registration is scheduled but not open */}
          {!isPast && event.registrationState === "SCHEDULED" && event.registrationOpensMessage && (
            <div
              data-test-id="registration-opens-message"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--token-space-xs)",
                padding: "var(--token-space-sm) var(--token-space-lg)",
                backgroundColor: "var(--token-color-info-bg)",
                color: "var(--token-color-info)",
                borderRadius: "var(--token-radius-lg)",
                fontSize: "var(--token-text-base)",
                fontWeight: 500,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
              {event.registrationOpensMessage}
            </div>
          )}

          {/* Register Button - shown when registration is open */}
          {!isPast && event.registrationState === "OPEN" && (
            <button
              onClick={() => setShowRegistrationModal(true)}
              data-test-id="event-register-button"
              style={{
                padding: "var(--token-space-sm) var(--token-space-lg)",
                backgroundColor: "var(--token-color-primary)",
                color: "white",
                border: "none",
                borderRadius: "var(--token-radius-lg)",
                fontSize: "var(--token-text-base)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {event.isWaitlistOpen ? "Join Waitlist" : "Register"}
            </button>
          )}

          {/* Legacy: Show register button if registrationState not provided (backwards compat) */}
          {!isPast && event.registrationState === undefined && (
            <button
              onClick={() => setShowRegistrationModal(true)}
              data-test-id="event-register-button"
              style={{
                padding: "var(--token-space-sm) var(--token-space-lg)",
                backgroundColor: "var(--token-color-primary)",
                color: "white",
                border: "none",
                borderRadius: "var(--token-radius-lg)",
                fontSize: "var(--token-text-base)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {event.isWaitlistOpen ? "Join Waitlist" : "Register"}
            </button>
          )}

          {/* Add to Calendar Button */}
          <button
            onClick={generateICS}
            data-test-id="event-add-to-calendar"
            style={{
              padding: "var(--token-space-sm) var(--token-space-lg)",
              backgroundColor: "var(--token-color-surface)",
              color: "var(--token-color-text)",
              border: "1px solid var(--token-color-border)",
              borderRadius: "var(--token-radius-lg)",
              fontSize: "var(--token-text-base)",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "var(--token-space-xs)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <line x1="12" y1="14" x2="12" y2="18" />
              <line x1="10" y1="16" x2="14" y2="16" />
            </svg>
            Add to Calendar
          </button>

          {/* Back to Events */}
          <Link
            href="/events"
            style={{
              padding: "var(--token-space-sm) var(--token-space-lg)",
              backgroundColor: "transparent",
              color: "var(--token-color-text-muted)",
              border: "1px solid var(--token-color-border)",
              borderRadius: "var(--token-radius-lg)",
              fontSize: "var(--token-text-base)",
              textDecoration: "none",
            }}
          >
            Back to Events
          </Link>
        </div>
      </main>

      {/* Registration Modal (Stub) */}
      {showRegistrationModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowRegistrationModal(false)}
        >
          <div
            data-test-id="registration-modal"
            style={{
              backgroundColor: "var(--token-color-surface)",
              borderRadius: "var(--token-radius-lg)",
              padding: "var(--token-space-xl)",
              maxWidth: "400px",
              width: "90%",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: "var(--token-text-xl)",
                fontWeight: 600,
                marginTop: 0,
                marginBottom: "var(--token-space-md)",
              }}
            >
              Registration Coming Soon
            </h2>
            <p
              style={{
                fontSize: "var(--token-text-base)",
                color: "var(--token-color-text-muted)",
                marginBottom: "var(--token-space-lg)",
              }}
            >
              Online event registration is not yet available. Please contact the event chair or check the club newsletter for registration details.
            </p>
            <button
              onClick={() => setShowRegistrationModal(false)}
              style={{
                padding: "var(--token-space-sm) var(--token-space-lg)",
                backgroundColor: "var(--token-color-primary)",
                color: "white",
                border: "none",
                borderRadius: "var(--token-radius-lg)",
                fontSize: "var(--token-text-base)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
