// Copyright (c) Santa Barbara Newcomers Club
// Email role identity banner component

import type { EmailContext } from "@/lib/email/roleIdentity";
import { getRoleIdentity } from "@/lib/email/roleIdentity";

export type RoleBannerProps = {
  context: EmailContext;
  roleTitle?: string;
  preferencesUrl?: string;
};

/**
 * Visual banner explaining why the recipient is receiving this email.
 *
 * Icons by context:
 * - OFFICER_ACTION: classical building (official business)
 * - EVENT_REGISTRANT: calendar (event-related)
 * - EVENT_CHAIR: calendar (event-related)
 * - MEMBER_NEWSLETTER: waving hand (member communication)
 * - CONTACT_OUTREACH: email (general outreach)
 */
export function RoleBanner({ context, roleTitle, preferencesUrl }: RoleBannerProps) {
  const identity = getRoleIdentity({ context, roleTitle, preferencesUrl });

  return (
    <table
      role="presentation"
      width="100%"
      cellSpacing={0}
      cellPadding={0}
      style={{ marginBottom: 20 }}
    >
      <tbody>
        <tr>
          <td
            style={{
              backgroundColor: "#F7FAFC",
              borderRadius: 8,
              padding: "12px 16px",
              borderLeft: "4px solid #4299E1",
            }}
          >
            <table role="presentation" cellSpacing={0} cellPadding={0}>
              <tbody>
                <tr>
                  <td
                    style={{
                      fontSize: 20,
                      lineHeight: 1,
                      verticalAlign: "middle",
                      paddingRight: 12,
                    }}
                  >
                    {identity.icon}
                  </td>
                  <td
                    style={{
                      fontFamily:
                        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                      fontSize: 14,
                      color: "#4A5568",
                      lineHeight: 1.4,
                    }}
                  >
                    {identity.explanation}
                    {preferencesUrl && (
                      <a
                        href={preferencesUrl}
                        style={{
                          color: "#4A5568",
                          textDecoration: "underline",
                          marginLeft: 8,
                        }}
                      >
                        Manage preferences
                      </a>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/**
 * Helper to get banner props for common email scenarios
 */
export const RoleBannerPresets = {
  officerAction: (roleTitle: string, preferencesUrl?: string): RoleBannerProps => ({
    context: "OFFICER_ACTION",
    roleTitle,
    preferencesUrl,
  }),

  eventRegistrant: (preferencesUrl?: string): RoleBannerProps => ({
    context: "EVENT_REGISTRANT",
    preferencesUrl,
  }),

  eventChair: (preferencesUrl?: string): RoleBannerProps => ({
    context: "EVENT_CHAIR",
    preferencesUrl,
  }),

  memberNewsletter: (preferencesUrl?: string): RoleBannerProps => ({
    context: "MEMBER_NEWSLETTER",
    preferencesUrl,
  }),

  contactOutreach: (preferencesUrl?: string): RoleBannerProps => ({
    context: "CONTACT_OUTREACH",
    preferencesUrl,
  }),
};
