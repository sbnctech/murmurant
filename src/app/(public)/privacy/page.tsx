/**
 * Privacy Policy Page
 *
 * URL: /privacy
 *
 * Public-facing privacy policy for the Santa Barbara Newcomers Club.
 * Covers data collection, usage, sharing, and member rights.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import Link from "next/link";

// ============================================================================
// Privacy Policy Page Component
// ============================================================================

export default function PrivacyPolicyPage() {
  const lastUpdated = "January 1, 2025";

  return (
    <div data-test-id="privacy-policy-page">
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
        <nav style={{ display: "flex", alignItems: "center", gap: "var(--token-space-md)" }}>
          <Link
            href="/login"
            style={{
              fontSize: "var(--token-text-sm)",
              padding: "var(--token-space-xs) var(--token-space-md)",
              backgroundColor: "var(--token-color-primary)",
              color: "#fff",
              borderRadius: "var(--token-radius-lg)",
              textDecoration: "none",
            }}
          >
            Sign In
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "var(--token-space-xl) var(--token-space-md)",
        }}
      >
        <h1
          style={{
            fontSize: "var(--token-text-3xl)",
            fontWeight: 700,
            color: "var(--token-color-text)",
            marginTop: 0,
            marginBottom: "var(--token-space-sm)",
          }}
        >
          Privacy Policy
        </h1>

        <p
          style={{
            fontSize: "var(--token-text-sm)",
            color: "var(--token-color-text-muted)",
            marginBottom: "var(--token-space-xl)",
          }}
        >
          Last updated: {lastUpdated}
        </p>

        {/* Introduction */}
        <PolicySection title="Introduction">
          <p>
            The Santa Barbara Newcomers Club (&quot;SBNC,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is
            committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and
            safeguard your information when you use our website and services.
          </p>
        </PolicySection>

        {/* Data We Collect */}
        <PolicySection title="Information We Collect">
          <p>We collect information that you provide directly to us, including:</p>
          <ul>
            <li>
              <strong>Personal Information:</strong> Name, email address, phone number, mailing address
            </li>
            <li>
              <strong>Membership Information:</strong> Membership status, join date, renewal history
            </li>
            <li>
              <strong>Event Participation:</strong> Event registrations, attendance records, dietary preferences
            </li>
            <li>
              <strong>Profile Information:</strong> Bio, interests, profile photo (optional)
            </li>
            <li>
              <strong>Payment Information:</strong> Payment method details for dues and event fees (processed
              securely by our payment provider)
            </li>
            <li>
              <strong>Emergency Contact:</strong> Name and phone number of your designated emergency contact
            </li>
          </ul>
        </PolicySection>

        {/* How We Use Data */}
        <PolicySection title="How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul>
            <li>Process your membership application and renewals</li>
            <li>Send you club communications, newsletters, and event announcements</li>
            <li>Manage event registrations and attendance</li>
            <li>Provide the member directory (visible only to other members)</li>
            <li>Improve our services and member experience</li>
            <li>Comply with legal obligations</li>
            <li>Contact your emergency contact if needed during club activities</li>
          </ul>
        </PolicySection>

        {/* Information Sharing */}
        <PolicySection title="Information Sharing">
          <p>We may share your information in the following circumstances:</p>
          <ul>
            <li>
              <strong>With Other Members:</strong> Your name, photo, and bio may be visible to other club members
              in the member directory. You can control visibility in your profile settings.
            </li>
            <li>
              <strong>With Service Providers:</strong> We work with third-party service providers for payment
              processing, email delivery, and website hosting. These providers are contractually obligated to
              protect your information.
            </li>
            <li>
              <strong>For Legal Reasons:</strong> We may disclose information if required by law or to protect
              the rights, property, or safety of SBNC, our members, or others.
            </li>
          </ul>
          <p>
            <strong>We do not sell your personal information to third parties.</strong>
          </p>
        </PolicySection>

        {/* Your Rights */}
        <PolicySection title="Your Rights">
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your information (subject to legal retention requirements)</li>
            <li>Opt out of marketing communications at any time</li>
            <li>Control your directory visibility settings</li>
          </ul>
          <p>
            To exercise these rights, please contact us at the email address provided below.
          </p>
        </PolicySection>

        {/* Data Security */}
        <PolicySection title="Data Security">
          <p>
            We implement appropriate technical and organizational measures to protect your personal information
            against unauthorized access, alteration, disclosure, or destruction. This includes:
          </p>
          <ul>
            <li>Encrypted data transmission (HTTPS)</li>
            <li>Secure authentication methods</li>
            <li>Regular security assessments</li>
            <li>Limited access to personal information on a need-to-know basis</li>
          </ul>
        </PolicySection>

        {/* Data Retention */}
        <PolicySection title="Data Retention">
          <p>
            We retain your personal information for as long as you are a member and for a reasonable period
            thereafter for administrative purposes, legal obligations, and dispute resolution. Alumni members
            may have limited information retained for historical records.
          </p>
        </PolicySection>

        {/* Contact */}
        <PolicySection title="Contact Us">
          <p>If you have questions about this Privacy Policy or our data practices, please contact us:</p>
          <div
            style={{
              backgroundColor: "var(--token-color-surface-muted)",
              border: "1px solid var(--token-color-border)",
              borderRadius: "var(--token-radius-lg)",
              padding: "var(--token-space-md)",
              marginTop: "var(--token-space-sm)",
            }}
          >
            <p style={{ margin: 0 }}>
              <strong>Santa Barbara Newcomers Club</strong>
              <br />
              Email: privacy@sbnewcomers.org
              <br />
              P.O. Box 12345
              <br />
              Santa Barbara, CA 93101
            </p>
          </div>
        </PolicySection>

        {/* Changes to Policy */}
        <PolicySection title="Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify members of any material changes
            by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. We encourage
            you to review this Privacy Policy periodically.
          </p>
        </PolicySection>

        {/* Footer Links */}
        <div
          style={{
            marginTop: "var(--token-space-xl)",
            paddingTop: "var(--token-space-lg)",
            borderTop: "1px solid var(--token-color-border)",
            display: "flex",
            gap: "var(--token-space-md)",
          }}
        >
          <Link
            href="/terms"
            style={{
              color: "var(--token-color-primary)",
              fontSize: "var(--token-text-sm)",
              textDecoration: "none",
            }}
          >
            Terms of Service
          </Link>
          <Link
            href="/"
            style={{
              color: "var(--token-color-primary)",
              fontSize: "var(--token-text-sm)",
              textDecoration: "none",
            }}
          >
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// Policy Section Component
// ============================================================================

interface PolicySectionProps {
  title: string;
  children: React.ReactNode;
}

function PolicySection({ title, children }: PolicySectionProps) {
  return (
    <section style={{ marginBottom: "var(--token-space-xl)" }}>
      <h2
        style={{
          fontSize: "var(--token-text-xl)",
          fontWeight: 600,
          color: "var(--token-color-text)",
          marginTop: 0,
          marginBottom: "var(--token-space-sm)",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontSize: "var(--token-text-base)",
          color: "var(--token-color-text)",
          lineHeight: "var(--token-leading-relaxed)",
        }}
      >
        {children}
      </div>
    </section>
  );
}
