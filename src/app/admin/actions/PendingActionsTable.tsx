"use client";

/**
 * Pending Actions Table (Client Component)
 *
 * Interactive table for reviewing and acting on pending items.
 * Supports preview, approve, and abort actions with audit logging.
 */

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionStatus = "pending" | "approved" | "aborted" | "expired";
type ActionType = "migration_import" | "data_publish" | "member_update" | "bulk_operation";

interface PendingAction {
  id: string;
  type: ActionType;
  title: string;
  description: string;
  createdAt: string;
  createdBy: string;
  status: ActionStatus;
  previewAvailable: boolean;
  affectedRecords: number;
  expiresAt: string | null;
}

interface ActionDecision {
  actionId: string;
  decision: "approve" | "abort";
  rationale: string;
}

// ---------------------------------------------------------------------------
// Mock Data (TODO: Replace with API fetch)
// ---------------------------------------------------------------------------

// TODO: Wire to /api/v1/admin/actions endpoint
// TODO: Fetch real pending actions from intent manifests
const MOCK_PENDING_ACTIONS: PendingAction[] = [
  {
    id: "act_001",
    type: "migration_import",
    title: "Import Members from Wild Apricot",
    description: "Import 247 member records with email, name, and membership level",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdBy: "operator@example.org",
    status: "pending",
    previewAvailable: true,
    affectedRecords: 247,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "act_002",
    type: "migration_import",
    title: "Import Events from Wild Apricot",
    description: "Import 52 events with dates, locations, and registrations",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    createdBy: "operator@example.org",
    status: "pending",
    previewAvailable: true,
    affectedRecords: 52,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "act_003",
    type: "data_publish",
    title: "Publish Newsletter: January Update",
    description: "Send newsletter to 198 subscribers",
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    createdBy: "editor@example.org",
    status: "pending",
    previewAvailable: true,
    affectedRecords: 198,
    expiresAt: null,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PendingActionsTable() {
  const router = useRouter();
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRationaleModal, setShowRationaleModal] = useState<{
    actionId: string;
    decision: "approve" | "abort";
  } | null>(null);
  const [rationale, setRationale] = useState("");

  // Fetch pending actions
  useEffect(() => {
    // TODO: Replace with actual API call
    // const res = await fetch("/api/v1/admin/actions?status=pending", {
    //   credentials: "include",
    // });
    // const data = await res.json();
    // setActions(data.actions);

    // For now, use mock data
    const timer = setTimeout(() => {
      setActions(MOCK_PENDING_ACTIONS);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Handle decision submission
  const submitDecision = useCallback(
    async (decision: ActionDecision) => {
      setProcessingId(decision.actionId);
      setError(null);

      try {
        // TODO: Wire to actual API endpoint
        // const res = await fetch(`/api/v1/admin/actions/${decision.actionId}/decide`, {
        //   method: "POST",
        //   credentials: "include",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({
        //     decision: decision.decision,
        //     rationale: decision.rationale,
        //   }),
        // });
        // if (!res.ok) throw new Error("Failed to submit decision");

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Update local state
        setActions((prev) =>
          prev.map((a) =>
            a.id === decision.actionId
              ? { ...a, status: decision.decision === "approve" ? "approved" : "aborted" }
              : a
          )
        );

        // TODO: Trigger audit log entry
        // await auditMutation(req, auth.context, {
        //   action: decision.decision === "approve" ? "APPROVE" : "ABORT",
        //   capability: "actions:decide",
        //   objectType: "PendingAction",
        //   objectId: decision.actionId,
        //   metadata: { rationale: decision.rationale },
        // });

        console.log("[AUDIT] Decision recorded:", decision);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit decision");
      } finally {
        setProcessingId(null);
        setShowRationaleModal(null);
        setRationale("");
      }
    },
    [router]
  );

  // Open rationale modal
  const handleDecisionClick = (actionId: string, decision: "approve" | "abort") => {
    setShowRationaleModal({ actionId, decision });
    setRationale("");
  };

  // View preview
  const handlePreview = (actionId: string) => {
    // TODO: Wire to preview route or modal
    // router.push(`/admin/actions/${actionId}/preview`);
    alert(`Preview for action ${actionId} - TODO: Implement preview modal/route`);
  };

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Get type badge color
  const getTypeBadgeStyle = (type: ActionType) => {
    const colors: Record<ActionType, { bg: string; text: string }> = {
      migration_import: { bg: "#e6f4ea", text: "#137333" },
      data_publish: { bg: "#e8f0fe", text: "#1a73e8" },
      member_update: { bg: "#fef7e0", text: "#b06000" },
      bulk_operation: { bg: "#fce8e6", text: "#c5221f" },
    };
    return colors[type] || { bg: "#f1f3f4", text: "#5f6368" };
  };

  // Get status badge
  const getStatusBadge = (status: ActionStatus) => {
    const styles: Record<ActionStatus, { bg: string; text: string; label: string }> = {
      pending: { bg: "#fff3cd", text: "#856404", label: "Pending" },
      approved: { bg: "#d4edda", text: "#155724", label: "Approved" },
      aborted: { bg: "#f8d7da", text: "#721c24", label: "Aborted" },
      expired: { bg: "#e2e3e5", text: "#383d41", label: "Expired" },
    };
    return styles[status];
  };

  if (loading) {
    return (
      <div
        style={{ textAlign: "center", padding: "40px", color: "#666" }}
        data-test-id="admin-actions-loading"
      >
        Loading pending actions...
      </div>
    );
  }

  const pendingActions = actions.filter((a) => a.status === "pending");
  const completedActions = actions.filter((a) => a.status !== "pending");

  return (
    <div data-test-id="admin-actions-table-root">
      {error && (
        <div
          style={{
            backgroundColor: "#fce8e6",
            border: "1px solid #f5c6cb",
            borderRadius: "4px",
            padding: "12px",
            marginBottom: "16px",
            color: "#721c24",
          }}
          data-test-id="admin-actions-error"
        >
          {error}
        </div>
      )}

      {/* Pending Actions Section */}
      <section style={{ marginBottom: "32px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              backgroundColor: "#fff3cd",
              color: "#856404",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "14px",
            }}
          >
            {pendingActions.length}
          </span>
          Awaiting Decision
        </h2>

        {pendingActions.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              color: "#666",
            }}
            data-test-id="admin-actions-empty"
          >
            No pending actions. All clear!
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              backgroundColor: "#fff",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
            data-test-id="admin-actions-pending-table"
          >
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Action</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Records</th>
                <th style={thStyle}>Created</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Preview</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Decision</th>
              </tr>
            </thead>
            <tbody>
              {pendingActions.map((action) => {
                const typeBadge = getTypeBadgeStyle(action.type);
                const isProcessing = processingId === action.id;

                return (
                  <tr
                    key={action.id}
                    style={{ borderBottom: "1px solid #eee" }}
                    data-test-id={`admin-actions-row-${action.id}`}
                  >
                    <td style={tdStyle}>
                      <span
                        style={{
                          backgroundColor: typeBadge.bg,
                          color: typeBadge.text,
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      >
                        {action.type.replace("_", " ")}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div>
                        <strong style={{ display: "block", marginBottom: "4px" }}>
                          {action.title}
                        </strong>
                        <span style={{ color: "#666", fontSize: "13px" }}>
                          {action.description}
                        </span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", fontFamily: "monospace" }}>
                      {action.affectedRecords.toString()}
                    </td>
                    <td style={{ ...tdStyle, color: "#666", fontSize: "13px" }}>
                      <div>{formatRelativeTime(action.createdAt)}</div>
                      <div style={{ fontSize: "12px" }}>by {action.createdBy}</div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      {action.previewAvailable ? (
                        <button
                          onClick={() => handlePreview(action.id)}
                          style={previewButtonStyle}
                          data-test-id={`admin-actions-preview-${action.id}`}
                        >
                          View Preview
                        </button>
                      ) : (
                        <span style={{ color: "#999", fontSize: "13px" }}>N/A</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                        <button
                          onClick={() => handleDecisionClick(action.id, "approve")}
                          disabled={isProcessing}
                          style={{
                            ...actionButtonStyle,
                            backgroundColor: isProcessing ? "#ccc" : "#28a745",
                          }}
                          data-test-id={`admin-actions-approve-${action.id}`}
                        >
                          {isProcessing ? "..." : "Approve"}
                        </button>
                        <button
                          onClick={() => handleDecisionClick(action.id, "abort")}
                          disabled={isProcessing}
                          style={{
                            ...actionButtonStyle,
                            backgroundColor: isProcessing ? "#ccc" : "#dc3545",
                          }}
                          data-test-id={`admin-actions-abort-${action.id}`}
                        >
                          {isProcessing ? "..." : "Abort"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* Recent Decisions Section */}
      {completedActions.length > 0 && (
        <section>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 600,
              marginBottom: "12px",
              color: "#666",
            }}
          >
            Recent Decisions
          </h2>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              backgroundColor: "#fafafa",
              borderRadius: "8px",
              overflow: "hidden",
            }}
            data-test-id="admin-actions-completed-table"
          >
            <tbody>
              {completedActions.map((action) => {
                const statusBadge = getStatusBadge(action.status);
                return (
                  <tr key={action.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ ...tdStyle, width: "100px" }}>
                      <span
                        style={{
                          backgroundColor: statusBadge.bg,
                          color: statusBadge.text,
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      >
                        {statusBadge.label}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <strong>{action.title}</strong>
                    </td>
                    <td style={{ ...tdStyle, color: "#666", fontSize: "13px" }}>
                      {formatRelativeTime(action.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* Rationale Modal */}
      {showRationaleModal && (
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
          data-test-id="admin-actions-rationale-modal"
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              padding: "24px",
              width: "400px",
              maxWidth: "90%",
            }}
          >
            <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>
              {showRationaleModal.decision === "approve" ? "Approve Action" : "Abort Action"}
            </h3>
            <p style={{ marginBottom: "16px", color: "#666", fontSize: "14px" }}>
              {showRationaleModal.decision === "approve"
                ? "This action will be executed. Please provide a brief rationale for the audit log."
                : "This action will be cancelled. Please explain why for the audit log."}
            </p>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Rationale (optional but recommended)..."
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                minHeight: "80px",
                marginBottom: "16px",
                fontSize: "14px",
              }}
              data-test-id="admin-actions-rationale-input"
            />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowRationaleModal(null)}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                }}
                data-test-id="admin-actions-rationale-cancel"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  submitDecision({
                    actionId: showRationaleModal.actionId,
                    decision: showRationaleModal.decision,
                    rationale,
                  })
                }
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  backgroundColor:
                    showRationaleModal.decision === "approve" ? "#28a745" : "#dc3545",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
                data-test-id="admin-actions-rationale-confirm"
              >
                Confirm {showRationaleModal.decision === "approve" ? "Approval" : "Abort"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: "13px",
  fontWeight: 600,
  color: "#555",
  borderBottom: "2px solid #dee2e6",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  verticalAlign: "middle",
};

const previewButtonStyle: React.CSSProperties = {
  padding: "6px 12px",
  backgroundColor: "#fff",
  border: "1px solid #0066cc",
  borderRadius: "4px",
  color: "#0066cc",
  fontSize: "13px",
  cursor: "pointer",
};

const actionButtonStyle: React.CSSProperties = {
  padding: "6px 12px",
  border: "none",
  borderRadius: "4px",
  color: "#fff",
  fontSize: "13px",
  cursor: "pointer",
  fontWeight: 500,
};
