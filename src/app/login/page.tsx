/**
 * Login Page
 *
 * Provides two authentication methods:
 * 1. Passkey (WebAuthn) - Primary, passwordless authentication
 * 2. Magic Link (Email) - Fallback for recovery and first-time enrollment
 *
 * Charter Compliance:
 * - P1: Identity is provable via passkey or email ownership
 * - P9: Fails closed, no account enumeration
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionCookieName } from "@/lib/auth/cookies";
import PasskeyLoginButton from "@/components/auth/PasskeyLoginButton";
import MagicLinkForm from "@/components/auth/MagicLinkForm";

export const metadata = {
  title: "Sign In - ClubOS",
  description: "Sign in to your ClubOS account",
};

export default async function LoginPage() {
  // Check if user is already logged in
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(getSessionCookieName());
  if (sessionCookie?.value) {
    redirect("/");
  }

  return (
    <div
      data-test-id="login-page"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
          padding: "32px",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "8px",
            }}
          >
            Welcome back
          </h1>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            Sign in to your ClubOS account
          </p>
        </div>

        {/* Passkey Login - Primary Method */}
        <div style={{ marginBottom: "24px" }}>
          <PasskeyLoginButton />
        </div>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            margin: "24px 0",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "1px",
              backgroundColor: "#e5e7eb",
            }}
          />
          <span
            style={{
              padding: "0 16px",
              color: "#9ca3af",
              fontSize: "14px",
            }}
          >
            or
          </span>
          <div
            style={{
              flex: 1,
              height: "1px",
              backgroundColor: "#e5e7eb",
            }}
          />
        </div>

        {/* Magic Link - Fallback Method */}
        <MagicLinkForm />

        {/* Footer */}
        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontSize: "12px",
            color: "#9ca3af",
          }}
        >
          <p style={{ marginBottom: "8px" }}>
            Passkeys provide passwordless, phishing-resistant authentication using
            Touch ID, Face ID, or security keys.
          </p>
          <p>
            Not a member?{" "}
            <Link
              href="/join"
              style={{ color: "#2563eb", textDecoration: "underline" }}
            >
              Join the club
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
