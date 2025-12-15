import Link from "next/link";
import PagesTable from "./PagesTable";

export default function AdminPagesListPage() {
  return (
    <div data-test-id="admin-content-pages-root" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h1 style={{ fontSize: "24px", margin: 0 }}>Pages</h1>
        <Link
          href="/admin/content/pages/new"
          data-test-id="admin-pages-create-button"
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
          Create page
        </Link>
      </div>
      <p style={{ marginBottom: "16px", color: "#666" }}>
        Manage website pages. Create, edit, publish, and archive content pages.
      </p>

      <PagesTable />
    </div>
  );
}
