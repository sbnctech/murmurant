/**
 * Section - layout-only wrapper (formerly "Stripe")
 *
 * NOTE: Sections are NOT first-class product units. They are page layout wrappers
 * used to group Blocks and control full-width backgrounds + consistent padding.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */
import React, { ReactNode } from "react";

export interface SectionProps {
  children: ReactNode;
  background?: "default" | "muted" | "primary" | "primary-gradient" | "dark" | "dark-gradient";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  testId?: string;
  style?: React.CSSProperties;
}

const backgroundStyles: Record<string, React.CSSProperties> = {
  default: { backgroundColor: "var(--token-color-surface)" },
  muted: { backgroundColor: "var(--token-color-surface-2)" },
  primary: { backgroundColor: "var(--token-color-primary)", color: "#fff" },
  "primary-gradient": {
    background: "linear-gradient(135deg, var(--token-color-primary) 0%, #6366f1 50%, #8b5cf6 100%)",
    color: "#fff",
  },
  dark: { backgroundColor: "#1f2937", color: "#fff" },
  "dark-gradient": {
    background: "linear-gradient(135deg, #1f2937 0%, #374151 50%, #1f2937 100%)",
    color: "#fff",
  },
};

const paddingStyles: Record<string, string> = {
  none: "0",
  sm: "var(--token-space-md)",
  md: "var(--token-space-lg)",
  lg: "calc(var(--token-space-lg) * 2)",
  xl: "calc(var(--token-space-lg) * 3)",
};

export function Section({
  children,
  background = "default",
  padding = "md",
  testId = "section",
  style = {},
}: SectionProps) {
  return (
    <section
      data-test-id={testId}
      style={{
        width: "100%",
        paddingTop: paddingStyles[padding],
        paddingBottom: paddingStyles[padding],
        ...backgroundStyles[background],
        ...style,
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          paddingLeft: "var(--token-space-md)",
          paddingRight: "var(--token-space-md)",
        }}
      >
        {children}
      </div>
    </section>
  );
}

export default Section;
