import { ReactNode } from "react";
import Link from "next/link";

/**
 * AdminShell - Main layout shell for admin pages
 *
 * Provides the complete admin page structure including:
 * - Top navigation bar
 * - Optional sidebar navigation
 * - Main content area
 *
 * All styling uses CSS custom properties from the theme system.
 *
 * Props:
 * - children: Page content
 * - navItems: Top navigation items
 * - sidebarItems: Optional sidebar navigation
 * - brandName: Brand/logo text
 * - showSidebar: Whether to show sidebar
 */

type NavItem = {
  label: string;
  href: string;
  testId?: string;
  active?: boolean;
};

type AdminShellProps = {
  children: ReactNode;
  navItems?: NavItem[];
  sidebarItems?: NavItem[];
  brandName?: string;
  showSidebar?: boolean;
};

const defaultNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", testId: "admin-nav-dashboard" },
  { label: "Members", href: "/admin/members", testId: "admin-nav-members" },
  { label: "Events", href: "/admin/events", testId: "admin-nav-events" },
];

export default function AdminShell({
  children,
  navItems = defaultNavItems,
  sidebarItems,
  brandName = "Murmurant Admin",
  showSidebar = false,
}: AdminShellProps) {
  const hasSidebar = showSidebar && sidebarItems && sidebarItems.length > 0;

  return (
    <div
      data-test-id="admin-shell"
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
        data-test-id="admin-shell-header"
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
          data-test-id="admin-shell-nav"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "100%",
            padding: "0 var(--token-space-lg)",
          }}
        >
          {/* Logo / Brand */}
          <Link
            href="/admin"
            data-test-id="admin-shell-logo"
            style={{
              fontSize: "var(--token-text-lg)",
              fontWeight: "var(--token-weight-bold)",
              color: "var(--token-color-text)",
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
                    fontSize: "var(--token-text-sm)",
                    fontWeight: "var(--token-weight-medium)",
                    color: item.active
                      ? "var(--token-color-primary)"
                      : "var(--token-color-text-muted)",
                    textDecoration: "none",
                    borderRadius: "var(--token-radius-md)",
                    minHeight: "36px",
                    transition: "color 0.15s ease",
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
          CONTENT AREA (with optional sidebar)
          ======================================== */}
      <div
        style={{
          flex: 1,
          display: hasSidebar ? "flex" : "block",
        }}
      >
        {/* Sidebar */}
        {hasSidebar && (
          <aside
            data-test-id="admin-shell-sidebar"
            style={{
              width: "var(--token-layout-sidebar-width)",
              backgroundColor: "var(--token-color-surface)",
              borderRight: "1px solid var(--token-color-border)",
              padding: "var(--token-space-md)",
              flexShrink: 0,
            }}
          >
            <nav>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                }}
              >
                {sidebarItems?.map((item, index) => (
                  <li key={item.testId || index}>
                    <Link
                      href={item.href}
                      data-test-id={item.testId}
                      style={{
                        display: "block",
                        padding: "var(--token-space-sm) var(--token-space-md)",
                        fontSize: "var(--token-text-sm)",
                        fontWeight: item.active
                          ? "var(--token-weight-medium)"
                          : "var(--token-weight-normal)",
                        color: item.active
                          ? "var(--token-color-primary)"
                          : "var(--token-color-text)",
                        textDecoration: "none",
                        borderRadius: "var(--token-radius-md)",
                        backgroundColor: item.active
                          ? "var(--token-color-surface-2)"
                          : "transparent",
                        marginBottom: "var(--token-space-xs)",
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}

        {/* Main content */}
        <main
          data-test-id="admin-shell-main"
          style={{
            flex: 1,
            padding: "var(--token-space-lg)",
            minWidth: 0, // Prevents flex child from overflowing
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
