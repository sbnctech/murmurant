import TransitionsTable from "./TransitionsTable";

export default function TransitionsListPage() {
  return (
    <div data-test-id="admin-transitions-root" style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h1 style={{ fontSize: "24px", margin: 0 }}>Transition Plans</h1>
      </div>
      <p style={{ marginBottom: "16px" }}>
        Manage leadership transition plans for scheduled role changes on Feb 1
        and Aug 1.
      </p>

      {/* Auth is handled via HttpOnly session cookies, not props (Charter P1, P7) */}
      <TransitionsTable />
    </div>
  );
}
