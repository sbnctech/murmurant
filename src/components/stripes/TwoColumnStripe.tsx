/**
 * TwoColumnStripe - Two-column layout stripe
 *
 * Displays content in two columns on desktop, stacks on mobile.
 * Used for the member home page "My SBNC" layout.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { ReactNode } from "react";
import Stripe, { StripeProps } from "./Stripe";

interface TwoColumnStripeProps extends Omit<StripeProps, "children"> {
  /** Left column content (utility-first on member home) */
  left: ReactNode;
  /** Right column content (curated/social on member home) */
  right: ReactNode;
  /** Column width ratio */
  ratio?: "equal" | "left-heavy" | "right-heavy";
  /** Gap between columns */
  gap?: "sm" | "md" | "lg";
  /** Reverse stack order on mobile */
  reverseOnMobile?: boolean;
}

const ratioStyles: Record<string, { left: string; right: string }> = {
  equal: { left: "1fr", right: "1fr" },
  "left-heavy": { left: "3fr", right: "2fr" },
  "right-heavy": { left: "2fr", right: "3fr" },
};

const gapStyles: Record<string, string> = {
  sm: "var(--token-space-md)",
  md: "var(--token-space-lg)",
  lg: "calc(var(--token-space-lg) * 2)",
};

export default function TwoColumnStripe({
  left,
  right,
  ratio = "equal",
  gap = "md",
  reverseOnMobile = false,
  ...stripeProps
}: TwoColumnStripeProps) {
  const columns = ratioStyles[ratio];

  return (
    <Stripe {...stripeProps}>
      <div
        data-test-id="two-column-grid"
        style={{
          display: "grid",
          gridTemplateColumns: `${columns.left} ${columns.right}`,
          gap: gapStyles[gap],
        }}
      >
        {/* Left column */}
        <div
          data-test-id="two-column-left"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--token-space-md)",
          }}
        >
          {left}
        </div>

        {/* Right column */}
        <div
          data-test-id="two-column-right"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--token-space-md)",
          }}
        >
          {right}
        </div>
      </div>

      {/* CSS for responsive stacking */}
      <style>{`
        @media (max-width: 768px) {
          [data-test-id="two-column-grid"] {
            grid-template-columns: 1fr !important;
          }
          ${
            reverseOnMobile
              ? `
          [data-test-id="two-column-right"] {
            order: -1;
          }
          `
              : ""
          }
        }
      `}</style>
    </Stripe>
  );
}
