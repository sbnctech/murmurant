/**
 * View As Support Tool - Help Page
 *
 * Public documentation page explaining the "View As" feature.
 * Linked from the impersonation banner's "Why am I seeing this?" link.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import Link from "next/link";

export const metadata = {
  title: "View As Member - Support Tool | Murmurant",
  description: "Learn about the View As Member support tool for troubleshooting member experiences.",
};

export default function ViewAsHelpPage() {
  return (
    <div style={{
      maxWidth: "800px",
      margin: "0 auto",
      padding: "40px 20px",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      {/* Header */}
      <header style={{ marginBottom: "32px" }}>
        <Link
          href="/admin/demo"
          style={{
            color: "#6366f1",
            fontSize: "14px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          &larr; Back to Demo Dashboard
        </Link>
        <h1 style={{
          fontSize: "32px",
          fontWeight: 700,
          margin: "16px 0 8px 0",
          color: "#111827",
        }}>
          View As Member
        </h1>
        <p style={{
          fontSize: "18px",
          color: "#6b7280",
          margin: 0,
        }}>
          A safe support tool for troubleshooting member experiences
        </p>
      </header>

      {/* Why am I seeing this? */}
      <section style={{
        backgroundColor: "#fef3c7",
        border: "1px solid #f59e0b",
        borderRadius: "8px",
        padding: "16px 20px",
        marginBottom: "32px",
      }}>
        <h2 style={{
          fontSize: "16px",
          fontWeight: 600,
          margin: "0 0 8px 0",
          color: "#92400e",
        }}>
          Why am I seeing a red banner?
        </h2>
        <p style={{
          margin: 0,
          color: "#78350f",
          fontSize: "15px",
          lineHeight: 1.6,
        }}>
          An administrator is currently viewing the application as you for support purposes.
          This is a <strong>read-only</strong> session - no changes can be made to your account.
          The banner ensures the admin knows they are in support mode and cannot accidentally
          modify your data.
        </p>
      </section>

      {/* What is View As? */}
      <section style={{ marginBottom: "32px" }}>
        <h2 style={{
          fontSize: "20px",
          fontWeight: 600,
          margin: "0 0 12px 0",
          color: "#111827",
        }}>
          What is &quot;View As Member&quot;?
        </h2>
        <p style={{
          color: "#374151",
          fontSize: "15px",
          lineHeight: 1.7,
          margin: "0 0 16px 0",
        }}>
          View As Member is a support tool that allows club administrators (tech leads and webmasters)
          to see the application exactly as a specific member sees it. This helps troubleshoot issues
          like &quot;I can&apos;t see my events&quot; or &quot;My profile looks wrong&quot; without needing
          the member to share their screen.
        </p>
      </section>

      {/* Safety Guarantees */}
      <section style={{ marginBottom: "32px" }}>
        <h2 style={{
          fontSize: "20px",
          fontWeight: 600,
          margin: "0 0 16px 0",
          color: "#111827",
        }}>
          Safety Guarantees
        </h2>
        <div style={{
          display: "grid",
          gap: "12px",
        }}>
          {[
            {
              icon: "&#128274;",
              title: "Read-Only Mode",
              description: "All write actions are blocked at the server level. The admin cannot modify your profile, registrations, or any other data.",
            },
            {
              icon: "&#128680;",
              title: "Always Visible Banner",
              description: "A prominent red banner is displayed at the top of every page during impersonation. It cannot be hidden or dismissed.",
            },
            {
              icon: "&#128221;",
              title: "Audit Logged",
              description: "Every View As session is logged with who initiated it, who was viewed, and how long it lasted.",
            },
            {
              icon: "&#9989;",
              title: "Instant Exit",
              description: "The admin can exit View As mode instantly by pressing Escape or clicking the Exit button.",
            },
          ].map((item) => (
            <div key={item.title} style={{
              display: "flex",
              gap: "16px",
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}>
              <span style={{ fontSize: "24px" }} dangerouslySetInnerHTML={{ __html: item.icon }} />
              <div>
                <h3 style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  margin: "0 0 4px 0",
                  color: "#111827",
                }}>
                  {item.title}
                </h3>
                <p style={{
                  margin: 0,
                  color: "#6b7280",
                  fontSize: "14px",
                  lineHeight: 1.5,
                }}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Blocked Actions */}
      <section style={{ marginBottom: "32px" }}>
        <h2 style={{
          fontSize: "20px",
          fontWeight: 600,
          margin: "0 0 12px 0",
          color: "#111827",
        }}>
          Actions Blocked During View As
        </h2>
        <p style={{
          color: "#374151",
          fontSize: "15px",
          lineHeight: 1.7,
          margin: "0 0 16px 0",
        }}>
          These actions are blocked at the server level (not just hidden in the UI):
        </p>
        <ul style={{
          margin: 0,
          paddingLeft: "24px",
          color: "#374151",
          fontSize: "15px",
          lineHeight: 2,
        }}>
          <li><strong>Financial transactions</strong> - No payments, refunds, or fee changes</li>
          <li><strong>Sending emails</strong> - No club communications can be sent</li>
          <li><strong>Role changes</strong> - No officer or committee role modifications</li>
          <li><strong>Deleting events</strong> - No destructive event actions</li>
          <li><strong>Admin actions</strong> - Full admin capabilities are suspended</li>
        </ul>
      </section>

      {/* Quick Demo */}
      <section style={{
        backgroundColor: "#f0fdf4",
        border: "1px solid #86efac",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "32px",
      }}>
        <h2 style={{
          fontSize: "18px",
          fontWeight: 600,
          margin: "0 0 12px 0",
          color: "#166534",
        }}>
          60-Second Demo
        </h2>
        <ol style={{
          margin: 0,
          paddingLeft: "20px",
          color: "#15803d",
          fontSize: "14px",
          lineHeight: 2,
        }}>
          <li>Navigate to <strong>/admin/demo</strong></li>
          <li>Find the &quot;Support Tools&quot; section</li>
          <li>Search for a member by name or email</li>
          <li>Click &quot;View As&quot; next to their name</li>
          <li>Notice the red banner appears at the top</li>
          <li>Navigate around - you see what they see</li>
          <li>Press <strong>Escape</strong> to exit instantly</li>
        </ol>
      </section>

      {/* Footer */}
      <footer style={{
        paddingTop: "24px",
        borderTop: "1px solid #e5e7eb",
        color: "#9ca3af",
        fontSize: "13px",
      }}>
        <p style={{ margin: 0 }}>
          Questions? Contact your club&apos;s tech lead or webmaster.
        </p>
      </footer>
    </div>
  );
}
