export default function AdminFramePage() {
  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ fontSize: "20px", marginBottom: "12px" }}>
        Admin Frame Wrapper
      </h1>
      <p style={{ marginBottom: "12px" }}>
        The admin console is rendered inside the iframe below. This route exists
        to support testing and embedding.
      </p>
      <iframe
        id="admin-frame"
        src="/admin"
        style={{
          width: "100%",
          height: "80vh",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
      />
    </div>
  );
}
