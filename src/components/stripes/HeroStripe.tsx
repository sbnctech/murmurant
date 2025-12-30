/**
 * HeroStripe - Marketing hero section
 *
 * A prominent hero section for marketing pages.
 * Supports title, subtitle, description, and CTA buttons.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { ReactNode } from "react";
import Stripe from "./Stripe";

interface HeroStripeProps {
  /** Main headline */
  title: string;
  /** Optional subtitle above title */
  subtitle?: string;
  /** Description text below title */
  description?: string;
  /** CTA buttons or other content */
  actions?: ReactNode;
  /** Background variant */
  background?: "default" | "muted" | "primary" | "primary-gradient" | "dark" | "dark-gradient";
  /** Text alignment */
  align?: "left" | "center";
  /** Test ID */
  testId?: string;
}

export default function HeroStripe({
  title,
  subtitle,
  description,
  actions,
  background = "primary",
  align = "center",
  testId = "hero-stripe",
}: HeroStripeProps) {
  return (
    <Stripe background={background} padding="xl" testId={testId}>
      <div
        style={{
          textAlign: align,
          maxWidth: align === "center" ? "800px" : "none",
          margin: align === "center" ? "0 auto" : "0",
        }}
      >
        {subtitle && (
          <p
            data-test-id={`${testId}-subtitle`}
            style={{
              fontSize: "var(--token-text-sm)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "var(--token-space-sm)",
              opacity: 0.9,
            }}
          >
            {subtitle}
          </p>
        )}

        <h1
          data-test-id={`${testId}-title`}
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: "var(--token-weight-bold)",
            lineHeight: 1.2,
            marginTop: 0,
            marginBottom: "var(--token-space-md)",
          }}
        >
          {title}
        </h1>

        {description && (
          <p
            data-test-id={`${testId}-description`}
            style={{
              fontSize: "var(--token-text-lg)",
              lineHeight: "var(--token-leading-normal)",
              marginBottom: "var(--token-space-lg)",
              opacity: 0.9,
            }}
          >
            {description}
          </p>
        )}

        {actions && (
          <div
            data-test-id={`${testId}-actions`}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--token-space-sm)",
              justifyContent: align === "center" ? "center" : "flex-start",
            }}
          >
            {actions}
          </div>
        )}
      </div>
    </Stripe>
  );
}
