import Link from "next/link";
import MailingListsTable from "./MailingListsTable";

export default function AdminMailingListsPage() {
  return (
    <div data-test-id="admin-comms-lists-root" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h1 style={{ fontSize: "24px", margin: 0 }}>Mailing lists</h1>
        <Link
          href="/admin/comms/lists/new"
          data-test-id="admin-mailing-lists-create-button"
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
          Create list
        </Link>
      </div>
      <p style={{ marginBottom: "16px", color: "#666" }}>
        Manage mailing lists for campaigns. Lists use audience rules to dynamically target members.
      </p>

      <MailingListsTable />
    </div>
  );
}
