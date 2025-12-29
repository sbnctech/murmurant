import { ReactNode } from "react";
import Link from "next/link";

/**
 * MemberLayout - Shared layout wrapper for all member-facing pages.
 *
 * This component provides:
 *   - A modern, clean top navigation bar
 *   - A centered, readable content area
 *   - Accessible styling with large tap targets
 *
 * Design notes:
 *   - Large tap targets (min 44px) for touch devices
 *   - High contrast text for readability
 *   - Simple navigation with max 3-4 top-level items
 *   - Modern gradient accents
 */

type MemberLayoutProps = {
  children: ReactNode;
};

// Navigation items for the member-facing top nav.
// Keep this list short and focused on primary member actions.
const navItems = [
  { label: "Dashboard", href: "/my", testId: "member-nav-home" },
  { label: "Events", href: "/events", testId: "member-nav-events" },
  { label: "Profile", href: "/my/profile", testId: "member-nav-profile" },
];

export default function MemberLayout({ children }: MemberLayoutProps) {
  return (
    <div
      data-test-id="member-layout"
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* ========================================
          TOP NAVIGATION BAR
          Modern design with subtle shadow
          ======================================== */}
      <header
        data-test-id="member-header"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "0 20px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 4px 20px rgba(102, 126, 234, 0.25)",
        }}
      >
        <nav
          data-test-id="member-nav"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: "1100px",
            margin: "0 auto",
            height: "64px",
          }}
        >
          {/* Logo / Brand - links back to member home */}
          <Link
            href="/my"
            data-test-id="member-nav-logo"
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#ffffff",
              textDecoration: "none",
              letterSpacing: "-0.02em",
            }}
          >
            Murmurant
          </Link>

          {/* Primary navigation links */}
          <ul
            style={{
              display: "flex",
              gap: "4px",
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}
          >
            {navItems.map((item) => (
              <li key={item.testId}>
                <a
                  href={item.href}
                  data-test-id={item.testId}
                  style={{
                    display: "inline-block",
                    padding: "10px 18px",
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "rgba(255, 255, 255, 0.9)",
                    textDecoration: "none",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    transition: "background-color 0.2s",
                    // Ensures minimum tap target of 44px
                    minHeight: "44px",
                    lineHeight: "24px",
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* ========================================
          MAIN CONTENT AREA
          ======================================== */}
      <main
        data-test-id="member-main"
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "32px 24px",
          // Ensures content is readable on wide screens
          lineHeight: 1.6,
        }}
      >
        {children}
      </main>

      {/* ========================================
          FOOTER
          Clean, minimal footer
          ======================================== */}
      <footer
        data-test-id="member-footer"
        style={{
          borderTop: "1px solid #e2e8f0",
          padding: "24px 20px",
          textAlign: "center",
          fontSize: "14px",
          color: "#94a3b8",
          marginTop: "40px",
          backgroundColor: "#ffffff",
        }}
      >
        <div style={{ fontWeight: 500, color: "#64748b" }}>Murmurant</div>
        <div style={{ marginTop: "4px", fontSize: "13px" }}>
          Powered by modern club management
        </div>
      </footer>
    </div>
  );
}
