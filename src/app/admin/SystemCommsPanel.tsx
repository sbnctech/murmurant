"use client";

import { useState, useEffect } from "react";

type StatusState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "success"; messageId?: string }
  | { kind: "error"; message: string };

type HealthState =
  | { kind: "loading" }
  | { kind: "ok" }
  | { kind: "error" };

export default function SystemCommsPanel() {
  const [healthStatus, setHealthStatus] = useState<HealthState>({ kind: "loading" });
  const [emailStatus, setEmailStatus] = useState<StatusState>({ kind: "idle" });
  const [smsStatus, setSmsStatus] = useState<StatusState>({ kind: "idle" });

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch("/api/health");
        if (!res.ok) {
          setHealthStatus({ kind: "error" });
          return;
        }
        const data = await res.json();
        if (data.status === "ok") {
          setHealthStatus({ kind: "ok" });
        } else {
          setHealthStatus({ kind: "error" });
        }
      } catch {
        setHealthStatus({ kind: "error" });
      }
    }
    checkHealth();
  }, []);

  async function handleEmailTest() {
    setEmailStatus({ kind: "pending" });
    try {
      const res = await fetch("/api/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "system-test@example.com",
          body: "System communications test email",
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setEmailStatus({
          kind: "error",
          message: `HTTP ${res.status}: ${res.statusText || text || "Unknown error"}`,
        });
        return;
      }
      const data = await res.json();
      if (data.ok) {
        setEmailStatus({ kind: "success", messageId: data.messageId });
      } else {
        setEmailStatus({ kind: "error", message: "API returned ok: false" });
      }
    } catch (err: unknown) {
      setEmailStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  async function handleSmsTest() {
    setSmsStatus({ kind: "pending" });
    try {
      const res = await fetch("/api/sms/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "+15551234567",
          body: "System communications test SMS",
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setSmsStatus({
          kind: "error",
          message: `HTTP ${res.status}: ${res.statusText || text || "Unknown error"}`,
        });
        return;
      }
      const data = await res.json();
      if (data.ok) {
        setSmsStatus({ kind: "success", messageId: data.messageId });
      } else {
        setSmsStatus({ kind: "error", message: "API returned ok: false" });
      }
    } catch (err: unknown) {
      setSmsStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const emailButtonDisabled = emailStatus.kind === "pending";
  const smsButtonDisabled = smsStatus.kind === "pending";

  return (
    <div data-test-id="system-comms-section" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Health check */}
      <div
        data-test-id="system-comms-health"
        style={{
          padding: "12px",
          border: "1px solid #ddd",
          borderRadius: "4px",
          maxWidth: "480px",
        }}
      >
        <strong>Health check</strong>
        <div style={{ marginTop: "8px" }}>
          {healthStatus.kind === "loading" && <span>Checking health...</span>}
          {healthStatus.kind === "ok" && <span>Health: OK</span>}
          {healthStatus.kind === "error" && <span>Health: error</span>}
        </div>
      </div>

      {/* Email test */}
      <div
        style={{
          padding: "12px",
          border: "1px solid #ddd",
          borderRadius: "4px",
          maxWidth: "480px",
        }}
      >
        <strong>Email test</strong>
        <div style={{ marginTop: "8px" }}>
          <button
            type="button"
            data-test-id="system-comms-email-button"
            onClick={handleEmailTest}
            disabled={emailButtonDisabled}
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              cursor: emailButtonDisabled ? "default" : "pointer",
              backgroundColor: emailButtonDisabled ? "#f5f5f5" : "#fff",
            }}
          >
            {emailStatus.kind === "pending" ? "Running email test..." : "Run email test"}
          </button>
          <div
            data-test-id="system-comms-email-status"
            style={{ marginTop: "8px", fontSize: "14px", color: "#444" }}
          >
            {emailStatus.kind === "idle" && (
              <span>Click to send a test email via /api/email/test.</span>
            )}
            {emailStatus.kind === "pending" && <span>Sending test email...</span>}
            {emailStatus.kind === "success" && (
              <span>
                Last email test: OK
                {emailStatus.messageId && ` (messageId: ${emailStatus.messageId})`}
              </span>
            )}
            {emailStatus.kind === "error" && (
              <span style={{ color: "#b00020" }}>
                Last email test: error - {emailStatus.message}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SMS test */}
      <div
        style={{
          padding: "12px",
          border: "1px solid #ddd",
          borderRadius: "4px",
          maxWidth: "480px",
        }}
      >
        <strong>SMS test</strong>
        <div style={{ marginTop: "8px" }}>
          <button
            type="button"
            data-test-id="system-comms-sms-button"
            onClick={handleSmsTest}
            disabled={smsButtonDisabled}
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              cursor: smsButtonDisabled ? "default" : "pointer",
              backgroundColor: smsButtonDisabled ? "#f5f5f5" : "#fff",
            }}
          >
            {smsStatus.kind === "pending" ? "Running SMS test..." : "Run SMS test"}
          </button>
          <div
            data-test-id="system-comms-sms-status"
            style={{ marginTop: "8px", fontSize: "14px", color: "#444" }}
          >
            {smsStatus.kind === "idle" && (
              <span>Click to send a test SMS via /api/sms/test.</span>
            )}
            {smsStatus.kind === "pending" && <span>Sending test SMS...</span>}
            {smsStatus.kind === "success" && (
              <span>
                Last SMS test: OK
                {smsStatus.messageId && ` (messageId: ${smsStatus.messageId})`}
              </span>
            )}
            {smsStatus.kind === "error" && (
              <span style={{ color: "#b00020" }}>
                Last SMS test: error - {smsStatus.message}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
