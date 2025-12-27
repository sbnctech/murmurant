"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";

interface MemberData {
  id: string;
  firstName: string;
  lastName: string;
  joinedAt: string;
  photoUrl: string | null;
  committees: { id: string; name: string }[];
}

interface CommitteeData {
  id: string;
  name: string;
}

interface MemberDirectoryClientProps {
  members: MemberData[];
  committees: CommitteeData[];
}

function MemberCard({ member }: { member: MemberData }) {
  const joinYear = new Date(member.joinedAt).getFullYear();

  return (
    <Link
      href={`/directory/${member.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div
        data-test-id={`member-card-${member.id}`}
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          transition: "box-shadow 0.2s, transform 0.2s",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {/* Photo */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "#e5e7eb",
            marginBottom: "12px",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {member.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.photoUrl}
              alt={`${member.firstName} ${member.lastName}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <span style={{ fontSize: "32px", color: "#9ca3af" }}>
              {member.firstName[0]}
              {member.lastName[0]}
            </span>
          )}
        </div>

        {/* Name */}
        <div
          style={{
            fontWeight: 600,
            fontSize: "16px",
            color: "#1f2937",
            marginBottom: "4px",
          }}
        >
          {member.firstName} {member.lastName}
        </div>

        {/* Member Since */}
        <div
          style={{
            fontSize: "14px",
            color: "#6b7280",
            marginBottom: "8px",
          }}
        >
          Member since {joinYear}
        </div>

        {/* Committees */}
        {member.committees.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", justifyContent: "center" }}>
            {member.committees.slice(0, 2).map((c) => (
              <span
                key={c.id}
                style={{
                  fontSize: "12px",
                  backgroundColor: "#eff6ff",
                  color: "#1d4ed8",
                  padding: "2px 8px",
                  borderRadius: "12px",
                }}
              >
                {c.name}
              </span>
            ))}
            {member.committees.length > 2 && (
              <span
                style={{
                  fontSize: "12px",
                  backgroundColor: "#f3f4f6",
                  color: "#6b7280",
                  padding: "2px 8px",
                  borderRadius: "12px",
                }}
              >
                +{member.committees.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export function MemberDirectoryClient({
  members,
  committees,
}: MemberDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCommittee, setSelectedCommittee] = useState<string>("");

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        member.firstName.toLowerCase().includes(searchLower) ||
        member.lastName.toLowerCase().includes(searchLower) ||
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchLower);

      // Committee filter
      const matchesCommittee =
        selectedCommittee === "" ||
        member.committees.some((c) => c.id === selectedCommittee);

      return matchesSearch && matchesCommittee;
    });
  }, [members, searchQuery, selectedCommittee]);

  return (
    <div>
      {/* Search and Filter Bar */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        {/* Search Input */}
        <div style={{ flex: "1 1 300px" }}>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-test-id="directory-search"
            style={{
              width: "100%",
              padding: "10px 16px",
              fontSize: "16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              outline: "none",
            }}
          />
        </div>

        {/* Committee Filter */}
        <div style={{ flex: "0 0 200px" }}>
          <select
            value={selectedCommittee}
            onChange={(e) => setSelectedCommittee(e.target.value)}
            data-test-id="directory-committee-filter"
            style={{
              width: "100%",
              padding: "10px 16px",
              fontSize: "16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              backgroundColor: "white",
              cursor: "pointer",
            }}
          >
            <option value="">All Committees</option>
            {committees.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div
        style={{
          fontSize: "14px",
          color: "#6b7280",
          marginBottom: "16px",
        }}
      >
        Showing {filteredMembers.length} of {members.length} members
      </div>

      {/* Member Grid */}
      <div
        data-test-id="member-directory-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "16px",
        }}
      >
        {filteredMembers.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <div
          data-test-id="directory-empty-state"
          style={{
            textAlign: "center",
            padding: "48px 24px",
            color: "#6b7280",
          }}
        >
          <p style={{ fontSize: "18px", marginBottom: "8px" }}>
            No members found
          </p>
          <p style={{ fontSize: "14px" }}>
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}
