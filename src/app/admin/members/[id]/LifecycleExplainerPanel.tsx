"use client";

/**
 * Membership Lifecycle Explainer Panel
 *
 * A demo-friendly panel that explains a member's lifecycle state,
 * how they reached it, and what happens next.
 *
 * This is READ-ONLY - no state changes are made.
 */

import { useState, useEffect } from "react";
import { formatClubDate } from "@/lib/timezone";

// ============================================================================
// Types (mirrored from API response)
// ============================================================================

type LifecycleState =
  | "not_a_member"
  | "pending_new"
  | "active_newbie"
  | "active_member"
  | "offer_extended"
  | "active_extended"
  | "lapsed"
  | "suspended"
  | "unknown";

interface NextTransition {
  event: string;
  toState: LifecycleState;
  condition: string;
  isAutomatic: boolean;
  estimatedDate?: string;
}

interface LifecycleExplanation {
  currentState: LifecycleState;
  stateLabel: string;
  stateDescription: string;
  inferenceReason: string;
  relevantData: {
    membershipStatus: string;
    membershipTier: string | null;
    joinedAt: string;
    daysSinceJoin: number;
    waMembershipLevel: string | null;
  };
  milestones: {
    newbieEndDate: string;
    twoYearMark: string;
    isNewbiePeriod: boolean;
    isPastTwoYears: boolean;
  };
  nextTransitions: NextTransition[];
  narrative: string;
}

interface LifecycleData {
  member: {
    id: string;
    name: string;
    email: string;
    membershipStatus: string;
    membershipTier: string;
  };
  lifecycle: LifecycleExplanation;
}

// ============================================================================
// State Color Mapping
// ============================================================================

const STATE_COLORS: Record<LifecycleState, { bg: string; text: string; border: string }> = {
  active_newbie: { bg: "#e8f5e9", text: "#2e7d32", border: "#4caf50" },
  active_member: { bg: "#e3f2fd", text: "#1565c0", border: "#2196f3" },
  active_extended: { bg: "#f3e5f5", text: "#7b1fa2", border: "#9c27b0" },
  offer_extended: { bg: "#fff3e0", text: "#e65100", border: "#ff9800" },
  pending_new: { bg: "#fff8e1", text: "#f57f17", border: "#ffc107" },
  lapsed: { bg: "#fafafa", text: "#616161", border: "#9e9e9e" },
  suspended: { bg: "#ffebee", text: "#c62828", border: "#f44336" },
  unknown: { bg: "#fce4ec", text: "#ad1457", border: "#e91e63" },
  not_a_member: { bg: "#eceff1", text: "#546e7a", border: "#78909c" },
};

// ============================================================================
// Component
// ============================================================================

interface Props {
  memberId: string;
}

