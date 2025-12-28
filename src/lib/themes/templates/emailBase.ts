/**
 * Email Base Template - Foundation for themed emails
 * Charter: P6 (human-first UI), P4 (no hidden rules)
 */
import type { ClubTheme, VoiceTone } from "../types";

export interface EmailBaseOptions {
  subject: string;
  preheader?: string;
  content: string;
  showUnsubscribe?: boolean;
  unsubscribeUrl?: string;
  webVersionUrl?: string;
}

export interface EmailStyles {
  paragraph: string;
  heading1: string;
  heading2: string;
  heading3: string;
  link: string;
  button: string;
  buttonSecondary: string;
  card: string;
  divider: string;
  mutedText: string;
}

export function getEmailStyles(theme: ClubTheme): EmailStyles {
  const { colors, typography } = theme;
  const fontFamily = typography.fontBody || "system-ui, -apple-system, sans-serif";
  const headingFont = typography.fontHeading || fontFamily;
  const textColor = colors.textPrimary;
  return {
    paragraph: `font-family: ${fontFamily}; font-size: 16px; line-height: 1.6; color: ${textColor}; margin: 0 0 16px 0;`,
    heading1: `font-family: ${headingFont}; font-size: 28px; font-weight: 700; color: ${colors.primary}; margin: 0 0 24px 0; line-height: 1.2;`,
    heading2: `font-family: ${headingFont}; font-size: 22px; font-weight: 600; color: ${textColor}; margin: 32px 0 16px 0; border-bottom: 2px solid ${colors.border}; padding-bottom: 8px;`,
    heading3: `font-family: ${headingFont}; font-size: 18px; font-weight: 600; color: ${textColor}; margin: 24px 0 12px 0;`,
    link: `color: ${colors.primary}; text-decoration: underline;`,
    button: `display: inline-block; background-color: ${colors.primary}; color: #ffffff; font-family: ${fontFamily}; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 6px; text-align: center;`,
    buttonSecondary: `display: inline-block; background-color: transparent; color: ${colors.primary}; font-family: ${fontFamily}; font-size: 16px; font-weight: 600; text-decoration: none; padding: 12px 24px; border: 2px solid ${colors.primary}; border-radius: 6px; text-align: center;`,
    card: `background-color: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 8px; padding: 20px; margin: 24px 0;`,
    divider: `border: none; border-top: 1px solid ${colors.border}; margin: 32px 0;`,
    mutedText: `font-family: ${fontFamily}; font-size: 14px; color: ${colors.textMuted}; line-height: 1.5;`,
  };
}

export function getGreeting(theme: ClubTheme, recipientName?: string): string {
  const tone = theme.voice.tone;
  const name = recipientName || "";
  const greetings: Record<VoiceTone, string> = {
    formal: name ? `Dear ${name},` : "Dear Member,",
    professional: name ? `Hello ${name},` : "Hello,",
    friendly: name ? `Hi ${name}!` : "Hi there!",
    casual: name ? `Hey ${name}!` : "Hey!",
  };
  return greetings[tone];
}

export function getSignOff(theme: ClubTheme): string {
  const tone = theme.voice.tone;
  const clubName = theme.name;
  const signOffs: Record<VoiceTone, string> = {
    formal: `Sincerely,<br/>The ${clubName} Team`,
    professional: `Best regards,<br/>The ${clubName} Team`,
    friendly: `Cheers,<br/>Your friends at ${clubName}`,
    casual: `See you soon!<br/>The ${clubName} crew`,
  };
  return signOffs[tone];
}

export function generateEmailBase(
  theme: ClubTheme,
  options: EmailBaseOptions
): string {
  const {
    subject,
    preheader,
    content,
    showUnsubscribe = true,
    unsubscribeUrl,
    webVersionUrl,
  } = options;
  const { colors, logo } = theme;
  const clubName = theme.name;
  const fontFamily = theme.typography.fontBody || "system-ui, -apple-system, sans-serif";

  const logoHtml = logo
    ? `<img src="${logo.url}" alt="${logo.alt}" width="${logo.width}" height="${logo.height}" style="display:block;margin:0 auto;max-width:100%;height:auto;" />`
    : `<h2 style="margin:0;font-size:24px;color:${colors.primary};">${clubName}</h2>`;

  const preheaderHtml = preheader
    ? `<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>`
    : "";

  const webVersionHtml = webVersionUrl
    ? `<a href="${webVersionUrl}" style="color:${colors.textMuted};font-size:12px;text-decoration:underline;">View in browser</a>`
    : "";

  const unsubscribeHtml =
    showUnsubscribe && unsubscribeUrl
      ? `<p style="margin:16px 0 0 0;"><a href="${unsubscribeUrl}" style="color:${colors.textMuted};font-size:12px;text-decoration:underline;">Unsubscribe</a></p>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body, table, td { margin: 0; padding: 0; }
    img { border: 0; display: block; }
    table { border-collapse: collapse; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${colors.background};font-family:${fontFamily};">
  ${preheaderHtml}
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${colors.background};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        ${webVersionHtml ? `<p style="margin:0 0 16px 0;text-align:center;">${webVersionHtml}</p>` : ""}
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="background-color:${colors.surface};border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding:32px;text-align:center;background-color:${colors.surface};border-bottom:1px solid ${colors.border};">
              ${logoHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:${colors.background};text-align:center;border-top:1px solid ${colors.border};">
              <p style="margin:0;font-size:12px;color:${colors.textMuted};line-height:1.5;">
                &copy; ${new Date().getFullYear()} ${clubName}. All rights reserved.
              </p>
              ${unsubscribeHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
