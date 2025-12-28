/**
 * Service Factory
 *
 * Factory functions for getting service implementations based on feature flags.
 * Enables gradual migration from Wild Apricot to native services.
 */

import { isFeatureEnabled } from "@/lib/config/featureFlags";
import type { AuthService } from "./auth";
import type { EmailService } from "./email";
import type { PaymentService } from "./payments";
import type { RBACService } from "./rbac";

/**
 * Get the authentication service
 * - NATIVE_AUTH enabled: Uses NativeAuthService
 * - Default: Throws until WA auth adapter is configured
 */
export async function getAuthService(): Promise<AuthService> {
  if (isFeatureEnabled("NATIVE_AUTH")) {
    const { NativeAuthService } = await import("./auth/NativeAuthService");
    return new NativeAuthService();
  }
  // Default: throw until WA auth adapter is wired
  throw new Error(
    "Auth service not configured. Enable CLUBOS_NATIVE_AUTH or configure WA adapter."
  );
}

/**
 * Get the email service
 * - NATIVE_EMAIL enabled: Uses ResendEmailService via factory
 * - Default: Uses MockEmailService
 */
export async function getEmailService(): Promise<EmailService> {
  if (isFeatureEnabled("NATIVE_EMAIL")) {
    const { createResendEmailService } = await import(
      "./email/ResendEmailService"
    );
    return createResendEmailService();
  }
  const { MockEmailService } = await import("./email/MockEmailService");
  return new MockEmailService();
}

/**
 * Get the payment service
 * - NATIVE_PAYMENTS enabled: Uses StripePaymentService
 * - Default: Uses MockPaymentService
 */
export async function getPaymentService(): Promise<PaymentService> {
  if (isFeatureEnabled("NATIVE_PAYMENTS")) {
    const { StripePaymentService } = await import(
      "./payments/StripePaymentService"
    );
    return new StripePaymentService(process.env.STRIPE_SECRET_KEY || "");
  }
  const { MockPaymentService } = await import("./payments/MockPaymentService");
  return new MockPaymentService();
}

/**
 * Get the RBAC service
 * Always uses NativeRBACService (no WA equivalent)
 */
export async function getRBACService(): Promise<RBACService> {
  const { NativeRBACService } = await import("./rbac/NativeRBACService");
  return new NativeRBACService();
}
