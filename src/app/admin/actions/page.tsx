/**
 * Human-in-the-Loop Actions Page
 *
 * Admin surface for reviewing and approving pending actions.
 * All decisions require explicit human approval - no auto-approval.
 *
 * Principles:
 * - P1: All actions are logged with identity
 * - P4: No hidden rules - behavior is explicit
 * - P5: Actions are reversible where possible
 * - P10: Humans decide, not automation
 */

import { Metadata } from "next";
import Link from "next/link";
import { PendingActionsTable } from "./PendingActionsTable";

export const metadata: Metadata = {
  title: "Pending Actions | Admin",
  description: "Review and approve pending actions",
};

export default function ActionsPage() {
  return (
    <div
      style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}
      data-test-id="admin-actions-root"
    >
      <header style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 600,
            marginBottom: "8px",
            color: "#1a1a1a",
          }}
        >
          Pending Actions
        </h1>
        <p style={{ color: "#666", fontSize: "14px", lineHeight: 1.5 }}>
          Review items requiring human approval. All actions are logged for
          audit purposes. Nothing proceeds without explicit approval.
        </p>
      </header>

      <div
        style={{
          backgroundColor: "#f0f7ff",
          border: "1px solid #c2e0ff",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "24px",
        }}
        data-test-id="admin-actions-notice"
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <span style={{ fontSize: "20px" }} aria-hidden="true">
            &#9432;
          </span>
          <div>
            <strong style={{ display: "block", marginBottom: "4px" }}>
              Human Decision Required
            </strong>
            <span style={{ color: "#444", fontSize: "14px" }}>
              Each action below requires your explicit approval or rejection.
              Previews are available to help you make informed decisions.
              Aborted actions can be retried later.
            </span>
          </div>
        </div>
      </div>

      <PendingActionsTable />

      <footer
        style={{
          marginTop: "32px",
          paddingTop: "16px",
          borderTop: "1px solid #eee",
          fontSize: "12px",
          color: "#888",
        }}
      >
        <p>
          All decisions are recorded in the audit log with your identity,
          timestamp, and rationale. See{" "}
          <Link href="/admin/audit" style={{ color: "#0066cc" }}>
            Audit Log
          </Link>{" "}
          for history.
        </p>
      </footer>
    </div>
  );
}
