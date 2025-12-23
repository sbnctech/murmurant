"use client";

/**
 * Access Denied Component
 *
 * User-friendly "You don't have access" UI for 403 scenarios.
 * Can be used as a full page or inline component.
 *
 * Charter Compliance:
 * - P2: Shows access is denied without leaking what the resource is
 * - P7: Provides actionable guidance
 */

import { useCallback } from "react";
import Link from "next/link";
import { useCurrentUser, getRoleDisplayName } from "@/hooks/useCurrentUser";

interface AccessDeniedProps {
  /** Custom title (default: "Access Denied") */
  title?: string;
  /** Custom message explaining why access is denied */
  message?: string;
  /** The capability or resource that was needed (for display) */
  requiredAccess?: string;
  /** Show contact admin link */
  showContactAdmin?: boolean;
  /** Show go back button */
  showGoBack?: boolean;
  /** Show login link (for unauthenticated users) */
  showLogin?: boolean;
  /** Full page mode (adds padding and centering) */
  fullPage?: boolean;
}

export default function AccessDenied({
  title = "Access Denied",
  message,
  requiredAccess,
  showContactAdmin = true,
  showGoBack = true,
  showLogin = true,
  fullPage = false,
}: AccessDeniedProps) {
  const { user, isAuthenticated } = useCurrentUser();

  const handleGoBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  }, []);

  const defaultMessage = isAuthenticated
    ? "You don't have permission to access this page or resource."
    : "You need to sign in to access this page.";

  const content = (
    <div
      data-test-id="access-denied"
      style={{
        textAlign: "center",
        maxWidth: "500px",
        margin: fullPage ? "0 auto" : undefined,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "64px",
          height: "64px",
          backgroundColor: "#fef2f2",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#dc2626"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: "#111827",
          marginBottom: "12px",
        }}
      >
        {title}
      </h1>

      {/* Message */}
      <p
        style={{
          fontSize: "16px",
          color: "#4b5563",
          marginBottom: "24px",
          lineHeight: 1.5,
        }}
      >
        {message || defaultMessage}
      </p>

      {/* Required access info */}
      {requiredAccess && isAuthenticated && (
        <div
          style={{
            marginBottom: "24px",
            padding: "12px 16px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          <div style={{ marginBottom: "4px" }}>
            <strong>Required:</strong> {requiredAccess}
          </div>
          {user && (
            <div>
              <strong>Your role:</strong> {getRoleDisplayName(user.globalRole)}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {/* Show login for unauthenticated users */}
        {showLogin && !isAuthenticated && (
          <Link
            href="/login"
            data-test-id="access-denied-login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              backgroundColor: "#1e40af",
              color: "#fff",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Sign In
          </Link>
        )}

        {/* Go back button */}
        {showGoBack && (
          <button
            type="button"
            onClick={handleGoBack}
            data-test-id="access-denied-back"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              backgroundColor: isAuthenticated ? "#1e40af" : "#fff",
              color: isAuthenticated ? "#fff" : "#374151",
              border: isAuthenticated ? "none" : "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Go Back
          </button>
        )}

        {/* Home link */}
        <Link
          href="/"
          data-test-id="access-denied-home"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 24px",
            backgroundColor: "#fff",
            color: "#374151",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Go Home
        </Link>
      </div>

      {/* Contact admin */}
      {showContactAdmin && isAuthenticated && (
        <p
          style={{
            marginTop: "24px",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          If you believe you should have access, please contact your club administrator.
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          backgroundColor: "#f9fafb",
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}
