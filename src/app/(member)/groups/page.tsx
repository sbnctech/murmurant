/**
 * Member Activity Groups Page
 *
 * Browse and join activity groups. Uses real API data.
 * Authenticated members can view, join, and leave groups.
 *
 * Charter: P2 (capability-scoped actions), P6 (human-first UI)
 *
 * Copyright (c) Murmurant, Inc.
 */

"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";

interface GroupSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  schedule: string | null;
  imageEmoji: string | null;
  memberCount: number;
  coordinatorName: string | null;
  isMember?: boolean;
}

function getCategoryColor(category: string | null): { bg: string; text: string } {
  switch (category) {
    case "Arts & Culture":
      return { bg: "#fef3c7", text: "#92400e" };
    case "Outdoor":
      return { bg: "#dcfce7", text: "#166534" };
    case "Social":
      return { bg: "#dbeafe", text: "#1e40af" };
    case "Games":
      return { bg: "#e0e7ff", text: "#3730a3" };
    case "Hobbies":
      return { bg: "#fce7f3", text: "#9d174d" };
    default:
      return { bg: "#f3f4f6", text: "#374151" };
  }
}

interface GroupCardProps {
  group: GroupSummary;
  isMember: boolean;
  onJoin: (groupId: string) => void;
  onLeave: (groupId: string) => void;
  joining: boolean;
  leaving: boolean;
}

