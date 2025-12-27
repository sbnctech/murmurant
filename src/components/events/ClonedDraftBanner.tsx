"use client";

import { formatDateLocale } from "@/lib/timezone";
/**
 * ClonedDraftBanner - Visual warning for cloned draft events
 *
 * Displays prominently when editing a cloned event with placeholder dates.
 * Designed to prevent accidental submission without proper configuration.
 *
 * Safety features:
 * - Eye-catching amber/yellow styling
 * - Clear action required message
 * - Explains what needs to be done before submission
 *
 * Charter P6: Cloned events start as drafts requiring explicit approval
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

interface ClonedDraftBannerProps {
  /** Title of the original event this was cloned from (optional) */
  clonedFromTitle?: string;
  /** When the clone was created */
  clonedAt?: string;
  /** Whether the event has placeholder dates that need to be set */
  hasPlaceholderDates: boolean;
  /** Whether an event chair needs to be assigned */
  needsChairAssignment?: boolean;
}

export function ClonedDraftBanner({
  clonedFromTitle,
  clonedAt,
  hasPlaceholderDates,
  needsChairAssignment = false,
}: ClonedDraftBannerProps) {
  const formattedDate = clonedAt
    ? formatDateLocale(new Date(clonedAt), { year: "numeric", month: "short", day: "numeric" }, "en-US")
    : null;

  const actionItems: string[] = [];
  if (hasPlaceholderDates) {
    actionItems.push("Set event date and time");
  }
  if (needsChairAssignment) {
    actionItems.push("Assign an event chair");
  }

  return (
    <div
      data-test-id="cloned-draft-banner"
      style={{
        padding: "16px 20px",
        backgroundColor: "#fef3c7",
        border: "1px solid #f59e0b",
        borderRadius: "8px",
        marginBottom: "20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "8px",
        }}
      >
        <span style={{ fontSize: "20px" }}>&#128203;</span>
        <span
          style={{
            fontWeight: 600,
            fontSize: "15px",
            color: "#92400e",
          }}
        >
          Cloned Draft Event
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "2px 8px",
            backgroundColor: "#fbbf24",
            color: "#78350f",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase" as const,
            letterSpacing: "0.5px",
          }}
        >
          Action Required
        </span>
      </div>

      {/* Description */}
      <p
        style={{
          margin: "0 0 12px 0",
          fontSize: "14px",
          color: "#78350f",
          lineHeight: 1.5,
        }}
      >
        This event was cloned
        {clonedFromTitle && (
          <>
            {" "}
            from <strong>{clonedFromTitle}</strong>
          </>
        )}
        {formattedDate && <> on {formattedDate}</>}. The structure and ticket
        tiers have been copied, but you must complete the following before
        submitting for approval:
      </p>

      {/* Action items */}
      {actionItems.length > 0 && (
        <ul
          style={{
            margin: "0 0 12px 0",
            padding: "0 0 0 20px",
            fontSize: "14px",
            color: "#78350f",
          }}
        >
          {actionItems.map((item) => (
            <li key={item} style={{ marginBottom: "4px" }}>
              <span style={{ fontWeight: 500 }}>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {/* What's preserved */}
      <div
        style={{
          marginTop: "12px",
          padding: "10px 12px",
          backgroundColor: "#fef9c3",
          borderRadius: "6px",
          fontSize: "12px",
          color: "#854d0e",
        }}
      >
        <strong>Preserved from original:</strong> Title, description, category,
        location, ticket tier structure, and institutional notes (lessons
        learned, handoff notes).
      </div>

      {/* Safety note */}
      <p
        style={{
          margin: "12px 0 0 0",
          fontSize: "12px",
          color: "#a16207",
          fontStyle: "italic",
        }}
      >
        This event cannot be submitted for approval or published until all
        required fields are configured.
      </p>
    </div>
  );
}

export default ClonedDraftBanner;
