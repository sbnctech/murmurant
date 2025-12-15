"use client";

import { useEffect, useState } from "react";

const FEATURE_ENABLED =
  typeof window !== "undefined" &&
  (process.env.NEXT_PUBLIC_FEATURE_TICKETS_ELIGIBILITY === "1" ||
    process.env.NODE_ENV === "development");

type TicketType = {
  id: string;
  code: string;
  name: string;
  eventId: string;
  eventTitle: string;
  isActive: boolean;
};

type EligibilityResult = {
  allowed: boolean;
  reasonCode: string;
  reasonDetail?: string;
};

type PageState =
  | { status: "disabled" }
  | { status: "loading" }
  | { status: "unavailable"; message: string }
  | { status: "loaded"; ticketTypes: TicketType[] };

type EligibilityCache = Record<
  string,
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; result: EligibilityResult }
>;

export default function AdminTicketTypesPage() {
  const initialState: PageState = FEATURE_ENABLED
    ? { status: "loading" }
    : { status: "disabled" };

  const [pageState, setPageState] = useState<PageState>(initialState);
  const [eligibilityCache, setEligibilityCache] = useState<EligibilityCache>({});

  useEffect(() => {
    if (!FEATURE_ENABLED) return;

    fetch("/api/admin/ticket-types")
      .then(async (res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((data) => {
        setPageState({ status: "loaded", ticketTypes: data.ticketTypes ?? [] });
      })
      .catch((err) => {
        console.warn("Ticket types fetch failed:", err);
        setPageState({
          status: "unavailable",
          message: "Ticket types endpoint not available. Pending PR #78.",
        });
      });
  }, []);

  function checkEligibility(ticketId: string) {
    setEligibilityCache((prev) => ({ ...prev, [ticketId]: { status: "loading" } }));

    fetch("/api/v1/tickets/" + ticketId + "/eligibility")
      .then(async (res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((data) => {
        setEligibilityCache((prev) => ({
          ...prev,
          [ticketId]: {
            status: "loaded",
            result: data.eligibility ?? { allowed: false, reasonCode: "UNKNOWN" },
          },
        }));
      })
      .catch((err) => {
        setEligibilityCache((prev) => ({
          ...prev,
          [ticketId]: {
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error",
          },
        }));
      });
  }

  if (pageState.status === "disabled") {
    return (
      <div data-test-id="admin-ticket-types-disabled" style={{ padding: "20px" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>Ticket Types</h1>
        <p style={{ color: "#666" }}>
          Feature disabled. Set NEXT_PUBLIC_FEATURE_TICKETS_ELIGIBILITY=1 to enable.
        </p>
      </div>
    );
  }

  return (
    <div data-test-id="admin-ticket-types-root" style={{ padding: "20px" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>Ticket Types</h1>
      <p style={{ marginBottom: "16px", color: "#666", fontSize: "14px" }}>
        View ticket types and eligibility status (read-only).
      </p>

      {pageState.status === "loading" && (
        <p style={{ color: "#666", fontStyle: "italic" }}>Loading...</p>
      )}

      {pageState.status === "unavailable" && (
        <div
          data-test-id="admin-ticket-types-unavailable"
          style={{
            padding: "16px",
            backgroundColor: "#fff3e0",
            border: "1px solid #ffcc80",
            borderRadius: "4px",
            color: "#e65100",
          }}
        >
          <strong>Unavailable</strong>
          <p style={{ margin: "8px 0 0 0" }}>{pageState.message}</p>
        </div>
      )}

      {pageState.status === "loaded" && (
        <>
          {pageState.ticketTypes.length === 0 ? (
            <p style={{ fontStyle: "italic", color: "#666" }}>No ticket types found.</p>
          ) : (
            <table
              data-test-id="admin-ticket-types-table"
              style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>Event</th>
                  <th style={thStyle}>Ticket Type</th>
                  <th style={thStyle}>Code</th>
                  <th style={thStyle}>Active</th>
                  <th style={{ ...thStyle, width: "220px" }}>Eligibility Preview</th>
                </tr>
              </thead>
              <tbody>
                {pageState.ticketTypes.map((tt) => (
                  <tr key={tt.id} data-test-id="admin-ticket-type-row">
                    <td style={tdStyle}>{tt.eventTitle}</td>
                    <td style={tdStyle}>{tt.name}</td>
                    <td style={tdStyle}><code style={codeStyle}>{tt.code}</code></td>
                    <td style={tdStyle}>
                      {tt.isActive ? <span style={{ color: "#2e7d32" }}>Yes</span> : <span style={{ color: "#9e9e9e" }}>No</span>}
                    </td>
                    <td style={tdStyle}>
                      <EligibilityPreview ticketId={tt.id} cache={eligibilityCache[tt.id]} onCheck={() => checkEligibility(tt.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = { borderBottom: "2px solid #ddd", textAlign: "left", padding: "8px", fontWeight: 600 };
const tdStyle: React.CSSProperties = { borderBottom: "1px solid #eee", padding: "8px" };
const codeStyle: React.CSSProperties = { fontSize: "12px", backgroundColor: "#f5f5f5", padding: "2px 6px", borderRadius: "2px", fontFamily: "monospace" };

function EligibilityPreview({ ticketId, cache, onCheck }: { ticketId: string; cache: EligibilityCache[string] | undefined; onCheck: () => void }) {
  if (!cache || cache.status === "idle") {
    return <button data-test-id={"eligibility-check-" + ticketId} onClick={onCheck} style={{ padding: "4px 12px", backgroundColor: "#e3f2fd", color: "#1565c0", border: "1px solid #90caf9", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Check Eligibility</button>;
  }
  if (cache.status === "loading") {
    return <span style={{ color: "#666", fontStyle: "italic", fontSize: "12px" }}>Checking...</span>;
  }
  if (cache.status === "error") {
    return <span data-test-id="eligibility-error" style={{ color: "#e65100", fontSize: "12px" }} title={cache.message}>Unavailable</span>;
  }
  const { result } = cache;
  return (
    <div data-test-id="eligibility-result">
      <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", backgroundColor: result.allowed ? "#e8f5e9" : "#ffebee", color: result.allowed ? "#2e7d32" : "#c62828" }}>{result.allowed ? "Allow" : "Deny"}</span>
      <div style={{ marginTop: "4px" }} title={result.reasonDetail}><code style={{ ...codeStyle, fontSize: "10px" }}>{result.reasonCode}</code></div>
    </div>
  );
}
