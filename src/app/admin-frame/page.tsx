export default function AdminFramePage() {
  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ fontSize: "20px", marginBottom: "12px" }}>
        Admin frame wrapper
      </h1>
      <iframe
        id="admin-frame"
        data-test-id="admin-frame"
        src="/admin"
        style={{ width: "100%", height: "800px", border: "1px solid #ccc" }}
      />
    </div>
  );
}
