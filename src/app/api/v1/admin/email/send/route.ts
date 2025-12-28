/**
 * Email Send API
 *
 * POST /api/v1/admin/email/send
 *   Send a single email
 *
 * Authorization: Requires admin capability
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { getEmailService } from "@/services/email";
import type { EmailRecipient } from "@/services/email";

interface SendEmailBody {
  to: string | EmailRecipient;
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
    const body: SendEmailBody = await req.json();

    if (!body.to || !body.subject) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject" },
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

    // If template is specified, use templated email
    if (body.template) {
      const recipient: EmailRecipient =
        typeof body.to === "string" ? { email: body.to } : body.to;

      const result = await emailService.sendTemplatedEmail(
        body.template,
        recipient,
        body.templateData || {}
      );

      return NextResponse.json({
        success: result.success,
        messageId: result.messageId,
        status: result.status,
        error: result.error,
      });
    }

    // Send direct email
    const recipient: EmailRecipient =
      typeof body.to === "string" ? { email: body.to } : body.to;

    const result = await emailService.sendEmail({
      to: recipient,
      subject: body.subject,
      text: body.body,
      html: body.html,
    });

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error,
    });
  } catch (error) {
    console.error("Email send API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
