/**
 * Email Service Interface
 * Phase 0: Abstract interface for email operations
 */

import type {
  EmailMessage,
  EmailRecipient,
  EmailResult,
  BulkEmailResult,
  EmailStatus,
  EmailCampaign,
  EmailCampaignStats,
  EmailTemplateData,
} from "./types";

export interface EmailService {
  /**
   * Send a single email message
   */
  sendEmail(message: EmailMessage): Promise<EmailResult>;

  /**
   * Send an email using a pre-defined template
   */
  sendTemplatedEmail(
    templateId: string,
    recipient: EmailRecipient,
    data: EmailTemplateData
  ): Promise<EmailResult>;

  /**
   * Send multiple emails in bulk
   */
  sendBulkEmail(messages: EmailMessage[]): Promise<BulkEmailResult>;

  /**
   * Get the delivery status of a sent email
   */
  getEmailStatus(messageId: string): Promise<EmailStatus>;

  /**
   * Create an email campaign for scheduled/bulk sending
   */
  createCampaign(campaign: EmailCampaign): Promise<string>;

  /**
   * Get campaign statistics
   */
  getCampaignStats(campaignId: string): Promise<EmailCampaignStats>;

  /**
   * Cancel a scheduled campaign
   */
  cancelCampaign(campaignId: string): Promise<boolean>;
}

/**
 * Factory function type for creating email service instances
 */
export type EmailServiceFactory = () => EmailService;
