/**
 * Email Templates API
 *
 * GET /api/v1/admin/email/templates
 *   List available email templates
 *
 * POST /api/v1/admin/email/templates
 *   Preview a template with data
 *
 * Authorization: Requires admin capability
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";

/**
 * Available email templates
 */
const EMAIL_TEMPLATES = [
  {
    id: "welcome",
    name: "Welcome Email",
    description: "Sent to new members upon registration",
    variables: ["firstName", "lastName", "membershipLevel"],
  },
  {
    id: "password-reset",
    name: "Password Reset",
    description: "Sent when user requests password reset",
    variables: ["firstName", "resetLink", "expiresIn"],
  },
  {
    id: "renewal-reminder",
    name: "Renewal Reminder",
    description: "Sent before membership expires",
    variables: ["firstName", "lastName", "expirationDate", "renewalLink"],
  },
  {
    id: "event-confirmation",
    name: "Event Registration Confirmation",
    description: "Sent when member registers for an event",
    variables: ["firstName", "eventName", "eventDate", "eventLocation"],
  },
  {
    id: "event-reminder",
    name: "Event Reminder",
    description: "Sent before an upcoming event",
    variables: ["firstName", "eventName", "eventDate", "eventLocation"],
  },
  {
    id: "newsletter",
    name: "Newsletter",
    description: "General newsletter template",
    variables: ["firstName", "content", "unsubscribeLink"],
  },
];

export async function GET(req: NextRequest) {
  const auth = await requireCapability(req, "comms:manage");
  if (!auth.ok) return auth.response;

  return NextResponse.json({
    templates: EMAIL_TEMPLATES,
  });
}

interface PreviewBody {
  templateId: string;
  data: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  const auth = await requireCapability(req, "comms:manage");
  if (!auth.ok) return auth.response;

  try {
    const body: PreviewBody = await req.json();

    if (!body.templateId) {
      return NextResponse.json(
        { error: "Missing required field: templateId" },
        { status: 400 }
      );
    }

    const template = EMAIL_TEMPLATES.find((t) => t.id === body.templateId);
    if (!template) {
      return NextResponse.json(
        { error: `Template not found: ${body.templateId}` },
        { status: 404 }
      );
    }

    // Generate preview based on template
    const preview = generateTemplatePreview(template.id, body.data || {});

    return NextResponse.json({
      templateId: template.id,
      templateName: template.name,
      preview,
    });
  } catch (error) {
    console.error("Template preview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateTemplatePreview(
  templateId: string,
  data: Record<string, unknown>
): { subject: string; text: string; html: string } {
  const firstName = (data.firstName as string) || "{{firstName}}";
  const lastName = (data.lastName as string) || "{{lastName}}";

  switch (templateId) {
    case "welcome":
      return {
        subject: `Welcome to Santa Barbara Newcomers Club, ${firstName}!`,
        text: `Hi ${firstName} ${lastName},\n\nWelcome to the Santa Barbara Newcomers Club! We're thrilled to have you as a member.\n\nBest regards,\nSBNC Team`,
        html: `<h1>Welcome, ${firstName}!</h1><p>We're thrilled to have you as a member of the Santa Barbara Newcomers Club.</p>`,
      };

    case "password-reset":
      return {
        subject: "Reset Your Password",
        text: `Hi ${firstName},\n\nClick the link below to reset your password:\n${data.resetLink || "{{resetLink}}"}\n\nThis link expires in ${data.expiresIn || "24 hours"}.`,
        html: `<h1>Reset Your Password</h1><p>Hi ${firstName},</p><p><a href="${data.resetLink || "{{resetLink}}"}">Click here to reset your password</a></p>`,
      };

    case "renewal-reminder":
      return {
        subject: `Your SBNC Membership Expires ${data.expirationDate || "Soon"}`,
        text: `Hi ${firstName},\n\nYour membership expires on ${data.expirationDate || "{{expirationDate}}"}. Renew now to keep your benefits!`,
        html: `<h1>Renew Your Membership</h1><p>Hi ${firstName},</p><p>Your membership expires on ${data.expirationDate || "{{expirationDate}}"}.</p>`,
      };

    default:
      return {
        subject: `Template: ${templateId}`,
        text: `Preview for template ${templateId} with data: ${JSON.stringify(data)}`,
        html: `<p>Preview for template <strong>${templateId}</strong></p><pre>${JSON.stringify(data, null, 2)}</pre>`,
      };
  }
}
