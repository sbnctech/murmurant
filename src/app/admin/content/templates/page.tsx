import Link from "next/link";
import TemplatesTable from "./TemplatesTable";

export default function AdminTemplatesListPage() {
  return (
    <div data-test-id="admin-content-templates-root" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h1 style={{ fontSize: "24px", margin: 0 }}>Templates</h1>
        <Link
          href="/admin/content/templates/new"
          data-test-id="admin-templates-create-button"
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
        Manage page and email templates. Templates define the structure and layout of content.
      </p>

      <TemplatesTable />
    </div>
  );
}
