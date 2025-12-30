/**
 * Committee Detail Page (Admin)
 *
 * URL: /admin/committees/[id]
 *
 * Displays detailed information about a committee including members,
 * meetings, events, and activity history.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatClubDate, formatClubDateTime } from "@/lib/timezone";

// ============================================================================
// Types
// ============================================================================

type CommitteeMember = {
  id: string;
  name: string;
  email: string;
  role: "chair" | "co-chair" | "member";
  joinedDate: string;
  photoUrl?: string;
};

type MeetingNote = {
  id: string;
  date: string;
  title: string;
  summary: string;
  attendeeCount: number;
};

type CommitteeEvent = {
  id: string;
  title: string;
  date: string;
  status: "upcoming" | "past" | "cancelled";
  registrationCount: number;
};

type ActivityItem = {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  details?: string;
};

type Committee = {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  createdAt: string;
  meetingSchedule: string;
  members: CommitteeMember[];
  meetingNotes: MeetingNote[];
  events: CommitteeEvent[];
  activityHistory: ActivityItem[];
};

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_COMMITTEE: Committee = {
  id: "1",
  name: "Events Committee",
  description:
    "Plans and coordinates club events, including monthly luncheons, special outings, and seasonal celebrations. Works with venues, manages RSVPs, and ensures memorable experiences for all members.",
  status: "active",
  createdAt: "2020-01-15",
  meetingSchedule: "First Tuesday of each month at 10:00 AM",
  members: [
    {
      id: "m1",
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      role: "chair",
      joinedDate: "2022-03-01",
      photoUrl: "https://picsum.photos/seed/sarah/100/100",
    },
    {
      id: "m2",
      name: "Michael Chen",
      email: "m.chen@email.com",
      role: "co-chair",
      joinedDate: "2022-06-15",
      photoUrl: "https://picsum.photos/seed/michael/100/100",
    },
    {
      id: "m3",
      name: "Emily Davis",
      email: "emily.d@email.com",
      role: "member",
      joinedDate: "2023-01-10",
      photoUrl: "https://picsum.photos/seed/emily/100/100",
    },
    {
      id: "m4",
      name: "Robert Wilson",
      email: "r.wilson@email.com",
      role: "member",
      joinedDate: "2023-04-20",
      photoUrl: "https://picsum.photos/seed/robert/100/100",
    },
    {
      id: "m5",
      name: "Lisa Martinez",
      email: "lisa.m@email.com",
      role: "member",
      joinedDate: "2024-02-01",
      photoUrl: "https://picsum.photos/seed/lisa/100/100",
    },
  ],
  meetingNotes: [
    {
      id: "n1",
      date: "2025-01-07",
      title: "January Planning Meeting",
      summary:
        "Discussed Q1 events calendar, finalized venue for Spring Gala, assigned coordinators for February luncheon.",
      attendeeCount: 5,
    },
    {
      id: "n2",
      date: "2024-12-03",
      title: "December Wrap-up",
      summary:
        "Reviewed Holiday Party success, discussed budget for 2025, collected feedback on recent events.",
      attendeeCount: 4,
    },
    {
      id: "n3",
      date: "2024-11-05",
      title: "Holiday Party Planning",
      summary:
        "Confirmed menu and entertainment, finalized decorations budget, assigned volunteer roles.",
      attendeeCount: 5,
    },
  ],
  events: [
    {
      id: "e1",
      title: "February Luncheon",
      date: "2025-02-12",
      status: "upcoming",
      registrationCount: 45,
    },
    {
      id: "e2",
      title: "Spring Gala",
      date: "2025-04-15",
      status: "upcoming",
      registrationCount: 12,
    },
    {
      id: "e3",
      title: "January Luncheon",
      date: "2025-01-15",
      status: "past",
      registrationCount: 52,
    },
    {
      id: "e4",
      title: "Holiday Party",
      date: "2024-12-18",
      status: "past",
      registrationCount: 78,
    },
  ],
  activityHistory: [
    {
      id: "a1",
      action: "Member added",
      actor: "Sarah Johnson",
      timestamp: "2025-01-10T14:30:00Z",
      details: "Added Lisa Martinez to committee",
    },
    {
      id: "a2",
      action: "Meeting notes published",
      actor: "Sarah Johnson",
      timestamp: "2025-01-07T16:00:00Z",
      details: "January Planning Meeting notes",
    },
    {
      id: "a3",
      action: "Event created",
      actor: "Michael Chen",
      timestamp: "2025-01-05T10:15:00Z",
      details: "Created February Luncheon event",
    },
    {
      id: "a4",
      action: "Description updated",
      actor: "Sarah Johnson",
      timestamp: "2024-12-20T09:00:00Z",
    },
  ],
};

// ============================================================================
// Committee Detail Page Component
// ============================================================================

export default function CommitteeDetailPage() {
  const params = useParams();
  const committeeId = params.id as string;

  const [committee] = useState<Committee>(MOCK_COMMITTEE);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<CommitteeMember | null>(null);

  const chair = committee.members.find((m) => m.role === "chair");
  const coChairs = committee.members.filter((m) => m.role === "co-chair");
  const regularMembers = committee.members.filter((m) => m.role === "member");

  const handleAddMember = () => {
    setShowAddMemberModal(true);
  };

  const handleRemoveMember = (member: CommitteeMember) => {
    setMemberToRemove(member);
  };

  const confirmRemoveMember = () => {
    // In production, this would call an API
    console.log("Removing member:", memberToRemove?.id);
    setMemberToRemove(null);
  };

  const formatDate = (dateString: string) => {
    return formatClubDate(new Date(dateString));
  };

  const formatTimestamp = (timestamp: string) => {
    return formatClubDateTime(new Date(timestamp));
  };

  return (
    <div data-test-id="committee-detail-page" style={{ padding: "var(--token-space-lg)" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "var(--token-space-lg)",
        }}
      >
        <div>
          <div style={{ marginBottom: "var(--token-space-xs)" }}>
            <Link
              href="/admin/committees"
              style={{
                color: "var(--token-color-text-muted)",
                fontSize: "var(--token-text-sm)",
                textDecoration: "none",
              }}
            >
              ← Back to Committees
            </Link>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--token-space-sm)" }}>
            <h1
              style={{
                fontSize: "var(--token-text-2xl)",
                fontWeight: 700,
                color: "var(--token-color-text)",
                margin: 0,
              }}
            >
              {committee.name}
            </h1>
            <span
              style={{
                padding: "var(--token-space-xs) var(--token-space-sm)",
                borderRadius: "var(--token-radius-full)",
                fontSize: "var(--token-text-xs)",
                fontWeight: 500,
                backgroundColor:
                  committee.status === "active"
                    ? "var(--token-color-success-light)"
                    : "var(--token-color-muted)",
                color:
                  committee.status === "active"
                    ? "var(--token-color-success)"
                    : "var(--token-color-text-muted)",
              }}
            >
              {committee.status}
            </span>
          </div>
          <p
            style={{
              color: "var(--token-color-text-muted)",
              fontSize: "var(--token-text-sm)",
              marginTop: "var(--token-space-xs)",
              marginBottom: 0,
            }}
          >
            Committee ID: {committeeId}
          </p>
        </div>
        <Link
          href={`/admin/committees/${committeeId}/edit`}
          data-test-id="edit-committee-button"
          style={{
            padding: "var(--token-space-sm) var(--token-space-md)",
            backgroundColor: "var(--token-color-primary)",
            color: "#fff",
            borderRadius: "var(--token-radius-md)",
            fontSize: "var(--token-text-sm)",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Edit Committee
        </Link>
      </div>

      {/* Description */}
      <div
        style={{
          backgroundColor: "var(--token-color-surface)",
          border: "1px solid var(--token-color-border)",
          borderRadius: "var(--token-radius-lg)",
          padding: "var(--token-space-md)",
          marginBottom: "var(--token-space-lg)",
        }}
      >
        <p
          style={{
            color: "var(--token-color-text)",
            fontSize: "var(--token-text-base)",
            lineHeight: "var(--token-leading-relaxed)",
            margin: 0,
          }}
        >
          {committee.description}
        </p>
      </div>

      {/* Two Column Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--token-space-lg)",
        }}
      >
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--token-space-lg)" }}>
          {/* Committee Chair & Members */}
          <section
            style={{
              backgroundColor: "var(--token-color-surface)",
              border: "1px solid var(--token-color-border)",
              borderRadius: "var(--token-radius-lg)",
              padding: "var(--token-space-md)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--token-space-md)",
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
                Members ({committee.members.length})
              </h2>
              <button
                onClick={handleAddMember}
                data-test-id="add-member-button"
                style={{
                  padding: "var(--token-space-xs) var(--token-space-sm)",
                  backgroundColor: "var(--token-color-primary)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--token-radius-md)",
                  fontSize: "var(--token-text-sm)",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                + Add Member
              </button>
            </div>

            {/* Chair */}
            {chair && (
              <div style={{ marginBottom: "var(--token-space-md)" }}>
                <div
                  style={{
                    fontSize: "var(--token-text-xs)",
                    fontWeight: 600,
                    color: "var(--token-color-text-muted)",
                    textTransform: "uppercase",
                    marginBottom: "var(--token-space-xs)",
                  }}
                >
                  Chair
                </div>
                <MemberCard member={chair} onRemove={handleRemoveMember} />
              </div>
            )}

            {/* Co-Chairs */}
            {coChairs.length > 0 && (
              <div style={{ marginBottom: "var(--token-space-md)" }}>
                <div
                  style={{
                    fontSize: "var(--token-text-xs)",
                    fontWeight: 600,
                    color: "var(--token-color-text-muted)",
                    textTransform: "uppercase",
                    marginBottom: "var(--token-space-xs)",
                  }}
                >
                  Co-Chair{coChairs.length > 1 ? "s" : ""}
                </div>
                {coChairs.map((member) => (
                  <MemberCard key={member.id} member={member} onRemove={handleRemoveMember} />
                ))}
              </div>
            )}

            {/* Regular Members */}
            {regularMembers.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: "var(--token-text-xs)",
                    fontWeight: 600,
                    color: "var(--token-color-text-muted)",
                    textTransform: "uppercase",
                    marginBottom: "var(--token-space-xs)",
                  }}
                >
                  Members
                </div>
                {regularMembers.map((member) => (
                  <MemberCard key={member.id} member={member} onRemove={handleRemoveMember} />
                ))}
              </div>
            )}
          </section>

          {/* Meeting Schedule */}
          <section
            style={{
              backgroundColor: "var(--token-color-surface)",
              border: "1px solid var(--token-color-border)",
              borderRadius: "var(--token-radius-lg)",
              padding: "var(--token-space-md)",
            }}
          >
            <h2
              style={{
                fontSize: "var(--token-text-lg)",
                fontWeight: 600,
                color: "var(--token-color-text)",
                margin: 0,
                marginBottom: "var(--token-space-sm)",
              }}
            >
              Meeting Schedule
            </h2>
            <p
              style={{
                color: "var(--token-color-text)",
                fontSize: "var(--token-text-base)",
                margin: 0,
              }}
            >
              {committee.meetingSchedule}
            </p>
          </section>

          {/* Recent Meeting Notes */}
          <section
            style={{
              backgroundColor: "var(--token-color-surface)",
              border: "1px solid var(--token-color-border)",
              borderRadius: "var(--token-radius-lg)",
              padding: "var(--token-space-md)",
            }}
          >
            <h2
              style={{
                fontSize: "var(--token-text-lg)",
                fontWeight: 600,
                color: "var(--token-color-text)",
                margin: 0,
                marginBottom: "var(--token-space-md)",
              }}
            >
              Recent Meeting Notes
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--token-space-sm)" }}>
              {committee.meetingNotes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    padding: "var(--token-space-sm)",
                    backgroundColor: "var(--token-color-surface-muted)",
                    borderRadius: "var(--token-radius-md)",
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
                        fontWeight: 600,
                        color: "var(--token-color-text)",
                        fontSize: "var(--token-text-sm)",
                      }}
                    >
                      {note.title}
                    </span>
                    <span
                      style={{
                        color: "var(--token-color-text-muted)",
                        fontSize: "var(--token-text-xs)",
                      }}
                    >
                      {formatDate(note.date)}
                    </span>
                  </div>
                  <p
                    style={{
                      color: "var(--token-color-text-muted)",
                      fontSize: "var(--token-text-sm)",
                      margin: 0,
                      lineHeight: "var(--token-leading-normal)",
                    }}
                  >
                    {note.summary}
                  </p>
                  <div
                    style={{
                      color: "var(--token-color-text-muted)",
                      fontSize: "var(--token-text-xs)",
                      marginTop: "var(--token-space-xs)",
                    }}
                  >
                    {note.attendeeCount} attendees
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--token-space-lg)" }}>
          {/* Committee Events */}
          <section
            style={{
              backgroundColor: "var(--token-color-surface)",
              border: "1px solid var(--token-color-border)",
              borderRadius: "var(--token-radius-lg)",
              padding: "var(--token-space-md)",
            }}
          >
            <h2
              style={{
                fontSize: "var(--token-text-lg)",
                fontWeight: 600,
                color: "var(--token-color-text)",
                margin: 0,
                marginBottom: "var(--token-space-md)",
              }}
            >
              Committee Events
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--token-space-sm)" }}>
              {committee.events.map((event) => (
                <Link
                  key={event.id}
                  href={`/admin/events/${event.id}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "var(--token-space-sm)",
                    backgroundColor: "var(--token-color-surface-muted)",
                    borderRadius: "var(--token-radius-md)",
                    textDecoration: "none",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 500,
                        color: "var(--token-color-text)",
                        fontSize: "var(--token-text-sm)",
                      }}
                    >
                      {event.title}
                    </div>
                    <div
                      style={{
                        color: "var(--token-color-text-muted)",
                        fontSize: "var(--token-text-xs)",
                      }}
                    >
                      {formatDate(event.date)} · {event.registrationCount} registered
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "var(--token-space-xs) var(--token-space-sm)",
                      borderRadius: "var(--token-radius-full)",
                      fontSize: "var(--token-text-xs)",
                      fontWeight: 500,
                      backgroundColor:
                        event.status === "upcoming"
                          ? "var(--token-color-primary-light)"
                          : event.status === "past"
                            ? "var(--token-color-muted)"
                            : "var(--token-color-error-light)",
                      color:
                        event.status === "upcoming"
                          ? "var(--token-color-primary)"
                          : event.status === "past"
                            ? "var(--token-color-text-muted)"
                            : "var(--token-color-error)",
                    }}
                  >
                    {event.status}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Activity History */}
          <section
            style={{
              backgroundColor: "var(--token-color-surface)",
              border: "1px solid var(--token-color-border)",
              borderRadius: "var(--token-radius-lg)",
              padding: "var(--token-space-md)",
            }}
          >
            <h2
              style={{
                fontSize: "var(--token-text-lg)",
                fontWeight: 600,
                color: "var(--token-color-text)",
                margin: 0,
                marginBottom: "var(--token-space-md)",
              }}
            >
              Activity History
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--token-space-sm)" }}>
              {committee.activityHistory.map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    display: "flex",
                    gap: "var(--token-space-sm)",
                    padding: "var(--token-space-sm) 0",
                    borderBottom: "1px solid var(--token-color-border)",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "var(--token-color-primary)",
                      marginTop: "6px",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 500,
                          color: "var(--token-color-text)",
                          fontSize: "var(--token-text-sm)",
                        }}
                      >
                        {activity.action}
                      </span>
                      <span
                        style={{
                          color: "var(--token-color-text-muted)",
                          fontSize: "var(--token-text-xs)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                    <div
                      style={{
                        color: "var(--token-color-text-muted)",
                        fontSize: "var(--token-text-xs)",
                      }}
                    >
                      by {activity.actor}
                      {activity.details && ` · ${activity.details}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <Modal onClose={() => setShowAddMemberModal(false)}>
          <h3
            style={{
              fontSize: "var(--token-text-lg)",
              fontWeight: 600,
              margin: 0,
              marginBottom: "var(--token-space-md)",
            }}
          >
            Add Committee Member
          </h3>
          <p style={{ color: "var(--token-color-text-muted)", marginBottom: "var(--token-space-md)" }}>
            Search for a member to add to this committee.
          </p>
          <input
            type="text"
            placeholder="Search members..."
            style={{
              width: "100%",
              padding: "var(--token-space-sm)",
              border: "1px solid var(--token-color-border)",
              borderRadius: "var(--token-radius-md)",
              fontSize: "var(--token-text-sm)",
              marginBottom: "var(--token-space-md)",
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--token-space-sm)" }}>
            <button
              onClick={() => setShowAddMemberModal(false)}
              style={{
                padding: "var(--token-space-sm) var(--token-space-md)",
                backgroundColor: "transparent",
                border: "1px solid var(--token-color-border)",
                borderRadius: "var(--token-radius-md)",
                fontSize: "var(--token-text-sm)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              style={{
                padding: "var(--token-space-sm) var(--token-space-md)",
                backgroundColor: "var(--token-color-primary)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--token-radius-md)",
                fontSize: "var(--token-text-sm)",
                cursor: "pointer",
              }}
            >
              Add Member
            </button>
          </div>
        </Modal>
      )}

      {/* Remove Member Confirmation Modal */}
      {memberToRemove && (
        <Modal onClose={() => setMemberToRemove(null)}>
          <h3
            style={{
              fontSize: "var(--token-text-lg)",
              fontWeight: 600,
              margin: 0,
              marginBottom: "var(--token-space-md)",
            }}
          >
            Remove Committee Member
          </h3>
          <p style={{ color: "var(--token-color-text-muted)", marginBottom: "var(--token-space-md)" }}>
            Are you sure you want to remove <strong>{memberToRemove.name}</strong> from this committee?
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--token-space-sm)" }}>
            <button
              onClick={() => setMemberToRemove(null)}
              style={{
                padding: "var(--token-space-sm) var(--token-space-md)",
                backgroundColor: "transparent",
                border: "1px solid var(--token-color-border)",
                borderRadius: "var(--token-radius-md)",
                fontSize: "var(--token-text-sm)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmRemoveMember}
              data-test-id="confirm-remove-member"
              style={{
                padding: "var(--token-space-sm) var(--token-space-md)",
                backgroundColor: "var(--token-color-error)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--token-radius-md)",
                fontSize: "var(--token-text-sm)",
                cursor: "pointer",
              }}
            >
              Remove
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================================
// Member Card Component
// ============================================================================

interface MemberCardProps {
  member: CommitteeMember;
  onRemove: (member: CommitteeMember) => void;
}

function MemberCard({ member, onRemove }: MemberCardProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--token-space-sm)",
        backgroundColor: "var(--token-color-surface-muted)",
        borderRadius: "var(--token-radius-md)",
        marginBottom: "var(--token-space-xs)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--token-space-sm)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={member.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`}
          alt={member.name}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            objectFit: "cover",
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
            {member.name}
          </div>
          <div
            style={{
              color: "var(--token-color-text-muted)",
              fontSize: "var(--token-text-xs)",
            }}
          >
            {member.email}
          </div>
        </div>
      </div>
      <button
        onClick={() => onRemove(member)}
        data-test-id={`remove-member-${member.id}`}
        style={{
          padding: "var(--token-space-xs) var(--token-space-sm)",
          backgroundColor: "transparent",
          border: "1px solid var(--token-color-border)",
          borderRadius: "var(--token-radius-md)",
          fontSize: "var(--token-text-xs)",
          color: "var(--token-color-error)",
          cursor: "pointer",
        }}
      >
        Remove
      </button>
    </div>
  );
}

// ============================================================================
// Modal Component
// ============================================================================

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
}

function Modal({ children, onClose }: ModalProps) {
  return (
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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--token-color-surface)",
          borderRadius: "var(--token-radius-lg)",
          padding: "var(--token-space-lg)",
          maxWidth: "400px",
          width: "90%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
