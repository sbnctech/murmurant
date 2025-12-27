"use client";

import { useState, useEffect } from "react";
import { formatClubDate } from "@/lib/timezone";

/**
 * Member Profile Page
 *
 * Displays a member's public profile including:
 * - Photo, name, membership tier
 * - Member since date
 * - Committee memberships
 * - Recent events attended
 * - Contact info (if public)
 * - "This is you" badge for own profile
 */

type MembershipTier = "REGULAR" | "ASSOCIATE" | "HONORARY" | "LIFETIME";

type Committee = {
  id: string;
  name: string;
  role: string;
};

type EventAttended = {
  id: string;
  title: string;
  date: Date;
  category: string;
};

type MemberProfile = {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  membershipTier: MembershipTier;
  memberSince: Date;
  committees: Committee[];
  eventsAttended: EventAttended[];
  contactInfo: {
    email: string | null;
    phone: string | null;
    isPublic: boolean;
  };
};

// Mock current user ID (would come from auth context in production)
const CURRENT_USER_ID = "member-001";

// Mock data for demo
const MOCK_PROFILES: Record<string, MemberProfile> = {
  "member-001": {
    id: "member-001",
    firstName: "Jane",
    lastName: "Smith",
    photoUrl: null,
    membershipTier: "REGULAR",
    memberSince: new Date("2022-03-15"),
    committees: [
      { id: "c1", name: "Events Committee", role: "Chair" },
      { id: "c2", name: "Membership Committee", role: "Member" },
    ],
    eventsAttended: [
      { id: "e1", title: "Monthly Luncheon", date: new Date("2024-12-10"), category: "Social" },
      { id: "e2", title: "Wine Tasting", date: new Date("2024-11-28"), category: "Interest Group" },
      { id: "e3", title: "Book Club", date: new Date("2024-11-15"), category: "Interest Group" },
      { id: "e4", title: "Holiday Party", date: new Date("2024-12-20"), category: "Social" },
      { id: "e5", title: "New Member Coffee", date: new Date("2024-10-05"), category: "Orientation" },
    ],
    contactInfo: {
      email: "jane.smith@example.com",
      phone: "(805) 555-0123",
      isPublic: true,
    },
  },
  "member-002": {
    id: "member-002",
    firstName: "Robert",
    lastName: "Johnson",
    photoUrl: null,
    membershipTier: "LIFETIME",
    memberSince: new Date("2015-06-01"),
    committees: [
      { id: "c3", name: "Board of Directors", role: "Past President" },
    ],
    eventsAttended: [
      { id: "e1", title: "Monthly Luncheon", date: new Date("2024-12-10"), category: "Social" },
      { id: "e6", title: "Golf Outing", date: new Date("2024-11-20"), category: "Interest Group" },
    ],
    contactInfo: {
      email: null,
      phone: null,
      isPublic: false,
    },
  },
};

function getTierLabel(tier: MembershipTier): string {
  const labels: Record<MembershipTier, string> = {
    REGULAR: "Regular Member",
    ASSOCIATE: "Associate Member",
    HONORARY: "Honorary Member",
    LIFETIME: "Lifetime Member",
  };
  return labels[tier];
}

