"use client";

/**
 * Event Derived Preview Demo
 *
 * Interactive demo showing how event fields are derived from user inputs.
 * Demonstrates the intelligence in the event creation system.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { useState } from "react";
import {
  generateDerivedPreview,
  validateEventFields,
  type EventStatus,
  type UrgencyLevel,
} from "@/lib/events";
import { formatClubTime } from "@/lib/timezone";

const urgencyColors: Record<UrgencyLevel, { bg: string; text: string }> = {
  none: { bg: "#f0f0f0", text: "#666" },
  low: { bg: "#e7f3ff", text: "#0066cc" },
  medium: { bg: "#fff3e0", text: "#e65100" },
  high: { bg: "#ffebee", text: "#c62828" },
  urgent: { bg: "#d32f2f", text: "#fff" },
};

const statusColors: Record<EventStatus, { bg: string; text: string }> = {
  draft: { bg: "#e0e0e0", text: "#555" },
  upcoming: { bg: "#d4edda", text: "#155724" },
  ongoing: { bg: "#cce5ff", text: "#004085" },
  past: { bg: "#e2e3e5", text: "#383d41" },
};

export default function EventDerivedPreviewDemo() {
  const now = new Date();

  // Form state
  const [title, setTitle] = useState("Book Club Meeting");
  const [startDate, setStartDate] = useState(
    new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState<string>("20");
  const [registeredCount, setRegisteredCount] = useState<string>("15");
  const [isPublished, setIsPublished] = useState(true);

  // Parse inputs
  const startDateTime = new Date(`${startDate}T${startTime}:00`);
  const endDateTime = endTime ? new Date(`${startDate}T${endTime}:00`) : null;
  const capacityNum = capacity === "" ? null : parseInt(capacity, 10);
  const registeredNum = parseInt(registeredCount, 10) || 0;

  // Generate preview
  const preview = generateDerivedPreview({
    title,
    startTime: startDateTime,
    endTime: endDateTime,
    capacity: isNaN(capacityNum as number) ? null : capacityNum,
    registeredCount: registeredNum,
    isPublished,
    now,
  });

  // Validate
  const errors = validateEventFields({
    title,
    startTime: startDateTime,
    endTime: endDateTime,
    capacity: isNaN(capacityNum as number) ? null : capacityNum,
  });

  const urgencyStyle = urgencyColors[preview.urgency];
  const statusStyle = statusColors[preview.status];

  return (
    <section
      data-test-id="demo-event-preview-section"
      style={{
        marginBottom: "32px",
        padding: "16px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "#fff",
      }}
    >
      <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
        Event Field Intelligence Demo
      </h2>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "16px" }}>
        See how event fields are automatically derived as you type. These
        calculations reduce admin burden and ensure consistent behavior.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Input Form */}
        <div>
          <h3 style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>
            Input Fields (Human-Entered)
          </h3>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title..."
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>
              End Time (optional - defaults to +2 hours)
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="Leave blank for default"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>
                Capacity (blank = unlimited)
              </label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Unlimited"
                min="0"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>
                Registered Count (simulated)
              </label>
              <input
                type="number"
                value={registeredCount}
                onChange={(e) => setRegisteredCount(e.target.value)}
                min="0"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              <span style={{ fontSize: "14px" }}>Published</span>
            </label>
          </div>
        </div>

        {/* Derived Preview */}
        <div>
          <h3 style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>
            Derived Fields (Auto-Calculated)
          </h3>

          <div
            style={{
              padding: "12px",
              backgroundColor: "#fafafa",
              borderRadius: "8px",
              border: "1px solid #eee",
            }}
          >
            {/* Status & Urgency Badges */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: "4px",
                  fontSize: "13px",
                  fontWeight: 500,
                  backgroundColor: statusStyle.bg,
                  color: statusStyle.text,
                }}
              >
                {preview.statusLabel}
              </span>
              {preview.urgency !== "none" && (
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: "4px",
                    fontSize: "13px",
                    fontWeight: 500,
                    backgroundColor: urgencyStyle.bg,
                    color: urgencyStyle.text,
                  }}
                >
                  {preview.urgencyLabel}
                </span>
              )}
            </div>

            {/* Derived Values Table */}
            <table style={{ width: "100%", fontSize: "13px" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "6px 0", color: "#666" }}>Inferred Category:</td>
                  <td style={{ padding: "6px 0", fontWeight: 500 }}>
                    {preview.inferredCategory || (
                      <span style={{ color: "#999", fontStyle: "italic" }}>None detected</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 0", color: "#666" }}>Effective End Time:</td>
                  <td style={{ padding: "6px 0" }}>
                    {formatClubTime(preview.effectiveEndTime)}
                    {!endTime && (
                      <span style={{ color: "#888", fontSize: "12px", marginLeft: "8px" }}>
                        (default +2hrs)
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 0", color: "#666" }}>Spots Label:</td>
                  <td style={{ padding: "6px 0" }}>{preview.spotsLabel}</td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 0", color: "#666" }}>Days Until:</td>
                  <td style={{ padding: "6px 0" }}>
                    {preview.daysUntil < 0
                      ? `${Math.abs(preview.daysUntil)} days ago`
                      : preview.daysUntil === 0
                        ? "Today"
                        : preview.daysUntil === 1
                          ? "Tomorrow"
                          : `${preview.daysUntil} days`}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 0", color: "#666" }}>Is Today:</td>
                  <td style={{ padding: "6px 0" }}>{preview.isToday ? "Yes" : "No"}</td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 0", color: "#666" }}>Is Tomorrow:</td>
                  <td style={{ padding: "6px 0" }}>{preview.isTomorrow ? "Yes" : "No"}</td>
                </tr>
              </tbody>
            </table>

            {/* Validation Errors */}
            {errors.length > 0 && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "8px 12px",
                  backgroundColor: "#ffebee",
                  borderRadius: "4px",
                  border: "1px solid #ffcdd2",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 500, color: "#c62828", marginBottom: "4px" }}>
                  Validation Errors:
                </div>
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "#c62828" }}>
                  {errors.map((err, i) => (
                    <li key={i}>
                      <strong>{err.field}:</strong> {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Category Keywords */}
          <div style={{ marginTop: "16px", fontSize: "12px", color: "#888" }}>
            <strong>Category Detection Keywords:</strong>
            <br />
            Luncheon, Book Club, Wine, Hike/Walk, Golf, Bridge, Orientation, Board Meeting
          </div>
        </div>
      </div>
    </section>
  );
}
