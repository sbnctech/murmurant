// Copyright © 2025 Murmurant, Inc.
// Email role identity - explains why recipients receive specific emails

/**
 * Email context types that explain why someone is receiving an email.
 * Each context maps to a specific role or relationship.
 */
export type EmailContext =
  | "OFFICER_ACTION"
  | "EVENT_REGISTRANT"
  | "EVENT_CHAIR"
  | "MEMBER_NEWSLETTER"
  | "CONTACT_OUTREACH";

/**
 * Role identity configuration for each email context
 */
export type RoleIdentityConfig = {
  context: EmailContext;
  icon: string;
  explanation: string;
  roleTitle?: string;
  preferencesUrl?: string;
};

/**
 * Default explanations for each email context
 */
const CONTEXT_EXPLANATIONS: Record<EmailContext, { icon: string; template: string }> = {
  OFFICER_ACTION: {
    icon: "\u{1F3DB}\u{FE0F}", // classical building emoji
    template: "You're receiving this as {{roleTitle}}",
  },
  EVENT_REGISTRANT: {
    icon: "\u{1F4C5}", // calendar emoji
    template: "You're receiving this as a registrant for this event",
  },
  EVENT_CHAIR: {
    icon: "\u{1F4C5}", // calendar emoji
    template: "You're receiving this as event chair",
  },
  MEMBER_NEWSLETTER: {
    icon: "\u{1F44B}", // waving hand emoji
    template: "You're receiving this as a member",
  },
  CONTACT_OUTREACH: {
    icon: "\u{1F4E7}", // email emoji
    template: "You're receiving this as a contact",
  },
};

/**
 * Generate role identity explanation for an email
 */
export function getRoleExplanation(config: {
  context: EmailContext;
  roleTitle?: string;
}): { icon: string; explanation: string } {
  const contextConfig = CONTEXT_EXPLANATIONS[config.context];
  let explanation = contextConfig.template;

  if (config.roleTitle && explanation.includes("{{roleTitle}}")) {
    explanation = explanation.replace("{{roleTitle}}", config.roleTitle);
  }

  return {
    icon: contextConfig.icon,
    explanation,
  };
}

/**
 * Get the full role identity configuration for an email
 */
export function getRoleIdentity(config: {
  context: EmailContext;
  roleTitle?: string;
  preferencesUrl?: string;
}): RoleIdentityConfig {
  const { icon, explanation } = getRoleExplanation({
    context: config.context,
    roleTitle: config.roleTitle,
  });

  return {
    context: config.context,
    icon,
    explanation,
    roleTitle: config.roleTitle,
    preferencesUrl: config.preferencesUrl,
  };
}

/**
 * Generate HTML for the role identity banner
 */
export function generateRoleBannerHtml(config: RoleIdentityConfig): string {
  const { icon, explanation, preferencesUrl } = config;

  const preferencesLink = preferencesUrl
    ? `<a href="${preferencesUrl}" style="color: #4A5568; text-decoration: underline; margin-left: 8px;">Manage preferences</a>`
    : "";

  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
  <tr>
    <td style="background-color: #F7FAFC; border-radius: 8px; padding: 12px 16px; border-left: 4px solid #4299E1;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="font-size: 20px; line-height: 1; vertical-align: middle; padding-right: 12px;">${icon}</td>
          <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #4A5568; line-height: 1.4;">
            ${explanation}${preferencesLink}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

/**
 * Generate plain text version of the role identity banner
 */
export function generateRoleBannerText(config: RoleIdentityConfig): string {
  const { icon, explanation, preferencesUrl } = config;

  const preferencesLine = preferencesUrl
    ? `\nManage preferences: ${preferencesUrl}`
    : "";

  return `${icon} ${explanation}${preferencesLine}\n${"─".repeat(50)}\n`;
}
