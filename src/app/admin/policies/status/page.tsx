import { loadBoardDecisionsFile } from "@/lib/policies/boardDecisions";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "12px", padding: "8px 0" }}>
      <div style={{ fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>{value}</div>
    </div>
  );
}

export default function PolicyStatusPage() {
  const { runtime } = loadBoardDecisionsFile();

  return (
    <main style={{ padding: "2rem", maxWidth: "900px" }}>
      <h1>Policy & Governance Status</h1>

      <p>
        This page reflects current Board decisions and provisional system behavior. Pending decisions operate in a
        permissive, non-blocking mode.
      </p>

      <h2>Board Decisions</h2>
      <div style={{ borderTop: "1px solid #e5e7eb", marginTop: "12px" }}>
        <Row label="Bylaws version in force" value={String(runtime.bylawsVersion)} />
        <Row label="Guest access mode" value={String(runtime.guestAccessMode)} />
        <Row label="Membership term mode" value={String(runtime.membershipTermMode)} />
        <Row label="Registration eligibility mode" value={String(runtime.registrationEligibilityMode)} />
      </div>

      <h2 style={{ marginTop: "24px" }}>Policy Visibility</h2>
      <div style={{ borderTop: "1px solid #e5e7eb", marginTop: "12px" }}>
        {Object.keys(runtime.policyVisibility).length === 0 ? (
          <p style={{ marginTop: "12px" }}>No policy visibility decisions recorded yet.</p>
        ) : (
          Object.entries(runtime.policyVisibility).map(([k, v]) => (
            <Row key={k} label={k} value={String(v)} />
          ))
        )}
      </div>

      <h2 style={{ marginTop: "24px" }}>System Behavior</h2>
      <p>
        While decisions are pending, the system allows access and logs activity. No member is blocked due to unresolved
        policy direction.
      </p>
    </main>
  );
}
