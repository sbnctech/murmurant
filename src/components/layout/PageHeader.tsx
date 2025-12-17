import { ReactNode } from "react";

/**
 * PageHeader - Token-based page header component
 *
 * A consistent header component for both member and admin pages.
 * Uses CSS custom properties from the theme system.
 *
 * Props:
 * - title: Main page title
 * - subtitle: Optional subtitle or description
 * - actions: Optional slot for action buttons
 * - breadcrumb: Optional breadcrumb content
 */

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  testId?: string;
};

export default function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
  testId = "page-header",
}: PageHeaderProps) {
  return (
    <header
      data-test-id={testId}
      style={{
        marginBottom: "var(--token-space-lg)",
      }}
    >
      {/* Breadcrumb */}
      {breadcrumb && (
        <nav
          data-test-id={`${testId}-breadcrumb`}
          style={{
            fontSize: "var(--token-text-sm)",
            color: "var(--token-color-text-muted)",
            marginBottom: "var(--token-space-sm)",
          }}
        >
          {breadcrumb}
        </nav>
      )}

      {/* Title row with optional actions */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--token-space-md)",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            data-test-id={`${testId}-title`}
            style={{
              fontSize: "var(--token-text-2xl)",
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
              data-test-id={`${testId}-subtitle`}
              style={{
                fontSize: "var(--token-text-base)",
                color: "var(--token-color-text-muted)",
                marginTop: "var(--token-space-xs)",
                marginBottom: 0,
                lineHeight: "var(--token-leading-normal)",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div
            data-test-id={`${testId}-actions`}
            style={{
              display: "flex",
              gap: "var(--token-space-sm)",
              flexWrap: "wrap",
            }}
          >
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
