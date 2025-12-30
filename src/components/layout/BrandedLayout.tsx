// Copyright © 2025 Murmurant, Inc.
// Branded layout wrapper that applies brand styling

"use client";

import React, { useEffect } from "react";
import { BrandedHeader, type NavLink } from "./BrandedHeader";
import { BrandedFooter, type SocialLink, type FooterLink } from "./BrandedFooter";

export interface BrandConfig {
  clubName: string;
  tagline?: string;
  logoUrl?: string;
  bugUrl?: string;
  colors?: {
    primary?: string;
    primaryLight?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    surface?: string;
    border?: string;
    textPrimary?: string;
    textSecondary?: string;
    textMuted?: string;
  };
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  socialLinks?: SocialLink[];
}

export interface BrandedLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  variant?: "public" | "member" | "admin";
  brand?: BrandConfig;
  navLinks?: NavLink[];
  footerLinks?: FooterLink[];
  userName?: string;
  userInitials?: string;
  onLogout?: () => void;
}

const defaultBrand: BrandConfig = {
  clubName: "Murmurant",
  tagline: "Your community, connected.",
  colors: {
    primary: "#2563eb",
    primaryLight: "#eff6ff",
    secondary: "#64748b",
    accent: "#8b5cf6",
    background: "#ffffff",
    surface: "#f9fafb",
    border: "#e5e7eb",
    textPrimary: "#1f2937",
    textSecondary: "#6b7280",
    textMuted: "#9ca3af",
  },
};

const defaultNavLinks: Record<string, NavLink[]> = {
  public: [
    { label: "Events", href: "/events" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  member: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Events", href: "/events" },
    { label: "Groups", href: "/groups" },
    { label: "Directory", href: "/directory" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin" },
    { label: "Members", href: "/admin/members" },
    { label: "Events", href: "/admin/events" },
    { label: "Settings", href: "/admin/settings" },
  ],
};

const defaultFooterLinks: FooterLink[] = [
  { label: "About Us", href: "/about" },
  { label: "Events", href: "/events" },
  { label: "Membership", href: "/membership" },
  { label: "Contact", href: "/contact" },
];

export function BrandedLayout({
  children,
  showHeader = true,
  showFooter = true,
  variant = "public",
  brand = defaultBrand,
  navLinks,
  footerLinks = defaultFooterLinks,
  userName,
  userInitials,
  onLogout,
}: BrandedLayoutProps) {
  const mergedBrand = { ...defaultBrand, ...brand };
  const colors = { ...defaultBrand.colors, ...brand?.colors };

  // Apply brand CSS variables
  useEffect(() => {
    const root = document.documentElement;
    if (colors.primary) root.style.setProperty("--brand-primary", colors.primary);
    if (colors.primaryLight) root.style.setProperty("--brand-primary-light", colors.primaryLight);
    if (colors.secondary) root.style.setProperty("--brand-secondary", colors.secondary);
    if (colors.accent) root.style.setProperty("--brand-accent", colors.accent);
    if (colors.background) root.style.setProperty("--brand-background", colors.background);
    if (colors.surface) root.style.setProperty("--brand-surface", colors.surface);
    if (colors.border) root.style.setProperty("--brand-border", colors.border);
    if (colors.textPrimary) root.style.setProperty("--brand-text-primary", colors.textPrimary);
    if (colors.textSecondary) root.style.setProperty("--brand-text-secondary", colors.textSecondary);
    if (colors.textMuted) root.style.setProperty("--brand-text-muted", colors.textMuted);

    return () => {
      root.style.removeProperty("--brand-primary");
      root.style.removeProperty("--brand-primary-light");
      root.style.removeProperty("--brand-secondary");
      root.style.removeProperty("--brand-accent");
      root.style.removeProperty("--brand-background");
      root.style.removeProperty("--brand-surface");
      root.style.removeProperty("--brand-border");
      root.style.removeProperty("--brand-text-primary");
      root.style.removeProperty("--brand-text-secondary");
      root.style.removeProperty("--brand-text-muted");
    };
  }, [colors]);

  const resolvedNavLinks = navLinks || defaultNavLinks[variant] || [];

  return (
    <div
      data-test-id="branded-layout"
      data-variant={variant}
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--brand-background, #ffffff)",
      }}
    >
      {showHeader && (
        <BrandedHeader
          logoUrl={mergedBrand.logoUrl}
          logoAlt={`${mergedBrand.clubName} Logo`}
          clubName={mergedBrand.clubName}
          navLinks={resolvedNavLinks}
          variant={variant}
          userName={userName}
          userInitials={userInitials}
          onLogout={onLogout}
        />
      )}

      <main style={{ flex: 1, width: "100%" }}>{children}</main>

      {showFooter && (
        <BrandedFooter
          clubName={mergedBrand.clubName}
          tagline={mergedBrand.tagline}
          socialLinks={mergedBrand.socialLinks}
          footerLinks={footerLinks}
          contactEmail={mergedBrand.contactEmail}
          contactPhone={mergedBrand.contactPhone}
          address={mergedBrand.address}
        />
      )}
    </div>
  );
}

export default BrandedLayout;
