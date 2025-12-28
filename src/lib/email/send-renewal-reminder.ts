/**
 * Renewal Reminder Email Helper
 *
 * Sends membership renewal reminder before expiration.
 */

import { getEmailService } from "@/services/email";
import { formatClubDateLong } from "@/lib/timezone";

export interface RenewalReminderEmailParams {
  email: string;
  firstName: string;
  lastName: string;
  expirationDate: Date;
  renewalLink: string;
  daysUntilExpiration?: number;
}

export interface RenewalReminderEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send renewal reminder email
 */
export async function sendRenewalReminderEmail(
  params: RenewalReminderEmailParams
): Promise<RenewalReminderEmailResult> {
  const {
    email,
    firstName,
    lastName,
    expirationDate,
    renewalLink,
    daysUntilExpiration,
  } = params;

  const emailService = getEmailService();

  const formattedDate = formatClubDateLong(expirationDate);

  const urgency =
    daysUntilExpiration !== undefined && daysUntilExpiration <= 7
      ? "Your membership expires soon!"
      : "Time to renew your membership";

  const subject = `${urgency} - SBNC Membership Renewal`;

  const text = `
Hi ${firstName},

Your Santa Barbara Newcomers Club membership expires on ${formattedDate}.

Renew now to continue enjoying:
- Access to all club events and activities
- Member-only newsletters and updates
- Connection with our vibrant community

Click here to renew: ${renewalLink}

Thank you for being a valued member of SBNC!

Best regards,
The SBNC Membership Team
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Renew Your SBNC Membership</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #1e40af;">${urgency}</h1>

    <p>Hi ${firstName} ${lastName},</p>

    <p>Your Santa Barbara Newcomers Club membership expires on <strong>${formattedDate}</strong>.</p>

    <p>Renew now to continue enjoying:</p>
    <ul>
      <li>Access to all club events and activities</li>
      <li>Member-only newsletters and updates</li>
      <li>Connection with our vibrant community</li>
    </ul>

    <p style="margin: 30px 0;">
      <a href="${renewalLink}"
         style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
        Renew My Membership
      </a>
    </p>

    <p>Thank you for being a valued member of SBNC!</p>

    <p>Best regards,<br>The SBNC Membership Team</p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

    <p style="color: #999; font-size: 12px;">
      If you have any questions about your membership, please contact our membership team.
    </p>
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
      tags: {
        type: "renewal-reminder",
        daysUntilExpiration: String(daysUntilExpiration ?? "unknown"),
      },
    });

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  } catch (error) {
    console.error("Failed to send renewal reminder email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
