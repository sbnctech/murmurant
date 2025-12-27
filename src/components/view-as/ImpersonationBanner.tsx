/**
 * ImpersonationBanner - First-Class Support Tool Banner
 *
 * A sticky, always-visible banner for tech leads and admins when viewing
 * the app as another member. Designed to make support workflows fast and safe.
 *
 * Features:
 * - Prominent READ-ONLY indicator with visual hierarchy
 * - Member role badges (Member, Officer, Event Chair)
 * - Quick role toggle buttons for common support scenarios
 * - Expandable blocked actions list with explanations
 * - Keyboard shortcut (Esc) to exit instantly
 * - Quick-switch to other demo members
 *
 * Safety:
 * - Cannot be dismissed accidentally
 * - All mutating actions blocked server-side
 * - Audit logged for compliance
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface ImpersonationState {
  isImpersonating: boolean;
  impersonating?: {
    id: string;
    name: string;
    email: string;
    startedAt: string;
    status: string;
    statusLabel: string;
    roleAssignments: string[];
    isEventChair: boolean;
    isOfficer: boolean;
  };
}

// Blocked actions with explanations for why they're blocked
const BLOCKED_ACTIONS = [
  { action: "Financial transactions", reason: "Cannot move money while viewing as another member" },
  { action: "Sending emails", reason: "Cannot send on behalf of impersonated member" },
  { action: "Role changes", reason: "Cannot modify member permissions" },
  { action: "Deleting events", reason: "Destructive actions require your own account" },
  { action: "Admin actions", reason: "Admin capabilities suspended during impersonation" },
];

// Quick-switch demo personas for common support scenarios
const QUICK_SWITCH_PERSONAS = [
  { label: "New Member", description: "Just joined, no events yet" },
  { label: "Active Member", description: "Regular event attendee" },
  { label: "Event Chair", description: "Manages committee events" },
  { label: "Officer", description: "Board member perspective" },
];

export default function ImpersonationBanner() {
  const [state, setState] = useState<ImpersonationState>({ isImpersonating: false });
  const [exiting, setExiting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showQuickSwitch, setShowQuickSwitch] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("");

  // Check impersonation status on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/admin/impersonate/status", {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setState(data);
        }
      } catch {
        // Ignore errors - probably not authenticated
      }
    }

    checkStatus();
  }, []);

  // Update elapsed time every minute
  useEffect(() => {
    if (!state.isImpersonating || !state.impersonating?.startedAt) return;

    function updateElapsed() {
      const start = new Date(state.impersonating!.startedAt);
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) {
        setElapsedTime("just now");
      } else if (diffMins < 60) {
        setElapsedTime(`${diffMins}m ago`);
      } else {
        const hours = Math.floor(diffMins / 60);
        setElapsedTime(`${hours}h ${diffMins % 60}m ago`);
      }
    }

    updateElapsed();
    const interval = setInterval(updateElapsed, 60000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- state.impersonating object is stable when isImpersonating is true
  }, [state.isImpersonating, state.impersonating?.startedAt]);

  const handleExit = useCallback(async () => {
    setExiting(true);
    try {
      const res = await fetch("/api/admin/impersonate/end", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        window.location.reload();
      } else {
        setExiting(false);
        alert("Failed to end impersonation");
      }
    } catch {
      setExiting(false);
      alert("Failed to end impersonation");
    }
  }, []);

  // Keyboard shortcut: Escape to exit impersonation
  useEffect(() => {
    if (!state.isImpersonating) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !exiting) {
        handleExit();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isImpersonating, exiting, handleExit]);

  if (!state.isImpersonating || !state.impersonating) {
    return null;
  }

  const { impersonating } = state;

  // Determine primary role badge
  const getPrimaryRole = () => {
    if (impersonating.isOfficer) return { label: "Officer", color: "#7c3aed" };
    if (impersonating.isEventChair) return { label: "Event Chair", color: "#2563eb" };
    return { label: "Member", color: "#059669" };
  };

  const primaryRole = getPrimaryRole();

  return (
    <>
      {/* Main Banner */}
      <div data-test-id="impersonation-banner" style={styles.banner}>
        {/* Left: Lock + READ-ONLY */}
        <div style={styles.leftSection}>
          <div style={styles.lockBadge}>
            <span style={styles.lockIcon}>🔒</span>
            <span style={styles.readOnlyText}>READ-ONLY</span>
          </div>
        </div>

        {/* Center: Member Info + Role Badges */}
        <div style={styles.centerSection}>
          <div style={styles.memberInfo}>
            <span style={styles.viewingAsLabel}>Viewing as:</span>
            <strong style={styles.memberName}>{impersonating.name}</strong>
            <span
              style={{
                ...styles.roleBadge,
                backgroundColor: primaryRole.color,
              }}
            >
              {primaryRole.label}
            </span>
            <span
              style={{
                ...styles.statusBadge,
                backgroundColor:
                  impersonating.status === "active" ? "#059669" : "#dc2626",
              }}
            >
              {impersonating.statusLabel}
            </span>
          </div>
          <div style={styles.memberMeta}>
            <span style={styles.email}>{impersonating.email}</span>
            <span style={styles.separator}>•</span>
            <span style={styles.elapsed}>Started {elapsedTime}</span>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div style={styles.rightSection}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={styles.infoButton}
            aria-expanded={showDetails}
            data-test-id="impersonation-details-toggle"
            title="See what's blocked during impersonation"
          >
            {showDetails ? "▲ Hide" : "▼ What's blocked?"}
          </button>
          <button
            onClick={() => setShowQuickSwitch(!showQuickSwitch)}
            style={styles.switchButton}
            data-test-id="impersonation-quick-switch"
            title="Quick-switch to another demo member"
          >
            ⟲ Switch
          </button>
          <button
            onClick={handleExit}
            disabled={exiting}
            style={styles.exitButton}
            data-test-id="impersonation-exit"
            title="Press Escape to exit (Esc)"
          >
            {exiting ? "Exiting..." : "✕ Exit"}
          </button>
        </div>
      </div>

      {/* Blocked Actions Panel */}
      {showDetails && (
        <div data-test-id="impersonation-details" style={styles.detailsPanel}>
          <div style={styles.detailsGrid}>
            <div style={styles.detailsColumn}>
              <h4 style={styles.detailsHeader}>🚫 Blocked Actions</h4>
              <ul style={styles.blockedList}>
                {BLOCKED_ACTIONS.map(({ action, reason }) => (
                  <li key={action} style={styles.blockedItem}>
                    <span style={styles.blockedAction}>
                      <span style={styles.xIcon}>✕</span> {action}
                    </span>
                    <span style={styles.blockedReason}>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div style={styles.detailsColumn}>
              <h4 style={styles.detailsHeader}>👤 Member Details</h4>
              <div style={styles.memberDetails}>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Status:</span>
                  <span style={styles.detailValue}>{impersonating.statusLabel}</span>
                </div>
                {impersonating.roleAssignments.length > 0 && (
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Roles:</span>
                    <ul style={styles.rolesList}>
                      {impersonating.roleAssignments.map((role) => (
                        <li key={role} style={styles.roleItem}>{role}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {impersonating.roleAssignments.length === 0 && (
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Roles:</span>
                    <span style={{ ...styles.detailValue, fontStyle: "italic", color: "#666" }}>
                      No committee roles
                    </span>
                  </div>
                )}
              </div>
              <div style={styles.safetyNote}>
                <strong>Safe to explore:</strong> All navigation and viewing works normally.
                Only mutating actions are blocked. Changes you make will not affect this member.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Switch Panel */}
      {showQuickSwitch && (
        <div data-test-id="impersonation-quick-switch-panel" style={styles.quickSwitchPanel}>
          <div style={styles.quickSwitchContent}>
            <h4 style={styles.quickSwitchHeader}>Quick Switch to Demo Member</h4>
            <p style={styles.quickSwitchNote}>
              Switch to a different member type to test various user perspectives.
              Go to <Link href="/admin/demo" style={styles.linkStyle}>Admin Demo</Link> for full member search.
            </p>
            <div style={styles.personaGrid}>
              {QUICK_SWITCH_PERSONAS.map((persona) => (
                <a
                  key={persona.label}
                  href={`/admin/demo#view-as-${persona.label.toLowerCase().replace(" ", "-")}`}
                  style={styles.personaCard}
                >
                  <span style={styles.personaLabel}>{persona.label}</span>
                  <span style={styles.personaDesc}>{persona.description}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Hint */}
      <div style={styles.keyboardHint}>
        Press <kbd style={styles.kbd}>Esc</kbd> to exit impersonation
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    position: "sticky",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10000,
    backgroundColor: "#1e293b", // Dark slate - professional, less alarming than red
    color: "#fff",
    padding: "8px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    fontSize: "13px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    borderBottom: "3px solid #f59e0b", // Amber accent line
  },
  leftSection: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  lockBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    backgroundColor: "#dc2626",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
  },
  lockIcon: {
    fontSize: "12px",
  },
  readOnlyText: {
    fontSize: "11px",
  },
  centerSection: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "2px",
  },
  memberInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  viewingAsLabel: {
    color: "#94a3b8",
    fontSize: "12px",
  },
  memberName: {
    fontSize: "14px",
    fontWeight: 600,
  },
  roleBadge: {
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.3px",
    color: "#fff",
  },
  statusBadge: {
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.3px",
    color: "#fff",
  },
  memberMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "11px",
    color: "#94a3b8",
  },
  email: {},
  separator: {
    opacity: 0.5,
  },
  elapsed: {},
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  infoButton: {
    padding: "6px 12px",
    backgroundColor: "transparent",
    border: "1px solid #475569",
    borderRadius: "4px",
    color: "#e2e8f0",
    fontSize: "12px",
    cursor: "pointer",
  },
  switchButton: {
    padding: "6px 12px",
    backgroundColor: "transparent",
    border: "1px solid #475569",
    borderRadius: "4px",
    color: "#e2e8f0",
    fontSize: "12px",
    cursor: "pointer",
  },
  exitButton: {
    padding: "6px 16px",
    backgroundColor: "#f59e0b",
    color: "#1e293b",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 700,
  },
  detailsPanel: {
    position: "sticky",
    top: "45px",
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    padding: "16px 24px",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    maxWidth: "900px",
    margin: "0 auto",
  },
  detailsColumn: {},
  detailsHeader: {
    margin: "0 0 12px 0",
    fontSize: "13px",
    fontWeight: 600,
    color: "#334155",
  },
  blockedList: {
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  blockedItem: {
    display: "flex",
    flexDirection: "column" as const,
    marginBottom: "8px",
  },
  blockedAction: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    fontWeight: 500,
    color: "#dc2626",
  },
  xIcon: {
    fontSize: "10px",
  },
  blockedReason: {
    fontSize: "11px",
    color: "#64748b",
    marginLeft: "16px",
  },
  memberDetails: {},
  detailRow: {
    marginBottom: "8px",
  },
  detailLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginRight: "8px",
  },
  detailValue: {
    fontSize: "13px",
    color: "#334155",
  },
  rolesList: {
    margin: "4px 0 0 0",
    padding: "0 0 0 16px",
    fontSize: "12px",
    color: "#334155",
  },
  roleItem: {
    marginBottom: "2px",
  },
  safetyNote: {
    marginTop: "16px",
    padding: "8px 12px",
    backgroundColor: "#ecfdf5",
    borderRadius: "4px",
    fontSize: "11px",
    color: "#065f46",
    lineHeight: 1.4,
  },
  quickSwitchPanel: {
    position: "sticky",
    top: "45px",
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: "#fffbeb",
    borderBottom: "1px solid #fde68a",
    padding: "16px 24px",
  },
  quickSwitchContent: {
    maxWidth: "700px",
    margin: "0 auto",
  },
  quickSwitchHeader: {
    margin: "0 0 8px 0",
    fontSize: "14px",
    fontWeight: 600,
    color: "#92400e",
  },
  quickSwitchNote: {
    margin: "0 0 12px 0",
    fontSize: "12px",
    color: "#78350f",
  },
  linkStyle: {
    color: "#d97706",
    fontWeight: 500,
  },
  personaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
  },
  personaCard: {
    display: "flex",
    flexDirection: "column" as const,
    padding: "12px",
    backgroundColor: "#fff",
    border: "1px solid #fcd34d",
    borderRadius: "6px",
    textDecoration: "none",
    cursor: "pointer",
  },
  personaLabel: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#92400e",
    marginBottom: "2px",
  },
  personaDesc: {
    fontSize: "11px",
    color: "#78350f",
  },
  keyboardHint: {
    position: "fixed",
    bottom: "16px",
    right: "16px",
    zIndex: 10001,
    padding: "6px 12px",
    backgroundColor: "rgba(0,0,0,0.8)",
    color: "#fff",
    borderRadius: "4px",
    fontSize: "11px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  kbd: {
    display: "inline-block",
    padding: "2px 6px",
    backgroundColor: "#334155",
    borderRadius: "3px",
    fontSize: "10px",
    fontFamily: "monospace",
    border: "1px solid #475569",
  },
};