function getTierColor(tier: MembershipTier): string {
  const colors: Record<MembershipTier, string> = {
    REGULAR: "#3B82F6",
    ASSOCIATE: "#10B981",
    HONORARY: "#8B5CF6",
    LIFETIME: "#F59E0B",
  };
  return colors[tier];
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const resolvedParams = await params;
      const id = resolvedParams.id;
      setMemberId(id);

      // Simulate API fetch
      await new Promise((resolve) => setTimeout(resolve, 300));

      const mockProfile = MOCK_PROFILES[id];
      if (mockProfile) {
        setProfile(mockProfile);
      } else {
        setError("Member not found");
      }
      setLoading(false);
    }

    loadProfile();
  }, [params]);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p style={{ color: "#DC2626" }}>{error || "Profile not found"}</p>
      </div>
    );
  }

  const isOwnProfile = memberId === CURRENT_USER_ID;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      {/* Header with photo and basic info */}
      <div
        style={{
          display: "flex",
          gap: 24,
          alignItems: "flex-start",
          marginBottom: 32,
          padding: 24,
          backgroundColor: "#FAFAFA",
          borderRadius: 12,
          border: "1px solid #E5E7EB",
        }}
      >
        {/* Photo or initials */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            backgroundColor: getTierColor(profile.membershipTier),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 36,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {/* Photo display not yet implemented - showing initials */}
          {getInitials(profile.firstName, profile.lastName)}
        </div>

        {/* Name and tier */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>
              {profile.firstName} {profile.lastName}
            </h1>
            {isOwnProfile && (
              <span
                style={{
                  backgroundColor: "#DBEAFE",
                  color: "#1D4ED8",
                  padding: "4px 12px",
                  borderRadius: 16,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                This is you
              </span>
            )}
          </div>

          <div
            style={{
              display: "inline-block",
              backgroundColor: getTierColor(profile.membershipTier),
              color: "white",
              padding: "4px 12px",
              borderRadius: 4,
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            {getTierLabel(profile.membershipTier)}
          </div>

          <p style={{ color: "#6B7280", margin: 0 }}>
            Member since {formatClubDate(profile.memberSince)}
          </p>
        </div>
      </div>

      {/* Contact Info (if public) */}
      {profile.contactInfo.isPublic && (profile.contactInfo.email || profile.contactInfo.phone) && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Contact Information</h2>
          <div
            style={{
              padding: 16,
              backgroundColor: "#F9FAFB",
              borderRadius: 8,
              border: "1px solid #E5E7EB",
            }}
          >
            {profile.contactInfo.email && (
              <p style={{ margin: "0 0 8px 0" }}>
                <strong>Email:</strong>{" "}
                <a href={`mailto:${profile.contactInfo.email}`} style={{ color: "#2563EB" }}>
                  {profile.contactInfo.email}
                </a>
              </p>
            )}
            {profile.contactInfo.phone && (
              <p style={{ margin: 0 }}>
                <strong>Phone:</strong> {profile.contactInfo.phone}
              </p>
            )}
          </div>
        </section>
      )}

      {!profile.contactInfo.isPublic && !isOwnProfile && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Contact Information</h2>
          <p style={{ color: "#6B7280", fontStyle: "italic" }}>
            This member has chosen to keep their contact information private.
          </p>
        </section>
      )}

      {/* Committees */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Committees</h2>
        {profile.committees.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {profile.committees.map((committee) => (
              <div
                key={committee.id}
                style={{
                  padding: 12,
                  backgroundColor: "#F9FAFB",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 500 }}>{committee.name}</span>
                <span
                  style={{
                    backgroundColor: "#E0E7FF",
                    color: "#4338CA",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 13,
                  }}
                >
                  {committee.role}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#6B7280", fontStyle: "italic" }}>
            Not currently serving on any committees.
          </p>
        )}
      </section>

      {/* Recent Events Attended */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
          Recent Events Attended
        </h2>
        {profile.eventsAttended.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {profile.eventsAttended.slice(0, 10).map((event) => (
              <div
                key={event.id}
                style={{
                  padding: 12,
                  backgroundColor: "#F9FAFB",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontWeight: 500 }}>{event.title}</span>
                  <span
                    style={{
                      marginLeft: 8,
                      backgroundColor: "#FEF3C7",
                      color: "#92400E",
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  >
                    {event.category}
                  </span>
                </div>
                <span style={{ color: "#6B7280", fontSize: 14 }}>
                  {formatClubDate(event.date)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#6B7280", fontStyle: "italic" }}>
            No events attended yet.
          </p>
        )}
      </section>
    </div>
  );
}
