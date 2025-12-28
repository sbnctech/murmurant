/**
 * Bulk Email Send API
 *
 * POST /api/v1/admin/email/bulk
 *   Send emails to multiple recipients
 *
 * Authorization: Requires admin capability
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { getEmailService } from "@/services/email";
import type { EmailRecipient, EmailMessage } from "@/services/email";

interface BulkEmailBody {
  recipients: Array<string | EmailRecipient>;
  subject: string;
  body?: string;
  html?: string;
  template?: string;
  templateData?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  const auth = await requireCapability(req, "comms:manage");
  if (!auth.ok) return auth.response;

  try {
    const body: BulkEmailBody = await req.json();

    if (!body.recipients || !Array.isArray(body.recipients) || body.recipients.length === 0) {
      return NextResponse.json(
        { error: "Missing required field: recipients (must be non-empty array)" },
        { status: 400 }
      );
    }

    if (!body.subject) {
      return NextResponse.json(
        { error: "Missing required field: subject" },
        { status: 400 }
      );
    }

    if (!body.body && !body.html && !body.template) {
      return NextResponse.json(
        { error: "Must provide body, html, or template" },
        { status: 400 }
      );
    }

    const emailService = getEmailService();

    // Normalize recipients
    const recipients: EmailRecipient[] = body.recipients.map((r) =>
      typeof r === "string" ? { email: r } : r
    );

    // Build messages for each recipient
    const messages: EmailMessage[] = recipients.map((recipient) => ({
      to: recipient,
      subject: body.subject,
      text: body.body,
      html: body.html,
      metadata: body.templateData,
    }));

    const result = await emailService.sendBulkEmail(messages);

    return NextResponse.json({
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      results: result.results.map((r) => ({
        success: r.success,
        messageId: r.messageId,
        status: r.status,
        error: r.error,
      })),
    });
  } catch (error) {
    console.error("Bulk email API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
