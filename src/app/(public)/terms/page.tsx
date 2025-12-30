/**
 * Terms of Service Page
 *
 * URL: /terms
 *
 * Public-facing terms of service for the Santa Barbara Newcomers Club.
 * Covers membership terms, event policies, code of conduct, and liability.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import Link from "next/link";

// ============================================================================
// Terms of Service Page Component
// ============================================================================

export default function TermsOfServicePage() {
  const lastUpdated = "January 1, 2025";

  return (
    <div data-test-id="terms-of-service-page">
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
          Terms of Service
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
        <TermsSection title="Agreement to Terms">
          <p>
            By becoming a member of the Santa Barbara Newcomers Club (&quot;SBNC&quot;) or using our website and services,
            you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not
            use our services or apply for membership.
          </p>
        </TermsSection>

        {/* Membership Terms */}
        <TermsSection title="Membership Terms">
          <p>
            <strong>Eligibility:</strong> Membership is open to newcomers to the Santa Barbara area and those
            seeking to expand their social connections. The club reserves the right to approve or deny
            membership applications.
          </p>
          <p>
            <strong>Dues:</strong> Annual membership dues are set by the Board of Directors and are non-refundable
            except as provided in our refund policy. Dues must be current to participate in member events and
            access member benefits.
          </p>
          <p>
            <strong>Renewal:</strong> Memberships are valid for one year from the date of approval. You will
            receive renewal reminders before your membership expires.
          </p>
          <p>
            <strong>Termination:</strong> The club reserves the right to terminate membership for violation of
            these terms, the code of conduct, or behavior detrimental to the club and its members.
          </p>
        </TermsSection>

        {/* Event Registration Terms */}
        <TermsSection title="Event Registration">
          <p>
            <strong>Registration:</strong> Event registration is on a first-come, first-served basis unless
            otherwise specified. Some events may have capacity limits or eligibility requirements.
          </p>
          <p>
            <strong>Waitlist:</strong> If an event reaches capacity, you may join a waitlist. You will be
            notified if a spot becomes available.
          </p>
          <p>
            <strong>Guests:</strong> Members may bring guests to designated events. Guest policies vary by
            event and are specified in the event details.
          </p>
          <p>
            <strong>Payment:</strong> Event fees, when applicable, must be paid at the time of registration.
            Payment methods accepted are specified during checkout.
          </p>
        </TermsSection>

        {/* Code of Conduct */}
        <TermsSection title="Code of Conduct">
          <p>All members and guests are expected to:</p>
          <ul>
            <li>Treat fellow members, guests, and club leaders with respect and courtesy</li>
            <li>Refrain from discrimination based on race, gender, religion, age, or any protected characteristic</li>
            <li>Not engage in harassment, intimidation, or bullying of any kind</li>
            <li>Respect the privacy of other members and keep directory information confidential</li>
            <li>Follow the rules and guidelines of event venues</li>
            <li>Not use club communications for commercial solicitation without approval</li>
            <li>Report concerns about member conduct to club leadership</li>
          </ul>
          <p>
            Violations of the code of conduct may result in warnings, suspension, or termination of membership
            at the discretion of the Board of Directors.
          </p>
        </TermsSection>

        {/* Liability Waiver */}
        <TermsSection title="Liability Waiver">
          <div
            style={{
              backgroundColor: "var(--token-color-warning-light)",
              border: "1px solid var(--token-color-warning)",
              borderRadius: "var(--token-radius-lg)",
              padding: "var(--token-space-md)",
              marginBottom: "var(--token-space-md)",
            }}
          >
            <p style={{ margin: 0, fontWeight: 500 }}>
              Please read this section carefully as it affects your legal rights.
            </p>
          </div>
          <p>
            By participating in SBNC activities, you acknowledge and agree that:
          </p>
          <ul>
            <li>
              You participate in club activities voluntarily and at your own risk
            </li>
            <li>
              SBNC, its officers, directors, and volunteers are not liable for any injury, loss, or damage
              arising from your participation in club activities
            </li>
            <li>
              You are responsible for your own health and safety during club activities
            </li>
            <li>
              You release and hold harmless SBNC from any claims arising from your participation
            </li>
            <li>
              You are responsible for any guests you bring to club events
            </li>
          </ul>
          <p>
            This waiver does not apply to claims arising from gross negligence or intentional misconduct.
          </p>
        </TermsSection>

        {/* Cancellation and Refund Policy */}
        <TermsSection title="Cancellation and Refund Policy">
          <p>
            <strong>Event Cancellations by Member:</strong> Cancellation policies vary by event and are
            specified in the event details. Generally:
          </p>
          <ul>
            <li>Cancellations made 72+ hours before an event: Full refund</li>
            <li>Cancellations made 24-72 hours before an event: 50% refund or credit</li>
            <li>Cancellations made less than 24 hours before an event: No refund</li>
          </ul>
          <p>
            <strong>Event Cancellations by SBNC:</strong> If SBNC cancels an event, registered members will
            receive a full refund or credit for future events.
          </p>
          <p>
            <strong>Membership Dues:</strong> Membership dues are generally non-refundable. Exceptions may be
            made at the discretion of the Board for extenuating circumstances.
          </p>
        </TermsSection>

        {/* Intellectual Property */}
        <TermsSection title="Intellectual Property">
          <p>
            The SBNC name, logo, and website content are the property of the Santa Barbara Newcomers Club.
            Members may not use club branding for personal or commercial purposes without written permission.
          </p>
          <p>
            By submitting photos or content to the club, you grant SBNC a non-exclusive license to use such
            content for club communications, website, and promotional materials.
          </p>
        </TermsSection>

        {/* Changes to Terms */}
        <TermsSection title="Changes to Terms">
          <p>
            SBNC reserves the right to modify these terms at any time. Members will be notified of material
            changes via email or website announcement. Continued membership or use of services after changes
            constitutes acceptance of the new terms.
          </p>
        </TermsSection>

        {/* Contact */}
        <TermsSection title="Contact Us">
          <p>For questions about these Terms of Service, please contact:</p>
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
              Email: info@sbnewcomers.org
              <br />
              P.O. Box 12345
              <br />
              Santa Barbara, CA 93101
            </p>
          </div>
        </TermsSection>

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
            href="/privacy"
            style={{
              color: "var(--token-color-primary)",
              fontSize: "var(--token-text-sm)",
              textDecoration: "none",
            }}
          >
            Privacy Policy
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
// Terms Section Component
// ============================================================================

interface TermsSectionProps {
  title: string;
  children: React.ReactNode;
}

function TermsSection({ title, children }: TermsSectionProps) {
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
