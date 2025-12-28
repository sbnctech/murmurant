/**
 * Email Service Module
 * Phase 0: Core email abstractions and implementations
 */

// Types
export type {
  EmailRecipient,
  EmailAttachment,
  EmailMessage,
  EmailTemplate,
  EmailTemplateData,
  EmailStatus,
  EmailResult,
  BulkEmailResult,
  BulkEmailJob,
  EmailCampaign,
  EmailCampaignStats,
} from "./types";

// Interface
export type { EmailService, EmailServiceFactory } from "./EmailService";

// Implementations
export {
  ResendEmailService,
  createResendEmailService,
  type ResendConfig,
} from "./ResendEmailService";

export {
  MockEmailService,
  getMockEmailService,
  resetMockEmailService,
} from "./MockEmailService";

// =============================================================================
// Factory
// =============================================================================

import type { EmailService } from "./EmailService";
import { MockEmailService } from "./MockEmailService";
import { createResendEmailService } from "./ResendEmailService";

/**
 * Get the appropriate email service based on environment
 */
export function getEmailService(): EmailService {
  // Use mock in test environment
  if (process.env.NODE_ENV === "test") {
    return new MockEmailService();
  }

  // Use mock if explicitly configured
  if (process.env.EMAIL_PROVIDER === "mock") {
    const mock = new MockEmailService();
    mock.logEmails = true;
    return mock;
  }

  // Use Resend if API key is configured
  if (process.env.RESEND_API_KEY) {
    return createResendEmailService();
  }

  // Default to mock with logging in development
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[Email] No email provider configured. Using MockEmailService. " +
        "Set RESEND_API_KEY to enable real email sending."
    );
    const mock = new MockEmailService();
    mock.logEmails = true;
    return mock;
  }

  // In production without config, throw error
  throw new Error(
    "No email provider configured. Set RESEND_API_KEY environment variable."
  );
}
