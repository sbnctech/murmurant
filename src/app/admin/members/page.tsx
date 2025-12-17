import MembersTable from "./MembersTable";

export default function AdminMembersListPage() {
  return (
    <div data-test-id="admin-members-root" style={{ padding: "20px" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>Members</h1>
      <p style={{ marginBottom: "16px" }}>
        Browse all club members and view their registration details.
      </p>

      <div
        data-test-id="admin-members-export"
        style={{ marginBottom: "16px" }}
      >
<a
          href="/api/admin/export/members"
          download
          data-test-id="admin-members-export-button"
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
          Download members.csv
        </a>
      </div>

      <MembersTable />
    </div>
  );
}
