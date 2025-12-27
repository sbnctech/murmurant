"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatClubDate } from "@/lib/timezone";

/**
 * Admin Member Edit Page
 *
 * Allows administrators to:
 * 1. Edit member's personal info
 * 2. Change membership tier
 * 3. Adjust membership dates
 * 4. Add/remove from committees
 * 5. Add internal notes
 * 6. Toggle membership status
 * 7. Save with audit trail note
 */

type MembershipTier = "REGULAR" | "ASSOCIATE" | "HONORARY" | "LIFETIME";
type MembershipStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "EXPIRED";

type Committee = {
  id: string;
  name: string;
  role: string;
};

type InternalNote = {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string;
};

type MemberData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  membershipTier: MembershipTier;
  membershipStatus: MembershipStatus;
  joinedAt: Date;
  expiresAt: Date;
  committees: Committee[];
  notes: InternalNote[];
};

// Mock data
const MOCK_MEMBER: MemberData = {
  id: "member-001",
  firstName: "Jane",
  lastName: "Smith",
  email: "jane.smith@example.com",
  phone: "(805) 555-0123",
  membershipTier: "REGULAR",
  membershipStatus: "ACTIVE",
  joinedAt: new Date("2022-03-15"),
  expiresAt: new Date("2025-06-30"),
  committees: [
    { id: "c1", name: "Events Committee", role: "Chair" },
    { id: "c2", name: "Membership Committee", role: "Member" },
  ],
  notes: [
    {
      id: "n1",
      content: "Excellent volunteer. Very active in club activities.",
      createdAt: new Date("2024-06-15"),
      createdBy: "Admin User",
    },
  ],
};

const AVAILABLE_COMMITTEES = [
  { id: "c1", name: "Events Committee" },
  { id: "c2", name: "Membership Committee" },
  { id: "c3", name: "Board of Directors" },
  { id: "c4", name: "Finance Committee" },
  { id: "c5", name: "Communications Committee" },
];

const TIER_OPTIONS: { value: MembershipTier; label: string }[] = [
  { value: "REGULAR", label: "Regular" },
  { value: "ASSOCIATE", label: "Associate" },
  { value: "HONORARY", label: "Honorary" },
  { value: "LIFETIME", label: "Lifetime" },
];

const STATUS_OPTIONS: { value: MembershipStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "EXPIRED", label: "Expired" },
];

const ROLE_OPTIONS = ["Chair", "Co-Chair", "Member", "Secretary", "Treasurer"];

