/**
 * Password Reset Email Helper
 *
 * Sends password reset email with secure link.
 */

import { getEmailService } from "@/services/email";

export interface PasswordResetEmailParams {
  email: string;
  firstName: string;
  resetLink: string;
  expiresInHours?: number;
}

export interface PasswordResetEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  params: PasswordResetEmailParams
): Promise<PasswordResetEmailResult> {
  const { email, firstName, resetLink, expiresInHours = 24 } = params;

  const emailService = getEmailService();

  const subject = "Reset Your SBNC Password";

  const text = `
Hi ${firstName},

We received a request to reset your password for your Santa Barbara Newcomers Club account.

Click the link below to reset your password:
${resetLink}

This link will expire in ${expiresInHours} hour${expiresInHours !== 1 ? "s" : ""}.

If you didn't request this, you can safely ignore this email. Your password will remain unchanged.

Best regards,
The SBNC Team
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #1e40af;">Reset Your Password</h1>

    <p>Hi ${firstName},</p>

    <p>We received a request to reset your password for your Santa Barbara Newcomers Club account.</p>

    <p style="margin: 30px 0;">
      <a href="${resetLink}"
         style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
        Reset Password
      </a>
    </p>

    <p style="color: #666; font-size: 14px;">
      This link will expire in ${expiresInHours} hour${expiresInHours !== 1 ? "s" : ""}.
    </p>

    <p style="color: #666; font-size: 14px;">
      If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
    </p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

    <p style="color: #999; font-size: 12px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${resetLink}" style="color: #1e40af;">${resetLink}</a>
    </p>
  </div>
</body>
</html>
`.trim();

  try {
    const result = await emailService.sendEmail({
      to: { email, name: firstName },
      subject,
      text,
      html,
      tags: { type: "password-reset" },
    });

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
