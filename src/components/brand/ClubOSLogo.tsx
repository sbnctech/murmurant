// Copyright (c) Santa Barbara Newcomers Club
// ClubOS Logo - Full horizontal logo with symbol and wordmark

"use client";

import React from "react";
import { ClubOSBug } from "./ClubOSBug";
import { ClubOSWordmark } from "./ClubOSWordmark";

type LogoSize = "sm" | "md" | "lg" | "xl";
type LogoVariant = "color" | "white" | "black";

interface ClubOSLogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  className?: string;
}

const sizeConfig: Record<LogoSize, { bug: 16 | 24 | 32 | 48 | 64; wordmark: "sm" | "md" | "lg" | "xl"; gap: string }> = {
  sm: { bug: 24, wordmark: "sm", gap: "6px" },
  md: { bug: 32, wordmark: "md", gap: "8px" },
  lg: { bug: 48, wordmark: "lg", gap: "10px" },
  xl: { bug: 64, wordmark: "xl", gap: "12px" },
};

/**
 * ClubOS Logo Component
 * 
 * Full horizontal logo combining:
 * - The "Gathering" symbol (ClubOSBug)
 * - The "ClubOS" wordmark
 * 
 * The Gathering represents diverse people converging and uniting
 */
export function ClubOSLogo({ 
  size = "md", 
  variant = "color",
  className = "" 
}: ClubOSLogoProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: config.gap,
      }}
    >
      <ClubOSBug size={config.bug} variant={variant} />
      <ClubOSWordmark size={config.wordmark} variant={variant} />
    </div>
  );
}

export default ClubOSLogo;
