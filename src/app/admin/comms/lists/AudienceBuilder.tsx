/**
 * Audience Builder Component
 *
 * Visual interface for creating audience rules for mailing lists.
 * Supports member filters, committee selection, and exclusions.
 *
 * P1.2: Audience Builder
 * Charter: P6 (human-first UI), P2 (scoped filtering)
 *
 * Copyright (c) Murmurant, Inc.
 */

"use client";

import { useState, useEffect, useCallback } from "react";

// Membership status options (from MembershipStatus model)
const MEMBERSHIP_STATUSES = [
  { code: "active", label: "Active Members" },
  { code: "alumni", label: "Alumni" },
  { code: "pending", label: "Pending Approval" },
  { code: "lapsed", label: "Lapsed" },
  { code: "honorary", label: "Honorary" },
];

// Audience rule type for the builder
export type AudienceRuleConfig = {
  type: "all" | "status" | "committee" | "event" | "custom" | "manual";
  membershipStatuses?: string[];
  committeeIds?: string[];
  eventId?: string;
  eventStatus?: string;
  joinedAfterDays?: number;
  joinedBeforeDate?: string;
  memberIds?: string[];
  excludeMemberIds?: string[];
};

interface Committee {
  id: string;
  name: string;
  memberCount: number;
}

interface Event {
  id: string;
  title: string;
  date: string;
  registrationCount: number;
}

interface AudienceBuilderProps {
  initialConfig?: AudienceRuleConfig;
  onChange: (config: AudienceRuleConfig, count: number) => void;
}