export default function AdminMemberEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, _setError] = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tier, setTier] = useState<MembershipTier>("REGULAR");
  const [status, setStatus] = useState<MembershipStatus>("ACTIVE");
  const [joinedAt, setJoinedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [auditNote, setAuditNote] = useState("");

  // Committee add modal
  const [showAddCommittee, setShowAddCommittee] = useState(false);
  const [selectedCommittee, setSelectedCommittee] = useState("");
  const [selectedRole, setSelectedRole] = useState("Member");

  useEffect(() => {
    async function loadMember() {
      const resolvedParams = await params;
      setMemberId(resolvedParams.id);

      // Simulate API fetch
      await new Promise((resolve) => setTimeout(resolve, 300));

      const member = MOCK_MEMBER;
      setFirstName(member.firstName);
      setLastName(member.lastName);
      setEmail(member.email);
      setPhone(member.phone);
      setTier(member.membershipTier);
      setStatus(member.membershipStatus);
      setJoinedAt(member.joinedAt.toISOString().split("T")[0]);
      setExpiresAt(member.expiresAt.toISOString().split("T")[0]);
      setCommittees(member.committees);
      setNotes(member.notes);
      setLoading(false);
    }

    loadMember();
  }, [params]);

  const handleAddCommittee = () => {
    if (!selectedCommittee) return;

    const committee = AVAILABLE_COMMITTEES.find((c) => c.id === selectedCommittee);
    if (!committee) return;

    if (committees.some((c) => c.id === selectedCommittee)) {
      alert("Member is already on this committee");
      return;
    }

    setCommittees([...committees, { id: committee.id, name: committee.name, role: selectedRole }]);
    setShowAddCommittee(false);
    setSelectedCommittee("");
    setSelectedRole("Member");
  };

  const handleRemoveCommittee = (committeeId: string) => {
    setCommittees(committees.filter((c) => c.id !== committeeId));
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    const note: InternalNote = {
      id: `n-${Date.now()}`,
      content: newNote.trim(),
      createdAt: new Date(),
      createdBy: "Current Admin",
    };

    setNotes([note, ...notes]);
    setNewNote("");
  };

  const handleSave = async () => {
    if (!auditNote.trim()) {
      alert("Please provide an audit trail note describing your changes");
      return;
    }

    setSaving(true);

    // Simulate API save
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("[AUDIT] Member update:", {
      memberId,
      changes: { firstName, lastName, email, phone, tier, status, joinedAt, expiresAt, committees },
      auditNote,
    });

    setSaving(false);
    alert("Member updated successfully");
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>Loading member...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p style={{ color: "#DC2626" }}>{error}</p>
        <Link href="/admin/members" style={{ color: "#2563EB" }}>
          Back to Members
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Link href="/admin/members" style={{ color: "#6B7280", textDecoration: "none", fontSize: 14 }}>
            ← Back to Members
          </Link>
          <h1 style={{ fontSize: 28, fontWeight: 600, marginTop: 8, marginBottom: 0 }}>
            Edit Member
          </h1>
        </div>
        <div
          style={{
            padding: "4px 12px",
            borderRadius: 4,
            backgroundColor: status === "ACTIVE" ? "#DCFCE7" : "#FEE2E2",
            color: status === "ACTIVE" ? "#166534" : "#991B1B",
            fontWeight: 500,
          }}
        >
          {status}
        </div>
      </div>

      {/* Personal Information */}
      <section style={{ marginBottom: 32, padding: 20, backgroundColor: "#F9FAFB", borderRadius: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Personal Information</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #D1D5DB",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #D1D5DB",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #D1D5DB",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #D1D5DB",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>
        </div>
      </section>

      {/* Membership Details */}
      <section style={{ marginBottom: 32, padding: 20, backgroundColor: "#F9FAFB", borderRadius: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Membership Details</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
              Membership Tier
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as MembershipTier)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #D1D5DB",
                borderRadius: 6,
                fontSize: 14,
                backgroundColor: "white",
              }}
            >
              {TIER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
              Membership Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MembershipStatus)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #D1D5DB",
                borderRadius: 6,
                fontSize: 14,
                backgroundColor: "white",
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
              Joined Date
            </label>
            <input
              type="date"
              value={joinedAt}
              onChange={(e) => setJoinedAt(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #D1D5DB",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
              Expiration Date
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #D1D5DB",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>
        </div>
      </section>

      {/* Committee Assignments */}
      <section style={{ marginBottom: 32, padding: 20, backgroundColor: "#F9FAFB", borderRadius: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Committee Assignments</h2>
          <button
            onClick={() => setShowAddCommittee(true)}
            style={{
              padding: "6px 12px",
              backgroundColor: "#2563EB",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            + Add Committee
          </button>
        </div>

        {committees.length === 0 ? (
          <p style={{ color: "#6B7280", fontStyle: "italic" }}>No committee assignments</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {committees.map((committee) => (
              <div
                key={committee.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 12,
                  backgroundColor: "white",
                  borderRadius: 6,
                  border: "1px solid #E5E7EB",
                }}
              >
                <div>
                  <span style={{ fontWeight: 500 }}>{committee.name}</span>
                  <span
                    style={{
                      marginLeft: 8,
                      padding: "2px 8px",
                      backgroundColor: "#E0E7FF",
                      color: "#4338CA",
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  >
                    {committee.role}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveCommittee(committee.id)}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "#FEE2E2",
                    color: "#991B1B",
                    border: "none",
                    borderRadius: 4,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Committee Modal */}
        {showAddCommittee && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: 12,
                padding: 24,
                width: 400,
                maxWidth: "90%",
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Add to Committee</h3>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                  Committee
                </label>
                <select
                  value={selectedCommittee}
                  onChange={(e) => setSelectedCommittee(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #D1D5DB",
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                >
                  <option value="">Select a committee...</option>
                  {AVAILABLE_COMMITTEES.filter((c) => !committees.some((cc) => cc.id === c.id)).map(
                    (c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #D1D5DB",
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => setShowAddCommittee(false)}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    backgroundColor: "white",
                    color: "#374151",
                    border: "1px solid #D1D5DB",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCommittee}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    backgroundColor: "#2563EB",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Internal Notes */}
      <section style={{ marginBottom: 32, padding: 20, backgroundColor: "#F9FAFB", borderRadius: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Internal Notes</h2>

        <div style={{ marginBottom: 16 }}>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a new internal note..."
            style={{
              width: "100%",
              padding: 12,
              border: "1px solid #D1D5DB",
              borderRadius: 6,
              fontSize: 14,
              minHeight: 80,
              resize: "vertical",
            }}
          />
          <button
            onClick={handleAddNote}
            disabled={!newNote.trim()}
            style={{
              marginTop: 8,
              padding: "8px 16px",
              backgroundColor: newNote.trim() ? "#2563EB" : "#9CA3AF",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: newNote.trim() ? "pointer" : "not-allowed",
            }}
          >
            Add Note
          </button>
        </div>

        {notes.length === 0 ? (
          <p style={{ color: "#6B7280", fontStyle: "italic" }}>No internal notes</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {notes.map((note) => (
              <div
                key={note.id}
                style={{
                  padding: 12,
                  backgroundColor: "white",
                  borderRadius: 6,
                  border: "1px solid #E5E7EB",
                }}
              >
                <p style={{ margin: 0, marginBottom: 8 }}>{note.content}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#6B7280" }}>
                  {note.createdBy} - {formatClubDate(note.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Audit Trail Note & Save */}
      <section style={{ marginBottom: 32, padding: 20, backgroundColor: "#FEF3C7", borderRadius: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Audit Trail</h2>
        <p style={{ fontSize: 14, color: "#92400E", marginBottom: 16 }}>
          Please describe why you are making these changes. This will be recorded in the audit log.
        </p>
        <textarea
          value={auditNote}
          onChange={(e) => setAuditNote(e.target.value)}
          placeholder="e.g., Updating membership tier per board decision on 12/15..."
          style={{
            width: "100%",
            padding: 12,
            border: "1px solid #F59E0B",
            borderRadius: 6,
            fontSize: 14,
            minHeight: 80,
            resize: "vertical",
          }}
        />
      </section>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <Link
          href="/admin/members"
          style={{
            padding: "12px 24px",
            backgroundColor: "white",
            color: "#374151",
            border: "1px solid #D1D5DB",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={saving || !auditNote.trim()}
          style={{
            padding: "12px 24px",
            backgroundColor: saving || !auditNote.trim() ? "#9CA3AF" : "#10B981",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: saving || !auditNote.trim() ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
