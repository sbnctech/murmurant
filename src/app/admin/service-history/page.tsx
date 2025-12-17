import ServiceHistoryTable from "./ServiceHistoryTable";

export default function ServiceHistoryExplorerPage() {
  return (
    <div data-test-id="service-history-page" style={{ padding: "20px" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>Service History</h1>
      <p style={{ marginBottom: "16px", color: "#666" }}>
        Immutable records of board, chair, committee, and event host service.
      </p>

      <ServiceHistoryTable />
    </div>
  );
}
