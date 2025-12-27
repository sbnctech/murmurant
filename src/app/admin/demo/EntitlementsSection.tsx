/**
 * Entitlements Section Component
 *
 * Displays plan-based feature gates and limits for demo purposes.
 */

import {
  getPlanInfo,
  getFeatures,
  getLimits,
  PLANS,
  type PlanCode,
} from "@/lib/entitlements";

const DEMO_ORG_ID = "demo-org";

export default function EntitlementsSection() {
  return (
    <section
      data-test-id="demo-entitlements-section"
      style={{
        marginBottom: "32px",
        padding: "16px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "#f0f7ff",
      }}
    >
      <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>Entitlements & Plan Gates</h2>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "16px" }}>
        Feature flags and limits by plan. Demo org uses DEMO plan (full access).
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        {(Object.keys(PLANS) as PlanCode[]).map((planCode) => {
          const planInfo = getPlanInfo({ orgId: DEMO_ORG_ID, planCode });
          const features = getFeatures({ orgId: DEMO_ORG_ID, planCode });
          const limits = getLimits({ orgId: DEMO_ORG_ID, planCode });

          return (
            <div
              key={planCode}
              style={{
                padding: "12px",
                border: planCode === "DEMO" ? "2px solid #0066cc" : "1px solid #ddd",
                borderRadius: "8px",
                backgroundColor: planCode === "DEMO" ? "#fff" : "#fafafa",
              }}
            >
              <div style={{ marginBottom: "12px" }}>
                <strong style={{ fontSize: "16px" }}>{planInfo.name}</strong>
                {planCode === "DEMO" && (
                  <span style={{
                    marginLeft: "8px",
                    fontSize: "11px",
                    backgroundColor: "#0066cc",
                    color: "#fff",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}>
                    CURRENT
                  </span>
                )}
                <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                  {planInfo.description}
                </div>
              </div>

              <div style={{ marginBottom: "8px" }}>
                <div style={{ fontSize: "12px", fontWeight: 500, color: "#555", marginBottom: "4px" }}>
                  Features
                </div>
                <div style={{ fontSize: "13px" }}>
                  {Object.entries(features).map(([key, enabled]) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                      <span style={{ color: enabled ? "#28a745" : "#dc3545" }}>
                        {enabled ? "+" : "-"}
                      </span>
                      <code style={{ fontSize: "11px", backgroundColor: "#f0f0f0", padding: "1px 4px", borderRadius: "2px" }}>
                        {key}
                      </code>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "12px", fontWeight: 500, color: "#555", marginBottom: "4px" }}>
                  Limits
                </div>
                <div style={{ fontSize: "13px" }}>
                  {Object.entries(limits).map(([key, value]) => (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                      <code style={{ fontSize: "11px", backgroundColor: "#f0f0f0", padding: "1px 4px", borderRadius: "2px" }}>
                        {key}
                      </code>
                      <span style={{ fontWeight: 500 }}>
                        {value === Infinity ? "unlimited" : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
