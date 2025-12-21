/**
 * MySBNCContent - Member Home Page Content
 *
 * Smart, personal member dashboard with:
 * - Side-by-side panel layout (events left, actions right)
 * - Your Upcoming Events with countdown
 * - Events You Might Like (category-based recommendations)
 * - Status-aware messaging for member tiers
 * - Quick actions with context
 *
 * Layout: Fast, scannable, no hero images blocking content.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Section } from "@/components/sections";
import { OfficerGadgetSelector } from "@/components/home";
import { formatClubDate } from "@/lib/timezone";
import type { GlobalRole } from "@/lib/auth";

interface MySBNCContentProps {
  effectiveRole: GlobalRole;
}

// ============================================================================
// Main Component
// ============================================================================

export function MySBNCContent({ effectiveRole }: MySBNCContentProps) {
  const showOfficerGadgets = effectiveRole !== "member";

  return (
    <>
      {/* Main Content: Side-by-Side Panels */}
      <Section padding="md" testId="main-content-stripe">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: "var(--token-space-lg)",
            alignItems: "start",
          }}
          className="my-sbnc-grid"
        >
          {/* Left Panel: Events */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--token-space-lg)" }}>
            <UpcomingEventsPanel />
            <RecommendedEventsPanel />
          </div>

          {/* Right Panel: Quick Actions & Status */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--token-space-md)" }}>
            <QuickActionsPanel />
            <MemberStatusPanel />
            <CommitteesPanel />
          </div>
        </div>
      </Section>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 900px) {
          .my-sbnc-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Officer Section (if applicable) */}
      {showOfficerGadgets && (
        <Section padding="md" background="muted" testId="officer-section">
          <div style={{ maxWidth: "800px" }}>
            <h2
              style={{
                fontSize: "var(--token-text-lg)",
                fontWeight: 600,
                color: "var(--token-color-text)",
                marginTop: 0,
                marginBottom: "var(--token-space-md)",
              }}
            >
              Officer Tools
            </h2>
            <OfficerGadgetSelector role={effectiveRole} />
          </div>
        </Section>
      )}
    </>
  );
}

// ============================================================================
// Upcoming Events Panel
// ============================================================================

interface Registration {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  status: string;
  isPast: boolean;
  waitlistPosition?: number;
}

