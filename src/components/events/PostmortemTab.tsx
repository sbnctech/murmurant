/**
 * PostmortemTab - Chair Notebook / Event Archive Component
 *
 * Displays and allows editing of event postmortem notes.
 * Access control is enforced by the API; this component handles UI state.
 *
 * States:
 * - No postmortem: Shows "Start Chair Notebook" button
 * - DRAFT/UNLOCKED: Full edit form
 * - SUBMITTED: Read-only with pending badge
 * - APPROVED: Read-only with approval info
 *
 * Copyright © 2025 Murmurant, Inc.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import {  } from "@/lib/timezone";
import { formatDateLocaleDefault } from "@/lib/timezone";

interface Postmortem {
  id: string;
  eventId: string;
  createdAt: string;
  updatedAt: string;
  setupNotes: string | null;
  contactsUsed: string | null;
  timelineNotes: string | null;
  attendanceRating: number | null;
  logisticsRating: number | null;
  satisfactionRating: number | null;
  whatWorked: string | null;
  whatDidNot: string | null;
  whatToChangeNextTime: string | null;
  internalOnly: boolean;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "UNLOCKED";
  approvedAt: string | null;
  createdBy: { id: string; name: string } | null;
  approver: { id: string; name: string } | null;
  // Author contact info (captured at submission)
  submittedAt: string | null;
  submittedByName: string | null;
  submittedByEmail: string | null;
  submittedByPhone: string | null;
}

interface PostmortemTabProps {
  eventId: string;
  isEventChair: boolean;
  isVPActivities: boolean;
  isAdmin: boolean;
  eventStatus: string;
}

const ratingLabels: Record<number, string> = {
  1: "Poor",
  2: "Below Average",
  3: "Average",
  4: "Good",
  5: "Excellent",
};

function StarRating({
  value,
  onChange,
  disabled,
  label,
}: {
  value: number | null;
  onChange: (value: number) => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label
        style={{
          display: "block",
          fontSize: "14px",
          fontWeight: 500,
          marginBottom: "8px",
          color: "#374151",
        }}
      >
        {label}
      </label>
      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            style={{
              background: "none",
              border: "none",
              cursor: disabled ? "default" : "pointer",
              fontSize: "24px",
              color: value && star <= value ? "#f59e0b" : "#d1d5db",
              padding: "2px",
            }}
            aria-label={`${star} star`}
          >
            ★
          </button>
        ))}
        {value && (
          <span
            style={{
              marginLeft: "8px",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            {ratingLabels[value]}
          </span>
        )}
      </div>
    </div>
  );
}

export default function PostmortemTab({
  eventId,
  isEventChair,
  isVPActivities,
  isAdmin,
  eventStatus,
}: PostmortemTabProps) {
  const [postmortem, setPostmortem] = useState<Postmortem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Postmortem>>({});

  // Can event have postmortem?
  const canHavePostmortem =
    eventStatus === "COMPLETED" ||
    eventStatus === "CANCELED" ||
    eventStatus === "CANCELLED";

  // Can user edit?
  const canEdit =
    (isEventChair || isAdmin) &&
    (!postmortem || postmortem.status === "DRAFT" || postmortem.status === "UNLOCKED");

  // Can user approve/return/unlock?
  const canManage = isVPActivities || isAdmin;

  // Fetch postmortem
  const fetchPostmortem = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/events/${eventId}/postmortem`, {
        credentials: "include",
      });

      if (res.status === 404) {
        setPostmortem(null);
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch postmortem");
      }

      const data = await res.json();
      setPostmortem(data.postmortem);
      setFormData(data.postmortem);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchPostmortem();
  }, [fetchPostmortem]);

  // Create postmortem
  const handleCreate = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/events/${eventId}/postmortem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create postmortem");
      }

      const data = await res.json();
      setPostmortem(data.postmortem);
      setFormData(data.postmortem);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  // Save changes
  const handleSave = async () => {
    if (!postmortem) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/events/${eventId}/postmortem`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          setupNotes: formData.setupNotes,
          contactsUsed: formData.contactsUsed,
          timelineNotes: formData.timelineNotes,
          attendanceRating: formData.attendanceRating,
          logisticsRating: formData.logisticsRating,
          satisfactionRating: formData.satisfactionRating,
          whatWorked: formData.whatWorked,
          whatDidNot: formData.whatDidNot,
          whatToChangeNextTime: formData.whatToChangeNextTime,
          internalOnly: formData.internalOnly,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save");
      }

      const data = await res.json();
      setPostmortem(data.postmortem);
      setFormData(data.postmortem);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Status actions
  const handleStatusAction = async (action: "submit" | "approve" | "return" | "unlock") => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/events/${eventId}/postmortem/status`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || `Failed to ${action}`);
      }

      await fetchPostmortem();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div
        data-test-id="postmortem-loading"
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#6b7280",
        }}
      >
        Loading...
      </div>
    );
  }

  // Event cannot have postmortem
  if (!canHavePostmortem) {
    return (
      <div
        data-test-id="postmortem-not-available"
        style={{
          padding: "40px",
          textAlign: "center",
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
          color: "#6b7280",
        }}
      >
        <p style={{ margin: 0 }}>
          Chair notebook is available after the event is completed or cancelled.
        </p>
      </div>
    );
  }

  // No postmortem exists
  if (!postmortem) {
    return (
      <div
        data-test-id="postmortem-empty"
        style={{
          padding: "40px",
          textAlign: "center",
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
        }}
      >
        <p
          style={{
            margin: "0 0 16px 0",
            color: "#6b7280",
          }}
        >
          No chair notebook for this event.
        </p>
        {(isEventChair || isAdmin) && (
          <button
            data-test-id="postmortem-create-btn"
            onClick={handleCreate}
            disabled={saving}
            style={{
              padding: "10px 20px",
              backgroundColor: "#4f46e5",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: saving ? "wait" : "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            {saving ? "Creating..." : "Start Chair Notebook"}
          </button>
        )}
      </div>
    );
  }

  // Status badge colors
  const statusColors: Record<string, { bg: string; text: string }> = {
    DRAFT: { bg: "#fef3c7", text: "#92400e" },
    SUBMITTED: { bg: "#dbeafe", text: "#1e40af" },
    APPROVED: { bg: "#dcfce7", text: "#166534" },
    UNLOCKED: { bg: "#fce7f3", text: "#9d174d" },
  };

  const statusColor = statusColors[postmortem.status] || statusColors.DRAFT;

  return (
    <div data-test-id="postmortem-tab" style={{ padding: "20px" }}>
      {/* Error display */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#fef2f2",
            color: "#991b1b",
            borderRadius: "6px",
            marginBottom: "16px",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {/* Header with status */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          Chair Notebook
        </h3>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span
            data-test-id="postmortem-status"
            style={{
              padding: "4px 10px",
              backgroundColor: statusColor.bg,
              color: statusColor.text,
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {postmortem.status}
          </span>
          {postmortem.status === "UNLOCKED" && (
            <span
              style={{
                fontSize: "12px",
                color: "#6b7280",
                fontStyle: "italic",
              }}
            >
              Unlocked for editing
            </span>
          )}
        </div>
      </div>

      {/* Approval info */}
      {postmortem.status === "APPROVED" && postmortem.approver && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#f0fdf4",
            borderRadius: "6px",
            marginBottom: "20px",
            border: "1px solid #bbf7d0",
            fontSize: "13px",
            color: "#166534",
          }}
        >
          Approved by {postmortem.approver.name} on{" "}
          {formatDateLocaleDefault(new Date(postmortem.approvedAt!))}
        </div>
      )}

      {/* Author contact info - shown for submitted/approved postmortems */}
      {postmortem.submittedByName && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#f8fafc",
            borderRadius: "6px",
            marginBottom: "20px",
            border: "1px solid #e2e8f0",
            fontSize: "13px",
            color: "#475569",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
            Chair Contact Information
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div>
              <strong>Name:</strong> {postmortem.submittedByName}
            </div>
            {postmortem.submittedByEmail && (
              <div>
                <strong>Email:</strong>{" "}
                <a
                  href={`mailto:${postmortem.submittedByEmail}`}
                  style={{ color: "#2563eb" }}
                >
                  {postmortem.submittedByEmail}
                </a>
              </div>
            )}
            {postmortem.submittedByPhone && (
              <div>
                <strong>Phone:</strong>{" "}
                <a
                  href={`tel:${postmortem.submittedByPhone}`}
                  style={{ color: "#2563eb" }}
                >
                  {postmortem.submittedByPhone}
                </a>
              </div>
            )}
            {postmortem.submittedAt && (
              <div style={{ marginTop: "4px", fontSize: "12px", color: "#64748b" }}>
                Submitted on {formatDateLocaleDefault(new Date(postmortem.submittedAt))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Preparation Notes Section */}
        <section>
          <h4
            style={{
              margin: "0 0 12px 0",
              fontSize: "15px",
              fontWeight: 600,
              color: "#374151",
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: "8px",
            }}
          >
            Preparation Notes
          </h4>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                marginBottom: "6px",
                color: "#374151",
              }}
            >
              Setup Notes
            </label>
            <textarea
              data-test-id="postmortem-setup-notes"
              value={formData.setupNotes || ""}
              onChange={(e) =>
                setFormData({ ...formData, setupNotes: e.target.value })
              }
              disabled={!canEdit}
              placeholder="Room setup, AV requirements, signage..."
              style={{
                width: "100%",
                minHeight: "80px",
                padding: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                resize: "vertical",
                backgroundColor: canEdit ? "#fff" : "#f9fafb",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                marginBottom: "6px",
                color: "#374151",
              }}
            >
              Contacts Used
            </label>
            <textarea
              data-test-id="postmortem-contacts"
              value={formData.contactsUsed || ""}
              onChange={(e) =>
                setFormData({ ...formData, contactsUsed: e.target.value })
              }
              disabled={!canEdit}
              placeholder="Vendor names, phone numbers, emails..."
              style={{
                width: "100%",
                minHeight: "80px",
                padding: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                resize: "vertical",
                backgroundColor: canEdit ? "#fff" : "#f9fafb",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                marginBottom: "6px",
                color: "#374151",
              }}
            >
              Timeline Notes
            </label>
            <textarea
              data-test-id="postmortem-timeline"
              value={formData.timelineNotes || ""}
              onChange={(e) =>
                setFormData({ ...formData, timelineNotes: e.target.value })
              }
              disabled={!canEdit}
              placeholder="Day-of schedule, key milestones..."
              style={{
                width: "100%",
                minHeight: "80px",
                padding: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                resize: "vertical",
                backgroundColor: canEdit ? "#fff" : "#f9fafb",
              }}
            />
          </div>
        </section>

        {/* Success Ratings Section */}
        <section>
          <h4
            style={{
              margin: "0 0 12px 0",
              fontSize: "15px",
              fontWeight: 600,
              color: "#374151",
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: "8px",
            }}
          >
            Success Ratings
          </h4>

          <StarRating
            label="Attendance"
            value={formData.attendanceRating ?? null}
            onChange={(v) => setFormData({ ...formData, attendanceRating: v })}
            disabled={!canEdit}
          />

          <StarRating
            label="Logistics"
            value={formData.logisticsRating ?? null}
            onChange={(v) => setFormData({ ...formData, logisticsRating: v })}
            disabled={!canEdit}
          />

          <StarRating
            label="Member Satisfaction"
            value={formData.satisfactionRating ?? null}
            onChange={(v) => setFormData({ ...formData, satisfactionRating: v })}
            disabled={!canEdit}
          />
        </section>

        {/* Retrospective Section */}
        <section>
          <h4
            style={{
              margin: "0 0 12px 0",
              fontSize: "15px",
              fontWeight: 600,
              color: "#374151",
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: "8px",
            }}
          >
            Retrospective
          </h4>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                marginBottom: "6px",
                color: "#374151",
              }}
            >
              What Worked Well
            </label>
            <textarea
              data-test-id="postmortem-what-worked"
              value={formData.whatWorked || ""}
              onChange={(e) =>
                setFormData({ ...formData, whatWorked: e.target.value })
              }
              disabled={!canEdit}
              placeholder="Things that went well..."
              style={{
                width: "100%",
                minHeight: "80px",
                padding: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                resize: "vertical",
                backgroundColor: canEdit ? "#fff" : "#f9fafb",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                marginBottom: "6px",
                color: "#374151",
              }}
            >
              What Didn&apos;t Work
            </label>
            <textarea
              data-test-id="postmortem-what-didnt"
              value={formData.whatDidNot || ""}
              onChange={(e) =>
                setFormData({ ...formData, whatDidNot: e.target.value })
              }
              disabled={!canEdit}
              placeholder="Things that didn't work..."
              style={{
                width: "100%",
                minHeight: "80px",
                padding: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                resize: "vertical",
                backgroundColor: canEdit ? "#fff" : "#f9fafb",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                marginBottom: "6px",
                color: "#374151",
              }}
            >
              What to Change Next Time
            </label>
            <textarea
              data-test-id="postmortem-changes"
              value={formData.whatToChangeNextTime || ""}
              onChange={(e) =>
                setFormData({ ...formData, whatToChangeNextTime: e.target.value })
              }
              disabled={!canEdit}
              placeholder="Recommendations for future chairs..."
              style={{
                width: "100%",
                minHeight: "80px",
                padding: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                resize: "vertical",
                backgroundColor: canEdit ? "#fff" : "#f9fafb",
              }}
            />
          </div>
        </section>

        {/* Meta info */}
        <div
          style={{
            fontSize: "12px",
            color: "#6b7280",
            borderTop: "1px solid #e5e7eb",
            paddingTop: "12px",
          }}
        >
          {postmortem.createdBy && (
            <p style={{ margin: "0 0 4px 0" }}>
              Created by {postmortem.createdBy.name} on{" "}
              {formatDateLocaleDefault(new Date(postmortem.createdAt))}
            </p>
          )}
          <p style={{ margin: 0 }}>
            Last updated: {formatDateLocaleDefault(new Date(postmortem.updatedAt))}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div
        style={{
          marginTop: "24px",
          paddingTop: "16px",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {/* Save button (for chair in edit mode) */}
        {canEdit && (
          <button
            data-test-id="postmortem-save-btn"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "10px 20px",
              backgroundColor: "#4f46e5",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: saving ? "wait" : "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        )}

        {/* Submit button (for chair in DRAFT status) */}
        {canEdit && postmortem.status === "DRAFT" && (
          <button
            data-test-id="postmortem-submit-btn"
            onClick={() => handleStatusAction("submit")}
            disabled={saving}
            style={{
              padding: "10px 20px",
              backgroundColor: "#059669",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: saving ? "wait" : "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Submit for Review
          </button>
        )}

        {/* VP Actions */}
        {canManage && postmortem.status === "SUBMITTED" && (
          <>
            <button
              data-test-id="postmortem-approve-btn"
              onClick={() => handleStatusAction("approve")}
              disabled={saving}
              style={{
                padding: "10px 20px",
                backgroundColor: "#059669",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: saving ? "wait" : "pointer",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              Approve
            </button>
            <button
              data-test-id="postmortem-return-btn"
              onClick={() => handleStatusAction("return")}
              disabled={saving}
              style={{
                padding: "10px 20px",
                backgroundColor: "#f59e0b",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: saving ? "wait" : "pointer",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              Return for Revision
            </button>
          </>
        )}

        {/* Unlock button (VP for APPROVED status) */}
        {canManage && postmortem.status === "APPROVED" && (
          <button
            data-test-id="postmortem-unlock-btn"
            onClick={() => handleStatusAction("unlock")}
            disabled={saving}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6b7280",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: saving ? "wait" : "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Unlock for Editing
          </button>
        )}
      </div>
    </div>
  );
}
