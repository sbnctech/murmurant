/**
 * @deprecated Use Section from src/components/sections instead.
 *
 * Stripe was a legacy name for a layout wrapper. "Section" matches intent:
 * a layout-only wrapper that groups Blocks and provides consistent spacing.
 *
 * Copyright © 2025 Murmurant, Inc.
 */
import React from "react";
import { Section, SectionProps } from "../sections/Section";

/** @deprecated Use SectionProps instead. */
export type StripeProps = SectionProps;

/** @deprecated Use Section instead. */
export function Stripe(props: StripeProps) {
  return <Section {...props} />;
}

export default Stripe;
