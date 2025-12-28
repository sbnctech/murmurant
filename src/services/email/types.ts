/**
 * Email Service Types
 * Phase 0: Core abstractions for email functionality
 */

// =============================================================================
// Core Types
// =============================================================================

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface EmailMessage {
  to: EmailRecipient | EmailRecipient[];
  from?: EmailRecipient;
  replyTo?: EmailRecipient;
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  tags?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Template Types
// =============================================================================

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlTemplate: string;
  textTemplate?: string;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type EmailTemplateData = Record<string, unknown>;

// =============================================================================
// Result Types
// =============================================================================

export type EmailStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "complained"
  | "failed";

export interface EmailResult {
  success: boolean;
  messageId?: string;
  status: EmailStatus;
  error?: string;
  timestamp: Date;
}

export interface BulkEmailResult {
  total: number;
  successful: number;
  failed: number;
  results: EmailResult[];
}

// =============================================================================
// Campaign Types
// =============================================================================

export interface BulkEmailJob {
  id: string;
  campaignId?: string;
  messages: EmailMessage[];
  status: "pending" | "processing" | "completed" | "failed";
  progress: {
    total: number;
    sent: number;
    failed: number;
  };
  createdAt: Date;
  completedAt?: Date;
}

export interface EmailCampaign {
  id?: string;
  name: string;
  subject: string;
  templateId?: string;
  recipients: EmailRecipient[];
  scheduledAt?: Date;
  status: "draft" | "scheduled" | "sending" | "sent" | "cancelled";
  metadata?: Record<string, unknown>;
}

export interface EmailCampaignStats {
  campaignId: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  openRate: number;
  clickRate: number;
}
