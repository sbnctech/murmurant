/**
 * Event Form Component
 *
 * Reusable form for creating and editing events with clear field intelligence:
 * - Required fields: Must be entered by humans
 * - Optional fields: Can be entered by humans
 * - Calculated fields: Derived automatically by ClubOS
 *
 * Charter: P1 (explicit state), N4 (no hidden rules)
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  generateDerivedPreview,
  validateEventFields,
  type EventStatus,
  type UrgencyLevel,
  type EventValidationError,
} from "@/lib/events";

// ============================================================================
// TYPES
// ============================================================================

export interface EventFormData {
  title: string;
  description: string;
  category: string;
  location: string;
  startTime: string; // ISO string for datetime-local input
  endTime: string;
  capacity: string; // String for input, parsed to number
  isPublished: boolean;
  eventChairId: string;
}

interface EventFormProps {
  initialData?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => Promise<void>;
  onCancel?: () => void;
  isEditing?: boolean;
  registeredCount?: number;
}

// ============================================================================
// FIELD METADATA - Single source of truth for field intelligence
// ============================================================================

interface FieldMeta {
  type: "required" | "optional" | "calculated";
  label: string;
  tooltip?: string;
  placeholder?: string;
}

const FIELD_METADATA: Record<string, FieldMeta> = {
  // REQUIRED FIELDS - Humans must enter
  title: {
    type: "required",
    label: "Event Title",
    placeholder: "e.g., Monthly Wine Tasting",
  },
  startTime: {
    type: "required",
    label: "Start Date & Time",
    tooltip: "When the event begins. Used to calculate status and urgency.",
  },

  // OPTIONAL FIELDS - Humans can enter
  description: {
    type: "optional",
    label: "Description",
    placeholder: "What members should know about this event...",
  },
  category: {
    type: "optional",
    label: "Category",
    tooltip: "If left blank, ClubOS may suggest one based on the title.",
    placeholder: "e.g., Wine, Golf, Luncheon",
  },
  location: {
    type: "optional",
    label: "Location",
    placeholder: "e.g., Santa Barbara Country Club",
  },
  endTime: {
    type: "optional",
    label: "End Time",
    tooltip: "If not set, ClubOS defaults to 2 hours after start time.",
  },
  capacity: {
    type: "optional",
    label: "Capacity",
    tooltip: "Leave blank for unlimited. ClubOS will track spots remaining.",
    placeholder: "e.g., 30",
  },
  isPublished: {
    type: "optional",
    label: "Published",
    tooltip: "Draft events are only visible to admins.",
  },
  eventChairId: {
    type: "optional",
    label: "Event Chair",
    tooltip: "The member responsible for this event.",
  },

  // CALCULATED FIELDS - Derived automatically
  status: {
    type: "calculated",
    label: "Status",
    tooltip: "Derived from start/end time and publication state.",
  },
  spotsRemaining: {
    type: "calculated",
    label: "Spots Remaining",
    tooltip: "Calculated as: capacity - registered count.",
  },
  registrationStatus: {
    type: "calculated",
    label: "Registration Status",
    tooltip: "Automatically determined: Open, Full, or Waitlist.",
  },
  urgency: {
    type: "calculated",
    label: "Urgency",
    tooltip: "Based on time until event and capacity remaining.",
  },
  effectiveEndTime: {
    type: "calculated",
    label: "Effective End Time",
    tooltip: "Your end time, or start + 2 hours if not specified.",
  },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Field type badge - visually indicates required/optional/calculated
 */
function FieldTypeBadge({ type }: { type: "required" | "optional" | "calculated" }) {
  const styles: Record<string, React.CSSProperties> = {
    required: {
      backgroundColor: "#fef2f2",
      color: "#dc2626",
      border: "1px solid #fecaca",
    },
    optional: {
      backgroundColor: "#f0fdf4",
      color: "#16a34a",
      border: "1px solid #bbf7d0",
    },
    calculated: {
      backgroundColor: "#eff6ff",
      color: "#2563eb",
      border: "1px solid #bfdbfe",
    },
  };

  const labels: Record<string, string> = {
    required: "Required",
    optional: "Optional",
    calculated: "Calculated by ClubOS",
  };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        ...styles[type],
      }}
    >
      {labels[type]}
    </span>
  );
}

/**
 * Info tooltip - explains why a field is automatic
 */
function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);

  return (
    <span
      style={{ position: "relative", display: "inline-block", marginLeft: "6px" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#6b7280"
        strokeWidth="2"
        style={{ cursor: "help", verticalAlign: "middle" }}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
      {show && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: "8px",
            padding: "8px 12px",
            backgroundColor: "#1f2937",
            color: "#fff",
            fontSize: "12px",
            borderRadius: "6px",
            whiteSpace: "nowrap",
            maxWidth: "280px",
            textAlign: "center",
            zIndex: 1000,
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          {text}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              borderWidth: "6px",
              borderStyle: "solid",
              borderColor: "#1f2937 transparent transparent transparent",
            }}
          />
        </div>
      )}
    </span>
  );
}