export default function AudienceBuilder({ initialConfig, onChange }: AudienceBuilderProps) {
  const [config, setConfig] = useState<AudienceRuleConfig>(
    initialConfig || { type: "all" }
  );
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [_events, setEvents] = useState<Event[]>([]); // For future event-based audience
  const [manualEmails, setManualEmails] = useState("");
  const [excludeEmails, setExcludeEmails] = useState("");

  // Fetch committees and events for selectors
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch committees
        const commRes = await fetch("/api/admin/committees");
        if (commRes.ok) {
          const data = await commRes.json();
          setCommittees(data.committees || []);
        }

        // Fetch recent events
        const eventsRes = await fetch("/api/admin/events?limit=20");
        if (eventsRes.ok) {
          const data = await eventsRes.json();
          setEvents(data.events || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    }
    fetchData();
  }, []);

  // Calculate audience count when config changes
  const calculateCount = useCallback(async () => {
    setLoading(true);
    try {
      // Convert config to AudienceRules format
      const rules = configToRules(config);

      const response = await fetch("/api/admin/comms/audience-rules/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });

      if (response.ok) {
        const data = await response.json();
        setAudienceCount(data.count);
        onChange(config, data.count);
      }
    } catch (err) {
      console.error("Error calculating count:", err);
      setAudienceCount(null);
    } finally {
      setLoading(false);
    }
  }, [config, onChange]);

  // Debounce count calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateCount();
    }, 500);
    return () => clearTimeout(timer);
  }, [calculateCount]);

  // Convert builder config to API rules format
  function configToRules(c: AudienceRuleConfig): Record<string, unknown> {
    switch (c.type) {
      case "all":
        return { membershipStatuses: ["active"] };
      case "status":
        return { membershipStatuses: c.membershipStatuses || [] };
      case "committee":
        return {
          committeeIds: c.committeeIds || [],
          membershipStatuses: ["active"],
        };
      case "custom":
        return {
          membershipStatuses: c.membershipStatuses,
          joinedAfterDays: c.joinedAfterDays,
          joinedBeforeDate: c.joinedBeforeDate,
          excludeMemberIds: c.excludeMemberIds,
        };
      case "manual":
        return { memberIds: c.memberIds || [] };
      default:
        return {};
    }
  }

  // Handle type change
  const handleTypeChange = (type: AudienceRuleConfig["type"]) => {
    setConfig({ type });
  };

  // Handle status selection
  const handleStatusToggle = (code: string) => {
    const current = config.membershipStatuses || [];
    const updated = current.includes(code)
      ? current.filter((s) => s !== code)
      : [...current, code];
    setConfig({ ...config, membershipStatuses: updated });
  };

  // Handle committee selection
  const handleCommitteeToggle = (id: string) => {
    const current = config.committeeIds || [];
    const updated = current.includes(id)
      ? current.filter((c) => c !== id)
      : [...current, id];
    setConfig({ ...config, committeeIds: updated });
  };

  return (
    <div data-test-id="audience-builder" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Audience Type Selection */}
      <div>
        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600 }}>
          Audience Type
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {[
            { type: "all" as const, label: "All Active Members" },
            { type: "status" as const, label: "By Membership Status" },
            { type: "committee" as const, label: "Committee Members" },
            { type: "custom" as const, label: "Custom Segment" },
            { type: "manual" as const, label: "Manual Selection" },
          ].map((option) => (
            <button
              key={option.type}
              type="button"
              onClick={() => handleTypeChange(option.type)}
              data-test-id={`audience-type-${option.type}`}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                backgroundColor: config.type === option.type ? "#2563eb" : "#f3f4f6",
                color: config.type === option.type ? "white" : "#374151",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status Filter (for "status" type) */}
      {config.type === "status" && (
        <div
          style={{
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <label style={{ display: "block", marginBottom: "12px", fontSize: "14px", fontWeight: 500 }}>
            Select Membership Statuses
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {MEMBERSHIP_STATUSES.map((status) => (
              <label
                key={status.code}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  backgroundColor: (config.membershipStatuses || []).includes(status.code)
                    ? "#dbeafe"
                    : "white",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={(config.membershipStatuses || []).includes(status.code)}
                  onChange={() => handleStatusToggle(status.code)}
                />
                {status.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Committee Filter (for "committee" type) */}
      {config.type === "committee" && (
        <div
          style={{
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <label style={{ display: "block", marginBottom: "12px", fontSize: "14px", fontWeight: 500 }}>
            Select Committees
          </label>
          {committees.length === 0 ? (
            <div style={{ fontSize: "14px", color: "#6b7280" }}>Loading committees...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {committees.map((committee) => (
                <label
                  key={committee.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    backgroundColor: (config.committeeIds || []).includes(committee.id)
                      ? "#dbeafe"
                      : "white",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={(config.committeeIds || []).includes(committee.id)}
                    onChange={() => handleCommitteeToggle(committee.id)}
                  />
                  <span style={{ flex: 1 }}>{committee.name}</span>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>
                    {committee.memberCount} members
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Custom Segment (for "custom" type) */}
      {config.type === "custom" && (
        <div
          style={{
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Status filter */}
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
              Membership Status (optional)
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {MEMBERSHIP_STATUSES.map((status) => (
                <label
                  key={status.code}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    backgroundColor: (config.membershipStatuses || []).includes(status.code)
                      ? "#dbeafe"
                      : "white",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={(config.membershipStatuses || []).includes(status.code)}
                    onChange={() => handleStatusToggle(status.code)}
                  />
                  {status.label}
                </label>
              ))}
            </div>
          </div>

          {/* Join date filter */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500 }}>
                Joined within (days)
              </label>
              <input
                type="number"
                value={config.joinedAfterDays || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    joinedAfterDays: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="e.g., 90"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "14px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500 }}>
                Joined before date
              </label>
              <input
                type="date"
                value={config.joinedBeforeDate || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    joinedBeforeDate: e.target.value || undefined,
                  })
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "14px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Manual Selection (for "manual" type) */}
      {config.type === "manual" && (
        <div
          style={{
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
            Enter Email Addresses (one per line)
          </label>
          <textarea
            value={manualEmails}
            onChange={(e) => setManualEmails(e.target.value)}
            placeholder="jane@example.com&#10;john@example.com"
            data-test-id="audience-manual-emails"
            style={{
              width: "100%",
              minHeight: "120px",
              padding: "12px",
              fontSize: "14px",
              fontFamily: "monospace",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              resize: "vertical",
            }}
          />
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
            Enter one email address per line. Only registered members will be included.
          </div>
        </div>
      )}

      {/* Exclusion List */}
      <div
        style={{
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "8px",
          padding: "16px",
        }}
      >
        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500, color: "#991b1b" }}>
          Exclude Members (optional)
        </label>
        <textarea
          value={excludeEmails}
          onChange={(e) => setExcludeEmails(e.target.value)}
          placeholder="Enter email addresses to exclude (one per line)"
          data-test-id="audience-exclude-emails"
          style={{
            width: "100%",
            minHeight: "80px",
            padding: "12px",
            fontSize: "14px",
            fontFamily: "monospace",
            border: "1px solid #fecaca",
            borderRadius: "6px",
            resize: "vertical",
          }}
        />
        <div style={{ fontSize: "12px", color: "#991b1b", marginTop: "4px" }}>
          These members will be excluded from the audience even if they match other criteria.
        </div>
      </div>

      {/* Audience Preview */}
      <div
        style={{
          backgroundColor: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "8px",
          padding: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: "14px", fontWeight: 500, color: "#166534" }}>
            Estimated Audience
          </div>
          <div style={{ fontSize: "12px", color: "#166534", marginTop: "2px" }}>
            {loading ? "Calculating..." : "Based on current filters"}
          </div>
        </div>
        <div
          data-test-id="audience-count"
          style={{
            fontSize: "32px",
            fontWeight: 700,
            color: "#166534",
          }}
        >
          {loading ? "..." : audienceCount ?? "-"}
        </div>
      </div>
    </div>
  );
}
