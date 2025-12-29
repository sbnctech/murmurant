// Copyright (c) Santa Barbara Newcomers Club
// Branded footer component with social links and copyright

"use client";

import React from "react";
import Link from "next/link";

export interface SocialLink {
  platform: "facebook" | "instagram" | "twitter" | "linkedin" | "youtube";
  url: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface BrandedFooterProps {
  clubName?: string;
  tagline?: string;
  socialLinks?: SocialLink[];
  footerLinks?: FooterLink[];
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  copyrightYear?: number;
}

const socialIcons: Record<string, string> = {
  facebook: "f",
  instagram: "in",
  twitter: "X",
  linkedin: "Li",
  youtube: "Yt",
};

export function BrandedFooter({
  clubName = "Murmurant",
  tagline,
  socialLinks = [],
  footerLinks = [],
  contactEmail,
  contactPhone,
  address,
  copyrightYear = new Date().getFullYear(),
}: BrandedFooterProps) {
  return (
    <footer
      data-test-id="branded-footer"
      style={{
        backgroundColor: "var(--brand-surface, #f9fafb)",
        borderTop: "1px solid var(--brand-border, #e5e7eb)",
        padding: "48px 24px 24px",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {/* Main Footer Content */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "32px",
            marginBottom: "32px",
          }}
        >
          {/* Brand Info */}
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--brand-text-primary, #1f2937)", marginBottom: "12px" }}>
              {clubName}
            </h3>
            {tagline && (
              <p style={{ fontSize: "14px", color: "var(--brand-text-secondary, #6b7280)", lineHeight: "1.5", marginBottom: "16px" }}>
                {tagline}
              </p>
            )}
            {socialLinks.length > 0 && (
              <div style={{ display: "flex", gap: "12px" }}>
                {socialLinks.map((social) => (
                  <a
                    key={social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.platform}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: "var(--brand-primary, #2563eb)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    {socialIcons[social.platform]}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          {footerLinks.length > 0 && (
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--brand-text-primary, #1f2937)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Quick Links
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {footerLinks.map((link) => (
                  <li key={link.href} style={{ marginBottom: "8px" }}>
                    <Link href={link.href} style={{ fontSize: "14px", color: "var(--brand-text-secondary, #6b7280)", textDecoration: "none" }}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact Info */}
          {(contactEmail || contactPhone || address) && (
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--brand-text-primary, #1f2937)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Contact Us
              </h4>
              <div style={{ fontSize: "14px", color: "var(--brand-text-secondary, #6b7280)", lineHeight: "1.8" }}>
                {contactEmail && (
                  <div>
                    <a href={`mailto:${contactEmail}`} style={{ color: "var(--brand-primary, #2563eb)", textDecoration: "none" }}>
                      {contactEmail}
                    </a>
                  </div>
                )}
                {contactPhone && <div>{contactPhone}</div>}
                {address && <div style={{ whiteSpace: "pre-line" }}>{address}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Copyright Bar */}
        <div
          style={{
            paddingTop: "24px",
            borderTop: "1px solid var(--brand-border, #e5e7eb)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <p style={{ fontSize: "13px", color: "var(--brand-text-muted, #9ca3af)", margin: 0 }}>
            &copy; {copyrightYear} {clubName}. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "24px" }}>
            <Link href="/privacy" style={{ fontSize: "13px", color: "var(--brand-text-muted, #9ca3af)", textDecoration: "none" }}>
              Privacy Policy
            </Link>
            <Link href="/terms" style={{ fontSize: "13px", color: "var(--brand-text-muted, #9ca3af)", textDecoration: "none" }}>
              Terms of Service
            </Link>
          </div>
        </div>

        {/* Powered By */}
        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "var(--brand-text-muted, #9ca3af)", margin: 0 }}>
            Powered by{" "}
            <a href="https://murmurant.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand-primary, #2563eb)", textDecoration: "none", fontWeight: 500 }}>
              Murmurant
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default BrandedFooter;
