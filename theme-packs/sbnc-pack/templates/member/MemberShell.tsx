import { ReactNode } from "react";
import Link from "next/link";

/**
 * MemberShell - Main layout shell for member-facing pages
 *
 * Provides the complete page structure including:
 * - Top navigation bar
 * - Main content area
 * - Footer
 *
 * All styling uses CSS custom properties from the theme system.
 *
 * Props:
 * - children: Page content
 * - navItems: Navigation items (optional, uses defaults)
 * - brandName: Brand/logo text (default: "Murmurant")
 */

type NavItem = {
  label: string;
  href: string;
  testId?: string;
};

type MemberShellProps = {
  children: ReactNode;
  navItems?: NavItem[];
  brandName?: string;
};

const defaultNavItems: NavItem[] = [
  { label: "My Club", href: "/member", testId: "member-nav-home" },
  { label: "Events", href: "/member/events", testId: "member-nav-events" },
  { label: "Account", href: "/member/account", testId: "member-nav-account" },
];

export default function MemberShell({
  children,
  navItems = defaultNavItems,
  brandName = "Murmurant",
}: MemberShellProps) {
  return (
    <div
      data-test-id="member-shell"
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--token-color-background)",
        fontFamily: "var(--token-font-sans)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ========================================
          TOP NAVIGATION BAR
          ======================================== */}
      <header
        data-test-id="member-shell-header"
        style={{
          backgroundColor: "var(--token-color-surface)",
          borderBottom: "1px solid var(--token-color-border)",
          height: "var(--token-layout-nav-height)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <nav
          data-test-id="member-shell-nav"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: "var(--token-layout-page-max-width)",
            height: "100%",
            margin: "0 auto",
            padding: "0 var(--token-space-lg)",
          }}
        >
          {/* Logo / Brand */}
          <Link
            href="/member"
            data-test-id="member-shell-logo"
            style={{
              fontSize: "var(--token-text-xl)",
              fontWeight: "var(--token-weight-bold)",
              color: "var(--token-color-primary)",
              textDecoration: "none",
            }}
          >
            {brandName}
          </Link>

          {/* Primary navigation links */}
          <ul
            style={{
              display: "flex",
              gap: "var(--token-space-xs)",
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}
          >
            {navItems.map((item, index) => (
              <li key={item.testId || index}>
                <Link
                  href={item.href}
                  data-test-id={item.testId}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "var(--token-space-sm) var(--token-space-md)",
                    fontSize: "var(--token-text-base)",
                    fontWeight: "var(--token-weight-medium)",
                    color: "var(--token-color-primary)",
                    textDecoration: "none",
                    borderRadius: "var(--token-radius-md)",
                    minHeight: "44px",
                    transition: "background-color 0.15s ease",
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* ========================================
          MAIN CONTENT AREA
          ======================================== */}
      <main
        data-test-id="member-shell-main"
        style={{
          flex: 1,
          maxWidth: "var(--token-layout-page-max-width)",
          width: "100%",
          margin: "0 auto",
          padding: "var(--token-space-lg)",
          lineHeight: "var(--token-leading-normal)",
        }}
      >
        {children}
      </main>

      {/* ========================================
          FOOTER
          ======================================== */}
      <footer
        data-test-id="member-shell-footer"
        style={{
          borderTop: "1px solid var(--token-color-border)",
          padding: "var(--token-space-lg)",
          textAlign: "center",
          fontSize: "var(--token-text-sm)",
          color: "var(--token-color-text-muted)",
          backgroundColor: "var(--token-color-surface)",
        }}
      >
        <p style={{ margin: 0 }}>{brandName}</p>
      </footer>
    </div>
  );
}