/**
 * Form field wrapper with label and badge
 */
function FormField({
  fieldKey,
  children,
  error,
}: {
  fieldKey: string;
  children: React.ReactNode;
  error?: string;
}) {
  const meta = FIELD_METADATA[fieldKey];
  if (!meta) return <>{children}</>;

  return (
    <div style={{ marginBottom: "20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "6px",
        }}
      >
        <label
          style={{
            fontWeight: 600,
            fontSize: "14px",
            color: "#374151",
          }}
        >
          {meta.label}
        </label>
        <FieldTypeBadge type={meta.type} />
        {meta.tooltip && <InfoTooltip text={meta.tooltip} />}
      </div>
      {children}
      {error && (
        <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px", margin: "4px 0 0 0" }}>
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Derivation preview panel - shows what ClubOS calculates
 */
function DerivationPreview({
  formData,
  registeredCount,
}: {
  formData: EventFormData;
  registeredCount: number;
}) {
  const [preview, setPreview] = useState<ReturnType<typeof generateDerivedPreview> | null>(null);
  const [inferredCategory, setInferredCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!formData.title || !formData.startTime) {
      setPreview(null);
      return;
    }

    try {
      const startTime = new Date(formData.startTime);
      const endTime = formData.endTime ? new Date(formData.endTime) : null;
      const capacity = formData.capacity ? parseInt(formData.capacity, 10) : null;

      const result = generateDerivedPreview({
        title: formData.title,
        startTime,
        endTime,
        capacity: isNaN(capacity as number) ? null : capacity,
        isPublished: formData.isPublished,
        registeredCount,
      });

      setPreview(result);
      setInferredCategory(result.inferredCategory);
    } catch {
      setPreview(null);
    }
  }, [formData, registeredCount]);

  if (!preview) {
    return (
      <div
        style={{
          backgroundColor: "#f9fafb",
          border: "1px dashed #d1d5db",
          borderRadius: "8px",
          padding: "20px",
          textAlign: "center",
          color: "#6b7280",
        }}
      >
        <p style={{ margin: 0 }}>Enter title and start time to see calculated fields</p>
      </div>
    );
  }

  const statusColors: Record<EventStatus, string> = {
    draft: "#6b7280",
    upcoming: "#16a34a",
    ongoing: "#2563eb",
    past: "#9ca3af",
  };

  const urgencyColors: Record<UrgencyLevel, string> = {
    none: "#6b7280",
    low: "#16a34a",
    medium: "#ca8a04",
    high: "#ea580c",
    urgent: "#dc2626",
  };

  return (
    <div
      style={{
        backgroundColor: "#eff6ff",
        border: "1px solid #bfdbfe",
        borderRadius: "8px",
        padding: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        <span style={{ fontWeight: 600, color: "#1e40af" }}>ClubOS Calculations</span>
        <InfoTooltip text="These values are derived automatically based on your inputs. You don't need to enter them." />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {/* Status */}
        <div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "2px" }}>Status</div>
          <div
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "4px",
              backgroundColor: statusColors[preview.status] + "20",
              color: statusColors[preview.status],
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            {preview.statusLabel}
          </div>
        </div>

        {/* Urgency */}
        <div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "2px" }}>Urgency</div>
          <div
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "4px",
              backgroundColor: urgencyColors[preview.urgency] + "20",
              color: urgencyColors[preview.urgency],
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            {preview.urgencyLabel || "None"}
          </div>
        </div>

        {/* Spots */}
        <div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "2px" }}>Registration</div>
          <div style={{ fontWeight: 500, color: "#374151" }}>{preview.spotsLabel}</div>
        </div>

        {/* Time info */}
        <div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "2px" }}>Time</div>
          <div style={{ fontWeight: 500, color: "#374151" }}>
            {preview.isToday
              ? "Today"
              : preview.isTomorrow
                ? "Tomorrow"
                : preview.daysUntil < 0
                  ? `${Math.abs(preview.daysUntil)} days ago`
                  : preview.daysUntil === 0
                    ? "Today"
                    : `In ${preview.daysUntil} days`}
          </div>
        </div>

        {/* Effective End Time */}
        <div style={{ gridColumn: "1 / -1" }}>
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "2px" }}>
            Effective End Time
            {!formData.endTime && (
              <span style={{ fontStyle: "italic" }}> (defaulted)</span>
            )}
          </div>
          <div style={{ fontWeight: 500, color: "#374151" }}>
            {preview.effectiveEndTime.toLocaleString()}
          </div>
        </div>

        {/* Inferred Category */}
        {inferredCategory && !formData.category && (
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "2px" }}>
              Suggested Category
              <span style={{ fontStyle: "italic" }}> (based on title)</span>
            </div>
            <div
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "4px",
                backgroundColor: "#f0fdf4",
                color: "#16a34a",
                fontWeight: 500,
                fontSize: "14px",
              }}
            >
              {inferredCategory}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const DEFAULT_FORM_DATA: EventFormData = {
  title: "",
  description: "",
  category: "",
  location: "",
  startTime: "",
  endTime: "",
  capacity: "",
  isPublished: false,
  eventChairId: "",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: "14px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  backgroundColor: "#fff",
  boxSizing: "border-box",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "100px",
  resize: "vertical",
};

