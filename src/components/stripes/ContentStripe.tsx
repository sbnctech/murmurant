/**
 * ContentStripe - General content section with optional title
 *
 * A simple stripe for displaying content with an optional heading.
 * Used for various sections on both public and member pages.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { ReactNode } from "react";
import Stripe, { StripeProps } from "./Stripe";

interface ContentStripeProps extends Omit<StripeProps, "children"> {
  /** Section title */
  title?: string;
  /** Section subtitle */
  subtitle?: string;
  /** Main content */
  children: ReactNode;
  /** Text alignment for header */
  headerAlign?: "left" | "center";
}

export default function ContentStripe({
  title,
  subtitle,
  children,
  headerAlign = "left",
  ...stripeProps
}: ContentStripeProps) {
  return (
    <Stripe {...stripeProps}>
      {(title || subtitle) && (
        <div
          style={{
            textAlign: headerAlign,
            marginBottom: "var(--token-space-lg)",
          }}
        >
          {title && (
            <h2
              data-test-id={`${stripeProps.testId || "content-stripe"}-title`}
              style={{
                fontSize: "var(--token-text-2xl)",
                fontWeight: "var(--token-weight-bold)",
                color: "var(--token-color-text)",
                marginTop: 0,
                marginBottom: subtitle ? "var(--token-space-xs)" : 0,
              }}
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p
              data-test-id={`${stripeProps.testId || "content-stripe"}-subtitle`}
              style={{
                fontSize: "var(--token-text-base)",
                color: "var(--token-color-text-muted)",
                marginTop: 0,
                marginBottom: 0,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </Stripe>
  );
}