function UpcomingEventsPanel() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRegistrations() {
      try {
        const res = await fetch("/api/v1/me/registrations");
        if (!res.ok) {
          setRegistrations([]);
          return;
        }
        const data = await res.json();
        const upcoming = (data.registrations || [])
          .filter((r: Registration) => !r.isPast && r.status !== "CANCELLED")
          .slice(0, 4);
        setRegistrations(upcoming);
      } catch {
        setRegistrations([]);
      } finally {
        setLoading(false);
      }
    }
    fetchRegistrations();
  }, []);

  return (
    <div data-test-id="upcoming-events-panel">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--token-space-sm)",
        }}
      >
        <h2
          style={{
            fontSize: "var(--token-text-lg)",
            fontWeight: 600,
            color: "var(--token-color-text)",
            margin: 0,
          }}
        >
          Your Upcoming Events
        </h2>
        <Link
          href="/events"
          style={{
            fontSize: "var(--token-text-sm)",
            color: "var(--token-color-primary)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Browse all →
        </Link>
      </div>

      {loading ? (
        <div style={{ display: "flex", gap: "var(--token-space-md)" }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: "90px",
                backgroundColor: "var(--token-color-surface-2)",
                borderRadius: "var(--token-radius-lg)",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      ) : registrations.length === 0 ? (
        <EmptyEventsState />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "var(--token-space-md)",
          }}
        >
          {registrations.map((reg) => (
            <EventCard key={reg.id} registration={reg} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyEventsState() {
  return (
    <div
      style={{
        padding: "var(--token-space-lg)",
        backgroundColor: "var(--token-color-surface-2)",
        borderRadius: "var(--token-radius-lg)",
        textAlign: "center",
      }}
    >
      <p
        style={{
          color: "var(--token-color-text-muted)",
          margin: 0,
          marginBottom: "var(--token-space-sm)",
        }}
      >
        You haven&apos;t registered for any upcoming events.
      </p>
      <Link
        href="/events"
        style={{
          display: "inline-block",
          padding: "var(--token-space-xs) var(--token-space-md)",
          backgroundColor: "var(--token-color-primary)",
          color: "#fff",
          borderRadius: "var(--token-radius-lg)",
          textDecoration: "none",
          fontWeight: 500,
          fontSize: "var(--token-text-sm)",
        }}
      >
        Find Events
      </Link>
    </div>
  );
}

function EventCard({ registration }: { registration: Registration }) {
  const eventDate = new Date(registration.eventDate);
  const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isWaitlisted = registration.status === "WAITLISTED";
  const isUrgent = daysUntil <= 2;

  return (
    <Link
      href={`/events/${registration.eventId}`}
      data-test-id={`registration-${registration.id}`}
      style={{
        display: "block",
        padding: "var(--token-space-md)",
        backgroundColor: "var(--token-color-surface)",
        border: `1px solid ${isUrgent ? "var(--token-color-warning)" : "var(--token-color-border)"}`,
        borderRadius: "var(--token-radius-lg)",
        textDecoration: "none",
        transition: "box-shadow 0.15s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--token-shadow-md)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "var(--token-space-xs)",
        }}
      >
        <span
          style={{
            fontSize: "var(--token-text-xs)",
            fontWeight: 600,
            color: isUrgent ? "var(--token-color-warning)" : "var(--token-color-primary)",
          }}
        >
          {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`}
        </span>
        <span
          style={{
            fontSize: "var(--token-text-xs)",
            fontWeight: 600,
            color: isWaitlisted ? "var(--token-color-warning)" : "var(--token-color-success)",
            backgroundColor: isWaitlisted ? "#fef3c7" : "#dcfce7",
            padding: "2px 6px",
            borderRadius: "var(--token-radius-lg)",
          }}
        >
          {isWaitlisted ? `Waitlist #${registration.waitlistPosition || "?"}` : "Registered"}
        </span>
      </div>
      <h3
        style={{
          fontSize: "var(--token-text-sm)",
          fontWeight: 600,
          color: "var(--token-color-text)",
          margin: 0,
          marginBottom: "var(--token-space-xs)",
          lineHeight: 1.3,
        }}
      >
        {registration.eventTitle}
      </h3>
      <p
        style={{
          fontSize: "var(--token-text-xs)",
          color: "var(--token-color-text-muted)",
          margin: 0,
        }}
      >
        {formatClubDate(eventDate)}
      </p>
    </Link>
  );
}

// ============================================================================
// Recommended Events Panel
// ============================================================================

interface RecommendedEvent {
  id: string;
  title: string;
  category: string | null;
  startTime: string;
  location: string | null;
  spotsRemaining: number | null;
}

function RecommendedEventsPanel() {
  const [events, setEvents] = useState<RecommendedEvent[]>([]);
  const [basedOn, setBasedOn] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const res = await fetch("/api/v1/me/recommended-events");
        if (!res.ok) {
          setEvents([]);
          return;
        }
        const data = await res.json();
        setEvents(data.events || []);
        setBasedOn(data.basedOn || []);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    fetchRecommendations();
  }, []);

  // Don't show if no recommendations
  if (!loading && events.length === 0) return null;

  return (
    <div data-test-id="recommended-events-panel">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--token-space-sm)",
          marginBottom: "var(--token-space-sm)",
        }}
      >
        <h2
          style={{
            fontSize: "var(--token-text-lg)",
            fontWeight: 600,
            color: "var(--token-color-text)",
            margin: 0,
          }}
        >
          Events You Might Like
        </h2>
        {basedOn.length > 0 && (
          <span
            style={{
              fontSize: "var(--token-text-xs)",
              color: "var(--token-color-text-muted)",
              backgroundColor: "var(--token-color-surface-2)",
              padding: "2px 8px",
              borderRadius: "var(--token-radius-lg)",
            }}
          >
            Based on {basedOn.slice(0, 2).join(", ")}
            {basedOn.length > 2 && ` +${basedOn.length - 2}`}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", gap: "var(--token-space-md)" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: "70px",
                backgroundColor: "var(--token-color-surface-2)",
                borderRadius: "var(--token-radius-lg)",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "var(--token-space-sm)",
          }}
        >
          {events.slice(0, 4).map((event) => (
            <RecommendedEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecommendedEventCard({ event }: { event: RecommendedEvent }) {
  const eventDate = new Date(event.startTime);

  return (
    <Link
      href={`/events/${event.id}`}
      data-test-id={`recommended-${event.id}`}
      style={{
        display: "block",
        padding: "var(--token-space-sm) var(--token-space-md)",
        backgroundColor: "var(--token-color-surface)",
        border: "1px solid var(--token-color-border)",
        borderRadius: "var(--token-radius-lg)",
        textDecoration: "none",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--token-color-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--token-color-border)";
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "4px",
        }}
      >
        <span
          style={{
            fontSize: "var(--token-text-xs)",
            color: "var(--token-color-text-muted)",
          }}
        >
          {formatClubDate(eventDate)}
        </span>
        {event.spotsRemaining !== null && event.spotsRemaining <= 5 && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: event.spotsRemaining === 0 ? "var(--token-color-danger)" : "var(--token-color-warning)",
            }}
          >
            {event.spotsRemaining === 0 ? "Full" : `${event.spotsRemaining} left`}
          </span>
        )}
      </div>
      <h4
        style={{
          fontSize: "var(--token-text-sm)",
          fontWeight: 500,
          color: "var(--token-color-text)",
          margin: 0,
          lineHeight: 1.3,
        }}
      >
        {event.title}
      </h4>
      {event.category && (
        <span
          style={{
            fontSize: "var(--token-text-xs)",
            color: "var(--token-color-primary)",
          }}
        >
          {event.category}
        </span>
      )}
    </Link>
  );
}

// ============================================================================
// Quick Actions Panel
// ============================================================================

function QuickActionsPanel() {
  const actions = [
    { label: "Find Events", href: "/events", icon: "📅", primary: true },
    { label: "Member Directory", href: "/member/directory", icon: "👥", primary: false },
    { label: "My Profile", href: "/my/profile", icon: "👤", primary: false },
    { label: "Payment Methods", href: "/my/payment-methods", icon: "💳", primary: false },
    { label: "Gift Membership", href: "/gift", icon: "🎁", primary: false },
  ];

  return (
    <div
      data-test-id="quick-actions-panel"
      style={{
        padding: "var(--token-space-md)",
        backgroundColor: "var(--token-color-surface)",
        border: "1px solid var(--token-color-border)",
        borderRadius: "var(--token-radius-lg)",
      }}
    >
      <h3
        style={{
          fontSize: "var(--token-text-sm)",
          fontWeight: 600,
          color: "var(--token-color-text-muted)",
          margin: "0 0 var(--token-space-sm) 0",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        Quick Actions
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--token-space-xs)" }}>
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--token-space-sm)",
              padding: "var(--token-space-sm)",
              backgroundColor: action.primary ? "var(--token-color-primary)" : "var(--token-color-surface-2)",
              color: action.primary ? "#fff" : "var(--token-color-text)",
              borderRadius: "var(--token-radius-lg)",
              textDecoration: "none",
              fontSize: "var(--token-text-sm)",
              fontWeight: 500,
              transition: "transform 0.1s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateX(2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
            }}
          >
            <span>{action.icon}</span>
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Member Status Panel
// ============================================================================

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  memberSince: string;
  membershipStatus: { code: string; label: string };
  membershipTier?: { name: string } | null;
}

function MemberStatusPanel() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/v1/me/profile");
        if (!res.ok) {
          setProfile(null);
          return;
        }
        const data = await res.json();
        setProfile(data.profile);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          padding: "var(--token-space-md)",
          backgroundColor: "var(--token-color-surface)",
          border: "1px solid var(--token-color-border)",
          borderRadius: "var(--token-radius-lg)",
        }}
      >
        <div
          style={{
            height: "80px",
            backgroundColor: "var(--token-color-surface-2)",
            borderRadius: "var(--token-radius-lg)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      </div>
    );
  }

  if (!profile) return null;

  const statusCode = profile.membershipStatus.code;
  const statusMessages: Record<string, { message: string; bg: string; color: string }> = {
    active_newbie: {
      message: "Welcome to SBNC! Explore events to meet fellow newcomers.",
      bg: "#dbeafe",
      color: "#1e40af",
    },
    active_extended: {
      message: "Thanks for being a long-time member of our community!",
      bg: "#dcfce7",
      color: "#166534",
    },
    active: {
      message: "Your membership is active. See you at the next event!",
      bg: "#dcfce7",
      color: "#166534",
    },
    pending_new: {
      message: "Your membership is pending approval.",
      bg: "#fef3c7",
      color: "#92400e",
    },
    lapsed: {
      message: "Your membership has lapsed. Renew to continue enjoying events!",
      bg: "#fee2e2",
      color: "#991b1b",
    },
  };
  const statusInfo = statusMessages[statusCode] || statusMessages.active;

  return (
    <div
      data-test-id="member-status-panel"
      style={{
        padding: "var(--token-space-md)",
        backgroundColor: statusInfo.bg,
        border: `1px solid ${statusInfo.color}20`,
        borderRadius: "var(--token-radius-lg)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--token-space-xs)",
        }}
      >
        <span
          style={{
            fontSize: "var(--token-text-sm)",
            fontWeight: 600,
            color: statusInfo.color,
          }}
        >
          {profile.membershipStatus.label}
        </span>
        {profile.membershipTier && (
          <span
            style={{
              fontSize: "var(--token-text-xs)",
              color: statusInfo.color,
              opacity: 0.8,
            }}
          >
            {profile.membershipTier.name}
          </span>
        )}
      </div>
      <p
        style={{
          fontSize: "var(--token-text-xs)",
          color: statusInfo.color,
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        {statusInfo.message}
      </p>
      <div
        style={{
          marginTop: "var(--token-space-sm)",
          fontSize: "var(--token-text-xs)",
          color: statusInfo.color,
          opacity: 0.7,
        }}
      >
        Member since {profile.memberSince}
      </div>
    </div>
  );
}

// ============================================================================
// Committees Panel
// ============================================================================

interface Committee {
  id: string;
  committeeName: string;
  roleName: string;
  isActive: boolean;
}

function CommitteesPanel() {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCommittees() {
      try {
        const res = await fetch("/api/v1/me/committees");
        if (!res.ok) {
          setCommittees([]);
          return;
        }
        const data = await res.json();
        setCommittees(data.committees || []);
      } catch {
        setCommittees([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCommittees();
  }, []);

  // Don't show if no committees
  if (!loading && committees.length === 0) return null;

  return (
    <div
      data-test-id="committees-panel"
      style={{
        padding: "var(--token-space-md)",
        backgroundColor: "var(--token-color-surface)",
        border: "1px solid var(--token-color-border)",
        borderRadius: "var(--token-radius-lg)",
      }}
    >
      <h3
        style={{
          fontSize: "var(--token-text-sm)",
          fontWeight: 600,
          color: "var(--token-color-text-muted)",
          margin: "0 0 var(--token-space-sm) 0",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        My Committees
      </h3>

      {loading ? (
        <div
          style={{
            height: "50px",
            backgroundColor: "var(--token-color-surface-2)",
            borderRadius: "var(--token-radius-lg)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--token-space-xs)" }}>
          {committees.map((committee) => (
            <div
              key={committee.id}
              data-test-id={`committee-${committee.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--token-space-sm)",
                padding: "var(--token-space-xs) 0",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: committee.isActive
                    ? "var(--token-color-success)"
                    : "var(--token-color-text-muted)",
                }}
              />
              <div>
                <div
                  style={{
                    fontWeight: 500,
                    color: "var(--token-color-text)",
                    fontSize: "var(--token-text-sm)",
                  }}
                >
                  {committee.committeeName}
                </div>
                <div
                  style={{
                    fontSize: "var(--token-text-xs)",
                    color: "var(--token-color-text-muted)",
                  }}
                >
                  {committee.roleName}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
