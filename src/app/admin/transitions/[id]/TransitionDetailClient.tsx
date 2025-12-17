"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type TransitionAssignment = {
  id: string;
  memberId: string;
  memberName: string;
  serviceType: string;
  roleTitle: string;
  committeeName: string | null;
  isOutgoing: boolean;
  notes: string | null;
};

type TransitionPlanDetail = {
  id: string;
  name: string;
  status: string;
  presidentApproved: boolean;
  vpActivitiesApproved: boolean;
  incomingAssignments: TransitionAssignment[];
  outgoingAssignments: TransitionAssignment[];
};

type Props = {
  plan: TransitionPlanDetail;
};

export default function TransitionDetailClient({ plan }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performAction = useCallback(
    async (action: string, body?: object) => {
      setLoading(action);
      setError(null);
      try {
        const res = await fetch(`/api/v1/admin/transitions/${plan.id}/${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `Failed to ${action}`);
        }

        // Refresh the page to show updated state
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(null);
      }
    },
    [plan.id, router]
  );

  const handleSubmit = () => performAction("submit");
  const handleApproveAsPresident = () =>
    performAction("approve", { role: "president" });
  const handleApproveAsVP = () =>
    performAction("approve", { role: "vp-activities" });
  const handleApply = () => performAction("apply");
  const handleCancel = () => performAction("cancel");
  const handleDetectOutgoing = () => performAction("detect-outgoing");

  const canSubmit =
    plan.status === "DRAFT" &&
    (plan.incomingAssignments.length > 0 ||
      plan.outgoingAssignments.length > 0);

  const canApprove = plan.status === "PENDING_APPROVAL";
  const canApply =
    plan.status === "APPROVED" ||
    (plan.status === "PENDING_APPROVAL" &&
      plan.presidentApproved &&
      plan.vpActivitiesApproved);

  const canCancel =
    plan.status === "DRAFT" ||
    plan.status === "PENDING_APPROVAL" ||
    plan.status === "APPROVED";

  const canEdit = plan.status === "DRAFT";

  return (
    <div
      data-test-id="transition-detail-actions"
      style={{ marginBottom: "24px" }}
    >
      {error && (
        <div
          data-test-id="transition-action-error"
          style={{
            padding: "12px",
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            borderRadius: "4px",
            marginBottom: "12px",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {canEdit && (
          <button
            data-test-id="transition-action-detect"
            onClick={handleDetectOutgoing}
            disabled={loading !== null}
            style={{
              padding: "8px 16px",
              backgroundColor: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading === "detect-outgoing" ? "Detecting..." : "Detect Outgoing"}
          </button>
        )}

        {canSubmit && (
          <button
            data-test-id="transition-action-submit"
            onClick={handleSubmit}
            disabled={loading !== null}
            style={{
              padding: "8px 16px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading === "submit" ? "Submitting..." : "Submit for Approval"}
          </button>
        )}

        {canApprove && !plan.presidentApproved && (
          <button
            data-test-id="transition-action-approve-president"
            onClick={handleApproveAsPresident}
            disabled={loading !== null}
            style={{
              padding: "8px 16px",
              backgroundColor: "#059669",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading === "approve" ? "Approving..." : "Approve as President"}
          </button>
        )}

        {canApprove && !plan.vpActivitiesApproved && (
          <button
            data-test-id="transition-action-approve-vp"
            onClick={handleApproveAsVP}
            disabled={loading !== null}
            style={{
              padding: "8px 16px",
              backgroundColor: "#059669",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading === "approve" ? "Approving..." : "Approve as VP Activities"}
          </button>
        )}

        {canApply && (
          <button
            data-test-id="transition-action-apply"
            onClick={handleApply}
            disabled={loading !== null}
            style={{
              padding: "8px 16px",
              backgroundColor: "#7c3aed",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading === "apply" ? "Applying..." : "Apply Transition"}
          </button>
        )}

        {canCancel && (
          <button
            data-test-id="transition-action-cancel"
            onClick={handleCancel}
            disabled={loading !== null}
            style={{
              padding: "8px 16px",
              backgroundColor: "#ffffff",
              color: "#dc2626",
              border: "1px solid #dc2626",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading === "cancel" ? "Cancelling..." : "Cancel Plan"}
          </button>
        )}

        {plan.status === "APPLIED" && (
          <span
            style={{
              padding: "8px 16px",
              color: "#065f46",
              fontStyle: "italic",
            }}
          >
            This transition has been applied.
          </span>
        )}

        {plan.status === "CANCELLED" && (
          <span
            style={{
              padding: "8px 16px",
              color: "#991b1b",
              fontStyle: "italic",
            }}
          >
            This transition has been cancelled.
          </span>
        )}
      </div>
    </div>
  );
}
