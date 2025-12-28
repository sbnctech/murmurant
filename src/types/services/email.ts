/**
 * Email Service Interface Types
 */

export type EmailStatus =
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "bounced"
  | "failed";

export interface EmailRecipient {
  email: string;
  name?: string;
  memberId?: string;
}

export interface EmailMessage {
  id: string;
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  status: EmailStatus;
  templateId?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  errorMessage?: string;
}

export interface SendEmailInput {
  to: EmailRecipient | EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  replyTo?: string;
  tags?: string[];
}

export interface SendTemplateInput {
  to: EmailRecipient | EmailRecipient[];
  templateId: string;
  variables: Record<string, string | number | boolean>;
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  replyTo?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateInput {
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface EmailService {
  send(input: SendEmailInput): Promise<EmailMessage>;
  sendTemplate(input: SendTemplateInput): Promise<EmailMessage>;
  sendBulk(recipients: EmailRecipient[], input: Omit<SendEmailInput, "to">): Promise<string[]>;
  getStatus(messageId: string): Promise<EmailMessage | null>;
  getMemberEmails(memberId: string, limit?: number): Promise<EmailMessage[]>;
  getTemplate(templateId: string): Promise<EmailTemplate | null>;
  listTemplates(): Promise<EmailTemplate[]>;
  createTemplate(input: CreateTemplateInput): Promise<EmailTemplate>;
}
