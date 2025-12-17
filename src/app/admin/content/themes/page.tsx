import Link from "next/link";
import ThemesTable from "./ThemesTable";

export default function AdminThemesListPage() {
  return (
    <div data-test-id="admin-content-themes-root" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h1 style={{ fontSize: "24px", margin: 0 }}>Themes</h1>
        <Link
          href="/admin/content/themes/new"
          data-test-id="admin-themes-create-button"
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
          Create theme
        </Link>
      </div>
      <p style={{ marginBottom: "16px", color: "#666" }}>
        Manage visual themes for the website. Themes control colors, typography, and spacing.
      </p>

      <ThemesTable />
    </div>
  );
}
