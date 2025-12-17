import { ReactNode } from "react";

/**
 * MemberContentTemplate - Standard content page template
 *
 * Designed for member-facing content pages like:
 * - Articles and blog posts
 * - Policies and guidelines
 * - FAQs and help content
 *
 * Features:
 * - Readable, centered content width
 * - Optional sidebar for navigation or related content
 * - Consistent typography and spacing
 *
 * Props:
 * - title: Page title
 * - subtitle: Optional subtitle/byline
 * - children: Main content
 * - sidebar: Optional sidebar content
 * - sidebarPosition: left or right (default: right)
 */

type MemberContentTemplateProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  sidebar?: ReactNode;
  sidebarPosition?: "left" | "right";
  breadcrumb?: ReactNode;
};

export default function MemberContentTemplate({
  title,
  subtitle,
  children,
  sidebar,
  sidebarPosition = "right",
  breadcrumb,
}: MemberContentTemplateProps) {
  const hasSidebar = Boolean(sidebar);

  return (
    <div data-test-id="member-content-template">
      {/* Breadcrumb */}
      {breadcrumb && (
        <nav
          data-test-id="member-content-breadcrumb"
          style={{
            fontSize: "var(--token-text-sm)",
            color: "var(--token-color-text-muted)",
            marginBottom: "var(--token-space-md)",
          }}
        >
          {breadcrumb}
        </nav>
      )}

      {/* Main layout grid */}
      <div
        style={{
          display: hasSidebar ? "grid" : "block",
          gridTemplateColumns:
            hasSidebar && sidebarPosition === "left"
              ? "var(--token-layout-sidebar-width) 1fr"
              : hasSidebar
                ? "1fr var(--token-layout-sidebar-width)"
                : undefined,
          gap: "var(--token-space-2xl)",
          alignItems: "start",
        }}
      >
        {/* Sidebar (left position) */}
        {hasSidebar && sidebarPosition === "left" && (
          <aside
            data-test-id="member-content-sidebar"
            style={{
              position: "sticky",
              top: "calc(var(--token-layout-nav-height) + var(--token-space-lg))",
            }}
          >
            {sidebar}
          </aside>
        )}

        {/* Main content */}
        <article
          data-test-id="member-content-main"
          style={{
            maxWidth: hasSidebar ? "none" : "var(--token-layout-content-max-width)",
            margin: hasSidebar ? 0 : "0 auto",
          }}
        >
          {/* Page header */}
          <header
            data-test-id="member-content-header"
            style={{
              marginBottom: "var(--token-space-xl)",
            }}
          >
            <h1
              data-test-id="member-content-title"
              style={{
                fontSize: "var(--token-text-3xl)",
                fontWeight: "var(--token-weight-bold)",
                color: "var(--token-color-text)",
                margin: 0,
                lineHeight: "var(--token-leading-tight)",
              }}
            >
              {title}
            </h1>

            {subtitle && (
              <p
                data-test-id="member-content-subtitle"
                style={{
                  fontSize: "var(--token-text-lg)",
                  color: "var(--token-color-text-muted)",
                  marginTop: "var(--token-space-sm)",
                  marginBottom: 0,
                }}
              >
                {subtitle}
              </p>
            )}
          </header>

          {/* Content body with prose styling */}
          <div
            data-test-id="member-content-body"
            style={{
              fontSize: "var(--token-text-base)",
              lineHeight: "var(--token-leading-relaxed)",
              color: "var(--token-color-text)",
            }}
          >
            {children}
          </div>
        </article>

        {/* Sidebar (right position) */}
        {hasSidebar && sidebarPosition === "right" && (
          <aside
            data-test-id="member-content-sidebar"
            style={{
              position: "sticky",
              top: "calc(var(--token-layout-nav-height) + var(--token-space-lg))",
            }}
          >
            {sidebar}
          </aside>
        )}
      </div>
    </div>
  );
}
