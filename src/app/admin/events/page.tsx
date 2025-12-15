import EventsTable from "./EventsTable";

export default function AdminEventsListPage() {
  return (
    <div data-test-id="admin-events-list-root" style={{ padding: "20px" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>Events explorer</h1>
      <p style={{ marginBottom: "16px" }}>
        Browse all club events and view their registration details.
      </p>

      <div
        data-test-id="admin-events-export"
        style={{ marginBottom: "16px" }}
      >
<a
          href="/api/admin/export/events"
          download
          data-test-id="admin-events-export-button"
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
          Download events.csv
        </a>
      </div>

      <EventsTable />
    </div>
  );
}