export default function LifecycleExplainerPanel({ memberId }: Props) {
  const [data, setData] = useState<LifecycleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    async function fetchLifecycle() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/admin/members/${memberId}/lifecycle`);
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchLifecycle();
  }, [memberId]);

  if (loading) {
    return (
      <div style={styles.panel}>
        <div style={styles.header} onClick={() => setExpanded(!expanded)}>
          <h3 style={styles.title}>Membership Lifecycle</h3>
        </div>
        <div style={styles.loading}>Loading lifecycle data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.panel}>
        <div style={styles.header}>
          <h3 style={styles.title}>Membership Lifecycle</h3>
        </div>
        <div style={styles.error}>Error: {error}</div>
      </div>
    );
  }

  if (!data) return null;

  const { lifecycle, member } = data;
  const stateColor = STATE_COLORS[lifecycle.currentState];

  return (
    <div id="lifecycle" style={styles.panel} data-test-id="lifecycle-explainer-panel">
      {/* Header */}
      <div
        style={styles.header}
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
      >
        <h3 style={styles.title}>
          Membership Lifecycle
          <span style={styles.expandIcon}>{expanded ? "▼" : "▶"}</span>
        </h3>
        <div
          style={{
            ...styles.stateBadge,
            backgroundColor: stateColor.bg,
            color: stateColor.text,
            borderColor: stateColor.border,
          }}
        >
          {lifecycle.stateLabel}
        </div>
      </div>

      {expanded && (
        <div style={styles.content}>
          {/* Narrative (Demo-friendly explanation) */}
          <section style={styles.section}>
            <h4 style={styles.sectionTitle}>Current Status</h4>
            <p style={styles.narrative}>{lifecycle.narrative}</p>
          </section>

          {/* State Description */}
          <section style={styles.section}>
            <h4 style={styles.sectionTitle}>State: {lifecycle.stateLabel}</h4>
            <p style={styles.description}>{lifecycle.stateDescription}</p>
          </section>

          {/* How We Got Here */}
          <section style={styles.section}>
            <h4 style={styles.sectionTitle}>How This Was Determined</h4>
            <p style={styles.inference}>{lifecycle.inferenceReason}</p>
            <div style={styles.dataGrid}>
              <div style={styles.dataItem}>
                <span style={styles.dataLabel}>Membership Status:</span>
                <span style={styles.dataValue}>{lifecycle.relevantData.membershipStatus}</span>
              </div>
              <div style={styles.dataItem}>
                <span style={styles.dataLabel}>Membership Tier:</span>
                <span style={styles.dataValue}>
                  {lifecycle.relevantData.membershipTier ?? "None"}
                </span>
              </div>
              <div style={styles.dataItem}>
                <span style={styles.dataLabel}>Join Date:</span>
                <span style={styles.dataValue}>{lifecycle.relevantData.joinedAt}</span>
              </div>
              <div style={styles.dataItem}>
                <span style={styles.dataLabel}>Days Since Join:</span>
                <span style={styles.dataValue}>{lifecycle.relevantData.daysSinceJoin}</span>
              </div>
              {lifecycle.relevantData.waMembershipLevel && (
                <div style={styles.dataItem}>
                  <span style={styles.dataLabel}>WA Level (raw):</span>
                  <span style={styles.dataValue}>{lifecycle.relevantData.waMembershipLevel}</span>
                </div>
              )}
            </div>
          </section>

          {/* Milestones */}
          <section style={styles.section}>
            <h4 style={styles.sectionTitle}>Membership Milestones</h4>
            <div style={styles.milestones}>
              <div
                style={{
                  ...styles.milestone,
                  opacity: lifecycle.milestones.isNewbiePeriod ? 1 : 0.5,
                }}
              >
                <span style={styles.milestoneIcon}>
                  {lifecycle.milestones.isNewbiePeriod ? "🎯" : "✓"}
                </span>
                <div>
                  <div style={styles.milestoneLabel}>90-Day Newbie Period</div>
                  <div style={styles.milestoneDate}>
                    Ends: {formatClubDate(new Date(lifecycle.milestones.newbieEndDate))}
                  </div>
                </div>
              </div>
              <div
                style={{
                  ...styles.milestone,
                  opacity: lifecycle.milestones.isPastTwoYears ? 0.5 : 1,
                }}
              >
                <span style={styles.milestoneIcon}>
                  {lifecycle.milestones.isPastTwoYears ? "✓" : "📅"}
                </span>
                <div>
                  <div style={styles.milestoneLabel}>2-Year Mark (Extended Offer)</div>
                  <div style={styles.milestoneDate}>
                    Date: {formatClubDate(new Date(lifecycle.milestones.twoYearMark))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* What Happens Next */}
          {lifecycle.nextTransitions.length > 0 && (
            <section style={styles.section}>
              <h4 style={styles.sectionTitle}>What Happens Next</h4>
              <div style={styles.transitions}>
                {lifecycle.nextTransitions.map((t, i) => (
                  <div key={i} style={styles.transition}>
                    <div style={styles.transitionHeader}>
                      <span style={styles.transitionEvent}>{formatEvent(t.event)}</span>
                      <span style={styles.transitionArrow}>→</span>
                      <span
                        style={{
                          ...styles.transitionState,
                          backgroundColor: STATE_COLORS[t.toState].bg,
                          color: STATE_COLORS[t.toState].text,
                        }}
                      >
                        {formatState(t.toState)}
                      </span>
                      {t.isAutomatic && (
                        <span style={styles.automaticBadge}>Auto</span>
                      )}
                    </div>
                    <div style={styles.transitionCondition}>{t.condition}</div>
                    {t.estimatedDate && (
                      <div style={styles.transitionDate}>
                        Est. date: {formatClubDate(new Date(t.estimatedDate))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Footer */}
          <div style={styles.footer}>
            <em>This panel is read-only. No changes are made to member data.</em>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatEvent(event: string): string {
  return event
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatState(state: string): string {
  return state
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  panel: {
    marginTop: "24px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    backgroundColor: "#fff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #eee",
    cursor: "pointer",
    userSelect: "none",
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 600,
    color: "#333",
  },
  expandIcon: {
    marginLeft: "8px",
    fontSize: "12px",
    color: "#666",
  },
  stateBadge: {
    padding: "6px 12px",
    borderRadius: "16px",
    fontSize: "14px",
    fontWeight: 500,
    border: "1px solid",
  },
  content: {
    padding: "20px",
  },
  section: {
    marginBottom: "24px",
  },
  sectionTitle: {
    margin: "0 0 12px 0",
    fontSize: "14px",
    fontWeight: 600,
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  narrative: {
    margin: 0,
    fontSize: "16px",
    lineHeight: 1.6,
    color: "#333",
    backgroundColor: "#f8f9fa",
    padding: "16px",
    borderRadius: "8px",
    borderLeft: "4px solid #2196f3",
  },
  description: {
    margin: 0,
    fontSize: "14px",
    color: "#666",
    lineHeight: 1.5,
  },
  inference: {
    margin: "0 0 16px 0",
    fontSize: "14px",
    color: "#555",
    fontStyle: "italic",
  },
  dataGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
  },
  dataItem: {
    display: "flex",
    flexDirection: "column",
    padding: "8px 12px",
    backgroundColor: "#f5f5f5",
    borderRadius: "4px",
  },
  dataLabel: {
    fontSize: "12px",
    color: "#666",
    marginBottom: "4px",
  },
  dataValue: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#333",
  },
  milestones: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  milestone: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
  },
  milestoneIcon: {
    fontSize: "24px",
  },
  milestoneLabel: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#333",
  },
  milestoneDate: {
    fontSize: "12px",
    color: "#666",
  },
  transitions: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  transition: {
    padding: "12px",
    backgroundColor: "#fafafa",
    borderRadius: "8px",
    border: "1px solid #eee",
  },
  transitionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
    flexWrap: "wrap",
  },
  transitionEvent: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#333",
  },
  transitionArrow: {
    color: "#666",
  },
  transitionState: {
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "13px",
  },
  automaticBadge: {
    padding: "2px 6px",
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: 500,
  },
  transitionCondition: {
    fontSize: "13px",
    color: "#666",
  },
  transitionDate: {
    fontSize: "12px",
    color: "#888",
    marginTop: "4px",
  },
  footer: {
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #eee",
    fontSize: "12px",
    color: "#888",
    textAlign: "center",
  },
  loading: {
    padding: "20px",
    textAlign: "center",
    color: "#666",
  },
  error: {
    padding: "20px",
    color: "#c62828",
    backgroundColor: "#ffebee",
    borderRadius: "4px",
    margin: "12px",
  },
};
