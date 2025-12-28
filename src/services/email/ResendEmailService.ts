/**
 * Resend Email Service Implementation
 * Implements EmailService interface using Resend API
 *
 * @see https://resend.com/docs
 */

import { Resend } from "resend";
import type { CreateEmailOptions } from "resend";
import { render } from "@react-email/components";
import type { EmailService } from "./EmailService";
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
import { getEmailTemplate } from "./templates";

export interface ResendConfig {
  apiKey: string;
  defaultFrom?: EmailRecipient;
  webhookSecret?: string;
}

/**
 * Maximum batch size for Resend batch API
 */
const BATCH_SIZE = 100;

/**
 * Maps Resend email status to our internal EmailStatus type
 */
function mapResendStatus(status: string): EmailStatus {
  switch (status) {
    case "queued":
      return "queued";
    case "sent":
      return "sent";
    case "delivered":
      return "delivered";
    case "bounced":
      return "bounced";
    case "complained":
      return "complained";
    case "delivery_delayed":
    case "scheduled":
      return "queued";
    case "canceled":
    case "failed":
      return "failed";
    case "opened":
      return "opened";
    case "clicked":
      return "clicked";
    default:
      return "queued";
  }
}

export class ResendEmailService implements EmailService {
  private client: Resend;
  private config: ResendConfig;

  constructor(config: ResendConfig) {
    this.config = config;
    this.client = new Resend(config.apiKey);
  }

  /**
   * Format a recipient for Resend API
   */
  private formatRecipient(recipient: EmailRecipient): string {
    if (recipient.name) {
      return `${recipient.name} <${recipient.email}>`;
    }
    return recipient.email;
  }

  /**
   * Format recipients array for Resend API
   */
  private formatRecipients(
    recipients: EmailRecipient | EmailRecipient[]
  ): string[] {
    const recipientArray = Array.isArray(recipients)
      ? recipients
      : [recipients];
    return recipientArray.map((r) => this.formatRecipient(r));
  }

  /**
   * Get the from address, using default if not specified
   */
  private getFromAddress(from?: EmailRecipient): string {
    const sender = from || this.config.defaultFrom;
    if (!sender) {
      throw new Error("No from address specified and no default configured");
    }
    return this.formatRecipient(sender);
  }

  /**
   * Build CreateEmailOptions for Resend API
   */
  private buildEmailPayload(message: EmailMessage): CreateEmailOptions {
    const base = {
      from: this.getFromAddress(message.from),
      to: this.formatRecipients(message.to),
      subject: message.subject,
      replyTo: message.replyTo
        ? this.formatRecipient(message.replyTo)
        : undefined,
      attachments: message.attachments?.map((a) => ({
        filename: a.filename,
        content:
          typeof a.content === "string"
            ? a.content
            : a.content.toString("base64"),
        contentType: a.contentType,
      })),
      tags: message.tags
        ? Object.entries(message.tags).map(([name, value]) => ({ name, value }))
        : undefined,
    };

    // Resend requires either html or text to be present (not both optional)
    if (message.html) {
      return { ...base, html: message.html } as CreateEmailOptions;
    } else if (message.text) {
      return { ...base, text: message.text } as CreateEmailOptions;
    } else {
      // Default to empty text if neither provided
      return { ...base, text: "" } as CreateEmailOptions;
    }
  }

  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    const payload = this.buildEmailPayload(message);
    const { data, error } = await this.client.emails.send(payload);

    if (error) {
      return {
        success: false,
        status: "failed",
        error: error.message,
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      messageId: data?.id,
      status: "queued",
      timestamp: new Date(),
    };
  }

  async sendTemplatedEmail(
    templateId: string,
    recipient: EmailRecipient,
    data: EmailTemplateData
  ): Promise<EmailResult> {
    const Template = getEmailTemplate(templateId);

    if (!Template) {
      return {
        success: false,
        status: "failed",
        error: `Template not found: ${templateId}`,
        timestamp: new Date(),
      };
    }

    // Render the React Email template to HTML
    const html = await render(Template(data));

    // Extract subject from data or use default
    const subject =
      typeof data.subject === "string"
        ? data.subject
        : `Message from ${this.config.defaultFrom?.name || "ClubOS"}`;

    return this.sendEmail({
      to: recipient,
      subject,
      html,
    });
  }

  async sendBulkEmail(messages: EmailMessage[]): Promise<BulkEmailResult> {
    const results: EmailResult[] = [];
    let successful = 0;
    let failed = 0;

    // Process messages in batches of BATCH_SIZE
    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      const batch = messages.slice(i, i + BATCH_SIZE);
      const batchRequests = batch.map((m) => this.buildEmailPayload(m));

      const { data, error } = await this.client.batch.send(batchRequests);

      if (error) {
        // If entire batch fails, mark all as failed
        for (let j = 0; j < batch.length; j++) {
          results.push({
            success: false,
            status: "failed",
            error: error.message,
            timestamp: new Date(),
          });
          failed++;
        }
      } else if (data) {
        // Process individual results
        for (const result of data.data) {
          if ("id" in result && typeof result.id === "string") {
            results.push({
              success: true,
              messageId: result.id,
              status: "queued",
              timestamp: new Date(),
            });
            successful++;
          } else {
            results.push({
              success: false,
              status: "failed",
              error: "Unknown error in batch result",
              timestamp: new Date(),
            });
            failed++;
          }
        }
      }

      // Rate limiting: pause between batches if there are more to process
      if (i + BATCH_SIZE < messages.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return {
      total: messages.length,
      successful,
      failed,
      results,
    };
  }

  async getEmailStatus(messageId: string): Promise<EmailStatus> {
    const { data, error } = await this.client.emails.get(messageId);

    if (error || !data) {
      throw new Error(error?.message || "Failed to retrieve email status");
    }

    // Resend returns last_event which indicates the current status
    const status = data.last_event;
    if (!status) {
      return "queued";
    }

    return mapResendStatus(status);
  }

  async createCampaign(_campaign: EmailCampaign): Promise<string> {
    // Resend doesn't have native campaigns - would need job queue integration
    throw new Error(
      "ResendEmailService.createCampaign not implemented. Use sendBulkEmail for immediate sending or integrate a job queue for scheduling."
    );
  }

  async getCampaignStats(_campaignId: string): Promise<EmailCampaignStats> {
    throw new Error(
      "ResendEmailService.getCampaignStats not implemented. Campaign tracking requires database storage."
    );
  }

  async cancelCampaign(_campaignId: string): Promise<boolean> {
    throw new Error(
      "ResendEmailService.cancelCampaign not implemented. Campaign management requires database storage."
    );
  }
}

/**
 * Create a ResendEmailService instance from environment variables
 */
export function createResendEmailService(): ResendEmailService {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }

  return new ResendEmailService({
    apiKey,
    defaultFrom: {
      email: process.env.EMAIL_FROM_ADDRESS || "noreply@example.com",
      name: process.env.EMAIL_FROM_NAME || "ClubOS",
    },
  });
}
