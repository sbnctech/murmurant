import RegistrationsTable from "./RegistrationsTable";

export default function AdminRegistrationsListPage() {
  return (
    <div data-test-id="admin-registrations-list-root" style={{ padding: "20px" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>Registrations explorer</h1>
      <p style={{ marginBottom: "16px" }}>
        Browse all registrations and view their details.
      </p>

      <div
        data-test-id="admin-registrations-export"
        style={{ marginBottom: "16px" }}
      >
<a
          href="/api/admin/export/registrations"
          download
          data-test-id="admin-registrations-export-button"
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
          Download registrations.csv
        </a>
      </div>

      <RegistrationsTable />
    </div>
  );
}
