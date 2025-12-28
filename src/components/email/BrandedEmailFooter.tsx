/**
 * Branded Email Footer Component
 *
 * Renders an email footer with brand info, social links, and unsubscribe.
 * Uses inline styles for email client compatibility.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import type { ClubBrand } from "@/lib/brands/types";

export interface BrandedEmailFooterProps {
  brand: ClubBrand;
  unsubscribeUrl?: string;
}

export function BrandedEmailFooter({ brand, unsubscribeUrl }: BrandedEmailFooterProps) {
  const { communication, identity, name } = brand;
  const socialLinks = communication.socialLinks;

  return (
    <table
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      role="presentation"
      style={{
        backgroundColor: "#f8fafc",
        borderRadius: "0 0 8px 8px",
        borderTop: "1px solid #e2e8f0",
      }}
    >
      <tbody>
        {/* Social Links */}
        {socialLinks && Object.keys(socialLinks).length > 0 && (
          <tr>
            <td
              style={{
                padding: "16px 24px 8px",
                textAlign: "center",
              }}
            >
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  style={{
                    display: "inline-block",
                    margin: "0 8px",
                    color: identity.colors.primary,
                    textDecoration: "none",
                  }}
                >
                  Facebook
                </a>
              )}
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  style={{
                    display: "inline-block",
                    margin: "0 8px",
                    color: identity.colors.primary,
                    textDecoration: "none",
                  }}
                >
                  Instagram
                </a>
              )}
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  style={{
                    display: "inline-block",
                    margin: "0 8px",
                    color: identity.colors.primary,
                    textDecoration: "none",
                  }}
                >
                  Twitter
                </a>
              )}
              {socialLinks.linkedin && (
                <a
                  href={socialLinks.linkedin}
                  style={{
                    display: "inline-block",
                    margin: "0 8px",
                    color: identity.colors.primary,
                    textDecoration: "none",
                  }}
                >
                  LinkedIn
                </a>
              )}
            </td>
          </tr>
        )}

        {/* Footer Text */}
        <tr>
          <td
            style={{
              padding: "16px 24px",
              textAlign: "center",
              color: "#64748b",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            <p style={{ margin: "0 0 8px" }}>
              This email was sent by {name}
            </p>
            <p style={{ margin: "0 0 8px" }}>
              Questions? Contact us at{" "}
              <a
                href={`mailto:${communication.emailReplyTo}`}
                style={{ color: identity.colors.primary }}
              >
                {communication.emailReplyTo}
              </a>
            </p>
            {unsubscribeUrl && (
              <p style={{ margin: "0" }}>
                <a
                  href={unsubscribeUrl}
                  style={{
                    color: "#94a3b8",
                    textDecoration: "underline",
                    fontSize: "12px",
                  }}
                >
                  Unsubscribe from these emails
                </a>
              </p>
            )}
          </td>
        </tr>

        {/* Copyright */}
        <tr>
          <td
            style={{
              padding: "8px 24px 16px",
              textAlign: "center",
              color: "#94a3b8",
              fontSize: "12px",
            }}
          >
            &copy; {new Date().getFullYear()} {name}. All rights reserved.
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default BrandedEmailFooter;
