/**
 * External Links Configuration
 *
 * Configurable URLs for external services and features.
 * These can be overridden via environment variables.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

/**
 * Gift Certificate purchase URL.
 * Override with NEXT_PUBLIC_GIFT_CERTIFICATE_URL env variable.
 */
export const GIFT_CERTIFICATE_URL =
  process.env.NEXT_PUBLIC_GIFT_CERTIFICATE_URL ||
  "https://sbnewcomers.org/gift-certificates";

/**
 * Main club website URL.
 */
export const CLUB_WEBSITE_URL =
  process.env.NEXT_PUBLIC_CLUB_WEBSITE_URL ||
  "https://sbnewcomers.org";
