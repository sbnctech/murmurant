/**
 * Mock Email Service Implementation
 * For testing and development without sending real emails
 */

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

interface SentEmail {
  id: string;
  message: EmailMessage;
  status: EmailStatus;
  sentAt: Date;
}

interface MockCampaign {
  id: string;
  campaign: EmailCampaign;
  createdAt: Date;
}

export class MockEmailService implements EmailService {
  private sentEmails: Map<string, SentEmail> = new Map();
  private campaigns: Map<string, MockCampaign> = new Map();
  private messageIdCounter = 0;
  private campaignIdCounter = 0;

  /**
   * Enable logging of sent emails to console
   */
  public logEmails = false;

  /**
   * Simulate failures for testing error handling
   */
  public shouldFail = false;
  public failureRate = 0;

  private generateMessageId(): string {
    return `mock-msg-${++this.messageIdCounter}-${Date.now()}`;
  }

  private generateCampaignId(): string {
    return `mock-campaign-${++this.campaignIdCounter}-${Date.now()}`;
  }

  private shouldSimulateFail(): boolean {
    if (this.shouldFail) return true;
    if (this.failureRate > 0) {
      return Math.random() < this.failureRate;
    }
    return false;
  }

  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    const messageId = this.generateMessageId();
    const timestamp = new Date();

    if (this.shouldSimulateFail()) {
      return {
        success: false,
        messageId,
        status: "failed",
        error: "Simulated failure for testing",
        timestamp,
      };
    }

    const sentEmail: SentEmail = {
      id: messageId,
      message,
      status: "sent",
      sentAt: timestamp,
    };

    this.sentEmails.set(messageId, sentEmail);

    if (this.logEmails) {
      const recipients = Array.isArray(message.to) ? message.to : [message.to];
      console.log(`[MockEmail] Sent to: ${recipients.map((r) => r.email).join(", ")}`);
      console.log(`[MockEmail] Subject: ${message.subject}`);
      console.log(`[MockEmail] Message ID: ${messageId}`);
    }

    return {
      success: true,
      messageId,
      status: "sent",
      timestamp,
    };
  }

  async sendTemplatedEmail(
    templateId: string,
    recipient: EmailRecipient,
    data: EmailTemplateData
  ): Promise<EmailResult> {
    // For mock, just send a basic email with template info
    const message: EmailMessage = {
      to: recipient,
      subject: `[Template: ${templateId}]`,
      text: `Template email with data: ${JSON.stringify(data)}`,
      metadata: { templateId, templateData: data },
    };

    return this.sendEmail(message);
  }

  async sendBulkEmail(messages: EmailMessage[]): Promise<BulkEmailResult> {
    const results: EmailResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const message of messages) {
      const result = await this.sendEmail(message);
      results.push(result);
      if (result.success) {
        successful++;
      } else {
        failed++;
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
    const email = this.sentEmails.get(messageId);
    if (!email) {
      return "failed";
    }
    return email.status;
  }

  async createCampaign(campaign: EmailCampaign): Promise<string> {
    const campaignId = campaign.id || this.generateCampaignId();

    this.campaigns.set(campaignId, {
      id: campaignId,
      campaign: { ...campaign, id: campaignId, status: "draft" },
      createdAt: new Date(),
    });

    if (this.logEmails) {
      console.log(`[MockEmail] Campaign created: ${campaignId}`);
      console.log(`[MockEmail] Name: ${campaign.name}`);
      console.log(`[MockEmail] Recipients: ${campaign.recipients.length}`);
    }

    return campaignId;
  }

  async getCampaignStats(campaignId: string): Promise<EmailCampaignStats> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    // Return mock stats
    const sent = campaign.campaign.recipients.length;
    return {
      campaignId,
      sent,
      delivered: Math.floor(sent * 0.98),
      opened: Math.floor(sent * 0.35),
      clicked: Math.floor(sent * 0.12),
      bounced: Math.floor(sent * 0.02),
      complained: 0,
      openRate: 0.35,
      clickRate: 0.12,
    };
  }

  async cancelCampaign(campaignId: string): Promise<boolean> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      return false;
    }

    campaign.campaign.status = "cancelled";
    return true;
  }

  // ==========================================================================
  // Test Helper Methods
  // ==========================================================================

  /**
   * Get all sent emails (for test assertions)
   */
  getSentEmails(): SentEmail[] {
    return Array.from(this.sentEmails.values());
  }

  /**
   * Get emails sent to a specific address
   */
  getEmailsTo(email: string): SentEmail[] {
    return this.getSentEmails().filter((sent) => {
      const recipients = Array.isArray(sent.message.to)
        ? sent.message.to
        : [sent.message.to];
      return recipients.some((r) => r.email === email);
    });
  }

  /**
   * Clear all sent emails (for test cleanup)
   */
  clear(): void {
    this.sentEmails.clear();
    this.campaigns.clear();
    this.messageIdCounter = 0;
    this.campaignIdCounter = 0;
  }

  /**
   * Get count of sent emails
   */
  getSentCount(): number {
    return this.sentEmails.size;
  }
}

/**
 * Singleton mock service for easy testing
 */
let mockInstance: MockEmailService | null = null;

export function getMockEmailService(): MockEmailService {
  if (!mockInstance) {
    mockInstance = new MockEmailService();
  }
  return mockInstance;
}

export function resetMockEmailService(): void {
  if (mockInstance) {
    mockInstance.clear();
  }
  mockInstance = null;
}
