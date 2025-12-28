/**
 * Services Module
 *
 * Centralized exports for all service interfaces and factories.
 */

// Factory functions
export {
  getAuthService,
  getEmailService,
  getPaymentService,
  getRBACService,
} from "./factory";

// Service interfaces
export type { AuthService } from "./auth";
export type { EmailService } from "./email";
export type { PaymentService } from "./payments";
export type { RBACService } from "./rbac";
