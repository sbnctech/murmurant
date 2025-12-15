import Link from "next/link";
import CampaignsTable from "./CampaignsTable";

export default function AdminCampaignsPage() {
  return (
    <div data-test-id="admin-comms-campaigns-root" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h1 style={{ fontSize: "24px", margin: 0 }}>Campaigns</h1>
        <Link
          href="/admin/comms/campaigns/new"
          data-test-id="admin-campaigns-create-button"
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
          Create campaign
        </Link>
      </div>
      <p style={{ marginBottom: "16px", color: "#666" }}>
        Manage email campaigns. Create drafts, schedule sends, and track delivery.
      </p>

      <CampaignsTable />
    </div>
  );
}
