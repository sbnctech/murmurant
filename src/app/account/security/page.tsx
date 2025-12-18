/**
 * Account Security Page
 *
 * Allows authenticated users to manage their security settings:
 * - View and manage passkeys
 * - Future: 2FA settings, security logs
 *
 * Charter Compliance:
 * - P1: User controls their authentication credentials
 * - P2: Requires authentication to access
 */

import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import PasskeyManager from "@/components/auth/PasskeyManager";

export const metadata = {
  title: "Security Settings - ClubOS",
  description: "Manage your account security settings",
};

export default async function SecurityPage() {
  // Require authentication
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div
      data-test-id="security-page"
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <nav
            style={{
              marginBottom: "16px",
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            <a
              href="/account"
              style={{ color: "#2563eb", textDecoration: "none" }}
            >
              Account
            </a>
            {" / "}
            <span>Security</span>
          </nav>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "8px",
            }}
          >
            Security Settings
          </h1>
          <p style={{ color: "#6b7280" }}>
            Manage your authentication methods and security preferences
          </p>
        </div>

        {/* User Info */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#111827",
              marginBottom: "12px",
            }}
          >
            Account
          </h2>
          <div style={{ fontSize: "14px", color: "#374151" }}>
            <strong>Email:</strong> {session.email}
          </div>
        </div>

        {/* Passkey Management */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <PasskeyManager />
        </div>

        {/* Session Info */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginBottom: "12px",
              color: "#111827",
            }}
          >
            Current Session
          </h3>
          <div
            style={{
              fontSize: "14px",
              color: "#6b7280",
              lineHeight: 1.6,
            }}
          >
            <div style={{ marginBottom: "8px" }}>
              <strong style={{ color: "#374151" }}>Role:</strong>{" "}
              {session.globalRole}
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong style={{ color: "#374151" }}>Session created:</strong>{" "}
              {session.createdAt.toLocaleString()}
            </div>
            <div>
              <strong style={{ color: "#374151" }}>Session expires:</strong>{" "}
              {session.expiresAt.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            padding: "24px",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginBottom: "12px",
              color: "#111827",
            }}
          >
            Sign Out
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: "#6b7280",
              marginBottom: "16px",
            }}
          >
            Sign out of your current session on this device.
          </p>
          <form action="/api/v1/auth/logout" method="POST">
            <button
              type="submit"
              data-test-id="logout-button"
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 500,
                backgroundColor: "#fff",
                color: "#dc2626",
                border: "1px solid #fecaca",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
