"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelRegistrationButton({
  registrationId,
  eventTitle,
}: {
  registrationId: string;
  eventTitle: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/me/registrations/${registrationId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        router.refresh();
        setShowConfirm(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (showConfirm) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
        onClick={() => setShowConfirm(false)}
      >
        <div
          style={{ backgroundColor: "#fff", borderRadius: "8px", padding: "24px", maxWidth: "400px" }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{ marginTop: 0 }}>Cancel Registration?</h3>
          <p style={{ color: "#6b7280" }}>
            Cancel your registration for <strong>{eventTitle}</strong>?
          </p>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button
              onClick={() => setShowConfirm(false)}
              style={{ padding: "8px 16px", backgroundColor: "#f3f4f6", border: "none", borderRadius: "6px", cursor: "pointer" }}
            >
              Keep
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              style={{ padding: "8px 16px", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
            >
              {loading ? "..." : "Cancel Registration"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      data-test-id={`cancel-${registrationId}`}
      style={{
        padding: "8px 16px",
        backgroundColor: "#fff",
        border: "1px solid #dc2626",
        borderRadius: "6px",
        color: "#dc2626",
        cursor: "pointer",
        fontSize: "14px",
      }}
    >
      Cancel
    </button>
  );
}
