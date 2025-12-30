/**
 * Gift Certificate Page - Placeholder
 *
 * URL: /gift
 *
 * Allows visitors to purchase membership gift certificates.
 * This is a placeholder for demo purposes.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import Link from "next/link";
import { HeroStripe, ContentStripe } from "@/components/sections";

export default function GiftCertificatePage() {
  return (
    <div data-test-id="gift-certificate-page">
      {/* Header */}
      <header
        style={{
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
        <nav>
          <Link
            href="/"
            style={{
              fontSize: "var(--token-text-sm)",
              color: "var(--token-color-text-muted)",
              textDecoration: "none",
            }}
          >
            Back to Home
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <HeroStripe
        testId="gift-hero"
        title="Gift a Membership"
        description="Share the gift of connection. SBNC membership gift certificates make a thoughtful present for newcomers to Santa Barbara."
        background="primary"
      />

      {/* Gift Options */}
      <ContentStripe
        testId="gift-options"
        title="Choose a Gift"
        headerAlign="center"
        padding="lg"
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "var(--token-space-md)",
            maxWidth: "800px",
            margin: "0 auto",
          }}
        >
          {/* Individual */}
          <div
            style={{
              backgroundColor: "var(--token-color-surface)",
              border: "2px solid var(--token-color-border)",
              borderRadius: "var(--token-radius-lg)",
              padding: "var(--token-space-lg)",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                fontSize: "var(--token-text-xl)",
                fontWeight: 600,
                marginTop: 0,
                marginBottom: "var(--token-space-xs)",
              }}
            >
              Individual
            </h3>
            <p
              style={{
                fontSize: "var(--token-text-2xl)",
                fontWeight: 700,
                color: "var(--token-color-primary)",
                marginBottom: "var(--token-space-md)",
              }}
            >
              $40
            </p>
            <p
              style={{
                fontSize: "var(--token-text-sm)",
                color: "var(--token-color-text-muted)",
                marginBottom: "var(--token-space-md)",
              }}
            >
              One year membership for a single newcomer
            </p>
            <button
              disabled
              style={{
                width: "100%",
                padding: "var(--token-space-sm)",
                backgroundColor: "var(--token-color-surface-2)",
                color: "var(--token-color-text-muted)",
                border: "1px solid var(--token-color-border)",
                borderRadius: "var(--token-radius-lg)",
                cursor: "not-allowed",
              }}
            >
              Coming Soon
            </button>
          </div>

          {/* Household */}
          <div
            style={{
              backgroundColor: "var(--token-color-surface)",
              border: "2px solid var(--token-color-primary)",
              borderRadius: "var(--token-radius-lg)",
              padding: "var(--token-space-lg)",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                fontSize: "var(--token-text-xl)",
                fontWeight: 600,
                marginTop: 0,
                marginBottom: "var(--token-space-xs)",
              }}
            >
              Household
            </h3>
            <p
              style={{
                fontSize: "var(--token-text-2xl)",
                fontWeight: 700,
                color: "var(--token-color-primary)",
                marginBottom: "var(--token-space-md)",
              }}
            >
              $75
            </p>
            <p
              style={{
                fontSize: "var(--token-text-sm)",
                color: "var(--token-color-text-muted)",
                marginBottom: "var(--token-space-md)",
              }}
            >
              One year membership for a household
            </p>
            <button
              disabled
              style={{
                width: "100%",
                padding: "var(--token-space-sm)",
                backgroundColor: "var(--token-color-surface-2)",
                color: "var(--token-color-text-muted)",
                border: "1px solid var(--token-color-border)",
                borderRadius: "var(--token-radius-lg)",
                cursor: "not-allowed",
              }}
            >
              Coming Soon
            </button>
          </div>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: "var(--token-space-lg)",
            color: "var(--token-color-text-muted)",
            fontSize: "var(--token-text-sm)",
          }}
        >
          Gift certificate purchasing will be available soon.
          Contact the membership chair for assistance.
        </p>
      </ContentStripe>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: "#111827",
          color: "#9ca3af",
          padding: "var(--token-space-lg) var(--token-space-md)",
          textAlign: "center",
          fontSize: "var(--token-text-sm)",
        }}
      >
        <p style={{ margin: 0 }}>
          Santa Barbara Newcomers Club
        </p>
      </footer>
    </div>
  );
}
