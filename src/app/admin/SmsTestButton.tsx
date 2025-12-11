"use client";

import { useState } from "react";

type StatusState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "success"; providerMessageId: string }
  | { kind: "error"; message: string };

export function SmsTestButton() {
  const [status, setStatus] = useState<StatusState>({ kind: "idle" });

  async function handleClick() {
    setStatus({ kind: "pending" });

    try {
      const res = await fetch("/api/sms/test");

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setStatus({
          kind: "error",
          message: `HTTP ${res.status}: ${res.statusText || text || "Unknown error"}`,
        });
        return;
      }

      const data = await res.json();
      setStatus({
        kind: "success",
        providerMessageId: String(data.providerMessageId ?? "unknown"),
      });
    } catch (err: unknown) {
      setStatus({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Unknown error sending SMS",
      });
    }
  }

  const disabled = status.kind === "pending";

  return (
    <div
      data-test-id="sms-test-panel"
      style={{
        border: "1px solid #ddd",
        padding: "12px",
        borderRadius: "4px",
        maxWidth: "480px",
      }}
    >
      <button
        type="button"
        data-test-id="sms-test-button"
        onClick={handleClick}
        disabled={disabled}
        style={{
          padding: "8px 12px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          cursor: disabled ? "default" : "pointer",
          backgroundColor: disabled ? "#f5f5f5" : "#fff",
        }}
      >
        {status.kind === "pending" ? "Sending test SMS..." : "Send test SMS"}
      </button>

      <div
        data-test-id="sms-test-status"
        style={{ marginTop: "8px", fontSize: "14px", color: "#444" }}
      >
        {status.kind === "idle" && (
          <span>Click the button to send a mock SMS via /api/sms/test.</span>
        )}
        {status.kind === "pending" && <span>Sending SMS…</span>}
        {status.kind === "success" && (
          <span>
            SMS sent. Provider message ID: {status.providerMessageId}
          </span>
        )}
        {status.kind === "error" && (
          <span style={{ color: "#b00020" }}>
            Failed to send SMS: {status.message}
          </span>
        )}
      </div>
    </div>
  );
}
