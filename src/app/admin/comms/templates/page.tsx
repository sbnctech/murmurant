import Link from "next/link";
import MessageTemplatesTable from "./MessageTemplatesTable";

export default function AdminMessageTemplatesListPage() {
  return (
    <div data-test-id="admin-comms-templates-root" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h1 style={{ fontSize: "24px", margin: 0 }}>Message templates</h1>
        <Link
          href="/admin/comms/templates/new"
          data-test-id="admin-msg-templates-create-button"
          style={{
            display: "inline-block",
            padding: "8px 16px",
            backgroundColor: "#0066cc",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          Create template
        </Link>
      </div>
      <p style={{ marginBottom: "16px", color: "#666" }}>
        Manage email and SMS templates for campaigns. Use tokens like {"{{member.firstName}}"} for personalization.
      </p>

      <MessageTemplatesTable />
    </div>
  );
}
