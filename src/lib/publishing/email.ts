// Copyright © 2025 Murmurant, Inc.
// Email template token replacement and provider abstraction

import { prisma } from "@/lib/prisma";
import { formatClubDateLong, formatClubTime } from "@/lib/timezone";

// Token context for email template rendering
export type TokenContext = {
  member?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  };
  event?: {
    id: string;
    title: string;
    description?: string | null;
    location?: string | null;
    startTime: Date;
    endTime?: Date | null;
    category?: string | null;
  };
  club?: {
    name: string;
    website: string;
    email: string;
  };
  custom?: Record<string, string>;
};

// Default club info
const DEFAULT_CLUB_INFO = {
  name: "Santa Barbara Newcomers Club",
  website: "https://sbnewcomers.org",
  email: "info@sbnewcomers.org",
};

/**
 * Replace tokens in a template string
 * Tokens use {{object.field}} syntax
 */
export function replaceTokens(template: string, context: TokenContext): string {
  let result = template;

  // Member tokens
  if (context.member) {
    result = result.replace(/\{\{member\.firstName\}\}/g, escapeHtml(context.member.firstName));
    result = result.replace(/\{\{member\.lastName\}\}/g, escapeHtml(context.member.lastName));
    result = result.replace(
      /\{\{member\.fullName\}\}/g,
      escapeHtml(`${context.member.firstName} ${context.member.lastName}`)
    );
    result = result.replace(/\{\{member\.email\}\}/g, escapeHtml(context.member.email));
    result = result.replace(/\{\{member\.phone\}\}/g, escapeHtml(context.member.phone || ""));
  }

  // Event tokens
  if (context.event) {
    result = result.replace(/\{\{event\.title\}\}/g, escapeHtml(context.event.title));
    result = result.replace(/\{\{event\.description\}\}/g, escapeHtml(context.event.description || ""));
    result = result.replace(/\{\{event\.location\}\}/g, escapeHtml(context.event.location || ""));
    result = result.replace(/\{\{event\.category\}\}/g, escapeHtml(context.event.category || ""));
    result = result.replace(/\{\{event\.startDate\}\}/g, formatDate(context.event.startTime));
    result = result.replace(/\{\{event\.startTime\}\}/g, formatTime(context.event.startTime));
    result = result.replace(/\{\{event\.endDate\}\}/g, context.event.endTime ? formatDate(context.event.endTime) : "");
    result = result.replace(/\{\{event\.endTime\}\}/g, context.event.endTime ? formatTime(context.event.endTime) : "");
  }

  // Club tokens
  const club = context.club || DEFAULT_CLUB_INFO;
  result = result.replace(/\{\{club\.name\}\}/g, escapeHtml(club.name));
  result = result.replace(/\{\{club\.website\}\}/g, escapeHtml(club.website));
  result = result.replace(/\{\{club\.email\}\}/g, escapeHtml(club.email));

  // Custom tokens
  if (context.custom) {
    for (const [key, value] of Object.entries(context.custom)) {
      const regex = new RegExp(`\\{\\{custom\\.${key}\\}\\}`, "g");
      result = result.replace(regex, escapeHtml(value));
    }
  }

  // System tokens
  result = result.replace(/\{\{currentYear\}\}/g, new Date().getFullYear().toString());
  result = result.replace(/\{\{currentDate\}\}/g, formatDate(new Date()));

  return result;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  const escapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return str.replace(/[&<>"']/g, (char) => escapes[char] || char);
}

/**
 * Format date for display (uses club timezone)
 */
function formatDate(date: Date): string {
  return formatClubDateLong(date);
}

/**
 * Format time for display (uses club timezone)
 */
function formatTime(date: Date): string {
  return formatClubTime(date);
}

/**
 * Get available tokens for documentation
 */
export function getAvailableTokens(): {
  category: string;
  tokens: { token: string; description: string }[];
}[] {
  return [
    {
      category: "Member",
      tokens: [
        { token: "{{member.firstName}}", description: "Member first name" },
        { token: "{{member.lastName}}", description: "Member last name" },
        { token: "{{member.fullName}}", description: "Member full name" },
        { token: "{{member.email}}", description: "Member email address" },
        { token: "{{member.phone}}", description: "Member phone number" },
      ],
    },
    {
      category: "Event",
      tokens: [
        { token: "{{event.title}}", description: "Event title" },
        { token: "{{event.description}}", description: "Event description" },
        { token: "{{event.location}}", description: "Event location" },
        { token: "{{event.category}}", description: "Event category" },
        { token: "{{event.startDate}}", description: "Event start date" },
        { token: "{{event.startTime}}", description: "Event start time" },
        { token: "{{event.endDate}}", description: "Event end date" },
        { token: "{{event.endTime}}", description: "Event end time" },
      ],
    },
    {
      category: "Club",
      tokens: [
        { token: "{{club.name}}", description: "Club name" },
        { token: "{{club.website}}", description: "Club website URL" },
        { token: "{{club.email}}", description: "Club contact email" },
      ],
    },
    {
      category: "System",
      tokens: [
        { token: "{{currentYear}}", description: "Current year" },
        { token: "{{currentDate}}", description: "Current date" },
      ],
    },
  ];
}

// Email provider interface
export interface EmailProvider {
  send(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
    replyTo?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// Stub email provider for development/testing
export class StubEmailProvider implements EmailProvider {
  private logs: Array<{
    id: string;
    to: string;
    subject: string;
    sentAt: Date;
  }> = [];

  async send(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
    replyTo?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const messageId = `stub-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Log the email
    this.logs.push({
      id: messageId,
      to: params.to,
      subject: params.subject,
      sentAt: new Date(),
    });

    // Log to console in development
    if (process.env.NODE_ENV !== "production") {
      console.log("[StubEmailProvider] Email sent:", {
        messageId,
        to: params.to,
        subject: params.subject,
      });
    }

    return { success: true, messageId };
  }

  getRecentLogs(limit: number = 20): typeof this.logs {
    return this.logs.slice(-limit);
  }

  clearLogs(): void {
    this.logs = [];
  }
}

// Global stub provider instance
const stubProvider = new StubEmailProvider();

/**
 * Get the email provider based on environment
 */
export function getEmailProvider(): EmailProvider {
  // For now, always return the stub provider
  // In the future, this can be extended to return real providers
  // based on environment variables
  return stubProvider;
}

/**
 * Get recent email logs from stub provider
 */
export function getStubEmailLogs(limit: number = 20) {
  return stubProvider.getRecentLogs(limit);
}

/**
 * Render email template with context
 */
export async function renderEmailTemplate(
  templateId: string,
  context: TokenContext
): Promise<{ subject: string; html: string; text: string } | null> {
  const template = await prisma.messageTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) return null;

  return {
    subject: replaceTokens(template.subject, context),
    html: replaceTokens(template.bodyHtml, context),
    text: replaceTokens(template.bodyText || "", context),
  };
}

/**
 * Send email using template
 */
export async function sendTemplatedEmail(params: {
  templateId: string;
  to: string;
  context: TokenContext;
  from?: string;
  replyTo?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const rendered = await renderEmailTemplate(params.templateId, params.context);

  if (!rendered) {
    return { success: false, error: "Template not found" };
  }

  const provider = getEmailProvider();
  return provider.send({
    to: params.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    from: params.from,
    replyTo: params.replyTo,
  });
}
