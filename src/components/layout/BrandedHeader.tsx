// Copyright (c) Santa Barbara Newcomers Club
// Branded header component with logo and navigation

"use client";

import React from "react";
import Link from "next/link";

export interface NavLink {
  label: string;
  href: string;
  active?: boolean;
}

export interface BrandedHeaderProps {
  logoUrl?: string;
  logoAlt?: string;
  clubName?: string;
  navLinks?: NavLink[];
  variant?: "public" | "member" | "admin";
  userName?: string;
  userInitials?: string;
  onLogout?: () => void;
}

export function BrandedHeader({
  logoUrl,
  logoAlt = "Club Logo",
  clubName = "Murmurant",
  navLinks = [],
  variant = "public",
  userName,
  userInitials,
  onLogout,
}: BrandedHeaderProps) {
  const isAuthenticated = Boolean(userName);

  return (
    <header
      data-test-id="branded-header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "var(--brand-surface, #ffffff)",
        borderBottom: "1px solid var(--brand-border, #e5e7eb)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 24px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo and Club Name */}
        <Link
          href={variant === "admin" ? "/admin" : variant === "member" ? "/dashboard" : "/"}
          style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}
        >
          {logoUrl ? (
            <img src={logoUrl} alt={logoAlt} style={{ height: "40px", width: "auto" }} />
          ) : (
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                backgroundColor: "var(--brand-primary, #2563eb)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 700,
                fontSize: "18px",
              }}
            >
              {clubName.charAt(0)}
            </div>
          )}
          <span style={{ fontSize: "18px", fontWeight: 600, color: "var(--brand-text-primary, #1f2937)" }}>
            {clubName}
          </span>
          {variant === "admin" && (
            <span
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--brand-primary, #2563eb)",
                backgroundColor: "var(--brand-primary-light, #eff6ff)",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              Admin
            </span>
          )}
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 500,
                color: link.active ? "var(--brand-primary, #2563eb)" : "var(--brand-text-secondary, #6b7280)",
                textDecoration: "none",
                borderRadius: "6px",
                backgroundColor: link.active ? "var(--brand-primary-light, #eff6ff)" : "transparent",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User Menu */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {isAuthenticated ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "var(--brand-accent, #8b5cf6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  {userInitials || userName?.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--brand-text-primary, #1f2937)" }}>
                  {userName}
                </span>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--brand-text-secondary, #6b7280)",
                    backgroundColor: "transparent",
                    border: "1px solid var(--brand-border, #e5e7eb)",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Log out
                </button>
              )}
            </>
          ) : (
            <>
              <Link
                href="/login"
                style={{ padding: "8px 16px", fontSize: "14px", fontWeight: 500, color: "var(--brand-text-secondary, #6b7280)", textDecoration: "none" }}
              >
                Log in
              </Link>
              <Link
                href="/join"
                style={{
                  padding: "8px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "white",
                  backgroundColor: "var(--brand-primary, #2563eb)",
                  borderRadius: "6px",
                  textDecoration: "none",
                }}
              >
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default BrandedHeader;
