"use client";

/**
 * Passkey Login Button Component
 *
 * Client-side component for passkey (WebAuthn) authentication.
 * Uses @simplewebauthn/browser for the ceremony.
 *
 * Charter Compliance:
 * - P1: Cryptographically verifiable authentication
 * - P9: Fails closed on errors
 * - N5: User-friendly error messages
 */

import { useState, useCallback } from "react";
import { startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { getFriendlyAuthError, type AuthErrorCode } from "@/lib/auth/errors";

interface PasskeyLoginButtonProps {
  onSuccess?: () => void;
  onError?: (message: string) => void;
  email?: string;
}

interface AuthErrorState {
  title: string;
  message: string;
  action?: string;
}

export default function PasskeyLoginButton({
  onSuccess,
  onError,
  email,
}: PasskeyLoginButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthErrorState | null>(null);

  // Check WebAuthn support
  const passkeySupported = typeof window !== "undefined" && browserSupportsWebAuthn();

  const handlePasskeyLogin = useCallback(async () => {
    // Check WebAuthn support first
    if (!browserSupportsWebAuthn()) {
      const friendlyError = getFriendlyAuthError({ message: "not supported" });
      setError(friendlyError);
      onError?.(friendlyError.message);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Begin authentication - get options from server
      const beginRes = await fetch("/api/v1/auth/passkey/login/begin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (beginRes.status === 429) {
        throw new Error("rate limit");
      }

      if (!beginRes.ok) {
        const data = await beginRes.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to start passkey login");
      }

      const { options, challengeId } = await beginRes.json();

      // Step 2: Create credential - browser prompts user
      let credential;
      try {
        credential = await startAuthentication({
          optionsJSON: options,
        });
      } catch (webauthnError) {
        // Handle WebAuthn-specific errors
        throw webauthnError;
      }

      // Step 3: Finish authentication - verify on server
      const finishRes = await fetch("/api/v1/auth/passkey/login/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, response: credential }),
      });

      if (!finishRes.ok) {
        const data = await finishRes.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Passkey verification failed");
      }

      // Success - session cookie is set by server
      onSuccess?.();

      // Redirect to member home or admin based on role
      window.location.href = "/";
    } catch (err) {
      const friendlyError = getFriendlyAuthError(err);
      setError(friendlyError);
      onError?.(friendlyError.message);
    } finally {
      setLoading(false);
    }
  }, [email, onSuccess, onError]);

  return (
    <div data-test-id="passkey-login-section">
      <button
        type="button"
        onClick={handlePasskeyLogin}
        disabled={loading}
        data-test-id="passkey-login-button"
        style={{
          width: "100%",
          padding: "12px 16px",
          fontSize: "16px",
          fontWeight: 500,
          backgroundColor: loading ? "#94a3b8" : "#1e40af",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: loading ? "not-allowed" : "pointer",
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
            Authenticating...
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
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            Sign in with Passkey
          </>
        )}
      </button>

      {error && (
        <div
          data-test-id="passkey-login-error"
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

      {/* Show hint if passkeys not supported */}
      {!passkeySupported && (
        <div
          data-test-id="passkey-not-supported"
          style={{
            marginTop: "12px",
            padding: "12px 16px",
            backgroundColor: "#fef3c7",
            border: "1px solid #fcd34d",
            borderRadius: "8px",
            color: "#92400e",
            fontSize: "14px",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "4px" }}>
            Passkeys not available
          </div>
          <div>
            Your browser doesn&apos;t support passkeys. Please use the email sign-in option below.
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