export default function EventForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
  registeredCount = 0,
}: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    ...DEFAULT_FORM_DATA,
    ...initialData,
  });
  const [errors, setErrors] = useState<EventValidationError[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback(
    (field: keyof EventFormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear field-specific error on change
      setErrors((prev) => prev.filter((e) => e.field !== field));
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const validationErrors = validateEventFields({
      title: formData.title,
      startTime: formData.startTime ? new Date(formData.startTime) : undefined,
      endTime: formData.endTime ? new Date(formData.endTime) : null,
      capacity: formData.capacity ? parseInt(formData.capacity, 10) : null,
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  const getError = (field: string): string | undefined => {
    return errors.find((e) => e.field === field)?.message;
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* LEFT COLUMN: Form Fields */}
        <div>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#1f2937",
              marginTop: 0,
              marginBottom: "16px",
              paddingBottom: "8px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            Event Details
          </h3>

          {/* Title - Required */}
          <FormField fieldKey="title" error={getError("title")}>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder={FIELD_METADATA.title.placeholder}
              style={inputStyle}
              data-test-id="event-form-title"
            />
          </FormField>

          {/* Start Time - Required */}
          <FormField fieldKey="startTime" error={getError("startTime")}>
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => handleChange("startTime", e.target.value)}
              style={inputStyle}
              data-test-id="event-form-start-time"
            />
          </FormField>

          {/* End Time - Optional */}
          <FormField fieldKey="endTime" error={getError("endTime")}>
            <input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => handleChange("endTime", e.target.value)}
              style={inputStyle}
              data-test-id="event-form-end-time"
            />
          </FormField>

          {/* Category - Optional */}
          <FormField fieldKey="category">
            <input
              type="text"
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
              placeholder={FIELD_METADATA.category.placeholder}
              style={inputStyle}
              data-test-id="event-form-category"
            />
          </FormField>

          {/* Location - Optional */}
          <FormField fieldKey="location">
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder={FIELD_METADATA.location.placeholder}
              style={inputStyle}
              data-test-id="event-form-location"
            />
          </FormField>

          {/* Description - Optional */}
          <FormField fieldKey="description">
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder={FIELD_METADATA.description.placeholder}
              style={textareaStyle}
              data-test-id="event-form-description"
            />
          </FormField>

          {/* Capacity - Optional */}
          <FormField fieldKey="capacity" error={getError("capacity")}>
            <input
              type="number"
              min="0"
              value={formData.capacity}
              onChange={(e) => handleChange("capacity", e.target.value)}
              placeholder={FIELD_METADATA.capacity.placeholder}
              style={{ ...inputStyle, maxWidth: "150px" }}
              data-test-id="event-form-capacity"
            />
          </FormField>

          {/* Published - Optional */}
          <FormField fieldKey="isPublished">
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => handleChange("isPublished", e.target.checked)}
                style={{ width: "18px", height: "18px" }}
                data-test-id="event-form-is-published"
              />
              <span style={{ fontSize: "14px", color: "#374151" }}>
                Publish this event (visible to members)
              </span>
            </label>
          </FormField>
        </div>

        {/* RIGHT COLUMN: Derivation Preview */}
        <div>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#1f2937",
              marginTop: 0,
              marginBottom: "16px",
              paddingBottom: "8px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            Calculated by ClubOS
          </h3>

          <DerivationPreview formData={formData} registeredCount={registeredCount} />

          {/* Field Legend */}
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          >
            <h4 style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 12px 0", color: "#6b7280" }}>
              Field Types Legend
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FieldTypeBadge type="required" />
                <span style={{ fontSize: "13px", color: "#374151" }}>Must be entered</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FieldTypeBadge type="optional" />
                <span style={{ fontSize: "13px", color: "#374151" }}>Can be entered (or left blank)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FieldTypeBadge type="calculated" />
                <span style={{ fontSize: "13px", color: "#374151" }}>Computed automatically</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div
        style={{
          marginTop: "24px",
          paddingTop: "20px",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          gap: "12px",
        }}
      >
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "10px 24px",
            backgroundColor: submitting ? "#9ca3af" : "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
          data-test-id="event-form-submit"
        >
          {submitting ? "Saving..." : isEditing ? "Update Event" : "Create Event"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "10px 24px",
              backgroundColor: "#fff",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
            data-test-id="event-form-cancel"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
