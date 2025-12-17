import { ReactNode } from "react";
import Link from "next/link";

/**
 * MemberLayout - Shared layout wrapper for all member-facing pages.
 *
 * This component provides:
 *   - A consistent top navigation bar
 *   - A centered, readable content area
 *   - Simple, accessible styling for older users
 *
 * Design notes:
 *   - Large tap targets (min 44px) for touch devices
 *   - High contrast text for readability
 *   - Simple navigation with max 3-4 top-level items
 */

type MemberLayoutProps = {
  children: ReactNode;
};

// Navigation items for the member-facing top nav.
// Keep this list short and focused on primary member actions.
const navItems = [
  { label: "My Club", href: "/member", testId: "member-nav-home" },
  { label: "Events", href: "/member/events", testId: "member-nav-events" },
  { label: "Account", href: "/member/account", testId: "member-nav-account" },
];

export default function MemberLayout({ children }: MemberLayoutProps) {
  return (
    <div
      data-test-id="member-layout"
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ========================================
          TOP NAVIGATION BAR
          ======================================== */}
      <header
        data-test-id="member-header"
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: "12px 20px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <nav
          data-test-id="member-nav"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          {/* Logo / Brand - links back to member home */}
          <Link
            href="/member"
            data-test-id="member-nav-logo"
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#1f2937",
              textDecoration: "none",
            }}
          >
            ClubOS
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
                    padding: "12px 16px",
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "#2563eb",
                    textDecoration: "none",
                    borderRadius: "6px",
                    // Ensures minimum tap target of 44px
                    minHeight: "44px",
                    lineHeight: "20px",
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
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "24px 20px",
          // Ensures content is readable on wide screens
          lineHeight: 1.6,
        }}
      >
        {children}
      </main>

      {/* ========================================
          FOOTER
          Simple footer with copyright. Can be expanded later.
          ======================================== */}
      <footer
        data-test-id="member-footer"
        style={{
          borderTop: "1px solid #e5e7eb",
          padding: "20px",
          textAlign: "center",
          fontSize: "14px",
          color: "#6b7280",
          marginTop: "40px",
        }}
      >
        ClubOS
      </footer>
    </div>
  );
}
