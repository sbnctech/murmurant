/**
 * Stripe - Base component for page sections
 *
 * A stripe is a full-width horizontal section of a page.
 * Stripes can contain various layouts (single column, two-column, hero, etc.)
 *
 * Supports gradient backgrounds for a modern, premium feel.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { ReactNode } from "react";

export interface StripeProps {
  children: ReactNode;
  /** Background variant */
  background?: "default" | "muted" | "primary" | "primary-gradient" | "dark" | "dark-gradient";
  /** Vertical padding size */
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  /** Test ID for testing */
  testId?: string;
  /** Additional CSS styles */
  style?: React.CSSProperties;
}

const backgroundStyles: Record<string, React.CSSProperties> = {
  default: {
    backgroundColor: "var(--token-color-surface)",
  },
  muted: {
    backgroundColor: "var(--token-color-surface-2)",
  },
  primary: {
    backgroundColor: "var(--token-color-primary)",
    color: "#fff",
  },
  "primary-gradient": {
    background: "linear-gradient(135deg, var(--token-color-primary) 0%, #6366f1 50%, #8b5cf6 100%)",
    color: "#fff",
  },
  dark: {
    backgroundColor: "#1f2937",
    color: "#fff",
  },
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

export default function Stripe({
  children,
  background = "default",
  padding = "md",
  testId = "stripe",
  style = {},
}: StripeProps) {
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