function GroupCard({ group, isMember, onJoin, onLeave, joining, leaving }: GroupCardProps) {
  const categoryColor = getCategoryColor(group.category);
  const isLoading = joining || leaving;

  return (
    <div
      data-test-id={`group-${group.slug}`}
      style={{
        backgroundColor: "white",
        borderRadius: "8px",
        border: isMember ? "2px solid #2563eb" : "1px solid #e5e7eb",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "32px" }}>{group.imageEmoji || "👥"}</span>
            <div>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#1f2937",
                  margin: 0,
                }}
              >
                {group.name}
              </h3>
              {group.category && (
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    backgroundColor: categoryColor.bg,
                    color: categoryColor.text,
                    padding: "2px 8px",
                    borderRadius: "12px",
                    display: "inline-block",
                    marginTop: "4px",
                  }}
                >
                  {group.category}
                </span>
              )}
            </div>
          </div>
          {isMember && (
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                backgroundColor: "#dbeafe",
                color: "#1e40af",
                padding: "4px 10px",
                borderRadius: "12px",
              }}
            >
              Member
            </span>
          )}
        </div>

        {group.description && (
          <p
            style={{
              fontSize: "14px",
              color: "#6b7280",
              margin: "0 0 16px 0",
              lineHeight: "1.6",
            }}
          >
            {group.description}
          </p>
        )}

        <div style={{ fontSize: "14px", color: "#374151", marginBottom: "12px" }}>
          {group.schedule && (
            <div style={{ marginBottom: "6px" }}>
              <strong>Schedule:</strong> {group.schedule}
            </div>
          )}
          <div style={{ marginBottom: "6px" }}>
            <strong>Members:</strong> {group.memberCount}
          </div>
          {group.coordinatorName && (
            <div>
              <strong>Coordinator:</strong> {group.coordinatorName}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {isMember ? (
            <>
              <Link
                href={`/groups/${group.slug}`}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "white",
                  backgroundColor: "#2563eb",
                  borderRadius: "6px",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                View Group
              </Link>
              <button
                type="button"
                onClick={() => onLeave(group.id)}
                disabled={isLoading}
                data-test-id={`leave-${group.slug}`}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: isLoading ? "#9ca3af" : "#dc2626",
                  backgroundColor: "white",
                  border: "1px solid #fecaca",
                  borderRadius: "6px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {leaving ? "Leaving..." : "Leave Group"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onJoin(group.id)}
              disabled={isLoading}
              data-test-id={`join-${group.slug}`}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 500,
                color: "white",
                backgroundColor: isLoading ? "#9ca3af" : "#16a34a",
                border: "none",
                borderRadius: "6px",
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              {joining ? "Joining..." : "Join Group"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ActivityGroupsPage() {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [actionLoading, setActionLoading] = useState<{ [key: string]: "join" | "leave" | null }>({});

  // Fetch groups on mount
  useEffect(() => {
    async function fetchGroups() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/v1/groups");
        if (!response.ok) {
          if (response.status === 401) {
            setError("Please log in to view activity groups.");
          } else {
            setError("Failed to load groups. Please try again.");
          }
          return;
        }

        const data = await response.json();
        setGroups(data.groups || []);

        // TODO: Fetch user's group memberships to populate myGroupIds
        // For now, we'll need to add an endpoint or include this in the groups response
      } catch (err) {
        console.error("Error fetching groups:", err);
        setError("Failed to load groups. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchGroups();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(
      groups.map((g) => g.category).filter((c): c is string => c !== null)
    );
    return ["All", ...Array.from(cats).sort()];
  }, [groups]);

  const filteredGroups = useMemo(() => {
    if (selectedCategory === "All") return groups;
    return groups.filter((g) => g.category === selectedCategory);
  }, [groups, selectedCategory]);

  const myGroups = useMemo(() => {
    return groups.filter((g) => myGroupIds.has(g.id));
  }, [groups, myGroupIds]);

  const handleJoin = useCallback(async (groupId: string) => {
    setActionLoading((prev) => ({ ...prev, [groupId]: "join" }));
    try {
      const response = await fetch(`/api/v1/groups/${groupId}/join`, {
        method: "POST",
      });

      if (response.ok) {
        setMyGroupIds((prev) => new Set([...prev, groupId]));
        // Update member count
        setGroups((prev) =>
          prev.map((g) =>
            g.id === groupId ? { ...g, memberCount: g.memberCount + 1 } : g
          )
        );
      } else {
        const data = await response.json();
        alert(data.error || "Failed to join group");
      }
    } catch (err) {
      console.error("Error joining group:", err);
      alert("Failed to join group. Please try again.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [groupId]: null }));
    }
  }, []);

  const handleLeave = useCallback(async (groupId: string) => {
    setActionLoading((prev) => ({ ...prev, [groupId]: "leave" }));
    try {
      const response = await fetch(`/api/v1/groups/${groupId}/leave`, {
        method: "POST",
      });

      if (response.ok) {
        setMyGroupIds((prev) => {
          const next = new Set(prev);
          next.delete(groupId);
          return next;
        });
        // Update member count
        setGroups((prev) =>
          prev.map((g) =>
            g.id === groupId ? { ...g, memberCount: Math.max(0, g.memberCount - 1) } : g
          )
        );
      } else {
        const data = await response.json();
        alert(data.error || "Failed to leave group");
      }
    } catch (err) {
      console.error("Error leaving group:", err);
      alert("Failed to leave group. Please try again.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [groupId]: null }));
    }
  }, []);

  if (loading) {
    return (
      <div data-test-id="groups-loading" style={{ maxWidth: "1000px", padding: "40px 20px", textAlign: "center" }}>
        <div style={{ fontSize: "16px", color: "#6b7280" }}>Loading activity groups...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-test-id="groups-error" style={{ maxWidth: "1000px", padding: "40px 20px" }}>
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "16px",
            color: "#dc2626",
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  return (
    <div data-test-id="activity-groups-page" style={{ maxWidth: "1000px" }}>
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 700,
          marginBottom: "8px",
          color: "#1f2937",
        }}
      >
        Activity Groups
      </h1>
      <p
        style={{
          fontSize: "16px",
          color: "#6b7280",
          marginBottom: "24px",
        }}
      >
        Join groups that match your interests and connect with fellow members
      </p>

      {/* Your Groups Section */}
      {myGroups.length > 0 && (
        <section data-test-id="your-groups-section" style={{ marginBottom: "32px" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#1f2937",
              marginBottom: "16px",
            }}
          >
            Your Groups ({myGroups.length})
          </h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            {myGroups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.slug}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  backgroundColor: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "20px",
                  textDecoration: "none",
                  color: "#1e40af",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                <span>{group.imageEmoji || "👥"}</span>
                {group.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Category Filter */}
      {categories.length > 1 && (
        <div style={{ marginBottom: "24px" }}>
          <label
            htmlFor="category-filter"
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 500,
              color: "#374151",
              marginBottom: "6px",
            }}
          >
            Filter by Category
          </label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            data-test-id="group-category-filter"
            style={{
              padding: "8px 12px",
              fontSize: "14px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              backgroundColor: "white",
              minWidth: "160px",
              cursor: "pointer",
            }}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Results Count */}
      <div
        style={{
          fontSize: "14px",
          color: "#6b7280",
          marginBottom: "16px",
        }}
      >
        {filteredGroups.length === 0
          ? "No groups found"
          : `Showing ${filteredGroups.length} group${filteredGroups.length !== 1 ? "s" : ""}`}
      </div>

      {/* Groups Grid */}
      {filteredGroups.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          {filteredGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              isMember={myGroupIds.has(group.id)}
              onJoin={handleJoin}
              onLeave={handleLeave}
              joining={actionLoading[group.id] === "join"}
              leaving={actionLoading[group.id] === "leave"}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "48px 20px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            marginBottom: "32px",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
          <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", marginBottom: "8px" }}>
            No Groups Yet
          </h3>
          <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>
            Be the first to propose a new activity group!
          </p>
          <Link
            href="/groups/propose"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              backgroundColor: "#2563eb",
              color: "white",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Propose a Group
          </Link>
        </div>
      )}

      {/* Information Box */}
      <div
        style={{
          padding: "16px",
          backgroundColor: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "8px",
        }}
      >
        <h4
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#1e40af",
            margin: "0 0 8px 0",
          }}
        >
          About Activity Groups
        </h4>
        <p
          style={{
            fontSize: "14px",
            color: "#1e3a8a",
            margin: 0,
            lineHeight: "1.5",
          }}
        >
          Activity groups are a great way to pursue hobbies and activities with fellow club members.
          Join as many groups as you like! Each group has a coordinator who organizes meetings and events.
          Want to start a new group?{" "}
          <Link href="/groups/propose" style={{ color: "#1e40af", textDecoration: "underline" }}>
            Propose one here
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
