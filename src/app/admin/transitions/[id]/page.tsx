import { notFound } from "next/navigation";
import Link from "next/link";
import { formatClubDate } from "@/lib/timezone";
import TransitionDetailClient from "./TransitionDetailClient";

const adminHeaders =
  process.env.NODE_ENV !== "production"
    ? {
        "x-admin-test-token":
          process.env.ADMIN_E2E_TOKEN ?? "dev-admin-token",
      }
    : undefined;

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
}

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
  description: string | null;
  targetTermId: string;
  targetTermName: string;
  effectiveAt: string;
  status: string;
  presidentApproved: boolean;
  presidentApprovedAt: string | null;
  presidentApprovedByName: string | null;
  vpActivitiesApproved: boolean;
  vpActivitiesApprovedAt: string | null;
  vpActivitiesApprovedByName: string | null;
  appliedAt: string | null;
  appliedByName: string | null;
  createdByName: string | null;
  createdAt: string;
  incomingAssignments: TransitionAssignment[];
  outgoingAssignments: TransitionAssignment[];
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TransitionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/v1/admin/transitions/${id}`, {
    headers: adminHeaders,
    cache: "no-store",
  });

  if (res.status === 404) {
    notFound();
  }

  if (!res.ok) {
    return (
      <div data-test-id="admin-transition-error" style={{ padding: "20px" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>Error</h1>
        <p>Failed to load transition plan details.</p>
        <Link href="/admin/transitions" style={{ color: "#0066cc" }}>
          Back to Transitions
        </Link>
      </div>
    );
  }

  const plan: TransitionPlanDetail = await res.json();

  return (
    <div data-test-id="admin-transition-detail-root" style={{ padding: "20px" }}>
      <div style={{ marginBottom: "16px" }}>
        <Link
          href="/admin/transitions"
          data-test-id="transition-detail-back"
          style={{ color: "#0066cc", textDecoration: "none", fontSize: "14px" }}
        >
          &larr; Back to Transitions
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1
            data-test-id="transition-detail-name"
            style={{ fontSize: "24px", margin: "0 0 8px 0" }}
          >
            {plan.name}
          </h1>
          {plan.description && (
            <p
              data-test-id="transition-detail-description"
              style={{ color: "#666", margin: 0 }}
            >
              {plan.description}
            </p>
          )}
        </div>
        <StatusBadge status={plan.status} />
      </div>

      {/* Info Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <InfoCard
          label="Target Term"
          value={plan.targetTermName}
          testId="transition-detail-term"
        />
        <InfoCard
          label="Effective Date"
          value={formatDate(plan.effectiveAt)}
          testId="transition-detail-effective"
        />
        <InfoCard
          label="Created By"
          value={plan.createdByName || "Unknown"}
          testId="transition-detail-creator"
        />
        {plan.appliedAt && (
          <InfoCard
            label="Applied"
            value={`${formatDate(plan.appliedAt)} by ${plan.appliedByName}`}
            testId="transition-detail-applied"
          />
        )}
      </div>

      {/* Approval Status */}
      <div
        data-test-id="transition-detail-approvals"
        style={{
          backgroundColor: "#f9fafb",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ fontSize: "16px", margin: "0 0 12px 0" }}>
          Approval Status
        </h2>
        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
          <ApprovalItem
            role="President"
            approved={plan.presidentApproved}
            approvedAt={plan.presidentApprovedAt}
            approvedBy={plan.presidentApprovedByName}
            testId="approval-president"
          />
          <ApprovalItem
            role="VP Activities"
            approved={plan.vpActivitiesApproved}
            approvedAt={plan.vpActivitiesApprovedAt}
            approvedBy={plan.vpActivitiesApprovedByName}
            testId="approval-vp"
          />
        </div>
      </div>

      {/* Client component for actions */}
      <TransitionDetailClient plan={plan} />

      {/* Assignments */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
        }}
      >
        {/* Outgoing */}
        <div data-test-id="transition-detail-outgoing">
          <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>
            Outgoing ({plan.outgoingAssignments.length})
          </h2>
          <AssignmentList
            assignments={plan.outgoingAssignments}
            emptyMessage="No outgoing assignments"
          />
        </div>

        {/* Incoming */}
        <div data-test-id="transition-detail-incoming">
          <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>
            Incoming ({plan.incomingAssignments.length})
          </h2>
          <AssignmentList
            assignments={plan.incomingAssignments}
            emptyMessage="No incoming assignments"
          />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    DRAFT: { backgroundColor: "#f3f4f6", color: "#374151" },
    PENDING_APPROVAL: { backgroundColor: "#fef3c7", color: "#92400e" },
    APPROVED: { backgroundColor: "#d1fae5", color: "#065f46" },
    APPLIED: { backgroundColor: "#dbeafe", color: "#1e40af" },
    CANCELLED: { backgroundColor: "#fee2e2", color: "#991b1b" },
  };

  const labels: Record<string, string> = {
    DRAFT: "Draft",
    PENDING_APPROVAL: "Pending Approval",
    APPROVED: "Approved",
    APPLIED: "Applied",
    CANCELLED: "Cancelled",
  };

  return (
    <span
      data-test-id="transition-detail-status"
      style={{
        padding: "4px 12px",
        borderRadius: "4px",
        fontSize: "14px",
        fontWeight: 500,
        ...styles[status],
      }}
    >
      {labels[status] || status}
    </span>
  );
}

function InfoCard({
  label,
  value,
  testId,
}: {
  label: string;
  value: string;
  testId: string;
}) {
  return (
    <div
      data-test-id={testId}
      style={{
        backgroundColor: "#f9fafb",
        padding: "12px",
        borderRadius: "8px",
      }}
    >
      <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "14px", fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function ApprovalItem({
  role,
  approved,
  approvedAt,
  approvedBy,
  testId,
}: {
  role: string;
  approved: boolean;
  approvedAt: string | null;
  approvedBy: string | null;
  testId: string;
}) {
  return (
    <div data-test-id={testId} style={{ minWidth: "200px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: approved ? "#d1fae5" : "#f3f4f6",
            color: approved ? "#065f46" : "#9ca3af",
            fontSize: "14px",
          }}
        >
          {approved ? "\u2713" : "-"}
        </span>
        <span style={{ fontWeight: 500 }}>{role}</span>
      </div>
      {approved && approvedBy && (
        <div style={{ fontSize: "12px", color: "#6b7280", marginLeft: "32px" }}>
          {approvedBy}
          {approvedAt && ` on ${formatDate(approvedAt)}`}
        </div>
      )}
      {!approved && (
        <div style={{ fontSize: "12px", color: "#9ca3af", marginLeft: "32px" }}>
          Pending
        </div>
      )}
    </div>
  );
}

function AssignmentList({
  assignments,
  emptyMessage,
}: {
  assignments: TransitionAssignment[];
  emptyMessage: string;
}) {
  if (assignments.length === 0) {
    return (
      <div
        style={{
          padding: "16px",
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
          color: "#6b7280",
          fontStyle: "italic",
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      {assignments.map((assignment, index) => (
        <div
          key={assignment.id}
          data-test-id="transition-assignment-row"
          style={{
            padding: "12px",
            borderBottom:
              index < assignments.length - 1 ? "1px solid #e5e7eb" : "none",
            backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
          }}
        >
          <div style={{ fontWeight: 500, marginBottom: "4px" }}>
            {assignment.memberName}
          </div>
          <div style={{ fontSize: "13px", color: "#6b7280" }}>
            {assignment.roleTitle}
            {assignment.committeeName && ` - ${assignment.committeeName}`}
          </div>
          <div style={{ fontSize: "12px", color: "#9ca3af" }}>
            {formatServiceType(assignment.serviceType)}
          </div>
          {assignment.notes && (
            <div
              style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}
            >
              Note: {assignment.notes}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function formatDate(isoString: string): string {
  return formatClubDate(new Date(isoString));
}

function formatServiceType(type: string): string {
  switch (type) {
    case "BOARD_OFFICER":
      return "Board Officer";
    case "COMMITTEE_CHAIR":
      return "Committee Chair";
    case "COMMITTEE_MEMBER":
      return "Committee Member";
    case "EVENT_HOST":
      return "Event Host";
    default:
      return type;
  }
}
