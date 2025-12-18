"use client";

/**
 * Magic Link Form Component
 *
 * Client-side component for email-based magic link authentication.
 * Fallback authentication method when passkeys are not available.
 *
 * Charter Compliance:
 * - P1: Identity verified via email ownership
 * - P9: Fails closed, no account enumeration
 * - N5: User-friendly error messages
 */

import { useState, useCallback, FormEvent } from "react";
import { getFriendlyAuthError } from "@/lib/auth/errors";

interface MagicLinkFormProps {
  onEmailSubmit?: (email: string) => void;
}

interface AuthErrorState {
  title: string;
  message: string;
  action?: string;
}

export default function MagicLinkForm({ onEmailSubmit }: MagicLinkFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<AuthErrorState | null>(null);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/v1/auth/magic-link/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (res.status === 429) {
          throw new Error("rate limit");
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || data.message || "magic link send failed");
        }

        setSent(true);
        onEmailSubmit?.(email);
      } catch (err) {
        const friendlyError = getFriendlyAuthError(err);
        setError(friendlyError);
      } finally {
        setLoading(false);
      }
    },
    [email, onEmailSubmit]
  );

  if (sent) {
    return (
      <div
        data-test-id="magic-link-sent"
        style={{
          padding: "20px",
          backgroundColor: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            backgroundColor: "#22c55e",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22,4 12,14.01 9,11.01" />
          </svg>
        </div>
        <h3
          style={{
            fontSize: "18px",
            fontWeight: 600,
            marginBottom: "8px",
            color: "#166534",
          }}
        >
          Check your email
        </h3>
        <p style={{ color: "#15803d", marginBottom: "16px" }}>
          We sent a sign-in link to <strong>{email}</strong>
        </p>
        <p style={{ color: "#166534", fontSize: "14px" }}>
          The link expires in 15 minutes. Check your spam folder if you do not see it.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            backgroundColor: "transparent",
            border: "1px solid #22c55e",
            borderRadius: "6px",
            color: "#166534",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} data-test-id="magic-link-form">
      <div style={{ marginBottom: "16px" }}>
        <label
          htmlFor="email"
          style={{
            display: "block",
            marginBottom: "6px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#374151",
          }}
        >
          Email address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          disabled={loading}
          data-test-id="magic-link-email-input"
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !email}
        data-test-id="magic-link-submit-button"
        style={{
          width: "100%",
          padding: "12px 16px",
          fontSize: "16px",
          fontWeight: 500,
          backgroundColor: loading || !email ? "#94a3b8" : "#4b5563",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: loading || !email ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {loading ? (
          <>
            <span
              style={{
                width: "16px",
                height: "16px",
                border: "2px solid #fff",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            Sending...
          </>
        ) : (
          <>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Send sign-in link
          </>
        )}
      </button>

      {error && (
        <div
          data-test-id="magic-link-error"
          role="alert"
          style={{
            marginTop: "12px",
            padding: "12px 16px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            color: "#991b1b",
            fontSize: "14px",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "4px" }}>
            {error.title}
          </div>
          <div style={{ color: "#dc2626", marginBottom: error.action ? "8px" : 0 }}>
            {error.message}
          </div>
          {error.action && (
            <div style={{ fontSize: "13px", color: "#6b7280" }}>
              {error.action}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
