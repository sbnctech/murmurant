import { ReactNode } from "react";

/**
 * SectionCard - Token-based card component for content sections
 *
 * A versatile card component that provides consistent styling
 * for content sections throughout the application.
 *
 * Props:
 * - title: Optional section title
 * - subtitle: Optional subtitle
 * - children: Card content
 * - padding: Padding size (none, sm, md, lg)
 * - variant: Card style variant (default, outlined, elevated)
 */

type SectionCardProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  variant?: "default" | "outlined" | "elevated";
  testId?: string;
  headerActions?: ReactNode;
};

const paddingMap = {
  none: "0",
  sm: "var(--token-space-sm)",
  md: "var(--token-space-md)",
  lg: "var(--token-space-lg)",
};

export default function SectionCard({
  title,
  subtitle,
  children,
  padding = "md",
  variant = "default",
  testId = "section-card",
  headerActions,
}: SectionCardProps) {
  const baseStyles: React.CSSProperties = {
    backgroundColor: "var(--token-color-surface)",
    borderRadius: "var(--token-radius-lg)",
    overflow: "hidden",
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      border: "1px solid var(--token-color-border)",
    },
    outlined: {
      border: "1px solid var(--token-color-border)",
      boxShadow: "none",
    },
    elevated: {
      border: "1px solid var(--token-color-border)",
      boxShadow: "var(--token-shadow-md)",
    },
  };

  const hasHeader = title || subtitle || headerActions;

  return (
    <section
      data-test-id={testId}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
      }}
    >
      {hasHeader && (
        <div
          data-test-id={`${testId}-header`}
          style={{
            padding: paddingMap[padding],
            borderBottom: "1px solid var(--token-color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--token-space-md)",
          }}
        >
          <div>
            {title && (
              <h2
                data-test-id={`${testId}-title`}
                style={{
                  fontSize: "var(--token-text-lg)",
                  fontWeight: "var(--token-weight-semibold)",
                  color: "var(--token-color-text)",
                  margin: 0,
                }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                data-test-id={`${testId}-subtitle`}
                style={{
                  fontSize: "var(--token-text-sm)",
                  color: "var(--token-color-text-muted)",
                  marginTop: "var(--token-space-xs)",
                  marginBottom: 0,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {headerActions && (
            <div data-test-id={`${testId}-header-actions`}>{headerActions}</div>
          )}
        </div>
      )}

      <div
        data-test-id={`${testId}-content`}
        style={{
          padding: paddingMap[padding],
        }}
      >
        {children}
      </div>
    </section>
  );
}
