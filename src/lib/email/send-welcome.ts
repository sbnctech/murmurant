/**
 * Welcome Email Helper
 *
 * Sends welcome email to new members upon registration.
 */

import { getEmailService } from "@/services/email";

export interface WelcomeEmailParams {
  email: string;
  firstName: string;
  lastName: string;
  membershipLevel?: string;
}

export interface WelcomeEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send welcome email to a new member
 */
export async function sendWelcomeEmail(
  params: WelcomeEmailParams
): Promise<WelcomeEmailResult> {
  const { email, firstName, lastName, membershipLevel } = params;

  const emailService = getEmailService();

  const subject = `Welcome to Santa Barbara Newcomers Club, ${firstName}!`;

  const text = `
Hi ${firstName} ${lastName},

Welcome to the Santa Barbara Newcomers Club! We're thrilled to have you as a member${membershipLevel ? ` at the ${membershipLevel} level` : ""}.

Here's what you can do next:
- Browse upcoming events on our calendar
- Register for activities that interest you
- Connect with other members in our community

If you have any questions, don't hesitate to reach out.

Best regards,
The SBNC Team
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to SBNC</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #1e40af;">Welcome, ${firstName}!</h1>

    <p>We're thrilled to have you as a member of the Santa Barbara Newcomers Club${membershipLevel ? ` at the <strong>${membershipLevel}</strong> level` : ""}.</p>

    <h2 style="color: #1e40af;">What's Next?</h2>
    <ul>
      <li>Browse upcoming events on our calendar</li>
      <li>Register for activities that interest you</li>
      <li>Connect with other members in our community</li>
    </ul>

    <p>If you have any questions, don't hesitate to reach out.</p>

    <p>Best regards,<br>The SBNC Team</p>
  </div>
</body>
</html>
`.trim();

  try {
    const result = await emailService.sendEmail({
      to: { email, name: `${firstName} ${lastName}` },
      subject,
      text,
      html,
      tags: { type: "welcome", membershipLevel: membershipLevel || "standard" },
    });

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
