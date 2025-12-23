"use client";

/**
 * Account Indicator Component
 *
 * Displays the current user's identity and provides logout functionality.
 * Shows name, email, and primary role with a dropdown menu.
 *
 * Charter Compliance:
 * - P1: Shows authenticated identity clearly
 * - P7: Logout action is visible and accessible
 */

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useCurrentUser, getRoleDisplayName } from "@/hooks/useCurrentUser";

interface AccountIndicatorProps {
  /** Show compact version (icon only until hover) */
  compact?: boolean;
}

export default function AccountIndicator({ compact = false }: AccountIndicatorProps) {
  const { user, loading, error, isAuthenticated } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok || response.status === 204) {
        // Redirect to login page
        window.location.href = "/login";
      } else {
        console.error("Logout failed:", response.status);
        // Still redirect on error - server session may be cleared
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Logout error:", err);
      // Still redirect on error
      window.location.href = "/login";
    }
  }, []);

  // Loading state
  if (loading) {
    return (
      <div
        data-test-id="account-indicator-loading"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 12px",
          color: "#6b7280",
          fontSize: "14px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            backgroundColor: "#e5e7eb",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        {!compact && <span>Loading...</span>}
      </div>
    );
  }

  // Error state - show login link
  if (error || !isAuthenticated || !user) {
    return (
      <Link
        href="/login"
        data-test-id="account-indicator-login"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          backgroundColor: "#1e40af",
          color: "#fff",
          borderRadius: "6px",
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
    );
  }

  const initials = `${user.firstName[0] || ""}${user.lastName[0] || ""}`.toUpperCase();
  const displayName = `${user.firstName} ${user.lastName}`;
  const roleDisplay = getRoleDisplayName(user.globalRole);

  return (
    <div
      ref={menuRef}
      data-test-id="account-indicator"
      style={{ position: "relative" }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        data-test-id="account-indicator-button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "6px 12px",
          backgroundColor: isOpen ? "#f3f4f6" : "transparent",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          cursor: "pointer",
          transition: "background-color 0.15s",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            backgroundColor: "#3b82f6",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {initials}
        </div>

        {/* Name and Role (hidden in compact mode) */}
        {!compact && (
          <div style={{ textAlign: "left" }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#111827",
                lineHeight: 1.2,
              }}
            >
              {displayName}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                lineHeight: 1.2,
              }}
            >
              {roleDisplay}
            </div>
          </div>
        )}

        {/* Chevron */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6b7280"
          strokeWidth="2"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.15s",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          data-test-id="account-indicator-menu"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            minWidth: "240px",
            backgroundColor: "#fff",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            border: "1px solid #e5e7eb",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          {/* User Info Section */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #e5e7eb",
              backgroundColor: "#f9fafb",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#111827",
                marginBottom: "2px",
              }}
            >
              {displayName}
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              {user.email}
            </div>
            <div
              style={{
                display: "inline-block",
                fontSize: "11px",
                fontWeight: 500,
                color: "#1e40af",
                backgroundColor: "#dbeafe",
                padding: "2px 8px",
                borderRadius: "9999px",
              }}
            >
              {roleDisplay}
            </div>
          </div>

          {/* Menu Items */}
          <div style={{ padding: "4px 0" }}>
            <Link
              href="/account/security"
              role="menuitem"
              data-test-id="account-menu-security"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 16px",
                color: "#374151",
                textDecoration: "none",
                fontSize: "14px",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Security Settings
            </Link>

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={loggingOut}
              data-test-id="account-menu-logout"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "10px 16px",
                color: loggingOut ? "#9ca3af" : "#dc2626",
                backgroundColor: "transparent",
                border: "none",
                cursor: loggingOut ? "not-allowed" : "pointer",
                fontSize: "14px",
                textAlign: "left",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => !loggingOut && (e.currentTarget.style.backgroundColor = "#fef2f2")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {loggingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>
      )}

      {/* Pulse animation for loading state */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
