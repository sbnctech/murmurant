/**
 * Membership Renewal Page
 *
 * URL: /member/renew
 *
 * Placeholder page for membership renewal.
 * Will eventually integrate with payment processing.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import Link from "next/link";

export default function MemberRenewPage() {
  return (
    <div data-test-id="member-renew-page" style={{ minHeight: "100vh", backgroundColor: "var(--token-color-surface-2)" }}>
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "var(--token-color-surface)",
          borderBottom: "1px solid var(--token-color-border)",
          padding: "var(--token-space-sm) var(--token-space-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: "var(--token-text-lg)",
            fontWeight: 700,
            color: "var(--token-color-text)",
            textDecoration: "none",
          }}
        >
          SBNC
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: "var(--token-space-md)" }}>
          <Link
            href="/my"
            style={{
              fontSize: "var(--token-text-sm)",
              color: "var(--token-color-text-muted)",
              textDecoration: "none",
            }}
          >
            My SBNC
          </Link>
        </nav>
      </header>

      {/* Page Content */}
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "var(--token-space-2xl) var(--token-space-md)",
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "80px",
            height: "80px",
            margin: "0 auto var(--token-space-lg)",
            backgroundColor: "var(--token-color-primary)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "36px",
          }}
        >
          <span role="img" aria-label="Card">&#128179;</span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "var(--token-text-2xl)",
            fontWeight: "var(--token-weight-bold)",
            color: "var(--token-color-text)",
            margin: "0 0 var(--token-space-sm) 0",
          }}
        >
          Renew Your Membership
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: "var(--token-text-base)",
            color: "var(--token-color-text-muted)",
            margin: "0 0 var(--token-space-lg) 0",
            lineHeight: 1.6,
          }}
        >
          Keep your SBNC membership active to enjoy events, activities, and connections with fellow members.
        </p>

        {/* Coming Soon Card */}
        <div
          style={{
            backgroundColor: "var(--token-color-surface)",
            border: "1px solid var(--token-color-border)",
            borderRadius: "var(--token-radius-lg)",
            padding: "var(--token-space-lg)",
            marginBottom: "var(--token-space-lg)",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "var(--token-space-xs) var(--token-space-md)",
              backgroundColor: "#fef3c7",
              color: "#92400e",
              borderRadius: "var(--token-radius-lg)",
              fontSize: "var(--token-text-sm)",
              fontWeight: 600,
              marginBottom: "var(--token-space-sm)",
            }}
          >
            Coming Soon
          </div>
          <p
            style={{
              fontSize: "var(--token-text-sm)",
              color: "var(--token-color-text-muted)",
              margin: 0,
            }}
          >
            Online renewal is coming soon. For now, please contact the membership coordinator
            or visit us at the next general meeting.
          </p>
        </div>

        {/* Contact Info */}
        <div
          style={{
            backgroundColor: "var(--token-color-surface)",
            border: "1px solid var(--token-color-border)",
            borderRadius: "var(--token-radius-lg)",
            padding: "var(--token-space-lg)",
            textAlign: "left",
          }}
        >
          <h2
            style={{
              fontSize: "var(--token-text-base)",
              fontWeight: 600,
              color: "var(--token-color-text)",
              margin: "0 0 var(--token-space-md) 0",
            }}
          >
            Questions about your membership?
          </h2>
          <p
            style={{
              fontSize: "var(--token-text-sm)",
              color: "var(--token-color-text-muted)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Contact our membership team at{" "}
            <a
              href="mailto:membership@sbnewcomers.org"
              style={{ color: "var(--token-color-primary)" }}
            >
              membership@sbnewcomers.org
            </a>
          </p>
        </div>

        {/* Back Link */}
        <div style={{ marginTop: "var(--token-space-xl)" }}>
          <Link
            href="/my"
            style={{
              color: "var(--token-color-primary)",
              textDecoration: "none",
              fontSize: "var(--token-text-sm)",
            }}
          >
            &larr; Back to My SBNC
          </Link>
        </div>
      </div>
    </div>
  );
}
